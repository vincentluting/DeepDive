// DimensionExplorer — Zone C: Spotlight Carousel + Bento Grid + Overlay expansion
"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type {
  PersonalProfileData,
  RIASECDimension,
  BigFiveDimension,
} from "@/lib/types";
import {
  SCHWARTZ_VALUE_LABELS,
  BIG_FIVE_LABELS,
  COLLAB_STYLE_COLORS,
  CROSS_CULTURAL_LABELS,
} from "@/lib/scoring/constants";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { SpotlightCarousel } from "./spotlight-carousel";
import type { SpotlightItem } from "./spotlight-carousel";
import { DimensionOverlay } from "./dimension-overlay";
import { ValueAnchors } from "./value-anchors";
const BigFiveChart = dynamic(
  () => import("./big-five-chart").then((m) => m.BigFiveChart),
  { ssr: false },
);
import { CognitiveStyleBreakdown } from "./cognitive-style-breakdown";
import { RIASECDimensionBars } from "./riasec-radar";
import { CoreQualitiesContent } from "./core-qualities-card";
import { SocialStyleContent } from "./social-style-card";
import { LeadershipStyleContent } from "./leadership-style-card";
import { InterpersonalInsightsContent } from "./interpersonal-insights-card";
import { InterpersonalEnergyContent } from "./interpersonal-energy-card";
import { ConflictHandlingContent } from "./conflict-handling-card";
import { WorkEnvironmentCard } from "./work-environment-card";
import {
  computeWorkEnvSignal,
  deriveEnvironmentPreferences,
  hasRequiredWorkEnvFacets,
} from "./derive-environment-preferences";
import { PersonalityShadow } from "./personality-shadow";
import { CollabStyleSection } from "./collab-style-section";

