import type { Locale } from "@/lib/i18n/config";

/**
 * Resolve the primary CTA destination for the landing page.
 *
 * New visitors descend straight into Quick Dive; returning visitors are
 * routed to their explore hub when logged in, or to register (preserving
 * the quickdive intent) when not.
 */
export function resolveCtaHref({
  isReturning,
  isLoggedIn,
  locale,
}: {
  isReturning: boolean;
  isLoggedIn: boolean;
  locale: Locale;
}): string {
  if (!isReturning) return `/${locale}/quickdive`;
  return isLoggedIn
    ? `/${locale}/explore`
    : `/${locale}/register?from=quickdive`;
}

/** localStorage keys that mark a visitor as returning. */
export const RETURNING_VISITOR_KEYS = [
  "deep-dive-last-quickdive-id",
  "deep-dive-last-immersive-id",
  "deep-dive-quickdive-history",
] as const;

/** Read returning-visitor state from localStorage (false when unavailable). */
export function readIsReturning(storage: Pick<Storage, "getItem">): boolean {
  return RETURNING_VISITOR_KEYS.some((key) => !!storage.getItem(key));
}
