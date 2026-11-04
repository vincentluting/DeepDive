// ============================================================
// LLM Usage Log — fire-and-forget tracking for AI call metrics
//
// Usage:
//   logLLMUsage({ taskName, provider, model, latencyMs, success })
//   const summary = await getLLMUsageSummary(7)
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { sql } from "./connection";
import { getLLMUserId } from "../ai/llm-request-context";

/**
 * Quality gate result per LLM call (migration 095).
 * 'not-checked' = task has no gate configured (legacy).
 */
export type LLMQualityCheckResult =
  | "pass"
  | "fail-length"
  | "fail-field"
  | "fail-count"
  | "fail-language"
  | "fail-repetition"
  | "not-checked";

export interface LLMUsageEntry {
  taskName: string;
  provider: string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs: number;
  success: boolean;
  degraded?: boolean;
  errorMessage?: string | null;
  userId?: string | null;
  environment?: string;
  /** Tokens read from provider prompt cache (Anthropic cache_read_input_tokens, OpenAI cached_tokens, Gemini cachedContentTokenCount). */
  cacheReadTokens?: number | null;
  /** Tokens written to provider prompt cache (Anthropic cache_creation_input_tokens). */
  cacheWriteTokens?: number | null;
  /**
   * Quality gate verdict (migration 095). Set by `runWithQualityGate()` in
   * Phase 2; older callers and model-router pass undefined → column NULL.
   */
  qualityCheckResult?: LLMQualityCheckResult | null;
}

/**
 * Fire-and-forget: log an LLM call. Does NOT await — never blocks the main request.
 */
/** Detect environment: 'development' NODE_ENV → 'test', otherwise 'production'. */
function detectEnvironment(): string {
  return process.env.NODE_ENV === "development" ? "test" : "production";
}

export function logLLMUsage(data: LLMUsageEntry): void {
  const id = crypto.randomUUID();
  const environment = data.environment ?? detectEnvironment();
  // Fallback to AsyncLocalStorage when caller (e.g. model-router, which is
  // a frozen zone and cannot be modified to accept userId in options) does
  // not pass userId explicitly. Top-level entry points wrap their work in
  // `withLLMUserId(userId, fn)` so this context follows the async stack.
  // See lib/ai/llm-request-context.ts.
  const userId = data.userId ?? getLLMUserId() ?? null;
  const cacheRead = data.cacheReadTokens ?? null;
  const cacheWrite = data.cacheWriteTokens ?? null;
  const cacheHit =
    cacheRead != null && cacheRead > 0
      ? true
      : cacheRead === 0 && cacheWrite != null && cacheWrite > 0
        ? false
        : null;
  sql`
    INSERT INTO "LLMUsageLog" (
      "id", "taskName", "provider", "model",
      "inputTokens", "outputTokens", "latencyMs",
      "success", "degraded", "errorMessage", "userId", "environment",
      "cacheReadTokens", "cacheWriteTokens", "cacheHit",
      "qualityCheckResult"
    ) VALUES (
      ${id}, ${data.taskName}, ${data.provider}, ${data.model},
      ${data.inputTokens ?? null}, ${data.outputTokens ?? null}, ${data.latencyMs},
      ${data.success}, ${data.degraded ?? false}, ${data.errorMessage ?? null}, ${userId}, ${environment},
      ${cacheRead}, ${cacheWrite}, ${cacheHit},
      ${data.qualityCheckResult ?? null}
    )
  `.catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[llm-usage] Failed to log LLM usage:", msg);
    try {
      Sentry.captureException(err instanceof Error ? err : new Error(msg), {
        tags: {
          errorSurface: "llm-observability",
          taskName: data.taskName,
          provider: data.provider,
          environment,
        },
        // userId is intentionally NOT in extra to keep Sentry events PII-free;
        // it is already in DB at logLLMUsage call sites for forensics.
        extra: {
          model: data.model,
          success: data.success,
          degraded: data.degraded ?? false,
          latencyMs: data.latencyMs,
          inputTokens: data.inputTokens ?? null,
          outputTokens: data.outputTokens ?? null,
          cacheReadTokens: data.cacheReadTokens ?? null,
          cacheWriteTokens: data.cacheWriteTokens ?? null,
        },
        level: "warning",
      });
    } catch {
      // Sentry is best-effort; never let observability crash the app.
    }
  });
}

