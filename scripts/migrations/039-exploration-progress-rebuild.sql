-- ============================================================
-- 039: Rebuild UserExplorationProgress table
--
-- The table was originally created (via schema-init or migration 005 era)
-- with individual timestamp columns per module. The code was later
-- refactored to use a single JSONB column (modulesJson + depthM),
-- but migration 009 used CREATE TABLE IF NOT EXISTS which was a no-op
-- on the already-existing table, causing "column modulesJson does not
-- exist" errors at runtime.
--
-- Since the product has no real users yet, we drop and recreate cleanly.
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS "UserExplorationProgress";

CREATE TABLE "UserExplorationProgress" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE UNIQUE,
  "modulesJson" JSONB NOT NULL DEFAULT '{}',
  "depthM"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_exploration_progress_user"
  ON "UserExplorationProgress"("userId");

COMMIT;
