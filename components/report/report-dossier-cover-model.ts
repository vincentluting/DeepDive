// ============================================================
// Report Dossier Cover Model — editorial report summary data
//
// Distills a generated CareerReport into the quiet, high-signal cover model
// used by the premium report reader. It keeps display logic out of JSX.
// ============================================================

import type { Locale } from "@/lib/i18n/config";

type LocalePair = {
  title_en?: string;
  title_zh?: string;
  label_en?: string;
  label_zh?: string;
  tagline_en?: string;
  tagline_zh?: string;
};

type DossierTask = {
  description: string;
  relatedDirection?: number;
  difficulty?: "easy" | "medium" | "stretch";
  isCompleted?: boolean;
};

type DossierDirection = {
  rank: number;
  title_en: string;
  title_zh: string;
  matchScore: number;
  whySuitable?: string;
  challenges?: string;
  explorationNote?: string;
  matchBreakdown: {
    interestFit: number;
    valueFit: number;
    personalityFit: number;
    adaptabilityFit: number;
    industryFit?: number;
  };
  actionableInsights?: {
    thirtyDayChallenge?: {
      challenge_en?: string;
      challenge_zh?: string;
    };
  };
};

export interface ReportDossierSource {
  header: {
    archetype: LocalePair;
  };
  careerMatch: {
    directions: DossierDirection[];
    exploratoryDirections?: DossierDirection[];
  };
  careerPathway?: {
    jobDirections?: Array<LocalePair & { matchScore?: number }>;
    actionPlan?: {
      week1?: {
        tasks?: DossierTask[];
      };
    };
  };
  careerDrainWarning?: {
    redFlagEnvironments?: Array<{
      signal_en?: string;
      signal_zh?: string;
    }>;
  };
  integration?: {
    coreInsight?: string;
  };
  meta?: {
    realConditionsProvided?: boolean;
    qualityScore?: number;
  };
}

export interface ReportDossierMetric {
  label: string;
  value: number;
}

export interface ReportDossierSection {
  number: string;
  label: string;
  body: string;
}

export interface ReportDossierTopDirection {
  rank: number;
  title: string;
  match: number;
}

export interface ReportDossierCoverModel {
  title: string;
  subtitle: string;
  archetypeLabel: string;
  archetypeTagline: string;
  leadLabel: string;
  primaryDirection: {
    title: string;
    match: number;
  };
  /** Top directions preview — a concrete leaderboard that replaces the empty
   *  decorative "field" column with real, comparable signal. */
  topDirections: ReportDossierTopDirection[];
  metrics: ReportDossierMetric[];
  sections: ReportDossierSection[];
  proofPoints: string[];
}

export type ReportDossierDict = Record<string, string | undefined>;

