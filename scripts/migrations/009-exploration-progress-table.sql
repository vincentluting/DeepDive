-- ============================================================
-- 009: Add UserExplorationProgress table
--
-- Stores per-user module completion timestamps and computed
-- ocean depth (depthM) for the exploration depth gauge feature.
-- Used by lib/db/exploration-progress.ts and the depth-gauge UI.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "UserExplorationProgress" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE UNIQUE,
  "modulesJson" JSONB NOT NULL DEFAULT '{}',
  "depthM"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_exploration_progress_user"
  ON "UserExplorationProgress"("userId");

COMMIT;
