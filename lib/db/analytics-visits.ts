// ============================================================
// Analytics Visits — PageVisit CRUD & notable visitor detection
//
// Table: PageVisit (tracked via middleware after())
// Key fields: id, ipHash, country, city, timezone, device, userAgent,
//             referrer, utmSource/Medium/Campaign, path, locale,
//             durationMs, notabilityScore, isNotable
// Also manages: NotableVisitor tables
// ============================================================

import { sql } from './connection';
import type { ScoringResult } from '@/lib/analytics/notable-detection';

// ── Types ────────────────────────────────────────

export interface VisitOverview {
  totalPV: number;
  uniqueVisitors: number;
  botVisits: number;
  todayPV: number;
  todayUV: number;
  weekPV: number;
  mobilePercent: number;
}

export interface VisitTrendPoint {
  date: string; // YYYY-MM-DD
  pv: number;
  uv: number;
}

export interface RecentVisitor {
  id: string;
  path: string;
  ipHash: string | null;
  userAgent: string | null;
  referer: string | null;
  userId: string | null;
  userEmail: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isMobile: boolean | null;
  platform: string | null;
  deviceType: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  durationMs: number | null;
  isBot: boolean;
  isInternal: boolean;
  createdAt: string;
}

export interface VisitorJourneyEvent {
  id: string;
  path: string;
  country: string | null;
  city: string | null;
  referer: string | null;
  deviceType: string | null;
  userId: string | null;
  userEmail: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface VisitorJourneyFingerprint {
  fullUA: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  platform: string | null;
  deviceType: string | null;
}

export interface VisitorJourney {
  ipHash: string;
  events: VisitorJourneyEvent[];
  fingerprint: VisitorJourneyFingerprint;
  summary: {
    totalVisits: number;
    firstVisit: string;
    lastVisit: string;
    spanMs: number;
    isRegistered: boolean;
    deepestPage: string | null;
  };
}

export interface CampaignStat {
  utmSource: string;
  utmCampaign: string | null;
  visits: number;
  registrations: number;
}

export interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

export interface TopReferrer {
  domain: string;
  visits: number;
}

export interface SuspiciousIP {
  ipHash: string;
  requestCount: number;
  topPaths: string[];
  countries: string[];
  latestAt: string;
}

export interface CountryVisit {
  country: string;
  visits: number;
}

export interface NotableVisitor {
  id: string;
  ipHash: string;
  score: number;
  reasons: string[];
  summary: {
    pageCount: number;
    deepestPage: string | null;
    country: string | null;
    city: string | null;
    deviceType: string | null;
    userAgent: string | null;
    firstSeen: string;
    lastSeen: string;
  } | null;
  detectedAt: string;
  expiresAt: string;
  dismissed: boolean;
}

export interface CountryInsight {
  totalVisits: number;
  uniqueVisitors: number;
  registeredUsers: number;
  topPages: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referer: string; count: number }>;
  visitsByHour: Array<{ hour: number; count: number }>;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  avgVisitsPerUser: number;
  conversionRate: number;
  recentTrend: Array<{ date: string; visits: number }>;
}

// NotableVisitor table is created by initTables() in lib/db/admin.ts
// (synced with scripts/schema.sql). No lazy-init needed.

// ── Query Functions ──────────────────────────────

/**
 * Overview KPI stats for the analytics dashboard.
 */
