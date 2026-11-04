-- Migration 034: Add exercisesJson to PersonalProfile
-- Stores structured exercise results (e.g. Non-Negotiables)
-- as JSONB alongside the profile data.

ALTER TABLE "PersonalProfile"
  ADD COLUMN IF NOT EXISTS "exercisesJson" JSONB NOT NULL DEFAULT '{}';

-- Example exercisesJson structure:
-- {
--   "nonNegotiables": {
--     "selected": ["remote_work", "min_salary", "meaningful_work"],
--     "completedAt": "2026-03-11T10:00:00Z"
--   }
-- }
