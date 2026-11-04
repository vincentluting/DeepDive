-- Migration 047: Add researchGroup column to InviteCode
-- Allows pre-assigning research groups (classic/immersive) at invite code level
-- instead of random assignment at registration time.

ALTER TABLE "InviteCode"
  ADD COLUMN IF NOT EXISTS "researchGroup" TEXT CHECK ("researchGroup" IN ('classic', 'immersive'));
