-- Migration 075: Add ReportGenerationLock to prevent duplicate cross-instance
-- report generation.
--
-- Problem: /api/generate-report uses an in-memory Map to dedupe concurrent
-- generation for the same assessmentId. On Vercel serverless, two requests
-- hitting different instances both start the full 3×LLM pipeline. The DB
-- UNIQUE constraint on save catches the duplicate, but only AFTER ~$0.10+
-- of wasted API calls and up to 180s of compute.
--
-- Solution: atomic claim via INSERT...ON CONFLICT UPDATE WHERE expiresAt < NOW().
-- The request that RETURNS its own instanceId owns the lock. Other requests
-- poll for the CareerReport row to appear.
--
-- Self-expiring: if the holder crashes, another instance can reclaim after
-- expiresAt (defaulting to 180s — matches PIPELINE_TIMEOUT_MS).

CREATE TABLE IF NOT EXISTS "ReportGenerationLock" (
  "assessmentId" TEXT PRIMARY KEY,
  "instanceId"   TEXT NOT NULL,
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  "acquiredAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ReportGenerationLock_expiresAt_idx"
  ON "ReportGenerationLock" ("expiresAt");
