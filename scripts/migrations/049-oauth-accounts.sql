-- Migration 049: OAuth accounts + passwordHash nullable
-- Phase 2 of auth system — supports Google + Apple social login

-- Allow OAuth-only users who have no password
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- OAuthAccount — links external OAuth identities to User
CREATE TABLE IF NOT EXISTS "OAuthAccount" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider"          TEXT NOT NULL CHECK ("provider" IN ('google', 'apple')),
  "providerAccountId" TEXT NOT NULL,
  "email"             TEXT,
  "name"              TEXT,
  "avatarUrl"         TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_oauth_provider_account"
  ON "OAuthAccount"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "idx_oauth_user"
  ON "OAuthAccount"("userId");
