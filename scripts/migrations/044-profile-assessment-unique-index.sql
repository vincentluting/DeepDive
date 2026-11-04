-- Migration 044: Add unique index on PersonalProfile.assessmentId
-- Required for ON CONFLICT ("assessmentId") DO UPDATE in saveProfile()
-- Mirrors the existing pattern on CareerReport.assessmentId (idx_report_assessment)

-- ── UP ──────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_assessment ON "PersonalProfile"("assessmentId");

-- ── DOWN ────────────────────────────────────────────────────
-- DROP INDEX IF EXISTS idx_profile_assessment;