// ============================================================
// LLMPromptMeta — tracks RealConditions injection per LLM call
// (separate table so model-router stays untouched)
// ============================================================

export interface LLMPromptMetaEntry {
  taskName: string;
  userId?: string | null;
  locale: string;
  realConditionsProvided: boolean;
  realConditionsFieldCount?: number;
  environment?: string;
}

/**
 * Fire-and-forget: log whether RealConditions was injected into a specific
 * LLM call. Written from prompt builders (career-pathway, career-match-narrative,
 * integration, coaching-chat) right alongside their callLLM invocations.
 *
 * Aggregation SQL example:
 *   SELECT taskName, realConditionsProvided, COUNT(*)
 *   FROM "LLMPromptMeta"
 *   WHERE "createdAt" > NOW() - INTERVAL '7 days'
 *   GROUP BY taskName, realConditionsProvided;
 */
export function logLLMPromptMeta(data: LLMPromptMetaEntry): void {
  const id = crypto.randomUUID();
  const environment = data.environment ?? detectEnvironment();
  const fieldCount = data.realConditionsFieldCount ?? 0;
  // Fallback to AsyncLocalStorage when caller did not pass userId (e.g.
  // legacy generator paths not yet threading userId through). Mirrors the
  // logLLMUsage fallback. See lib/ai/llm-request-context.ts.
  const userId = data.userId ?? getLLMUserId() ?? null;
  sql`
    INSERT INTO "LLMPromptMeta" (
      "id", "taskName", "userId", "locale",
      "realConditionsProvided", "realConditionsFieldCount",
      "environment"
    ) VALUES (
      ${id}, ${data.taskName}, ${userId}, ${data.locale},
      ${data.realConditionsProvided}, ${fieldCount},
      ${environment}
    )
  `.catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[llm-prompt-meta] Failed to log LLM prompt meta:", msg);
    try {
      Sentry.captureException(err instanceof Error ? err : new Error(msg), {
        tags: {
          errorSurface: "llm-observability",
          taskName: data.taskName,
          environment,
        },
        // userId omitted from extra for PII-cleanliness; locale + RC fields
        // are non-PII and useful for grouping observability outages.
        extra: {
          locale: data.locale,
          realConditionsProvided: data.realConditionsProvided,
          realConditionsFieldCount: fieldCount,
        },
        level: "warning",
      });
    } catch {
      // Sentry is best-effort; never let observability crash the app.
    }
  });
}

export interface LLMUsageTaskSummary {
  taskName: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  degradedCount: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  cacheHitCount: number;
  cacheHitRate: number;
}

export interface LLMUsageDailySummary {
  date: string;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

// ============================================================
// Token pricing (USD per 1M tokens) — update when models change
// ============================================================

const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  // Google
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  // OpenAI
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  // Groq
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
};

/** Fallback pricing for unknown models */
const DEFAULT_PRICING = { input: 1.0, output: 4.0 };

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = TOKEN_PRICING[model] || DEFAULT_PRICING;
  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  );
}

// ============================================================
// Per-user cost aggregation
// ============================================================

export interface LLMCostPerUser {
  userId: string;
  email: string | null;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
}

/**
 * Get LLM cost per user for the last N days, sorted by cost descending.
 */
