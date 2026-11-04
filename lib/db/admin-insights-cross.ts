// ============================================================
// Admin Insights — Cross-analysis queries for Insights Tab
//
// Tables: UserFunnel, User, ReportNPS, ReportEngagement,
//         QuickDiveResult, AssessmentResult, CoachingSession,
//         QuestionnaireSession
//
// Provides: weekly KPIs, funnel loss spotlight, super user
//           identification, A/B test full-funnel comparison.
// ============================================================

import { sql } from "./connection";
import { getFilteredConversionRates } from "@/lib/analytics/funnel-queries";
import {
  getCohortRetention,
  type CohortRetentionMatrix,
} from "./analytics-materialized";
import {
  chiSquare2x2,
  cohenH,
  significanceLabel,
  pairedTTest,
  cohenDPaired,
  effectSizeLabel,
} from "@/lib/admin/statistics";
import { getPrePostPairedData } from "./admin-insights";

// ── Types ────────────────────────────────────────────────────

export interface WeeklyKPIs {
  fullFunnelRate: number; // coaching_started / registered (%)
  medianReportTimeMs: number | null;
  coachingStartRate: number; // coaching_started / report_viewed (%)
  npsAvg: number;
  npsCount: number;
  weekOverWeek: {
    fullFunnelDelta: number | null; // percentage point change
    reportTimeDelta: number | null; // ms change
    coachingDelta: number | null;
    npsDelta: number | null;
  };
}

export interface FunnelLossStep {
  step: string;
  nextStep: string;
  fromCount: number;
  toCount: number;
  lossRate: number; // %
  lostUserArchetypes: { type: string; count: number }[];
}

export interface SuperUserProfile {
  users: {
    id: string;
    email: string;
    archetype: string | null;
    language: string | null;
    country: string | null;
    nps: number;
    reportTimeMs: number;
    coachingRounds: number;
  }[];
  profile: {
    topArchetypes: { type: string; count: number }[];
    topCountries: { country: string; count: number }[];
    topLanguages: { language: string; count: number }[];
  };
}

export interface ABTestResult {
  classic: Record<string, number>;
  immersive: Record<string, number>;
  classicTotal: number;
  immersiveTotal: number;
  tests: {
    step: string;
    classicRate: number;
    immersiveRate: number;
    chiSq: number;
    pValue: number;
    effectSizeH: number;
    significance: "significant" | "marginal" | "not_significant";
  }[];
}

// ── Funnel step constants ────────────────────────────────────

const FUNNEL_STEPS = [
  "registered",
  "quickdive_started",
  "quickdive_completed",
  "deepdive_started",
  "deepdive_completed",
  "report_viewed",
  "coaching_started",
] as const;

const STEP_PAIRS: [string, string][] = FUNNEL_STEPS.slice(0, -1).map((s, i) => [
  s,
  FUNNEL_STEPS[i + 1],
]);

// ── 1. Weekly KPIs ───────────────────────────────────────────

