-- Migration 101: Coaching review pool
-- Queues low-quality or judge-failed coaching turns for human quality review.

CREATE TABLE IF NOT EXISTS "CoachingReviewPool" (
  "id"                    TEXT PRIMARY KEY,
  "userId"                TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reportId"              TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "round"                 INTEGER NOT NULL,
  "locale"                TEXT NOT NULL DEFAULT 'en',
  "reason"                TEXT NOT NULL,
  "userMessage"           TEXT,
  "assistantMessage"      TEXT NOT NULL,
  "deterministicEvalJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "llmJudgeJson"          JSONB,
  "status"                TEXT NOT NULL DEFAULT 'open'
    CHECK ("status" IN ('open', 'reviewed', 'dismissed')),
  "reviewNotes"           TEXT,
  "reviewedBy"            TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewedAt"            TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_coaching_review_pool_status_created"
  ON "CoachingReviewPool"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coaching_review_pool_user_created"
  ON "CoachingReviewPool"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;
