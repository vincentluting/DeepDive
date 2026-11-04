import { defaultLocale, isValidLocale, locales, type Locale } from "./config"

/**
 * Get locale from URL path first, then sessionStorage, then cookie
 * This ensures the locale matches the user's language preference
 */
export function getLocaleFromCookie(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale
  }

  // First, check the URL path for locale
  const pathname = window.location.pathname

  for (const loc of locales) {
    if (pathname.startsWith(`/${loc}`)) {
      return loc
    }
  }

  try {
    const sessionLocale = sessionStorage.getItem("user_locale")
    if (sessionLocale && isValidLocale(sessionLocale)) {
      return sessionLocale
    }
  } catch {
    // Safari private mode throws on sessionStorage access
  }

  // Fallback to cookie
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "NEXT_LOCALE" && value && isValidLocale(value)) {
      return value
    }
  }

  return defaultLocale
}

