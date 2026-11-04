-- Migration 016: Create AnalyticsError table for observability
-- Tracks errors that occur inside the analytics layer (funnel, page_visit,
-- engagement, identity, cron) so they can be monitored without crashing
-- the user-facing flow.

CREATE TABLE IF NOT EXISTS "AnalyticsError" (
  "id"        TEXT PRIMARY KEY,
  "layer"     TEXT NOT NULL
    CHECK ("layer" IN (
      'funnel', 'page_visit', 'engagement', 'identity', 'cron'
    )),
  "event"     TEXT,
  "error"     TEXT NOT NULL,
  "context"   JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_error_created
  ON "AnalyticsError"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_error_layer
  ON "AnalyticsError"("layer", "createdAt" DESC);
