// ============================================================
// Intra-Domain Tension Detection — Shared Utility
// Finds facet pairs within the same Big Five domain that
// deviate in opposite directions from the domain mean.
// Used by: profile narrative prompt, memory generation, UI display.
// ============================================================

import type { BigFiveDimension } from '../types';

export interface FacetPairInput {
  domain: BigFiveDimension;
  facet: string;
  score: number;
  deviationFromMean: number;
}

export interface IntraDomainTension {
  domain: string;
  high: { facet: string; score: number; deviation: number };
  low: { facet: string; score: number; deviation: number };
  tensionStrength: number;
}

/** Minimum absolute deviation from domain mean to qualify as meaningful.
 *  0.25 on a 1-5 scale ≈ 0.5 SD per IPIP research — catches subtle but
 *  real contradictions without introducing noise (safe for IPIP-60 2-item means). */
const DEVIATION_THRESHOLD = 0.25;

/**
 * Detect intra-domain tensions: facet pairs within the same Big Five domain
 * that deviate in opposite directions from the domain mean.
 *
 * Example: High Assertiveness (+0.8) + Low Gregariousness (-1.5) within Extraversion
 * → "quiet leader" pattern invisible at domain level.
 *
 * @param facetPairs - All 30 facet pairs with domain, score, and deviation
 * @param maxResults - Maximum number of tensions to return (default 3)
 * @returns Top tensions sorted by strength (|dev_high| + |dev_low|)
 */
export function detectIntraDomainTensions(
  facetPairs: FacetPairInput[],
  maxResults = 3,
): IntraDomainTension[] {
  // Group facets by domain
  const byDomain: Record<string, FacetPairInput[]> = {};
  for (const fp of facetPairs) {
    if (!byDomain[fp.domain]) byDomain[fp.domain] = [];
    byDomain[fp.domain].push(fp);
  }

  const tensions: IntraDomainTension[] = [];

  for (const [domain, facets] of Object.entries(byDomain)) {
    const positive = facets.filter(f => f.deviationFromMean > DEVIATION_THRESHOLD);
    const negative = facets.filter(f => f.deviationFromMean < -DEVIATION_THRESHOLD);

    if (positive.length > 0 && negative.length > 0) {
      // Pick the strongest positive and strongest negative within this domain
      const strongest_pos = positive.sort(
        (a, b) => b.deviationFromMean - a.deviationFromMean,
      )[0];
      const strongest_neg = negative.sort(
        (a, b) => a.deviationFromMean - b.deviationFromMean,
      )[0];

      tensions.push({
        domain,
        high: {
          facet: strongest_pos.facet,
          score: strongest_pos.score,
          deviation: strongest_pos.deviationFromMean,
        },
        low: {
          facet: strongest_neg.facet,
          score: strongest_neg.score,
          deviation: strongest_neg.deviationFromMean,
        },
        tensionStrength:
          Math.abs(strongest_pos.deviationFromMean) +
          Math.abs(strongest_neg.deviationFromMean),
      });
    }
  }

  return tensions
    .sort((a, b) => b.tensionStrength - a.tensionStrength)
    .slice(0, maxResults);
}
