-- ============================================================
-- Migration 092: LLMPromptMeta — track RealConditions injection
-- per LLM call so production SQL can verify whether the audit-driven
-- prompt fix is actually in effect.
--
-- Why a separate table (not new columns on LLMUsageLog):
--   LLMUsageLog is written from inside lib/ai/model-router.ts (frozen).
--   This table is populated by the prompt builders themselves
--   (career-pathway, career-match-narrative, integration, coaching-chat)
--   right alongside their callLLM invocations. No frozen-file change.
--
-- Joining strategy: aggregate by (taskName, userId, time window).
-- Row-level join to LLMUsageLog is intentionally avoided — the goal is
-- per-task ratios (what fraction of calls injected RC?), not per-call
-- correlation. Cheap, sufficient.
-- ============================================================

CREATE TABLE IF NOT EXISTS "LLMPromptMeta" (
  "id" UUID PRIMARY KEY,
  "taskName" TEXT NOT NULL,
  "userId" UUID,
  "locale" TEXT NOT NULL,
  "realConditionsProvided" BOOLEAN NOT NULL,
  "realConditionsFieldCount" INTEGER NOT NULL DEFAULT 0,
  "environment" TEXT NOT NULL DEFAULT 'production',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_llm_prompt_meta_task_created"
  ON "LLMPromptMeta" ("taskName", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_llm_prompt_meta_user_created"
  ON "LLMPromptMeta" ("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

COMMENT ON TABLE "LLMPromptMeta" IS
  'Per-LLM-call metadata about prompt composition. Currently tracks whether RealConditions was injected and how many fields. Added 2026-05-18 to make the RealConditions-injection audit (commit history) verifiable in production.';
