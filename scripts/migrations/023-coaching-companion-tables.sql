-- ============================================================
-- Migration 023: Coaching Companion Core Tables
--
-- Creates the Coaching Companion (陪跑系统) tables.
-- Depends on: migration 022 (Action Hub tables)
--
-- Tables: CoachingProgram, DailyEntry, GraduationReport
-- Alterations: CoachingSession (add programId, sessionType)
-- ============================================================


-- 1. CoachingProgram — structured coaching plans (7/30/90 day)
-- Each user can have multiple programs, but only one active at a time
CREATE TABLE IF NOT EXISTS "CoachingProgram" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reportId"    TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "planId"      TEXT REFERENCES "ActionPlan"("id") ON DELETE SET NULL,

  -- Program type
  "programType" TEXT NOT NULL
    CHECK ("programType" IN ('sprint_7', 'deep_30', 'voyage_90', 'ongoing')),

  -- Tier (for future payment gating — all return true for now)
  "tier"        TEXT NOT NULL DEFAULT 'paid'
    CHECK ("tier" IN ('free', 'paid', 'premium')),

  -- Status
  "status"      TEXT NOT NULL DEFAULT 'active'
    CHECK ("status" IN ('active', 'paused', 'completed', 'abandoned', 'graduated')),

  -- Time tracking
  "startDate"       DATE NOT NULL DEFAULT CURRENT_DATE,
  "expectedEndDate" DATE NOT NULL,
  "actualEndDate"   DATE,
  "pausedAt"        TIMESTAMPTZ,
  "pausedDays"      INTEGER NOT NULL DEFAULT 0,

  -- Progress
  "currentDay"     INTEGER NOT NULL DEFAULT 1,
  "totalDays"      INTEGER NOT NULL,
  "currentPhase"   INTEGER NOT NULL DEFAULT 1,

  -- Personalization config (set at creation, adaptively adjusted)
  "configJson"     JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "intensityLevel": "normal",          // "gentle" | "normal" | "intensive"
  --   "focusDirections": ["UX Researcher"],
  --   "weekdayMinutes": 10,
  --   "weekendMinutes": 30,
  --   "skipWeekends": false,
  --   "adaptiveAdjustments": []
  -- }

  -- Aggregated stats (denormalized for dashboard queries)
  "streakDays"              INTEGER NOT NULL DEFAULT 0,
  "longestStreak"           INTEGER NOT NULL DEFAULT 0,
  "completedActions"        INTEGER NOT NULL DEFAULT 0,
  "totalEngagementMinutes"  INTEGER NOT NULL DEFAULT 0,

  "locale"    TEXT NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_coaching_program_user"
  ON "CoachingProgram"("userId");
CREATE INDEX IF NOT EXISTS "idx_coaching_program_user_status"
  ON "CoachingProgram"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_coaching_program_active"
  ON "CoachingProgram"("status") WHERE "status" = 'active';


-- 2. DailyEntry — one record per day per program (atomic daily unit)
CREATE TABLE IF NOT EXISTS "DailyEntry" (
  "id"          TEXT PRIMARY KEY,
  "programId"   TEXT NOT NULL REFERENCES "CoachingProgram"("id") ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,

  -- Date and program day
  "entryDate"   DATE NOT NULL,
  "programDay"  INTEGER NOT NULL,
  "dayTheme"    TEXT NOT NULL,

  -- Morning briefing
  "briefingGeneratedAt" TIMESTAMPTZ,
  "briefingContent"     JSONB,
  -- {
  --   "greeting": "早安，拓路者。",
  --   "insight": "...",
  --   "todayAction": { "title", "description", "category", "estimatedMinutes" },
  --   "encouragement": "...",
  --   "streakMessage": "连续第5天"
  -- }
  "briefingViewedAt"    TIMESTAMPTZ,

  -- Micro action
  "microActionType"        TEXT,
  "microActionIntensity"   TEXT
    CHECK ("microActionIntensity" IN ('passive', 'active', 'social', 'creative')),
  "microActionStartedAt"   TIMESTAMPTZ,
  "microActionCompletedAt" TIMESTAMPTZ,
  "microActionSkipped"     BOOLEAN DEFAULT FALSE,
  "microActionNote"        TEXT,

  -- Optional link to Action Hub ActionItem
  "actionItemId" TEXT REFERENCES "ActionItem"("id") ON DELETE SET NULL,

  -- Evening reflection
  "reflectionCompletedAt"       TIMESTAMPTZ,
  "reflectionFeedback"          TEXT
    CHECK ("reflectionFeedback" IN ('easy', 'challenging_done', 'hard_persisted', 'not_done')),
  "reflectionText"              TEXT,
  "reflectionCoachResponse"     TEXT,
  "reflectionCoachResponseAt"   TIMESTAMPTZ,

  -- Adaptive signals (computed)
  "engagementScore" INTEGER,
  "moodSignal"      TEXT
    CHECK ("moodSignal" IN ('positive', 'neutral', 'struggling', 'excited')),

  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE("programId", "entryDate")
);

CREATE INDEX IF NOT EXISTS "idx_daily_entry_user_date"
  ON "DailyEntry"("userId", "entryDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_daily_entry_program"
  ON "DailyEntry"("programId", "programDay");


-- 3. GraduationReport — generated when a program is completed/graduated
CREATE TABLE IF NOT EXISTS "GraduationReport" (
  "id"          TEXT PRIMARY KEY,
  "programId"   TEXT NOT NULL REFERENCES "CoachingProgram"("id") ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,

  "reportJson"  JSONB NOT NULL,
  -- {
  --   "summary": { "zh": "...", "en": "..." },
  --   "keyDiscoveries": [{ "title", "description", "relatedDimension", "dayDiscovered" }],
  --   "growthMetrics": {
  --     "actionsCompleted", "reflectionsWritten", "networkingContacts",
  --     "totalEngagementMinutes", "longestStreak", "depthGained",
  --     "explorationDepthBefore", "explorationDepthAfter"
  --   },
  --   "nextSteps": [{ "title", "description", "priority" }],
  --   "coachFinalMessage": "..."
  -- }

  "locale"      TEXT NOT NULL DEFAULT 'en',
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_graduation_user"
  ON "GraduationReport"("userId");
CREATE INDEX IF NOT EXISTS "idx_graduation_program"
  ON "GraduationReport"("programId");


-- 4. Extend CoachingSession — link existing coaching sessions to programs
ALTER TABLE "CoachingSession"
  ADD COLUMN IF NOT EXISTS "programId"   TEXT REFERENCES "CoachingProgram"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "sessionType" TEXT DEFAULT 'freeform'
    CHECK ("sessionType" IN ('freeform', 'weekly_review', 'monthly_deep', 'milestone_celebration'));

CREATE INDEX IF NOT EXISTS "idx_coaching_session_program"
  ON "CoachingSession"("programId") WHERE "programId" IS NOT NULL;
