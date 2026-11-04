-- Migration 085 — User.socialEnabled flag for Archetype Companion
--
-- Per-user opt-in to the social discovery feature. Combined with
-- entitlements.socialFeatures (cohort-level), this gives the two-layer
-- gate the Companion plan calls for: cohort says "you may", user says
-- "I do". Both must be true to enter the discovery surface.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "socialEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
