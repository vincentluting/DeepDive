-- ============================================================
-- 010: Research Schema Extension
--
-- Adds research participation fields to User table for
-- between-subject study design, and extends PrePostAssessment
-- to support two post-measurement time points.
--
-- Changes:
-- 1. User: add researchGroup, researchParticipantId, researchConsentAt
-- 2. PrePostAssessment: extend assessmentType to include
--    'post_immediate' and 'post_1week' (migrating existing 'post' → 'post_immediate')
-- ============================================================

BEGIN;

-- ── 1. User: research participation fields ─────

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "researchGroup" TEXT
    CHECK ("researchGroup" IN ('classic', 'immersive'));

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "researchParticipantId" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "researchConsentAt" TIMESTAMPTZ;

-- ── 2. PrePostAssessment: extend assessmentType ─────

-- Step 1: Migrate existing 'post' rows to 'post_immediate'
UPDATE "PrePostAssessment"
  SET "assessmentType" = 'post_immediate'
  WHERE "assessmentType" = 'post';

-- Step 2: Drop old CHECK constraint and add new one with three values
ALTER TABLE "PrePostAssessment"
  DROP CONSTRAINT IF EXISTS "PrePostAssessment_assessmentType_check";

-- Step 3: Widen the column type to accommodate longer values
ALTER TABLE "PrePostAssessment"
  ALTER COLUMN "assessmentType" TYPE VARCHAR(16);

-- Step 4: Add updated CHECK constraint
ALTER TABLE "PrePostAssessment"
  ADD CONSTRAINT "PrePostAssessment_assessmentType_check"
    CHECK ("assessmentType" IN ('pre', 'post_immediate', 'post_1week'));

COMMIT;
