-- Migration 058: Add anonymousId to QuickDiveResult
-- Allows linking Quick Dive results to anonymous users (no FK — anonymous IDs are not in the User table)

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE "QuickDiveResult"
  ADD COLUMN IF NOT EXISTS "anonymousId" TEXT;

CREATE INDEX IF NOT EXISTS idx_quickdive_anonymous
  ON "QuickDiveResult"("anonymousId");

-- ============================================================
-- DOWN (rollback)
-- ============================================================

-- DROP INDEX IF EXISTS idx_quickdive_anonymous;
-- ALTER TABLE "QuickDiveResult" DROP COLUMN IF EXISTS "anonymousId";
