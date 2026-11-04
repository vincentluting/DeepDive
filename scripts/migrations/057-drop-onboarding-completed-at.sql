-- Migration 057: Remove onboardingCompletedAt column from User table
-- The onboarding flow has been removed; this column is no longer used.

-- UP
ALTER TABLE "User" DROP COLUMN IF EXISTS "onboardingCompletedAt";

-- DOWN (rollback)
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMPTZ;
