-- Migration 084 — Durable job queue
--
-- Generic Postgres-backed queue for non-critical but must-eventually-run
-- side effects. Workers claim rows with SKIP LOCKED, hold a short lease, and
-- retry with exponential backoff. The first production user is registration
-- post-processing: analytics identity linking, geo enrichment, welcome email.

CREATE TABLE IF NOT EXISTS "DurableJob" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type"           TEXT NOT NULL,
  "payload"        JSONB NOT NULL DEFAULT '{}',
  "status"         TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed')),
  "priority"       INTEGER NOT NULL DEFAULT 0,
  "attempts"       INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "maxAttempts"    INTEGER NOT NULL DEFAULT 5 CHECK ("maxAttempts" > 0),
  "runAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lockedBy"       TEXT,
  "lockedAt"       TIMESTAMPTZ,
  "lastError"      TEXT,
  "idempotencyKey" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_durable_job_idempotency"
  ON "DurableJob"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_durable_job_workable"
  ON "DurableJob"("status", "runAt", "priority" DESC)
  WHERE "status" IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS "idx_durable_job_type_status"
  ON "DurableJob"("type", "status", "runAt");

CREATE INDEX IF NOT EXISTS "idx_durable_job_locked"
  ON "DurableJob"("lockedAt")
  WHERE "lockedBy" IS NOT NULL;
