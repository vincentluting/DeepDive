// ============================================================
// Multi-provider AI Model Router
// Unified entry point for all LLM calls. Routes tasks to the
// optimal provider (Anthropic Claude or OpenAI GPT) based on
// task type.
//
// Usage:
//   import { callLLM, streamLLM } from '@/lib/ai/model-router'
//   const text = await callLLM('profile-narrative', messages)
//   const response = await streamLLM('coaching', messages, { routeName })
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { LLMError } from "./llm-error";
import { getProviderLimiter, getProviderSemaphore } from "./concurrency";
import { getOpenAIClient } from "./openai-client";
import {
  getAnthropicClient,
  isAnthropicAvailable,
  type AnthropicMessage,
  type AnthropicSystemBlock,
} from "./anthropic-client";
import { logLLMUsage, getRecentProviderFailures } from "../db/llm-usage";
import { callGemini, isGeminiAvailable } from "./gemini-client";
import { getMockResponse, getMockStreamResponse } from "./test-fixtures";
import { selectHealthiest } from "./provider-health";

const __DEV__ = process.env.NODE_ENV === "development";

// ── Model versions (override via env vars for easy switching) ──

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ── Test mode: mock (free, fast) or cheap (real API, minimal cost) ──
const LLM_TEST_MODE = process.env.LLM_TEST_MODE as "mock" | "cheap" | undefined;
const HAIKU_MODEL =
  process.env.ANTHROPIC_HAIKU_MODEL || "claude-haiku-4-5-20251001";

// Groq free tier for E2E testing — routes ALL tasks through Groq's OpenAI-compatible API
const USE_GROQ =
  process.env.E2E_USE_GROQ === "true" && !!process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// ── Types ──

type Provider = "anthropic" | "openai" | "gemini";

interface TaskConfig {
  provider: Provider;
  model: string;
  temperature: number;
  maxTokens: number;
  fallbackProviders: Provider[];
}

type Message = { role: "system" | "user" | "assistant"; content: string };

export interface CallLLMOptions {
  /** Override max_tokens for this call. */
  maxTokens?: number;
  /** Override temperature for this call. */
  temperature?: number;
  /** Request JSON output. OpenAI uses response_format; Anthropic gets a system prompt suffix. */
  responseFormat?: "json" | "text";
  /** Enable Anthropic prompt caching on the system message. Reduces input token cost by ~90% for shared prefixes across sequential/parallel calls. */
  enableCache?: boolean;
  /** JSON Schema for native structured output (set by callLLMStructured). */
  _jsonSchema?: { name: string; schema: Record<string, unknown> };
  /** Override per-call timeout (ms). Defaults to CALL_TIMEOUT_MS (90s). */
  timeoutMs?: number;
}

export interface StreamLLMOptions {
  /** Route name for error logging (e.g. '/api/coaching-chat'). */
  routeName: string;
  /** Override max_tokens for this call. */
  maxTokens?: number;
  /** Override temperature for this call. */
  temperature?: number;
  /** Called when the stream encounters an error. */
  onStreamError?: (err: unknown) => void;
}

// ── Task-to-model mapping ──

export type LLMTask =
  | "profile-narrative"
  | "career-match-narrative"
  | "integration"
  | "coaching"
  | "coaching-first"
  | "career-pathway"
  | "resume-parse"
  | "memory-extract"
  | "coaching-summary"
  | "action-plan-enrich"
  | "career-tier-inference";

const TASK_CONFIG: Record<string, TaskConfig> = {
  // Narrative tasks → Claude Sonnet (better writing quality)
  "profile-narrative": {
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    temperature: 0.6,
    maxTokens: 6000,
    fallbackProviders: ["gemini"],
  },
  "career-match-narrative": {
    provider: "gemini",
    model: GEMINI_MODEL,
    temperature: 0.5,
    maxTokens: 2000,
    fallbackProviders: ["anthropic", "openai"],
  },
  integration: {
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    temperature: 0.5,
    maxTokens: 2000,
    fallbackProviders: ["gemini"],
  },
  coaching: {
    provider: "anthropic",
    model: ANTHROPIC_MODEL,
    temperature: 0.7,
    maxTokens: 1500,
    fallbackProviders: ["openai"],
  },
  "coaching-first": {
    provider: "anthropic",
    model: HAIKU_MODEL,
    temperature: 0.7,
    maxTokens: 800,
    fallbackProviders: ["openai"],
  },

  // Structured tasks → stay on GPT-4o-mini (cost-effective)
  "career-pathway": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.4,
    maxTokens: 1000,
    fallbackProviders: ["gemini"],
  },
  "resume-parse": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.2,
    maxTokens: 1000,
    fallbackProviders: ["gemini"],
  },
  "memory-extract": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.3,
    maxTokens: 500,
    fallbackProviders: ["gemini"],
  },
  "coaching-summary": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.3,
    maxTokens: 500,
    fallbackProviders: ["gemini"],
  },

  // Action Hub Personal Plan enrichment — rewrites algorithm-ranked seeds
  // into warm second-person prose that explicitly references the user's
  // flow tags + non-negotiables. Output is JSON, validated by Zod in
  // lib/action-hub/llm-enrich.ts. Falls back to algorithm titles on failure.
  "action-plan-enrich": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.5,
    maxTokens: 2000,
    fallbackProviders: ["gemini", "anthropic"],
  },

  // One-shot offline backfill — classifies the ~225 curated/emerging
  // CareerDirection rows into an O*NET Job Zone (2-5). Output is strict
  // JSON validated by Zod in scripts/backfill-career-job-zone-llm.ts.
  // Low temperature for deterministic classification; small token budget.
  "career-tier-inference": {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.1,
    maxTokens: 300,
    fallbackProviders: ["gemini", "anthropic"],
  },
} as const;

const STREAMING_PROVIDERS = new Set<Provider>(["anthropic", "openai"]);

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case "anthropic":
      return ANTHROPIC_MODEL;
    case "openai":
      return OPENAI_MODEL;
    case "gemini":
      return GEMINI_MODEL;
  }
}

function isProviderAvailable(provider: Provider): boolean {
  switch (provider) {
    case "anthropic":
      return isAnthropicAvailable();
    case "openai":
      return USE_GROQ || !!process.env.OPENAI_API_KEY;
    case "gemini":
      return isGeminiAvailable();
  }
}

function getRemainingFallbackProviders(
  task: string,
  currentProvider: Provider,
  options?: { streaming?: boolean; overrideChain?: readonly Provider[] },
): Provider[] {
  const config = TASK_CONFIG[task];
  // Health-aware routing passes overrideChain = full health-ordered
  // preference (current primary first). When absent, we reconstruct
  // the static chain from TASK_CONFIG as before.
  const providerChain: Provider[] = options?.overrideChain
    ? [...options.overrideChain]
    : [
        config.provider,
        ...config.fallbackProviders.filter(
          (provider, index, allProviders) =>
            provider !== config.provider &&
            allProviders.indexOf(provider) === index,
        ),
      ];
  const currentIndex = providerChain.indexOf(currentProvider);
  const remainingProviders = providerChain.slice(
    currentIndex >= 0 ? currentIndex + 1 : 1,
  );
  if (options?.streaming) {
    return remainingProviders.filter((provider) =>
      STREAMING_PROVIDERS.has(provider),
    );
  }
  return remainingProviders;
}

