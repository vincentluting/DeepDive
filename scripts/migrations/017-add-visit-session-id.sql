-- Migration 017: Add visitSessionId to PageVisit for session stitching
-- Groups multiple page visits within the same browsing session (30-min sliding window).
-- Cookie: visit-session-id (httpOnly=false, maxAge=1800, sameSite=strict)

ALTER TABLE "PageVisit"
  ADD COLUMN IF NOT EXISTS "visitSessionId" TEXT;

CREATE INDEX IF NOT EXISTS idx_pagevisit_session
  ON "PageVisit"("visitSessionId")
  WHERE "visitSessionId" IS NOT NULL;