export async function getLLMCostPerUser(
  days: number,
  environment?: string,
): Promise<LLMCostPerUser[]> {
  const rows = environment
    ? await sql`
      SELECT
        l."userId", u."email", l."model",
        COUNT(*)::int AS "totalCalls",
        COALESCE(SUM(l."inputTokens"), 0)::int AS "totalInputTokens",
        COALESCE(SUM(l."outputTokens"), 0)::int AS "totalOutputTokens"
      FROM "LLMUsageLog" l
      LEFT JOIN "User" u ON u."id" = l."userId"
      WHERE l."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND l."userId" IS NOT NULL AND l."success" = true
        AND l."environment" = ${environment}
      GROUP BY l."userId", u."email", l."model"
      ORDER BY l."userId"
    `
    : await sql`
      SELECT
        l."userId", u."email", l."model",
        COUNT(*)::int AS "totalCalls",
        COALESCE(SUM(l."inputTokens"), 0)::int AS "totalInputTokens",
        COALESCE(SUM(l."outputTokens"), 0)::int AS "totalOutputTokens"
      FROM "LLMUsageLog" l
      LEFT JOIN "User" u ON u."id" = l."userId"
      WHERE l."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND l."userId" IS NOT NULL AND l."success" = true
      GROUP BY l."userId", u."email", l."model"
      ORDER BY l."userId"
    `;

  // Aggregate across models per user, applying per-model pricing
  const userMap = new Map<string, LLMCostPerUser>();
  for (const row of rows) {
    const r = row as {
      userId: string;
      email: string | null;
      model: string;
      totalCalls: number;
      totalInputTokens: number;
      totalOutputTokens: number;
    };
    const existing = userMap.get(r.userId);
    const cost = estimateCost(r.model, r.totalInputTokens, r.totalOutputTokens);

    if (existing) {
      existing.totalCalls += r.totalCalls;
      existing.totalInputTokens += r.totalInputTokens;
      existing.totalOutputTokens += r.totalOutputTokens;
      existing.estimatedCostUsd += cost;
    } else {
      userMap.set(r.userId, {
        userId: r.userId,
        email: r.email,
        totalCalls: r.totalCalls,
        totalInputTokens: r.totalInputTokens,
        totalOutputTokens: r.totalOutputTokens,
        estimatedCostUsd: cost,
      });
    }
  }

  return Array.from(userMap.values()).sort(
    (a, b) => b.estimatedCostUsd - a.estimatedCostUsd,
  );
}

// ============================================================
// Per-model usage aggregation
// ============================================================

export interface LLMUsageModelSummary {
  model: string;
  provider: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  degradedCount: number;
  estimatedCostUsd: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  cacheHitCount: number;
  cacheHitRate: number;
}

/**
 * Get LLM usage grouped by model for the last N days.
 */
export async function getLLMUsageByModel(
  days: number,
  environment?: string,
): Promise<LLMUsageModelSummary[]> {
  const rows = environment
    ? await sql`
      SELECT
        "model", "provider",
        COUNT(*)::int AS "totalCalls",
        COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
        COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
        COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
        COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens",
        ROUND(AVG("latencyMs"))::int AS "avgLatencyMs",
        COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount",
        COALESCE(SUM("cacheReadTokens"), 0)::int AS "totalCacheReadTokens",
        COALESCE(SUM("cacheWriteTokens"), 0)::int AS "totalCacheWriteTokens",
        COUNT(*) FILTER (WHERE "cacheHit" = true)::int AS "cacheHitCount"
      FROM "LLMUsageLog"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND "environment" = ${environment}
      GROUP BY "model", "provider"
      ORDER BY "totalCalls" DESC
    `
    : await sql`
      SELECT
        "model", "provider",
        COUNT(*)::int AS "totalCalls",
        COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
        COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
        COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
        COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens",
        ROUND(AVG("latencyMs"))::int AS "avgLatencyMs",
        COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount",
        COALESCE(SUM("cacheReadTokens"), 0)::int AS "totalCacheReadTokens",
        COALESCE(SUM("cacheWriteTokens"), 0)::int AS "totalCacheWriteTokens",
        COUNT(*) FILTER (WHERE "cacheHit" = true)::int AS "cacheHitCount"
      FROM "LLMUsageLog"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      GROUP BY "model", "provider"
      ORDER BY "totalCalls" DESC
    `;

  type RawRow = Omit<LLMUsageModelSummary, "estimatedCostUsd" | "cacheHitRate">;
  return (rows as unknown as RawRow[]).map((r) => {
    const callsWithCacheData =
      r.cacheHitCount +
      (r.totalCacheWriteTokens > 0 ? r.totalCalls - r.cacheHitCount : 0);
    return {
      ...r,
      estimatedCostUsd: estimateCost(
        r.model,
        r.totalInputTokens,
        r.totalOutputTokens,
      ),
      cacheHitRate:
        callsWithCacheData > 0
          ? Math.round((r.cacheHitCount / callsWithCacheData) * 1000) / 10
          : 0,
    };
  });
}