function getFallbackConfig(
  task: string,
  currentProvider: Provider,
  options?: { streaming?: boolean; overrideChain?: readonly Provider[] },
): { provider: Provider; model: string } | null {
  const fallbackProvider = getRemainingFallbackProviders(
    task,
    currentProvider,
    options,
  ).find((provider) => isProviderAvailable(provider));

  if (!fallbackProvider) return null;

  // Health-aware routing can bring the task's declared primary back into
  // the failover chain (e.g. gemini demoted, then openai fails, then we
  // retry anthropic which was the original primary). In that case we
  // must respect the task's configured model, not the provider default —
  // otherwise coaching-first silently upgrades from HAIKU_MODEL to
  // ANTHROPIC_MODEL (Sonnet) and blows its latency/cost budget.
  const config = TASK_CONFIG[task];
  const model =
    config && fallbackProvider === config.provider
      ? config.model
      : getDefaultModel(fallbackProvider);

  return { provider: fallbackProvider, model };
}

/**
 * Build the health-aware override chain for passing to getFallbackConfig.
 * Always starts with the current effective provider so subsequent failovers
 * iterate the health-ordered tail (not static TASK_CONFIG order).
 * Dedupes because the sync resolveConfig may leave effectiveProvider as an
 * entry that also appears in fallbackProviders (e.g. when primary was
 * unavailable and a fallback slot matched the same provider class).
 */
function buildOverrideChain(
  resolved: TaskConfig & { effectiveProvider: Provider },
): Provider[] {
  const seen = new Set<Provider>();
  const chain: Provider[] = [];
  for (const p of [resolved.effectiveProvider, ...resolved.fallbackProviders]) {
    if (!seen.has(p)) {
      seen.add(p);
      chain.push(p);
    }
  }
  return chain;
}

function buildRoutingError(
  task: string,
  provider: Provider,
  reason: string,
  approvedFallbacks: Provider[],
): Error {
  const fallbackLabel =
    approvedFallbacks.length > 0 ? approvedFallbacks.join(" -> ") : "none";
  return new Error(
    `[model-router] Cannot route task "${task}": ${reason} for provider "${provider}". Approved fallback chain: ${fallbackLabel}.`,
  );
}

function captureDegradedRoute(
  task: string,
  originalProvider: Provider,
  fallbackProvider: Provider,
  reason: string,
): void {
  Sentry.captureMessage("LLM provider degraded", {
    level: "warning",
    extra: {
      task,
      originalProvider,
      fallbackProvider,
      reason,
    },
  });
}

/**
 * Resolve the effective provider for a task.
 * Falls back to OpenAI when ANTHROPIC_API_KEY is not set.
 */
function resolveConfig(
  task: string,
): TaskConfig & { effectiveProvider: Provider } {
  const config = TASK_CONFIG[task];
  if (!config) {
    throw new Error(`[model-router] Unknown task: "${task}"`);
  }

  // Groq mode: route ALL tasks through OpenAI-compatible client (pointing to Groq)
  if (USE_GROQ) {
    if (__DEV__)
      console.log(
        `[model-router] Groq mode: routing "${task}" → ${GROQ_MODEL}`,
      );
    return {
      ...config,
      effectiveProvider: "openai",
      model: GROQ_MODEL,
    };
  }

  if (!isProviderAvailable(config.provider)) {
    const approvedFallbacks = getRemainingFallbackProviders(
      task,
      config.provider,
    );
    const fallback = getFallbackConfig(task, config.provider);
    if (!fallback) {
      throw buildRoutingError(
        task,
        config.provider,
        "primary provider is unavailable",
        approvedFallbacks,
      );
    }

    console.warn(
      `[model-router] Primary provider unavailable for "${task}", routing to ${fallback.provider}`,
    );
    captureDegradedRoute(
      task,
      config.provider,
      fallback.provider,
      "primary provider unavailable",
    );
    return {
      ...config,
      effectiveProvider: fallback.provider,
      model: fallback.model,
    };
  }

  // Circuit breaker: skip provider if it's been failing consistently
  if (isCircuitOpen(config.provider)) {
    const fallback = getFallbackConfig(task, config.provider);
    if (fallback) {
      console.warn(
        `[model-router] Circuit open for ${config.provider}, routing "${task}" → ${fallback.provider}`,
      );
      captureDegradedRoute(
        task,
        config.provider,
        fallback.provider,
        "primary circuit open",
      );
      return {
        ...config,
        effectiveProvider: fallback.provider,
        model: fallback.model,
      };
    }
  }

  return { ...config, effectiveProvider: config.provider };
}

/**
 * Health-aware wrapper around resolveConfig.
 *
 * Runs AFTER the sync circuit breaker / availability checks. When the
 * sync layer stayed on the original primary, consult provider-health.
 * If a demotion is recommended, pick the first orderedChain entry that
 * is both API-key-available AND circuit-closed as the new primary, and
 * rebuild the fallback chain so every healthy candidate stays reachable
 * (including the demoted original primary at the tail).
 *
 * Soft selection only:
 *   - Respects sync verdict: if resolveConfig already diverted us
 *     (circuit / availability), we leave it alone.
 *   - Kill switch (LLM_HEALTH_ROUTING_DISABLED=1) → selectHealthiest
 *     short-circuits to identity → pure pass-through, no DB cost.
 *   - DB unreachable → selectHealthiest silently returns identity,
 *     never throws.
 */
async function resolveConfigAsync(
  task: string,
): Promise<TaskConfig & { effectiveProvider: Provider }> {
  const resolved = resolveConfig(task);
  const baseConfig = TASK_CONFIG[task];
  if (!baseConfig) return resolved;

  if (resolved.effectiveProvider !== baseConfig.provider) {
    return resolved;
  }

  const preferenceChain = [
    baseConfig.provider,
    ...baseConfig.fallbackProviders,
  ] as Provider[];
  const selection = await selectHealthiest(preferenceChain);

  if (selection.demoted.length === 0) {
    return resolved;
  }

  // Find the first provider in the health-ordered chain that is also
  // available + circuit-closed. If none qualifies (e.g. all circuits
  // open), fall back to the sync result — circuit has the final say.
  let chosenIdx = -1;
  for (let i = 0; i < selection.orderedChain.length; i++) {
    const candidate = selection.orderedChain[i];
    if (isProviderAvailable(candidate) && !isCircuitOpen(candidate)) {
      chosenIdx = i;
      break;
    }
  }
  if (chosenIdx === -1) {
    return resolved;
  }

  const chosen = selection.orderedChain[chosenIdx];
  if (chosen === baseConfig.provider) {
    // Original primary bubbled back up (other candidates all gated out).
    // No demotion actually applied — keep sync result.
    return resolved;
  }

  // Rebuild fallback chain: every provider in orderedChain except the
  // chosen one, in health-aware order. This keeps the demoted original
  // primary reachable as a last-resort fallback (addresses the "only
  // primary was swapped" gap: without this, a call that fails over
  // from a healthy-but-new primary would not retry the demoted original
  // primary even if it was just degraded, not dead).
  const reorderedFallbacks = selection.orderedChain.filter(
    (_, idx) => idx !== chosenIdx,
  );

  const demotedReason =
    selection.demoted.find((d) => d.provider === baseConfig.provider)?.reason ??
    `health-demoted: chose ${chosen} over ${baseConfig.provider}`;
  captureDegradedRoute(
    task,
    baseConfig.provider,
    chosen,
    `health-demoted: ${demotedReason}`,
  );

  // IMPORTANT: do NOT overwrite `provider`. Downstream logLLMUsage relies
  // on `effectiveProvider !== provider` to tag the call as `degraded: true`
  // for monitoring (/api/cron/llm-digest). If we flipped `provider` to the
  // chosen candidate, every health-demoted call would be silently logged
  // as a normal call and the operator dashboard would undercount degradation.
  return {
    ...baseConfig,
    effectiveProvider: chosen,
    model: getDefaultModel(chosen),
    fallbackProviders: reorderedFallbacks,
  };
}

// ── JSON instruction suffix for Anthropic ──

