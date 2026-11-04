-- Migration 090 — Canonical pair UNIQUE for CompanionConnection
--
-- The original migration 087 enforces UNIQUE (requesterId, recipientId)
-- ordered. That stops same-direction duplicates but not the bidirectional
-- race: if A and B simultaneously send each other a friend request, the
-- application-level pre-probe in createConnectionRequest() may not see
-- the other row yet (non-atomic), and both INSERTs can succeed — leaving
-- (A,B) and (B,A) as two pending rows for the same pair.
--
-- A canonical-pair index on the unordered (LEAST, GREATEST) tuple makes
-- the constraint symmetric, so the second INSERT in any reciprocal race
-- fails with a unique-violation that createConnectionRequest already
-- maps to reason='duplicate'.
--
-- Coexists with the original ordered UNIQUE — both are idempotent and
-- both are valid invariants. If a pair somehow exists today, this CREATE
-- INDEX will fail and the migration aborts; that's the desired outcome
-- (forces operator triage).

CREATE UNIQUE INDEX IF NOT EXISTS "idx_companion_connection_canonical_pair"
  ON "CompanionConnection" (
    LEAST("requesterId", "recipientId"),
    GREATEST("requesterId", "recipientId")
  );
