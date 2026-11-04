-- Migration 083: Repair PrePostAssessment assessmentType schema drift
--
-- Context: some databases have migration 010 recorded in _migrations without
-- the PrePostAssessment changes actually applied. That leaves assessmentType
-- as VARCHAR(4) with a stale CHECK constraint that only allows ('pre', 'post'),
-- causing post_immediate and post_1week submissions to fail.
--
-- This migration safely replays the relevant migration 010 steps. It is
-- idempotent for healthy databases and preserves existing research rows.

BEGIN;

UPDATE "PrePostAssessment"
  SET "assessmentType" = 'post_immediate'
  WHERE "assessmentType" = 'post';

ALTER TABLE "PrePostAssessment"
  DROP CONSTRAINT IF EXISTS "PrePostAssessment_assessmentType_check";

ALTER TABLE "PrePostAssessment"
  ALTER COLUMN "assessmentType" TYPE VARCHAR(16);

ALTER TABLE "PrePostAssessment"
  ADD CONSTRAINT "PrePostAssessment_assessmentType_check"
    CHECK ("assessmentType" IN ('pre', 'post_immediate', 'post_1week'));

COMMIT;
