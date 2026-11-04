import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { AdminShell } from "@/components/admin/shell/admin-shell";

/**
 * Admin section layout: sidebar shell + admin gate.
 *
 * SECURITY NOTE: this layout check is defense-in-depth only (prevents
 * sidebar flash for non-admins). Layouts do not re-run on client-side
 * navigation, so EVERY admin page.tsx must call requireAdminPage()
 * itself, and every /api/admin/* route must use guardRoute(tier:"admin").
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  return <AdminShell locale={locale as Locale}>{children}</AdminShell>;
}
