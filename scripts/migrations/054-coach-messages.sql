-- Migration 054: Coach companion messages table
-- Stores proactive messages from the AI coach to users (companion interface)

CREATE TABLE IF NOT EXISTS "CoachMessage" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"        TEXT NOT NULL CHECK ("type" IN ('guide', 'insight', 'nudge', 'welcome')),
  "trigger"     TEXT NOT NULL,
  "content"     JSONB NOT NULL DEFAULT '{}',
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  "actionUrl"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_message_user ON "CoachMessage" ("userId");
CREATE INDEX IF NOT EXISTS idx_coach_message_user_unread ON "CoachMessage" ("userId", "isRead") WHERE "isRead" = FALSE;
CREATE INDEX IF NOT EXISTS idx_coach_message_created ON "CoachMessage" ("createdAt" DESC);