/**
 * Get LLM usage summary grouped by task for the last N days.
 */
export async function getLLMUsageSummary(
  days: number,
  environment?: string,
): Promise<{
  byTask: LLMUsageTaskSummary[];
  byDay: LLMUsageDailySummary[];
}> {
  const [byTask, byDay] = environment
    ? await Promise.all([
        sql`
          SELECT "taskName",
            COUNT(*)::int AS "totalCalls",
            COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
            COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
            ROUND(COUNT(*) FILTER (WHERE "success" = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS "successRate",
            ROUND(AVG("latencyMs"))::int AS "avgLatencyMs",
            COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
            COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens",
            COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount",
            COALESCE(SUM("cacheReadTokens"), 0)::int AS "totalCacheReadTokens",
            COALESCE(SUM("cacheWriteTokens"), 0)::int AS "totalCacheWriteTokens",
            COUNT(*) FILTER (WHERE "cacheHit" = true)::int AS "cacheHitCount"
          FROM "LLMUsageLog"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
            AND "environment" = ${environment}
          GROUP BY "taskName" ORDER BY "totalCalls" DESC
        `,
        sql`
          SELECT TO_CHAR("createdAt"::date, 'YYYY-MM-DD') AS "date",
            COUNT(*)::int AS "totalCalls",
            COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
            COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens"
          FROM "LLMUsageLog"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
            AND "environment" = ${environment}
          GROUP BY "createdAt"::date ORDER BY "createdAt"::date ASC
        `,
      ])
    : await Promise.all([
        sql`
          SELECT "taskName",
            COUNT(*)::int AS "totalCalls",
            COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
            COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
            ROUND(COUNT(*) FILTER (WHERE "success" = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS "successRate",
            ROUND(AVG("latencyMs"))::int AS "avgLatencyMs",
            COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
            COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens",
            COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount",
            COALESCE(SUM("cacheReadTokens"), 0)::int AS "totalCacheReadTokens",
            COALESCE(SUM("cacheWriteTokens"), 0)::int AS "totalCacheWriteTokens",
            COUNT(*) FILTER (WHERE "cacheHit" = true)::int AS "cacheHitCount"
          FROM "LLMUsageLog"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
          GROUP BY "taskName" ORDER BY "totalCalls" DESC
        `,
        sql`
          SELECT TO_CHAR("createdAt"::date, 'YYYY-MM-DD') AS "date",
            COUNT(*)::int AS "totalCalls",
            COALESCE(SUM("inputTokens"), 0)::int AS "totalInputTokens",
            COALESCE(SUM("outputTokens"), 0)::int AS "totalOutputTokens"
          FROM "LLMUsageLog"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
          GROUP BY "createdAt"::date ORDER BY "createdAt"::date ASC
        `,
      ]);

  // Compute cacheHitRate for each task
  type RawTaskRow = Omit<LLMUsageTaskSummary, "cacheHitRate">;
  const tasksWithRate = (byTask as unknown as RawTaskRow[]).map((r) => {
    const callsWithCacheData =
      r.cacheHitCount +
      (r.totalCacheWriteTokens > 0 ? r.totalCalls - r.cacheHitCount : 0);
    return {
      ...r,
      cacheHitRate:
        callsWithCacheData > 0
          ? Math.round((r.cacheHitCount / callsWithCacheData) * 1000) / 10
          : 0,
    };
  });

  return {
    byTask: tasksWithRate,
    byDay: byDay as unknown as LLMUsageDailySummary[],
  };
}