const ANTHROPIC_JSON_SUFFIX =
  "\n\nIMPORTANT: You must respond with valid JSON only. No markdown fences, no explanation text outside the JSON object.";

// ── Retry helpers ──

/** Max retries for transient errors (429, 529, 5xx, timeout). */
const MAX_RETRIES = 3;
/** Base delay for exponential backoff (ms). */
const BASE_RETRY_DELAY_MS = 1_000;
/** Longer base delay for 529 overloaded responses (ms) — Anthropic recommends starting at 4s. */
const OVERLOADED_BASE_DELAY_MS = 4_000;
/** Maximum backoff cap per retry (ms). */
const MAX_BACKOFF_MS = 30_000;
/** Cap for honored retry-after header (ms). Prevents pathological waits. */
const RETRY_AFTER_CAP_MS = 60_000;
/** Per-call timeout for non-streaming requests (ms). Matches streaming's overall timeout. */
const CALL_TIMEOUT_MS = 90_000;
/** Global timeout for the entire callLLM invocation (primary + retries + failover).
 * Prevents pathological slow-network scenarios from exceeding Vercel's maxDuration.
 * Set to 250s to stay safely under the 300s report route maxDuration. */
const GLOBAL_CALL_TIMEOUT_MS = 250_000;

/**
 * Compute backoff delay for a retry attempt.
 *
 * Strategy (in priority order):
 * 1. If error carries `retryAfterMs` (parsed from upstream `retry-after`
 *    header), honor it precisely — capped at RETRY_AFTER_CAP_MS to prevent
 *    pathological waits if the server sends a huge value.
 * 2. If error is a 529 overloaded response, start with the longer base delay
 *    (Anthropic recommends 4s+ for 529 to avoid hammering an upstream that
 *    is already under pressure).
 * 3. Otherwise classic exponential backoff: BASE * 2^retryIndex, capped at
 *    MAX_BACKOFF_MS.
 *
 * All paths add ±20% jitter to spread retries from concurrent callers and
 * avoid thundering-herd effects.
 *
 * @param retryIndex 0-based retry index (0 = first retry, 1 = second, ...)
 */
export function getBackoffMs(retryIndex: number, err?: unknown): number {
  if (err instanceof LLMError && err.retryAfterMs !== undefined) {
    return Math.min(err.retryAfterMs, RETRY_AFTER_CAP_MS);
  }
  const baseDelay =
    err instanceof LLMError && err.isOverloaded
      ? OVERLOADED_BASE_DELAY_MS
      : BASE_RETRY_DELAY_MS;
  const exponential = Math.min(
    MAX_BACKOFF_MS,
    baseDelay * Math.pow(2, retryIndex),
  );
  // ±20% jitter
  const jitter = exponential * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(exponential + jitter));
}

// ── Circuit breaker: skip providers that fail repeatedly ──
// When a provider hits CIRCUIT_FAILURE_THRESHOLD consecutive failures,
// the circuit opens and requests route directly to the fallback provider.
// After CIRCUIT_COOLDOWN_MS, one probe request is allowed through (half-open).

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** Consecutive 529 overloaded errors to trigger soft-circuit (route to fallback proactively).
 * 529s don't count toward the hard circuit, but sustained 529s should still trigger failover
 * to avoid burning ~28s of retry delays per request during prolonged Anthropic overload. */
const OVERLOADED_SOFT_CIRCUIT_THRESHOLD = 5;

interface CircuitState {
  consecutiveFailures: number;
  lastFailureAt: number;
  probing: boolean;
  /** Count of consecutive 529 overloaded errors (reset on success or non-529 error). */
  consecutiveOverloaded: number;
}

const _circuits = new Map<Provider, CircuitState>();

function _getCircuit(provider: Provider): CircuitState {
  let c = _circuits.get(provider);
  if (!c) {
    c = {
      consecutiveFailures: 0,
      lastFailureAt: 0,
      probing: false,
      consecutiveOverloaded: 0,
    };
    _circuits.set(provider, c);
  }
  return c;
}

function isCircuitOpen(provider: Provider): boolean {
  const c = _getCircuit(provider);
  // Soft circuit for sustained 529 overloaded — avoids burning 28s of retry
  // delays per request during prolonged Anthropic overload events.
  if (c.consecutiveOverloaded >= OVERLOADED_SOFT_CIRCUIT_THRESHOLD) {
    if (Date.now() - c.lastFailureAt > CIRCUIT_COOLDOWN_MS) {
      if (!c.probing) {
        c.probing = true;
        return false;
      }
      return true;
    }
    return true;
  }
  if (c.consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) return false;
  // Cooldown expired → half-open, allow exactly one probe request
  if (Date.now() - c.lastFailureAt > CIRCUIT_COOLDOWN_MS) {
    if (!c.probing) {
      c.probing = true;
      return false;
    }
    return true;
  }
  return true;
}

function recordProviderSuccess(provider: Provider): void {
  const c = _getCircuit(provider);
  if (c.consecutiveFailures > 0 || c.probing || c.consecutiveOverloaded > 0) {
    console.log(`[model-router] Circuit closed for ${provider} after success`);
  }
  c.consecutiveFailures = 0;
  c.consecutiveOverloaded = 0;
  c.probing = false;
}

function recordProviderFailure(provider: Provider, err?: unknown): void {
  const c = _getCircuit(provider);

  // Auth errors (401/403) immediately open the circuit. The API key is bad
  // and retrying will only waste latency until the operator fixes it. This
  // is the case that bit us 2026-04-02 → 04-04: 41 wasted Anthropic calls.
  if (err instanceof LLMError && err.isAuth) {
    if (c.consecutiveFailures < CIRCUIT_FAILURE_THRESHOLD) {
      console.warn(
        `[model-router] Circuit OPEN for ${provider} immediately after auth error (HTTP ${err.status}) — routing to fallback for ${CIRCUIT_COOLDOWN_MS / 1000}s`,
      );
    }
    c.consecutiveFailures = CIRCUIT_FAILURE_THRESHOLD;
    c.lastFailureAt = Date.now();
    c.probing = false;
    return;
  }

  // 529 overloaded is upstream-wide pressure across all customers, NOT a
  // sign that the provider is broken for us specifically. Don't count it
  // toward the hard circuit, but track consecutive 529s for soft-circuit
  // to avoid burning ~28s of retry delays during sustained overload events.
  if (err instanceof LLMError && err.isOverloaded) {
    c.consecutiveOverloaded++;
    c.lastFailureAt = Date.now();
    if (c.consecutiveOverloaded === OVERLOADED_SOFT_CIRCUIT_THRESHOLD) {
      console.warn(
        `[model-router] Soft circuit OPEN for ${provider} after ${c.consecutiveOverloaded} consecutive 529s — routing to fallback`,
      );
    }
    return;
  }

  // Non-529 error resets the overloaded counter
  c.consecutiveOverloaded = 0;

  c.consecutiveFailures++;
  c.lastFailureAt = Date.now();
  c.probing = false;
  if (c.consecutiveFailures === CIRCUIT_FAILURE_THRESHOLD) {
    console.warn(
      `[model-router] Circuit OPEN for ${provider} after ${c.consecutiveFailures} consecutive failures — routing to fallback for ${CIRCUIT_COOLDOWN_MS / 1000}s`,
    );
  }
}

/** Check if an error is transient and worth retrying. */
function isRetryableError(err: unknown): boolean {
  // Typed LLM errors carry a pre-computed retryable flag
  if (err instanceof LLMError) return err.retryable;
  // Fallback for non-provider errors (e.g. callWithTimeout wrapper)
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("timed out") || msg.includes("timeout")) return true;
  if (msg.includes("overloaded")) return true;
  return false;
}

