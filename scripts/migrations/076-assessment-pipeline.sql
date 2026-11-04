-- Migration 076: AssessmentPipeline — server-orchestrated idempotent pipeline
-- for the "Deep Dive complete → scoring → profile → narratives → report" chain.
--
-- Problem: Client-driven synchronous chain (finalizeAndNavigate) silently fails
-- when any step errors. afterProfileGenerated() catch-swallow leaves journeyState
-- out of sync with PersonalProfile existence, so /profile/[id] hard-redirects
-- to /dashboard and report is never auto-triggered. Confirmed in production:
-- 4 users stuck at deep_dive_complete with a valid PersonalProfile and no report.
--
-- Solution: a single-source-of-truth table tracking the 4 pipeline steps with
-- idempotent per-step status, plus a worker lock for Vercel cron concurrency.
--
-- Business flow: scoring + profile + narratives auto-run in background (cron).
-- reportStatus starts as 'not_requested' — user triggers report generation
-- from the profile page by clicking "View Deep Dive Report".

CREATE TABLE IF NOT EXISTS "AssessmentPipeline" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assessmentId"    TEXT NOT NULL UNIQUE,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sessionId"       TEXT NOT NULL,
  "locale"          TEXT NOT NULL DEFAULT 'en',

  -- Per-step status
  "scoringStatus"    TEXT NOT NULL DEFAULT 'pending',
  "profileStatus"    TEXT NOT NULL DEFAULT 'pending',
  "narrativesStatus" TEXT NOT NULL DEFAULT 'pending',
  "reportStatus"     TEXT NOT NULL DEFAULT 'not_requested',

  -- User-initiated report request
  "reportRequestedAt" TIMESTAMPTZ,

  -- Overall pipeline status (derived but denormalized for cheap indexed lookup)
  "status"          TEXT NOT NULL DEFAULT 'pending',

  -- Retry bookkeeping
  "retryCount"      INT NOT NULL DEFAULT 0,
  "lastError"       TEXT,
  "lastStepError"   TEXT,
  "lastAttemptAt"   TIMESTAMPTZ,

  -- Worker concurrency control
  "workerLock"      TEXT,
  "workerLockAt"    TIMESTAMPTZ,

  "startedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"     TIMESTAMPTZ,
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "ap_scoring_status_valid"    CHECK ("scoringStatus"    IN ('pending','running','done','failed')),
  CONSTRAINT "ap_profile_status_valid"    CHECK ("profileStatus"    IN ('pending','running','done','failed')),
  CONSTRAINT "ap_narratives_status_valid" CHECK ("narrativesStatus" IN ('pending','running','done','failed')),
  CONSTRAINT "ap_report_status_valid"     CHECK ("reportStatus"     IN ('not_requested','pending','running','done','failed')),
  CONSTRAINT "ap_status_valid"            CHECK ("status"           IN ('pending','running','auto_done','completed','failed'))
);

-- Worker query: find rows that need advancement. Excludes terminal states.
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_workable_idx"
  ON "AssessmentPipeline" ("status", "lastAttemptAt")
  WHERE "status" IN ('pending','running');

-- User lookup
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_user_idx"
  ON "AssessmentPipeline" ("userId", "startedAt" DESC);

-- Worker lock cleanup
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_workerlock_idx"
  ON "AssessmentPipeline" ("workerLockAt")
  WHERE "workerLock" IS NOT NULL;
