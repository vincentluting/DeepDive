"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { type Locale, toDateLocale } from "@/lib/i18n/config";
import { ArrowLeft } from "lucide-react";
import { findLabel } from "@/components/quickdive/quickdive-data";
import { matchCareersClient } from "@/lib/career-matching/client-engine";
import type {
  QuickDiveResultData,
  QuickDiveLabel,
} from "@/components/quickdive/quickdive-data";
import { DepthLayerFooter } from "@/components/report/depth-layer-footer";
import { UnifiedExploreResult } from "@/components/quickdive/unified-explore-result";

export interface QuickReportData {
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
}

function toResultData(
  data: QuickReportData,
  locale: string,
): QuickDiveResultData {
  const rd = data.resultData;
  const archetypeCode = data.archetypeCode;

  // Prefer findLabel (resolves 12-type codes via ARCHETYPE_MAP)
  // over stale labelData which may contain old 6-type names
  const found = findLabel(archetypeCode);
  const label: QuickDiveLabel = found ??
    rd?.labelData ?? {
      code: archetypeCode[0] || archetypeCode,
      label_zh: data.archetypeLabel,
      label_en: data.archetypeLabel,
      tagline_zh: "",
      tagline_en: "",
      // eslint-disable-next-line local/no-hardcoded-brand-colors -- fallback for QuickDiveLabel.colorHex which downstream consumers concat with alpha (`${colorHex}10`); CSS var breaks that.
      colorHex: "#3498DB",
    };

  const sortedScores =
    rd?.sortedScores ??
    Object.entries(data.scoresJson).sort((a, b) => b[1] - a[1]);
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

interface QuickReportClientProps {
  data: QuickReportData;
  locale: string;
  dict: Record<string, string>;
  exploreDict: Record<string, string>;
}

export function QuickReportClient({
  data,
  locale,
  dict: tReport,
  exploreDict: tExplore,
}: QuickReportClientProps) {
  const resultData = toResultData(data, locale);

  return (
    <div
      data-surface="revelation"
      className="dd-quick-report-page min-h-screen flex flex-col bg-rev-paper text-rev-ink"
    >
      <main className="flex-1 w-full pb-24">
        <div
          className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pb-6 sm:px-6 lg:px-10"
          style={{ paddingTop: "calc(var(--header-height, 64px) + 24px)" }}
        >
          <Link
            href={`/${locale}/reports`}
            className="inline-flex min-h-11 items-center gap-2 text-sm transition-colors duration-200"
            style={{ color: "var(--rev-ink-soft)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            {tReport.backToReports}
          </Link>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden text-xs font-medium uppercase tracking-[0.18em] sm:block"
            style={{ color: "var(--md-gold-text)" }}
          >
            {new Date(data.createdAt).toLocaleDateString(
              toDateLocale(locale as Locale),
              { year: "numeric", month: "long", day: "numeric" },
            )}
          </motion.p>
        </div>

        {/* Unified with the live /result/qd atlas — saved & admin views now
            render the full 10-compartment chart-room dossier instead of the
            old simplified card. `isReportView` full-bleeds and drops the
            upsell/claim zones. */}
        <UnifiedExploreResult
          result={resultData}
          locale={locale}
          t={tExplore}
          isReportView
          savedReportId={data.id}
          reportCreatedAt={data.createdAt}
          exploreMode={
            data.exploreMode as "classic" | "narrative" | "immersive"
          }
          savedAvatarGender={data.avatarGender ?? null}
        />

        <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
          <DepthLayerFooter
            currentDepth="quick"
            locale={locale as "en" | "zh"}
          />
        </div>
      </main>

      <MobileTabBar locale={locale as Locale} />
    </div>
  );
}
