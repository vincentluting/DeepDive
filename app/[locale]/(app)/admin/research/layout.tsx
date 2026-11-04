import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { SectionNav } from "@/components/admin/shared/section-nav";
import { getAdminPageDict } from "../page-dict";

/**
 * Research section layout: thesis cockpit with second-level nav.
 * Each sub-view is a real URL (bookmarkable during data collection).
 * Auth is enforced by each child page via requireAdminPage().
 */
export default async function ResearchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { pages, admin } = await getAdminPageDict(locale);
  const nav = (admin.nav ?? {}) as Record<string, string>;
  const base = `/${locale as Locale}/admin/research`;

  return (
    <>
      <AdminPageHeader
        title={pages.researchTitle || "Research"}
        description={
          pages.researchDesc ||
          "Thesis recruitment progress, statistics, data quality, and export."
        }
      />
      <div className="space-y-6">
        <SectionNav
          items={[
            { href: base, label: nav.researchProgress || "Progress" },
            {
              href: `${base}/analytics`,
              label: nav.researchAnalytics || "Analytics",
            },
            {
              href: `${base}/quality`,
              label: nav.researchQuality || "Data Quality",
            },
            { href: `${base}/export`, label: nav.researchExport || "Export" },
          ]}
        />
        {children}
      </div>
    </>
  );
}
