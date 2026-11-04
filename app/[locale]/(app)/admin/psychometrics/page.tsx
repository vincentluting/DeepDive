import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { LazyUserProfilesTab } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Psychometrics — Deep Dive Admin",
};

export default async function AdminPsychometricsPage({
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
        title={pages.psychometricsTitle || "Psychometrics"}
        description={
          pages.psychometricsDesc ||
          "Aggregated assessment profiles across the user base."
        }
      />
      <LazyUserProfilesTab locale={locale as Locale} />
    </>
  );
}
