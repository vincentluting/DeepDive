-- Migration 014: Add composite indexes for analytics queries
-- Purpose: Optimize funnel queries and notable visitor scan

-- UserFunnel: event + time range (core funnel query pattern)
CREATE INDEX IF NOT EXISTS idx_funnel_event_created
ON "UserFunnel"("event", "createdAt" DESC);

-- UserFunnel: user + event (filtered conversion rates)
CREATE INDEX IF NOT EXISTS idx_funnel_user_event
ON "UserFunnel"("userId", "event")
WHERE "userId" IS NOT NULL;

-- PageVisit: ipHash + time (notable visitor scan)
CREATE INDEX IF NOT EXISTS idx_pagevisit_iphash_created
ON "PageVisit"("ipHash", "createdAt" DESC)
WHERE "ipHash" IS NOT NULL;

-- PageVisit: real users only (exclude bot + internal)
CREATE INDEX IF NOT EXISTS idx_pagevisit_real_created
ON "PageVisit"("createdAt" DESC)
WHERE "isBot" = FALSE AND COALESCE("isInternal", FALSE) = FALSE;
