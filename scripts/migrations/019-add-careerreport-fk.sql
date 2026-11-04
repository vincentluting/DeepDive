-- Migration 019: Add FK constraint on CareerReport.assessmentId
--
-- Problem: CareerReport.assessmentId is a bare TEXT column with no FK.
-- If an AssessmentResult is deleted (GDPR, admin cleanup), the report
-- becomes an orphan with a dangling assessmentId, causing load errors.
--
-- Fix: Add FK with ON DELETE CASCADE so reports are automatically
-- cleaned up when their parent assessment is deleted.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_careerreport_assessment'
  ) THEN
    ALTER TABLE "CareerReport"
      ADD CONSTRAINT fk_careerreport_assessment
      FOREIGN KEY ("assessmentId") REFERENCES "AssessmentResult"("id")
      ON DELETE CASCADE;
  END IF;
END
$$;
