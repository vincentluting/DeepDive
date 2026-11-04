// ============================================================
// Career Drain Generator — Algorithmic Version (0 LLM calls)
//
// Replaces career-drain.ts LLM call with pure content lookup.
//
// Algorithm:
// 1. Take bottom 5 Big Five facets → look up drain content
// 2. Take bottom 2 RIASEC dimensions → look up drain content
// 3. Take bottom 3 Schwartz values → look up drain content
// 4. Deduplicate and select best 2-3 per category
// 5. Assemble CareerDrainWarning
// ============================================================

import type {
  AssessmentInput,
  CareerDrainWarning,
  RealConditions,
} from "../types";
import type { ProfileAlgorithmOutput } from "../types";
import {
  FACET_DRAIN_MAP,
  RIASEC_DRAIN_MAP,
  SCHWARTZ_DRAIN_MAP,
  FRAMING_SUMMARIES,
} from "./career-drain-content";
import {
  URGENCY_HIGH_FRAMING,
  URGENCY_LOW_FRAMING,
  deriveDrainUrgency,
} from "./career-drain-urgency-content";
import { SCHWARTZ_VALUE_LABELS } from "../scoring/constants";

// Human-readable facet labels for source attribution
const FACET_SOURCE_LABELS: Record<string, { en: string; zh: string }> = {
  N1_Anxiety: { en: "Worry Sensitivity", zh: "焦虑敏感" },
  N2_Anger: { en: "Frustration Response", zh: "挫折反应" },
  N3_Depression: { en: "Emotional Resilience", zh: "情绪恢复力" },
  "N4_Self-Consciousness": { en: "Social Awareness", zh: "社交自意识" },
  N4_SelfConsciousness: { en: "Social Awareness", zh: "社交自意识" },
  N5_Immoderation: { en: "Impulse Control", zh: "冲动控制" },
  N6_Vulnerability: { en: "Stress Tolerance", zh: "压力耐受" },
  E1_Friendliness: { en: "Warmth", zh: "热情友善" },
  E2_Gregariousness: { en: "Social Preference", zh: "社交偏好" },
  E3_Assertiveness: { en: "Assertiveness", zh: "果断主张" },
  E4_ActivityLevel: { en: "Energy Level", zh: "活力水平" },
  E4_Activity_Level: { en: "Energy Level", zh: "活力水平" },
  E5_ExcitementSeeking: { en: "Novelty Seeking", zh: "新奇追求" },
  E5_Excitement_Seeking: { en: "Novelty Seeking", zh: "新奇追求" },
  "E5_Excitement-Seeking": { en: "Novelty Seeking", zh: "新奇追求" },
  E6_Cheerfulness: { en: "Positive Expression", zh: "积极表达" },
  O1_Imagination: { en: "Imagination", zh: "想象力" },
  O2_ArtisticInterests: { en: "Aesthetic Sense", zh: "审美感" },
  O2_Artistic_Interests: { en: "Aesthetic Sense", zh: "审美感" },
  O3_Emotionality: { en: "Emotional Awareness", zh: "情感觉察" },
  O4_Adventurousness: { en: "Adventurousness", zh: "冒险精神" },
  O5_Intellect: { en: "Intellectual Curiosity", zh: "理智好奇" },
  O6_Liberalism: { en: "Open-mindedness", zh: "思想开放" },
  A1_Trust: { en: "Trust", zh: "信任感" },
  A2_Morality: { en: "Principled", zh: "原则性" },
  A3_Altruism: { en: "Helpfulness", zh: "助人意愿" },
  A4_Cooperation: { en: "Cooperation", zh: "合作性" },
  A5_Modesty: { en: "Modesty", zh: "谦逊" },
  A6_Sympathy: { en: "Empathy", zh: "共情力" },
  C1_SelfEfficacy: { en: "Self-Efficacy", zh: "自我效能" },
  C1_Self_Efficacy: { en: "Self-Efficacy", zh: "自我效能" },
  "C1_Self-Efficacy": { en: "Self-Efficacy", zh: "自我效能" },
  C2_Orderliness: { en: "Orderliness", zh: "秩序性" },
  C3_Dutifulness: { en: "Dutifulness", zh: "责任心" },
  C4_AchievementStriving: { en: "Achievement Drive", zh: "成就驱动" },
  C4_Achievement_Striving: { en: "Achievement Drive", zh: "成就驱动" },
  "C4_Achievement-Striving": { en: "Achievement Drive", zh: "成就驱动" },
  C5_SelfDiscipline: { en: "Self-Discipline", zh: "自律" },
  C5_Self_Discipline: { en: "Self-Discipline", zh: "自律" },
  "C5_Self-Discipline": { en: "Self-Discipline", zh: "自律" },
  C6_Cautiousness: { en: "Cautiousness", zh: "审慎" },
};

