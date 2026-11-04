// ============================================================
// Purchases — Stripe payment tracking
//
// Records and queries user purchases. Used by:
//   - Stripe webhook (recordPurchase)
//   - Feature access checks (hasPurchased, getUserPurchases)
// ============================================================

import { sql } from './connection'

export type PurchaseTier = 'report' | 'journey' | 'coaching'

interface RecordPurchaseInput {
  userId: string
  tier: PurchaseTier
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  amountCents: number
  currency: string
}

/**
 * Record a new purchase from a completed Stripe checkout session.
 * Idempotent: if stripeSessionId already exists, this is a no-op.
 */
export async function recordPurchase(input: RecordPurchaseInput): Promise<void> {
  await sql`
    INSERT INTO "UserPurchase" (
      "userId", "tier", "stripeSessionId", "stripePaymentIntentId",
      "amountCents", "currency"
    )
    VALUES (
      ${input.userId}, ${input.tier}, ${input.stripeSessionId},
      ${input.stripePaymentIntentId}, ${input.amountCents}, ${input.currency}
    )
    ON CONFLICT ("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL
    DO NOTHING
  `
}

/**
 * Check if a user has an active purchase for a given tier.
 * "journey" tier also grants "report" access (it's a superset).
 */
export async function hasPurchased(
  userId: string,
  tier: PurchaseTier,
): Promise<boolean> {
  const tiers = tier === 'report'
    ? ['report', 'journey'] // journey includes report
    : [tier]

  const rows = await sql`
    SELECT 1 FROM "UserPurchase"
    WHERE "userId" = ${userId}
      AND "tier" = ANY(${tiers})
      AND "status" = 'active'
    LIMIT 1
  `
  return rows.length > 0
}

/**
 * Get all active purchases for a user.
 */
export async function getUserPurchases(userId: string) {
  return sql`
    SELECT "id", "tier", "amountCents", "currency", "status", "createdAt"
    FROM "UserPurchase"
    WHERE "userId" = ${userId}
      AND "status" = 'active'
    ORDER BY "createdAt" DESC
  `
}
