// ============================================================
// LLM Provider Health Check
//
// Lightweight probes to verify each provider's API key is valid and the
// upstream is reachable. Used by:
//   - GET /api/health/llm        — public health endpoint
//   - cron LLM digest            — daily summary alerts
//   - (future) startup hook      — fail-loud after Vercel deploy
//
// Probes are deliberately MINIMAL (5-10 tokens) to keep cost negligible
// even when called every 15 minutes by an external monitor.
//
// Probe results are NOT cached — every call hits the live API. This is
// intentional: a stale "healthy" result during an actual outage would
// defeat the purpose. Caller can decide caching policy.
// ============================================================

import { LLMError, type LLMProvider } from "./llm-error";

/** Probe outcome for a single provider. */
export type ProviderHealth = {
  provider: LLMProvider;
  status: "healthy" | "degraded" | "unhealthy" | "not_configured";
  latencyMs: number;
  /** Short reason when not healthy. Safe to show in admin UI. */
  reason?: string;
  /** Categorical error code from LLMError when probe fails. */
  errorCode?: string;
  /** HTTP status when probe fails. */
  httpStatus?: number;
};

/** Aggregate health across all providers. */
export type LLMHealthReport = {
  generatedAt: string;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  providers: ProviderHealth[];
  /**
   * Recent-call success rates per provider + kill-switch state.
   * Populated by GET /api/health/llm using provider-health cache.
   * Additive field — consumers (UptimeRobot, /api/cron/llm-digest)
   * that don't know about it will ignore it.
   */
  routingHealth?: RoutingHealthReport;
};

/**
 * Snapshot of the health-aware routing module. Exposed so operators
 * can see what the router is currently preferring / demoting and why.
 */
export type RoutingHealthReport = {
  enabled: boolean;
  config: {
    windowMinutes: number;
    minCalls: number;
    unhealthyThreshold: number;
    degradedThreshold: number;
    cacheTtlMs: number;
  };
  /**
   * `null` if the peek timed out or the DB was unreachable. The `stale`
   * flag differentiates "no routing data available" from "all providers
   * are in `unknown` status from a successful but empty window."
   */
  snapshots: Record<
    LLMProvider,
    {
      totalCalls: number;
      successCount: number;
      failureCount: number;
      degradedCount: number;
      successRate: number;
      windowMinutes: number;
      observedAt: number;
      status: "healthy" | "degraded" | "unhealthy" | "unknown";
    } | null
  > | null;
  stale: boolean;
  /**
   * Categorical code — never a raw DB error message. This keeps
   * hostnames, credentials, and driver internals out of the
   * publicly-accessible health response.
   */
  stalenessReason?:
    | "timeout"
    | "db_auth_error"
    | "db_connection_error"
    | "db_error";
};

/** Per-probe timeout — must be SHORT to avoid blocking the health endpoint. */
const PROBE_TIMEOUT_MS = 8_000;
/** Latency above which a successful probe is reported as `degraded`. A
 *  provider that's slow but alive is still a problem — it can blow stream
 *  timeouts in coaching and burn user patience. Tune if false positives. */
const PROBE_SLOW_THRESHOLD_MS = 5_000;

/** Minimal probe payload — 1 system token + 1 user word + 5 max output tokens. */
const PROBE_MESSAGES = [{ role: "user" as const, content: "ping" }];
const PROBE_MAX_TOKENS = 5;

/**
 * Build a healthy ProviderHealth result, downgrading to `degraded` if the
 * probe was slow. Centralized so all 3 probes share the same logic.
 */
function buildHealthyResult(
  provider: LLMProvider,
  latencyMs: number,
): ProviderHealth {
  if (latencyMs > PROBE_SLOW_THRESHOLD_MS) {
    return {
      provider,
      status: "degraded",
      latencyMs,
      reason: `slow probe (${latencyMs}ms > ${PROBE_SLOW_THRESHOLD_MS}ms threshold)`,
    };
  }
  return { provider, status: "healthy", latencyMs };
}

/**
 * Validate the format of an API key WITHOUT calling the API.
 * Quick local check that catches the most common deployment mistake
 * (env var not set, copy-paste corruption, wrong provider's key).
 */
export function validateKeyFormat(
  provider: LLMProvider,
  apiKey: string | undefined,
): { valid: boolean; reason?: string } {
  if (!apiKey) return { valid: false, reason: "API key not set" };
  if (apiKey.length < 20)
    return { valid: false, reason: "API key suspiciously short" };

  switch (provider) {
    case "anthropic":
      // Anthropic keys: sk-ant-api03-...
      if (!apiKey.startsWith("sk-ant-")) {
        return {
          valid: false,
          reason: "Anthropic key should start with sk-ant-",
        };
      }
      return { valid: true };
    case "openai":
      // OpenAI keys: sk-... or sk-proj-... (Groq compat: gsk_...)
      if (!apiKey.startsWith("sk-") && !apiKey.startsWith("gsk_")) {
        return {
          valid: false,
          reason: "OpenAI key should start with sk- or gsk_ (Groq)",
        };
      }
      return { valid: true };
    case "gemini":
      // Gemini keys: AIzaSy...
      if (!apiKey.startsWith("AIza")) {
        return {
          valid: false,
          reason: "Gemini key should start with AIza",
        };
      }
      return { valid: true };
  }
}

