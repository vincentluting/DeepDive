// Force dynamic rendering — reports list must always reflect the latest data.
// Without this, Next.js Full Route Cache can serve stale content after report generation.
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCachedUserReports } from "@/lib/db/cached";
import { ReportsPageClient } from "@/components/features/reports-page-client";
import ReportsLoading from "./loading";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/reports`);
  }

  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent userId={user.id} locale={locale} />
    </Suspense>
  );
}

// ── Heavy data fetching in a separate async component ────
async function ReportsContent({
  userId,
  locale,
}: {
  userId: string;
  locale: string;
}) {
  // Nav already prevents locked users from reaching here.
  // 1 query: full reports (from cache)
  const { reports, error: dbError } = await getCachedUserReports(userId).catch(
    () => ({
      reports: [] as Awaited<
        ReturnType<typeof getCachedUserReports>
      >["reports"],
      error: "Failed to load reports" as string | undefined,
    }),
  );

  return (
    <div className="dd-page-shell dd-reports-page min-h-dvh flex flex-col text-foreground">
      <main className="dd-page-main flex-1 w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 pb-16">
        <ReportsPageClient
          initialReports={reports}
          locale={locale}
          dbError={Boolean(dbError)}
        />
      </main>
    </div>
  );
}
