import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { TimeRangeSelect } from "@/components/admin/shell/time-range-context";
import { LazyAnalyticsDashboardPanel } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Traffic — Deep Dive Admin",
};

/**
 * Traffic-side analytics (PageVisit domain): PV/UV, pages, referrers,
 * geography, devices, campaigns, site health.
 */
export default async function AdminTrafficPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);
  const { pages } = await getAdminPageDict(locale);

  return (
    <>
      <AdminPageHeader
        title={pages.trafficTitle || "Traffic"}
        description={
          pages.trafficDesc ||
          "Page views, visitors, referrers, and site health."
        }
        actions={<TimeRangeSelect locale={locale as Locale} />}
      />
      <LazyAnalyticsDashboardPanel locale={locale as Locale} />
    </>
  );
}
