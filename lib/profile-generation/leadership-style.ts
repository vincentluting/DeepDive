// ============================================================
// Leadership Style Algorithm — Goleman's 6 Styles
//
// Maps Big Five domains + facets to Goleman's (2000) six
// leadership styles. Each style has a weighted formula
// based on the emotional intelligence competencies Goleman
// identified as underlying each style.
//
// Pure algorithm, no LLM.
// ============================================================

import type { LeadershipStyleResult, LeadershipStyleType } from "../types";
import { percentileFromNormalized } from "@/lib/psychometrics/big-five-norms";

/**
 * Compute Goleman leadership style scores from Big Five domains (0-100).
 *
 * Mapping rationale (Goleman 2000, "Leadership That Gets Results"):
 * - Visionary: high Openness + high Extraversion (self-confidence, empathy, change catalyst)
 * - Coaching: high Agreeableness + high Openness (developing others, empathy, self-awareness)
 * - Affiliative: high Agreeableness + high Extraversion (empathy, building relationships)
 * - Democratic: high Agreeableness + moderate Extraversion (collaboration, team leadership)
 * - Pacesetting: high Conscientiousness + low Agreeableness (drive to achieve, initiative)
 * - Commanding: high Extraversion + low Agreeableness + high Conscientiousness (initiative, self-control)
 */
export function computeLeadershipStyle(
  bigFiveDomains: Record<string, number>,
): LeadershipStyleResult | undefined {
  const oRaw = bigFiveDomains.openness;
  const cRaw = bigFiveDomains.conscientiousness;
  const eRaw = bigFiveDomains.extraversion;
  const aRaw = bigFiveDomains.agreeableness;
  const nRaw = bigFiveDomains.neuroticism;

  if (
    oRaw == null ||
    cRaw == null ||
    eRaw == null ||
    aRaw == null ||
    nRaw == null
  )
    return undefined;

  // NORM-REFERENCED (F15): feed population percentiles (50 = median) into the
  // weighted formulas rather than linearly-rescaled 0-100 domain scores, so the
  // relative style comparison centers on the population, not the raw scale
  // midpoint (which the elevated Big Five means sit well above).
  const o = percentileFromNormalized("openness", oRaw);
  const c = percentileFromNormalized("conscientiousness", cRaw);
  const e = percentileFromNormalized("extraversion", eRaw);
  const a = percentileFromNormalized("agreeableness", aRaw);

  // Emotional stability (inverted neuroticism), norm-referenced
  const es = 100 - percentileFromNormalized("neuroticism", nRaw);

  // Weighted score formulas (each sums to ~100 base)
  const scores: Record<LeadershipStyleType, number> = {
    visionary: normalize(o * 0.35 + e * 0.3 + es * 0.2 + a * 0.15),
    coaching: normalize(a * 0.3 + o * 0.25 + es * 0.2 + e * 0.15 + c * 0.1),
    affiliative: normalize(a * 0.35 + e * 0.25 + es * 0.25 + o * 0.15),
    democratic: normalize(a * 0.3 + e * 0.2 + o * 0.2 + c * 0.15 + es * 0.15),
    pacesetting: normalize(c * 0.35 + (100 - a) * 0.25 + e * 0.2 + es * 0.2),
    commanding: normalize(e * 0.3 + c * 0.25 + (100 - a) * 0.25 + es * 0.2),
  };

  // Sort by score
  const sorted = (
    Object.entries(scores) as [LeadershipStyleType, number][]
  ).sort((a, b) => b[1] - a[1]);

  const primary = sorted[0][0];
  const secondary = sorted[1][1] >= sorted[0][1] - 8 ? sorted[1][0] : undefined;

  return { primary, secondary, scores };
}

/** Clamp to 0-100 */
function normalize(v: number): number {
  return Math.round(Math.max(0, Math.min(100, v)));
}
