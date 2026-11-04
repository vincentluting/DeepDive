-- ============================================================
-- 012: Add unique constraint on PrePostAssessment(userId, assessmentType)
--
-- Prevents duplicate submissions per user per assessment type.
-- Only applies when userId IS NOT NULL (anonymous rows excluded).
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS "idx_prepost_user_type_unique"
  ON "PrePostAssessment"("userId", "assessmentType")
  WHERE "userId" IS NOT NULL;
