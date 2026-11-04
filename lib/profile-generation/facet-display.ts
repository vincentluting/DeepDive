// ============================================================
// Facet Display — Shared Utility
// Bilingual facet labels + facet-pair derivation, shared between the
// profile's BigFiveChart and the report's "Beneath the Surface" signature.
// Keeps both surfaces using one source of truth for the 30 IPIP facets.
// ============================================================

import type { BigFiveDimension } from "../types";
import type { FacetPairInput } from "./detect-facet-tensions";
import { pickLocaleText } from "@/lib/i18n/localize";

/** Big Five domain inferred from the facet key's first letter (E1_… → e). */
export const FACET_PREFIX_TO_DOMAIN: Record<string, BigFiveDimension> = {
  n: "neuroticism",
  e: "extraversion",
  o: "openness",
  a: "agreeableness",
  c: "conscientiousness",
};

// User-friendly facet display names (no academic jargon). Bilingual data
// definition — the i18n purity linter exempts the {en, zh} pattern; other
// locales fall back to en via pickLocaleText (same convention as elsewhere).
export const FACET_DISPLAY_LABELS: Record<string, { en: string; zh: string }> =
  {
    // Neuroticism
    N1_Anxiety: { en: "Worry Sensitivity", zh: "焦虑敏感" },
    N2_Anger: { en: "Frustration Response", zh: "挫折反应" },
    N3_Depression: { en: "Emotional Resilience", zh: "情绪恢复力" },
    "N4_Self-Consciousness": { en: "Social Awareness", zh: "社交自意识" },
    N5_Immoderation: { en: "Impulse Control", zh: "冲动控制" },
    N6_Vulnerability: { en: "Stress Tolerance", zh: "压力耐受" },
    // Extraversion
    E1_Friendliness: { en: "Warmth", zh: "热情友善" },
    E2_Gregariousness: { en: "Social Preference", zh: "社交偏好" },
    E3_Assertiveness: { en: "Assertiveness", zh: "果断主张" },
    E4_Activity_Level: { en: "Energy Level", zh: "活力水平" },
    "E5_Excitement-Seeking": { en: "Thrill Seeking", zh: "寻求刺激" },
    E6_Cheerfulness: { en: "Positive Outlook", zh: "积极乐观" },
    // Openness
    O1_Imagination: { en: "Imagination", zh: "想象力" },
    O2_Artistic_Interests: { en: "Aesthetic Sense", zh: "审美兴趣" },
    O3_Emotionality: { en: "Emotional Depth", zh: "情感丰富" },
    O4_Adventurousness: { en: "Adventurousness", zh: "冒险精神" },
    O5_Intellect: { en: "Intellectual Curiosity", zh: "智识好奇" },
    O6_Liberalism: { en: "Open-mindedness", zh: "开放思维" },
    // Agreeableness
    A1_Trust: { en: "Trust", zh: "信任倾向" },
    A2_Morality: { en: "Moral Compass", zh: "道德直觉" },
    A3_Altruism: { en: "Altruism", zh: "利他精神" },
    A4_Cooperation: { en: "Cooperation", zh: "合作精神" },
    A5_Modesty: { en: "Humility", zh: "谦逊内敛" },
    A6_Sympathy: { en: "Compassion", zh: "同理关怀" },
    // Conscientiousness
    "C1_Self-Efficacy": { en: "Self-Confidence", zh: "自信心" },
    C2_Orderliness: { en: "Organization", zh: "条理秩序" },
    C3_Dutifulness: { en: "Sense of Duty", zh: "责任感" },
    "C4_Achievement-Striving": { en: "Drive", zh: "成就驱动" },
    "C5_Self-Discipline": { en: "Self-Discipline", zh: "自律力" },
    C6_Cautiousness: { en: "Caution", zh: "谨慎度" },
  };

/** Localized facet label, falling back to a humanized version of the key. */
export function getFacetLabel(facetKey: string, loc: string): string {
  const label = FACET_DISPLAY_LABELS[facetKey];
  if (label)
    return pickLocaleText(label, loc as Parameters<typeof pickLocaleText>[1]);
  return facetKey.split("_").slice(1).join(" ");
}

/**
 * Build FacetPairInput[] from raw 1-5 facet scores. Mirrors the derivation in
 * profile-algorithm.ts: group facets by domain (via key prefix), compute each
 * domain's mean, and express every facet as a deviation from its domain mean.
 */
export function buildFacetPairs(
  facets: Record<string, number>,
): FacetPairInput[] {
  const byDomain: Record<string, number[]> = {};
  for (const [key, score] of Object.entries(facets)) {
    const d = FACET_PREFIX_TO_DOMAIN[key[0]?.toLowerCase()];
    if (d) (byDomain[d] ??= []).push(score);
  }
  const means: Record<string, number> = {};
  for (const [d, arr] of Object.entries(byDomain)) {
    means[d] = arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  return Object.entries(facets).map(([key, score]) => {
    const domain =
      FACET_PREFIX_TO_DOMAIN[key[0]?.toLowerCase()] ??
      ("neuroticism" as BigFiveDimension);
    return {
      domain,
      facet: key,
      score,
      deviationFromMean: score - (means[domain] ?? 3),
    };
  });
}