// ============================================================
// Health digest — used by /api/cron/llm-digest to detect degradation
// ============================================================

export interface LLMProviderHealthRow {
  provider: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  degradedCount: number;
  degradedRate: number;
}

export interface LLMHealthDigest {
  windowHours: number;
  generatedAt: string;
  totalCalls: number;
  totalSuccesses: number;
  totalFailures: number;
  overallSuccessRate: number;
  totalDegraded: number;
  overallDegradedRate: number;
  byProvider: LLMProviderHealthRow[];
  /** Top 5 distinct error messages with counts. */
  topErrors: Array<{ provider: string; errorMessage: string; count: number }>;
}

/**
 * Aggregate LLM health metrics over a recent time window.
 * Used by the daily LLM digest cron to detect provider degradation.
 *
 * Rate calculations are rounded to one decimal (e.g. 97.8).
 *
 * @param hours look-back window in hours (default 24)
 * @param environment optional filter (e.g. 'production')
 */
export async function getLLMHealthDigest(
  hours = 24,
  environment?: string,
): Promise<LLMHealthDigest> {
  const byProviderRows = environment
    ? await sql`
      SELECT
        "provider",
        COUNT(*)::int AS "totalCalls",
        COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
        COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
        COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount"
      FROM "LLMUsageLog"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(hours => ${hours})
        AND "environment" = ${environment}
      GROUP BY "provider"
      ORDER BY "totalCalls" DESC
    `
    : await sql`
      SELECT
        "provider",
        COUNT(*)::int AS "totalCalls",
        COUNT(*) FILTER (WHERE "success" = true)::int AS "successCount",
        COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
        COUNT(*) FILTER (WHERE "degraded" = true)::int AS "degradedCount"
      FROM "LLMUsageLog"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(hours => ${hours})
      GROUP BY "provider"
      ORDER BY "totalCalls" DESC
    `;

  const byProvider: LLMProviderHealthRow[] = (
    byProviderRows as unknown as Array<{
      provider: string;
      totalCalls: number;
      successCount: number;
      failureCount: number;
      degradedCount: number;
    }>
  ).map((r) => ({
    provider: r.provider,
    totalCalls: r.totalCalls,
    successCount: r.successCount,
    failureCount: r.failureCount,
    degradedCount: r.degradedCount,
    successRate:
      r.totalCalls > 0
        ? Math.round((r.successCount / r.totalCalls) * 1000) / 10
        : 0,
    degradedRate:
      r.totalCalls > 0
        ? Math.round((r.degradedCount / r.totalCalls) * 1000) / 10
        : 0,
  }));

  const totalCalls = byProvider.reduce((s, p) => s + p.totalCalls, 0);
  const totalSuccesses = byProvider.reduce((s, p) => s + p.successCount, 0);
  const totalFailures = byProvider.reduce((s, p) => s + p.failureCount, 0);
  const totalDegraded = byProvider.reduce((s, p) => s + p.degradedCount, 0);

  // Top 5 distinct error messages (truncated to 200 chars to keep digest light)
  const errorRows = environment
    ? await sql`
      SELECT "provider", LEFT("errorMessage", 200) AS "errorMessage", COUNT(*)::int AS "count"
      FROM "LLMUsageLog"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(hours => ${hours})
        AND "success" = false
        AND "errorMessage" IS NOT NULL
        AND "environment" = ${environment}
      GROUP BY "provider", LEFT("errorMessage", 200)
      ORDER BY "count" DESC
      LIMIT 5
    `
    : await sql`
      SELECT "provider", LEFT("errorMessage", 200) AS "errorMessage", COUNT(*)::int AS "count"
      FROM "LLMUsageLog"
      WHERE "createdAt" > NOW() - MAKE_INTERVAL(hours => ${hours})
        AND "success" = false
        AND "errorMessage" IS NOT NULL
      GROUP BY "provider", LEFT("errorMessage", 200)
      ORDER BY "count" DESC
      LIMIT 5
    `;

  return {
    windowHours: hours,
    generatedAt: new Date().toISOString(),
    totalCalls,
    totalSuccesses,
    totalFailures,
    overallSuccessRate:
      totalCalls > 0
        ? Math.round((totalSuccesses / totalCalls) * 1000) / 10
        : 0,
    totalDegraded,
    overallDegradedRate:
      totalCalls > 0 ? Math.round((totalDegraded / totalCalls) * 1000) / 10 : 0,
    byProvider,
    topErrors: errorRows as unknown as Array<{
      provider: string;
      errorMessage: string;
      count: number;
    }>,
  };
}

