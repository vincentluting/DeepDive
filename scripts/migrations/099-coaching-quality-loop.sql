-- Migration 099: Coaching quality loop
-- Adds low-friction feedback tags and per-turn coaching quality telemetry.

ALTER TABLE "CoachingFeedback"
  ADD COLUMN IF NOT EXISTS "tagsJson" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS "CoachingTurnEval" (
  "id"                      TEXT PRIMARY KEY,
  "userId"                  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reportId"                TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "round"                   INTEGER NOT NULL,
  "locale"                  TEXT NOT NULL DEFAULT 'en',
  "phase"                   TEXT NOT NULL CHECK ("phase" IN (
    'discovery', 'pattern_surfacing', 'tension_naming', 'synthesis', 'action'
  )),
  "depthScore"              INTEGER NOT NULL CHECK ("depthScore" BETWEEN 1 AND 5),
  "transitionScore"         INTEGER NOT NULL CHECK ("transitionScore" BETWEEN 1 AND 5),
  "evidenceGroundingScore"  INTEGER NOT NULL CHECK ("evidenceGroundingScore" BETWEEN 1 AND 5),
  "prematureAdviceFlag"     BOOLEAN NOT NULL DEFAULT FALSE,
  "genericSummaryFlag"      BOOLEAN NOT NULL DEFAULT FALSE,
  "oneQuestionCompliance"   BOOLEAN NOT NULL DEFAULT TRUE,
  "reasonsJson"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "stateJson"               JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_eval_user_created"
  ON "CoachingTurnEval"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_eval_quality"
  ON "CoachingTurnEval"("createdAt" DESC)
  WHERE "transitionScore" < 4
     OR "evidenceGroundingScore" < 4
     OR "prematureAdviceFlag" = TRUE
     OR "genericSummaryFlag" = TRUE;
