-- Migration 018: Create analytics materialized views
--
-- Three read-optimized materialized views for the admin analytics dashboard:
--   1. analytics_daily_summary  — daily page-visit aggregates by country
--   2. funnel_weekly_summary    — weekly funnel event counts
--   3. cohort_retention_weekly  — cohort-based retention by registration week
--
-- IMPORTANT: Materialized views are created empty.
-- Run REFRESH MATERIALIZED VIEW CONCURRENTLY <view> to populate data.
-- Neon does not support CONCURRENTLY on first refresh (view must have rows),
-- so first-time refresh should omit CONCURRENTLY:
--   REFRESH MATERIALIZED VIEW analytics_daily_summary;
--   REFRESH MATERIALIZED VIEW funnel_weekly_summary;
--   REFRESH MATERIALIZED VIEW cohort_retention_weekly;
--
-- Subsequent refreshes can use CONCURRENTLY (thanks to unique indexes):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_weekly_summary;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_retention_weekly;

-- ============================================================
-- 1. Daily visit summary (date × country)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_summary AS
SELECT
  DATE("createdAt" AT TIME ZONE 'UTC') AS "date",
  COALESCE("country", '__unknown__') AS "country",
  COUNT(*) AS "totalPV",
  COUNT(DISTINCT "ipHash") AS "uniqueVisitors",
  COUNT(DISTINCT "userId")
    FILTER (WHERE "userId" IS NOT NULL) AS "registeredUsers",
  COUNT(*)
    FILTER (WHERE "isBot" = FALSE
      AND COALESCE("isInternal", FALSE) = FALSE) AS "realPV",
  COUNT(DISTINCT "ipHash")
    FILTER (WHERE "isBot" = FALSE
      AND COALESCE("isInternal", FALSE) = FALSE) AS "realUV",
  COUNT(*)
    FILTER (WHERE "deviceType" = 'mobile') AS "mobilePV",
  COUNT(*)
    FILTER (WHERE "utmSource" IS NOT NULL) AS "campaignPV"
FROM "PageVisit"
GROUP BY DATE("createdAt" AT TIME ZONE 'UTC'),
         COALESCE("country", '__unknown__');

CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_date_country
  ON analytics_daily_summary("date", "country");

-- ============================================================
-- 2. Weekly funnel summary (week × event)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS funnel_weekly_summary AS
SELECT
  DATE_TRUNC('week', "createdAt") AS "week",
  "event",
  COUNT(*)::int AS "totalCount",
  COUNT(DISTINCT COALESCE("userId", "clientId"))::int AS "uniqueUsers",
  COUNT(DISTINCT "userId")
    FILTER (WHERE "userId" IS NOT NULL)::int AS "registeredUsers"
FROM "UserFunnel"
GROUP BY DATE_TRUNC('week', "createdAt"), "event";

CREATE UNIQUE INDEX IF NOT EXISTS idx_fws_week_event
  ON funnel_weekly_summary("week", "event");

-- ============================================================
-- 3. Cohort retention weekly (registration week → activity week)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS cohort_retention_weekly AS
WITH user_cohorts AS (
  SELECT
    "id" AS "userId",
    DATE_TRUNC('week', "createdAt") AS "cohortWeek"
  FROM "User"
),
user_activities AS (
  SELECT DISTINCT
    "userId",
    DATE_TRUNC('week', "createdAt") AS "activityWeek"
  FROM "UserFunnel"
  WHERE "userId" IS NOT NULL
)
SELECT
  c."cohortWeek",
  a."activityWeek",
  EXTRACT(EPOCH FROM (a."activityWeek" - c."cohortWeek"))
    / 604800 AS "weekNumber",
  COUNT(DISTINCT c."userId")::int AS "activeUsers",
  (
    SELECT COUNT(*)::int FROM user_cohorts c2
    WHERE c2."cohortWeek" = c."cohortWeek"
  ) AS "cohortSize"
FROM user_cohorts c
JOIN user_activities a
  ON a."userId" = c."userId"
  AND a."activityWeek" >= c."cohortWeek"
GROUP BY c."cohortWeek", a."activityWeek";

CREATE UNIQUE INDEX IF NOT EXISTS idx_crw_cohort_activity
  ON cohort_retention_weekly("cohortWeek", "activityWeek");
