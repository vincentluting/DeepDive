-- Migration 098: Per-turn AI Coach V2 understanding and response diagnostics

CREATE TABLE IF NOT EXISTS "CoachingTurnAudit" (
  "id"                      TEXT PRIMARY KEY,
  "sessionId"               TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "userId"                  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "turnNumber"              INTEGER NOT NULL,
  "strategyVersion"         TEXT NOT NULL
                              CHECK ("strategyVersion" IN ('legacy', 'shadow', 'v2')),
  "mode"                    TEXT NOT NULL
                              CHECK ("mode" IN ('explore', 'decide', 'act', 'support', 'job_analysis')),
  "primaryIntent"           TEXT NOT NULL,
  "coreQuestion"            TEXT NOT NULL,
  "importantFacts"          JSONB NOT NULL DEFAULT '[]',
  "constraints"             JSONB NOT NULL DEFAULT '[]',
  "desiredHelp"             TEXT NOT NULL
                              CHECK ("desiredHelp" IN ('listen', 'analyze', 'recommend', 'plan', 'information')),
  "ambiguities"             JSONB NOT NULL DEFAULT '[]',
  "confidence"              NUMERIC(4,3) NOT NULL,
  "correctionSignal"        TEXT,
  "needsRepair"             BOOLEAN NOT NULL DEFAULT FALSE,
  "assistantResponseLength" INTEGER,
  "hasActionDraft"          BOOLEAN NOT NULL DEFAULT FALSE,
  "hasRecommendation"       BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt"             TIMESTAMPTZ,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("sessionId", "turnNumber")
);

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_created"
  ON "CoachingTurnAudit"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_strategy"
  ON "CoachingTurnAudit"("strategyVersion", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_repair"
  ON "CoachingTurnAudit"("needsRepair", "createdAt" DESC)
  WHERE "needsRepair" = TRUE;