// ── Cold-start circuit breaker seeding ──
// On first LLM call, query recent failure rates from DB to give this instance
// fleet-wide awareness of ongoing provider outages. Runs once per cold start.
// If the DB query fails, we silently fall back to in-memory-only (no blocking).

let _seedPromise: Promise<void> | null = null;

function ensureCircuitsSeeded(): Promise<void> {
  if (_seedPromise) return _seedPromise;
  if (USE_GROQ || LLM_TEST_MODE === "mock") {
    _seedPromise = Promise.resolve();
    return _seedPromise;
  }
  _seedPromise = seedCircuitsFromDB().catch((err) => {
    // DB unreachable on cold start — degrade gracefully to in-memory only.
    // Log unconditionally so production seed failures show up in Vercel logs.
    console.warn("[model-router] Circuit seed from DB failed:", err);
  });
  return _seedPromise;
}

async function seedCircuitsFromDB(): Promise<void> {
  const rows = await getRecentProviderFailures(5);
  for (const row of rows) {
    const provider = row.provider as Provider;
    if (!["anthropic", "openai", "gemini"].includes(provider)) continue;
    const failureRate =
      row.totalCalls > 0 ? row.failureCount / row.totalCalls : 0;
    // Pre-open circuit if >50% failure rate with sufficient samples
    if (failureRate > 0.5 && row.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
      const c = _getCircuit(provider);
      // Only seed if circuit isn't already populated (avoid overwriting live state)
      if (c.consecutiveFailures === 0) {
        c.consecutiveFailures = CIRCUIT_FAILURE_THRESHOLD;
        c.lastFailureAt = Date.now();
        console.log(
          `[model-router] Cold-start seed: circuit OPEN for ${provider} (${row.failureCount}/${row.totalCalls} failures in last 5min)`,
        );
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wrap a provider call with an explicit timeout. Throws on timeout. */
async function callWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`LLM call timed out after ${timeoutMs / 1000}s`));
      }
    }, timeoutMs);

    fn().then(
      (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      },
      (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      },
    );
  });
}

// ── Unified provider dispatch (DRY: replaces 4 identical if/else-if/else blocks) ──

/** Provider call result with optional cache metrics. */
type ProviderResult = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

async function dispatchProvider(
  provider: Provider,
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    wantJson: boolean;
    enableCache?: boolean;
    jsonSchema?: { name: string; schema: Record<string, unknown> };
    timeoutMs: number;
  },
): Promise<ProviderResult> {
  const limiter = getProviderLimiter(provider);
  if (provider === "gemini") {
    return limiter(() =>
      callWithTimeout(
        () =>
          callGeminiProvider(model, messages, {
            maxTokens: opts.maxTokens,
            temperature: opts.temperature,
            wantJson: opts.wantJson,
            jsonSchema: opts.jsonSchema,
          }),
        opts.timeoutMs,
      ),
    );
  } else if (provider === "anthropic") {
    return limiter(() =>
      callWithTimeout(
        () =>
          callAnthropic(model, messages, {
            maxTokens: opts.maxTokens,
            temperature: opts.temperature,
            wantJson: opts.wantJson,
            enableCache: opts.enableCache,
            jsonSchema: opts.jsonSchema,
          }),
        opts.timeoutMs,
      ),
    );
  } else {
    return limiter(() =>
      callWithTimeout(
        () =>
          callOpenAI(model, messages, {
            maxTokens: opts.maxTokens,
            temperature: opts.temperature,
            wantJson: opts.wantJson,
            jsonSchema: opts.jsonSchema,
          }),
        opts.timeoutMs,
      ),
    );
  }
}

// ── Non-streaming call ──

/**
 * Call an LLM for a given task. Routes to the correct provider automatically.
 * Returns the raw text content from the LLM response.
 *
 * Includes up to 3 automatic retries for transient errors (429, 5xx, timeouts)
 * with exponential backoff + jitter, plus 1 provider failover chain.
 *
 * @param task - Task name from TASK_CONFIG (e.g. 'profile-narrative')
 * @param messages - Array of {role, content} messages (system + user + assistant)
 * @param options - Optional overrides for maxTokens, temperature, responseFormat
 */
