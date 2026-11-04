-- Migration 071: Add partial index for efficient provider failure lookups
-- Used by circuit breaker cold-start seeding to check recent failures per provider.
-- Partial index (WHERE success = false) keeps the index small — only failure rows are indexed.

CREATE INDEX IF NOT EXISTS "idx_llm_usage_provider_failures"
  ON "LLMUsageLog"("provider", "createdAt" DESC) WHERE "success" = false;
