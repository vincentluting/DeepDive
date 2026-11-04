// ============================================================
// Quality Gate — Phase 2 of the 99%+ LLM quality plan
//
// Why
// ---
// `lib/ai/model-router.ts` retries transient errors and fails over between
// providers, but it has NO concept of output quality. A 200-status response
// with an empty narrative, a 30-character "report," or output in the wrong
// language all sail through. This module wraps every LLM call site with a
// configurable post-call check that:
//
//   1. Validates the parsed output against the task's QualityGateConfig
//      (length, required fields, expected item counts, locale, repetition).
//   2. Decides one of: `pass` / `fail-length` / `fail-field` / `fail-count`
//      / `fail-language` / `fail-repetition`.
//   3. Records the verdict to LLMUsageLog via `logLLMQualityCheck` so the
//      cron digest + admin dashboard can monitor pass rate per task.
//
// Phase 2 SCOPE: observability + soft retry. When a gate fails, callers may
// retry the primary provider up to `maxRetries` times. If all retries fail
// the caller still falls back to algorithmic text (status quo) — but the
// failure is now LOGGED so we can size the problem.
//
// Phase 3 will flip the post-retry behaviour to `throw LLMQualityError` for
// `qualityCritical` tasks (defined in TASK_CONFIG, plan-approved edit).
// ============================================================

import { logLLMQualityCheck } from "../db/llm-usage";
import type { LLMQualityCheckResult } from "../db/llm-usage";
import { detectLanguageMismatch } from "../i18n/language-detect";

// ── Public types ──

/** Top-level config for a task's gate. All fields optional. */
export interface QualityGateConfig {
  /**
   * Minimum character length the *primary* narrative field must reach.
   * For string outputs, this checks the whole output. For JSON outputs,
   * pair with `primaryField` to target a specific field.
   */
  minLength?: number;

  /** When `minLength` is set on a JSON output, this names the field to measure. */
  primaryField?: string;

  /**
   * Per-field minimum length thresholds (in characters). Useful for JSON
   * outputs with multiple text fields that have different quality bars
   * (e.g. integration: coreInsight ≥ 200, letterToUser ≥ 50).
   */
  minLengthFields?: Record<string, number>;

  /** JSON output: these fields must be present and non-empty. */
  requiredFields?: string[];

  /**
   * JSON output: arrays at these paths must have *exactly* the expected
   * length. Use for fixed-shape outputs (e.g. career-pathway weeks=4,
   * career-match-narrative directions=3).
   */
  expectedItemCounts?: Record<string, number>;

  /**
   * Locale the LLM was instructed to write in. When set, runs
   * `detectOutputLocale()` on the primary narrative content and fails
   * with `fail-language` if it doesn't match.
   */
  enforceLocale?: string;

  /**
   * 0-1: bigram repetition threshold for the primary narrative field.
   * Default null = no check. Mirrors `hasExcessiveRepetition` from
   * integration.ts.
   */
  repetitionThreshold?: number;

  /**
   * Which field to subject to the repetition check (in JSON outputs).
   * Falls back to `primaryField` when omitted.
   */
  repetitionField?: string;
}

/** Per-attempt verdict surfaced to the caller. */
export interface QualityGateOutcome {
  result: LLMQualityCheckResult;
  /** Human-readable detail explaining a fail (e.g. "narrative=120 < 300"). */
  detail?: string;
}

// ── Core check ──

/** Extract a string field from an arbitrary parsed output. */
function getStringField(output: unknown, field: string): string | undefined {
  if (output == null || typeof output !== "object") return undefined;
  const value = (output as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

/** Extract an array field from an arbitrary parsed output. */
function getArrayField(output: unknown, field: string): unknown[] | undefined {
  if (output == null || typeof output !== "object") return undefined;
  const value = (output as Record<string, unknown>)[field];
  return Array.isArray(value) ? value : undefined;
}

/**
 * Bigram repetition: scan paragraphs of a text field, return true if any
 * adjacent pair shares more than `threshold` of word bigrams. Mirrors the
 * existing logic in `lib/report-generation/integration.ts`.
 */
function hasExcessiveRepetition(text: string, threshold: number): boolean {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40);
  if (paragraphs.length < 2) return false;

  for (let i = 1; i < paragraphs.length; i++) {
    const prev = bigrams(paragraphs[i - 1]);
    const curr = bigrams(paragraphs[i]);
    if (prev.size === 0 || curr.size === 0) continue;
    let overlap = 0;
    for (const b of curr) if (prev.has(b)) overlap++;
    const ratio = overlap / curr.size;
    if (ratio > threshold) return true;
  }
  return false;
}

function bigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const result = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    result.add(`${words[i]} ${words[i + 1]}`);
  }
  return result;
}

/**
 * Synchronous quality check. Inspects parsed output against config and
 * returns the first failing verdict (or `pass`). Stateless — caller decides
 * what to do with the result (log, retry, throw).
 */
