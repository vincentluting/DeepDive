-- Migration 020: Add idempotency key to AssessmentResult
--
-- Problem: /api/score creates a new AssessmentResult every time it's called,
-- even on retries with identical data. Network timeouts cause duplicate rows.
--
-- Fix: Add an optional idempotencyKey column with a partial unique index.
-- Client sends `sessionId_score` as the key; duplicate requests return
-- the existing assessment instead of creating a new one.

DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AssessmentResult' AND column_name = 'idempotencyKey'
  ) THEN
    ALTER TABLE "AssessmentResult" ADD COLUMN "idempotencyKey" TEXT;
  END IF;

  -- Create unique index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_idempotency'
  ) THEN
    CREATE UNIQUE INDEX idx_assessment_idempotency
      ON "AssessmentResult"("idempotencyKey")
      WHERE "idempotencyKey" IS NOT NULL;
  END IF;
END
$$;