export async function getVisitOverview(days: number = 30, excludedIpHashes: string[] = []): Promise<VisitOverview> {
  try {
    const hasExclusions = excludedIpHashes.length > 0;

    const [totalRows, todayRows, weekRows, mobileRows] = await Promise.all([
      hasExclusions
        ? sql`
            SELECT
              COUNT(*)::int AS "totalPV",
              COUNT(DISTINCT "ipHash")::int AS "uniqueVisitors",
              COUNT(*) FILTER (WHERE "isBot" = TRUE)::int AS "botVisits"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
              AND ("ipHash" IS NULL OR "ipHash" != ALL(${excludedIpHashes}))
          `
        : sql`
            SELECT
              COUNT(*)::int AS "totalPV",
              COUNT(DISTINCT "ipHash")::int AS "uniqueVisitors",
              COUNT(*) FILTER (WHERE "isBot" = TRUE)::int AS "botVisits"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
          `,
      hasExclusions
        ? sql`
            SELECT
              COUNT(*)::int AS "todayPV",
              COUNT(DISTINCT "ipHash")::int AS "todayUV"
            FROM "PageVisit"
            WHERE "createdAt" >= DATE_TRUNC('day', NOW())
              AND ("ipHash" IS NULL OR "ipHash" != ALL(${excludedIpHashes}))
          `
        : sql`
            SELECT
              COUNT(*)::int AS "todayPV",
              COUNT(DISTINCT "ipHash")::int AS "todayUV"
            FROM "PageVisit"
            WHERE "createdAt" >= DATE_TRUNC('day', NOW())
          `,
      hasExclusions
        ? sql`
            SELECT COUNT(*)::int AS "weekPV"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - INTERVAL '7 days'
              AND ("ipHash" IS NULL OR "ipHash" != ALL(${excludedIpHashes}))
          `
        : sql`
            SELECT COUNT(*)::int AS "weekPV"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - INTERVAL '7 days'
          `,
      hasExclusions
        ? sql`
            SELECT
              COUNT(*) FILTER (WHERE "deviceType" = 'mobile')::int AS "mobileCount",
              COUNT(*)::int AS "realTotal"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
              AND "isBot" = FALSE
              AND "deviceType" IS NOT NULL
              AND ("ipHash" IS NULL OR "ipHash" != ALL(${excludedIpHashes}))
          `
        : sql`
            SELECT
              COUNT(*) FILTER (WHERE "deviceType" = 'mobile')::int AS "mobileCount",
              COUNT(*)::int AS "realTotal"
            FROM "PageVisit"
            WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
              AND "isBot" = FALSE
              AND "deviceType" IS NOT NULL
          `,
    ]);

    const mobileCount = mobileRows[0]?.mobileCount ?? 0;
    const realTotal = mobileRows[0]?.realTotal ?? 0;
    const mobilePercent = realTotal > 0 ? Math.round((mobileCount / realTotal) * 100) : 0;

    return {
      totalPV: totalRows[0]?.totalPV ?? 0,
      uniqueVisitors: totalRows[0]?.uniqueVisitors ?? 0,
      botVisits: totalRows[0]?.botVisits ?? 0,
      todayPV: todayRows[0]?.todayPV ?? 0,
      todayUV: todayRows[0]?.todayUV ?? 0,
      weekPV: weekRows[0]?.weekPV ?? 0,
      mobilePercent,
    };
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return { totalPV: 0, uniqueVisitors: 0, botVisits: 0, todayPV: 0, todayUV: 0, weekPV: 0, mobilePercent: 0 };
  }
}

/**
 * Daily PV/UV trend for charting.
 */
