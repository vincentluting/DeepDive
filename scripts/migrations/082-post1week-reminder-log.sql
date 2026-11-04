-- Migration 082 — Post-1week reminder idempotency
--
-- One row per research participant once the T2 reminder flow claims them.
-- This prevents the daily cron and the admin-triggered endpoint from sending
-- duplicate reminders to the same participant.

CREATE TABLE IF NOT EXISTS "Post1WeekReminderLog" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "email"           TEXT NOT NULL,
  "locale"          TEXT NOT NULL DEFAULT 'en' CHECK ("locale" IN ('en', 'zh')),
  "postImmediateAt" TIMESTAMPTZ NOT NULL,
  "claimedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sentAt"          TIMESTAMPTZ,
  "sendStatus"      TEXT NOT NULL DEFAULT 'claimed' CHECK ("sendStatus" IN ('claimed', 'sent', 'failed')),
  "error"           TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_post1week_reminder_user"
  ON "Post1WeekReminderLog"("userId");

CREATE INDEX IF NOT EXISTS "idx_post1week_reminder_status"
  ON "Post1WeekReminderLog"("sendStatus", "claimedAt");
