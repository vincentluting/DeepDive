-- Migration 053: Add missing indexes on FK columns
-- Identified by monthly DB health audit (2026-03-20)

CREATE INDEX IF NOT EXISTS idx_coaching_feedback_session ON "CoachingFeedback"("sessionId");
CREATE INDEX IF NOT EXISTS idx_cdse_user ON "CDSEResponse"("userId");
CREATE INDEX IF NOT EXISTS idx_cdse_session ON "CDSEResponse"("sessionId");
CREATE INDEX IF NOT EXISTS idx_invitecode_created_by ON "InviteCode"("createdBy");
