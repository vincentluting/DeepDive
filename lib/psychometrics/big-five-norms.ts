// ============================================================
// Big Five Norm-Referencing — IPIP-NEO population norms
// ============================================================
// Academically-validated Big Five interpretation works by NORM-REFERENCING:
// a raw domain score is converted to a percentile (or T-score) against a
// large normative sample, so "50" means "the median person", not "the
// scale midpoint". (Johnson 2014, IPIP-NEO-120, N=619,150; Costa & McCrae
// NEO-PI-R T-score convention.)
//
// WHY THIS MODULE EXISTS:
// The raw IPIP-60 item scoring (reverse-scoring → facet mean → domain mean)
// is already psychometrically standard. What was missing is the *norming*
// step. Linear rescaling — ((raw-1)/4)*100 — is NOT norm-referenced: it
// puts the cut at the scale midpoint (3.0 / 50), but Big Five self-reports
// are positively elevated (esp. Agreeableness, Openness, Conscientiousness),
// so a scale-midpoint cut systematically over-assigns the high pole. This
// is the root cause of the "everyone becomes J/F/N/E" bias.
//
// ── NORM PARAMETERS (swappable) ──────────────────────────────
// Domain means/SDs on the 1–5 item-mean metric, representative published
// adult IPIP-NEO values. Corroborated by Deep Dive's own sample (N=36:
// E 3.34 / O 3.59 / A 3.60 / C 3.46 / N 2.93 — matches within ~0.1).
// NOTE: the LABEL/type assignment depends ONLY on the means (cut at z=0);
// the SDs only scale the reported percentile. Replace with the study's own
// sample norms (or exact Johnson tables) when available — this is the one
// constant to change.
// Sources: Johnson, J.A. (2014) J. Research in Personality 51, 78–89;
// ipip.ori.org "Interpreting Individual IPIP Scale Scores".
// ============================================================

import type { BigFiveDimension, CognitiveStyleCode } from "@/lib/types";

export interface NormParams {
  mean: number;
  sd: number;
}

/** IPIP-NEO domain norms on the 1–5 item-mean scale (swappable). */
export const IPIP_NEO_DOMAIN_NORMS: Record<BigFiveDimension, NormParams> = {
  neuroticism: { mean: 2.97, sd: 0.72 },
  extraversion: { mean: 3.27, sd: 0.63 },
  openness: { mean: 3.59, sd: 0.53 },
  agreeableness: { mean: 3.71, sd: 0.51 },
  conscientiousness: { mean: 3.45, sd: 0.62 },
};

// ── Normal CDF (Abramowitz & Stegun 7.1.26 erf approximation) ──
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Standard normal CDF Φ(z) ∈ (0,1). */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Clamp to [0,100]. */
function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Percentile (0–100) of a raw 1–5 domain mean against IPIP-NEO norms.
 * 50 = the median person, 84 ≈ +1 SD, 16 ≈ −1 SD.
 */
export function domainPercentile(
  domain: BigFiveDimension,
  rawMean1to5: number,
): number {
  const { mean, sd } = IPIP_NEO_DOMAIN_NORMS[domain];
  // Defensive: non-finite input (NaN/undefined from malformed JSONB or legacy
  // rows) returns the neutral median so it can never yield a confident code.
  if (sd <= 0 || !Number.isFinite(rawMean1to5)) return 50;
  return clamp100(normalCdf((rawMean1to5 - mean) / sd) * 100);
}

/** Norm-referenced T-score (mean 50, SD 10) — Costa & McCrae convention. */
export function domainTScore(
  domain: BigFiveDimension,
  rawMean1to5: number,
): number {
  const { mean, sd } = IPIP_NEO_DOMAIN_NORMS[domain];
  if (sd <= 0 || !Number.isFinite(rawMean1to5)) return 50;
  return Math.round(50 + 10 * ((rawMean1to5 - mean) / sd));
}

/** True when the raw domain mean is at/above the IPIP-NEO population mean. */
export function isAboveNorm(
  domain: BigFiveDimension,
  rawMean1to5: number,
): boolean {
  if (!Number.isFinite(rawMean1to5)) return false;
  return rawMean1to5 >= IPIP_NEO_DOMAIN_NORMS[domain].mean;
}

// ── 0–100 linear-score variants ──────────────────────────────
// Profile consumers hold domainsNormalized = ((raw-1)/4)*100. These helpers
// let them norm-reference without converting at every call site.

/** Inverse of ((raw-1)/4)*100 → raw 1–5. */
export function rawFromNormalized(score0to100: number): number {
  return score0to100 / 25 + 1;
}