export async function getWeeklyKPIs(): Promise<WeeklyKPIs> {
  try {
    // Current week and previous week funnel rates
    const [
      thisWeek,
      lastWeek,
      npsThis,
      npsLast,
      engagementThis,
      engagementLast,
    ] = await Promise.all([
      getFilteredConversionRates(7),
      getFilteredConversionRates(14), // we'll subtract
      sql`
          SELECT AVG("score")::numeric AS "avg", COUNT(*)::int AS "cnt"
          FROM "ReportNPS"
          WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        `,
      sql`
          SELECT AVG("score")::numeric AS "avg", COUNT(*)::int AS "cnt"
          FROM "ReportNPS"
          WHERE "createdAt" >= NOW() - INTERVAL '14 days'
            AND "createdAt" < NOW() - INTERVAL '7 days'
        `,
      sql`
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "totalTimeMs") AS "median"
          FROM "ReportEngagement"
          WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        `,
      sql`
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "totalTimeMs") AS "median"
          FROM "ReportEngagement"
          WHERE "createdAt" >= NOW() - INTERVAL '14 days'
            AND "createdAt" < NOW() - INTERVAL '7 days'
        `,
    ]);

    // Compute this-week KPIs
    const registered = thisWeek.registered || 0;
    const reportViewed = thisWeek.report_viewed || 0;
    const coachingStarted = thisWeek.coaching_started || 0;

    const fullFunnelRate =
      registered > 0
        ? Math.round((coachingStarted / registered) * 1000) / 10
        : 0;
    const coachingStartRate =
      reportViewed > 0
        ? Math.round((coachingStarted / reportViewed) * 1000) / 10
        : 0;

    const npsAvg =
      npsThis[0]?.avg != null
        ? Math.round(Number(npsThis[0].avg) * 10) / 10
        : 0;
    const npsCount = (npsThis[0]?.cnt as number) || 0;

    const medianReportTimeMs =
      engagementThis[0]?.median != null
        ? Math.round(Number(engagementThis[0].median))
        : null;

    // Compute last-week KPIs for delta
    // lastWeek covers 14 days total — we need only the 7-14 day window
    // For simplicity, use the raw lastWeek query which is already the previous week
    const lastRegistered = lastWeek.registered || 0;
    const lastReportViewed = lastWeek.report_viewed || 0;
    const lastCoaching = lastWeek.coaching_started || 0;

    const lastFullFunnel =
      lastRegistered > 0
        ? Math.round((lastCoaching / lastRegistered) * 1000) / 10
        : 0;
    const lastCoachingRate =
      lastReportViewed > 0
        ? Math.round((lastCoaching / lastReportViewed) * 1000) / 10
        : 0;
    const lastNps =
      npsLast[0]?.avg != null
        ? Math.round(Number(npsLast[0].avg) * 10) / 10
        : 0;
    const lastMedian =
      engagementLast[0]?.median != null
        ? Math.round(Number(engagementLast[0].median))
        : null;

    return {
      fullFunnelRate,
      medianReportTimeMs,
      coachingStartRate,
      npsAvg,
      npsCount,
      weekOverWeek: {
        fullFunnelDelta:
          registered > 0 && lastRegistered > 0
            ? Math.round((fullFunnelRate - lastFullFunnel) * 10) / 10
            : null,
        reportTimeDelta:
          medianReportTimeMs != null && lastMedian != null
            ? medianReportTimeMs - lastMedian
            : null,
        coachingDelta:
          reportViewed > 0 && lastReportViewed > 0
            ? Math.round((coachingStartRate - lastCoachingRate) * 10) / 10
            : null,
        npsDelta:
          npsCount > 0 && (npsLast[0]?.cnt as number) > 0
            ? Math.round((npsAvg - lastNps) * 10) / 10
            : null,
      },
    };
  } catch (error) {
    console.error("getWeeklyKPIs error:", error);
    return {
      fullFunnelRate: 0,
      medianReportTimeMs: null,
      coachingStartRate: 0,
      npsAvg: 0,
      npsCount: 0,
      weekOverWeek: {
        fullFunnelDelta: null,
        reportTimeDelta: null,
        coachingDelta: null,
        npsDelta: null,
      },
    };
  }
}

// ── 2. Funnel Loss Spotlight ─────────────────────────────────

