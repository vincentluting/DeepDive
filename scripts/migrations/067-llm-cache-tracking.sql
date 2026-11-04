-- 067: Add prompt cache tracking columns to LLMUsageLog
-- Tracks cache_read_input_tokens, cache_creation_input_tokens from Anthropic,
-- prompt_tokens_details.cached_tokens from OpenAI,
-- cachedContentTokenCount from Gemini.

ALTER TABLE "LLMUsageLog" ADD COLUMN IF NOT EXISTS "cacheReadTokens"  INTEGER;
ALTER TABLE "LLMUsageLog" ADD COLUMN IF NOT EXISTS "cacheWriteTokens" INTEGER;
ALTER TABLE "LLMUsageLog" ADD COLUMN IF NOT EXISTS "cacheHit"         BOOLEAN;