export async function callLLM(
  task: LLMTask,
  messages: Message[],
  options?: CallLLMOptions,
): Promise<string> {
  // ── Seed circuit breaker from DB on cold start (once per instance) ──
  await ensureCircuitsSeeded();

  // ── Mock mode: return pre-recorded fixture (zero cost, zero latency) ──
  if (LLM_TEST_MODE === "mock") {
    const mock = getMockResponse(task);
    if (mock) {
      logLLMUsage({
        taskName: task,
        provider: "openai",
        model: "mock",
        inputTokens: mock.inputTokens,
        outputTokens: mock.outputTokens,
        latencyMs: 1,
        success: true,
        degraded: false,
      });
      return mock.text;
    }
  }

  const resolved = await resolveConfigAsync(task);
  const maxTokens = options?.maxTokens ?? resolved.maxTokens;
  const temperature = options?.temperature ?? resolved.temperature;
  const wantJson = (options?.responseFormat ?? "text") === "json";
  const effectiveTimeout = options?.timeoutMs ?? CALL_TIMEOUT_MS;
  const jsonSchema = (options as Record<string, unknown> | undefined)
    ?._jsonSchema as
    | { name: string; schema: Record<string, unknown> }
    | undefined;

  let lastError: unknown;
  const callStart = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Global timeout guard: abort if remaining time is insufficient for another attempt.
    // Prevents pathological slow-network scenarios from exceeding Vercel maxDuration.
    const elapsed = Date.now() - callStart;
    if (elapsed > GLOBAL_CALL_TIMEOUT_MS) {
      console.warn(
        `[model-router] Global timeout reached for "${task}" after ${Math.round(elapsed / 1000)}s (${attempt} attempts)`,
      );
      break;
    }

    if (attempt > 0) {
      const backoffMs = getBackoffMs(attempt - 1, lastError);
      console.warn(
        `[model-router] Retrying task "${task}" (attempt ${attempt + 1}/${MAX_RETRIES + 1}) after ${backoffMs}ms`,
      );
      await delay(backoffMs);
    }

    const t0 = Date.now();
    try {
      const result = await dispatchProvider(
        resolved.effectiveProvider,
        resolved.model,
        messages,
        {
          maxTokens,
          temperature,
          wantJson,
          enableCache: options?.enableCache,
          jsonSchema,
          timeoutMs: effectiveTimeout,
        },
      );

      logLLMUsage({
        taskName: task,
        provider: resolved.effectiveProvider,
        model: resolved.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: Date.now() - t0,
        success: true,
        degraded: resolved.effectiveProvider !== resolved.provider,
        cacheReadTokens: result.cacheReadTokens,
        cacheWriteTokens: result.cacheWriteTokens,
      });
      recordProviderSuccess(resolved.effectiveProvider as Provider);

      // Strip markdown code fences from JSON responses — Anthropic sometimes
      // wraps JSON in ```json ... ``` despite being instructed not to.
      if (wantJson) {
        const trimmed = result.text.trim();
        const fenceMatch = trimmed.match(
          /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/,
        );
        if (fenceMatch) {
          return fenceMatch[1].trim();
        }
      }

      return result.text;
    } catch (err) {
      lastError = err;

      logLLMUsage({
        taskName: task,
        provider: resolved.effectiveProvider,
        model: resolved.model,
        latencyMs: Date.now() - t0,
        success: false,
        degraded: resolved.effectiveProvider !== resolved.provider,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      recordProviderFailure(resolved.effectiveProvider as Provider, err);

      // Only retry transient errors; auth/config errors should fail immediately
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        Sentry.captureMessage("LLM call retrying", {
          level: "warning",
          extra: {
            task,
            attempt: attempt + 1,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        continue;
      }

      Sentry.captureException(err, {
        tags: {
          task,
          provider: resolved.effectiveProvider,
          model: resolved.model,
        },
        extra: { attempt: attempt + 1 },
      });

      // ── Provider failover: try backup provider before giving up ──
      // Failover gets the same retry treatment as the primary (1 retry, 2s backoff).
      if (!USE_GROQ) {
        const failover = getFallbackConfig(task, resolved.effectiveProvider, {
          overrideChain: buildOverrideChain(resolved),
        });
        if (failover) {
          console.warn(
            `[model-router] Primary provider failed for "${task}", trying failover: ${failover.provider}/${failover.model}`,
          );
          captureDegradedRoute(
            task,
            resolved.effectiveProvider,
            failover.provider,
            "primary provider failed after retries",
          );

          let failoverLastErr: unknown;
          for (let fAttempt = 0; fAttempt <= MAX_RETRIES; fAttempt++) {
            // Global timeout guard (shared with primary loop above)
            if (Date.now() - callStart > GLOBAL_CALL_TIMEOUT_MS) {
              console.warn(
                `[model-router] Global timeout reached during failover for "${task}"`,
              );
              break;
            }

            if (fAttempt > 0) {
              const fBackoffMs = getBackoffMs(fAttempt - 1, failoverLastErr);
              console.warn(
                `[model-router] Retrying failover for "${task}" (attempt ${fAttempt + 1}/${MAX_RETRIES + 1}) after ${fBackoffMs}ms`,
              );
              await delay(fBackoffMs);
            }

            const ft0 = Date.now();
            try {
              const failoverResult = await dispatchProvider(
                failover.provider,
                failover.model,
                messages,
                {
                  maxTokens,
                  temperature,
                  wantJson,
                  enableCache: options?.enableCache,
                  jsonSchema,
                  timeoutMs: effectiveTimeout,
                },
              );

              logLLMUsage({
                taskName: task,
                provider: failover.provider,
                model: failover.model,
                inputTokens: failoverResult.inputTokens,
                outputTokens: failoverResult.outputTokens,
                latencyMs: Date.now() - ft0,
                success: true,
                degraded: true,
                cacheReadTokens: failoverResult.cacheReadTokens,
                cacheWriteTokens: failoverResult.cacheWriteTokens,
              });

              if (wantJson) {
                const trimmed = failoverResult.text.trim();
                const fenceMatch = trimmed.match(
                  /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/,
                );
                if (fenceMatch) return fenceMatch[1].trim();
              }
              recordProviderSuccess(failover.provider);
              return failoverResult.text;
            } catch (failoverErr) {
              failoverLastErr = failoverErr;
              logLLMUsage({
                taskName: task,
                provider: failover.provider,
                model: failover.model,
                latencyMs: Date.now() - ft0,
                success: false,
                degraded: true,
                errorMessage:
                  failoverErr instanceof Error
                    ? failoverErr.message
                    : String(failoverErr),
              });

              // Retry transient errors on failover too
              if (fAttempt < MAX_RETRIES && isRetryableError(failoverErr)) {
                continue;
              }

              console.error(
                `[model-router] Failover also failed for "${task}":`,
                failoverErr instanceof Error
                  ? failoverErr.message
                  : failoverErr,
              );
            }
          }
          // If we exhausted failover retries, log the last failover error but
          // still throw the original primary error below.
          if (failoverLastErr) {
            recordProviderFailure(failover.provider, failoverLastErr);
          }
        }
      }

      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

// ── Streaming failover helper ──

/**
 * Attempt a streaming failover call to the backup provider.
 * Shared by the non-ok response path and the catch (throw) path in streamLLM.
 * Returns the failover Response if successful, or null if failover fails/unavailable.
 */
async function tryStreamFailover(
  task: string,
  failover: { provider: Provider; model: string },
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    routeName: string;
    onStreamError?: (err: unknown) => void;
    t0: number;
    reason: string;
  },
): Promise<Response | null> {
  console.warn(
    `[model-router] Stream ${opts.reason} for "${task}", trying failover: ${failover.provider}/${failover.model}`,
  );
  const streamSem = getProviderSemaphore(failover.provider);
  const rawRelease = await streamSem.acquire();
  let slotReleased = false;
  const releaseSlot = () => {
    if (!slotReleased) {
      slotReleased = true;
      rawRelease();
    }
  };
  try {
    let failoverResponse: Response;
    if (failover.provider === "anthropic") {
      failoverResponse = await streamAnthropic(failover.model, messages, {
        maxTokens: opts.maxTokens,
        temperature: opts.temperature,
        routeName: opts.routeName,
        onStreamError: opts.onStreamError,
        onFinally: releaseSlot,
        onComplete: (usage) => {
          logLLMUsage({
            taskName: task,
            provider: failover.provider,
            model: failover.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: Date.now() - opts.t0,
            success: true,
            degraded: true,
            cacheReadTokens: usage.cacheReadTokens,
            cacheWriteTokens: usage.cacheWriteTokens,
          });
        },
      });
    } else {
      const { fetchOpenAIChatStream } =
        await import("./stream-openai-response");
      failoverResponse = await fetchOpenAIChatStream({
        messages,
        model: failover.model,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        routeName: opts.routeName,
        onStreamError: opts.onStreamError,
        onStreamFinally: releaseSlot,
        onComplete: (usage) => {
          logLLMUsage({
            taskName: task,
            provider: failover.provider,
            model: failover.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: Date.now() - opts.t0,
            success: true,
            degraded: true,
          });
        },
      });
    }
    if (!failoverResponse.ok) {
      releaseSlot();
      return null;
    }
    // OpenAI usage now logged via onComplete; Anthropic via its onComplete above
    return failoverResponse;
  } catch (failoverErr) {
    releaseSlot();
    console.error(
      `[model-router] Stream failover also failed for "${task}":`,
      failoverErr instanceof Error ? failoverErr.message : failoverErr,
    );
    return null;
  }
}

// ── Streaming call ──

/**
 * Start a streaming LLM call for a given task.
 * Returns a `Response` object with a streaming body.
 *
 * Currently streaming is only used for coaching. The function routes
 * to Anthropic or OpenAI streaming depending on the task config.
 */
export async function streamLLM(
  task: LLMTask,
  messages: Message[],
  options: StreamLLMOptions,
): Promise<Response> {
  // ── Seed circuit breaker from DB on cold start (once per instance) ──
  await ensureCircuitsSeeded();

  // ── Mock mode: return pre-recorded streaming fixture ──
  if (LLM_TEST_MODE === "mock") {
    logLLMUsage({
      taskName: task,
      provider: "openai",
      model: "mock",
      latencyMs: 1,
      success: true,
      degraded: false,
    });
    return getMockStreamResponse(task);
  }

  const resolved = await resolveConfigAsync(task);
  const maxTokens = options.maxTokens ?? resolved.maxTokens;
  const temperature = options.temperature ?? resolved.temperature;

  if (__DEV__)
    console.log(
      `[coach-debug][streamLLM] task=${task} provider=${resolved.effectiveProvider} model=${resolved.model} configProvider=${resolved.provider}`,
    );

  // Streaming: acquire semaphore slot, release when stream completes/fails/aborts.
  const streamSem = getProviderSemaphore(resolved.effectiveProvider);
  const rawRelease = await streamSem.acquire();
  let slotReleased = false;
  const releaseSlot = () => {
    if (!slotReleased) {
      slotReleased = true;
      rawRelease();
    }
  };

  const t0 = Date.now();
  try {
    let response: Response;

    if (resolved.effectiveProvider === "anthropic") {
      response = await streamAnthropic(resolved.model, messages, {
        maxTokens,
        temperature,
        routeName: options.routeName,
        onStreamError: options.onStreamError,
        onFinally: releaseSlot,
        onComplete: (usage) => {
          logLLMUsage({
            taskName: task,
            provider: resolved.effectiveProvider,
            model: resolved.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: Date.now() - t0,
            success: true,
            degraded: resolved.effectiveProvider !== resolved.provider,
            cacheReadTokens: usage.cacheReadTokens,
            cacheWriteTokens: usage.cacheWriteTokens,
          });
        },
      });
    } else {
      if (__DEV__)
        console.log(
          `[coach-debug][streamLLM] using OpenAI fallback for task=${task}`,
        );
      // Delegate to existing OpenAI streaming (imported lazily to avoid circular deps)
      const { fetchOpenAIChatStream } =
        await import("./stream-openai-response");
      response = await fetchOpenAIChatStream({
        messages,
        model: resolved.model,
        temperature,
        max_tokens: maxTokens,
        routeName: options.routeName,
        onStreamError: options.onStreamError,
        onStreamFinally: releaseSlot,
        onComplete: (usage) => {
          logLLMUsage({
            taskName: task,
            provider: resolved.effectiveProvider,
            model: resolved.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            latencyMs: Date.now() - t0,
            success: true,
            degraded: resolved.effectiveProvider !== resolved.provider,
          });
        },
      });
    }

    // Anthropic token counts are logged via onComplete when the stream finishes.
    // OpenAI token counts are now also logged via onComplete (stream_options).
    // Here we only log error cases or non-ok responses.
    const streamOk = response.ok !== false;
    if (!streamOk) {
      releaseSlot();
      logLLMUsage({
        taskName: task,
        provider: resolved.effectiveProvider,
        model: resolved.model,
        latencyMs: Date.now() - t0,
        success: false,
        degraded: resolved.effectiveProvider !== resolved.provider,
        errorMessage: `Stream non-ok: ${response.status}`,
      });
    }
    if (streamOk) {
      recordProviderSuccess(resolved.effectiveProvider as Provider);
    } else {
      // Synthesize an LLMError from the stream HTTP status so circuit-breaker
      // logic can apply auth/overloaded special-casing (B4/B5).
      const streamErr = LLMError.fromResponse(
        resolved.effectiveProvider,
        response.status,
        `Stream non-ok: ${response.status}`,
      );
      recordProviderFailure(resolved.effectiveProvider as Provider, streamErr);
    }

    // If primary returned a non-ok response, try failover provider
    if (!response.ok && !USE_GROQ) {
      const failover = getFallbackConfig(task, resolved.effectiveProvider, {
        streaming: true,
        overrideChain: buildOverrideChain(resolved),
      });
      if (failover) {
        captureDegradedRoute(
          task,
          resolved.effectiveProvider,
          failover.provider,
          `stream primary returned ${response.status}`,
        );
        const failoverResponse = await tryStreamFailover(
          task,
          failover,
          messages,
          {
            maxTokens,
            temperature,
            routeName: options.routeName,
            onStreamError: options.onStreamError,
            t0,
            reason: `primary returned ${response.status}`,
          },
        );
        if (failoverResponse) return failoverResponse;
      }
    }

    return response;
  } catch (err) {
    releaseSlot();
    // ── Stream failover on throw ──
    if (!USE_GROQ) {
      const failover = getFallbackConfig(task, resolved.effectiveProvider, {
        streaming: true,
        overrideChain: buildOverrideChain(resolved),
      });
      if (failover) {
        captureDegradedRoute(
          task,
          resolved.effectiveProvider,
          failover.provider,
          "stream primary threw",
        );
        const failoverResponse = await tryStreamFailover(
          task,
          failover,
          messages,
          {
            maxTokens,
            temperature,
            routeName: options.routeName,
            onStreamError: options.onStreamError,
            t0,
            reason: "primary threw",
          },
        );
        if (failoverResponse) return failoverResponse;
      }
    }

    logLLMUsage({
      taskName: task,
      provider: resolved.effectiveProvider,
      model: resolved.model,
      latencyMs: Date.now() - t0,
      success: false,
      degraded: resolved.effectiveProvider !== resolved.provider,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    recordProviderFailure(resolved.effectiveProvider as Provider, err);
    Sentry.captureException(err, {
      tags: {
        task,
        provider: resolved.effectiveProvider,
        model: resolved.model,
      },
    });
    throw err;
  }
}

// ── Provider implementations ──

async function callAnthropic(
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    wantJson: boolean;
    enableCache?: boolean;
    jsonSchema?: { name: string; schema: Record<string, unknown> };
  },
): Promise<ProviderResult> {
  // Anthropic Messages API uses a separate `system` param, not a system message.
  // Extract system messages and combine them.
  const systemParts: string[] = [];
  const anthropicMessages: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  let systemText = systemParts.join("\n\n") || undefined;
  if (opts.wantJson && systemText) {
    systemText += ANTHROPIC_JSON_SUFFIX;
  } else if (opts.wantJson) {
    systemText = ANTHROPIC_JSON_SUFFIX.trim();
  }

  // When caching is enabled, send system as array with cache_control.
  // Anthropic caches the prefix and charges cached tokens at ~10% rate.
  let system: string | AnthropicSystemBlock[] | undefined = systemText;
  if (opts.enableCache && systemText) {
    system = [
      { type: "text", text: systemText, cache_control: { type: "ephemeral" } },
    ];
  }

  const toolDefs = opts.jsonSchema
    ? [
        {
          name: opts.jsonSchema.name,
          description: "Structured output",
          input_schema: opts.jsonSchema.schema,
        },
      ]
    : undefined;
  const toolChoice = opts.jsonSchema
    ? { type: "tool" as const, name: opts.jsonSchema.name }
    : undefined;

  const response = await getAnthropicClient().createMessage({
    model,
    system,
    messages: anthropicMessages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    ...(toolDefs ? { tools: toolDefs, tool_choice: toolChoice } : {}),
  });

  // When tool_use is requested, extract JSON from the tool_use block
  if (opts.jsonSchema) {
    const toolBlock = response.content.find(
      (b): b is Extract<typeof b, { type: "tool_use" }> =>
        b.type === "tool_use",
    );
    if (toolBlock) {
      return {
        text: JSON.stringify(toolBlock.input),
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        cacheReadTokens: response.usage?.cache_read_input_tokens,
        cacheWriteTokens: response.usage?.cache_creation_input_tokens,
      };
    }
    // Fallback: model returned text instead of tool_use (shouldn't happen with tool_choice)
  }

  const textBlock = response.content.find(
    (b): b is Extract<typeof b, { type: "text" }> => b.type === "text",
  );
  if (!textBlock?.text) {
    throw new Error("Empty Anthropic response");
  }

  return {
    text: textBlock.text,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
    cacheReadTokens: response.usage?.cache_read_input_tokens,
    cacheWriteTokens: response.usage?.cache_creation_input_tokens,
  };
}

async function callGeminiProvider(
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    wantJson: boolean;
    jsonSchema?: { name: string; schema: Record<string, unknown> };
  },
): Promise<ProviderResult> {
  return callGemini({
    model,
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    wantJson: opts.wantJson,
    responseSchema: opts.jsonSchema?.schema,
  });
}

async function callOpenAI(
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    wantJson: boolean;
    jsonSchema?: { name: string; schema: Record<string, unknown> };
  },
): Promise<ProviderResult> {
  // Use json_schema (strict mode) for OpenAI proper. Groq's OpenAI-compatible
  // endpoint does not support json_schema on the default E2E model; Zod
  // validation still runs after a json_object response.
  const supportsNativeJsonSchema = !USE_GROQ;
  const responseFormat = opts.jsonSchema && supportsNativeJsonSchema
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: opts.jsonSchema.name,
          schema: opts.jsonSchema.schema,
          strict: true,
        },
      }
    : opts.wantJson
      ? { type: "json_object" as const }
      : undefined;
  const response = await getOpenAIClient().chat.completions.create({
    model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty OpenAI response");
  }

  return {
    text,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
    cacheReadTokens: response.usage?.prompt_tokens_details?.cached_tokens,
  };
}

// ── Anthropic streaming ──

/** Inactivity timeout: abort if no data chunk received for this duration. */
const STREAM_INACTIVITY_TIMEOUT_MS = 15_000;
/** Overall stream timeout. */
const OVERALL_STREAM_TIMEOUT_MS = 90_000;

async function streamAnthropic(
  model: string,
  messages: Message[],
  opts: {
    maxTokens: number;
    temperature: number;
    routeName: string;
    onStreamError?: (err: unknown) => void;
    onComplete?: (usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    }) => void;
    onFinally?: () => void;
  },
): Promise<Response> {
  const t0 = Date.now();
  const dbg = (tag: string, extra?: unknown) => {
    if (__DEV__)
      console.log(
        `[coach-debug][anthropic] ${tag} +${Date.now() - t0}ms`,
        extra !== undefined ? JSON.stringify(extra) : "",
      );
  };

  const { ApiErrorCode, createErrorResponse, logApiError } =
    await import("../api/api-errors");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    dbg("NO_API_KEY");
    logApiError(opts.routeName, ApiErrorCode.AI_NOT_CONFIGURED, {
      message: "ANTHROPIC_API_KEY is not configured",
    });
    return createErrorResponse(
      ApiErrorCode.AI_NOT_CONFIGURED,
      "API key not configured.",
      503,
    );
  }

  // Separate system messages
  const systemParts: string[] = [];
  const anthropicMessages: AnthropicMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else {
      anthropicMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const body: Record<string, unknown> = {
    model,
    messages: anthropicMessages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    stream: true,
  };
  if (systemParts.length > 0) {
    // Layered caching: when multiple system messages are provided,
    // cache_control goes on the first block only (the static prefix).
    // This maximizes cache hits across different users/turns sharing the same prefix.
    if (systemParts.length === 1) {
      body.system = [
        {
          type: "text",
          text: systemParts[0],
          cache_control: { type: "ephemeral" },
        },
      ];
    } else {
      body.system = systemParts.map((text, i) => ({
        type: "text" as const,
        text,
        ...(i === 0 ? { cache_control: { type: "ephemeral" as const } } : {}),
      }));
    }
  }

  const bodyStr = JSON.stringify(body);
  dbg("FETCH_START", {
    model,
    systemChars: systemParts.reduce((s, p) => s + p.length, 0),
    messagesCount: anthropicMessages.length,
    bodyBytes: bodyStr.length,
  });

  const connController = new AbortController();
  const connTimeout = setTimeout(() => connController.abort(), 30_000);
  let apiResponse: Response;
  try {
    apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: bodyStr,
      signal: connController.signal,
    });
  } catch (err) {
    clearTimeout(connTimeout);
    dbg("FETCH_CONNECTION_ERROR", { error: String(err) });
    logApiError(opts.routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: `Anthropic connection error: ${err}`,
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      "Could not connect to AI service. Please try again.",
      502,
    );
  }
  clearTimeout(connTimeout);

  dbg("FETCH_RESPONSE", { status: apiResponse.status, ok: apiResponse.ok });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text().catch(() => "");
    const status = apiResponse.status;
    dbg("FETCH_ERROR", { status, errorBody: errorBody.slice(0, 500) });
    if (status === 401) {
      logApiError(opts.routeName, ApiErrorCode.AI_KEY_INVALID, {
        message: `Anthropic API 401: ${errorBody}`,
      });
      return createErrorResponse(
        ApiErrorCode.AI_KEY_INVALID,
        "Invalid API key.",
        502,
      );
    }
    if (status === 429) {
      logApiError(opts.routeName, ApiErrorCode.AI_RATE_LIMITED, {
        message: `Anthropic API 429: ${errorBody}`,
      });
      return createErrorResponse(
        ApiErrorCode.AI_RATE_LIMITED,
        "AI service rate limit reached.",
        429,
      );
    }
    logApiError(opts.routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: `Anthropic API ${status}: ${errorBody}`,
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      `AI service error (${status}).`,
      502,
    );
  }

  if (!apiResponse.body) {
    dbg("NO_RESPONSE_BODY");
    logApiError(opts.routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: "No response body from Anthropic",
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      "No response from AI service.",
      502,
    );
  }

  dbg("STREAM_SETUP — creating push-based SSE processor");

  // Use a push-based TransformStream so that:
  // 1. Response headers are sent to the client IMMEDIATELY (fixes fetch() not resolving)
  // 2. We can track first-content timeout independently of SSE keepalive pings
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

  // Start processing Anthropic SSE events in a background task
  processAnthropicSSEStream(apiResponse, writable, {
    onStreamError: opts.onStreamError,
    onComplete: opts.onComplete,
    onFinally: opts.onFinally,
    dbg,
  }).catch((err) => {
    dbg("SSE_PROCESSOR_UNCAUGHT", { error: String(err) });
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no", // Prevent reverse-proxy buffering
    },
  });
}