/** Percentile (0–100) from a 0–100 linearly-normalized domain score. */
export function percentileFromNormalized(
  domain: BigFiveDimension,
  score0to100: number,
): number {
  return domainPercentile(domain, rawFromNormalized(score0to100));
}

/** True when a 0–100 linear domain score is at/above the population median. */
export function isAboveNormFromNormalized(
  domain: BigFiveDimension,
  score0to100: number,
): boolean {
  return isAboveNorm(domain, rawFromNormalized(score0to100));
}

// ── IPIP-NEO-120 FACET norms (1–5 item-mean), all 30 facets ──────────────
// Source: Kajonius & Johnson (2019), "Assessing the Structure of the Five
// Factor Model of Personality (IPIP-NEO-120) in the Public Domain", Europe's
// J. Psychology 15(2), 260–275, Table A1 (N=320,128, M_age=28.1, pooled by
// sex). DOI 10.5964/ejop.v15i2.1671. Reported there as facet SUM (4 items,
// range 4–20); converted to 1–5 item-mean = sum/4 (SD/4). Cross-validated
// against the `five-factor-e` package's sex×age norm tables (NeuroQuestAi).
//
// ⚠️ CROSS-CULTURAL CAVEAT: Johnson's repository is a self-selected English-
// language (largely North-American/WEIRD) internet sample. Several facets are
// known to shift across cultures (esp. Altruism, Sympathy, Modesty,
// Emotionality). For a China-majority population these are an interim
// theoretical anchor; own-sample facet norming should replace them once N is
// sufficient, and the WEIRD-norm limitation must be stated in the thesis.
export const IPIP_NEO_FACET_NORMS: Record<string, NormParams> = {
  N1_Anxiety: { mean: 3.018, sd: 0.943 },
  N2_Anger: { mean: 2.877, sd: 1.028 },
  N3_Depression: { mean: 2.337, sd: 0.968 },
  "N4_Self-Consciousness": { mean: 2.922, sd: 0.91 },
  N5_Immoderation: { mean: 2.985, sd: 0.86 },
  N6_Vulnerability: { mean: 2.518, sd: 0.907 },
  E1_Friendliness: { mean: 3.62, sd: 0.9 },
  E2_Gregariousness: { mean: 3.09, sd: 1.005 },
  E3_Assertiveness: { mean: 3.64, sd: 0.858 },
  E4_Activity_Level: { mean: 3.21, sd: 0.787 },
  "E5_Excitement-Seeking": { mean: 3.13, sd: 0.83 },
  E6_Cheerfulness: { mean: 3.837, sd: 0.8 },
  O1_Imagination: { mean: 3.65, sd: 0.853 },
  O2_Artistic_Interests: { mean: 3.667, sd: 0.895 },
  O3_Emotionality: { mean: 3.8, sd: 0.752 },
  O4_Adventurousness: { mean: 3.07, sd: 0.815 },
  O5_Intellect: { mean: 3.625, sd: 0.887 },
  O6_Liberalism: { mean: 2.757, sd: 0.917 },
  A1_Trust: { mean: 3.357, sd: 0.885 },
  A2_Morality: { mean: 4.157, sd: 0.72 },
  A3_Altruism: { mean: 4.18, sd: 0.64 },
  A4_Cooperation: { mean: 3.775, sd: 0.873 },
  A5_Modesty: { mean: 3.085, sd: 0.838 },
  A6_Sympathy: { mean: 3.757, sd: 0.775 },
  "C1_Self-Efficacy": { mean: 4.08, sd: 0.6 },
  C2_Orderliness: { mean: 3.308, sd: 1.077 },
  C3_Dutifulness: { mean: 4.08, sd: 0.642 },
  "C4_Achievement-Striving": { mean: 4.015, sd: 0.772 },
  "C5_Self-Discipline": { mean: 3.518, sd: 0.79 },
  C6_Cautiousness: { mean: 3.42, sd: 1.022 },
};

/**
 * Norm-referenced 0–100 percentile for a FACET (1–5) against its IPIP-NEO
 * facet norm. 50 = the facet's population median. Unknown facet key → 50
 * (neutral, no bias) so a missing norm never skews a composite.
 */
export function facetPercentile(
  facetKey: string,
  facetRaw1to5: number,
): number {
  const norm = IPIP_NEO_FACET_NORMS[facetKey];
  if (!norm || norm.sd <= 0 || !Number.isFinite(facetRaw1to5)) return 50;
  return clamp100(normalCdf((facetRaw1to5 - norm.mean) / norm.sd) * 100);
}

