export const locales = [
  "en", "zh", "nl", "de", "fr", "es", "pt", "it", "ru", "ja", "ko",
] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
}

/** Full language name in English — used for LLM prompt instructions */
export const localeLanguageNames: Record<Locale, string> = {
  en: "English",
  zh: "Chinese",
  nl: "Dutch",
  de: "German",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
}

/** BCP-47 locale tag for date/number formatting */
const dateLocaleMap: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-BR",
  it: "it-IT",
  ru: "ru-RU",
  ja: "ja-JP",
  ko: "ko-KR",
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export function toDateLocale(locale: Locale): string {
  return dateLocaleMap[locale] ?? "en-US"
}

export function toDateLocaleOrDefault(locale: string): string {
  if (isValidLocale(locale)) {
    return toDateLocale(locale)
  }

  return toDateLocale(defaultLocale)
}
