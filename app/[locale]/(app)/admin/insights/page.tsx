import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { TimeRangeSelect } from "@/components/admin/shell/time-range-context";
import {
  LazyFunnelBoard,
  LazyInsightsTab,
} from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Funnel & Insights — Deep Dive Admin",
};

/**
 * Conversion-side analytics (UserFunnel domain): funnel chart with
 * segmentation on top, then the cross-sectional insights board.
 */
export default async function AdminInsightsPage({
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
        title={pages.insightsTitle || "Funnel & Insights"}
        description={
          pages.insightsDesc ||
          "Conversion funnel and cross-sectional behavior insights."
        }
        actions={<TimeRangeSelect locale={locale as Locale} />}
      />
      <div className="space-y-6">
        <LazyFunnelBoard locale={locale as Locale} />
        <LazyInsightsTab locale={locale as Locale} />
      </div>
    </>
  );
}
