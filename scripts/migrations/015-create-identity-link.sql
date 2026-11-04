-- ============================================================
-- 015: Create IdentityLink table for anonymous-to-user identity resolution
--
-- Links anonymous visitor IDs to registered user accounts.
-- Enables backfilling of anonymous activity (Quick Dive, funnel events)
-- to a user after registration or login.
-- ============================================================

-- Migration: Create IdentityLink table for anonymous-to-user identity resolution

CREATE TABLE IF NOT EXISTS "IdentityLink" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "anonymousId" TEXT NOT NULL,
  "linkedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source"      TEXT NOT NULL DEFAULT 'registration'
    CHECK ("source" IN ('registration', 'login', 'manual', 'backfill'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_link_unique
  ON "IdentityLink"("userId", "anonymousId");
CREATE INDEX IF NOT EXISTS idx_identity_anon
  ON "IdentityLink"("anonymousId");
CREATE INDEX IF NOT EXISTS idx_identity_user
  ON "IdentityLink"("userId");
