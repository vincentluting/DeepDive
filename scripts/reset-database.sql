-- ============================================================
-- Deep Dive — Database Reset Script (V1 Consolidated)
-- For use in Neon SQL Editor or any PostgreSQL client
--
-- This file contains TWO sections:
--   Section A: TRUNCATE only — clears all data, keeps schemas + seed data
--   Section B: DROP ALL — destroys tables entirely (requires re-creation)
--
-- Usage:
--   1. For data-only reset: Run Section A
--   2. For full reset: Run Section B, then run schema.sql
-- ============================================================


-- ============================================================
-- SECTION A: Clear All Data (TRUNCATE)
-- Preserves table schemas.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- Report & profile tables (children first)
TRUNCATE TABLE "PersonalProfile" CASCADE;
TRUNCATE TABLE "CareerReport" CASCADE;
TRUNCATE TABLE "RealConditions" CASCADE;

-- Assessment tables
TRUNCATE TABLE "AssessmentResult" CASCADE;
TRUNCATE TABLE "QuestionnaireSession" CASCADE;
TRUNCATE TABLE "QuickDiveResult" CASCADE;

-- Platform tables
TRUNCATE TABLE "CoachingSession" CASCADE;
TRUNCATE TABLE "UserMemory" CASCADE;

-- Feedback & analytics tables
TRUNCATE TABLE "ReportNPS" CASCADE;
TRUNCATE TABLE "ReportReaction" CASCADE;
TRUNCATE TABLE "UserFunnel" CASCADE;
TRUNCATE TABLE "PageVisit" CASCADE;
TRUNCATE TABLE "NotableVisitor" CASCADE;

-- Core tables
TRUNCATE TABLE "UserProfile" CASCADE;
TRUNCATE TABLE "UserSession" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- Verify all user data tables are empty
SELECT 'PersonalProfile' AS "table", COUNT(*) AS "rows" FROM "PersonalProfile"
UNION ALL SELECT 'CareerReport', COUNT(*) FROM "CareerReport"
UNION ALL SELECT 'RealConditions', COUNT(*) FROM "RealConditions"
UNION ALL SELECT 'AssessmentResult', COUNT(*) FROM "AssessmentResult"
UNION ALL SELECT 'QuestionnaireSession', COUNT(*) FROM "QuestionnaireSession"
UNION ALL SELECT 'QuickDiveResult', COUNT(*) FROM "QuickDiveResult"
UNION ALL SELECT 'CoachingSession', COUNT(*) FROM "CoachingSession"
UNION ALL SELECT 'UserMemory', COUNT(*) FROM "UserMemory"
UNION ALL SELECT 'ReportNPS', COUNT(*) FROM "ReportNPS"
UNION ALL SELECT 'ReportReaction', COUNT(*) FROM "ReportReaction"
UNION ALL SELECT 'UserProfile', COUNT(*) FROM "UserProfile"
UNION ALL SELECT 'UserSession', COUNT(*) FROM "UserSession"
UNION ALL SELECT 'User', COUNT(*) FROM "User"
ORDER BY "table";
-- All rows should show 0


-- ============================================================
-- SECTION B: DROP ALL TABLES (Full Reset)
-- Destroys all table schemas and data.
-- After running this, execute schema.sql to rebuild.
-- ============================================================

-- Uncomment the lines below to execute:

-- Report & profile tables
-- DROP TABLE IF EXISTS "PersonalProfile" CASCADE;
-- DROP TABLE IF EXISTS "CareerReport" CASCADE;
-- DROP TABLE IF EXISTS "RealConditions" CASCADE;

-- Assessment tables
-- DROP TABLE IF EXISTS "AssessmentResult" CASCADE;
-- DROP TABLE IF EXISTS "QuestionnaireSession" CASCADE;
-- DROP TABLE IF EXISTS "QuickDiveResult" CASCADE;

-- Platform tables
-- DROP TABLE IF EXISTS "CoachingSession" CASCADE;
-- DROP TABLE IF EXISTS "UserMemory" CASCADE;

-- Feedback & analytics
-- DROP TABLE IF EXISTS "ReportNPS" CASCADE;
-- DROP TABLE IF EXISTS "ReportReaction" CASCADE;
-- DROP TABLE IF EXISTS "ReportEngagement" CASCADE;
-- DROP TABLE IF EXISTS "CoachingFeedback" CASCADE;
-- DROP TABLE IF EXISTS "CDSEResponse" CASCADE;
-- DROP TABLE IF EXISTS "UserDeletionRequest" CASCADE;
-- DROP TABLE IF EXISTS "UserFunnel" CASCADE;
-- DROP TABLE IF EXISTS "PageVisit" CASCADE;
-- DROP TABLE IF EXISTS "NotableVisitor" CASCADE;

-- Core tables
-- DROP TABLE IF EXISTS "UserProfile" CASCADE;
-- DROP TABLE IF EXISTS "UserSession" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;

-- Verify: should return empty result
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- ============================================================
-- Rebuild steps (after Section B):
-- 1. Run scripts/schema.sql to recreate all tables + seed data
-- 2. Or call POST /api/init-db (with AUTH_SECRET token)
-- ============================================================
