-- Migration 025: Performance indexes for companion tables
-- Optimizes common query patterns in coaching companion and action hub

-- DailyEntry: frequently queried by programId + date for "today's entry"
CREATE INDEX IF NOT EXISTS "idx_daily_entry_program_date"
  ON "DailyEntry"("programId", "entryDate" DESC);

-- DailyEntry: mood signal queries for adaptive engine
CREATE INDEX IF NOT EXISTS "idx_daily_entry_mood"
  ON "DailyEntry"("programId", "moodSignal")
  WHERE "moodSignal" IS NOT NULL;

-- UserMemory: active memories sorted by confidence (memory evolution)
CREATE INDEX IF NOT EXISTS "idx_memory_active_confidence"
  ON "UserMemory"("userId", "confidence" DESC)
  WHERE "isActive" = TRUE;

-- UserMemory: stale memory cleanup (decay check)
CREATE INDEX IF NOT EXISTS "idx_memory_decay_check"
  ON "UserMemory"("userId", "updatedAt")
  WHERE "isActive" = TRUE;

-- ActionPlan: active plan lookup per user
CREATE INDEX IF NOT EXISTS "idx_action_plan_user_active"
  ON "ActionPlan"("userId", "status")
  WHERE "status" = 'active';

-- ActionItem: items by plan, sorted by priority
CREATE INDEX IF NOT EXISTS "idx_action_item_plan_priority"
  ON "ActionItem"("planId", "priority" DESC)
  WHERE "status" != 'completed';

-- CoachingProgram: lookup by reportId (used in graduation)
CREATE INDEX IF NOT EXISTS "idx_coaching_program_report"
  ON "CoachingProgram"("reportId")
  WHERE "reportId" IS NOT NULL;

-- CoachingSession: sessions linked to companion programs
CREATE INDEX IF NOT EXISTS "idx_coaching_session_program"
  ON "CoachingSession"("programId")
  WHERE "programId" IS NOT NULL;
