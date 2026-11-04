import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

/**
 * Server-side helper for admin pages: returns the admin.pages.* strings
 * (page titles/descriptions) with the full admin dict for extras.
 */
export async function getAdminPageDict(locale: string): Promise<{
  pages: Record<string, string>;
  admin: Record<string, unknown>;
}> {
  const dictionary = await getDictionary(locale as Locale);
  const admin = (dictionary.admin ?? {}) as Record<string, unknown>;
  const pages = (admin.pages ?? {}) as Record<string, string>;
  return { pages, admin };
}