// ============================================================
// Norm-referenced Cognitive Style (Big Five → MBTI-style heuristic)
// ============================================================
// ⚠️ HEURISTIC, NOT A VALIDATED TYPOLOGY. The Big Five is a dimensional
// model; MBTI-style 4-letter types are not academically validated (McCrae
// & Costa 1989: the MBTI does not measure true dichotomies, and T/F↔A,
// J/P↔C are only moderate correlates). This re-expresses Big Five scores
// as a familiar heuristic, with two integrity safeguards:
//   1. The dichotomy CUT is the IPIP-NEO population MEAN (norm-referenced;
//      ≈ the median under the normal model), not the raw scale midpoint — so
//      each axis splits ~50/50 instead of over-assigning the high pole
//      (fixes the "everyone is J/F/N/E" bias).
//   2. Near-median profiles are suppressed to "balanced" (no forced letter).
//
// Letter convention (matches the prior implementation + UI):
//   score ∈ 0–100 = preference strength toward the LEFT pole (E, S, T, J).
//   EI: left=E (high Extraversion)      SN: left=S (LOW Openness)
//   TF: left=T (LOW Agreeableness)      JP: left=J (high Conscientiousness)
//
// `nearBandPct` = how close to the 50th percentile counts as "near-midpoint"
// (default ±12 → middle ~24% per axis).
// ============================================================

export function deriveNormReferencedCognitiveStyle(
  domains: Record<BigFiveDimension, number>,
  nearBandPct = 12,
): CognitiveStyleCode {
  // Incomplete Big Five data (any non-finite domain — malformed JSONB, legacy
  // rows) must NOT yield a code: even one bad axis would otherwise still read as
  // high-confidence (3/4 = 0.75 ≥ the 0.7 "high" threshold). Suppress to a
  // neutral balanced result so garbage data never surfaces a confident type.
  if (
    !Number.isFinite(domains?.extraversion) ||
    !Number.isFinite(domains?.openness) ||
    !Number.isFinite(domains?.agreeableness) ||
    !Number.isFinite(domains?.conscientiousness)
  ) {
    return {
      code: null,
      displayMode: "balanced",
      nearMidpointDimensions: [],
      dimensions: {
        EI: { score: 50, label: "I", isNearMidpoint: true },
        SN: { score: 50, label: "S", isNearMidpoint: true },
        TF: { score: 50, label: "T", isNearMidpoint: true },
        JP: { score: 50, label: "J", isNearMidpoint: true },
      },
      confidence: 0,
    };
  }
  // Percentile of each domain (0–100, 50 = median person)
  const pE = domainPercentile("extraversion", domains.extraversion);
  const pO = domainPercentile("openness", domains.openness);
  const pA = domainPercentile("agreeableness", domains.agreeableness);
  const pC = domainPercentile("conscientiousness", domains.conscientiousness);

  // Left-pole-positive score per the UI convention.
  const axes = {
    EI: {
      score: Math.round(pE), // left = E (high extraversion)
      label: isAboveNorm("extraversion", domains.extraversion) ? "E" : "I",
      isNearMidpoint: Math.abs(pE - 50) < nearBandPct,
    },
    SN: {
      score: Math.round(100 - pO), // left = S (low openness)
      label: isAboveNorm("openness", domains.openness) ? "N" : "S",
      isNearMidpoint: Math.abs(pO - 50) < nearBandPct,
    },
    TF: {
      score: Math.round(100 - pA), // left = T (low agreeableness)
      label: isAboveNorm("agreeableness", domains.agreeableness) ? "F" : "T",
      isNearMidpoint: Math.abs(pA - 50) < nearBandPct,
    },
    JP: {
      score: Math.round(pC), // left = J (high conscientiousness)
      label: isAboveNorm("conscientiousness", domains.conscientiousness)
        ? "J"
        : "P",
      isNearMidpoint: Math.abs(pC - 50) < nearBandPct,
    },
  } as const;

  const nearMidpointDimensions = (
    Object.entries(axes) as Array<
      ["EI" | "SN" | "TF" | "JP", (typeof axes)[keyof typeof axes]]
    >
  )
    .filter(([, info]) => info.isNearMidpoint)
    .map(([axis, info]) => ({ axis, score: info.score }));

  const displayMode =
    nearMidpointDimensions.length >= 2
      ? ("balanced" as const)
      : ("normal" as const);

  const code =
    displayMode === "balanced"
      ? null
      : `${axes.EI.label}${axes.SN.label}${axes.TF.label}${axes.JP.label}`;

  const clearAxes = 4 - nearMidpointDimensions.length;
  const confidence = clearAxes / 4;

  return {
    code,
    displayMode,
    ...(displayMode === "balanced" ? { nearMidpointDimensions } : {}),
    dimensions: {
      EI: { ...axes.EI },
      SN: { ...axes.SN },
      TF: { ...axes.TF },
      JP: { ...axes.JP },
    },
    confidence,
  };
}
