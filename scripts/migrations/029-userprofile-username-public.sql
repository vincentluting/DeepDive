-- Migration 029: Add username and isPublic columns to UserProfile
-- Enables public share pages at /p/{username}

ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "username" VARCHAR(30) UNIQUE;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_userprofile_username" ON "UserProfile" ("username") WHERE "username" IS NOT NULL;
