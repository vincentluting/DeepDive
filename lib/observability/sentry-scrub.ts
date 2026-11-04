// ============================================================
// Sentry PII Scrubbing
// Redacts emails, tokens/secrets, and known sensitive fields from every
// Sentry event before it leaves the process. Defensive by design: a scrub
// failure must never break error reporting, so all work is wrapped in
// try/catch and falls back to returning the original event.
//
// Matters for the research cohort: error payloads can otherwise leak user
// emails, auth headers, or free-text answers into a third-party service.
// ============================================================

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Targeted secret patterns (avoid a broad catch-all that would redact benign
// long identifiers like trace ids): OpenAI-style keys, Bearer tokens, JWTs.
const SECRET_RE =
  /(?:sk-[A-Za-z0-9]{16,}|Bearer\s+[A-Za-z0-9._-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+)/g;

// Keys whose values are dropped wholesale regardless of content.
const SENSITIVE_KEY_RE =
  /(authorization|cookie|password|passwd|secret|token|api[_-]?key|csrf|session)/i;

const REDACTED = "[redacted]";
const MAX_DEPTH = 6;

/** Redact emails and secrets from a free-text string. */
export function redactString(input: string): string {
  if (!input) return input;
  return input.replace(EMAIL_RE, REDACTED).replace(SECRET_RE, REDACTED);
}

/** Recursively scrub a value: redact strings, drop sensitive-keyed values. */
function scrubValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return value;
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_RE.test(k) ? REDACTED : scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Scrub a Sentry event in place / by reassignment. Generic over the event
 * type so it can be dropped into beforeSend without coupling to a specific
 * SDK version's ErrorEvent shape. Never throws.
 */
export function scrubSentryEvent<T>(event: T): T {
  try {
    const e = event as Record<string, unknown>;

    // User identity — keep `id` for correlation, drop direct identifiers.
    if (e.user && typeof e.user === "object") {
      const u = e.user as Record<string, unknown>;
      if ("email" in u) u.email = REDACTED;
      if ("ip_address" in u) u.ip_address = REDACTED;
      if ("username" in u) u.username = REDACTED;
    }

    if (typeof e.message === "string") e.message = redactString(e.message);
    if (e.request) e.request = scrubValue(e.request, 0);
    if (e.exception) e.exception = scrubValue(e.exception, 0);
    if (e.breadcrumbs) e.breadcrumbs = scrubValue(e.breadcrumbs, 0);
    if (e.extra) e.extra = scrubValue(e.extra, 0);

    return event;
  } catch {
    return event;
  }
}
