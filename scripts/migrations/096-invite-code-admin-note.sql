-- Migration 096: Invite code assignment note
-- Admin-only free-text note recording who each invite code is assigned to.
-- Surfaced in the admin Invite Codes tab; not exposed to end users.

ALTER TABLE "InviteCode" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
