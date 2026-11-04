"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { AdminSidebar, AdminMobileNav } from "./admin-sidebar";
import { AdminTimeRangeProvider } from "./time-range-context";

/**
 * Admin shell — SaaS layout on the Utility surface:
 *   desktop (≥lg): fixed-width grouped sidebar + content column
 *   mobile (<lg): horizontal scrolling pill nav above content
 * Wraps everything in the shared time-range provider.
 */
export function AdminShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <AdminTimeRangeProvider>
      <div className="dd-admin-shell dd-admin-page min-h-dvh bg-background overflow-x-clip">
        <div className="dd-admin-frame mx-auto w-full max-w-[94rem] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-[calc(var(--mobile-tab-bar-height,0px)+2rem)]">
          <div className="dd-admin-layout lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6 2xl:grid-cols-[16rem_minmax(0,1fr)_9rem]">
            <AdminSidebar locale={locale} />
            <div className="dd-admin-main min-w-0 space-y-4">
              <AdminMobileNav locale={locale} />
              <main className="min-w-0">{children}</main>
            </div>
            <AdminInstrumentRail />
          </div>
        </div>
      </div>
    </AdminTimeRangeProvider>
  );
}

function AdminInstrumentRail() {
  return (
    <aside className="dd-admin-right-rail hidden 2xl:block" aria-hidden="true">
      <div className="dd-admin-depth-meter">
        <span>0</span>
        <i />
        <span>200</span>
        <i />
        <strong>426m</strong>
        <i />
        <span>800</span>
      </div>
      <div className="dd-admin-system-dots">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="dd-admin-rail-time">
        <strong>14:42</strong>
        <span>CEST</span>
      </div>
    </aside>
  );
}
