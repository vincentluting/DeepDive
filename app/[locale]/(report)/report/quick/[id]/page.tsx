import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getQuickDiveReport } from "@/lib/db/platform";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { QuickReportClient, type QuickReportData } from "./quick-report-client";

export default async function QuickDiveReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale as Locale);
  const tReport = dict.quickDiveReport;
  const tExplore = dict.quickDive as Record<string, string>;

  // Server-side data fetch — no client API call needed
  const report = await getQuickDiveReport(id);

  if (!report) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, var(--depth-shallow) 0%, var(--reef-surface) 40%, var(--reef-shallow) 100%)",
        }}
      >
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "var(--destructive)" }}
            />
            <p className="text-lg" style={{ color: "var(--foreground)" }}>
              {tReport.notFound}
            </p>
            <Link
              href={`/${locale}/reports`}
              className="inline-flex items-center gap-2 mt-4 hover:underline"
              style={{ color: "var(--depth-reef)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              {tReport.backToReports}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const data: QuickReportData = {
    id: report.id,
    archetypeCode: report.archetypeCode,
    archetypeLabel: report.archetypeLabel,
    scoresJson: report.scoresJson,
    resultData: report.resultDataJson as QuickReportData["resultData"],
    language: report.language,
    createdAt: report.createdAt,
    exploreMode: report.exploreMode,
    avatarGender: report.avatarGender,
  };

  return (
    <QuickReportClient
      data={data}
      locale={locale}
      dict={tReport}
      exploreDict={tExplore}
    />
  );
}
