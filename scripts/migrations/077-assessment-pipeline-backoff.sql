-- Migration 077: AssessmentPipeline — exponential backoff field.
--
-- Follow-up to 076. The cron worker re-claims failed rows every minute,
-- which wastes LLM budget when a provider is in a 529/overload window
-- (expected recovery: 15–60 min per llm-provider-failover runbook).
--
-- Add nextAttemptAt so failed pipelines wait increasing amounts of time
-- before being re-claimed. Null = "ready to claim immediately".

ALTER TABLE "AssessmentPipeline"
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMPTZ;

-- Replace the workable index to include the backoff filter.
DROP INDEX IF EXISTS "AssessmentPipeline_workable_idx";
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_workable_idx"
  ON "AssessmentPipeline" ("status", "nextAttemptAt")
  WHERE "status" IN ('pending', 'running');

-- Drop the dead `lastError` column — only `lastStepError` is actually written.
ALTER TABLE "AssessmentPipeline"
  DROP COLUMN IF EXISTS "lastError";