// ── Circuit breaker cold-start seeding ──

export interface RecentProviderFailure {
  provider: string;
  failureCount: number;
  totalCalls: number;
  lastErrorMessage: string | null;
}

/**
 * Query recent LLM failure rates per provider for circuit breaker seeding.
 * Called once on cold start to give new serverless instances fleet-wide
 * awareness of ongoing provider outages.
 *
 * Uses partial index `idx_llm_usage_provider_failures` for efficiency.
 *
 * @param minutes look-back window (default 5, matching circuit cooldown)
 */
export async function getRecentProviderFailures(
  minutes = 5,
): Promise<RecentProviderFailure[]> {
  const rows = await sql`
    SELECT
      "provider",
      COUNT(*)::int AS "totalCalls",
      COUNT(*) FILTER (WHERE "success" = false)::int AS "failureCount",
      (
        SELECT "errorMessage" FROM "LLMUsageLog" sub
        WHERE sub."provider" = main."provider"
          AND sub."success" = false
          AND sub."createdAt" > NOW() - MAKE_INTERVAL(mins => ${minutes})
        ORDER BY sub."createdAt" DESC LIMIT 1
      ) AS "lastErrorMessage"
    FROM "LLMUsageLog" main
    WHERE "createdAt" > NOW() - MAKE_INTERVAL(mins => ${minutes})
    GROUP BY "provider"
    HAVING COUNT(*) >= 3
    ORDER BY "failureCount" DESC
  `;
  return rows as unknown as RecentProviderFailure[];
}

// ============================================================
// Quality check result writes (Phase 2 of the 99%+ quality plan)
//
// `logLLMUsage` is called by lib/ai/model-router.ts (frozen zone) which
// does not know about quality gates. So callers (generators) write the
// gate verdict separately by UPDATE-ing the most recent matching row.
// ============================================================

/**
 * UPDATE the most recent LLMUsageLog row for (userId, taskName, since
 * windowStart) with the quality gate verdict. Fire-and-forget — never
 * throws. Includes a short retry loop because model-router's INSERT is
 * also fire-and-forget and may not be committed yet when the gate runs.
 */