export function buildReportDossierCoverModel(
  source: ReportDossierSource,
  locale: Locale,
  dict: ReportDossierDict,
): ReportDossierCoverModel {
  const directions = [
    ...source.careerMatch.directions,
    ...(source.careerMatch.exploratoryDirections ?? []),
  ];
  const primary = directions[0];
  const archetype = source.header.archetype;
  const breakdown = primary?.matchBreakdown;

  // Historical reports can predate per-direction fit breakdowns (cf. the same
  // guard in career-scatter-map). Only surface the three fit pillars when at
  // least one is a real positive score; otherwise fall back to a single honest
  // overall-match metric instead of rendering a misleading "0% / 0% / 0%".
  const hasFitBreakdown =
    !!breakdown &&
    [breakdown.interestFit, breakdown.valueFit, breakdown.personalityFit].some(
      (value) => typeof value === "number" && value > 0,
    );
  const metrics: ReportDossierMetric[] = hasFitBreakdown
    ? [
        {
          label: text(dict, "interestFit", "Interest"),
          value: clampScore(breakdown?.interestFit ?? 0),
        },
        {
          label: text(dict, "valueFit", "Values"),
          value: clampScore(breakdown?.valueFit ?? 0),
        },
        {
          label: text(dict, "personalityFit", "Personality"),
          value: clampScore(breakdown?.personalityFit ?? 0),
        },
      ]
    : [
        {
          label: text(dict, "cinematicMatch", "Match"),
          value: clampScore(primary?.matchScore ?? 0),
        },
      ];

  return {
    title: text(dict, "cinematicTitle", "Deep Dive Report"),
    subtitle: text(dict, "cinematicSubtitle", ""),
    archetypeLabel: localized(archetype, "label", locale),
    archetypeTagline: localized(archetype, "tagline", locale),
    leadLabel: text(dict, "cinematicLeadLabel", "Primary signal"),
    primaryDirection: {
      title: primary ? localized(primary, "title", locale) : "",
      match: clampScore(primary?.matchScore ?? 0),
    },
    topDirections: directions.slice(0, 3).map((dir, index) => ({
      rank: dir.rank || index + 1,
      title: localized(dir, "title", locale),
      match: clampScore(dir.matchScore ?? 0),
    })),
    // Fit pillars (interest / value / personality) of the top direction — why
    // it fits this reader — replacing the previous vanity pair (industry
    // "Reality" + the internal LLM quality score shown as "Evidence 33%", which
    // read as "your report is only 33% trustworthy"). Reuses the match-breakdown
    // dictionary keys already localized in all 11 locales. See `metrics` above
    // for the historical-data fallback.
    metrics,
    sections: [
      {
        number: "01",
        label: text(dict, "cinematicEvidence", "Evidence"),
        body:
          firstSentences(primary?.whySuitable, 2) ||
          firstSentences(source.integration?.coreInsight, 2) ||
          text(dict, "cinematicEvidenceFallback", ""),
      },
      {
        number: "02",
        label: text(dict, "cinematicDrains", "Drains"),
        body:
          firstSentences(primary?.challenges, 2) ||
          localized(
            source.careerDrainWarning?.redFlagEnvironments?.[0],
            "signal",
            locale,
          ) ||
          text(dict, "cinematicDrainFallback", ""),
      },
      {
        number: "03",
        label: text(dict, "cinematicExperiments", "Experiments"),
        body:
          localized(
            primary?.actionableInsights?.thirtyDayChallenge,
            "challenge",
            locale,
          ) ||
          primary?.explorationNote ||
          source.careerPathway?.actionPlan?.week1?.tasks?.[0]?.description ||
          text(dict, "cinematicExperimentFallback", ""),
      },
    ],
    proofPoints: [
      text(dict, "cinematicProofPrivate", "Private to you"),
      text(dict, "cinematicProofEvidence", "Evidence-based"),
      text(dict, "cinematicProofProduct", "Product, not play"),
    ],
  };
}

function localized(
  source: object | undefined,
  field: "label" | "tagline" | "title" | "signal" | "challenge",
  locale: Locale,
): string {
  if (!source) return "";
  const record = source as Record<string, string | undefined>;
  return record[`${field}_${locale}`] ?? record[`${field}_en`] ?? "";
}

function text(dict: ReportDossierDict, key: string, fallback: string): string {
  return dict[key] ?? fallback;
}

/** Take up to `max` leading sentences so section bodies read as a complete
 *  thought rather than a clipped fragment ("…conflict but no one handles it").
 *  Each match is a run of non-terminator characters followed by one or more
 *  sentence terminators — crucially this does NOT require trailing whitespace,
 *  so it also splits CJK text, which has no inter-sentence spaces.
 *  Falls back to the whole string when no terminator is present. */
function firstSentences(raw: string | undefined, max: number): string {
  const value = raw?.trim();
  if (!value) return "";
  const matches = value.match(/[^.!?。！？]+[.!?。！？]+/gu);
  if (!matches || matches.length === 0) return value;
  // Join raw matches (each carries any leading inter-sentence space for Latin
  // scripts; Chinese has none) and trim only the ends.
  return matches.slice(0, max).join("").trim();
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(100, value)));
}
