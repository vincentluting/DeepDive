-- Migration 026: LLM Usage Log table for cost/latency tracking
-- Tracks every LLM call with task name, provider, token counts, latency, and degradation status.

CREATE TABLE IF NOT EXISTS "LLMUsageLog" (
  "id"            TEXT PRIMARY KEY,
  "taskName"      VARCHAR(50) NOT NULL,
  "provider"      VARCHAR(20) NOT NULL,
  "model"         VARCHAR(50) NOT NULL,
  "inputTokens"   INTEGER,
  "outputTokens"  INTEGER,
  "latencyMs"     INTEGER NOT NULL,
  "success"       BOOLEAN NOT NULL,
  "degraded"      BOOLEAN NOT NULL DEFAULT FALSE,
  "errorMessage"  TEXT,
  "userId"        TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_llm_usage_created"
  ON "LLMUsageLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_llm_usage_task"
  ON "LLMUsageLog"("taskName", "createdAt" DESC);
