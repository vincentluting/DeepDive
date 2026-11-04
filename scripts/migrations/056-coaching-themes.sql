-- Migration 056: Coaching themes table for longitudinal memory
-- Tracks recurring topics, contradictions, and growth patterns across coaching sessions

CREATE TABLE IF NOT EXISTS "CoachingTheme" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "theme"         TEXT NOT NULL,
  "context"       TEXT,
  "sentiment"     TEXT CHECK ("sentiment" IN ('positive', 'negative', 'neutral', 'conflicted')),
  "mentionCount"  INTEGER NOT NULL DEFAULT 1,
  "firstMentionedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastMentionedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolved"      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_coaching_theme_user ON "CoachingTheme" ("userId");
CREATE INDEX IF NOT EXISTS idx_coaching_theme_user_active ON "CoachingTheme" ("userId", "resolved") WHERE "resolved" = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_coaching_theme_user_theme ON "CoachingTheme" ("userId", "theme");
