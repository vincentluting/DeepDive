// ============================================================
// Provider Health Tracker — dynamic provider preference reordering
//
// Aggregates recent LLMUsageLog rows per provider into a success-rate
// snapshot and exposes `selectHealthiest()` for the router to demote
// providers that are partially outaging (20-70% failure band) before
// the circuit breaker trips.
//
// Two-stage filter in the router:
//   1. Circuit breaker  — hard gate for fully dead providers
//   2. Health routing   — soft selector: prefer healthier primary when
//                          multiple providers are circuit-closed
//
// Kill switch: LLM_HEALTH_ROUTING_DISABLED=1 → selectHealthiest()
// returns preference order unchanged, no DB query.
// ============================================================

import { sql } from "@/lib/db/connection";

type Provider = "anthropic" | "openai" | "gemini";

const ALL_PROVIDERS: readonly Provider[] = [
  "anthropic",
  "openai",
  "gemini",
] as const;

export interface HealthSnapshot {
  provider: Provider;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  degradedCount: number;
  successRate: number; // 0..1
  windowMinutes: number;
  observedAt: number; // ms since epoch
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
}

const WINDOW_MIN = Number(process.env.LLM_HEALTH_WINDOW_MIN ?? 10);
const MIN_CALLS = Number(process.env.LLM_HEALTH_MIN_CALLS ?? 3);
const UNHEALTHY_THRESHOLD = Number(
  process.env.LLM_HEALTH_UNHEALTHY_THRESHOLD ?? 0.8,
);
const DEGRADED_THRESHOLD = Number(
  process.env.LLM_HEALTH_DEGRADED_THRESHOLD ?? 0.95,
);
const CACHE_TTL_MS = 60_000;

/**
 * Health aggregation must be environment-scoped: LLMUsageLog stores rows
 * from dev ("test") and prod ("production") in the same table. Without
 * filtering, a handful of failed dev calls (MIN_CALLS=3) could tip a
 * provider to "unhealthy" and skew production routing. Mirror the
 * detectEnvironment() helper in lib/db/llm-usage.ts so the filter tracks
 * the same value logLLMUsage writes.
 */
function currentEnvironment(): string {
  return process.env.NODE_ENV === "development" ? "test" : "production";
}

/** Module-level singleton cache. One serverless instance = one cache. */
const cache = new Map<
  Provider,
  { snapshot: HealthSnapshot; expiresAt: number }
>();

/**
 * Serializes concurrent refresh calls. When two callers notice the
 * cache is stale at the same time, only one DB query fires.
 */
let inflightRefresh: Promise<void> | null = null;

function isKillSwitchOn(): boolean {
  const v = process.env.LLM_HEALTH_ROUTING_DISABLED;
  return v === "1" || v === "true";
}

function classifyStatus(
  totalCalls: number,
  successRate: number,
): HealthSnapshot["status"] {
  if (totalCalls < MIN_CALLS) return "unknown";
  if (successRate < UNHEALTHY_THRESHOLD) return "unhealthy";
  if (successRate < DEGRADED_THRESHOLD) return "degraded";
  return "healthy";
}

function makeUnknownSnapshot(provider: Provider, now: number): HealthSnapshot {
  return {
    provider,
    totalCalls: 0,
    successCount: 0,
    failureCount: 0,
    degradedCount: 0,
    successRate: 1,
    windowMinutes: WINDOW_MIN,
    observedAt: now,
    status: "unknown",
  };
}

interface RawRow {
  provider: string;
  total: number;
  ok: number;
  degraded: number;
}

