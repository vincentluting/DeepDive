-- Migration 048: Password reset tokens + email verification
-- Phase 1 of email system — supports forgot-password flow

-- Add emailVerifiedAt to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMPTZ;

-- PasswordResetToken — time-limited tokens for password reset flow
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_prt_token_hash"
  ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "idx_prt_user"
  ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_prt_expires"
  ON "PasswordResetToken"("expiresAt")
  WHERE "usedAt" IS NULL;
