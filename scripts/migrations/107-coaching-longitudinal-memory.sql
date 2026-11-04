-- Migration 107: Coaching longitudinal memory (Phase 4)
-- Persists structured per-session summaries + tracked stance changes so the
-- coach has cross-session continuity instead of rebuilding from scratch each
-- visit. Summaries are embedded (pgvector) for semantic recall of past
-- sessions. The evidence-packet pipeline already reserves a session_summary
-- slot (context-retriever.ts) and route.ts already forwards
-- recentSessionSummaries — this migration adds the production storage side.

CREATE TABLE IF NOT EXISTS "CoachingSessionSummary" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sessionId"     TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "summary"       TEXT NOT NULL,
  "keyDecisions"  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "openLoops"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "emotionalArc"  TEXT,
  "embedding"     vector(1536),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_session_summary_user"
  ON "CoachingSessionSummary"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_session_summary_embedding"
  ON "CoachingSessionSummary" USING hnsw ("embedding" vector_cosine_ops);

CREATE TABLE IF NOT EXISTS "CoachingGrowthMarker" (
  "id"                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"             TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "dimension"          TEXT NOT NULL,
  "previousStance"     TEXT,
  "currentStance"      TEXT NOT NULL,
  "changeType"         TEXT NOT NULL CHECK ("changeType" IN ('growth', 'regression', 'contradiction')),
  "evidenceSessionIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "detectedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_growth_marker_user"
  ON "CoachingGrowthMarker"("userId", "detectedAt" DESC);
