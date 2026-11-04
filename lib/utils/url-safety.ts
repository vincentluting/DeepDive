/**
 * Returns true only for absolute http(s) URLs.
 *
 * Used to keep user-provided links (e.g. public-profile social links) from
 * carrying `javascript:`, `data:`, `vbscript:` or other script-capable schemes
 * into an `<a href>`, which would be a stored-XSS / open-redirect vector.
 * Relative URLs are rejected too (social links are expected to be absolute).
 */
export function isSafeHttpUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