export async function getVisitTrend(days: number = 30, excludedIpHashes: string[] = []): Promise<VisitTrendPoint[]> {
  try {
    const rows = excludedIpHashes.length > 0
      ? await sql`
          SELECT
            TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS "date",
            COUNT(*)::int AS "pv",
            COUNT(DISTINCT "ipHash")::int AS "uv"
          FROM "PageVisit"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
            AND "isBot" = FALSE
            AND ("ipHash" IS NULL OR "ipHash" != ALL(${excludedIpHashes}))
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY DATE_TRUNC('day', "createdAt") ASC
        `
      : await sql`
          SELECT
            TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS "date",
            COUNT(*)::int AS "pv",
            COUNT(DISTINCT "ipHash")::int AS "uv"
          FROM "PageVisit"
          WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
            AND "isBot" = FALSE
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY DATE_TRUNC('day', "createdAt") ASC
        `;

    return rows.map((r) => ({
      date: r.date as string,
      pv: r.pv as number,
      uv: r.uv as number,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Most recent page visits with optional user email join.
 * When excludeBots is true, only real (non-bot, non-internal) visits are returned.
 * When countryFilter is non-empty, only visits from that country are returned.
 * When excludedIpHashes is non-empty, visits from those IPs are filtered out.
 */
export async function getRecentVisitors(
  limit: number = 50,
  excludeBots: boolean = false,
  countryFilter: string = '',
  excludedIpHashes: string[] = [],
): Promise<RecentVisitor[]> {
  try {
    const rows = excludeBots
      ? await sql`
          SELECT
            pv."id",
            pv."path",
            pv."ipHash",
            pv."userAgent",
            pv."referer",
            pv."userId",
            u."email" AS "userEmail",
            pv."country",
            pv."city",
            pv."region",
            pv."timezone",
            pv."isMobile",
            pv."platform",
            pv."deviceType",
            pv."utmSource",
            pv."utmCampaign",
            pv."durationMs",
            pv."isBot",
            COALESCE(pv."isInternal", FALSE) AS "isInternal",
            pv."createdAt"
          FROM "PageVisit" pv
          LEFT JOIN "User" u ON u."id" = pv."userId"
          WHERE pv."isBot" = FALSE AND COALESCE(pv."isInternal", FALSE) = FALSE
            AND (${countryFilter} = '' OR pv."country" = ${countryFilter})
          ORDER BY pv."createdAt" DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            pv."id",
            pv."path",
            pv."ipHash",
            pv."userAgent",
            pv."referer",
            pv."userId",
            u."email" AS "userEmail",
            pv."country",
            pv."city",
            pv."region",
            pv."timezone",
            pv."isMobile",
            pv."platform",
            pv."deviceType",
            pv."utmSource",
            pv."utmCampaign",
            pv."durationMs",
            pv."isBot",
            COALESCE(pv."isInternal", FALSE) AS "isInternal",
            pv."createdAt"
          FROM "PageVisit" pv
          LEFT JOIN "User" u ON u."id" = pv."userId"
          WHERE (${countryFilter} = '' OR pv."country" = ${countryFilter})
          ORDER BY pv."createdAt" DESC
          LIMIT ${limit}
        `;

    const mapped: RecentVisitor[] = rows.map((r) => ({
      id: r.id as string,
      path: r.path as string,
      ipHash: r.ipHash as string | null,
      userAgent: r.userAgent as string | null,
      referer: r.referer as string | null,
      userId: r.userId as string | null,
      userEmail: r.userEmail as string | null,
      country: r.country as string | null,
      city: r.city as string | null,
      region: r.region as string | null,
      timezone: r.timezone as string | null,
      isMobile: r.isMobile as boolean | null,
      platform: r.platform as string | null,
      deviceType: r.deviceType as string | null,
      utmSource: r.utmSource as string | null,
      utmCampaign: r.utmCampaign as string | null,
      durationMs: r.durationMs as number | null,
      isBot: r.isBot as boolean,
      isInternal: r.isInternal as boolean,
      createdAt: r.createdAt as string,
    }));

    // Post-filter excluded IP hashes (owner's devices)
    if (excludedIpHashes.length > 0) {
      return mapped.filter((v) => !v.ipHash || !excludedIpHashes.includes(v.ipHash));
    }
    return mapped;
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Top pages by view count.
 */
export async function getTopPages(days: number = 30, limit: number = 10): Promise<TopPage[]> {
  try {
    const rows = await sql`
      SELECT
        "path",
        COUNT(*)::int AS "views",
        COUNT(DISTINCT "ipHash")::int AS "uniqueVisitors"
      FROM "PageVisit"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND "isBot" = FALSE
      GROUP BY "path"
      ORDER BY "views" DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      path: r.path as string,
      views: r.views as number,
      uniqueVisitors: r.uniqueVisitors as number,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Top referrer domains.
 */
export async function getTopReferrers(days: number = 30, limit: number = 10): Promise<TopReferrer[]> {
  try {
    const rows = await sql`
      SELECT
        CASE
          WHEN "referer" IS NULL OR "referer" = '' THEN 'Direct'
          ELSE SPLIT_PART(SPLIT_PART("referer", '://', 2), '/', 1)
        END AS "domain",
        COUNT(*)::int AS "visits"
      FROM "PageVisit"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND "isBot" = FALSE
        AND ("referer" IS NULL
          OR ("referer" NOT LIKE '%deepdivecareer.com%'
              AND "referer" NOT LIKE '%v0-career-exploration-questionnaire.vercel.app%'))
      GROUP BY "domain"
      ORDER BY "visits" DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      domain: r.domain as string,
      visits: r.visits as number,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Detect IPs with unusually high request volume in the past N hours.
 * Threshold: >50 requests within the period.
 */
export async function getSuspiciousActivity(hours: number = 1): Promise<SuspiciousIP[]> {
  try {
    const rows = await sql`
      SELECT
        "ipHash",
        COUNT(*)::int AS "requestCount",
        ARRAY_AGG(DISTINCT "path" ORDER BY "path") AS "topPaths",
        ARRAY_AGG(DISTINCT COALESCE("country", 'Unknown') ORDER BY COALESCE("country", 'Unknown')) AS "countries",
        MAX("createdAt") AS "latestAt"
      FROM "PageVisit"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(hours => ${hours})
        AND "ipHash" IS NOT NULL
      GROUP BY "ipHash"
      HAVING COUNT(*) > 50
      ORDER BY "requestCount" DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      ipHash: r.ipHash as string,
      requestCount: r.requestCount as number,
      topPaths: (r.topPaths as string[]).slice(0, 5),
      countries: r.countries as string[],
      latestAt: r.latestAt as string,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Visit distribution by country.
 */
export async function getVisitsByCountry(days: number = 30): Promise<CountryVisit[]> {
  try {
    const rows = await sql`
      SELECT
        COALESCE("country", 'Unknown') AS "country",
        COUNT(*)::int AS "visits"
      FROM "PageVisit"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND "isBot" = FALSE
      GROUP BY "country"
      ORDER BY "visits" DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      country: r.country as string,
      visits: r.visits as number,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * One-time backfill: mark historical visits from Vercel preview deploys
 * and internal services as isBot=TRUE and isInternal=TRUE.
 * Safe to run multiple times.
 */
export async function backfillInternalTraffic(): Promise<number> {
  try {
    // Step 1: Mark Vercel screenshot/favicon visits
    const r1 = await sql`
      UPDATE "PageVisit"
      SET "isBot" = TRUE, "isInternal" = TRUE
      WHERE "isBot" = FALSE
        AND (
          "userAgent" ILIKE '%vercel-screenshot%'
          OR "userAgent" ILIKE '%vercel-favicon%'
          OR "userAgent" ILIKE '%vercel-og%'
          OR "userAgent" ILIKE '%vercel/%'
        )
    `;

    // Step 2: Mark visits from Vercel preview deploy referrers
    const r2 = await sql`
      UPDATE "PageVisit"
      SET "isBot" = TRUE, "isInternal" = TRUE
      WHERE "isBot" = FALSE
        AND "referer" IS NOT NULL
        AND (
          "referer" ~ 'v0-career-exploration-questionnaire-[a-z0-9]+\.vercel\.app'
          OR ("referer" LIKE '%.vercel.app%'
              AND "referer" NOT LIKE '%deepdivecareer.com%'
              AND "referer" NOT LIKE '%www.deepdivecareer.com%')
        )
    `;

    const count1 = (r1 as unknown as { count?: number }).count || 0;
    const count2 = (r2 as unknown as { count?: number }).count || 0;
    return count1 + count2;
  } catch (error) {
    console.error('[backfillInternalTraffic] Failed:', error);
    return 0;
  }
}

/**
 * Retrieve all page visits for a single visitor (by ipHash), ordered
 * chronologically. Used for the journey drill-down in the Admin Panel.
 * Capped at 100 events.
 */
export async function getVisitorJourney(ipHash: string): Promise<VisitorJourney | null> {
  try {
    const rows = await sql`
      SELECT
        pv."id",
        pv."path",
        pv."country",
        pv."city",
        pv."referer",
        pv."deviceType",
        pv."userId",
        pv."userAgent",
        pv."timezone",
        pv."platform",
        u."email" AS "userEmail",
        pv."durationMs",
        pv."createdAt"
      FROM "PageVisit" pv
      LEFT JOIN "User" u ON u."id" = pv."userId"
      WHERE pv."ipHash" = ${ipHash}
      ORDER BY pv."createdAt" ASC
      LIMIT 100
    `;

    if (rows.length === 0) return null;

    const events: VisitorJourneyEvent[] = rows.map((r) => ({
      id: r.id as string,
      path: r.path as string,
      country: r.country as string | null,
      city: r.city as string | null,
      referer: r.referer as string | null,
      deviceType: r.deviceType as string | null,
      userId: r.userId as string | null,
      userEmail: r.userEmail as string | null,
      durationMs: r.durationMs as number | null,
      createdAt: r.createdAt as string,
    }));

    const firstVisit = events[0].createdAt;
    const lastVisit = events[events.length - 1].createdAt;
    const spanMs = new Date(lastVisit).getTime() - new Date(firstVisit).getTime();
    const isRegistered = events.some((e) => e.userId !== null);

    // Deepest page reached: prefer report/coaching/questionnaire paths
    const deepEvents = events.filter((e) => /\/(report|coaching|questionnaire)/.test(e.path));
    const deepestPage = deepEvents.length > 0 ? deepEvents[deepEvents.length - 1].path : null;

    const fingerprint: VisitorJourneyFingerprint = {
      fullUA: (rows[0]?.userAgent as string | null) || null,
      city: (rows[0]?.city as string | null) || null,
      country: (rows[0]?.country as string | null) || null,
      timezone: (rows[0]?.timezone as string | null) || null,
      platform: (rows[0]?.platform as string | null) || null,
      deviceType: (rows[0]?.deviceType as string | null) || null,
    };

    return {
      ipHash,
      events,
      fingerprint,
      summary: { totalVisits: events.length, firstVisit, lastVisit, spanMs, isRegistered, deepestPage },
    };
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return null;
  }
}

/**
 * Campaign performance: group by utmSource + utmCampaign, return visit and
 * registration counts. Only rows with a non-null utmSource are included.
 */
export async function getTopCampaigns(days: number = 30): Promise<CampaignStat[]> {
  try {
    const rows = await sql`
      SELECT
        "utmSource",
        "utmCampaign",
        COUNT(*)::int AS "visits",
        COUNT("userId")::int AS "registrations"
      FROM "PageVisit"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND "utmSource" IS NOT NULL
        AND "isBot" = FALSE
      GROUP BY "utmSource", "utmCampaign"
      ORDER BY "visits" DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      utmSource: r.utmSource as string,
      utmCampaign: r.utmCampaign as string | null,
      visits: r.visits as number,
      registrations: r.registrations as number,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Aggregate analytics insight for a single country over the past N days.
 */
export async function getCountryInsight(
  country: string,
  days: number = 30,
): Promise<CountryInsight> {
  try {
    const [overview, topPages, topReferrers, hourly, devices, trend] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS "totalVisits",
          COUNT(DISTINCT "ipHash")::int AS "uniqueVisitors",
          COUNT(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL)::int AS "registeredUsers"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      `,
      sql`
        SELECT "path", COUNT(*)::int AS "count"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        GROUP BY "path"
        ORDER BY "count" DESC
        LIMIT 10
      `,
      sql`
        SELECT "referer", COUNT(*)::int AS "count"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "referer" IS NOT NULL AND "referer" != ''
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        GROUP BY "referer"
        ORDER BY "count" DESC
        LIMIT 5
      `,
      sql`
        SELECT EXTRACT(HOUR FROM "createdAt")::int AS "hour", COUNT(*)::int AS "count"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY "hour"
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE "deviceType" = 'mobile')::int AS "mobile",
          COUNT(*) FILTER (WHERE "deviceType" = 'desktop')::int AS "desktop",
          COUNT(*) FILTER (WHERE "deviceType" = 'tablet')::int AS "tablet"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "deviceType" IS NOT NULL
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      `,
      sql`
        SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS "date", COUNT(*)::int AS "visits"
        FROM "PageVisit"
        WHERE "country" = ${country}
          AND "isBot" = FALSE
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `,
    ]);

    const totalVisits = (overview[0]?.totalVisits as number) || 0;
    const uniqueVisitors = (overview[0]?.uniqueVisitors as number) || 0;
    const registeredUsers = (overview[0]?.registeredUsers as number) || 0;

    return {
      totalVisits,
      uniqueVisitors,
      registeredUsers,
      topPages: topPages.map((r) => ({ path: r.path as string, count: r.count as number })),
      topReferrers: topReferrers.map((r) => ({ referer: r.referer as string, count: r.count as number })),
      visitsByHour: hourly.map((r) => ({ hour: r.hour as number, count: r.count as number })),
      deviceBreakdown: {
        mobile: (devices[0]?.mobile as number) || 0,
        desktop: (devices[0]?.desktop as number) || 0,
        tablet: (devices[0]?.tablet as number) || 0,
      },
      avgVisitsPerUser: uniqueVisitors > 0 ? Math.round((totalVisits / uniqueVisitors) * 10) / 10 : 0,
      conversionRate: uniqueVisitors > 0 ? Math.round((registeredUsers / uniqueVisitors) * 100) : 0,
      recentTrend: trend.map((r) => ({ date: r.date as string, visits: r.visits as number })),
    };
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      registeredUsers: 0,
      topPages: [],
      topReferrers: [],
      visitsByHour: [],
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
      avgVisitsPerUser: 0,
      conversionRate: 0,
      recentTrend: [],
    };
  }
}

/**
 * Remove visit records older than retentionDays (default 90).
 * Returns the number of deleted rows.
 */
export async function cleanupOldVisits(retentionDays: number = 90): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM "PageVisit"
      WHERE "createdAt" < NOW() - MAKE_INTERVAL(days => ${retentionDays})
    `;
    const deleted = (result as unknown as { count?: number }).count;
    return typeof deleted === 'number' ? deleted : 0;
  } catch (error) {
    console.error('[cleanupOldVisits] Failed:', error);
    return 0;
  }
}

/**
 * A4: Backfill owner traffic.
 * Marks PageVisit records from EXCLUDED_IP_HASHES as isInternal=true, isBot=true.
 * Also marks existing admin-user visits.
 */
export async function backfillOwnerTraffic(): Promise<number> {
  try {
    const excludedHashes = (process.env.EXCLUDED_IP_HASHES || '').split(',').filter(Boolean);
    let total = 0;

    if (excludedHashes.length > 0) {
      const r1 = await sql`
        UPDATE "PageVisit"
        SET "isBot" = TRUE, "isInternal" = TRUE
        WHERE "isInternal" = FALSE
          AND "ipHash" = ANY(${excludedHashes})
      `;
      total += (r1 as unknown as { count?: number }).count || 0;
    }

    // Also mark visits by admin users as internal
    const r2 = await sql`
      UPDATE "PageVisit" pv
      SET "isBot" = TRUE, "isInternal" = TRUE
      FROM "User" u
      WHERE pv."userId" = u."id"
        AND u."isAdmin" = TRUE
        AND pv."isInternal" = FALSE
    `;
    total += (r2 as unknown as { count?: number }).count || 0;

    return total;
  } catch (error) {
    console.error('[backfillOwnerTraffic] Failed:', error);
    return 0;
  }
}

// ── NotableVisitor Functions ─────────────────────

/**
 * Upsert a notable visitor record. If the ipHash already exists and is not dismissed,
 * update the score/reasons/summary and extend the expiry.
 */
export async function upsertNotableVisitor(
  ipHash: string,
  result: ScoringResult,
  summary: NotableVisitor['summary'],
): Promise<void> {
  try {

    const id = `nv_${ipHash}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO "NotableVisitor" ("id", "ipHash", "score", "reasons", "summary", "expiresAt")
      VALUES (${id}, ${ipHash}, ${result.score}, ${result.reasons}, ${JSON.stringify(summary)}, ${expiresAt})
      ON CONFLICT ("ipHash") DO UPDATE
        SET "score" = EXCLUDED."score",
            "reasons" = EXCLUDED."reasons",
            "summary" = EXCLUDED."summary",
            "expiresAt" = EXCLUDED."expiresAt",
            "detectedAt" = NOW(),
            "dismissed" = FALSE
      WHERE "NotableVisitor"."dismissed" = FALSE OR "NotableVisitor"."expiresAt" < NOW()
    `;
  } catch (error) {
    console.error('[upsertNotableVisitor] Failed:', error);
  }
}

/**
 * Retrieve active (non-expired, non-dismissed) notable visitors, ordered by score desc.
 */
export async function getNotableVisitors(): Promise<NotableVisitor[]> {
  try {

    const rows = await sql`
      SELECT "id", "ipHash", "score", "reasons", "summary", "detectedAt", "expiresAt", "dismissed"
      FROM "NotableVisitor"
      WHERE "expiresAt" > NOW()
        AND "dismissed" = FALSE
      ORDER BY "score" DESC, "detectedAt" DESC
      LIMIT 20
    `;
    return rows.map((r) => ({
      id: r.id as string,
      ipHash: r.ipHash as string,
      score: r.score as number,
      reasons: r.reasons as string[],
      summary: r.summary as NotableVisitor['summary'],
      detectedAt: r.detectedAt as string,
      expiresAt: r.expiresAt as string,
      dismissed: r.dismissed as boolean,
    }));
  } catch (err) {
    console.warn("[analytics-visits] query failed:", err);
    return [];
  }
}

/**
 * Dismiss a notable visitor (hide from the list, don't rescan).
 */
export async function dismissNotableVisitor(ipHash: string): Promise<void> {
  try {

    await sql`
      UPDATE "NotableVisitor" SET "dismissed" = TRUE WHERE "ipHash" = ${ipHash}
    `;
  } catch (error) {
    console.error('[dismissNotableVisitor] Failed:', error);
  }
}

/**
 * B3: Scan recent page visits and identify notable visitors.
 * Called from /api/admin/notable (POST) — triggered automatically by the admin panel.
 * Returns the number of new/updated notable visitor records.
 *
 * Batch query strategy (replaces N×3 per-IP round trips):
 *   Query 1 — candidate ipHashes (past 24h)
 *   Query 2 — all visits for all candidates (past 7 days, one ANY() query)
 *   Query 3 — batch admin check for all unique userIds
 *   Then score + upsert in a JS loop.
 */
export async function scanNotableVisitors(): Promise<number> {
  try {

    const { scoreVisitor } = await import('@/lib/analytics/notable-detection');

    const excludedHashes = (process.env.EXCLUDED_IP_HASHES || '').split(',').filter(Boolean);

    // Step 1: Get candidate ipHashes from the past 24h (non-bot, non-internal, not already tracked)
    const candidateRows = await sql`
      SELECT DISTINCT pv."ipHash"
      FROM "PageVisit" pv
      WHERE pv."createdAt" >= NOW() - INTERVAL '24 hours'
        AND pv."isBot" = FALSE
        AND COALESCE(pv."isInternal", FALSE) = FALSE
        AND pv."ipHash" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "NotableVisitor" nv
          WHERE nv."ipHash" = pv."ipHash"
            AND nv."dismissed" = FALSE
            AND nv."expiresAt" > NOW()
        )
    `;

    // Filter out explicitly excluded IPs
    const candidates = candidateRows
      .map((r) => r.ipHash as string)
      .filter((h) => !excludedHashes.includes(h));

    if (candidates.length === 0) {
      await sql`DELETE FROM "NotableVisitor" WHERE "expiresAt" < NOW()`;
      return 0;
    }

    // Step 2: Batch-fetch all visits for every candidate in the past 7 days (one query)
    const allVisitRows = await sql`
      SELECT "ipHash", "path", "country", "referer", "userId",
             "durationMs", "utmSource", "createdAt",
             "city", "deviceType", "userAgent"
      FROM "PageVisit"
      WHERE "ipHash" = ANY(${candidates})
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      ORDER BY "ipHash", "createdAt" ASC
    `;

    // Step 3: Group visits by ipHash in JavaScript
    const visitsByHash = new Map<string, typeof allVisitRows>();
    for (const row of allVisitRows) {
      const hash = row.ipHash as string;
      if (!visitsByHash.has(hash)) visitsByHash.set(hash, []);
      visitsByHash.get(hash)!.push(row);
    }

    // Step 4: Batch-check which userIds are admins (one query)
    const allUserIds = [
      ...new Set(
        allVisitRows.map((r) => r.userId as string | null).filter((id): id is string => !!id)
      ),
    ];
    const adminUserIds = new Set<string>();
    if (allUserIds.length > 0) {
      const adminRows = await sql`
        SELECT "id" FROM "User"
        WHERE "id" = ANY(${allUserIds})
          AND "isAdmin" = TRUE
      `;
      for (const r of adminRows) {
        adminUserIds.add(r.id as string);
      }
    }

    // Step 5: Score and upsert in JS loop (no more per-IP DB queries)
    let count = 0;
    for (const ipHash of candidates) {
      const visitRows = visitsByHash.get(ipHash);
      if (!visitRows || visitRows.length === 0) continue;

      // Skip if any visit belongs to an admin user
      const hasAdminUser = visitRows.some(
        (r) => r.userId && adminUserIds.has(r.userId as string)
      );
      if (hasAdminUser) continue;

      const visits = visitRows.map((r) => ({
        path: r.path as string,
        country: r.country as string | null,
        referer: r.referer as string | null,
        userId: r.userId as string | null,
        durationMs: r.durationMs as number | null,
        utmSource: r.utmSource as string | null,
        createdAt: r.createdAt as string,
      }));

      const result = scoreVisitor(visits);
      if (result.score >= 8) {
        const uniquePaths = [...new Set(visits.map((v) => v.path))] as string[];
        const deepPages = uniquePaths.filter((p) =>
          /\/(questionnaire|explore|quickdive|report|coaching)/.test(p)
        );
        const _maxDuration = Math.max(...visits.map((v) => v.durationMs ?? 0));

        // city/deviceType/userAgent come from the first visit row (already fetched in Step 2)
        const firstRow = visitRows[0];
        const summary: NotableVisitor['summary'] = {
          pageCount: uniquePaths.length,
          deepestPage: deepPages[deepPages.length - 1] ?? null,
          country: (visits[0]?.country as string | null) ?? null,
          city: (firstRow?.city as string | null) ?? null,
          deviceType: (firstRow?.deviceType as string | null) ?? null,
          userAgent: (firstRow?.userAgent as string | null) ?? null,
          firstSeen: visits[0]?.createdAt as string,
          lastSeen: visits[visits.length - 1]?.createdAt as string,
        };

        await upsertNotableVisitor(ipHash, result, summary);
        count++;
      }
    }

    // Clean up expired records
    await sql`DELETE FROM "NotableVisitor" WHERE "expiresAt" < NOW()`;

    return count;
  } catch (error) {
    console.error('[scanNotableVisitors] Failed:', error);
    return 0;
  }
}
