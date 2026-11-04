-- Migration 059: Career Direction Lifecycle Management
-- Adds sunset_date and deprecation_status for automated career lifecycle tracking.
-- 'transformed' careers approaching AI replacement can be scheduled for sunset.

ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "sunsetDate" DATE,
  ADD COLUMN IF NOT EXISTS "deprecationStatus" TEXT CHECK ("deprecationStatus" IN ('active', 'warning', 'sunset', 'retired')) DEFAULT 'active';

-- Index for lifecycle queries (admin dashboard, engine filtering)
CREATE INDEX IF NOT EXISTS idx_career_dir_deprecation
  ON "CareerDirection"("deprecationStatus")
  WHERE "deprecationStatus" != 'active';

CREATE INDEX IF NOT EXISTS idx_career_dir_sunset
  ON "CareerDirection"("sunsetDate")
  WHERE "sunsetDate" IS NOT NULL;
