-- Migration 100: Coaching hypothesis memory
-- Stores long-term coach hypotheses separately from confirmed memories.

CREATE TABLE IF NOT EXISTS "CoachingHypothesis" (
  "id"                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"                TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "hypothesis"            TEXT NOT NULL,
  "evidenceJson"          JSONB NOT NULL DEFAULT '[]'::jsonb,
  "counterEvidenceJson"   JSONB NOT NULL DEFAULT '[]'::jsonb,
  "confidence"            DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK ("confidence" >= 0 AND "confidence" <= 1),
  "status"                TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'confirmed', 'rejected', 'stale')),
  "sourceSessionId"       TEXT NULL,
  "lastValidatedAt"       TIMESTAMPTZ NULL,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_coaching_hypothesis_user_status"
  ON "CoachingHypothesis"("userId", "status", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coaching_hypothesis_active_relevance"
  ON "CoachingHypothesis"("userId", "confidence" DESC, "updatedAt" DESC)
  WHERE "status" IN ('active', 'confirmed');
