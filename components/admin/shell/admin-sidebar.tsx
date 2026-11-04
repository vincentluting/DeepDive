"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { ADMIN_NAV, type AdminNavItem } from "./admin-nav-config";

function useNavLabels(locale: Locale): Record<string, string> {
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  return (dict.nav || {}) as Record<string, string>;
}

function isActive(pathname: string, base: string, item: AdminNavItem): boolean {
  const target = `${base}${item.href}`;
  if (item.exact) return pathname === target || pathname === `${target}/`;
  return pathname === target || pathname.startsWith(`${target}/`);
}

/**
 * Admin sidebar (desktop ≥lg): grouped vertical nav, sticky below the
 * AppHeader. On mobile the shell renders <AdminMobileNav> instead.
 */
export function AdminSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = useNavLabels(locale);
  const base = `/${locale}/admin`;

  return (
    <nav
      aria-label={labels.ariaLabel || "Admin navigation"}
      className="dd-admin-rail w-64 shrink-0 hidden lg:block"
    >
      <div className="sticky top-[calc(var(--header-height,76px)+1.25rem)] pb-8">
        <div className="dd-admin-rail-seal" aria-hidden="true">
          <span>U</span>
        </div>
        {ADMIN_NAV.map((group) => (
          <div key={group.labelKey} className="dd-admin-nav-group">
            <p className="dd-admin-nav-group-label px-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {labels[group.labelKey] || group.labelKey}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, base, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={`${base}${item.href}`}
                      aria-current={active ? "page" : undefined}
                      className={`dd-admin-nav-link flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "is-active bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {labels[item.labelKey] || item.labelKey}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

/**
 * Mobile (<lg) admin nav: horizontal scrolling pill bar (same pattern as
 * the legacy tab bar, proven at 375px). Groups collapse into a flat strip.
 */
export function AdminMobileNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = useNavLabels(locale);
  const base = `/${locale}/admin`;
  const items = ADMIN_NAV.flatMap((g) => g.items);

  return (
    <nav
      aria-label={labels.ariaLabel || "Admin navigation"}
      className="lg:hidden min-w-0"
    >
      <div className="dd-admin-mobile-nav scrollbar-none flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, base, item);
          return (
            <Link
              key={item.href}
              href={`${base}${item.href}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors select-none ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {labels[item.labelKey] || item.labelKey}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
