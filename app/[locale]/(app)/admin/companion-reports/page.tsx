import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin-page";

/** Legacy URL — the Trust & Safety queue now lives at /admin/moderation. */
export default async function CompanionReportsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);
  // gate-redirect-ok: legacy alias — old bookmarks/links land on the new URL
  redirect(`/${locale}/admin/moderation`);
}
