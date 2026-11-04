-- ============================================================
-- 007: Migrate UserProfile.insightsJson from TEXT to JSONB
--
-- Converts the insightsJson column to JSONB for consistency with
-- other JSON storage columns (e.g. PersonalProfile.profileJson).
-- Empty strings are coerced to NULL to avoid cast errors.
-- ============================================================

BEGIN;

ALTER TABLE "UserProfile"
ALTER COLUMN "insightsJson" TYPE JSONB
USING CASE
  WHEN "insightsJson" IS NULL THEN NULL
  WHEN "insightsJson" = '' THEN NULL
  ELSE "insightsJson"::jsonb
END;

COMMIT;
