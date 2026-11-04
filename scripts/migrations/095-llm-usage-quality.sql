-- Migration 095 — LLMUsageLog quality gate result
--
-- WHY: Phase 2 of the 99%+ quality plan adds a runWithQualityGate() wrapper
-- around every LLM call. The wrapper decides if the output passes length /
-- field-completeness / locale / repetition checks. We log the decision so
-- admin dashboard + cron digest can monitor pass rate per task.
--
-- Values:
--   'pass'             — output cleared all configured gates
--   'fail-length'      — too short (below minLength threshold)
--   'fail-field'       — required JSON field missing
--   'fail-count'       — expected item count mismatch (e.g. directions.length != 3)
--   'fail-language'    — output language did not match requested locale
--   'fail-repetition'  — exceeded bigram repetition threshold
--   'not-checked'      — task has no gate configured (legacy code path)
-- NULL                 — pre-migration row (back-compat)

ALTER TABLE "LLMUsageLog"
  ADD COLUMN IF NOT EXISTS "qualityCheckResult" TEXT
  CHECK ("qualityCheckResult" IN (
    'pass',
    'fail-length',
    'fail-field',
    'fail-count',
    'fail-language',
    'fail-repetition',
    'not-checked'
  ));

-- Partial index for the cron digest's "fail rate by task" query
CREATE INDEX IF NOT EXISTS "idx_llm_usage_quality_fail"
  ON "LLMUsageLog" ("taskName", "createdAt" DESC)
  WHERE "qualityCheckResult" IS NOT NULL
    AND "qualityCheckResult" NOT IN ('pass', 'not-checked');