async function refreshFromDB(): Promise<void> {
  const now = Date.now();
  let rows: RawRow[];
  try {
    const env = currentEnvironment();
    rows = (await sql<RawRow>`
      SELECT
        "provider",
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE "success" = true)::int AS "ok",
        COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degraded"
      FROM "LLMUsageLog"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(mins => ${WINDOW_MIN})
        AND "environment" = ${env}
      GROUP BY "provider"
    `) as unknown as RawRow[];
  } catch {
    // Silent fallback: health lookup is advisory. Seed every provider
    // as "unknown" and cache for 60s so we don't hammer an unhealthy DB.
    // Callers treat unknown == healthy, so routing falls back to the
    // preference order — identical behavior to pre-feature baseline.
    for (const p of ALL_PROVIDERS) {
      cache.set(p, {
        snapshot: makeUnknownSnapshot(p, now),
        expiresAt: now + CACHE_TTL_MS,
      });
    }
    return;
  }

  // Seed all providers as unknown first (so a provider with zero recent
  // traffic is explicitly unknown, not stale).
  for (const p of ALL_PROVIDERS) {
    cache.set(p, {
      snapshot: makeUnknownSnapshot(p, now),
      expiresAt: now + CACHE_TTL_MS,
    });
  }

  // Overlay actual counts.
  for (const row of rows) {
    const provider = row.provider as Provider;
    if (!ALL_PROVIDERS.includes(provider)) continue;
    const total = Number(row.total);
    const ok = Number(row.ok);
    const degraded = Number(row.degraded);
    const failure = total - ok;
    const successRate = total > 0 ? ok / total : 1;
    cache.set(provider, {
      snapshot: {
        provider,
        totalCalls: total,
        successCount: ok,
        failureCount: failure,
        degradedCount: degraded,
        successRate,
        windowMinutes: WINDOW_MIN,
        observedAt: now,
        status: classifyStatus(total, successRate),
      },
      expiresAt: now + CACHE_TTL_MS,
    });
  }
}

async function ensureFresh(): Promise<void> {
  const now = Date.now();
  // Any missing or expired entry → refresh the whole cache.
  for (const p of ALL_PROVIDERS) {
    const entry = cache.get(p);
    if (!entry || entry.expiresAt <= now) {
      if (!inflightRefresh) {
        inflightRefresh = refreshFromDB().finally(() => {
          inflightRefresh = null;
        });
      }
      await inflightRefresh;
      return;
    }
  }
}

export interface HealthSelection {
  /** First element of orderedChain — the preferred primary. */
  chosen: Provider;
  /**
   * The full preference chain after health reordering. Healthy/degraded/
   * unknown providers keep their original relative order; unhealthy
   * providers are appended at the end (not removed — the router should
   * still try them if the healthier options fail).
   */
  orderedChain: Provider[];
  /**
   * Providers that were moved to the tail because their success rate
   * was below UNHEALTHY_THRESHOLD in the recent window. Empty when
   * no demotion occurred. Caller (router) uses this to emit a Sentry
   * breadcrumb for observability.
   */
  demoted: { provider: Provider; reason: string }[];
}

/**
 * Reorder the provider preference list by recent health.
 *
 * Semantics:
 * - Healthy, degraded, and unknown providers keep their original
 *   relative order (no churn from small samples).
 * - Only unhealthy (success rate < UNHEALTHY_THRESHOLD over MIN_CALLS+
 *   calls in WINDOW_MIN minutes) providers are demoted to the tail.
 * - Kill switch or empty preference → return preference unchanged,
 *   skipping the DB entirely.
 */
export async function selectHealthiest(
  preference: readonly Provider[],
): Promise<HealthSelection> {
  if (preference.length === 0) {
    // Degenerate input. Return a valid-but-empty selection so callers
    // don't have to null-check; the router will handle the empty chain
    // the same way it handles a fully-open circuit.
    return {
      chosen: "anthropic",
      orderedChain: [],
      demoted: [],
    };
  }
  if (isKillSwitchOn()) {
    return {
      chosen: preference[0],
      orderedChain: [...preference],
      demoted: [],
    };
  }

  await ensureFresh();

  const healthy: Provider[] = [];
  const unhealthy: { provider: Provider; reason: string }[] = [];

  for (const p of preference) {
    const snap = cache.get(p)?.snapshot;
    if (!snap || snap.status !== "unhealthy") {
      // healthy / degraded / unknown → keep ordering
      healthy.push(p);
    } else {
      const pct = (snap.successRate * 100).toFixed(0);
      unhealthy.push({
        provider: p,
        reason: `success-rate ${pct}% over ${snap.windowMinutes}min (${snap.successCount}/${snap.totalCalls})`,
      });
    }
  }

  const orderedChain: Provider[] = [
    ...healthy,
    ...unhealthy.map((u) => u.provider),
  ];
  return {
    chosen: orderedChain[0],
    orderedChain,
    demoted: unhealthy,
  };
}

/**
 * Get the current cached snapshot for each provider. Returns null for
 * providers with no cache entry yet. Does NOT trigger a refresh —
 * intended for internal diagnostics where a stale read is acceptable.
 *
 * For operator-facing endpoints (/api/health/llm), prefer
 * `getFreshHealthSnapshot()` which refreshes the cache first so
 * operators on multi-instance deployments never see a stale cold
 * instance's empty cache.
 */
