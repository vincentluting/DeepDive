-- Migration 072: Widen QuestionnaireSession.language CHECK constraint
-- to support all 11 locales (was: en, zh only)
-- Non-destructive: existing en/zh rows remain valid

ALTER TABLE "QuestionnaireSession"
  DROP CONSTRAINT IF EXISTS "QuestionnaireSession_language_check";

ALTER TABLE "QuestionnaireSession"
  ADD CONSTRAINT "QuestionnaireSession_language_check"
  CHECK ("language" IN ('en', 'zh', 'nl', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru'));
