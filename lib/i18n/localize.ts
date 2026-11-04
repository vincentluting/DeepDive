import type { Locale } from "./config";

/**
 * Pick a locale-specific field from a multilingual object.
 *
 * Works with objects that follow the `*_en` / `*_zh` / `*_{locale}` naming convention
 * (e.g. `label_en`, `label_zh`, `label_nl`).
 *
 * Fallback chain:
 * - Requested locale → English (universal fallback) → empty string
 * - EN locale: strict, never falls back to other languages
 *
 * @example
 * ```ts
 * const name = getLocalizedField(archetype, 'label', locale)
 * // locale='nl' → archetype.label_nl ?? archetype.label_en
 * // locale='en' → archetype.label_en
 * ```
 */
export function getLocalizedField(
  obj: object | null | undefined,
  baseName: string,
  locale: Locale,
): string {
  if (!obj || typeof obj !== "object") return "";
  const rec = obj as Record<string, unknown>;
  const localeKey = `${baseName}_${locale}`;
  const enKey = `${baseName}_en`;

  if (locale === "en") {
    // EN: strict — never fall back to other languages
    const enVal = rec[enKey];
    return typeof enVal === "string" ? enVal : "";
  }

  // Any non-EN locale: try locale-specific field, then fall back to EN
  const localeVal = rec[localeKey];
  if (typeof localeVal === "string" && localeVal) return localeVal;

  const enVal = rec[enKey];
  return typeof enVal === "string" ? enVal : "";
}

/**
 * Pick from a `{ en: string; zh: string; [locale]: string }` shaped object.
 *
 * Fallback: requested locale → en → empty string
 *
 * @example
 * ```ts
 * const strength = pickLocaleText(edge, locale)
 * // locale='de' → edge.de ?? edge.en
 * ```
 */
export function pickLocaleText<T extends { en?: string }>(
  obj: T | null | undefined,
  locale: Locale,
): string {
  if (!obj) return "";
  // Safe record access for any locale key — works with MultiLocaleText,
  // ShadowLocaleText, Record<string, string>, and mixed-property objects
  const r = obj as Record<string, unknown>;
  if (locale === "en") return (r.en as string) || "";
  const val = r[locale];
  if (typeof val === "string" && val) return val;
  // Fallback: zh for Chinese, then EN for all others
  if (locale === "zh") return (r.zh as string) || (r.en as string) || "";
  return (r.en as string) || "";
}
