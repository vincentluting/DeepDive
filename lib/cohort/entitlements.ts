// ============================================================
// Cohort Entitlements — resolve feature access from cohort config
//
// Zero DB queries. Reads user.cohort → looks up COHORT_CONFIG.
// ============================================================

import { COHORT_CONFIG, DEFAULT_ENTITLEMENTS } from './config'
import type { CohortEntitlements } from './types'

/**
 * Resolve full entitlements for a user based on their cohort.
 * Returns DEFAULT_ENTITLEMENTS (free tier) if cohort is null or unknown.
 */
export function getUserEntitlements(cohort: string | null | undefined): CohortEntitlements {
  if (!cohort) return DEFAULT_ENTITLEMENTS
  return COHORT_CONFIG[cohort]?.entitlements ?? DEFAULT_ENTITLEMENTS
}

/**
 * Check whether a user has access to a specific feature.
 * Usage: `if (!canAccess(user.cohort, 'deepDive')) { deny }`
 */
export function canAccess(
  cohort: string | null | undefined,
  feature: keyof CohortEntitlements,
): boolean {
  const entitlements = getUserEntitlements(cohort)
  return !!entitlements[feature]
}
