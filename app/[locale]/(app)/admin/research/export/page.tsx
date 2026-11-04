import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { LazyResearchExportPanel } from "@/components/admin/shell/lazy-panels";

export const metadata: Metadata = {
  title: "Research Export — Deep Dive Admin",
};

export default async function AdminResearchExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  return <LazyResearchExportPanel locale={locale as Locale} />;
}
