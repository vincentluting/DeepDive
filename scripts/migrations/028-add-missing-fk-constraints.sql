-- Migration 028: Add missing FK constraints for data integrity
-- Purpose: Prevent orphaned records when parent rows are deleted.
--
-- 1. PersonalProfile.assessmentId → AssessmentResult(id) ON DELETE CASCADE
-- 2. CoachingSession.reportId → CareerReport(id) ON DELETE SET NULL
-- 3. ReportEngagement.reportId → CareerReport(id) ON DELETE CASCADE
--
-- Pre-check (run first to confirm no orphans):
--   SELECT pp."id" FROM "PersonalProfile" pp LEFT JOIN "AssessmentResult" ar ON pp."assessmentId" = ar."id" WHERE ar."id" IS NULL;
--   SELECT cs."id" FROM "CoachingSession" cs LEFT JOIN "CareerReport" cr ON cs."reportId" = cr."id" WHERE cs."reportId" IS NOT NULL AND cr."id" IS NULL;
--   SELECT re."id" FROM "ReportEngagement" re LEFT JOIN "CareerReport" cr ON re."reportId" = cr."id" WHERE cr."id" IS NULL;

-- Clean orphaned records before adding FK constraints
DELETE FROM "PersonalProfile" WHERE "assessmentId" NOT IN (SELECT "id" FROM "AssessmentResult");
DELETE FROM "CoachingSession" WHERE "reportId" IS NOT NULL AND "reportId" NOT IN (SELECT "id" FROM "CareerReport");
DELETE FROM "ReportEngagement" WHERE "reportId" NOT IN (SELECT "id" FROM "CareerReport");

-- 1. PersonalProfile.assessmentId FK
ALTER TABLE "PersonalProfile"
  ADD CONSTRAINT fk_personalprofile_assessment
  FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE;

-- 2. CoachingSession.reportId FK + index
ALTER TABLE "CoachingSession"
  ADD CONSTRAINT fk_coachingsession_report
  FOREIGN KEY ("reportId") REFERENCES "CareerReport"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_coaching_report ON "CoachingSession"("reportId") WHERE "reportId" IS NOT NULL;

-- 3. ReportEngagement.reportId FK
ALTER TABLE "ReportEngagement"
  ADD CONSTRAINT fk_reportengagement_report
  FOREIGN KEY ("reportId") REFERENCES "CareerReport"("id") ON DELETE CASCADE;
