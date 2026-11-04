-- Migration 035: Add AI era category to CareerDirection
-- Classifies each career direction by its relationship to AI:
--   stable      = AI impact minimal, core work unchanged
--   augmented   = AI enhances efficiency, human still leads
--   transformed = AI fundamentally changes the work
--   ai-native   = New career born in the AI era

ALTER TABLE "CareerDirection"
ADD COLUMN IF NOT EXISTS "aiEraCategory" TEXT
CHECK ("aiEraCategory" IN ('stable', 'augmented', 'transformed', 'ai-native'));

CREATE INDEX IF NOT EXISTS idx_career_dir_ai_era
ON "CareerDirection"("aiEraCategory")
WHERE "aiEraCategory" IS NOT NULL;
