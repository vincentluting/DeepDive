-- Migration 073: Make cdseResponses nullable in PrePostAssessment
--
-- Context: cdseResponses was originally for CDSE-SF (removed in v4.3).
-- The column is now repurposed for CDC-5 responses. Since v4.3, the
-- application has been writing NULL for this column (CDSE removal),
-- but the schema still declares NOT NULL. This migration aligns the
-- schema with the application behavior and makes it safe for rows
-- where CDC-5 responses are not applicable.
--
-- Safe to run: existing rows with NULL (if any bypassed the constraint
-- via direct INSERT) will remain valid. New rows may have NULL when
-- CDC-5 is not collected (e.g., non-research users).

ALTER TABLE "PrePostAssessment"
  ALTER COLUMN "cdseResponses" DROP NOT NULL;
