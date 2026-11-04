-- Migration 042: Add inputHash to CareerReport for staleness detection
-- When reality conditions change after report generation, inputHash mismatch
-- signals the report is stale and should be refreshed.

ALTER TABLE "CareerReport" ADD COLUMN IF NOT EXISTS "inputHash" TEXT;
