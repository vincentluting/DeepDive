-- ============================================================
-- Migration 007: Full-Stack Audit Cleanup
-- Date: 2026-02-26
--
-- Changes:
--   1. DROP 5 deprecated tables (DailyQuestion, DailyQuestionResponse,
--      DiaryEntry, JobApplication, CoachingTrigger)
--   2. DROP 5 deprecated columns from UserProgress
--   3. ADD lastActiveAt column to QuestionnaireSession (missing from DB)
--
-- Pre-requisites:
--   - Verify no active code references deprecated tables (audit confirmed: zero)
--   - Verify deprecated tables have no important data (audit confirmed:
--     only DailyQuestion has 10 seed rows, all others empty)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Drop deprecated tables
--    Order: children first (FK dependencies), then parents
-- ============================================================

-- DailyQuestionResponse depends on DailyQuestion and User
DROP TABLE IF EXISTS "DailyQuestionResponse" CASCADE;

-- DailyQuestion (10 seed rows — deprecated feature, safe to remove)
DROP TABLE IF EXISTS "DailyQuestion" CASCADE;

-- DiaryEntry depends on User (0 rows)
DROP TABLE IF EXISTS "DiaryEntry" CASCADE;

-- JobApplication depends on User (0 rows)
DROP TABLE IF EXISTS "JobApplication" CASCADE;

-- CoachingTrigger depends on User (0 rows)
DROP TABLE IF EXISTS "CoachingTrigger" CASCADE;

-- ============================================================
-- 2. Drop deprecated columns from UserProgress
-- ============================================================

ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "dailyQuestionsCompleted";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "diaryEntriesWritten";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "jobApplicationsCount";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "currentStreak";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "longestStreak";

-- ============================================================
-- 3. Add missing lastActiveAt column to QuestionnaireSession
--    (defined in canonical schema but never applied to DB)
-- ============================================================

ALTER TABLE "QuestionnaireSession"
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMPTZ;

COMMIT;

-- ============================================================
-- Verification queries (run after migration)
-- ============================================================

-- Should return exactly 20 tables (was 25 before migration)
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- UserProgress should no longer have deprecated columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'UserProgress' AND table_schema = 'public'
ORDER BY ordinal_position;

-- QuestionnaireSession should now have lastActiveAt
SELECT column_name FROM information_schema.columns
WHERE table_name = 'QuestionnaireSession' AND table_schema = 'public'
ORDER BY ordinal_position;
