-- ============================================================
-- 040: Add journey state machine to User table
--
-- Adds a journeyState column to track user progression through
-- the exploration journey. Single source of truth — replaces
-- fragmented state tracking across multiple tables/caches.
--
-- Also creates JourneyTransitionLog for audit trail.
-- ============================================================

BEGIN;

-- Add journeyState column with CHECK constraint
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "journeyState" TEXT NOT NULL DEFAULT 'not_started'
  CHECK ("journeyState" IN (
    'not_started',
    'quick_dive_complete',
    'deep_dive_complete',
    'profile_generated',
    'report_generated',
    'coaching_unlocked'
  ));

-- Audit log for all state transitions
CREATE TABLE IF NOT EXISTS "JourneyTransitionLog" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fromState"   TEXT NOT NULL,
  "toState"     TEXT NOT NULL,
  "event"       TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL DEFAULT 'system',
  "metadata"    JSONB DEFAULT '{}',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_journey_log_user"
  ON "JourneyTransitionLog"("userId");

CREATE INDEX IF NOT EXISTS "idx_journey_log_created"
  ON "JourneyTransitionLog"("createdAt");

-- ── Backfill existing users based on current data ──
-- Users with CareerReport → report_generated
UPDATE "User" SET "journeyState" = 'report_generated'
WHERE "id" IN (
  SELECT DISTINCT cr."userId" FROM "CareerReport" cr WHERE cr."userId" IS NOT NULL
) AND "journeyState" = 'not_started';

-- Users with PersonalProfile (but no report) → profile_generated
UPDATE "User" SET "journeyState" = 'profile_generated'
WHERE "id" IN (
  SELECT DISTINCT pp."userId" FROM "PersonalProfile" pp WHERE pp."userId" IS NOT NULL
) AND "journeyState" = 'not_started';

-- Users with AssessmentResult (deep dive done, but no profile) → deep_dive_complete
UPDATE "User" SET "journeyState" = 'deep_dive_complete'
WHERE "id" IN (
  SELECT DISTINCT ac."userId" FROM "AssessmentCompletion" ac
  WHERE ac."assessmentType" = 'deep_dive'
) AND "journeyState" = 'not_started';

-- Users with QuickDiveResult (but no deep dive) → quick_dive_complete
UPDATE "User" SET "journeyState" = 'quick_dive_complete'
WHERE "id" IN (
  SELECT DISTINCT qd."userId" FROM "QuickDiveResult" qd WHERE qd."userId" IS NOT NULL
) AND "journeyState" = 'not_started';

COMMIT;
