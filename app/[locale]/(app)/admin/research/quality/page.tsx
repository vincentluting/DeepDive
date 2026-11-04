import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { LazyDataQualityPanel } from "@/components/admin/shell/lazy-panels";

export const metadata: Metadata = {
  title: "Research Data Quality — Deep Dive Admin",
};

export default async function AdminResearchQualityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  return <LazyDataQualityPanel locale={locale as Locale} />;
}
