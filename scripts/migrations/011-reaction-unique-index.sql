-- Migration 011: Add unique index on ReportReaction(reportId, userId) to enable atomic upserts
-- This prevents the SELECT→INSERT/UPDATE race condition in saveReaction().

CREATE UNIQUE INDEX IF NOT EXISTS "idx_reaction_report_user"
  ON "ReportReaction"("reportId", "userId") WHERE "userId" IS NOT NULL;