/**
 * Push-based Anthropic SSE processor.
 *
 * Reads from the Anthropic SSE stream and writes plain-text content chunks
 * to the provided WritableStream. This runs as a background async task so
 * the HTTP Response (with its readable side) is returned to the client
 * immediately — fixing the issue where fetch() wouldn't resolve until the
 * first content_block_delta arrived.
 *
 * Timeout strategy:
 *   - STREAM_INACTIVITY_TIMEOUT_MS (15s): no raw data at all from Anthropic
 *   - FIRST_CONTENT_TIMEOUT_MS (60s): Anthropic is sending events (pings,
 *     message_start, etc.) but no actual text content has arrived yet
 *   - OVERALL_STREAM_TIMEOUT_MS (90s): total wall-clock time for the stream
 */
const FIRST_CONTENT_TIMEOUT_MS = 60_000;

async function processAnthropicSSEStream(
  apiResponse: Response,
  writable: WritableStream<Uint8Array>,
  opts: {
    onStreamError?: (err: unknown) => void;
    onComplete?: (usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    }) => void;
    onFinally?: () => void;
    dbg: (tag: string, extra?: unknown) => void;
  },
): Promise<void> {
  const { dbg } = opts;
  const encoder = new TextEncoder();
  const reader = apiResponse.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Per-request counters (NOT module-level — fixes counter leak across requests)
  let sseEventCount = 0;
  let textChunkCount = 0;
  let firstContentReceived = false;
  let accumulatedInputTokens = 0;
  let accumulatedOutputTokens = 0;
  let accumulatedCacheReadTokens: number | undefined;
  let accumulatedCacheWriteTokens: number | undefined;
  const streamStartTime = Date.now();

  const writer = writable.getWriter();

  // ── Timers ──
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let overallTimer: ReturnType<typeof setTimeout> | null = null;
  let firstContentTimer: ReturnType<typeof setTimeout> | null = null;
  let aborted = false;

  function clearAllTimers() {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (overallTimer !== null) {
      clearTimeout(overallTimer);
      overallTimer = null;
    }
    if (firstContentTimer !== null) {
      clearTimeout(firstContentTimer);
      firstContentTimer = null;
    }
  }

  function abort(reason: string, errName: string) {
    if (aborted) return;
    aborted = true;
    clearAllTimers();
    const err = new Error(reason);
    err.name = errName;
    dbg(`ABORT — ${errName}`, {
      reason,
      elapsed: Date.now() - streamStartTime,
      sseEventCount,
      textChunkCount,
    });
    opts.onStreamError?.(err);
    reader.cancel().catch(() => {});
    writer.abort(err).catch(() => {});
  }

  // Overall timeout (90s)
  overallTimer = setTimeout(() => {
    abort(
      `Stream timeout: total response time exceeded ${OVERALL_STREAM_TIMEOUT_MS / 1000}s.`,
      "StreamTimeoutError",
    );
  }, OVERALL_STREAM_TIMEOUT_MS);

  // First-content timeout (60s) — only active until the first text chunk arrives
  firstContentTimer = setTimeout(() => {
    if (!firstContentReceived) {
      abort(
        `No text content received from AI model within ${FIRST_CONTENT_TIMEOUT_MS / 1000}s (received ${sseEventCount} SSE events but 0 text chunks).`,
        "FirstContentTimeoutError",
      );
    }
  }, FIRST_CONTENT_TIMEOUT_MS);

  try {
    while (!aborted) {
      // Read with inactivity timeout
      const readResult = await readWithInactivityTimeout(
        reader,
        STREAM_INACTIVITY_TIMEOUT_MS,
      );

      if (aborted) break;

      if (readResult.timedOut) {
        abort(
          `Stream inactivity timeout: no data received for ${STREAM_INACTIVITY_TIMEOUT_MS / 1000}s.`,
          "StreamTimeoutError",
        );
        break;
      }

      const { done, value } = readResult;

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const text = extractTextFromSSELines(buffer.split("\n"), {
            sseEventCount,
            dbg,
          });
          sseEventCount += text.eventsParsed;
          if (text.usage) {
            if (text.usage.inputTokens)
              accumulatedInputTokens = text.usage.inputTokens;
            if (text.usage.outputTokens)
              accumulatedOutputTokens = text.usage.outputTokens;
            if (text.usage.cacheReadTokens != null)
              accumulatedCacheReadTokens = text.usage.cacheReadTokens;
            if (text.usage.cacheWriteTokens != null)
              accumulatedCacheWriteTokens = text.usage.cacheWriteTokens;
          }
          if (text.content) {
            await writer.write(encoder.encode(text.content));
          }
        }
        dbg("STREAM_DONE", {
          sseEventCount,
          textChunkCount,
          elapsed: Date.now() - streamStartTime,
          inputTokens: accumulatedInputTokens,
          outputTokens: accumulatedOutputTokens,
          cacheReadTokens: accumulatedCacheReadTokens,
          cacheWriteTokens: accumulatedCacheWriteTokens,
        });
        // Report accumulated token usage
        if (accumulatedInputTokens > 0 || accumulatedOutputTokens > 0) {
          opts.onComplete?.({
            inputTokens: accumulatedInputTokens,
            outputTokens: accumulatedOutputTokens,
            cacheReadTokens: accumulatedCacheReadTokens,
            cacheWriteTokens: accumulatedCacheWriteTokens,
          });
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      const text = extractTextFromSSELines(lines, { sseEventCount, dbg });
      sseEventCount += text.eventsParsed;
      if (text.usage) {
        if (text.usage.inputTokens)
          accumulatedInputTokens = text.usage.inputTokens;
        if (text.usage.outputTokens)
          accumulatedOutputTokens = text.usage.outputTokens;
        if (text.usage.cacheReadTokens != null)
          accumulatedCacheReadTokens = text.usage.cacheReadTokens;
        if (text.usage.cacheWriteTokens != null)
          accumulatedCacheWriteTokens = text.usage.cacheWriteTokens;
      }

      if (text.content) {
        if (!firstContentReceived) {
          firstContentReceived = true;
          // Clear the first-content timer — we got text!
          if (firstContentTimer !== null) {
            clearTimeout(firstContentTimer);
            firstContentTimer = null;
          }
          dbg("FIRST_CONTENT", {
            elapsed: Date.now() - streamStartTime,
            afterEvents: sseEventCount,
          });
        }
        textChunkCount++;
        await writer.write(encoder.encode(text.content));
      }

      if (text.hasError) {
        abort(
          `Anthropic returned an error event in SSE stream`,
          "AnthropicStreamError",
        );
        break;
      }
    }
  } catch (err) {
    if (!aborted) {
      dbg("SSE_CATCH", {
        error: String(err),
        elapsed: Date.now() - streamStartTime,
      });
      opts.onStreamError?.(err);
    }
  } finally {
    clearAllTimers();
    // Close the writer (client will see stream end)
    try {
      if (!aborted) {
        await writer.close();
      }
    } catch {
      // Writer may already be closed/aborted
    }
    opts.onFinally?.();
  }
}

