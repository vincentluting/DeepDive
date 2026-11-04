-- ============================================================
-- Migration 022: Action Hub Core Tables
--
-- Creates the Action Hub infrastructure that the Coaching
-- Companion system builds upon.
--
-- Tables: ActionPlan, ActionItem, ActionMilestone,
--         ToolkitUsage, ProgressSnapshot, ComparisonRequest
-- ============================================================


-- 1. ActionPlan — top-level action plan derived from CareerReport
CREATE TABLE IF NOT EXISTS "ActionPlan" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reportId"    TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,

  "status"      TEXT NOT NULL DEFAULT 'active'
    CHECK ("status" IN ('active', 'archived', 'superseded')),

  -- Snapshot of key assessment data at plan creation time
  "contextJson" JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "archetype12": "Pioneer",
  --   "riasecTop3": ["R", "I", "A"],
  --   "schwartzTop3": ["self-direction", "stimulation", "achievement"],
  --   "focusDirections": ["UX Researcher", "Product Manager"],
  --   "careerDrainDomains": ["autonomy", "variety"]
  -- }

  "locale"      TEXT NOT NULL DEFAULT 'en',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_action_plan_user" ON "ActionPlan"("userId");
CREATE INDEX IF NOT EXISTS "idx_action_plan_report" ON "ActionPlan"("reportId");
CREATE INDEX IF NOT EXISTS "idx_action_plan_active" ON "ActionPlan"("status")
  WHERE "status" = 'active';


-- 2. ActionItem — individual action tasks within a plan
CREATE TABLE IF NOT EXISTS "ActionItem" (
  "id"          TEXT PRIMARY KEY,
  "planId"      TEXT NOT NULL REFERENCES "ActionPlan"("id") ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,

  "title"       TEXT NOT NULL,
  "description" TEXT,

  "category"    TEXT NOT NULL
    CHECK ("category" IN (
      'explore', 'learn', 'network', 'create', 'apply', 'reflect'
    )),

  "intensity"   TEXT NOT NULL DEFAULT 'passive'
    CHECK ("intensity" IN ('passive', 'active', 'social', 'creative')),

  "status"      TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'in_progress', 'completed', 'skipped')),

  "priority"    INTEGER NOT NULL DEFAULT 0,
  "estimatedMinutes" INTEGER,

  -- Which assessment dimension this action is derived from
  "sourceDimension" TEXT,
  -- e.g. "riasec:I", "schwartz:self-direction", "career-drain:autonomy"

  "dueDate"     DATE,
  "completedAt" TIMESTAMPTZ,
  "userNote"    TEXT,

  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_action_item_plan" ON "ActionItem"("planId");
CREATE INDEX IF NOT EXISTS "idx_action_item_user" ON "ActionItem"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_action_item_status" ON "ActionItem"("status")
  WHERE "status" IN ('pending', 'in_progress');


-- 3. ActionMilestone — milestone markers within a plan
CREATE TABLE IF NOT EXISTS "ActionMilestone" (
  "id"          TEXT PRIMARY KEY,
  "planId"      TEXT NOT NULL REFERENCES "ActionPlan"("id") ON DELETE CASCADE,

  "title"       TEXT NOT NULL,
  "description" TEXT,
  "targetDay"   INTEGER NOT NULL,

  "status"      TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'reached', 'skipped')),

  "reachedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_milestone_plan" ON "ActionMilestone"("planId");


-- 4. ToolkitUsage — tracks usage of Action Hub tools (resume optimizer, etc.)
CREATE TABLE IF NOT EXISTS "ToolkitUsage" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "planId"      TEXT REFERENCES "ActionPlan"("id") ON DELETE SET NULL,

  "toolType"    TEXT NOT NULL
    CHECK ("toolType" IN (
      'resume_optimize', 'cover_letter', 'interview_prep',
      'elevator_pitch', 'linkedin_optimize', 'networking_script'
    )),

  "inputJson"   JSONB,
  "outputJson"  JSONB,
  "locale"      TEXT NOT NULL DEFAULT 'en',

  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_toolkit_user" ON "ToolkitUsage"("userId");
CREATE INDEX IF NOT EXISTS "idx_toolkit_type" ON "ToolkitUsage"("userId", "toolType");


-- 5. ProgressSnapshot — periodic progress captures
CREATE TABLE IF NOT EXISTS "ProgressSnapshot" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "planId"      TEXT REFERENCES "ActionPlan"("id") ON DELETE SET NULL,

  "snapshotType" TEXT NOT NULL DEFAULT 'weekly'
    CHECK ("snapshotType" IN ('weekly', 'monthly', 'milestone', 'graduation')),

  "metricsJson" JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "actionsCompleted": 5,
  --   "actionsTotal": 8,
  --   "streakDays": 4,
  --   "engagementMinutes": 45,
  --   "explorationDepth": 1800,
  --   "focusDirectionProgress": { "UX Researcher": 0.6, "PM": 0.3 }
  -- }

  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_snapshot_user" ON "ProgressSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "idx_snapshot_plan" ON "ProgressSnapshot"("planId");


-- 6. ComparisonRequest — anonymous peer comparison data
CREATE TABLE IF NOT EXISTS "ComparisonRequest" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,

  "compareType" TEXT NOT NULL
    CHECK ("compareType" IN ('archetype', 'direction', 'values', 'progress')),

  "resultJson"  JSONB,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_comparison_user" ON "ComparisonRequest"("userId");
