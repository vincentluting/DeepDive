import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminPageHeader } from "@/components/admin/shell/admin-page-header";
import { LazyInviteCodesTab } from "@/components/admin/shell/lazy-panels";
import { getAdminPageDict } from "../page-dict";

export const metadata: Metadata = {
  title: "Invites — Deep Dive Admin",
};

export default async function AdminInvitesPage({
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
        title={pages.invitesTitle || "Invites"}
        description={
          pages.invitesDesc ||
          "Invite codes, cohort assignment, and recruitment tracking."
        }
      />
      <LazyInviteCodesTab locale={locale as Locale} />
    </>
  );
}
