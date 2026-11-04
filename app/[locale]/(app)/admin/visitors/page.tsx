import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { LazyAnonymousQDTab } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Visitors — Deep Dive Admin",
};

export default async function AdminVisitorsPage({
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
        title={pages.visitorsTitle || "Visitors"}
        description={
          pages.visitorsDesc ||
          "Anonymous Quick Dive results and registration conversion."
        }
      />
      <LazyAnonymousQDTab locale={locale as Locale} />
    </>
  );
}