export function logLLMQualityCheck(opts: {
  taskName: string;
  userId?: string | null;
  qualityCheckResult: LLMQualityCheckResult;
  /** ms epoch; only rows AFTER this are eligible. */
  createdAfter: number;
  environment?: string;
  maxWaitMs?: number;
}): void {
  const env = opts.environment ?? detectEnvironment();
  const sinceIso = new Date(opts.createdAfter).toISOString();
  // Fallback to ALS userId (mirrors logLLMUsage behaviour).
  const userId = opts.userId ?? getLLMUserId() ?? null;
  const maxWaitMs = opts.maxWaitMs ?? 1500;

  void (async () => {
    const deadline = Date.now() + maxWaitMs;
    let attempt = 0;
    while (true) {
      try {
        // STRICT userId match. When the caller did not pass a userId AND
        // AsyncLocalStorage also returned null, restrict to rows that ALSO
        // have userId IS NULL. Without this, two concurrent generations —
        // one anonymous, one authenticated — could see this UPDATE
        // overwrite the authenticated row's qualityCheckResult.
        // (Codex review P2 finding, 2026-05-21.)
        const rows = await sql<{ id: string }>`
          UPDATE "LLMUsageLog"
          SET "qualityCheckResult" = ${opts.qualityCheckResult}
          WHERE "id" = (
            SELECT "id" FROM "LLMUsageLog"
            WHERE "taskName" = ${opts.taskName}
              AND "environment" = ${env}
              AND "createdAt" >= ${sinceIso}
              AND (
                (${userId}::text IS NULL AND "userId" IS NULL)
                OR "userId" = ${userId}
              )
            ORDER BY "createdAt" DESC
            LIMIT 1
          )
          RETURNING "id"
        `;
        if (rows.length > 0) return;
      } catch (err) {
        // Observability is best-effort; never crash the request.
        const msg = err instanceof Error ? err.message : String(err);
        try {
          Sentry.captureException(err instanceof Error ? err : new Error(msg), {
            tags: {
              errorSurface: "llm-observability",
              taskName: opts.taskName,
              environment: env,
              attempt: String(attempt),
            },
            level: "warning",
          });
        } catch {
          /* swallow */
        }
        return;
      }
      if (Date.now() >= deadline) return;
      const wait = Math.min(100 * 2 ** attempt, deadline - Date.now());
      if (wait <= 0) return;
      await new Promise((r) => setTimeout(r, wait));
      attempt++;
    }
  })();
}

// ============================================================
// Report provenance: which provider wrote each LLM section
// (used by Phase 1 of the 99%+ quality plan to fill
//  CareerReport.llmProviderMap)
// ============================================================

/**
 * Per-section provider provenance for a single report.
 *
 * Built by replaying LLMUsageLog rows for one user in one time window
 * — fire-and-forget logging is eventually consistent, but reports are
 * persisted only AFTER all LLM calls finished, so by the time this
 * runs the rows are always present.
 *
 * Returned object is also written to CareerReport.llmProviderMap and
 * CareerReport.reportJson.meta.llmProviderMap for redundancy:
 *   - JSONB column = fast indexed admin filters
 *   - meta.* mirror = frontend can show "Generated by X" without an extra
 *     query
 *
 * Keys are taskNames as defined in lib/ai/model-router.ts TASK_CONFIG.
 * Values are the EFFECTIVE provider (not the configured primary) — so
 * a Gemini fallback for profile-narrative shows up as "gemini".
 */
export interface ReportLLMProvenance {
  /** taskName → effective provider that succeeded */
  taskProviders: Record<string, string>;
  /** taskName → effective model id (e.g. "claude-sonnet-4-6") */
  taskModels: Record<string, string>;
  /** Distinct providers used across the report */
  providers: string[];
  /** True if any LLM call in window was logged as degraded */
  anyDegraded: boolean;
  /** Tasks whose successful call was degraded (effectiveProvider != primary) */
  degradedTasks: string[];
  /** Total LLM calls observed in the window (incl. retries) */
  totalCalls: number;
  /** Number of LLM calls that failed (success=false) */
  failedCalls: number;
}

/**
 * Look up the providers that handled every LLM call for one user since
 * `startedAt` (UTC ms epoch). Used right before saveReport to fill the
 * llmProviderMap column.
 *
 * Only considers successful calls — failed retries are reflected in
 * failedCalls but not in taskProviders. If a task retried with a
 * different provider, the LAST successful row wins (matches what the
 * user actually got).
 *
 * RACE NOTE: `logLLMUsage` writes are fire-and-forget. The last LLM call
 * (typically `integration`) may have returned to the caller before its
 * INSERT committed. We retry with short backoff until either:
 *   (a) we observe at least `expectMinTasks` distinct successful tasks, OR
 *   (b) we burn `maxWaitMs`.
 * Caller passes the count of LLM calls it knows fired (llmCallCount in
 * report-generation/index.ts), so the retry gives up as soon as everything
 * is visible.
 */
