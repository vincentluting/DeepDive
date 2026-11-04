-- Migration 009: Add exploration progress JSONB to QuestionnaireSession
-- Stores per-zone timeline data: timestamps, time spent, discovery events
-- Enables thesis-grade analytics and future Ultra-Deep cross-session tracking

ALTER TABLE "QuestionnaireSession"
  ADD COLUMN IF NOT EXISTS "explorationProgressJson" JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN "QuestionnaireSession"."explorationProgressJson"
  IS 'Per-zone timeline: { zoneId: { startedAt, completedAt, timeSpentMs, discoveries[] } }';
