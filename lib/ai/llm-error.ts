// Typed error class for LLM provider failures.
// Carries HTTP status, provider name, error code, retryability, and
// (when available) the upstream-suggested retry delay.

export type LLMProvider = "anthropic" | "openai" | "gemini";

/**
 * Categorical error code derived from HTTP status. Drives retry / circuit
 * breaker / fallback decisions in the model router.
 *
 * - `auth`        — 401 / 403. Never retry, mark provider unhealthy IMMEDIATELY.
 * - `rate_limit`  — 429. Retry; honor retry-after header.
 * - `overloaded`  — 529 (Anthropic upstream pressure). Retry with longer
 *                   initial delay; do NOT count toward circuit breaker.
 * - `server`      — 500/502/503/504. Retry with exponential backoff.
 * - `timeout`     — Network / body-read timeout. Retry.
 * - `bad_request` — 400/404/413/422. Not retryable.
 * - `network`     — DNS failure, connection reset, TLS error. Retryable.
 *                   Distinct from `server` (HTTP 5xx) for Sentry/digest clarity.
 * - `unknown`     — fallback when status is missing or unrecognised.
 */
export type LLMErrorCode =
  | "auth"
  | "rate_limit"
  | "overloaded"
  | "server"
  | "timeout"
  | "network"
  | "bad_request"
  | "unknown";

export class LLMError extends Error {
  override readonly name = "LLMError";

  constructor(
    message: string,
    public readonly status: number,
    public readonly provider: LLMProvider,
    public readonly retryable: boolean,
    public readonly detail?: string,
    public readonly code: LLMErrorCode = "unknown",
    /** Suggested wait before retry, parsed from `retry-after` header (ms). */
    public readonly retryAfterMs?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }

  /** True for 401/403 — should open the circuit immediately. */
  get isAuth(): boolean {
    return this.code === "auth";
  }

  /** True for 529 — upstream pressure, do not count toward circuit. */
  get isOverloaded(): boolean {
    return this.code === "overloaded";
  }

  /** True for 429 — provider-side rate limit. */
  get isRateLimit(): boolean {
    return this.code === "rate_limit";
  }

  /** Build from an HTTP response status code. */
  static fromResponse(
    provider: LLMProvider,
    status: number,
    detail?: string,
    retryAfterMs?: number,
  ): LLMError {
    const code = classifyStatus(status);
    const retryable = isRetryableCode(code);
    const hint = errorHint(status);
    return new LLMError(
      `${capitalize(provider)} API error: ${status}${hint}`,
      status,
      provider,
      retryable,
      detail,
      code,
      retryAfterMs,
    );
  }

  /** Build from a request/body-read timeout. Always retryable. */
  static timeout(
    provider: LLMProvider,
    phase: "request" | "body_read",
  ): LLMError {
    const msg =
      phase === "request"
        ? `${capitalize(provider)} API error: request timed out`
        : `${capitalize(provider)} API error: response body read timed out`;
    return new LLMError(msg, 0, provider, true, undefined, "timeout");
  }

  /** Build from a network-level error (DNS failure, connection reset, etc.). Always retryable. */
  static networkError(provider: LLMProvider, err: unknown): LLMError {
    const detail = err instanceof Error ? err.message : String(err);
    return new LLMError(
      `${capitalize(provider)} API error: network failure (${detail})`,
      0,
      provider,
      true,
      detail,
      "network",
      undefined,
      err instanceof Error ? { cause: err } : undefined,
    );
  }
}

function classifyStatus(status: number): LLMErrorCode {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 529) return "overloaded";
  if (status >= 500) return "server";
  if (status === 0) return "timeout";
  if (status >= 400) return "bad_request";
  return "unknown";
}

function isRetryableCode(code: LLMErrorCode): boolean {
  return (
    code === "rate_limit" ||
    code === "overloaded" ||
    code === "server" ||
    code === "timeout" ||
    code === "network"
  );
}

function errorHint(status: number): string {
  if (status === 401 || status === 403) return " (invalid API key)";
  if (status === 429) return " (rate limited)";
  if (status === 529) return " (overloaded)";
  if (status >= 500) return " (server error)";
  return "";
}

/**
 * Parse a `retry-after` HTTP header value to milliseconds.
 * Spec allows seconds (delta) or HTTP-date.
 * Returns undefined for invalid input.
 */
export function parseRetryAfterMs(
  headerValue: string | null | undefined,
): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  // Try delta-seconds first (most common from APIs)
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.floor(seconds * 1000);
  }
  // Try HTTP-date
  const date = Date.parse(trimmed);
  if (Number.isFinite(date)) {
    return Math.max(0, date - Date.now());
  }
  return undefined;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
