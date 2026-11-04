import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { TimeRangeSelect } from "@/components/admin/shell/time-range-context";
import { LazyAIUsageTab } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "AI Usage — Deep Dive Admin",
};

export default async function AdminAIUsagePage({
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
        title={pages.aiTitle || "AI Usage"}
        description={
          pages.aiDesc || "LLM call volume, cost, and provider health."
        }
        actions={<TimeRangeSelect locale={locale as Locale} />}
      />
      <LazyAIUsageTab locale={locale as Locale} />
    </>
  );
}
