// ============================================================
// Unified Feature Access — cohort entitlements OR purchase
//
// Combines two independent access paths:
//   1. Cohort-based: invite code → cohort → entitlements (thesis/beta)
//   2. Purchase-based: Stripe payment → UserPurchase table
//
// Usage:
//   const allowed = await canAccessFeature(userId, cohort, 'aiReport')
//   if (!allowed) { return 403 }
// ============================================================

import { canAccess } from "@/lib/cohort/entitlements";
import { hasPurchased } from "@/lib/db/purchases";
import type { CohortEntitlements } from "@/lib/cohort/types";
import type { PurchaseTier } from "@/lib/db/purchases";

/**
 * Map entitlement features to the purchase tier that grants them.
 * "journey" is a superset of "report" — hasPurchased() handles this.
 */
const FEATURE_TO_TIER: Partial<Record<keyof CohortEntitlements, PurchaseTier>> =
  {
    deepDive: "report",
    aiProfile: "report",
    aiReport: "report",
    resumeEnhancement: "report",
    aiCoaching: "journey",
  };

/**
 * Check whether a user can access a feature via cohort OR purchase.
 *
 * - Cohort check is synchronous (zero DB queries)
 * - Purchase check only fires if cohort doesn't grant access
 */
export async function canAccessFeature(
  userId: string | null | undefined,
  cohort: string | null | undefined,
  feature: keyof CohortEntitlements,
): Promise<boolean> {
  // Path 1: cohort grants access (thesis/beta users, free features)
  if (canAccess(cohort, feature)) return true;

  // Path 2: purchase grants access
  if (!userId) return false;
  const requiredTier = FEATURE_TO_TIER[feature];
  if (!requiredTier) return false;

  return hasPurchased(userId, requiredTier);
}
