/**
 * Escape user-supplied text for safe embedding in HTML email templates.
 *
 * Defense-in-depth: even though the Zod `safeName` schema strips HTML tags
 * at the input boundary, this escapes at the output boundary so that any
 * bypass (direct DB edit, migration, future input path) cannot inject HTML.
 */
export function escapeHtml(s: string | null): string | null {
  if (!s) return s;
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