// Lazy-load the radar chart (pulls in recharts ~200KB gzipped)
const RIASECRadarChart = dynamic(
  () =>
    import("./riasec-radar").then((mod) => ({ default: mod.RIASECRadarChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rev-rule border-t-rev-glow-cold rounded-full animate-spin" />
      </div>
    ),
  },
);

type ConfidenceBreakdownEntry = {
  dimension: string;
  confidence: number;
  reasons: { factor: string; impact: number; detail: string }[];
};

interface DimensionExplorerProps {
  profile: PersonalProfileData;
  locale: string;
  /** Optional RIASEC normalized scores for the radar chart */
  riasecScores?: Record<RIASECDimension, number>;
  /** Optional confidence breakdown entries */
  confidenceBreakdown?: ConfidenceBreakdownEntry[];
  /** Admin viewing another user's profile — suppress write actions
   *  (achievement events, dimension feedback). */
  viewingAsAdmin?: boolean;
}

// ── Summary helpers ──────────────────────────────────────────

/** Build a short summary for the Values card: "Top: X, Y, Z" */
function valuesSummary(profile: PersonalProfileData, loc: "en" | "zh"): string {
  const top3 = profile.schwartzAnchors?.top3 ?? [];
  const labels = top3.map((key) => {
    const label =
      SCHWARTZ_VALUE_LABELS[key as keyof typeof SCHWARTZ_VALUE_LABELS];
    return label ? pickLocaleText(label, loc) : key;
  });
  return labels.join(" · ") || "—";
}

/** Build a short summary for the Collab card: primary style name */
function collabSummary(profile: PersonalProfileData, loc: "en" | "zh"): string {
  const primary = profile.collabMapping?.primary;
  const secondary = profile.collabMapping?.secondary;
  if (!primary) return "—";
  const primaryName =
    getLocalizedField(COLLAB_STYLE_COLORS[primary], "name", loc) || primary;
  const secondaryName = secondary
    ? getLocalizedField(COLLAB_STYLE_COLORS[secondary], "name", loc)
    : null;
  return secondaryName ? `${primaryName} + ${secondaryName}` : primaryName;
}

/** Build a short summary for Big Five card: highest + lowest dimension */
function bigFiveSummary(
  profile: PersonalProfileData,
  loc: "en" | "zh",
  t: Record<string, string>,
): string {
  const scores = profile.bigFiveScores;
  if (!scores) return "—";
  const dims: BigFiveDimension[] = [
    "openness",
    "conscientiousness",
    "extraversion",
    "agreeableness",
    "neuroticism",
  ];
  let highest: BigFiveDimension = dims[0];
  let lowest: BigFiveDimension = dims[0];
  for (const d of dims) {
    if ((scores[d] ?? 0) > (scores[highest] ?? 0)) highest = d;
    if ((scores[d] ?? 0) < (scores[lowest] ?? 0)) lowest = d;
  }
  const highLabel = pickLocaleText(BIG_FIVE_LABELS[highest], loc);
  const lowLabel = pickLocaleText(BIG_FIVE_LABELS[lowest], loc);
  return `${t.cardBigFiveHighest}: ${highLabel} · ${t.cardBigFiveLowest}: ${lowLabel}`;
}

/** Build a short summary for RIASEC card: Top-2 codes */
function riasecSummary(
  profile: PersonalProfileData,
  t: Record<string, string>,
): string {
  const riasec = profile.riasecScores;
  if (!riasec) return "—";
  const sorted = (Object.entries(riasec) as [RIASECDimension, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const top2 = sorted.slice(0, 2).map(([key]) => {
    // Use brand name from i18n
    const brandKeys: Record<RIASECDimension, string> = {
      R: "build",
      I: "decode",
      A: "create",
      S: "connect",
      E: "drive",
      C: "structure",
    };
    return t[brandKeys[key] as keyof typeof t] || key;
  });
  return top2.join(" + ");
}

/** Build a short summary for Cognitive Style card */
function cognitiveSummary(
  profile: PersonalProfileData,
  t: Record<string, string>,
): string {
  if (
    profile.cognitiveStyleDisplayMode === "balanced" ||
    !profile.cognitiveStyleCode
  ) {
    return t.balancedCognitiveDesc || "—";
  }
  return profile.cognitiveStyleCode;
}

/** Build a short summary for Core Qualities card */
function coreQualitiesSummary(
  profile: PersonalProfileData,
  loc: "en" | "zh",
): string {
  const cqs = profile.coreQualities;
  if (!cqs || cqs.length === 0) return "—";
  return cqs.map((q) => pickLocaleText(q.coreQuality, loc)).join(" · ");
}

/** Build a short summary for Shadow card */
function shadowSummary(
  profile: PersonalProfileData,
  t: Record<string, string>,
): string {
  const count = profile.shadowInsights?.shadows?.length ?? 0;
  if (count === 0) return "—";
  return interpolate(t.cardShadowCount, { count: String(count) });
}

// ── Signal strength computation ─────────────────────────────
/** Compute how "notable" each dimension is for this user (0-100).
 *  Higher = more defining / more extreme score. Used for sort + badge. */
function computeSignalStrengths(
  profile: PersonalProfileData,
): Record<string, number> {
  const signals: Record<string, number> = {};

  // RIASEC: spread between top-1 and average
  if (profile.riasecScores) {
    const vals = Object.values(profile.riasecScores);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    signals.riasec = Math.round(Math.min(100, ((max - avg) / 40) * 100));
  }

  // Values: confidence of top value
  const valConf = profile.confidenceMap?.values;
  signals.values = valConf != null ? Math.round(valConf * 100) : 60;

  // Collab: confidence
  const collabConf = profile.confidenceMap?.collab;
  signals.collab = collabConf != null ? Math.round(collabConf * 100) : 50;

  // Big Five: max deviation from 50 (midpoint)
  if (profile.bigFiveScores) {
    const deviations = Object.values(profile.bigFiveScores).map((v) =>
      Math.abs((v ?? 50) - 50),
    );
    const maxDev = Math.max(...deviations);
    signals.bigFive = Math.round(Math.min(100, (maxDev / 35) * 100));
  }

  // Cognitive: if balanced, lower signal; if clear code, higher
  signals.cognitive =
    profile.cognitiveStyleDisplayMode === "balanced" ? 30 : 65;

  // Shadow: more shadows = stronger signal
  const shadowCount = profile.shadowInsights?.shadows?.length ?? 0;
  signals.shadow = Math.round(Math.min(100, shadowCount * 30));

  // Core Qualities: based on max facet deviation
  const cqDeviation = profile.coreQualities?.[0]?.deviation;
  signals.coreQualities =
    cqDeviation != null
      ? Math.round(Math.min(100, Math.abs(cqDeviation) * 80))
      : 0;

  // Social Style: how far from center (50,50) — more extreme = stronger signal
  if (profile.socialStyle) {
    const eDist = Math.abs(profile.socialStyle.extraversionScore - 50);
    const aDist = Math.abs(profile.socialStyle.agreeablenessScore - 50);
    signals.socialStyle = Math.round(Math.min(100, (eDist + aDist) * 1.5));
  }

  // Interpersonal Energy: how far from center on both axes
  if (profile.interpersonalEnergy) {
    const aDist = Math.abs(profile.interpersonalEnergy.agency - 50);
    const cDist = Math.abs(profile.interpersonalEnergy.communion - 50);
    signals.interpersonalEnergy = Math.round(
      Math.min(100, (aDist + cDist) * 1.5),
    );
  }

  // Conflict Handling: how dominant is the primary mode
  if (profile.conflictHandling) {
    const scores = Object.values(profile.conflictHandling.modeScores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    signals.conflictHandling = Math.round(Math.min(100, (max - avg) * 2.5));
  }

  // Interpersonal: fixed moderate signal (always relevant)
  signals.interpersonal = 50;

  // Leadership: how dominant is the primary style
  if (profile.leadershipStyle) {
    const ls = profile.leadershipStyle.scores;
    const vals = Object.values(ls);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    signals.leadershipStyle = Math.round(Math.min(100, (max - avg) * 2.5));
  }

  return signals;
}

// ── Animation variants ───────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ── Main component ───────────────────────────────────────────

export function DimensionExplorer({
  profile,
  locale,
  riasecScores,
  confidenceBreakdown,
  viewingAsAdmin = false,
}: DimensionExplorerProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";

  // Cross-cultural data for the Shadow card
  const { crossCultural } = profile;
  const hasCrossCultural = crossCultural.type !== null;
  const crossCulturalLabel = crossCultural.type
    ? getLocalizedField(crossCultural, "label", loc) ||
      CROSS_CULTURAL_LABELS[crossCultural.type]?.en ||
      crossCultural.type
    : null;

  // Cross-cultural type descriptions (inline bilingual, accessed via pickLocaleText — compliant)
  const CROSS_CULTURAL_DESCRIPTIONS: Record<
    string,
    { zh: string; en: string }
  > = {
    bridge: {
      zh: "你天生擅长在不同文化之间搭建桥梁，能够理解并翻译不同世界的语言。",
      en: "You naturally build bridges between cultures, understanding and translating the languages of different worlds.",
    },
    integrate: {
      zh: "你能快速融入新的文化环境，在适应中找到自己的位置。",
      en: "You adapt quickly to new cultural environments, finding your place through integration.",
    },
    root: {
      zh: "你在熟悉的文化根基中获得力量，深耕本土是你的优势。",
      en: "You draw strength from familiar cultural roots — deepening locally is your advantage.",
    },
    global: {
      zh: "你拥有全球化的视野和思维方式，在任何文化环境中都能自如运作。",
      en: "You possess a global mindset, operating comfortably across any cultural context.",
    },
  };

  // Achievement tracking: fire events when dimensions are viewed
  const viewedDimensions = useRef(new Set<string>());
  const handleDimensionExpand = useCallback(
    (key: string) => {
      viewedDimensions.current.add(key);
      const total = viewedDimensions.current.size;
      // Admin viewer: never credit the admin's account for the OTHER user's
      // dimension exploration.
      if (viewingAsAdmin) return;
      // Fire achievement check for specific dimensions and full_spectrum
      csrfFetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "profile_dimension_viewed",
          metadata: { dimension: key, totalViewed: total },
        }),
      }).catch(() => {});
    },
    [viewingAsAdmin],
  );

  // Compute signal strengths for sorting + display
  const signals = computeSignalStrengths(profile);

  // Pre-sort to determine which cards get auto-expanded + "Most Notable" badge
  type CardMeta = { key: string; signal: number };
  const metas: CardMeta[] = [
    { key: "values", signal: signals.values ?? 0 },
    { key: "collab", signal: signals.collab ?? 0 },
    ...(profile.bigFiveScores
      ? [{ key: "bigFive", signal: signals.bigFive ?? 0 }]
      : []),
    ...(profile.cognitiveStyleDimensions
      ? [{ key: "cognitive", signal: signals.cognitive ?? 0 }]
      : []),
    { key: "shadow", signal: signals.shadow ?? 0 },
    ...(profile.coreQualities?.length
      ? [{ key: "coreQualities", signal: signals.coreQualities ?? 0 }]
      : []),
    ...(profile.socialStyle
      ? [{ key: "socialStyle", signal: signals.socialStyle ?? 0 }]
      : []),
    ...(profile.leadershipStyle
      ? [{ key: "leadershipStyle", signal: signals.leadershipStyle ?? 0 }]
      : []),
    ...(profile.interpersonalEnergy
      ? [
          {
            key: "interpersonalEnergy",
            signal: signals.interpersonalEnergy ?? 50,
          },
        ]
      : []),
    ...(profile.conflictHandling
      ? [{ key: "conflictHandling", signal: signals.conflictHandling ?? 50 }]
      : []),
    ...(profile.algoSnapshot?.bigFiveFacetPairs
      ? [{ key: "interpersonal", signal: signals.interpersonal ?? 50 }]
      : []),
    ...(profile.riasecScores && profile.schwartzAnchors?.top3?.length
      ? [{ key: "ikigai", signal: 40 }]
      : []),
  ].sort((a, b) => b.signal - a.signal);

  const mostNotableKey =
    metas.length > 0 && metas[0].signal >= 60 ? metas[0].key : null;

  // ── Build dimension card DATA (separated from rendering) ──

  type DimensionCardData = {
    key: string;
    signal: number;
    title: string;
    summary: string;
    feedbackSection: string;
    actionTip: string;
    ctaHref?: string;
    ctaLabel?: string;
    content: React.ReactNode;
  };

  const allCards: DimensionCardData[] = [];

  // Values
  allCards.push({
    key: "values",
    signal: signals.values ?? 0,
    title: t.cardValuesTitle,
    summary: valuesSummary(profile, loc),
    feedbackSection: "values",
    actionTip: t.tipValues,
    content: (
      <ValueAnchors
        profile={profile}
        locale={locale}
        confidenceBreakdown={confidenceBreakdown}
        showConfidenceUI={false}
      />
    ),
  });

  // Collab
  allCards.push({
    key: "collab",
    signal: signals.collab ?? 0,
    title: t.cardCollabTitle,
    summary: collabSummary(profile, loc),
    feedbackSection: "collabStyle",
    actionTip: t.tipCollab,
    content: (
      <CollabStyleSection
        profile={profile}
        locale={locale}
        confidenceBreakdown={confidenceBreakdown}
        showConfidenceUI={false}
      />
    ),
  });

  // Big Five
  if (profile.bigFiveScores) {
    allCards.push({
      key: "bigFive",
      signal: signals.bigFive ?? 0,
      title: t.cardBigFiveTitle,
      summary: bigFiveSummary(profile, loc, t),
      feedbackSection: "bigFive",
      actionTip: t.tipBigFive,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <BigFiveChart
          scores={profile.bigFiveScores}
          confidence={profile.confidenceMap.bigFive ?? 0}
          locale={locale}
          facetPairs={profile.algoSnapshot?.bigFiveFacetPairs}
          precision={profile.algoSnapshot?.bigFivePrecision}
        />
      ),
    });
  }

  // Cognitive Style
  if (profile.cognitiveStyleDimensions) {
    allCards.push({
      key: "cognitive",
      signal: signals.cognitive ?? 0,
      title: t.cardCognitiveTitle,
      summary: cognitiveSummary(profile, t),
      feedbackSection: "cognitiveStyle",
      actionTip: t.tipCognitive,
      content: (
        <CognitiveStyleBreakdown
          code={profile.cognitiveStyleCode}
          displayMode={profile.cognitiveStyleDisplayMode}
          dimensions={profile.cognitiveStyleDimensions}
          confidence={
            profile.cognitiveStyleConfidence ??
            profile.confidenceMap.bigFive ??
            0
          }
          locale={locale}
        />
      ),
    });
  }

  // Shadow
  allCards.push({
    key: "shadow",
    signal: signals.shadow ?? 0,
    title: t.cardShadowTitle,
    summary: shadowSummary(profile, t),
    feedbackSection: "shadow",
    actionTip: t.tipShadow,
    ctaHref: `/${locale}/coaching`,
    ctaLabel: t.ctaDiscussWithCoach,
    content: (
      <div className="space-y-6">
        <PersonalityShadow profile={profile} locale={locale} />
        {hasCrossCultural && crossCulturalLabel && (
          <div className="pt-4 border-t border-rev-rule/60">
            <p className="text-[10px] font-mono uppercase tracking-wider text-rev-ink-soft/80 mb-2">
              {t.crossCulturalPos}
            </p>
            <p className="text-sm font-semibold text-rev-signal-info mb-1.5">
              {crossCulturalLabel}
            </p>
            {crossCultural.type &&
              CROSS_CULTURAL_DESCRIPTIONS[crossCultural.type] && (
                <p className="text-xs text-rev-ink-soft leading-relaxed">
                  {pickLocaleText(
                    CROSS_CULTURAL_DESCRIPTIONS[crossCultural.type],
                    loc,
                  )}
                </p>
              )}
          </div>
        )}
      </div>
    ),
  });

  // Core Qualities
  if (profile.coreQualities && profile.coreQualities.length > 0) {
    allCards.push({
      key: "coreQualities",
      signal: signals.coreQualities ?? 0,
      title: t.cardCoreQualitiesTitle,
      summary: coreQualitiesSummary(profile, loc),
      feedbackSection: "coreQualities",
      actionTip: t.tipCoreQualities,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <CoreQualitiesContent
          qualities={profile.coreQualities}
          locale={locale}
        />
      ),
    });
  }

  // Social Style
  if (profile.socialStyle) {
    allCards.push({
      key: "socialStyle",
      signal: signals.socialStyle ?? 0,
      title: t.cardSocialStyleTitle,
      summary: pickLocaleText(
        {
          analytical: { en: "Analytical", zh: "分析型" },
          driver: { en: "Driver", zh: "驱动型" },
          amiable: { en: "Amiable", zh: "亲和型" },
          expressive: { en: "Expressive", zh: "表达型" },
        }[profile.socialStyle.style],
        loc,
      ),
      feedbackSection: "socialStyle",
      actionTip: t.tipSocialStyle,
      content: (
        <SocialStyleContent socialStyle={profile.socialStyle} locale={locale} />
      ),
    });
  }

  // Leadership Style
  if (profile.leadershipStyle) {
    allCards.push({
      key: "leadershipStyle",
      signal: signals.leadershipStyle ?? 0,
      title: t.cardLeadershipTitle,
      summary: pickLocaleText(
        {
          visionary: { en: "Visionary", zh: "愿景型" },
          coaching: { en: "Coaching", zh: "教练型" },
          affiliative: { en: "Affiliative", zh: "亲和型" },
          democratic: { en: "Democratic", zh: "民主型" },
          pacesetting: { en: "Pacesetting", zh: "标杆型" },
          commanding: { en: "Commanding", zh: "指令型" },
        }[profile.leadershipStyle.primary],
        loc,
      ),
      feedbackSection: "leadershipStyle",
      actionTip: t.tipLeadership,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <LeadershipStyleContent
          leadershipStyle={profile.leadershipStyle}
          locale={locale}
        />
      ),
    });
  }

  // Interpersonal Energy Spectrum
  if (profile.interpersonalEnergy) {
    const ieQuadrantLabels: Record<string, { en: string; zh: string }> = {
      "assured-warm": { en: "Assured & Warm", zh: "自信而温暖" },
      "assured-reserved": { en: "Assured & Reserved", zh: "自信而内敛" },
      "unassuming-warm": { en: "Unassuming & Warm", zh: "谦和而温暖" },
      "unassuming-reserved": { en: "Unassuming & Reserved", zh: "谦和而内敛" },
    };
    allCards.push({
      key: "interpersonalEnergy",
      signal: signals.interpersonalEnergy ?? 50,
      title: t.cardInterpersonalEnergyTitle,
      summary: pickLocaleText(
        ieQuadrantLabels[profile.interpersonalEnergy.quadrant],
        loc,
      ),
      feedbackSection: "interpersonalEnergy",
      actionTip: t.tipInterpersonalEnergy,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <InterpersonalEnergyContent
          spectrum={profile.interpersonalEnergy}
          locale={locale}
        />
      ),
    });
  }

  // Conflict Handling Style
  if (profile.conflictHandling) {
    const chModeLabels: Record<string, { en: string; zh: string }> = {
      competing: { en: "Competing", zh: "竞争型" },
      collaborating: { en: "Collaborating", zh: "协作型" },
      compromising: { en: "Compromising", zh: "折中型" },
      avoiding: { en: "Avoiding", zh: "回避型" },
      accommodating: { en: "Accommodating", zh: "迁就型" },
    };
    allCards.push({
      key: "conflictHandling",
      signal: signals.conflictHandling ?? 50,
      title: t.cardConflictHandlingTitle,
      summary: pickLocaleText(
        chModeLabels[profile.conflictHandling.dominant],
        loc,
      ),
      feedbackSection: "conflictHandling",
      actionTip: t.tipConflictHandling,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <ConflictHandlingContent
          profile={profile.conflictHandling}
          locale={locale}
        />
      ),
    });
  }

  // Interpersonal Insights
  if (profile.algoSnapshot?.bigFiveFacetPairs) {
    allCards.push({
      key: "interpersonal",
      signal: signals.interpersonal ?? 50,
      title: t.cardInterpersonalTitle,
      summary: t.cardInterpersonalSummary,
      feedbackSection: "interpersonal",
      actionTip: t.tipInterpersonal,
      ctaHref: `/${locale}/coaching`,
      ctaLabel: t.ctaDiscussWithCoach,
      content: (
        <InterpersonalInsightsContent profile={profile} locale={locale} />
      ),
    });
  }

  // Ikigai content moved to MeaningCompass (Chapter 03) — single canonical
  // home with overlap detection + LLM narrative. Card removed from DimensionExplorer.

  // Work Environment Preferences
  // Signal reflects how polarized the user's strongest dimension is.
  // position is clamped to [5, 95], so max |pos-50| = 45, max signal = 90.
  // strongly polarized (max |pos-50| > 30) → high signal (~80-90), promotes to Spotlight
  // mostly neutral (max < 12) → low signal (~25), demoted in carousel order
  if (
    hasRequiredWorkEnvFacets(
      profile.algoSnapshot?.bigFiveFacets as Record<string, number> | undefined,
    )
  ) {
    const wEnvDims = deriveEnvironmentPreferences(profile);
    allCards.push({
      key: "workEnvironment",
      signal: computeWorkEnvSignal(wEnvDims),
      title: t.cardWorkEnvTitle,
      summary: t.cardWorkEnvSummary,
      feedbackSection: "workEnvironment",
      actionTip: t.tipWorkEnv,
      content: <WorkEnvironmentCard profile={profile} locale={locale} />,
    });
  }

  // RIASEC — same bento style as all other cards
  if (riasecScores) {
    allCards.push({
      key: "riasec",
      signal: signals.riasec ?? 0,
      title: t.cardRiasecTitle,
      summary: riasecSummary(profile, t),
      feedbackSection: "riasec",
      actionTip: t.tipRiasec,
      ctaHref: `/${locale}/explore`,
      ctaLabel: t.ctaExploreInReport,
      content: (
        <div className="space-y-8">
          <div className="w-full mx-auto opacity-95">
            <RIASECRadarChart scores={riasecScores} locale={locale} />
          </div>
          <RIASECDimensionBars scores={riasecScores} locale={locale} />
        </div>
      ),
    });
  }

  // Sort by signal strength
  allCards.sort((a, b) => b.signal - a.signal);

  // ── Spotlight: top 3-4 most defining dimensions ──

  const spotlightItems: SpotlightItem[] = allCards.slice(0, 4).map((c) => ({
    key: c.key,
    title: c.title,
    summary: c.summary,
    insight: c.actionTip,
    signalStrength: c.signal,
  }));

  // ── Archive drawer: the remaining dimensions, folded by default ──
  // The spotlight surfaces the 3-4 strongest signals; everything else lives
  // in a collapsible "full atlas" so the chapter opens calm instead of as a
  // wall of cards. Excludes the spotlight keys to avoid showing them twice.
  const spotlightKeys = new Set(spotlightItems.map((i) => i.key));
  const drawerCards = allCards.filter((c) => !spotlightKeys.has(c.key));
  // Open by default: most readers never click to expand, so the full atlas
  // should be visible on arrival. The toggle stays available to fold it back.
  const [drawerOpen, setDrawerOpen] = useState(true);

  // ── Overlay state ──

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedCard = selectedKey
    ? allCards.find((c) => c.key === selectedKey)
    : null;

  const handleCardClick = useCallback(
    (key: string) => {
      setSelectedKey(key);
      handleDimensionExpand(key);
    },
    [handleDimensionExpand],
  );

  return (
    <div className="space-y-8">
      {/* ── Layer 1: Spotlight Carousel — guided entry ── */}
      <SpotlightCarousel
        items={spotlightItems}
        locale={locale}
        onExplore={handleCardClick}
      />

      {/* ── Layer 2: Archive drawer — the full atlas, folded by default ── */}
      {drawerCards.length > 0 && (
        <div className="space-y-5">
          {/* Editorial drawer header: small-caps label · count · hairline ·
              chevron. Toggles the remaining dimensions open. */}
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            className="group flex w-full items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rev-glow-cold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-rev-paper rounded-[2px] py-1"
          >
            <span className="font-sans uppercase tracking-[0.18em] text-[11px] font-medium text-rev-ink-soft whitespace-nowrap">
              {t.exploreAllTitle}
            </span>
            <span className="font-display text-[13px] text-rev-ink-faint leading-none">
              {drawerCards.length}
            </span>
            <span className="h-px flex-1 bg-rev-rule" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-rev-ink-soft/80 group-hover:text-rev-ink-soft whitespace-nowrap transition-colors">
              {drawerOpen ? t.atlasDrawerCollapse : t.atlasDrawerExpand}
              <ChevronDown
                aria-hidden="true"
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  drawerOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>

          {drawerOpen && (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {/* Bento cards — compact summary, click to open overlay */}
              {drawerCards.map((card) => (
                <motion.div key={card.key} variants={cardVariants}>
                  <button
                    onClick={() => handleCardClick(card.key)}
                    className="group w-full text-left rounded-[4px] border border-rev-rule bg-rev-paper-warm relative overflow-hidden
                  transition-all duration-200 ease-out
                  hover:-translate-y-px hover:border-rev-ink-soft/40 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {/* Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-rev-glow-cold/50" />

                    <div className="p-4 space-y-2">
                      {/* Title */}
                      <p className="text-[10px] font-mono uppercase tracking-wider text-rev-ink-soft/70">
                        {card.title}
                      </p>

                      {/* Summary */}
                      <p className="text-sm font-medium text-rev-ink truncate">
                        {card.summary}
                      </p>

                      {/* Signal bar + explore affordance */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-rev-paper-warm overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rev-glow-cold/50 transition-all duration-500"
                            style={{ width: `${card.signal}%` }}
                          />
                        </div>
                        <span
                          aria-hidden
                          className="text-[11px] leading-none text-rev-ink-soft/40 transition-all duration-200 opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:translate-x-0.5 sm:group-focus-visible:opacity-100"
                        >
                          →
                        </span>
                      </div>
                    </div>

                    {/* Most Notable badge */}
                    {mostNotableKey === card.key && (
                      <span className="absolute top-2.5 right-2.5 text-[8px] font-semibold uppercase tracking-wider text-rev-signal-info bg-rev-paper border border-rev-glow-cold/35 px-1.5 py-0.5 rounded-full">
                        {t.mostNotable}
                      </span>
                    )}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* ── Overlay: expanded dimension content ── */}
      <DimensionOverlay
        isOpen={!!selectedCard}
        onClose={() => setSelectedKey(null)}
        title={selectedCard?.title ?? ""}
        summary={selectedCard?.summary ?? ""}
        signalStrength={selectedCard?.signal}
        locale={locale}
        feedbackSection={selectedCard?.feedbackSection}
        actionTip={selectedCard?.actionTip}
        ctaHref={selectedCard?.ctaHref}
        ctaLabel={selectedCard?.ctaLabel}
        viewingAsAdmin={viewingAsAdmin}
      >
        {selectedCard?.content}
      </DimensionOverlay>
    </div>
  );
}
