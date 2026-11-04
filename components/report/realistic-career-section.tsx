"use client";

import type {
  Panel3Pathway,
  Panel1CareerMatch,
  CareerReport,
  ReportDict,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { ReportCareerPathway } from "./report-career-pathway";
import { CareerScatterMap } from "./career-scatter-map";
import { AiEraOpportunities } from "./ai-era-opportunities";
import { AiAnxietyContainer } from "./ai-anxiety-container";

interface RealisticCareerSectionProps {
  pathway: Panel3Pathway;
  reportId: string;
  locale: Locale;
  t: ReportDict;
  sessionId?: string | null;
  userId?: string | null;
  assessmentId?: string | null;
  /** Transition text from integration layer (profile → pathway) */
  transitionText?: string;
  /** Career match section for showing directions when real conditions not provided */
  careerMatch?: Panel1CareerMatch | null;
  /** Callback when report is updated via pathway regeneration */
  onReportUpdated?: (report: CareerReport) => void;
}

export function RealisticCareerSection({
  pathway,
  reportId,
  locale,
  t,
  sessionId,
  userId,
  assessmentId,
  transitionText,
  careerMatch,
  onReportUpdated,
}: RealisticCareerSectionProps) {
  return (
    <section id="realistic-directions">
      {/* Transition from profile to pathway */}
      {transitionText && (
        <div className="mb-10 text-center">
          <div className="w-12 h-px mx-auto bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent mb-4" />
          <p className="text-sm text-muted-foreground italic max-w-xl mx-auto">
            {transitionText}
          </p>
        </div>
      )}

      {/* Scatter-map overview — the duplicate cinematic cover that used to open
          this chapter is gone (the dossier cover already carries the
          leaderboard + fit pillars). In its place we restore the interest ×
          value scatter map: a single-image overview of all directions plotted
          on the two fit axes (bubble size = match), giving the reader the lay
          of the land before the detailed pathway cards. */}
      {careerMatch?.directions && careerMatch.directions.length > 0 && (
        <CareerScatterMap
          directions={[
            ...careerMatch.directions,
            ...(careerMatch.exploratoryDirections ?? []),
          ].slice(0, 5)}
          locale={locale}
          t={t}
        />
      )}

      <ReportCareerPathway
        pathway={pathway}
        reportId={reportId}
        locale={locale}
        t={t}
        sessionId={sessionId}
        userId={userId}
        assessmentId={assessmentId}
        careerMatch={careerMatch}
        onReportUpdated={onReportUpdated}
      />

      {/* AI-era anxiety preface — emotional naming before the V1 cognitive section.
          Renders only when aiEraPersonalInsight is present, since it depends on
          adaptabilityScore for tiered display. */}
      {careerMatch?.aiEraPersonalInsight && (
        <AiAnxietyContainer
          personalInsight={careerMatch.aiEraPersonalInsight}
          locale={locale}
          t={t}
        />
      )}

      {/* AI Era Opportunities — separate section after main directions */}
      {(careerMatch?.aiEraDirections?.length ||
        careerMatch?.aiEraPersonalInsight) && (
        <AiEraOpportunities
          directions={careerMatch?.aiEraDirections ?? []}
          reportId={reportId}
          locale={locale}
          t={t}
          personalInsight={careerMatch?.aiEraPersonalInsight}
        />
      )}
    </section>
  );
}
