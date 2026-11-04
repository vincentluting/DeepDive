-- 062: Add mode column to CoachingSession
-- Was defined in schema.sql but missing from live database
-- Fixes: admin user-journey API 500 error (column "mode" does not exist)

ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'report-qa';
