-- Migration 024: ComparisonInvite table for peer comparison sharing
-- Allows users to invite friends to compare assessment results

CREATE TABLE IF NOT EXISTS "ComparisonInvite" (
  "id"                TEXT PRIMARY KEY,
  "inviterUserId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "acceptedByUserId"  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "status"            TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'accepted', 'expired', 'cancelled')),
  "locale"            TEXT NOT NULL DEFAULT 'en',
  "customMessage"     TEXT,
  "expiresAt"         TIMESTAMPTZ NOT NULL,
  "acceptedAt"        TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_comparison_invite_inviter" ON "ComparisonInvite"("inviterUserId");
CREATE INDEX IF NOT EXISTS "idx_comparison_invite_accepted" ON "ComparisonInvite"("acceptedByUserId");
CREATE INDEX IF NOT EXISTS "idx_comparison_invite_status" ON "ComparisonInvite"("status") WHERE "status" = 'pending';
