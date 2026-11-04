-- Migration 037: Add UserContext table
-- Stores per-user context as JSONB, keyed by userId (1:1 with User)

-- ── UP ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserContext" (
  "userId"      TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "contextJson" JSONB NOT NULL DEFAULT '{}',
  "version"     INTEGER NOT NULL DEFAULT 1,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOWN ────────────────────────────────────────────────────────

-- DROP TABLE IF EXISTS "UserContext";
