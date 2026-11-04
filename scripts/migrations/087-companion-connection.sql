-- Migration 087 — CompanionConnection (friend request / accepted state machine)
--
-- One row per ordered (requester, recipient) pair. Status:
--   pending  — recipient has not yet acted
--   accepted — both sides may now see each other's CompanionProfile
--   declined — recipient declined; the row is kept for rate-limiting
--              repeat requests rather than being deleted
--
-- "Unfriend" is implemented as DELETE in the CRUD layer (no soft-delete in v1).
-- Race protection: two concurrent accept attempts are guarded by both the
-- UNIQUE pair constraint and an UPDATE … WHERE status = 'pending' guard
-- in lib/db/companions.ts.

CREATE TABLE IF NOT EXISTS "CompanionConnection" (
  "id"               TEXT PRIMARY KEY,
  "requesterId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "recipientId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status"           TEXT NOT NULL DEFAULT 'pending'
                     CHECK ("status" IN ('pending', 'accepted', 'declined')),
  "requesterMessage" TEXT,
  "acceptedAt"       TIMESTAMPTZ,
  "declinedAt"       TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_connection_no_self"
    CHECK ("requesterId" <> "recipientId"),
  CONSTRAINT "companion_connection_message_length"
    CHECK (char_length("requesterMessage") <= 200),
  CONSTRAINT "companion_connection_unique_pair"
    UNIQUE ("requesterId", "recipientId")
);

CREATE INDEX IF NOT EXISTS "idx_companion_connection_recipient_pending"
  ON "CompanionConnection"("recipientId")
  WHERE "status" = 'pending';

CREATE INDEX IF NOT EXISTS "idx_companion_connection_accepted"
  ON "CompanionConnection"("requesterId", "recipientId")
  WHERE "status" = 'accepted';
