// Open-redirect guard: only allow same-origin navigation after login.
//
// Accepts:
//   - Relative paths starting with `/` but NOT `//` (protocol-relative).
//   - Paths that don't contain control chars, `\`, or a scheme (`://`).
//
// Rejects everything else → caller falls back to a safe default.

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
// eslint-disable-next-line no-control-regex -- detecting control chars is the intent
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

export function isSafeRedirectPath(input: unknown): input is string {
  if (typeof input !== "string") return false;
  if (input.length === 0 || input.length > 2000) return false;

  if (CONTROL_CHARS_RE.test(input)) return false;

  // Must start with a single `/` — block protocol-relative (`//evil.com`)
  // and backslash variants (`/\evil.com` which some browsers normalize).
  if (!input.startsWith("/")) return false;
  if (input.startsWith("//") || input.startsWith("/\\")) return false;

  if (input.includes("\\")) return false;

  // Block absolute URLs (http://, https://, javascript:, data:, file:, …)
  if (SCHEME_RE.test(input)) return false;

  return true;
}

export function safeRedirectPath(input: unknown, fallback: string): string {
  return isSafeRedirectPath(input) ? input : fallback;
}
