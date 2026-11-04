/**
 * Single source of truth for CSV cell escaping across every research / admin
 * export endpoint. Two concerns are handled here so the logic can never drift
 * between endpoints (the drift is exactly how the formula-injection guard came
 * to be missing from multiple export routes):
 *
 * 1. RFC 4180 quoting — wrap in double quotes (doubling any internal quote)
 *    whenever the value contains a comma, double quote, or newline.
 * 2. CSV formula injection — a cell whose first character is one of
 *    `= + - @ TAB CR` can be executed as a formula when the file is opened in
 *    Excel / Google Sheets / LibreOffice (e.g. `=HYPERLINK(...)`, `=cmd|...`).
 *    We neutralize it by prefixing the cell with a single quote, EXCEPT when
 *    the whole value is a plain number, so legitimate negative scores like
 *    `-5` or `+3.2` stay numeric in the spreadsheet.
 */

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";

  const raw = Array.isArray(value)
    ? (value as unknown[]).map(String).join(";")
    : String(value);

  // Neutralize spreadsheet formula injection before any quoting.
  const guarded =
    FORMULA_TRIGGER.test(raw) && !PLAIN_NUMBER.test(raw) ? `'${raw}` : raw;

  if (
    guarded.includes(",") ||
    guarded.includes('"') ||
    guarded.includes("\n") ||
    guarded.includes("\r")
  ) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}