const RIASEC_SOURCE_LABELS: Record<string, { en: string; zh: string }> = {
  R: { en: "Realistic", zh: "现实型" },
  I: { en: "Investigative", zh: "研究型" },
  A: { en: "Artistic", zh: "艺术型" },
  S: { en: "Social", zh: "社会型" },
  E: { en: "Enterprising", zh: "进取型" },
  C: { en: "Conventional", zh: "常规型" },
};

/** Tag drain items with their source facet/dimension/value label */
function tagSource<T>(
  items: T[],
  sourceKey: string,
  labelMap: Record<string, { en: string; zh: string }>,
  prefix: { en: string; zh: string } = { en: "Low", zh: "低" },
): (T & { sourceLabel_zh: string; sourceLabel_en: string })[] {
  const label = labelMap[sourceKey];
  if (!label)
    return items as (T & { sourceLabel_zh: string; sourceLabel_en: string })[];
  return items.map((item) => ({
    ...item,
    sourceLabel_zh: `${prefix.zh}${label.zh}`,
    sourceLabel_en: `${prefix.en} ${label.en}`,
  }));
}

// Radar keys → RIASEC dimension mapping
const RADAR_TO_RIASEC: Record<string, string> = {
  build: "R",
  decode: "I",
  create: "A",
  connect: "S",
  drive: "E",
  structure: "C",
};

// Big Five domain → facet name mapping (for domain-level fallback in v3 screening mode).
// Names MUST match the canonical IPIP data source (lib/questionnaire/module-c-ipip-neo60.ts
// DOMAIN_FACETS), otherwise FACET_DRAIN_MAP lookups silently fail in screening mode.
const DOMAIN_FACET_PREFIXES: Record<string, string[]> = {
  neuroticism: [
    "N1_Anxiety",
    "N2_Anger",
    "N3_Depression",
    "N4_Self-Consciousness",
    "N5_Immoderation",
    "N6_Vulnerability",
  ],
  extraversion: [
    "E1_Friendliness",
    "E2_Gregariousness",
    "E3_Assertiveness",
    "E4_Activity_Level",
    "E5_Excitement-Seeking",
    "E6_Cheerfulness",
  ],
  openness: [
    "O1_Imagination",
    "O2_Artistic_Interests",
    "O3_Emotionality",
    "O4_Adventurousness",
    "O5_Intellect",
    "O6_Liberalism",
  ],
  agreeableness: [
    "A1_Trust",
    "A2_Morality",
    "A3_Altruism",
    "A4_Cooperation",
    "A5_Modesty",
    "A6_Sympathy",
  ],
  conscientiousness: [
    "C1_Self-Efficacy",
    "C2_Orderliness",
    "C3_Dutifulness",
    "C4_Achievement-Striving",
    "C5_Self-Discipline",
    "C6_Cautiousness",
  ],
};

/**
 * Generate career drain warning — pure algorithmic, no LLM.
 * Always returns a result (never null, unlike the LLM version).
 *
 * @param precision - 'full' (IPIP-120), 'standard' (IPIP-60, 2-item facets), or 'screening' (IPIP-30, single-item).
 *   When 'screening', uses domain-level fallback: picks bottom 2 Big Five domains and
 *   maps to all facets in those domains, rather than ranking individual noisy facet scores.
 *   'standard' uses the same facet-level analysis as 'full' (2-item facet means are reliable).
 * @param realConditions - When provided, the framing tone adapts to the user's stated
 *   career-change urgency: willingToRetrain=true / careerChangeUrgency="urgent" → high
 *   (treats warnings as filters); willingToRetrain=false + exploring/undefined → low
 *   (treats warnings as long-term self-knowledge); otherwise default (existing tone).
 *   The drain DATA (directions/industries/styles/redFlags) is unchanged — only the
 *   framingSummary copy switches pools.
 */
