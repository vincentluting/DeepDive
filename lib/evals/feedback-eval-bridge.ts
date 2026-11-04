// ============================================================
// Feedback → Eval Bridge
//
// Connects user reactions (ReportReaction) with narrative eval
// scores (evaluateNarrative). Enables quality monitoring:
//
//   1. When a user reacts "skeptical" → run eval on that report's
//      narratives to check if quality scores are below baseline
//   2. Aggregate reaction↔eval correlation over time to calibrate
//      what "good enough" means for automated quality gates
//
// Usage:
//   import { evalReportNarratives } from '@/lib/evals/feedback-eval-bridge'
//   const results = await evalReportNarratives(reportId)
// ============================================================

import { sql } from "@/lib/db/connection";
import {
  evaluateNarrative,
  type NarrativeEvalInput,
  type NarrativeEvalResult,
} from "./narrative-eval";

/** Report narrative segments extracted from DB */
interface ReportNarratives {
  reportId: string;
  locale: string;
  careerMatchSummary?: string;
  coreInsight?: string;
  letterToUser?: string;
  chapterTexts: Array<{ label: string; text: string }>;
}

/**
 * Extract narrative segments from a report for evaluation.
 * Returns null if report not found.
 */
export async function extractReportNarratives(
  reportId: string,
): Promise<ReportNarratives | null> {
  const rows = await sql`
    SELECT
      cr."id",
      cr."locale",
      cr."reportJson"
    FROM "CareerReport" cr
    WHERE cr."id" = ${reportId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  const reportJson = row.reportJson as Record<string, unknown> | null;
  if (!reportJson) return null;

  const locale = (row.locale as string) || "en";
  const segments: Array<{ label: string; text: string }> = [];

  // Extract career match narrative
  const careerMatch = reportJson.careerMatch as Record<string, unknown> | null;
  const careerMatchSummary = careerMatch?.summary as string | undefined;
  if (careerMatchSummary) {
    segments.push({ label: "careerMatch.summary", text: careerMatchSummary });
  }

  // Extract integration narratives
  const integration = reportJson.integration as Record<string, unknown> | null;
  const coreInsight = integration?.coreInsight as string | undefined;
  const letterToUser = integration?.letterToUser as string | undefined;
  if (coreInsight) {
    segments.push({ label: "integration.coreInsight", text: coreInsight });
  }
  if (letterToUser) {
    segments.push({ label: "integration.letterToUser", text: letterToUser });
  }

  // Extract chapter narratives
  const chapters = reportJson.chapters as Array<Record<string, unknown>> | null;
  if (chapters) {
    for (const ch of chapters) {
      const title = (ch.title_en || ch.title_zh || `ch${ch.order}`) as string;
      const body = ch.bodyMarkdown as string | undefined;
      if (body) {
        segments.push({ label: `chapter.${title}`, text: body });
      }
    }
  }

  return {
    reportId,
    locale,
    careerMatchSummary,
    coreInsight,
    letterToUser,
    chapterTexts: segments,
  };
}

/**
 * Run narrative evaluation on a report's content.
 * Returns eval result with quality scores per metric.
 */
export async function evalReportNarratives(
  reportId: string,
): Promise<NarrativeEvalResult | null> {
  const narratives = await extractReportNarratives(reportId);
  if (!narratives || narratives.chapterTexts.length === 0) return null;

  const input: NarrativeEvalInput = {
    id: `report-${reportId}`,
    kind: "report",
    locale: narratives.locale === "zh" ? "zh" : "en",
    title: `Report ${reportId}`,
    segments: narratives.chapterTexts,
    source: "user-report",
  };

  return evaluateNarrative(input);
}

/**
 * Get aggregated reaction counts and average eval scores for reports.
 * Used by admin dashboard for quality monitoring.
 *
 * Returns one row per reaction type with:
 *   - count of reactions
 *   - average eval scores for reports in that reaction bucket
 */
export async function getReactionEvalCorrelation(): Promise<
  Array<{
    reaction: string;
    count: number;
    reportIds: string[];
  }>
> {
  const rows = await sql`
    SELECT
      rr."reaction",
      COUNT(*)::int AS "count",
      array_agg(DISTINCT rr."reportId") AS "reportIds"
    FROM "ReportReaction" rr
    GROUP BY rr."reaction"
    ORDER BY "count" DESC
  `;

  return rows.map((r) => ({
    reaction: r.reaction as string,
    count: r.count as number,
    reportIds: (r.reportIds as string[]) || [],
  }));
}

/**
 * Evaluate all reports with "skeptical" reactions.
 * Returns eval results to identify quality patterns.
 */
export async function evalSkepticalReports(): Promise<
  Array<{
    reportId: string;
    eval: NarrativeEvalResult | null;
  }>
> {
  const rows = await sql`
    SELECT DISTINCT rr."reportId"
    FROM "ReportReaction" rr
    WHERE rr."reaction" = 'skeptical'
    ORDER BY rr."reportId"
    LIMIT 50
  `;

  const results = [];
  for (const row of rows) {
    const reportId = row.reportId as string;
    const evalResult = await evalReportNarratives(reportId);
    results.push({ reportId, eval: evalResult });
  }

  return results;
}
