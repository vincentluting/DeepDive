-- Migration 031: AdminAnswerPreset table
-- Stores admin's real questionnaire answers as reusable test templates.

CREATE TABLE IF NOT EXISTS "AdminAnswerPreset" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name"             VARCHAR(100) NOT NULL DEFAULT 'My Answers',
  "quickDiveAnswers" JSONB,
  "deepDiveAnswers"  JSONB,
  "locale"           VARCHAR(5) NOT NULL DEFAULT 'en',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_admin_preset_user" ON "AdminAnswerPreset"("userId");
