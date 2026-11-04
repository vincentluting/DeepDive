-- Migration 050: User onboarding tracking
-- Phase 3 — tracks whether new users have completed onboarding

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMPTZ;
