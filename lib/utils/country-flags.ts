/**
 * Convert an ISO 3166-1 alpha-2 country code to a flag emoji.
 *
 * Each letter is mapped to a Regional Indicator Symbol (Unicode 0x1F1E6–0x1F1FF).
 * Example: "CN" → 🇨🇳, "US" → 🇺🇸
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return ""
  const upper = code.toUpperCase()
  const first = upper.codePointAt(0)
  const second = upper.codePointAt(1)
  if (first === undefined || second === undefined) return ""
  // Regional Indicator Symbol Letter A starts at 0x1F1E6, ASCII 'A' is 65
  return String.fromCodePoint(first - 65 + 0x1f1e6, second - 65 + 0x1f1e6)
}