export function getHealthSnapshot(): Record<Provider, HealthSnapshot | null> {
  const result: Record<Provider, HealthSnapshot | null> = {
    anthropic: null,
    openai: null,
    gemini: null,
  };
  for (const p of ALL_PROVIDERS) {
    const entry = cache.get(p);
    if (entry) result[p] = entry.snapshot;
  }
  return result;
}

/**
 * Read a fresh snapshot from the DB WITHOUT touching the module-level
 * cache used by `selectHealthiest()`. This is the operator-facing
 * read path — isolating it from the routing cache guarantees:
 *
 *   1. A diagnostic probe (e.g. /api/health/llm) cannot poison routing
 *      by refreshing the cache during a transient DB failure. If this
 *      read fails, real routing decisions are unaffected.
 *   2. The endpoint has its own timeout so a slow Neon query cannot
 *      drag down the broader LLM health probe.
 *
 * On timeout or DB error, returns `{ stale: true, snapshots: null }`
 * so operators can distinguish "no routing data right now" from
 * "all providers are unknown."
 */
const PEEK_DEFAULT_TIMEOUT_MS = 3_000;
/**
 * Independent TTL for the operator-facing peek cache. Decouples from
 * CACHE_TTL_MS (routing cache) so a busy operator endpoint does NOT
 * drive routing cache churn, and a routing refresh does not leak DB
 * connection state into health responses.
 */
const PEEK_CACHE_TTL_MS = 30_000;

export interface PeekResult {
  snapshots: Record<Provider, HealthSnapshot | null> | null;
  stale: boolean;
  /**
   * Stable code identifying the failure class. Never the raw DB error
   * message — callers surface this in /api/health/llm which is hit by
   * external monitors, and we don't want DB hostnames, auth failures,
   * or driver internals leaking into that response.
   */
  error?: "timeout" | "db_auth_error" | "db_connection_error" | "db_error";
}

interface PeekCacheEntry {
  result: PeekResult;
  expiresAt: number;
}

let peekCache: PeekCacheEntry | null = null;
let inflightPeek: Promise<PeekResult> | null = null;

/**
 * Map raw errors to stable categorical codes. Operators get enough
 * signal to diagnose without exposing internals through the public
 * /api/health/llm response.
 */
function classifyPeekError(err: unknown): PeekResult["error"] {
  if (!(err instanceof Error)) return "db_error";
  const msg = err.message.toLowerCase();
  if (msg.includes("timeout")) return "timeout";
  if (msg.includes("password") || msg.includes("authentication")) {
    return "db_auth_error";
  }
  if (
    msg.includes("econnrefused") ||
    msg.includes("connection") ||
    msg.includes("reset") ||
    msg.includes("network")
  ) {
    return "db_connection_error";
  }
  return "db_error";
}

/**
 * Run the actual aggregation query and convert rows to snapshots.
 * Returns a PeekResult that NEVER throws — errors become stale results.
 * This is the "compute" promise; it settles only when the DB settles.
 */
function executeCompute(): Promise<PeekResult> {
  const env = currentEnvironment();
  const now = Date.now();
  const dbPromise = sql<RawRow>`
    SELECT
      "provider",
      COUNT(*)::int AS "total",
      COUNT(*) FILTER (WHERE "success" = true)::int AS "ok",
      COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degraded"
    FROM "LLMUsageLog"
    WHERE "createdAt" > NOW() - MAKE_INTERVAL(mins => ${WINDOW_MIN})
      AND "environment" = ${env}
    GROUP BY "provider"
  ` as unknown as Promise<RawRow[]>;

  return dbPromise.then(
    (rows) => {
      const snapshots: Record<Provider, HealthSnapshot | null> = {
        anthropic: null,
        openai: null,
        gemini: null,
      };
      for (const p of ALL_PROVIDERS) {
        snapshots[p] = makeUnknownSnapshot(p, now);
      }
      for (const row of rows) {
        const provider = row.provider as Provider;
        if (!ALL_PROVIDERS.includes(provider)) continue;
        const total = Number(row.total);
        const ok = Number(row.ok);
        const degraded = Number(row.degraded);
        const failure = total - ok;
        const successRate = total > 0 ? ok / total : 1;
        snapshots[provider] = {
          provider,
          totalCalls: total,
          successCount: ok,
          failureCount: failure,
          degradedCount: degraded,
          successRate,
          windowMinutes: WINDOW_MIN,
          observedAt: now,
          status: classifyStatus(total, successRate),
        };
      }
      return { snapshots, stale: false } as PeekResult;
    },
    (err) => {
      return {
        snapshots: null,
        stale: true,
        error: classifyPeekError(err),
      } as PeekResult;
    },
  );
}

