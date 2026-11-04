import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { UsersPanel } from "@/components/admin/users/users-panel";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Users — Deep Dive Admin",
};

export default async function AdminUsersPage({
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
        title={pages.usersTitle || "Users"}
        description={pages.usersDesc || "Manage accounts and review activity."}
      />
      <UsersPanel locale={locale as Locale} />
    </>
  );
}
