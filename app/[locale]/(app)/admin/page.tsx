import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { LazyOverviewBoard } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "./page-dict";

export const metadata: Metadata = {
  title: "Overview — Deep Dive Admin",
};

/**
 * /admin — operations cockpit: KPIs, thesis recruitment, alerts,
 * registration trend, recent signups. Every card links to its section.
 */
export default async function AdminOverviewPage({
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
        title={pages.overviewTitle || "Overview"}
        description={
          pages.overviewDesc ||
          "Operations cockpit: KPIs, recruitment, and alerts at a glance."
        }
      />
      <LazyOverviewBoard locale={locale as Locale} />
    </>
  );
}
