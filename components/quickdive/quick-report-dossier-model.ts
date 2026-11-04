// ============================================================
// Quick Report Dossier Model — first-signal editorial summary
//
// Converts Quick Dive's RIASEC-only result into the calmer report model used
// by the premium Quick Dive report surface.
// ============================================================

import type { Locale } from "@/lib/i18n/config";
import type { CareerItem, QuickDiveResultData } from "./quickdive-data";

type AxisId = "build" | "guide" | "analyze" | "create";
type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C";

export interface QuickReportAxis {
  id: AxisId;
  label: string;
  value: number;
}

export interface QuickReportSignal {
  label: string;
  value: number;
}

export interface QuickReportDossierModel {
  title: string;
  generatedLabel: string;
  generatedAt: string;
  identityLabel: string;
  identityTagline: string;
  summary: string;
  axes: QuickReportAxis[];
  topSignals: QuickReportSignal[];
  drainSignals: QuickReportSignal[];
  ctaTitle: string;
}

export type QuickReportDossierDict = Record<string, string | undefined>;

const DEFAULT_AXIS_LABELS: Record<AxisId, string> = {
  build: "Build",
  guide: "Guide",
  analyze: "Analyze",
  create: "Create",
};

export function buildInterestFieldAxes(
  sortedScores: [string, number][],
  labels: Partial<Record<AxisId, string>> = {},
): QuickReportAxis[] {
  const scores = toScores(sortedScores);
  const axisLabels = { ...DEFAULT_AXIS_LABELS, ...labels };

  return [
    {
      id: "build",
      label: axisLabels.build,
      value: normalizeScore((scores.R + scores.C) / 2),
    },
    {
      id: "guide",
      label: axisLabels.guide,
      value: normalizeScore((scores.S + scores.E) / 2),
    },
    {
      id: "analyze",
      label: axisLabels.analyze,
      value: normalizeScore((scores.I + scores.C) / 2),
    },
    {
      id: "create",
      label: axisLabels.create,
      value: normalizeScore((scores.A + scores.I) / 2),
    },
  ];
}

export function buildQuickReportDossierModel({
  result,
  locale,
  createdAt,
  dict,
}: {
  result: QuickDiveResultData;
  locale: Locale | string;
  createdAt: string;
  dict: QuickReportDossierDict;
}): QuickReportDossierModel {
  const loc = locale === "zh" ? "zh" : "en";
  const identityLabel =
    loc === "zh" ? result.label.label_zh : result.label.label_en;
  const identityTagline =
    loc === "zh" ? result.label.tagline_zh : result.label.tagline_en;
  const topSignals = result.topCareers
    .concat(result.fitCareers)
    .slice(0, 3)
    .map(toSignal);

  return {
    title: dict.title ?? "Quick Dive Report",
    generatedLabel: dict.generatedAt ?? "Generated on",
    generatedAt: createdAt,
    identityLabel,
    identityTagline,
    summary: buildSummary(result.confidenceTier, identityLabel, dict),
    axes: buildInterestFieldAxes(result.sortedScores, {
      build: dict.axisBuild,
      guide: dict.axisGuide,
      analyze: dict.axisAnalyze,
      create: dict.axisCreate,
    }),
    topSignals,
    drainSignals: result.drainCareers.slice(0, 2).map(toSignal),
    ctaTitle: dict.deepDiveCta ?? "Want a deeper look?",
  };
}

function toScores(sortedScores: [string, number][]): Record<RiasecKey, number> {
  const scores: Record<RiasecKey, number> = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };

  for (const [key, value] of sortedScores) {
    if (isRiasecKey(key)) scores[key] = value;
  }

  return scores;
}

function isRiasecKey(key: string): key is RiasecKey {
  return (
    key === "R" ||
    key === "I" ||
    key === "A" ||
    key === "S" ||
    key === "E" ||
    key === "C"
  );
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, (value / 20) * 100)));
}

function toSignal(career: CareerItem): QuickReportSignal {
  return {
    label: career.name,
    value: Math.round(Math.max(0, Math.min(100, career.pct))),
  };
}

function buildSummary(
  tier: QuickDiveResultData["confidenceTier"],
  identityLabel: string,
  dict: QuickReportDossierDict,
): string {
  if (tier === "HC") {
    return `${dict.highConfidencePrefix ?? ""}${identityLabel}`;
  }
  if (tier === "MC") {
    return `${dict.medConfidencePrefix ?? ""}${identityLabel}`;
  }
  return dict.lowConfidenceBody ?? dict.lowConfidenceTitle ?? identityLabel;
}
