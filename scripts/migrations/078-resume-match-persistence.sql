-- Migration 078: Resume as persisted "Career Evidence" + supersedable reports
--
-- Architecture shift: resume upload moves from the Deep Dive submission flow
-- into a dedicated "Enhanced mode" gate before Report generation, triggered
-- from the Profile page. To support this UX the backend needs:
--
--   1) A persistent home for parsed/matched resume data (was Zustand-only).
--      The table is designed to generalise to other career-evidence sources
--      (linkedin, portfolio, …) — hence `sourceType` and the broader naming.
--
--   2) Soft-delete on CareerReport so a user who uploads a resume AFTER
--      their first report can trigger a regenerate without losing the
--      previous snapshot (research provenance + audit trail).
--
--   3) Pipeline step status for resume analysis (independent, non-blocking).
--
--   4) An A/B marker on AssessmentResult so thesis analysis can split
--      the dataset into "pre flow-change" (v1-inline) and "post" (v2-dialog).
--      Historical rows are backfilled to v1-inline.
--
-- Rollback strategy: all changes are additive; drop the new table + columns
-- to revert. The partial unique index on CareerReport preserves the original
-- one-report-per-assessment constraint for non-superseded rows.

-- ------------------------------------------------------------
-- 1. ResumeMatchResult — persisted career evidence
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "ResumeMatchResult" (
  "id"              TEXT PRIMARY KEY,
  "assessmentId"    TEXT NOT NULL REFERENCES "AssessmentResult"("id") ON DELETE CASCADE,
  "userId"          TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "sourceType"      TEXT NOT NULL DEFAULT 'resume',
  "fileName"        TEXT,
  "fileType"        TEXT,
  "resumeDataJson"  JSONB NOT NULL,
  "matchResultJson" JSONB NOT NULL,
  "flowVersion"     TEXT NOT NULL DEFAULT 'v2-dialog',
  "supersededAt"    TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "rmr_source_type_valid" CHECK ("sourceType" IN ('resume','linkedin','portfolio'))
);

-- Only ONE active (non-superseded) evidence row per assessment.
CREATE UNIQUE INDEX IF NOT EXISTS "ResumeMatchResult_assessment_active_idx"
  ON "ResumeMatchResult" ("assessmentId")
  WHERE "supersededAt" IS NULL;

CREATE INDEX IF NOT EXISTS "ResumeMatchResult_user_idx"
  ON "ResumeMatchResult" ("userId");

CREATE INDEX IF NOT EXISTS "ResumeMatchResult_assessment_history_idx"
  ON "ResumeMatchResult" ("assessmentId", "createdAt" DESC);

-- ------------------------------------------------------------
-- 2. CareerReport — soft-delete via supersededAt
-- ------------------------------------------------------------

ALTER TABLE "CareerReport"
  ADD COLUMN IF NOT EXISTS "supersededAt" TIMESTAMPTZ;

-- Replace the unconditional unique index with a partial unique index so
-- older (superseded) reports can coexist with the current active one.
DROP INDEX IF EXISTS idx_report_assessment;

CREATE UNIQUE INDEX IF NOT EXISTS "CareerReport_assessment_active_idx"
  ON "CareerReport" ("assessmentId")
  WHERE "supersededAt" IS NULL;

CREATE INDEX IF NOT EXISTS "CareerReport_assessment_history_idx"
  ON "CareerReport" ("assessmentId", "createdAt" DESC);

-- ------------------------------------------------------------
-- 3. AssessmentPipeline — resume analysis step
-- ------------------------------------------------------------

ALTER TABLE "AssessmentPipeline"
  ADD COLUMN IF NOT EXISTS "resumeAnalysisStatus" TEXT NOT NULL DEFAULT 'not_requested';

ALTER TABLE "AssessmentPipeline"
  DROP CONSTRAINT IF EXISTS "ap_resume_analysis_status_valid";

ALTER TABLE "AssessmentPipeline"
  ADD CONSTRAINT "ap_resume_analysis_status_valid"
    CHECK ("resumeAnalysisStatus" IN ('not_requested','pending','running','done','failed','skipped'));

-- ------------------------------------------------------------
-- 4. AssessmentResult — flowVersion A/B marker for thesis analysis
-- ------------------------------------------------------------

ALTER TABLE "AssessmentResult"
  ADD COLUMN IF NOT EXISTS "resumeFlowVersion" TEXT NOT NULL DEFAULT 'v2-dialog';

-- Backfill: every assessment created BEFORE this migration ran used the
-- old inline-in-questionnaire flow. Mark them as 'v1-inline'.
UPDATE "AssessmentResult"
  SET "resumeFlowVersion" = 'v1-inline'
  WHERE "createdAt" < NOW();

ALTER TABLE "AssessmentResult"
  DROP CONSTRAINT IF EXISTS "ar_resume_flow_version_valid";

ALTER TABLE "AssessmentResult"
  ADD CONSTRAINT "ar_resume_flow_version_valid"
    CHECK ("resumeFlowVersion" IN ('v1-inline','v2-dialog'));
