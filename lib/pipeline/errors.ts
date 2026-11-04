// ============================================================
// Pipeline error classification
//
// Three-state taxonomy so the orchestrator can pick a retry budget that
// matches the failure mode (instead of treating every non-permanent error
// like a network glitch):
//
//   permanent  — auth/404/validation; never retry, surface to user
//   validation — LLM output failed our schema gate; retry SPARINGLY
//                (the same prompt + data will fail the same way most times,
//                but a single retry catches transient LLM moodiness).
//                Capped by MAX_VALIDATION_RETRIES.
//   transient  — network/5xx/rate; retry with full exponential backoff.
//                Capped by MAX_PIPELINE_RETRIES.
//
// History: pre-2026-05 this was a boolean (transient vs permanent). A
// user (assessment 377de626-...) burned 5 retries on the same validation
// failure for ~33h because we couldn't distinguish "LLM dropped a field"
// from "Anthropic is down". This module reframes that distinction.
// ============================================================

export type PipelineErrorClass = "validation" | "transient" | "permanent";

const TRANSIENT_PATTERNS: RegExp[] = [
  /timeout/i,
  /timed out/i,
  /ECONNRESET/i,
  /ENOTFOUND/i,
  /ECONNREFUSED/i,
  /network/i,
  /fetch failed/i,
  /socket hang up/i,
  /rate ?limit/i,
  /overloaded/i,
  /API error: 5\d\d/,
  /API error: 429/,
  /API error: 529/,
  /service unavailable/i,
  /temporarily/i,
];

// Patterns that indicate the LLM (or our prompt) produced an output we
// rejected via schema/length/key checks. Retrying the SAME inputs against
// the SAME prompt against the SAME provider will most often fail again,
// so we budget these tightly. They are NOT permanent — a single LLM
// retry sometimes succeeds (different sampling).
const VALIDATION_PATTERNS: RegExp[] = [
  /incomplete narrative payload/i,
  /all LLM providers returned null/i,
  /missing algoSnapshot/i,
];

// Permanent: no retry will help. These short-circuit straight to 'failed'.
// IMPORTANT: order matters when classifying — permanent always wins over
// validation/transient.
const PERMANENT_PATTERNS: RegExp[] = [
  /API error: 4(00|01|03|04|22)/,
  /invalid api key/i,
  /auth/i,
  /not found/i,
  /missing.*required/i,
  /assessment.*not found/i,
  /profile for assessment .* not found/i,
  /validation/i,
];

function messageOf(err: unknown): string {
  return err instanceof Error
    ? `${err.name}: ${err.message}`
    : typeof err === "string"
      ? err
      : JSON.stringify(err);
}

/**
 * Classify an error into one of three retry buckets.
 * Permanent > validation > transient (default).
 */
export function classifyError(err: unknown): PipelineErrorClass {
  const message = messageOf(err);

  for (const p of PERMANENT_PATTERNS) {
    if (p.test(message)) return "permanent";
  }
  for (const p of VALIDATION_PATTERNS) {
    if (p.test(message)) return "validation";
  }
  for (const p of TRANSIENT_PATTERNS) {
    if (p.test(message)) return "transient";
  }
  // Unknown errors default to transient — at worst we waste retries before
  // giving up at MAX_PIPELINE_RETRIES. Better than failing a real network blip.
  return "transient";
}

/**
 * Backward-compatible wrapper. Prefer `classifyError` in new code.
 * Returns true iff the error class is "transient".
 *
 * NOTE on semantics: pre-2026-05 isTransientError(validation_err) returned
 * `false` (because validation patterns lived in PERMANENT_PATTERNS). After
 * the split, validation errors are NEITHER transient nor permanent — they
 * have their own bucket. This wrapper still returns `false` for them so
 * existing callers (orchestrator's old path, if any) keep marking them
 * non-retryable rather than retrying 5×.
 */
export function isTransientError(err: unknown): boolean {
  return classifyError(err) === "transient";
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message.slice(0, 500);
  }
  if (typeof err === "string") return err.slice(0, 500);
  try {
    return JSON.stringify(err).slice(0, 500);
  } catch {
    return "Unknown error";
  }
}
