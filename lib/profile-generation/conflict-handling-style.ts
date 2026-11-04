// ============================================================
// Conflict Handling Style — Thomas-Kilmann (TKI) Algorithm
//
// Maps Big Five facets to the TKI two-axis model
// (Thomas & Kilmann 1974, Dijkstra et al. 2023):
//   Assertiveness (vertical): pursuing own concerns
//   Cooperativeness (horizontal): pursuing others' concerns
//
// Five conflict modes:
//   Competing      = high assert, low cooperate
//   Collaborating  = high assert, high cooperate
//   Compromising   = moderate both
//   Avoiding       = low assert, low cooperate
//   Accommodating  = low assert, high cooperate
//
// Facet mapping (Dijkstra et al. 2023):
//   Assertiveness axis: E3, inv(A5_Modesty), inv(N4)
//   Cooperativeness axis: A4(Cooperation), A3(Altruism), A6(Sympathy)
//   Collaborating bonus: O_domain (openness to creative solutions)
//
// Pure algorithm, no LLM.
// ============================================================

import type { ConflictHandlingProfile, ConflictMode } from "../types";
import {
  facetPercentile,
  percentileFromNormalized,
} from "@/lib/psychometrics/big-five-norms";

/**
 * Extract a facet score from bigFiveFacetPairs array.
 */
function getFacet(
  facetPairs: Array<{ facet: string; score: number }>,
  key: string,
): number | null {
  const entry = facetPairs.find((f) => f.facet === key);
  return entry?.score ?? null;
}

/** Clamp to 0-100 */
function clamp100(v: number): number {
  return Math.round(Math.max(0, Math.min(100, v)));
}

/**
 * Compute Conflict Handling Style from Big Five facets + domain scores.
 *
 * Assertiveness:    E3 × 0.50 + inv(A5) × 0.25 + inv(N4) × 0.25
 * Cooperativeness:  A4 × 0.40 + A3 × 0.30 + A6 × 0.30
 *
 * Mode scores use the two axes + modifiers:
 *   Competing     = assert × 0.60 + inv(coop) × 0.40
 *   Collaborating = assert × 0.35 + coop × 0.35 + O × 0.30
 *   Compromising  = 100 - |assert - 50| - |coop - 50|  (peaks at center)
 *   Avoiding      = inv(assert) × 0.50 + inv(coop) × 0.30 + N4 × 0.20
 *   Accommodating = inv(assert) × 0.40 + coop × 0.60
 */
export function computeConflictHandling(
  bigFiveFacetPairs: Array<{ facet: string; score: number }>,
  bigFiveDomains: Record<string, number>,
): ConflictHandlingProfile | undefined {
  const e3 = getFacet(bigFiveFacetPairs, "E3_Assertiveness");
  const a3 = getFacet(bigFiveFacetPairs, "A3_Altruism");
  const a4 = getFacet(bigFiveFacetPairs, "A4_Cooperation");
  const a5 = getFacet(bigFiveFacetPairs, "A5_Modesty");
  const a6 = getFacet(bigFiveFacetPairs, "A6_Sympathy");
  const n4 = getFacet(bigFiveFacetPairs, "N4_Self-Consciousness");

  // Need at least the two core axis facets
  if (e3 == null || a4 == null) return undefined;

  const o = bigFiveDomains.openness;
  if (o == null) return undefined;

  // Default missing optional facets to midpoint
  const a3v = a3 ?? 3.0;
  const a5v = a5 ?? 3.0;
  const a6v = a6 ?? 3.0;
  const n4v = n4 ?? 3.0;

  // NORM-REFERENCED facet scores (F15): each facet against its IPIP-NEO FACET
  // norm (K&J 2019; 50 = facet population median), so the TKI axes and the
  // |axis − 50| mode peaks center on the population, not the raw scale midpoint.
  const e3n = facetPercentile("E3_Assertiveness", e3);
  const a3n = facetPercentile("A3_Altruism", a3v);
  const a4n = facetPercentile("A4_Cooperation", a4);
  const a5inv = 100 - facetPercentile("A5_Modesty", a5v);
  const a6n = facetPercentile("A6_Sympathy", a6v);
  const n4n = facetPercentile("N4_Self-Consciousness", n4v);
  const n4inv = 100 - n4n;
  // Openness domain, norm-referenced for the Collaborating mode.
  const oPct = percentileFromNormalized("openness", o);

  // Two primary axes
  const assertiveness = clamp100(e3n * 0.5 + a5inv * 0.25 + n4inv * 0.25);
  const cooperativeness = clamp100(a4n * 0.4 + a3n * 0.3 + a6n * 0.3);

  // Five mode scores
  const invCoop = 100 - cooperativeness;
  const invAssert = 100 - assertiveness;

  const modeScores: Record<ConflictMode, number> = {
    competing: clamp100(assertiveness * 0.6 + invCoop * 0.4),
    collaborating: clamp100(
      assertiveness * 0.35 + cooperativeness * 0.35 + oPct * 0.3,
    ),
    compromising: clamp100(
      100 -
        Math.abs(assertiveness - 50) * 1.2 -
        Math.abs(cooperativeness - 50) * 1.2,
    ),
    avoiding: clamp100(invAssert * 0.5 + invCoop * 0.3 + n4n * 0.2),
    accommodating: clamp100(invAssert * 0.4 + cooperativeness * 0.6),
  };

  // Sort to find dominant + secondary
  const sorted = (Object.entries(modeScores) as [ConflictMode, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  const dominant = sorted[0][0];
  const secondary = sorted[1][1] >= sorted[0][1] - 8 ? sorted[1][0] : undefined;

  return {
    assertiveness,
    cooperativeness,
    dominant,
    secondary,
    modeScores,
    derivedFrom: {
      E3: e3,
      A3: a3v,
      A4: a4,
      A5: a5v,
      N4: n4v,
      O_domain: o,
    },
  };
}
