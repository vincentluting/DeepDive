-- Migration 033: Add pmfResponse column to ReportNPS
-- Sean Ellis PMF question: "How would you feel if you could no longer use this product?"
-- Values: very_disappointed | somewhat_disappointed | not_disappointed

ALTER TABLE "ReportNPS"
  ADD COLUMN IF NOT EXISTS "pmfResponse" TEXT
  CHECK ("pmfResponse" IN ('very_disappointed', 'somewhat_disappointed', 'not_disappointed'));
