-- Migration 043: Achievement system
-- Adds UserAchievement table for tracking unlocked achievements per user.

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "achievementKey"  TEXT NOT NULL,
  "unlockedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata"        JSONB DEFAULT '{}',
  UNIQUE("userId", "achievementKey")
);

CREATE INDEX IF NOT EXISTS idx_achievement_user ON "UserAchievement"("userId");
CREATE INDEX IF NOT EXISTS idx_achievement_key ON "UserAchievement"("achievementKey");
