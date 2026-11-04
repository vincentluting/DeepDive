// ============================================================
// Layer 3 — Big Five → Collaboration Style Derivation (Facet-Level)
// ============================================================
// Research basis for facet → Collaboration Style mapping:
//   D (Leading/引领型):    E3_Assertiveness ↑, A4_Cooperation ↓, A5_Modesty ↓, C4_Achievement-Striving ↑
//   I (Inspiring/激发型):  E1_Friendliness ↑, E2_Gregariousness ↑, E6_Cheerfulness ↑, O3_Emotionality ↑
//   S (Anchoring/稳健型):  A3_Altruism ↑, A4_Cooperation ↑, C5_Self-Discipline ↑, N domain ↓
//   C (Refining/精研型):   C2_Orderliness ↑, C6_Cautiousness ↑, C3_Dutifulness ↑, O4_Adventurousness ↓
//
// Algorithm:
//   1. For each style, resolve 4 contributions: facet score first, domain score as fallback
//   2. Normalize each resolved score to a signed deviation: (score - 3.0) / 2.0 → [-1, +1]
//      Reversed contributions negate the deviation.
//   3. Mean of 4 deviations → raw_signal in [-1, +1]
//   4. Shift to [0, 2] by adding 1 (eliminates negative weights)
//   5. Normalize 4 shifted values to percentage distribution summing to 100
// ============================================================

import type { BigFiveDimension, CollabStyle, CollabMapping } from '../types';

// ---- Collaboration Style hex colors (matching constants.ts COLLAB_STYLE_COLORS) ----
const COLLAB_STYLE_HEX: Record<CollabStyle, string> = {
  D: '#E74C3C',
  I: '#F1C40F',
  S: '#2ECC71',
  C: '#3498DB',
};

// ---- Contribution source: facet (with domain fallback) or whole domain ----
type ContribFacet = {
  type: 'facet';
  /** IPIP-NEO-120 facet key, e.g. 'E3_Assertiveness' */
  key: string;
  /** Domain used as fallback when the facet score is absent */
  domainFallback: BigFiveDimension;
  /** When true, a higher facet score reduces this style's signal */
  reversed: boolean;
};

type ContribDomain = {
  type: 'domain';
  key: BigFiveDimension;
  reversed: boolean;
};

type Contribution = ContribFacet | ContribDomain;

// ---- Research-based facet weights per Collaboration Style ----
// Each style is defined by exactly 4 contributions (equal weight).
const COLLAB_STYLE_WEIGHTS: Record<CollabStyle, Contribution[]> = {
  D: [
    { type: 'facet', key: 'E3_Assertiveness',         domainFallback: 'extraversion',      reversed: false },
    { type: 'facet', key: 'A4_Cooperation',            domainFallback: 'agreeableness',     reversed: true  },
    { type: 'facet', key: 'A5_Modesty',                domainFallback: 'agreeableness',     reversed: true  },
    { type: 'facet', key: 'C4_Achievement-Striving',   domainFallback: 'conscientiousness', reversed: false },
  ],
  I: [
    { type: 'facet', key: 'E1_Friendliness',   domainFallback: 'extraversion', reversed: false },
    { type: 'facet', key: 'E2_Gregariousness', domainFallback: 'extraversion', reversed: false },
    { type: 'facet', key: 'E6_Cheerfulness',   domainFallback: 'extraversion', reversed: false },
    { type: 'facet', key: 'O3_Emotionality',   domainFallback: 'openness',     reversed: false },
  ],
  S: [
    { type: 'facet',  key: 'A3_Altruism',        domainFallback: 'agreeableness',     reversed: false },
    { type: 'facet',  key: 'A4_Cooperation',      domainFallback: 'agreeableness',     reversed: false },
    { type: 'facet',  key: 'C5_Self-Discipline',  domainFallback: 'conscientiousness', reversed: false },
    // Whole neuroticism domain: low N = emotionally stable = high S
    { type: 'domain', key: 'neuroticism',                                               reversed: true  },
  ],
  C: [
    { type: 'facet', key: 'C2_Orderliness',     domainFallback: 'conscientiousness', reversed: false },
    { type: 'facet', key: 'C6_Cautiousness',    domainFallback: 'conscientiousness', reversed: false },
    { type: 'facet', key: 'C3_Dutifulness',     domainFallback: 'conscientiousness', reversed: false },
    { type: 'facet', key: 'O4_Adventurousness', domainFallback: 'openness',          reversed: true  },
  ],
};

// Number of facet-type contributions across all styles (D:4 + I:4 + S:3 + C:4 = 15)
const MAX_FACET_CONTRIBUTIONS = 15;

// ---- Helpers ----

