-- Migration 041: Add environment column to LLMUsageLog
-- Distinguishes test (development) vs production LLM calls

ALTER TABLE "LLMUsageLog"
  ADD COLUMN IF NOT EXISTS "environment" VARCHAR(20) NOT NULL DEFAULT 'production';

CREATE INDEX IF NOT EXISTS "idx_llm_usage_env"
  ON "LLMUsageLog"("environment", "createdAt" DESC);
