-- Migration 097: AI Coach V2 session state and diagnostic feedback
-- Adds stable resumable session state plus structured feedback reasons.

ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "stateJson" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';

ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "CoachingSession"
  ALTER COLUMN "mode" SET DEFAULT 'explore';

ALTER TABLE "CoachingSession"
  DROP CONSTRAINT IF EXISTS "CoachingSession_status_check";

ALTER TABLE "CoachingSession"
  ADD CONSTRAINT "CoachingSession_status_check"
  CHECK ("status" IN ('active', 'completed'));

ALTER TABLE "CoachingFeedback"
  ADD COLUMN IF NOT EXISTS "reasons" TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "idx_coaching_user_updated"
  ON "CoachingSession"("userId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coaching_user_active"
  ON "CoachingSession"("userId", "status")
  WHERE "status" = 'active';