/** Convert a 1-5 IPIP score to a signed deviation in [-1, +1] around the midpoint (3.0). */
function toDeviation(score: number): number {
  return (score - 3.0) / 2.0;
}

/** Round to 1 decimal place. */
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---- Main export ----

/**
 * Derive Collaboration Style distribution from Big Five domain and/or facet scores.
 *
 * Uses IPIP-NEO-120 facet-level data as the primary signal when available,
 * and falls back to domain scores for any missing facets. Both inputs are
 * expected on the 1–5 IPIP scale.
 *
 * Output scores are percentage-based and sum to 100.
 *
 * @param domains - Big Five domain means (1-5 scale)
 * @param facets  - Big Five facet means (1-5 scale); optional
 * @returns CollabMapping with scores, gradient, and confidence
 */
export function mapBigFiveToCollabStyle(
  domains: Record<BigFiveDimension, number>,
  facets?: Record<string, number>,
): CollabMapping {
  const hasFacets = facets !== undefined && Object.keys(facets).length > 0;
  let facetsUsedCount = 0;

  // --- Step 1: Raw signal per style (mean deviation in [-1, +1]) ---
  const rawSignals = {} as Record<CollabStyle, number>;

  for (const style of ['D', 'I', 'S', 'C'] as CollabStyle[]) {
    const contribs = COLLAB_STYLE_WEIGHTS[style];
    let deviationSum = 0;

    for (const contrib of contribs) {
      let score: number;

      if (contrib.type === 'domain') {
        score = domains[contrib.key];
      } else {
        // Prefer facet; fall back to domain
        const facetVal = hasFacets ? facets![contrib.key] : undefined;
        if (facetVal !== undefined && facetVal > 0) {
          score = facetVal;
          facetsUsedCount++;
        } else {
          score = domains[contrib.domainFallback];
        }
      }

      const dev = toDeviation(score);
      deviationSum += contrib.reversed ? -dev : dev;
    }

    rawSignals[style] = deviationSum / contribs.length; // mean, range [-1, +1]
  }

  // --- Step 2: Shift to [0, 2] so all values are non-negative ---
  const shifted = {
    D: rawSignals.D + 1.0,
    I: rawSignals.I + 1.0,
    S: rawSignals.S + 1.0,
    C: rawSignals.C + 1.0,
  } as Record<CollabStyle, number>;

  const total = shifted.D + shifted.I + shifted.S + shifted.C;

  // --- Step 3: Normalize to percentages summing to 100 ---
  const scores = {
    D: r1((shifted.D / total) * 100),
    I: r1((shifted.I / total) * 100),
    S: r1((shifted.S / total) * 100),
    C: r1((shifted.C / total) * 100),
  } as Record<CollabStyle, number>;

  // Correct floating-point rounding drift so sum is exactly 100
  const scoreSum = scores.D + scores.I + scores.S + scores.C;
  const drift = r1(100 - scoreSum);
  if (drift !== 0) {
    const maxStyle = (['D', 'I', 'S', 'C'] as CollabStyle[]).reduce((a, b) =>
      scores[a] >= scores[b] ? a : b,
    );
    scores[maxStyle] = r1(scores[maxStyle] + drift);
  }

  // --- Step 4: Primary and secondary styles ---
  const sorted = (['D', 'I', 'S', 'C'] as CollabStyle[]).sort(
    (a, b) => scores[b] - scores[a],
  );
  const primary = sorted[0];
  // Show secondary only when the two top styles are within 12 percentage points
  const secondary: CollabStyle | null =
    scores[sorted[0]] - scores[sorted[1]] < 12 ? sorted[1] : null;

  // --- Step 5: CSS gradient ---
  const cssGradient = secondary
    ? `linear-gradient(135deg, ${COLLAB_STYLE_HEX[primary]} 0%, ${COLLAB_STYLE_HEX[secondary]} 100%)`
    : `linear-gradient(135deg, ${COLLAB_STYLE_HEX[primary]} 0%, ${COLLAB_STYLE_HEX[primary]} 100%)`;

  // --- Step 6: Confidence ---
  // 0.45 (domain-only fallback) → 0.75 (all 15 facets resolved)
  const facetCoverage = hasFacets ? facetsUsedCount / MAX_FACET_CONTRIBUTIONS : 0;
  const confidence = Math.round((0.45 + facetCoverage * 0.30) * 100) / 100;

  return {
    primary,
    secondary,
    scores,
    cssGradient,
    derivedFrom: 'big_five_mapping',
    approximationNote_zh: '基于大五人格的行为风格推导，仅供参考',
    approximationNote_en: 'Approximated from Big Five personality data — for reference only',
    confidence,
  };
}

