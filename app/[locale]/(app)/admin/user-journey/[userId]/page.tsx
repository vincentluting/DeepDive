/**
 * Admin User Journey Detail Page — /[locale]/admin/user-journey/[userId]
 * Server component that handles auth check and renders the client shell.
 */
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { UserJourneyClient } from "./user-journey-client";

export const metadata: Metadata = {
  title: "User Journey — Deep Dive Admin",
  description: "View complete user journey details.",
};

export default async function UserJourneyPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;
  await requireAdminPage(locale);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <UserJourneyClient locale={locale as Locale} userId={userId} />
    </div>
  );
}
