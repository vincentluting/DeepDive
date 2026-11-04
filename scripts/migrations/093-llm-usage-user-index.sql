-- ============================================================
-- Migration 093: LLMUsageLog (userId, createdAt DESC) index
--
-- Why: lib/db/llm-usage.ts joins LLMUsageLog by userId for cost
-- attribution and per-user provider stats (see getUserUsageStats
-- at line 194). With 0 indexes on userId, the join is a seqscan on
-- a high-write table — fine at low N, catastrophic when thesis
-- recruitment fills the table.
--
-- Partial index (userId IS NOT NULL): a large fraction of rows have
-- userId = NULL (anonymous flows), and excluding them keeps the
-- index small enough to fit comfortably under Neon's free-tier
-- storage ceiling while still serving the only queries that read
-- userId at all.
--
-- Composite (userId, createdAt DESC) lets us answer "last N calls
-- by this user" without a separate sort.
-- ============================================================

CREATE INDEX IF NOT EXISTS "idx_llm_usage_user"
  ON "LLMUsageLog"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;
