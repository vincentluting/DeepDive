import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { LazyThesisAnalyticsPanel } from "@/components/admin/shell/lazy-panels";

export const metadata: Metadata = {
  title: "Thesis Analytics — Deep Dive Admin",
};

export default async function AdminResearchAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  return <LazyThesisAnalyticsPanel locale={locale as Locale} />;
}
