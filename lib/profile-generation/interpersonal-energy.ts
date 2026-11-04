// ============================================================
// Interpersonal Energy Spectrum — IPC-inspired Algorithm
//
// Maps Big Five facets to the Interpersonal Circumplex (IPC)
// two-axis model (Wiggins 1979, Locke 2023):
//   Agency (vertical): assertiveness, dominance, confidence
//   Communion (horizontal): warmth, empathy, connection
//
// Quadrants:
//   Assured + Warm     = natural leaders who connect
//   Assured + Reserved  = independent drivers
//   Unassuming + Warm   = supportive team players
//   Unassuming + Reserved = reflective observers
//
// Energy mode:
//   Amplifier  (high E2) = gains energy from group interaction
//   Curator    (mid E2)  = selective about social investment
//   Observer   (low E2)  = recharges in solitude
//
// Pure algorithm, no LLM.
// ============================================================

import type { InterpersonalEnergySpectrum } from "../types";
import { facetPercentile } from "@/lib/psychometrics/big-five-norms";

/**
 * Extract a facet score from bigFiveFacetPairs array.
 * Returns null if not found.
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
 * Compute Interpersonal Energy Spectrum from Big Five facet data.
 *
 * Agency axis:    E3(Assertiveness) × 0.45 + inv(A5_Modesty) × 0.30 + inv(N4) × 0.25
 * Communion axis: A3(Altruism) × 0.30 + A6(Sympathy) × 0.30 + E1(Friendliness) × 0.40
 */
export function computeInterpersonalEnergy(
  bigFiveFacetPairs: Array<{ facet: string; score: number }>,
): InterpersonalEnergySpectrum | undefined {
  const e1 = getFacet(bigFiveFacetPairs, "E1_Friendliness");
  const e2 = getFacet(bigFiveFacetPairs, "E2_Gregariousness");
  const e3 = getFacet(bigFiveFacetPairs, "E3_Assertiveness");
  const a3 = getFacet(bigFiveFacetPairs, "A3_Altruism");
  const a5 = getFacet(bigFiveFacetPairs, "A5_Modesty");
  const a6 = getFacet(bigFiveFacetPairs, "A6_Sympathy");
  const n4 = getFacet(bigFiveFacetPairs, "N4_Self-Consciousness");

  // Need at least the core facets
  if (e1 == null || e2 == null || e3 == null || a3 == null || a6 == null) {
    return undefined;
  }

  // Default missing optional facets to midpoint (3.0)
  const a5v = a5 ?? 3.0;
  const n4v = n4 ?? 3.0;

  // NORM-REFERENCED facet scores (F15): each facet is scored against its parent
  // domain's IPIP-NEO norm (50 = population median) instead of the raw scale
  // midpoint, so the Agency/Communion ≥ 50 quadrant cut no longer over-assigns
  // the high pole (esp. Communion → "warm", given elevated Agreeableness).
  // See big-five-norms.ts — scored against IPIP-NEO FACET norms (K&J 2019).
  const e1n = facetPercentile("E1_Friendliness", e1);
  const e2n = facetPercentile("E2_Gregariousness", e2);
  const e3n = facetPercentile("E3_Assertiveness", e3);
  const a3n = facetPercentile("A3_Altruism", a3);
  const a5inv = 100 - facetPercentile("A5_Modesty", a5v); // low modesty = high agency
  const a6n = facetPercentile("A6_Sympathy", a6);
  const n4inv = 100 - facetPercentile("N4_Self-Consciousness", n4v); // low self-consciousness = more assertive

  // Agency: assertiveness + confidence + low modesty
  const agency = clamp100(e3n * 0.45 + a5inv * 0.3 + n4inv * 0.25);

  // Communion: warmth + empathy + altruism
  const communion = clamp100(e1n * 0.4 + a3n * 0.3 + a6n * 0.3);

  // Quadrant
  const isAssured = agency >= 50;
  const isWarm = communion >= 50;
  const quadrant: InterpersonalEnergySpectrum["quadrant"] =
    isAssured && isWarm
      ? "assured-warm"
      : isAssured && !isWarm
        ? "assured-reserved"
        : !isAssured && isWarm
          ? "unassuming-warm"
          : "unassuming-reserved";

  // Energy mode based on E2 (Gregariousness)
  const energyMode: InterpersonalEnergySpectrum["energyMode"] =
    e2n >= 60 ? "amplifier" : e2n >= 40 ? "curator" : "observer";

  return {
    agency,
    communion,
    quadrant,
    energyMode,
    derivedFrom: {
      E1: e1,
      E2: e2,
      E3: e3,
      A3: a3,
      A5: a5v,
      A6: a6,
      N4: n4v,
    },
  };
}