/**
 * Operator-facing snapshot read for /api/health/llm and friends.
 *
 * Properties:
 *   - Independent cache (30s TTL). Serves from memory during a
 *     burst of monitor probes; does NOT touch the routing cache used
 *     by selectHealthiest(), so a diagnostic probe cannot poison
 *     production routing.
 *   - Inflight coalescing: if another caller's query is already
 *     running, we wait on it instead of issuing a parallel DB query.
 *     This caps DB pressure at 1 concurrent peek per instance even
 *     under a flood of monitor retries.
 *   - Sanitized errors: callers see classified codes
 *     (`timeout | db_auth_error | db_connection_error | db_error`),
 *     not raw DB messages.
 *   - Kill-switch short-circuit: returns empty snapshots with
 *     `stale: false` and zero DB load.
 */
export async function peekHealthSnapshot(
  timeoutMs: number = PEEK_DEFAULT_TIMEOUT_MS,
): Promise<PeekResult> {
  if (isKillSwitchOn()) {
    return {
      snapshots: {
        anthropic: null,
        openai: null,
        gemini: null,
      },
      stale: false,
    };
  }

  const now = Date.now();
  if (peekCache && peekCache.expiresAt > now) {
    return peekCache.result;
  }

  // Share the raw compute promise across concurrent + late callers.
  // Each caller races it against their OWN timeout so:
  //   - First caller's timeout doesn't permanently settle a shared
  //     promise as "timeout"
  //   - A later caller (arriving after peekCache expiry but before
  //     compute finishes) sees the fresh result if compute settles
  //     within that caller's own timeout budget
  //   - DB pressure is still capped at 1 concurrent query per instance
  //     because we reuse `inflightPeek` instead of calling executeCompute
  //     again
  const compute = inflightPeek ?? startSharedCompute();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutSignal = new Promise<PeekResult>((resolve) => {
    timeoutId = setTimeout(
      () =>
        resolve({
          snapshots: null,
          stale: true,
          error: "timeout",
        } satisfies PeekResult),
      timeoutMs,
    );
  });

  const result = await Promise.race([compute, timeoutSignal]);
  if (timeoutId) clearTimeout(timeoutId);
  return result;
}

/**
 * Start a shared compute and wire up its lifecycle:
 *   - Pin `inflightPeek` so concurrent callers coalesce
 *   - On successful settle (success OR classified db error), populate
 *     `peekCache` so subsequent callers within 30s serve from memory
 *   - Release `inflightPeek` when compute settles, identity-checked so
 *     later computes don't get stomped
 */
function startSharedCompute(): Promise<PeekResult> {
  const compute = executeCompute();
  inflightPeek = compute;
  void compute.then((result) => {
    peekCache = { result, expiresAt: Date.now() + PEEK_CACHE_TTL_MS };
  });
  void compute.finally(() => {
    if (inflightPeek === compute) {
      inflightPeek = null;
    }
  });
  return compute;
}

/** Test-only helper — drop the peek cache so the next call refreshes. */
export function invalidatePeekCache(): void {
  peekCache = null;
  inflightPeek = null;
}

/** Test-only helper — drop the cache so the next call refreshes. */
export function invalidateHealthCache(): void {
  cache.clear();
  inflightRefresh = null;
  peekCache = null;
  inflightPeek = null;
}

/** Exposed for /api/health/llm to indicate whether routing is active. */
export function isHealthRoutingEnabled(): boolean {
  return !isKillSwitchOn();
}

/** Exposed config values for /api/health/llm so operators can see the
 *  thresholds without reading env vars. */
export function getHealthRoutingConfig() {
  return {
    windowMinutes: WINDOW_MIN,
    minCalls: MIN_CALLS,
    unhealthyThreshold: UNHEALTHY_THRESHOLD,
    degradedThreshold: DEGRADED_THRESHOLD,
    cacheTtlMs: CACHE_TTL_MS,
  };
}
