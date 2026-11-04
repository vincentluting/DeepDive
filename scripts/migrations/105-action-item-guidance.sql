-- ActionItem guidance fields for the coach-like Action Hub experience.
-- Nullable for graceful fallback on existing active plans.

ALTER TABLE "ActionItem"
  ADD COLUMN IF NOT EXISTS "planPhase" INTEGER
    CHECK ("planPhase" IS NULL OR "planPhase" IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS "recommendationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "completionOutcome" TEXT;
