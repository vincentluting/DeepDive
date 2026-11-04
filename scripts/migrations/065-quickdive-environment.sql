-- 065: Add environment column to QuickDiveResult
-- Automatically distinguishes dev/test data from production data

ALTER TABLE "QuickDiveResult"
  ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'production';
