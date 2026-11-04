// ============================================================
// Experiment Assignment — Deterministic Hash-Based Bucketing
//
// Given a user/client identifier and an experiment ID, returns
// a stable variant assignment. No DB writes, no network calls.
//
// Algorithm:
//   1. Hash(experimentId + identifier) → 32-bit integer
//   2. Map integer to [0, totalWeight) range
//   3. Walk variant weights to find the assigned bucket
//
// This ensures:
//   - Same user always gets same variant (deterministic)
//   - Variants are assigned proportionally to weights
//   - Different experiments give different assignments (independent)
// ============================================================

import { getExperiment, type ExperimentConfig } from "./config";

/**
 * Deterministic hash function (djb2 variant).
 * Returns a positive 32-bit integer.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Assign a variant for a given experiment and identifier.
 *
 * @param experimentId - Experiment ID from config
 * @param identifier - User ID, client ID, or session ID (must be stable)
 * @param cohort - User's cohort (for cohort-restricted experiments)
 * @returns Variant ID string, or null if experiment not found / not eligible
 */
export function assignVariant(
  experimentId: string,
  identifier: string,
  cohort?: string | null,
): string | null {
  const experiment = getExperiment(experimentId);
  if (!experiment) return null;

  // Check if experiment is active
  if (experiment.paused) return experiment.variants[0]?.id ?? null;

  const now = new Date().toISOString();
  if (experiment.startDate && now < experiment.startDate) return null;
  if (experiment.endDate && now > experiment.endDate) return null;

  // Check cohort restriction
  if (experiment.cohortRestriction && experiment.cohortRestriction.length > 0) {
    if (!cohort || !experiment.cohortRestriction.includes(cohort)) {
      return null;
    }
  }

  return bucketVariant(experiment, identifier);
}

/**
 * Pure bucketing function — deterministic variant assignment.
 * Exported for testing.
 */
export function bucketVariant(
  experiment: ExperimentConfig,
  identifier: string,
): string {
  const { variants } = experiment;
  if (variants.length === 0) return "control";
  if (variants.length === 1) return variants[0].id;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) return variants[0].id;

  const hash = hashString(`${experiment.id}:${identifier}`);
  const bucket = hash % totalWeight;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.id;
  }

  return variants[variants.length - 1].id;
}