/** Probe Anthropic with a 5-token completion. */
async function probeAnthropic(): Promise<ProviderHealth> {
  const t0 = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const formatCheck = validateKeyFormat("anthropic", apiKey);
  if (!formatCheck.valid) {
    return {
      provider: "anthropic",
      status: apiKey ? "unhealthy" : "not_configured",
      latencyMs: 0,
      reason: formatCheck.reason,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: PROBE_MAX_TOKENS,
        messages: PROBE_MESSAGES,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    if (!response.ok) {
      const err = LLMError.fromResponse("anthropic", response.status);
      return {
        provider: "anthropic",
        status: err.isAuth ? "unhealthy" : "degraded",
        latencyMs,
        reason: err.message,
        errorCode: err.code,
        httpStatus: response.status,
      };
    }
    return buildHealthyResult("anthropic", latencyMs);
  } catch (err) {
    clearTimeout(timer);
    return {
      provider: "anthropic",
      status: "unhealthy",
      latencyMs: Date.now() - t0,
      reason: err instanceof Error ? err.message : String(err),
      errorCode: "network",
    };
  }
}

/** Probe OpenAI with a 5-token completion. */
async function probeOpenAI(): Promise<ProviderHealth> {
  const t0 = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  const formatCheck = validateKeyFormat("openai", apiKey);
  if (!formatCheck.valid) {
    return {
      provider: "openai",
      status: apiKey ? "unhealthy" : "not_configured",
      latencyMs: 0,
      reason: formatCheck.reason,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_tokens: PROBE_MAX_TOKENS,
        messages: PROBE_MESSAGES,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    if (!response.ok) {
      const err = LLMError.fromResponse("openai", response.status);
      return {
        provider: "openai",
        status: err.isAuth ? "unhealthy" : "degraded",
        latencyMs,
        reason: err.message,
        errorCode: err.code,
        httpStatus: response.status,
      };
    }
    return buildHealthyResult("openai", latencyMs);
  } catch (err) {
    clearTimeout(timer);
    return {
      provider: "openai",
      status: "unhealthy",
      latencyMs: Date.now() - t0,
      reason: err instanceof Error ? err.message : String(err),
      errorCode: "network",
    };
  }
}

/** Probe Gemini with a 5-token completion. */
async function probeGemini(): Promise<ProviderHealth> {
  const t0 = Date.now();
  const apiKey = process.env.GOOGLE_API_KEY;
  const formatCheck = validateKeyFormat("gemini", apiKey);
  if (!formatCheck.valid) {
    return {
      provider: "gemini",
      status: apiKey ? "unhealthy" : "not_configured",
      latencyMs: 0,
      reason: formatCheck.reason,
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey!,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: PROBE_MAX_TOKENS },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    if (!response.ok) {
      const err = LLMError.fromResponse("gemini", response.status);
      return {
        provider: "gemini",
        status: err.isAuth ? "unhealthy" : "degraded",
        latencyMs,
        reason: err.message,
        errorCode: err.code,
        httpStatus: response.status,
      };
    }
    return buildHealthyResult("gemini", latencyMs);
  } catch (err) {
    clearTimeout(timer);
    return {
      provider: "gemini",
      status: "unhealthy",
      latencyMs: Date.now() - t0,
      reason: err instanceof Error ? err.message : String(err),
      errorCode: "network",
    };
  }
}

/**
 * Run a probe against every configured provider in parallel.
 * Returns an aggregate report with overall status:
 *   - healthy   = all configured providers healthy
 *   - degraded  = at least one healthy, but not all
 *   - unhealthy = no provider is healthy (all auth/network failures)
 */
export async function checkAllProviders(): Promise<LLMHealthReport> {
  const results = await Promise.all([
    probeAnthropic(),
    probeOpenAI(),
    probeGemini(),
  ]);

  const configured = results.filter((r) => r.status !== "not_configured");
  const healthy = configured.filter((r) => r.status === "healthy");

  let overallStatus: LLMHealthReport["overallStatus"];
  if (configured.length === 0 || healthy.length === 0) {
    overallStatus = "unhealthy";
  } else if (healthy.length === configured.length) {
    overallStatus = "healthy";
  } else {
    overallStatus = "degraded";
  }

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    providers: results,
  };
}

/** Probe a single provider by name. Used by targeted health checks. */
export async function checkProvider(
  provider: LLMProvider,
): Promise<ProviderHealth> {
  switch (provider) {
    case "anthropic":
      return probeAnthropic();
    case "openai":
      return probeOpenAI();
    case "gemini":
      return probeGemini();
  }
}
