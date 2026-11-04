import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdminPage } from "@/lib/auth/admin-page";
import {
  LazyRecruitmentFunnelCard,
  LazyResearchProgressPanel,
} from "@/components/admin/shell/lazy-panels";

export const metadata: Metadata = {
  title: "Research Progress — Deep Dive Admin",
};

export default async function AdminResearchProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPage(locale);

  return (
    <div className="space-y-6">
      <LazyRecruitmentFunnelCard locale={locale as Locale} />
      <LazyResearchProgressPanel locale={locale as Locale} />
    </div>
  );
}
