-- Migration 055: Add coach persona preferences to User table
-- Stores user's preferred coaching style (auto-configured from assessment + user-adjustable)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachPersona" JSONB;

COMMENT ON COLUMN "User"."coachPersona" IS 'Coach persona preferences: coachingStyle, communicationStyle, responseDetail, autoConfigured';
