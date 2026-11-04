-- Migration 088 — CompanionBlock (one-way blocking)
--
-- A blocks B → B can never see A in discovery, can never send a friend
-- request to A, and any existing CompanionConnection between them is
-- treated as severed by the application layer (kept as audit trail).
-- Blocks are unilateral — B's own block list is unaffected.

CREATE TABLE IF NOT EXISTS "CompanionBlock" (
  "id"        TEXT PRIMARY KEY,
  "blockerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "blockedId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason"    TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_block_no_self"
    CHECK ("blockerId" <> "blockedId"),
  CONSTRAINT "companion_block_unique_pair"
    UNIQUE ("blockerId", "blockedId")
);

CREATE INDEX IF NOT EXISTS "idx_companion_block_blocker"
  ON "CompanionBlock"("blockerId");
CREATE INDEX IF NOT EXISTS "idx_companion_block_blocked"
  ON "CompanionBlock"("blockedId");
