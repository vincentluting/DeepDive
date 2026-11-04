// ============================================================
// Career Exploration Engine — Weight Configurations
//
// Defines how factor scores are combined at each precision level.
// Weights are separated from algorithm so they can be tuned
// independently (e.g., A/B testing, per-user calibration).
//
// v2 Changes (2026-03-12):
// - Removed collabFit: construct contamination — derived from
//   RIASEC, not independently measured, inflating RIASEC to ~34%
// - Removed industryFit from scoring: moved to pre-filter.
//   Industry is a constraint, not a preference signal.
// - Adaptability now career-specific (uses aiEraCategory),
//   making it meaningful for ranking instead of a global constant.
// - Redistributed weights to remaining 4 dimensions.
// ============================================================

export interface WeightConfig {
  interestFit: number;
  personalityFit: number;
  valueFit: number;
  adaptabilityFit: number;
  /** @deprecated v2: set to 0, kept for interface stability */
  collabFit: number;
  /** @deprecated v2: set to 0, industry is now a pre-filter */
  industryFit: number;
}

/**
 * Weight presets by precision level.
 *
 * Quick: Only RIASEC is available, so it gets 100%.
 *        Other factors score 50 (neutral) and weight 0.
 *
 * Full (v3, 2026-06-19 — restores factor independence, FINDINGS F8/B1):
 *   3 INDEPENDENT instruments, one factor each:
 *   - Interest (RIASEC)      38% — Holland's vocational theory
 *   - Personality (Big Five)  29% — Costa & McCrae's FFM
 *   - Values (Schwartz)       33% — Schwartz's value circumplex
 *
 *   v2 weighted adaptabilityFit at 15%, but adaptability is derived from the
 *   SAME Schwartz instrument as valueFit (ipsative stimulation−security),
 *   so Schwartz drove 28% + 15% = 43% of the score — the two factors were
 *   NOT statistically independent (mirroring the collabFit/RIASEC
 *   contamination v2 itself removed). With only 3 source instruments, true
 *   independence requires adaptabilityFit weight = 0; its former 15% is
 *   redistributed proportionally to the 3 genuine instruments.
 *
 *   Career AI-era risk is NOT lost: it is still encoded in ranking via the
 *   engine's AI-disruption penalty ("transformed" −10) and resilience
 *   pre-filters; adaptabilityFit.score is still computed for the UI
 *   breakdown but contributes 0 to the weighted total.
 *
 *   Removed earlier: collabFit (RIASEC-derived), industryFit (→ pre-filter).
 */
export const WEIGHT_PRESETS: Record<"quick" | "full", WeightConfig> = {
  quick: {
    interestFit: 1.0,
    personalityFit: 0,
    valueFit: 0,
    adaptabilityFit: 0,
    collabFit: 0,
    industryFit: 0,
  },
  full: {
    interestFit: 0.38,
    personalityFit: 0.29,
    valueFit: 0.33,
    adaptabilityFit: 0, // v3: removed — Schwartz-derived, broke independence (B1)
    collabFit: 0, // v2: removed (construct contamination)
    industryFit: 0, // v2: moved to pre-filter
  },
};

/** Display order for match factors shown in the report breakdown. */
const MATCH_FACTOR_ORDER: ReadonlyArray<keyof WeightConfig> = [
  "interestFit",
  "valueFit",
  "personalityFit",
  "adaptabilityFit",
  "industryFit",
  "collabFit",
];

/**
 * Factors that contribute to the weighted match total (weight > 0) at a given
 * precision, in display order. Single source of truth for any UI that renders
 * the match-score composition, so the report never drifts from engine weights.
 */
export function getWeightedMatchFactors(
  precision: "quick" | "full" = "full",
): Array<{ key: keyof WeightConfig; weight: number }> {
  const w = WEIGHT_PRESETS[precision];
  return MATCH_FACTOR_ORDER.filter((k) => w[k] > 0).map((k) => ({
    key: k,
    weight: w[k],
  }));
}
