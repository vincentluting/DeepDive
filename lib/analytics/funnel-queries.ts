import { sql } from "@/lib/db/connection";

/**
 * Segmentation filters for funnel queries.
 * All filters are optional — null/undefined means "all".
 */
export interface FunnelFilters {
  language?: string | null;
  country?: string | null;
  device?: string | null; // 'mobile' | 'desktop'
  exploreMode?: string | null; // 'classic' | 'narrative' | 'immersive'
  researchGroup?: string | null; // 'classic' | 'immersive' | 'non-research'
}

/**
 * Returns event counts and unique identity counts for the past N days.
 *
 * Identity stitching: anonymous events (userId NULL) are resolved through
 * IdentityLink so a visitor who later registers counts as ONE identity,
 * not two. LATERAL + LIMIT 1 keeps one link per clientId (earliest link
 * wins) so the join can never multiply event rows.
 *
 * Admin exclusion is double-gated: the row-level isAdmin flag AND the
 * User.isAdmin column (catches events logged before the flag was stamped).
 */
export async function getFunnelStats(days: number = 30): Promise<
  {
    event: string;
    count: number;
    uniqueUsers: number;
  }[]
> {
  const rows = await sql`
    SELECT
      uf."event",
      COUNT(*)::int AS "count",
      COUNT(DISTINCT COALESCE(uf."userId", il."userId", uf."clientId"))::int AS "uniqueUsers"
    FROM "UserFunnel" uf
    LEFT JOIN LATERAL (
      SELECT l."userId"
      FROM "IdentityLink" l
      WHERE l."anonymousId" = uf."clientId"
      ORDER BY l."linkedAt" ASC
      LIMIT 1
    ) il ON uf."userId" IS NULL AND uf."clientId" IS NOT NULL
    WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      AND (uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "User" au
        WHERE au."id" = COALESCE(uf."userId", il."userId")
          AND au."isAdmin" = TRUE
      )
    GROUP BY uf."event"
    ORDER BY "count" DESC
  `;

  return rows.map((r) => ({
    event: r.event as string,
    count: r.count as number,
    uniqueUsers: r.uniqueUsers as number,
  }));
}

/** Core conversion funnel — linear progression from registration to coaching */
const FUNNEL_STEPS = [
  "registered",
  "quickdive_started",
  "quickdive_completed",
  "immersive_explore_started",
  "immersive_explore_completed",
  "deepdive_started",
  "deepdive_completed",
  "report_viewed",
  "report_reacted",
  "coaching_started",
] as const;

/** Engagement & exit events (not part of linear funnel, tracked for analytics) */
export const ENGAGEMENT_EVENTS = [
  "quickdive_abandoned",
  "deepdive_abandoned",
  "share_clicked",
  "intro_cta_clicked",
  "micro_feedback_shown",
] as const;

/** All tracked events combined */
export const ALL_FUNNEL_EVENTS = [
  ...FUNNEL_STEPS,
  ...ENGAGEMENT_EVENTS,
] as const;

/**
 * Returns the count of unique users who reached each funnel step
 * within the past N days. Useful for computing conversion rates
 * relative to the registered count.
 */
export async function getConversionRates(days: number = 30): Promise<{
  registered: number;
  quickdive_started: number;
  quickdive_completed: number;
  immersive_explore_started: number;
  immersive_explore_completed: number;
  deepdive_started: number;
  deepdive_completed: number;
  report_viewed: number;
  report_reacted: number;
  coaching_started: number;
}> {
  // Same identity-stitching + admin double-gate as getFunnelStats above.
  const rows = await sql`
    SELECT
      uf."event",
      COUNT(DISTINCT COALESCE(uf."userId", il."userId", uf."clientId"))::int AS "uniqueUsers"
    FROM "UserFunnel" uf
    LEFT JOIN LATERAL (
      SELECT l."userId"
      FROM "IdentityLink" l
      WHERE l."anonymousId" = uf."clientId"
      ORDER BY l."linkedAt" ASC
      LIMIT 1
    ) il ON uf."userId" IS NULL AND uf."clientId" IS NOT NULL
    WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      AND uf."event" = ANY(${FUNNEL_STEPS as unknown as string[]})
      AND (uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "User" au
        WHERE au."id" = COALESCE(uf."userId", il."userId")
          AND au."isAdmin" = TRUE
      )
    GROUP BY uf."event"
  `;

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.event as string] = row.uniqueUsers as number;
  }

  return {
    registered: map["registered"] ?? 0,
    quickdive_started: map["quickdive_started"] ?? 0,
    quickdive_completed: map["quickdive_completed"] ?? 0,
    immersive_explore_started: map["immersive_explore_started"] ?? 0,
    immersive_explore_completed: map["immersive_explore_completed"] ?? 0,
    deepdive_started: map["deepdive_started"] ?? 0,
    deepdive_completed: map["deepdive_completed"] ?? 0,
    report_viewed: map["report_viewed"] ?? 0,
    report_reacted: map["report_reacted"] ?? 0,
    coaching_started: map["coaching_started"] ?? 0,
  };
}

