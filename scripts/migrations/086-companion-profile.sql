-- Migration 086 — CompanionProfile (public-facing companion identity)
--
-- Decoupled from PersonalProfile so RealConditions (sensitive demographics)
-- and report narrative content can never leak into discovery responses.
-- Only fields the user has explicitly chosen to expose live here.
--
-- visibility:
--   discoverable — surfaces in /companions Top-N list
--   friends_only — hidden from discovery, accepted friends still see it
--   hidden       — fully invisible (set when user toggles socialEnabled = false)

CREATE TABLE IF NOT EXISTS "CompanionProfile" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "displayName"   TEXT NOT NULL,
  "bio"           TEXT,
  "archetypeCode" TEXT NOT NULL,
  "scoresJson"    JSONB NOT NULL,
  "locale"        TEXT NOT NULL DEFAULT 'en' CHECK ("locale" IN ('en', 'zh')),
  "visibility"    TEXT NOT NULL DEFAULT 'discoverable'
                  CHECK ("visibility" IN ('discoverable', 'friends_only', 'hidden')),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_profile_bio_length" CHECK (char_length("bio") <= 200),
  CONSTRAINT "companion_profile_displayname_length"
    CHECK (char_length("displayName") BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS "idx_companion_profile_discoverable"
  ON "CompanionProfile"("archetypeCode")
  WHERE "visibility" = 'discoverable';
