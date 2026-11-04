-- Migration 051: User purchases table for Stripe payment tracking
-- Tracks which users have purchased which product tiers

CREATE TABLE IF NOT EXISTS "UserPurchase" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tier" TEXT NOT NULL CHECK ("tier" IN ('report', 'journey', 'coaching')),
  "stripeSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "amountCents" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'refunded', 'expired')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_purchase_user ON "UserPurchase" ("userId");
CREATE INDEX IF NOT EXISTS idx_user_purchase_user_tier ON "UserPurchase" ("userId", "tier");
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_purchase_stripe_session ON "UserPurchase" ("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;