export async function getFunnelLossSpotlight(
  days: number = 30,
): Promise<FunnelLossStep[]> {
  try {
    // Get per-user per-event presence in one query
    const rows = await sql`
      SELECT
        uf."userId",
        uf."event"
      FROM "UserFunnel" uf
      WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND uf."event" = ANY(${FUNNEL_STEPS as unknown as string[]})
        AND uf."userId" IS NOT NULL
      GROUP BY uf."userId", uf."event"
    `;

    // Build user→events set
    const userEvents = new Map<string, Set<string>>();
    for (const row of rows) {
      const userId = row.userId as string;
      const event = row.event as string;
      if (!userEvents.has(userId)) userEvents.set(userId, new Set());
      userEvents.get(userId)!.add(event);
    }

    // Get archetype data for all users (for loss breakdown)
    const archetypeRows = await sql`
      SELECT
        u."id" AS "userId",
        COALESCE(
          ar."resultJson"::jsonb->'archetype'->>'type',
          qdr."archetypeLabel"
        ) AS "archetype"
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT ar."resultJson"
        FROM "AssessmentResult" ar
        WHERE ar."userId" = u."id"
        ORDER BY ar."createdAt" DESC
        LIMIT 1
      ) ar ON true
      LEFT JOIN LATERAL (
        SELECT qdr."archetypeLabel"
        FROM "QuickDiveResult" qdr
        WHERE qdr."userId" = u."id"
        ORDER BY qdr."createdAt" DESC
        LIMIT 1
      ) qdr ON true
      WHERE u."id" = ANY(${Array.from(userEvents.keys())})
    `;

    const userArchetype = new Map<string, string>();
    for (const row of archetypeRows) {
      if (row.archetype) {
        userArchetype.set(row.userId as string, row.archetype as string);
      }
    }

    // Compute loss per step pair
    return STEP_PAIRS.map(([from, to]) => {
      const fromUsers = new Set<string>();
      const toUsers = new Set<string>();

      for (const [userId, events] of userEvents) {
        if (events.has(from)) fromUsers.add(userId);
        if (events.has(to)) toUsers.add(userId);
      }

      const lostUsers = new Set<string>();
      for (const userId of fromUsers) {
        if (!toUsers.has(userId)) lostUsers.add(userId);
      }

      // Count archetypes among lost users
      const archetypeCounts = new Map<string, number>();
      for (const userId of lostUsers) {
        const archetype = userArchetype.get(userId);
        if (archetype) {
          archetypeCounts.set(
            archetype,
            (archetypeCounts.get(archetype) || 0) + 1,
          );
        }
      }

      const lostUserArchetypes = Array.from(archetypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const fromCount = fromUsers.size;
      const toCount = toUsers.size;
      const lossRate =
        fromCount > 0
          ? Math.round(((fromCount - toCount) / fromCount) * 1000) / 10
          : 0;

      return {
        step: from,
        nextStep: to,
        fromCount,
        toCount,
        lossRate,
        lostUserArchetypes,
      };
    });
  } catch (error) {
    console.error("getFunnelLossSpotlight error:", error);
    return [];
  }
}

// ── 3. Super Users ───────────────────────────────────────────

export async function getSuperUsers(): Promise<SuperUserProfile> {
  try {
    // Super users: completed full funnel + NPS ≥ 8 + report engagement > 2min
    const rows = await sql`
      SELECT
        u."id",
        u."email",
        u."registrationCountry" AS "country",
        nps."score" AS "nps",
        re."totalTimeMs" AS "reportTimeMs",
        COALESCE(cs."rounds", 0)::int AS "coachingRounds",
        COALESCE(
          ar."resultJson"::jsonb->'archetype'->>'type',
          qdr."archetypeLabel"
        ) AS "archetype",
        qs."language"
      FROM "User" u
      INNER JOIN "ReportNPS" nps ON nps."userId" = u."id" AND nps."score" >= 8
      INNER JOIN "ReportEngagement" re ON re."userId" = u."id" AND re."totalTimeMs" > 120000
      INNER JOIN "UserFunnel" uf_coach
        ON uf_coach."userId" = u."id" AND uf_coach."event" = 'coaching_started'
      LEFT JOIN LATERAL (
        SELECT ar."resultJson"
        FROM "AssessmentResult" ar
        WHERE ar."userId" = u."id"
        ORDER BY ar."createdAt" DESC
        LIMIT 1
      ) ar ON true
      LEFT JOIN LATERAL (
        SELECT qdr."archetypeLabel"
        FROM "QuickDiveResult" qdr
        WHERE qdr."userId" = u."id"
        ORDER BY qdr."createdAt" DESC
        LIMIT 1
      ) qdr ON true
      LEFT JOIN LATERAL (
        SELECT qs."language"
        FROM "QuestionnaireSession" qs
        WHERE qs."userId" = u."id"
        ORDER BY qs."createdAt" DESC
        LIMIT 1
      ) qs ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "rounds"
        FROM "CoachingSession" cs
        WHERE cs."userId" = u."id"
      ) cs ON true
      ORDER BY nps."score" DESC, re."totalTimeMs" DESC
      LIMIT 50
    `;

    const users = rows.map((r) => ({
      id: r.id as string,
      email: r.email as string,
      archetype: (r.archetype as string) || null,
      language: (r.language as string) || null,
      country: (r.country as string) || null,
      nps: r.nps as number,
      reportTimeMs: r.reportTimeMs as number,
      coachingRounds: r.coachingRounds as number,
    }));

    // Aggregate profile
    const archetypeCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();

    for (const u of users) {
      if (u.archetype)
        archetypeCounts.set(
          u.archetype,
          (archetypeCounts.get(u.archetype) || 0) + 1,
        );
      if (u.country)
        countryCounts.set(u.country, (countryCounts.get(u.country) || 0) + 1);
      if (u.language)
        languageCounts.set(
          u.language,
          (languageCounts.get(u.language) || 0) + 1,
        );
    }

    const topN = (map: Map<string, number>, key: string) =>
      Array.from(map.entries())
        .map(([v, count]) => ({ [key]: v, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
      users,
      profile: {
        topArchetypes: topN(archetypeCounts, "type") as {
          type: string;
          count: number;
        }[],
        topCountries: topN(countryCounts, "country") as {
          country: string;
          count: number;
        }[],
        topLanguages: topN(languageCounts, "language") as {
          language: string;
          count: number;
        }[],
      },
    };
  } catch (error) {
    console.error("getSuperUsers error:", error);
    return {
      users: [],
      profile: { topArchetypes: [], topCountries: [], topLanguages: [] },
    };
  }
}

// ── 4. A/B Test Full Funnel ──────────────────────────────────

export async function getABTestFullFunnel(
  days: number = 30,
): Promise<ABTestResult> {
  try {
    const [classic, immersive] = await Promise.all([
      getFilteredConversionRates(days, { researchGroup: "classic" }),
      getFilteredConversionRates(days, { researchGroup: "immersive" }),
    ]);

    const classicTotal = classic.registered || 0;
    const immersiveTotal = immersive.registered || 0;

    // Run chi-square test per step
    const tests = FUNNEL_STEPS.filter((s) => s !== "registered").map((step) => {
      const cReached = classic[step as keyof typeof classic] || 0;
      const iReached = immersive[step as keyof typeof immersive] || 0;
      const cNotReached = Math.max(0, classicTotal - cReached);
      const iNotReached = Math.max(0, immersiveTotal - iReached);

      // 2×2 table: [reached-classic, reached-immersive, notReached-classic, notReached-immersive]
      const { chiSq, pValue } = chiSquare2x2(
        cReached,
        iReached,
        cNotReached,
        iNotReached,
      );

      const classicRate =
        classicTotal > 0
          ? Math.round((cReached / classicTotal) * 1000) / 10
          : 0;
      const immersiveRate =
        immersiveTotal > 0
          ? Math.round((iReached / immersiveTotal) * 1000) / 10
          : 0;

      const effectSizeH = cohenH(
        classicTotal > 0 ? cReached / classicTotal : 0,
        immersiveTotal > 0 ? iReached / immersiveTotal : 0,
      );

      return {
        step,
        classicRate,
        immersiveRate,
        chiSq,
        pValue,
        effectSizeH,
        significance: significanceLabel(pValue),
      };
    });

    return {
      classic: classic as unknown as Record<string, number>,
      immersive: immersive as unknown as Record<string, number>,
      classicTotal,
      immersiveTotal,
      tests,
    };
  } catch (error) {
    console.error("getABTestFullFunnel error:", error);
    return {
      classic: {},
      immersive: {},
      classicTotal: 0,
      immersiveTotal: 0,
      tests: [],
    };
  }
}

// ── 5. Cohort Retention (reuse materialized view) ────────────

export async function getCohortRetentionForInsights(): Promise<CohortRetentionMatrix> {
  return getCohortRetention();
}

// ── 6. UTM Channel Attribution ───────────────────────────────

export interface ChannelAttribution {
  channel: string; // utmSource or "(direct)"
  campaign: string | null;
  visitors: number; // unique ipHash count
  registered: number;
  quickdiveCompleted: number;
  deepdiveCompleted: number;
  reportViewed: number;
  coachingStarted: number;
  avgNps: number | null;
  fullFunnelRate: number; // coaching_started / registered %
}

export interface UTMAttributionResult {
  channels: ChannelAttribution[];
  totalAttributed: number; // users with UTM
  totalDirect: number; // users without UTM
}

export async function getUTMAttribution(
  days: number = 90,
): Promise<UTMAttributionResult> {
  try {
    // Step 1: For each user, find their first UTM-tagged visit (first-touch attribution)
    // Then join to UserFunnel for funnel depth + ReportNPS for satisfaction
    const rows = await sql`
      WITH first_touch AS (
        SELECT DISTINCT ON ("userId")
          "userId",
          COALESCE("utmSource", '(direct)') AS "channel",
          "utmCampaign" AS "campaign"
        FROM "PageVisit"
        WHERE "userId" IS NOT NULL
          AND "isBot" = FALSE
          AND "isInternal" = FALSE
          AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        ORDER BY "userId", "createdAt" ASC
      ),
      user_funnel_agg AS (
        SELECT
          uf."userId",
          BOOL_OR(uf."event" = 'registered') AS "has_registered",
          BOOL_OR(uf."event" = 'quickdive_completed') AS "has_qd",
          BOOL_OR(uf."event" = 'deepdive_completed') AS "has_dd",
          BOOL_OR(uf."event" = 'report_viewed') AS "has_report",
          BOOL_OR(uf."event" = 'coaching_started') AS "has_coaching"
        FROM "UserFunnel" uf
        WHERE uf."userId" IS NOT NULL
        GROUP BY uf."userId"
      ),
      user_nps AS (
        SELECT DISTINCT ON ("userId")
          "userId", "score"
        FROM "ReportNPS"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      )
      SELECT
        ft."channel",
        ft."campaign",
        COUNT(DISTINCT ft."userId")::int AS "visitors",
        COUNT(DISTINCT CASE WHEN ufa."has_registered" THEN ft."userId" END)::int AS "registered",
        COUNT(DISTINCT CASE WHEN ufa."has_qd" THEN ft."userId" END)::int AS "qd",
        COUNT(DISTINCT CASE WHEN ufa."has_dd" THEN ft."userId" END)::int AS "dd",
        COUNT(DISTINCT CASE WHEN ufa."has_report" THEN ft."userId" END)::int AS "report",
        COUNT(DISTINCT CASE WHEN ufa."has_coaching" THEN ft."userId" END)::int AS "coaching",
        ROUND(AVG(un."score")::numeric, 1) AS "avgNps"
      FROM first_touch ft
      LEFT JOIN user_funnel_agg ufa ON ufa."userId" = ft."userId"
      LEFT JOIN user_nps un ON un."userId" = ft."userId"
      GROUP BY ft."channel", ft."campaign"
      ORDER BY "visitors" DESC
      LIMIT 30
    `;

    const channels: ChannelAttribution[] = rows.map((r) => {
      const registered = (r.registered as number) || 0;
      const coaching = (r.coaching as number) || 0;
      return {
        channel: r.channel as string,
        campaign: (r.campaign as string) || null,
        visitors: (r.visitors as number) || 0,
        registered,
        quickdiveCompleted: (r.qd as number) || 0,
        deepdiveCompleted: (r.dd as number) || 0,
        reportViewed: (r.report as number) || 0,
        coachingStarted: coaching,
        avgNps: r.avgNps != null ? Number(r.avgNps) : null,
        fullFunnelRate:
          registered > 0 ? Math.round((coaching / registered) * 1000) / 10 : 0,
      };
    });

    const totalAttributed = channels
      .filter((c) => c.channel !== "(direct)")
      .reduce((s, c) => s + c.visitors, 0);
    const totalDirect = channels
      .filter((c) => c.channel === "(direct)")
      .reduce((s, c) => s + c.visitors, 0);

    return { channels, totalAttributed, totalDirect };
  } catch (error) {
    console.error("getUTMAttribution error:", error);
    return { channels: [], totalAttributed: 0, totalDirect: 0 };
  }
}

// ── 7. Funnel Bottleneck Diagnosis ──────────────────────────

export interface BottleneckSegment {
  label: string;
  lossRate: number;
  count: number;
}

export interface BottleneckDiagnosis {
  worstStep: { from: string; to: string };
  segments: BottleneckSegment[];
  baselineLossRate: number;
  worst: {
    label: string;
    lossRate: number;
    riskRatio: number;
    count: number;
  };
  interpretation: { en: string; zh: string };
}

export async function getFunnelBottleneckDiagnosis(
  days: number = 30,
): Promise<BottleneckDiagnosis | null> {
  try {
    // Step 1: Get funnel loss data to identify worst step
    const lossSteps = await getFunnelLossSpotlight(days);
    if (lossSteps.length === 0) return null;

    const worst = lossSteps.reduce((a, b) =>
      b.lossRate > a.lossRate && b.fromCount >= 5 ? b : a,
    );
    if (worst.lossRate === 0 || worst.fromCount < 5) return null;

    // Step 2: Get user-level segment data for the worst step
    const rows = await sql`
      WITH step_users AS (
        SELECT DISTINCT uf."userId"
        FROM "UserFunnel" uf
        WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
          AND uf."event" = ${worst.step}
          AND uf."userId" IS NOT NULL
      ),
      next_step_users AS (
        SELECT DISTINCT uf."userId"
        FROM "UserFunnel" uf
        WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
          AND uf."event" = ${worst.nextStep}
          AND uf."userId" IS NOT NULL
      ),
      user_segments AS (
        SELECT
          su."userId",
          CASE WHEN nsu."userId" IS NULL THEN TRUE ELSE FALSE END AS "dropped",
          COALESCE(
            ar."resultJson"::jsonb->'archetype'->>'type',
            qdr."archetypeLabel",
            'unknown'
          ) AS "archetype",
          COALESCE(qs."language", 'en') AS "language"
        FROM step_users su
        LEFT JOIN next_step_users nsu ON nsu."userId" = su."userId"
        LEFT JOIN LATERAL (
          SELECT ar."resultJson"
          FROM "AssessmentResult" ar
          WHERE ar."userId" = su."userId"
          ORDER BY ar."createdAt" DESC
          LIMIT 1
        ) ar ON true
        LEFT JOIN LATERAL (
          SELECT qdr."archetypeLabel"
          FROM "QuickDiveResult" qdr
          WHERE qdr."userId" = su."userId"
          ORDER BY qdr."createdAt" DESC
          LIMIT 1
        ) qdr ON true
        LEFT JOIN LATERAL (
          SELECT qs."language"
          FROM "QuestionnaireSession" qs
          WHERE qs."userId" = su."userId"
          ORDER BY qs."createdAt" DESC
          LIMIT 1
        ) qs ON true
      )
      SELECT
        "archetype",
        "language",
        COUNT(*)::int AS "total",
        SUM(CASE WHEN "dropped" THEN 1 ELSE 0 END)::int AS "lost"
      FROM user_segments
      GROUP BY "archetype", "language"
      HAVING COUNT(*) >= 3
      ORDER BY SUM(CASE WHEN "dropped" THEN 1 ELSE 0 END)::float / COUNT(*) DESC
    `;

    if (rows.length === 0) return null;

    const baselineLossRate = worst.lossRate;
    const segments: BottleneckSegment[] = rows.slice(0, 5).map((r) => ({
      label: `${r.archetype} · ${r.language}`,
      lossRate:
        Math.round(((r.lost as number) / (r.total as number)) * 1000) / 10,
      count: r.total as number,
    }));

    // Find the segment with highest risk ratio (need n≥5 and ratio≥1.5)
    let worstSegment: {
      label: string;
      lossRate: number;
      riskRatio: number;
      count: number;
    } | null = null;
    for (const r of rows) {
      const total = r.total as number;
      const lost = r.lost as number;
      if (total < 5) continue;
      const segRate = Math.round((lost / total) * 1000) / 10;
      const ratio = baselineLossRate > 0 ? segRate / baselineLossRate : 0;
      if (ratio >= 1.5 && (!worstSegment || ratio > worstSegment.riskRatio)) {
        worstSegment = {
          label: `${r.archetype} · ${r.language}`,
          lossRate: segRate,
          riskRatio: Math.round(ratio * 10) / 10,
          count: total,
        };
      }
    }

    if (!worstSegment) return null;

    // Step 3: Generate bilingual interpretation
    const stepEn = STEP_LABEL_MAP[worst.step] || worst.step;
    const nextStepEn = STEP_LABEL_MAP[worst.nextStep] || worst.nextStep;
    const stepZh = STEP_LABEL_MAP_ZH[worst.step] || worst.step;
    const nextStepZh = STEP_LABEL_MAP_ZH[worst.nextStep] || worst.nextStep;

    const interpretation = {
      en: `"${worstSegment.label}" users drop off ${worstSegment.riskRatio}x more at ${stepEn} → ${nextStepEn} (n=${worstSegment.count}). Consider reviewing the ${nextStepEn.toLowerCase()} experience for this segment.`,
      zh: `"${worstSegment.label}" 用户在 ${stepZh} → ${nextStepZh} 阶段流失率是平均的 ${worstSegment.riskRatio} 倍（n=${worstSegment.count}），建议检查该群体的${nextStepZh}体验。`,
    };

    return {
      worstStep: { from: worst.step, to: worst.nextStep },
      segments,
      baselineLossRate,
      worst: worstSegment,
      interpretation,
    };
  } catch (error) {
    console.error("getFunnelBottleneckDiagnosis error:", error);
    return null;
  }
}

// Step label mappings for interpretation templates
const STEP_LABEL_MAP: Record<string, string> = {
  registered: "Registration",
  quickdive_started: "Quick Dive Start",
  quickdive_completed: "Quick Dive Completion",
  deepdive_started: "Deep Dive Start",
  deepdive_completed: "Deep Dive Completion",
  report_viewed: "Report Viewed",
  coaching_started: "Coaching Start",
};

const STEP_LABEL_MAP_ZH: Record<string, string> = {
  registered: "注册",
  quickdive_started: "快速探索开始",
  quickdive_completed: "快速探索完成",
  deepdive_started: "深度探索开始",
  deepdive_completed: "深度探索完成",
  report_viewed: "查看报告",
  coaching_started: "开始教练",
};

// ── 8. A/B Trend Analysis ───────────────────────────────────

export interface ABTrendPoint {
  week: string;
  classicRate: number;
  immersiveRate: number;
  classicN: number;
  immersiveN: number;
}

export interface ABTrendAnalysis {
  points: ABTrendPoint[];
  inflection?: {
    week: string;
    type: "immersive_ahead" | "classic_ahead" | "converging";
  };
  latestGap: number;
  interpretation: { en: string; zh: string };
}

export async function getABTrendAnalysis(
  days: number = 90,
): Promise<ABTrendAnalysis> {
  try {
    const rows = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('week', uf."createdAt"), 'IYYY-"W"IW') AS "week",
        u."researchGroup" AS "group",
        COUNT(DISTINCT CASE WHEN uf."event" = 'registered' THEN uf."userId" END)::int AS "registered",
        COUNT(DISTINCT CASE WHEN uf."event" = 'report_viewed' THEN uf."userId" END)::int AS "reported"
      FROM "UserFunnel" uf
      JOIN "User" u ON u."id" = uf."userId"
      WHERE uf."createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND uf."userId" IS NOT NULL
        AND u."researchGroup" IN ('classic', 'immersive')
        AND uf."event" IN ('registered', 'report_viewed')
      GROUP BY "week", u."researchGroup"
      ORDER BY "week" ASC
    `;

    // Build weekly data
    const weekMap = new Map<
      string,
      {
        classicReg: number;
        classicReport: number;
        immersiveReg: number;
        immersiveReport: number;
      }
    >();

    for (const r of rows) {
      const week = r.week as string;
      const group = r.group as string;
      if (!weekMap.has(week)) {
        weekMap.set(week, {
          classicReg: 0,
          classicReport: 0,
          immersiveReg: 0,
          immersiveReport: 0,
        });
      }
      const entry = weekMap.get(week)!;
      if (group === "classic") {
        entry.classicReg = r.registered as number;
        entry.classicReport = r.reported as number;
      } else {
        entry.immersiveReg = r.registered as number;
        entry.immersiveReport = r.reported as number;
      }
    }

    const points: ABTrendPoint[] = Array.from(weekMap.entries()).map(
      ([week, d]) => ({
        week,
        classicRate:
          d.classicReg > 0
            ? Math.round((d.classicReport / d.classicReg) * 1000) / 10
            : 0,
        immersiveRate:
          d.immersiveReg > 0
            ? Math.round((d.immersiveReport / d.immersiveReg) * 1000) / 10
            : 0,
        classicN: d.classicReg,
        immersiveN: d.immersiveReg,
      }),
    );

    // Inflection detection: find first point where gap sign changes for 2+ consecutive weeks
    let inflection: ABTrendAnalysis["inflection"] = undefined;
    const gaps = points.map((p) => p.immersiveRate - p.classicRate);

    for (let i = 1; i < gaps.length - 1; i++) {
      const prevSign = Math.sign(gaps[i - 1]);
      const currSign = Math.sign(gaps[i]);
      const nextSign = Math.sign(gaps[i + 1]);
      if (
        prevSign !== 0 &&
        currSign !== 0 &&
        prevSign !== currSign &&
        currSign === nextSign
      ) {
        inflection = {
          week: points[i].week,
          type: currSign > 0 ? "immersive_ahead" : "classic_ahead",
        };
        break;
      }
    }

    // Check for convergence: if peak gap > 3pp and latest gap < 2pp
    if (!inflection && gaps.length >= 4) {
      const peakGap = Math.max(...gaps.map(Math.abs));
      const latestAbs = Math.abs(gaps[gaps.length - 1] || 0);
      if (peakGap > 3 && latestAbs < 2) {
        inflection = {
          week:
            points[points.length - 2]?.week || points[points.length - 1]?.week,
          type: "converging",
        };
      }
    }

    const latestGap =
      gaps.length > 0 ? Math.round(gaps[gaps.length - 1] * 10) / 10 : 0;

    // Build interpretation
    const minWeeklyN =
      points.length > 0
        ? Math.min(...points.map((p) => Math.min(p.classicN, p.immersiveN)))
        : 0;

    let interpretation: { en: string; zh: string };
    if (points.length < 3 || minWeeklyN < 5) {
      interpretation = {
        en: `Insufficient data for trend analysis (${points.length} weeks, min weekly n=${minWeeklyN}). Need at least 3 weeks with n≥5 per group.`,
        zh: `趋势分析数据不足（${points.length} 周，每周最小 n=${minWeeklyN}）。需要至少 3 周且每组 n≥5 的数据。`,
      };
    } else if (inflection?.type === "converging") {
      const peakGap = Math.max(...gaps.map(Math.abs));
      interpretation = {
        en: `The two groups are converging — gap narrowed from ${Math.round(peakGap * 10) / 10}pp to ${Math.abs(latestGap)}pp. Consider extending the test or investigating external factors.`,
        zh: `两组正在收敛，差距从 ${Math.round(peakGap * 10) / 10}pp 缩小到 ${Math.abs(latestGap)}pp。建议延长测试或调查外部因素。`,
      };
    } else if (inflection) {
      const leader =
        inflection.type === "immersive_ahead" ? "Immersive" : "Classic";
      interpretation = {
        en: `${leader} took the lead from week ${inflection.week}. Latest gap: ${latestGap > 0 ? "+" : ""}${latestGap}pp (Immersive − Classic).`,
        zh: `${leader} 从第 ${inflection.week} 周开始领先。最新差距：${latestGap > 0 ? "+" : ""}${latestGap}pp（Immersive − Classic）。`,
      };
    } else {
      const leader =
        latestGap > 0 ? "Immersive" : latestGap < 0 ? "Classic" : "Neither";
      interpretation = {
        en: `No clear inflection point detected. Current leader: ${leader} (gap: ${latestGap > 0 ? "+" : ""}${latestGap}pp). ${points.length} weeks of data collected.`,
        zh: `未检测到明确拐点。当前领先：${leader}（差距：${latestGap > 0 ? "+" : ""}${latestGap}pp）。已收集 ${points.length} 周数据。`,
      };
    }

    return { points, inflection, latestGap, interpretation };
  } catch (error) {
    console.error("getABTrendAnalysis error:", error);
    return {
      points: [],
      latestGap: 0,
      interpretation: {
        en: "Failed to load A/B trend data.",
        zh: "A/B 趋势数据加载失败。",
      },
    };
  }
}

// ── 9. Pre/Post Effect Summary ──────────────────────────────

export interface EffectResult {
  meanDelta: number;
  d: number;
  label: string;
  pValue: number;
  tStat: number;
  significant: boolean;
  n: number;
}

export interface PrePostEffectSummary {
  /** T0 → T1 (immediately post Deep Dive) SCC effect. */
  sccImmediate: EffectResult | null;
  /** T0 → T2 (one week post Deep Dive) SCC effect. */
  scc1Week: EffectResult | null;
  summary: { en: string; zh: string };
}

const EFFECT_LABEL_ZH: Record<string, string> = {
  negligible: "可忽略",
  small: "小",
  medium: "中",
  large: "大",
};

function computeEffect(
  pairs: { pre: number; post: number }[],
): EffectResult | null {
  if (pairs.length < 5) return null;
  const pre = pairs.map((p) => p.pre);
  const post = pairs.map((p) => p.post);
  const tResult = pairedTTest(pre, post);
  const dValue = cohenDPaired(pre, post);
  if (!tResult || dValue == null) return null;
  return {
    meanDelta: Math.round(tResult.meanDelta * 100) / 100,
    d: Math.round(dValue * 100) / 100,
    label: effectSizeLabel(dValue),
    pValue: Math.round(tResult.pValue * 10000) / 10000,
    tStat: Math.round(tResult.t * 100) / 100,
    significant: tResult.pValue < 0.05,
    n: pre.length,
  };
}

function describeEffect(
  effect: EffectResult,
  windowEn: string,
  windowZh: string,
): { en: string; zh: string } {
  const dir = effect.meanDelta > 0 ? "improvement" : "decrease";
  const dirZh = effect.meanDelta > 0 ? "提升" : "下降";
  const sig = effect.significant ? "" : " (n.s.)";
  const sigZh = effect.significant ? "" : "（不显著）";
  const sign = effect.meanDelta > 0 ? "+" : "";
  return {
    en: `SCC ${windowEn}: ${dir} Δ=${sign}${effect.meanDelta}, d=${effect.d} (${effect.label}), p=${effect.pValue}${sig}, n=${effect.n}`,
    zh: `SCC ${windowZh}${dirZh} Δ=${sign}${effect.meanDelta}，d=${effect.d}（${EFFECT_LABEL_ZH[effect.label] ?? effect.label}效应），p=${effect.pValue}${sigZh}，n=${effect.n}`,
  };
}

/**
 * Thesis headline statistics — paired t-test + Cohen's d on SCC.
 * T0→T1 and T0→T2 are computed as SEPARATE paired tests on canonical
 * one-row-per-user pairs (see lib/db/research-metrics.ts). Pooling the
 * two windows into one test double-counts users and conflates effects.
 */
export async function getPrePostEffectSummary(): Promise<PrePostEffectSummary | null> {
  try {
    const paired = await getPrePostPairedData();
    if (paired.length === 0) return null;

    const t0t1 = paired.filter((r) => r.postType === "post_immediate");
    const t0t2 = paired.filter((r) => r.postType === "post_1week");

    const sccImmediate = computeEffect(
      t0t1.map((r) => ({ pre: r.sccPre, post: r.sccPost })),
    );
    const scc1Week = computeEffect(
      t0t2.map((r) => ({ pre: r.sccPre, post: r.sccPost })),
    );

    if (!sccImmediate && !scc1Week) return null;

    const parts: string[] = [];
    const partsZh: string[] = [];
    if (sccImmediate) {
      const desc = describeEffect(sccImmediate, "T0→T1", "T0→T1 ");
      parts.push(desc.en);
      partsZh.push(desc.zh);
    }
    if (scc1Week) {
      const desc = describeEffect(
        scc1Week,
        "T0→T2 (1 week)",
        "T0→T2（一周后）",
      );
      parts.push(desc.en);
      partsZh.push(desc.zh);
    }

    const summary = {
      en: `Deep Dive participants showed: ${parts.join("; ")}.`,
      zh: `完成 Deep Dive 的用户表现：${partsZh.join("；")}。`,
    };

    return { sccImmediate, scc1Week, summary };
  } catch (error) {
    console.error("getPrePostEffectSummary error:", error);
    return null;
  }
}
