-- Migration 038: Assessment Completion Registry
--
-- Creates a unified registry table that tracks which assessments each user
-- has completed. Replaces ad-hoc status checks (hasQuickDiveResult,
-- getDeepDiveStatusForUser) with a single source of truth.
--
-- Backfills existing data from QuickDiveResult and QuestionnaireSession.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS "AssessmentCompletion" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "assessmentType" TEXT NOT NULL CHECK ("assessmentType" IN (
    'quick_dive', 'immersive_dive', 'deep_dive', 'ultra_deep_dive', 'pvq_quick'
  )),
  "resultId"       TEXT NOT NULL,
  "completedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ac_user ON "AssessmentCompletion"("userId");
CREATE INDEX IF NOT EXISTS idx_ac_user_type ON "AssessmentCompletion"("userId", "assessmentType");
CREATE UNIQUE INDEX IF NOT EXISTS idx_ac_user_type_result
  ON "AssessmentCompletion"("userId", "assessmentType", "resultId");

-- 2. Backfill from QuickDiveResult (quick_dive + immersive_dive)
INSERT INTO "AssessmentCompletion" ("id", "userId", "assessmentType", "resultId", "completedAt")
SELECT
  gen_random_uuid()::text,
  "userId",
  CASE
    WHEN "exploreMode" = 'immersive' THEN 'immersive_dive'
    ELSE 'quick_dive'
  END,
  "id",
  "createdAt"
FROM "QuickDiveResult"
WHERE "userId" IS NOT NULL
ON CONFLICT ("userId", "assessmentType", "resultId") DO NOTHING;

-- 3. Backfill from QuestionnaireSession (deep_dive)
INSERT INTO "AssessmentCompletion" ("id", "userId", "assessmentType", "resultId", "completedAt")
SELECT
  gen_random_uuid()::text,
  qs."userId",
  'deep_dive',
  qs."id",
  COALESCE(qs."completedAt", qs."updatedAt")
FROM "QuestionnaireSession" qs
WHERE qs."userId" IS NOT NULL
  AND qs."tier" = 'deep'
  AND (qs."status" = 'completed' OR qs."completedAt" IS NOT NULL)
ON CONFLICT ("userId", "assessmentType", "resultId") DO NOTHING;