/**
 * Read from a ReadableStreamDefaultReader with an inactivity timeout.
 * Returns { done, value, timedOut } — timedOut is true if no data arrived
 * within the timeout window.
 */
function readWithInactivityTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
): Promise<{ done: boolean; value?: Uint8Array; timedOut?: boolean }> {
  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ done: false, timedOut: true });
      }
    }, timeoutMs);

    reader.read().then(
      (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ done: result.done, value: result.value });
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ done: true });
        }
      },
    );
  });
}

/**
 * Extract text content from SSE data lines.
 * Only extracts from content_block_delta events with text_delta.
 * Returns combined text content + metadata about what was parsed.
 */
function extractTextFromSSELines(
  lines: string[],
  ctx: { sseEventCount: number; dbg: (tag: string, extra?: unknown) => void },
): {
  content: string;
  eventsParsed: number;
  hasError: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
} {
  let content = "";
  let eventsParsed = 0;
  let hasError = false;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let cacheReadTokens: number | undefined;
  let cacheWriteTokens: number | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const data = trimmed.slice(6);
    try {
      const parsed = JSON.parse(data);
      eventsParsed++;
      const eventNum = ctx.sseEventCount + eventsParsed;

      // Log first few events, errors, and completion
      if (
        eventNum <= 5 ||
        parsed.type === "error" ||
        parsed.type === "message_stop"
      ) {
        ctx.dbg(
          `[sse] event #${eventNum} type=${parsed.type}`,
          parsed.type === "error" ? parsed : undefined,
        );
      }

      if (parsed.type === "error") {
        hasError = true;
      }

      // message_start carries input token count + cache metrics
      if (parsed.type === "message_start" && parsed.message?.usage) {
        inputTokens = parsed.message.usage.input_tokens ?? inputTokens;
        if (parsed.message.usage.cache_read_input_tokens != null) {
          cacheReadTokens = parsed.message.usage.cache_read_input_tokens;
        }
        if (parsed.message.usage.cache_creation_input_tokens != null) {
          cacheWriteTokens = parsed.message.usage.cache_creation_input_tokens;
        }
      }

      // message_delta carries output token count (sent at stream end)
      if (parsed.type === "message_delta" && parsed.usage) {
        outputTokens = parsed.usage.output_tokens ?? outputTokens;
      }

      if (
        parsed.type === "content_block_delta" &&
        parsed.delta?.type === "text_delta"
      ) {
        const text = parsed.delta.text;
        if (text) {
          content += text;
        }
      }
    } catch {
      // Skip unparseable chunks
    }
  }

  const usage =
    inputTokens !== undefined || outputTokens !== undefined
      ? {
          inputTokens: inputTokens ?? 0,
          outputTokens: outputTokens ?? 0,
          cacheReadTokens,
          cacheWriteTokens,
        }
      : undefined;
  return { content, eventsParsed, hasError, usage };
}

// Re-export provider availability check for consumers that need feature detection
export { isAnthropicAvailable } from "./anthropic-client";
