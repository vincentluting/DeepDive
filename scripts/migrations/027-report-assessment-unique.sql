-- Migration 027: Add UNIQUE constraint on CareerReport.assessmentId
-- Purpose: DB-level dedup for report generation across serverless instances.
-- Prevents duplicate reports when concurrent requests race past the in-memory lock.
--
-- Pre-requisite: No duplicate assessmentId rows in CareerReport.
-- Verify: SELECT "assessmentId", COUNT(*) FROM "CareerReport" GROUP BY "assessmentId" HAVING COUNT(*) > 1;

-- Drop the existing non-unique index and replace with a unique one
DROP INDEX IF EXISTS idx_report_assessment;
CREATE UNIQUE INDEX idx_report_assessment ON "CareerReport"("assessmentId");
