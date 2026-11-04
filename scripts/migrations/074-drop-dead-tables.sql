-- Migration 074: Drop unused tables and orphan columns from Action Hub / Coaching Companion
--
-- These 7 tables were created in migrations 022-024 but never wired into
-- application code (no lib/db/*.ts references, no API routes). They are
-- absent from schema.sql. Dropping them to keep the production DB clean.
--
-- Also cleans up CoachingSession.programId — an orphan column added by
-- migration 023 that referenced the now-dropped CoachingProgram table.
-- No application code reads or writes this column.
--
-- Tables removed:
--   ComparisonInvite  (024)
--   ComparisonRequest (022)
--   ProgressSnapshot  (022)
--   ToolkitUsage      (022)
--   GraduationReport  (023)
--   DailyEntry        (023) — FK refs CoachingProgram
--   CoachingProgram   (023) — referenced by DailyEntry, GraduationReport
--
-- Columns removed:
--   CoachingSession.programId (023) — orphan FK, target table dropped
--
-- Drop order respects FK dependencies (children first, then parent).

-- 1. Drop orphan column (must happen before dropping target table if FK exists)
ALTER TABLE "CoachingSession" DROP COLUMN IF EXISTS "programId";

-- 2. Drop dead tables
DROP TABLE IF EXISTS "ComparisonInvite";
DROP TABLE IF EXISTS "ComparisonRequest";
DROP TABLE IF EXISTS "ProgressSnapshot";
DROP TABLE IF EXISTS "ToolkitUsage";
DROP TABLE IF EXISTS "GraduationReport";
DROP TABLE IF EXISTS "DailyEntry";
DROP TABLE IF EXISTS "CoachingProgram";
