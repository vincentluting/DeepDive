-- Migration 013: Add idempotencyKey column to UserFunnel for deduplication
-- Allows callers to pass an idempotency key so that ON CONFLICT DO NOTHING
-- prevents duplicate event rows (e.g. report_viewed on every page refresh).
-- PostgreSQL UNIQUE constraints ignore NULL values, so existing rows (NULL key)
-- are unaffected and multiple NULL-key rows remain allowed.

ALTER TABLE "UserFunnel"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_funnel_idempotency_key"
  ON "UserFunnel" ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