export async function getReportLLMProvenance(opts: {
  userId: string;
  startedAt: number;
  environment?: string;
  /**
   * Minimum distinct successful tasks the caller expects to see in the
   * window. The retry loop bails out as soon as the query returns at
   * least this many rows. Default 0 = no wait, single shot.
   */
  expectMinTasks?: number;
  /** Max time to spend waiting for fire-and-forget writes. Default 1500ms. */
  maxWaitMs?: number;
}): Promise<ReportLLMProvenance> {
  const env = opts.environment ?? detectEnvironment();
  const startedAtIso = new Date(opts.startedAt).toISOString();
  const expectMinTasks = opts.expectMinTasks ?? 0;
  const maxWaitMs = opts.maxWaitMs ?? 1500;

  // Two queries:
  //  1. SUCCESS rows → group by taskName, pick the newest provider/model
  //  2. ALL rows → aggregate counts (total/failed/anyDegraded)
  // Single query with FILTER is also possible but harder to read.

  type SuccessRow = {
    taskName: string;
    provider: string;
    model: string;
    degraded: boolean;
  };

  // Retry loop: fire-and-forget INSERTs may not be committed yet when
  // the caller's awaited LLM chain returns. Poll briefly.
  let successRows: SuccessRow[];
  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;
  while (true) {
    successRows = (await sql`
      SELECT DISTINCT ON ("taskName")
        "taskName", "provider", "model", "degraded"
      FROM "LLMUsageLog"
      WHERE "userId" = ${opts.userId}
        AND "createdAt" >= ${startedAtIso}
        AND "environment" = ${env}
        AND "success" = true
      ORDER BY "taskName", "createdAt" DESC
    `) as unknown as SuccessRow[];

    if (successRows.length >= expectMinTasks) break;
    if (Date.now() >= deadline) break;
    // Short backoff: 100ms, 200ms, 400ms (capped by deadline)
    const wait = Math.min(100 * 2 ** attempt, deadline - Date.now());
    if (wait <= 0) break;
    await new Promise((r) => setTimeout(r, wait));
    attempt++;
  }

  type AggRow = {
    totalCalls: number;
    failedCalls: number;
    anyDegraded: boolean;
  };
  const aggRows = (await sql`
    SELECT
      COUNT(*)::int AS "totalCalls",
      COUNT(*) FILTER (WHERE "success" = false)::int AS "failedCalls",
      BOOL_OR("degraded") AS "anyDegraded"
    FROM "LLMUsageLog"
    WHERE "userId" = ${opts.userId}
      AND "createdAt" >= ${startedAtIso}
      AND "environment" = ${env}
  `) as unknown as AggRow[];

  const agg = aggRows[0] ?? {
    totalCalls: 0,
    failedCalls: 0,
    anyDegraded: false,
  };

  const taskProviders: Record<string, string> = {};
  const taskModels: Record<string, string> = {};
  const degradedTasks: string[] = [];
  const providerSet = new Set<string>();

  for (const row of successRows) {
    taskProviders[row.taskName] = row.provider;
    taskModels[row.taskName] = row.model;
    providerSet.add(row.provider);
    if (row.degraded) degradedTasks.push(row.taskName);
  }

  return {
    taskProviders,
    taskModels,
    providers: [...providerSet].sort(),
    anyDegraded: Boolean(agg.anyDegraded),
    degradedTasks,
    totalCalls: Number(agg.totalCalls ?? 0),
    failedCalls: Number(agg.failedCalls ?? 0),
  };
}