/**
 * Returns filtered conversion rates with optional segmentation.
 * JOINs against User, QuestionnaireSession, QuickDiveResult, PageVisit
 * as needed to apply filters.
 *
 * SEGMENTATION SEMANTICS — "by latest profile": language/device/exploreMode
 * filters classify each user by their MOST RECENT state, not their state at
 * event time. A user who switched zh→en mid-period counts under "en" for all
 * their events. Registered users only (anonymous rows have no profile).
 */
export async function getFilteredConversionRates(
  days: number = 30,
  filters: FunnelFilters = {},
): Promise<{
  registered: number;
  quickdive_started: number;
  quickdive_completed: number;
  immersive_explore_started: number;
  immersive_explore_completed: number;
  deepdive_started: number;
  deepdive_completed: number;
  report_viewed: number;
  report_reacted: number;
  coaching_started: number;
}> {
  const { language, country, device, exploreMode, researchGroup } = filters;

  // If no filters are applied, use the simpler query
  const hasFilters =
    language || country || device || exploreMode || researchGroup;
  if (!hasFilters) {
    return getConversionRates(days);
  }

  // Build filtered query with JOINs as needed
  // We join against User for country/researchGroup, QuestionnaireSession for language,
  // QuickDiveResult for exploreMode, PageVisit for device.
  // Identity stitching: anonymous-period events join their later account via
  // IdentityLink so segmented counts match the unfiltered query's semantics.
  const rows = await sql`
    SELECT
      uf."event",
      COUNT(DISTINCT COALESCE(uf."userId", il."userId"))::int AS "uniqueUsers"
    FROM "UserFunnel" uf
    LEFT JOIN LATERAL (
      SELECT l."userId"
      FROM "IdentityLink" l
      WHERE l."anonymousId" = uf."clientId"
      ORDER BY l."linkedAt" ASC
      LIMIT 1
    ) il ON uf."userId" IS NULL AND uf."clientId" IS NOT NULL
    INNER JOIN "User" u ON u."id" = COALESCE(uf."userId", il."userId")
    LEFT JOIN LATERAL (
      SELECT qs."language"
      FROM "QuestionnaireSession" qs
      WHERE qs."userId" = u."id"
      ORDER BY qs."createdAt" DESC
      LIMIT 1
    ) qs_lang ON true
    LEFT JOIN LATERAL (
      SELECT qdr."exploreMode"
      FROM "QuickDiveResult" qdr
      WHERE qdr."userId" = u."id"
      ORDER BY qdr."createdAt" DESC
      LIMIT 1
    ) qd_mode ON true
    LEFT JOIN LATERAL (
      SELECT pv."deviceType"
      FROM "PageVisit" pv
      WHERE pv."userId" = u."id" AND pv."deviceType" IS NOT NULL
      ORDER BY pv."createdAt" DESC
      LIMIT 1
    ) pv_dev ON true
    WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      AND uf."event" = ANY(${FUNNEL_STEPS as unknown as string[]})
      AND (uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL)
      AND u."isAdmin" = FALSE
      AND (${language}::text IS NULL OR qs_lang."language" = ${language})
      AND (${country}::text IS NULL OR u."registrationCountry" = ${country})
      AND (${device}::text IS NULL OR LOWER(pv_dev."deviceType") = LOWER(${device}))
      AND (${exploreMode}::text IS NULL OR qd_mode."exploreMode" = ${exploreMode})
      AND (
        ${researchGroup}::text IS NULL
        OR (${researchGroup} = 'non-research' AND u."researchGroup" IS NULL)
        OR (${researchGroup} != 'non-research' AND u."researchGroup" = ${researchGroup})
      )
    GROUP BY uf."event"
  `;

  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.event as string] = row.uniqueUsers as number;
  }

  return {
    registered: map["registered"] ?? 0,
    quickdive_started: map["quickdive_started"] ?? 0,
    quickdive_completed: map["quickdive_completed"] ?? 0,
    immersive_explore_started: map["immersive_explore_started"] ?? 0,
    immersive_explore_completed: map["immersive_explore_completed"] ?? 0,
    deepdive_started: map["deepdive_started"] ?? 0,
    deepdive_completed: map["deepdive_completed"] ?? 0,
    report_viewed: map["report_viewed"] ?? 0,
    report_reacted: map["report_reacted"] ?? 0,
    coaching_started: map["coaching_started"] ?? 0,
  };
}

