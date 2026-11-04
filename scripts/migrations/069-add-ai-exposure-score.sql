-- Migration 069: Add AI exposure score from Anthropic Economic Index
-- Adds quantitative AI exposure data to complement the existing qualitative aiEraCategory.
-- Source: Anthropic Economic Index (2026-03-24), CC-BY license.
-- Maps via SOC-6 code extracted from CareerDirection.id (onet-XX-XXXX.YY → XX-XXXX).

-- New columns
ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "aiExposureScore" REAL
    CHECK ("aiExposureScore" >= 0 AND "aiExposureScore" <= 1),
  ADD COLUMN IF NOT EXISTS "aiImpactLabel" TEXT
    CHECK ("aiImpactLabel" IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS "aiExposureSources" TEXT[] DEFAULT '{}';

-- Index for filtering by impact label
CREATE INDEX IF NOT EXISTS idx_career_dir_ai_impact
  ON "CareerDirection"("aiImpactLabel")
  WHERE "aiImpactLabel" IS NOT NULL;

-- Index for sorting by exposure score
CREATE INDEX IF NOT EXISTS idx_career_dir_ai_exposure_score
  ON "CareerDirection"("aiExposureScore" DESC NULLS LAST)
  WHERE "aiExposureScore" IS NOT NULL;
