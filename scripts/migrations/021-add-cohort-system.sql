-- Migration 021: Cohort Journey System
--
-- Adds:
-- 1. User.cohort column for cohort membership tracking
-- 2. InviteCode table for self-service cohort enrollment
--
-- Design: cohort is separate from researchGroup (which drives Quick Dive A/B testing).
-- InviteCode.cohortId references a config key, not a FK — allows config removal without DB cleanup.
--
-- Note: Neon serverless driver only supports single-statement execution.
-- Each statement is separated by a semicolon and executed individually
-- by the migration runner's splitStatements() helper.

-- 1. Add cohort column to User (idempotent via IF NOT EXISTS check)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cohort" TEXT;

CREATE INDEX IF NOT EXISTS "idx_user_cohort"
  ON "User"("cohort")
  WHERE "cohort" IS NOT NULL;

-- 2. Create InviteCode table
CREATE TABLE IF NOT EXISTS "InviteCode" (
  "id"                TEXT PRIMARY KEY,
  "code"              TEXT UNIQUE NOT NULL,
  "cohortId"          TEXT NOT NULL,
  "createdBy"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "maxUses"           INTEGER NOT NULL DEFAULT 1,
  "usedCount"         INTEGER NOT NULL DEFAULT 0,
  "claimedByUserIds"  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "expiresAt"         TIMESTAMPTZ,
  "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitecode_code"
  ON "InviteCode"("code");
CREATE INDEX IF NOT EXISTS "idx_invitecode_cohort"
  ON "InviteCode"("cohortId");