/**
 * Median time between consecutive funnel steps (in minutes).
 * Returns an array of { from, to, medianMinutes } for each adjacent step pair.
 */
export async function getFunnelStepTiming(days: number = 30): Promise<
  {
    from: string;
    to: string;
    medianMinutes: number | null;
  }[]
> {
  const stepPairs = [
    ["registered", "quickdive_started"],
    ["quickdive_started", "quickdive_completed"],
    ["quickdive_completed", "deepdive_started"],
    ["deepdive_started", "deepdive_completed"],
    ["deepdive_completed", "report_viewed"],
    ["report_viewed", "report_reacted"],
    ["report_reacted", "coaching_started"],
  ] as const;

  // Get min timestamp per stitched identity per event in one query.
  // Same IdentityLink stitching + admin double-gate as getFunnelStats —
  // anonymous-period events count toward the user's step timing, and
  // admin events are excluded even when the row-level flag was missed.
  const rows = await sql`
    SELECT
      COALESCE(uf."userId", il."userId") AS "userId",
      uf."event",
      MIN(uf."createdAt") AS "firstAt"
    FROM "UserFunnel" uf
    LEFT JOIN LATERAL (
      SELECT l."userId"
      FROM "IdentityLink" l
      WHERE l."anonymousId" = uf."clientId"
      ORDER BY l."linkedAt" ASC
      LIMIT 1
    ) il ON uf."userId" IS NULL AND uf."clientId" IS NOT NULL
    WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      AND uf."event" = ANY(${FUNNEL_STEPS as unknown as string[]})
      AND COALESCE(uf."userId", il."userId") IS NOT NULL
      AND (uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "User" au
        WHERE au."id" = COALESCE(uf."userId", il."userId")
          AND au."isAdmin" = TRUE
      )
    GROUP BY COALESCE(uf."userId", il."userId"), uf."event"
  `;

  // Build user→event→firstAt map
  const userEventMap = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const userId = row.userId as string;
    const event = row.event as string;
    const ts = new Date(row.firstAt as string).getTime();
    if (!userEventMap.has(userId)) {
      userEventMap.set(userId, new Map());
    }
    userEventMap.get(userId)!.set(event, ts);
  }

  // Compute median for each step pair
  return stepPairs.map(([from, to]) => {
    const diffs: number[] = [];
    for (const [, eventMap] of userEventMap) {
      const fromTs = eventMap.get(from);
      const toTs = eventMap.get(to);
      if (fromTs !== undefined && toTs !== undefined && toTs > fromTs) {
        diffs.push((toTs - fromTs) / 60_000); // convert to minutes
      }
    }

    if (diffs.length === 0) return { from, to, medianMinutes: null };

    diffs.sort((a, b) => a - b);
    const mid = Math.floor(diffs.length / 2);
    const median =
      diffs.length % 2 === 0 ? (diffs[mid - 1] + diffs[mid]) / 2 : diffs[mid];

    return { from, to, medianMinutes: Math.round(median * 10) / 10 };
  });
}

/**
 * Get distinct filter option values for the funnel segmentation dropdowns.
 */
export async function getFunnelFilterOptions(days: number = 30): Promise<{
  languages: string[];
  countries: string[];
  devices: string[];
  exploreModes: string[];
}> {
  const [langRows, countryRows, deviceRows, modeRows] = await Promise.all([
    sql`
      SELECT DISTINCT qs."language"
      FROM "QuestionnaireSession" qs
      WHERE qs."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND qs."language" IS NOT NULL
      ORDER BY qs."language"
    `,
    sql`
      SELECT DISTINCT u."registrationCountry"
      FROM "User" u
      WHERE u."registrationCountry" IS NOT NULL
        AND u."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days * 2})
      ORDER BY u."registrationCountry"
    `,
    sql`
      SELECT DISTINCT pv."deviceType"
      FROM "PageVisit" pv
      WHERE pv."deviceType" IS NOT NULL
        AND pv."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      ORDER BY pv."deviceType"
    `,
    sql`
      SELECT DISTINCT qdr."exploreMode"
      FROM "QuickDiveResult" qdr
      WHERE qdr."exploreMode" IS NOT NULL
        AND qdr."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days * 2})
      ORDER BY qdr."exploreMode"
    `,
  ]);

  return {
    languages: langRows.map((r) => r.language as string),
    countries: countryRows.map((r) => r.registrationCountry as string),
    devices: deviceRows.map((r) => r.deviceType as string),
    exploreModes: modeRows.map((r) => r.exploreMode as string),
  };
}