export function checkQuality(
  output: unknown,
  config: QualityGateConfig,
): QualityGateOutcome {
  // 1. Required fields (must exist + non-empty string OR truthy non-array)
  if (config.requiredFields && config.requiredFields.length > 0) {
    if (output == null || typeof output !== "object") {
      return {
        result: "fail-field",
        detail: `output is not an object; required ${config.requiredFields.join(", ")}`,
      };
    }
    const obj = output as Record<string, unknown>;
    for (const field of config.requiredFields) {
      const v = obj[field];
      if (v == null || (typeof v === "string" && v.trim().length === 0)) {
        return { result: "fail-field", detail: `missing or empty: ${field}` };
      }
    }
  }

  // 2. Expected item counts
  if (config.expectedItemCounts) {
    for (const [field, expected] of Object.entries(config.expectedItemCounts)) {
      const arr = getArrayField(output, field);
      if (!arr) {
        return {
          result: "fail-count",
          detail: `field ${field} is not an array`,
        };
      }
      if (arr.length !== expected) {
        return {
          result: "fail-count",
          detail: `${field}.length=${arr.length}, expected ${expected}`,
        };
      }
    }
  }

  // 3. Min-length on primary string
  if (typeof config.minLength === "number") {
    let primary: string | undefined;
    if (typeof output === "string") primary = output;
    else if (config.primaryField)
      primary = getStringField(output, config.primaryField);
    if (primary == null) {
      return {
        result: "fail-length",
        detail: `cannot extract primary field ${config.primaryField ?? "(top-level string)"}`,
      };
    }
    if (primary.length < config.minLength) {
      return {
        result: "fail-length",
        detail: `${config.primaryField ?? "output"}.length=${primary.length} < ${config.minLength}`,
      };
    }
  }

  // 4. Per-field min lengths
  if (config.minLengthFields) {
    for (const [field, min] of Object.entries(config.minLengthFields)) {
      const v = getStringField(output, field);
      if (v == null || v.length < min) {
        return {
          result: "fail-length",
          detail: `${field}.length=${v?.length ?? 0} < ${min}`,
        };
      }
    }
  }

  // 5. Locale check — uses the same script-based detector that powers
  //    `findMismatchedFields` / `enforceOutputLocale`. Mismatch detected
  //    when text contains a sizeable foreign script that does not match
  //    the expected locale's script class.
  if (config.enforceLocale) {
    const field =
      config.primaryField ??
      (config.minLengthFields ? Object.keys(config.minLengthFields)[0] : null);
    let primary: string | undefined;
    if (typeof output === "string") primary = output;
    else if (field) primary = getStringField(output, field);
    if (primary && primary.length > 40) {
      const verdict = detectLanguageMismatch(primary, config.enforceLocale);
      if (verdict.isMismatch) {
        return {
          result: "fail-language",
          detail: `foreign-script ratio=${verdict.foreignRatio.toFixed(2)} scripts=${verdict.foreignScripts.join(",")} for locale=${config.enforceLocale}`,
        };
      }
    }
  }

  // 6. Repetition
  if (typeof config.repetitionThreshold === "number") {
    const field = config.repetitionField ?? config.primaryField;
    let primary: string | undefined;
    if (typeof output === "string") primary = output;
    else if (field) primary = getStringField(output, field);
    if (
      primary &&
      hasExcessiveRepetition(primary, config.repetitionThreshold)
    ) {
      return {
        result: "fail-repetition",
        detail: `adjacent paragraphs exceed bigram threshold ${config.repetitionThreshold}`,
      };
    }
  }

  return { result: "pass" };
}

// ── Run-with-retry wrapper ──

export interface RunWithQualityGateOptions<T> {
  taskName: string;
  /** Invoked once per attempt. Should return the *parsed* output (object/string). */
  call: () => Promise<T>;
  config: QualityGateConfig;
  /**
   * Max gate retries on top of the first attempt. Default 1 → up to 2 total
   * calls. Phase 2: keep low to avoid token bloat while we measure pass rate.
   */
  maxRetries?: number;
  /**
   * UTC ms — only LLMUsageLog rows newer than this will receive the UPDATE.
   * Pass the timestamp from BEFORE the first attempt so retries are scoped.
   */
  qualityWindowStart: number;
  /** userId for LLMUsageLog UPDATE (forwarded to logLLMQualityCheck). */
  userId?: string | null;
  /** Dev-only logger. */
  onAttempt?: (attempt: number, outcome: QualityGateOutcome) => void;
}

export interface RunWithQualityGateResult<T> {
  /** Last value returned by `call`, even if all gates failed. */
  value: T;
  /** Outcome of the FINAL attempt (the one whose value we return). */
  outcome: QualityGateOutcome;
  /** Total attempts including the first. */
  attempts: number;
}

/**
 * Call an LLM (via the caller-provided `call` closure) and verify the
 * output against the gate config. Retries up to `maxRetries` times if a
 * check fails. Logs the FINAL verdict to LLMUsageLog asynchronously.
 *
 * Always returns the last `value` — even on a gate failure — to preserve
 * Phase 1 backward compatibility (caller still has the option to fall back
 * to algorithmic text). Phase 3 will introduce a `throwOnFail` variant.
 */
export async function runWithQualityGate<T>(
  opts: RunWithQualityGateOptions<T>,
): Promise<RunWithQualityGateResult<T>> {
  const maxRetries = opts.maxRetries ?? 1;
  let lastValue: T | undefined;
  let lastOutcome: QualityGateOutcome = { result: "not-checked" };
  let attempt: number;
  for (attempt = 0; attempt <= maxRetries; attempt++) {
    lastValue = await opts.call();
    lastOutcome = checkQuality(lastValue, opts.config);
    opts.onAttempt?.(attempt, lastOutcome);
    if (lastOutcome.result === "pass") break;
  }

  // Record final verdict (async / fire-and-forget).
  logLLMQualityCheck({
    taskName: opts.taskName,
    userId: opts.userId,
    qualityCheckResult: lastOutcome.result,
    createdAfter: opts.qualityWindowStart,
  });

  // `lastValue` is guaranteed defined because the loop ran at least once.
  return {
    value: lastValue as T,
    outcome: lastOutcome,
    attempts: attempt + (lastOutcome.result === "pass" ? 1 : 0),
  };
}