export function generateCareerDrainAlgorithmic(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  _locale: string = "en",
  precision: "full" | "standard" | "screening" = "full",
  realConditions: RealConditions | null = null,
): CareerDrainWarning {
  // ── 1. Collect drain signals from Big Five low facets ──
  // v3 screening: use domain-level fallback (domains are 6-item averages, reliable)
  // v2 full: use individual facet ranking (8-item averages per facet, also reliable)

  let bottomFacets: string[];

  if (precision === "screening") {
    // Domain-level fallback: find bottom 2 domains, collect all their facets
    const domainEntries = Object.entries(algo.bigFiveDomains) as [
      string,
      number,
    ][];
    const bottomDomains = domainEntries
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([key]) => key);
    bottomFacets = bottomDomains.flatMap((d) => DOMAIN_FACET_PREFIXES[d] || []);
  } else {
    const allFacets = Object.entries(algo.bigFiveFacets) as [string, number][];
    bottomFacets = allFacets
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([key]) => key);
  }

  const facetDirections: CareerDrainWarning["drainingDirections"] = [];
  const facetIndustries: CareerDrainWarning["drainingIndustries"] = [];
  const facetStyles: CareerDrainWarning["drainingManagementStyles"] = [];
  const facetFlags: CareerDrainWarning["redFlagEnvironments"] = [];

  for (const facet of bottomFacets) {
    const drain = FACET_DRAIN_MAP[facet];
    if (!drain) continue;
    facetDirections.push(
      ...tagSource(drain.directions, facet, FACET_SOURCE_LABELS),
    );
    facetIndustries.push(
      ...tagSource(drain.industries, facet, FACET_SOURCE_LABELS),
    );
    facetStyles.push(
      ...tagSource(drain.managementStyles, facet, FACET_SOURCE_LABELS),
    );
    facetFlags.push(...tagSource(drain.redFlags, facet, FACET_SOURCE_LABELS));
  }

  // ── 2. Collect drain signals from RIASEC lowest dimensions ──

  const riasecEntries = Object.entries(algo.riasecRadar)
    .map(([key, val]) => ({
      key,
      riasec: RADAR_TO_RIASEC[key] || key,
      val: val as number,
    }))
    .sort((a, b) => a.val - b.val);
  const lowestRiasec = riasecEntries.slice(0, 2).map((e) => e.riasec);

  const riasecDirections: CareerDrainWarning["drainingDirections"] = [];
  const riasecIndustries: CareerDrainWarning["drainingIndustries"] = [];

  for (const dim of lowestRiasec) {
    const drain = RIASEC_DRAIN_MAP[dim];
    if (!drain) continue;
    riasecDirections.push(
      ...tagSource(drain.directions, dim, RIASEC_SOURCE_LABELS),
    );
    riasecIndustries.push(
      ...tagSource(drain.industries, dim, RIASEC_SOURCE_LABELS),
    );
  }

  // ── 3. Collect drain signals from Schwartz bottom values ──

  const bottomValues = algo.schwartz.ranking.slice(-3);

  const schwartzStyles: CareerDrainWarning["drainingManagementStyles"] = [];
  const schwartzFlags: CareerDrainWarning["redFlagEnvironments"] = [];

  for (const val of bottomValues) {
    const drain = SCHWARTZ_DRAIN_MAP[val];
    if (!drain) continue;
    const vLabel =
      SCHWARTZ_VALUE_LABELS[val as keyof typeof SCHWARTZ_VALUE_LABELS];
    const schwartzLabelMap: Record<string, { en: string; zh: string }> = vLabel
      ? { [val]: { en: vLabel.en, zh: vLabel.zh } }
      : {};
    schwartzStyles.push(
      ...tagSource(drain.managementStyles, val, schwartzLabelMap, {
        en: "Low",
        zh: "低",
      }),
    );
    schwartzFlags.push(
      ...tagSource(drain.redFlags, val, schwartzLabelMap, {
        en: "Low",
        zh: "低",
      }),
    );
  }

  // ── 4. Deduplicate and select top items ──

  const directions = deduplicateByTitle(
    [...facetDirections, ...riasecDirections],
    "title_en",
  ).slice(0, 3);

  const industries = deduplicateByTitle(
    [...facetIndustries, ...riasecIndustries],
    "name_en",
  ).slice(0, 3);

  const managementStyles = deduplicateByTitle(
    [...facetStyles, ...schwartzStyles],
    "style_en",
  ).slice(0, 3);

  const redFlags = deduplicateByTitle(
    [...facetFlags, ...schwartzFlags],
    "signal_en",
  ).slice(0, 4);

  // ── 5. Select framing summary (urgency-aware) ──
  // Pick the framing pool based on the user's stated career-change urgency.
  // realConditions=null → default pool (legacy behavior). The hash uses the
  // assessment ID so the same user sees a stable framing across re-renders,
  // and uses the pool length so it stays in-bounds even when pool sizes differ.

  const urgency = deriveDrainUrgency(realConditions);
  const pool =
    urgency === "high"
      ? URGENCY_HIGH_FRAMING
      : urgency === "low"
        ? URGENCY_LOW_FRAMING
        : FRAMING_SUMMARIES;
  const summaryIndex = simpleHash(assessment.id) % pool.length;
  const framing = pool[summaryIndex];

  return {
    drainingDirections: directions,
    drainingIndustries: industries,
    drainingManagementStyles: managementStyles,
    redFlagEnvironments: redFlags,
    framingSummary_zh: framing.zh,
    framingSummary_en: framing.en,
  };
}

// ── Helpers ──

function deduplicateByTitle<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const val = item[key] as string;
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
