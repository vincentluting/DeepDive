"use client";

import Link from "next/link";
import { findLabel } from "@/components/quickdive/quickdive-data";
import { matchCareersClient } from "@/lib/career-matching/client-engine";
import type {
  QuickDiveResultData,
  QuickDiveLabel,
} from "@/components/quickdive/quickdive-data";
import { UnifiedExploreResult } from "@/components/quickdive/unified-explore-result";

export interface PublicResultClientProps {
  report: {
    id: string;
    archetypeCode: string;
    archetypeLabel: string;
    scoresJson: Record<string, number>;
    resultData: {
      sortedScores: [string, number][];
      topCareers: { name: string; pct: number }[];
      fitCareers: { name: string; pct: number }[];
      drainCareers: { name: string; pct: number }[];
      confidenceTier: "HC" | "MC" | "LC";
      labelData?: {
        code: string;
        label_zh: string;
        label_en: string;
        tagline_zh: string;
        tagline_en: string;
        colorHex: string;
      };
    } | null;
    language: string;
    createdAt: string;
    exploreMode: string;
    avatarGender?: "male" | "female" | null;
  };
  locale: string;
  exploreDict: Record<string, string>;
  shareDict: Record<string, string>;
}

function toResultData(
  report: PublicResultClientProps["report"],
  locale: string,
): QuickDiveResultData {
  const rd = report.resultData;
  const archetypeCode = report.archetypeCode;

  const found = findLabel(archetypeCode);
  const label: QuickDiveLabel = found ??
    rd?.labelData ?? {
      code: archetypeCode[0] || archetypeCode,
      label_zh: report.archetypeLabel,
      label_en: report.archetypeLabel,
      tagline_zh: "",
      tagline_en: "",
      // eslint-disable-next-line local/no-hardcoded-brand-colors -- fallback for QuickDiveLabel.colorHex which downstream consumers concat with alpha (`${colorHex}10`); CSS var breaks that.
      colorHex: "#3498DB",
    };

  const sortedScores =
    rd?.sortedScores ??
    Object.entries(report.scoresJson).sort((a, b) => b[1] - a[1]);
  const derived = matchCareersClient(sortedScores, locale);

  return {
    label,
    code: archetypeCode,
    sortedScores,
    topCareers: derived.topCareers,
    fitCareers: derived.fitCareers,
    drainCareers: derived.drainCareers,
    aiEraCareer: derived.aiEraTopPick,
    confidenceTier: rd?.confidenceTier ?? "MC",
  };
}

export function PublicResultClient({
  report,
  locale,
  exploreDict,
  shareDict,
}: PublicResultClientProps) {
  const resultData = toResultData(report, locale);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, var(--depth-shallow) 0%, var(--reef-surface) 40%, var(--reef-shallow) 100%)",
      }}
    >
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 pt-12 pb-8">
        {/* Intro text */}
        <p
          className="text-center text-xs font-medium tracking-widest uppercase mb-8 opacity-50"
          style={{ color: "var(--foreground)" }}
        >
          {shareDict.shareIntro}
        </p>

        {/* Result display */}
        <UnifiedExploreResult
          result={resultData}
          locale={locale}
          t={exploreDict}
          isReportView
          savedReportId={report.id}
          reportCreatedAt={report.createdAt}
          exploreMode={
            report.exploreMode as "classic" | "narrative" | "immersive"
          }
          savedAvatarGender={report.avatarGender ?? null}
        />

        {/* ── Viral loop CTA ── */}
        <div className="mt-10 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--text-secondary-on-shallow)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary-on-shallow)" }}
            >
              {shareDict.discoverYours}
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--text-secondary-on-shallow)" }}
            />
          </div>

          <Link
            href={`/${locale}/quickdive`}
            className="block w-full text-center py-4 rounded-2xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md mb-3"
            style={{
              background:
                "linear-gradient(135deg, var(--depth-abyss) 0%, var(--depth-deep) 100%)",
            }}
          >
            {shareDict.ctaLabel} →
          </Link>

          <p
            className="text-center text-xs"
            style={{ color: "var(--text-secondary-on-shallow)" }}
          >
            {shareDict.ctaSubtext}
          </p>
        </div>

        {/* Footer */}
        <p
          className="text-center text-[10px] mt-10 tracking-widest uppercase"
          style={{ color: "var(--text-secondary-on-shallow)" }}
        >
          DeepDive · deepdive.app
        </p>
      </main>
    </div>
  );
}
