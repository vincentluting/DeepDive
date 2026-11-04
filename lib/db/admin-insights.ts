// ============================================================
// Admin Insights — Aggregated analytics for admin dashboard
//
// Tables: User, AssessmentResult, CareerReport, QuickDiveResult,
//         CoachingSession, PageVisit, ReportNPS
// Provides: platform overview, funnel metrics, visitor journey data,
//           UTM tracking, country/device filters, notable visitor detection.
// ============================================================

import { sql } from "./connection";
import { getConversionRates } from "@/lib/analytics/funnel-queries";
import { getPairedSccData } from "./research-metrics";

// ─── 1. Admin Overview ────────────────────────────────────────────────────────

export interface AdminOverview {
  totalUsers: number;
  totalReports: number;
  totalQuickDives: number;
  newUsersInPeriod: number;
  newReportsInPeriod: number;
}

export async function getAdminOverview(days: number): Promise<AdminOverview> {
  try {
    const [usersTotal, reportsTotal, quickDivesTotal, newUsers, newReports] =
      await Promise.all([
        sql`SELECT COUNT(*)::int AS "count" FROM "User"`,
        sql`SELECT COUNT(*)::int AS "count" FROM "CareerReport"`,
        sql`SELECT COUNT(*)::int AS "count" FROM "QuickDiveResult"`,
        sql`SELECT COUNT(*)::int AS "count" FROM "User" WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})`,
        sql`SELECT COUNT(*)::int AS "count" FROM "CareerReport" WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})`,
      ]);

    return {
      totalUsers: (usersTotal[0]?.count as number) || 0,
      totalReports: (reportsTotal[0]?.count as number) || 0,
      totalQuickDives: (quickDivesTotal[0]?.count as number) || 0,
      newUsersInPeriod: (newUsers[0]?.count as number) || 0,
      newReportsInPeriod: (newReports[0]?.count as number) || 0,
    };
  } catch (error) {
    console.error("getAdminOverview error:", error);
    return {
      totalUsers: 0,
      totalReports: 0,
      totalQuickDives: 0,
      newUsersInPeriod: 0,
      newReportsInPeriod: 0,
    };
  }
}

// ─── 2. Funnel Data ───────────────────────────────────────────────────────────

export interface FunnelStep {
  name: string;
  label: string;
  count: number;
  rate: number; // percentage relative to registered
}

export interface FunnelData {
  steps: FunnelStep[];
}

const FUNNEL_LABELS: Record<string, string> = {
  // Core funnel
  registered: "注册",
  quickdive_started: "开始 Quick Dive",
  quickdive_completed: "完成 Quick Dive",
  immersive_explore_started: "开始沉浸探索",
  immersive_explore_completed: "完成沉浸探索",
  deepdive_started: "开始 Deep Dive",
  deepdive_completed: "完成 Deep Dive",
  report_viewed: "查看报告",
  report_reacted: "对报告做出反应",
  coaching_started: "开始 AI 教练",
  // Engagement & exit
  quickdive_abandoned: "放弃 Quick Dive",
  deepdive_abandoned: "放弃 Deep Dive",
  share_clicked: "点击分享",
  intro_cta_clicked: "点击开始按钮",
  micro_feedback_shown: "显示微反馈",
};

const FUNNEL_ORDER = [
  "registered",
  "quickdive_started",
  "quickdive_completed",
  "deepdive_started",
  "deepdive_completed",
  "report_viewed",
  "report_reacted",
  "coaching_started",
];

export async function getFunnelData(days: number): Promise<FunnelData> {
  try {
    const rates = await getConversionRates(days);
    const registeredCount = rates.registered || 1;

    const steps: FunnelStep[] = FUNNEL_ORDER.map((name) => {
      const count = rates[name as keyof typeof rates] || 0;
      return {
        name,
        label: FUNNEL_LABELS[name] || name,
        count,
        rate: Math.round((count / registeredCount) * 100),
      };
    });

    return { steps };
  } catch (error) {
    console.error("getFunnelData error:", error);
    return { steps: [] };
  }
}

// ─── 3. Reaction Distribution ─────────────────────────────────────────────────

export interface ReactionDistribution {
  surprised: number;
  skeptical: number;
  resonates: number;
  total: number;
}

export async function getReactionDistribution(): Promise<ReactionDistribution> {
  try {
    const rows = await sql`
      SELECT "reaction", COUNT(*)::int AS "count"
      FROM "ReportReaction"
      GROUP BY "reaction"
    `;

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.reaction as string] = row.count as number;
    }

    const surprised = map["surprised"] || 0;
    const skeptical = map["skeptical"] || 0;
    const resonates = map["resonates"] || 0;

    return {
      surprised,
      skeptical,
      resonates,
      total: surprised + skeptical + resonates,
    };
  } catch (error) {
    console.error("getReactionDistribution error:", error);
    return { surprised: 0, skeptical: 0, resonates: 0, total: 0 };
  }
}

// ─── 4. NPS Distribution ──────────────────────────────────────────────────────

export interface NPSDistribution {
  distribution: { score: number; count: number }[];
  average: number;
  promoterRate: number;
  recentFeedback: { score: number; feedback: string; createdAt: string }[];
}

export async function getNPSDistribution(): Promise<NPSDistribution> {
  try {
    const [distRows, feedbackRows] = await Promise.all([
      sql`
        SELECT "score", COUNT(*)::int AS "count"
        FROM "ReportNPS"
        GROUP BY "score"
        ORDER BY "score"
      `,
      sql`
        SELECT "score", "feedback", "createdAt"
        FROM "ReportNPS"
        WHERE "feedback" IS NOT NULL AND "feedback" != ''
        ORDER BY "createdAt" DESC
        LIMIT 5
      `,
    ]);

    // Build distribution for scores 1-10
    const countMap: Record<number, number> = {};
    let totalCount = 0;
    let totalScore = 0;
    let promoters = 0;

    for (const row of distRows) {
      const score = row.score as number;
      const count = row.count as number;
      countMap[score] = count;
      totalCount += count;
      totalScore += score * count;
      if (score >= 9) promoters += count;
    }

    const distribution = [];
    for (let s = 1; s <= 10; s++) {
      distribution.push({ score: s, count: countMap[s] || 0 });
    }

    return {
      distribution,
      average:
        totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0,
      promoterRate:
        totalCount > 0 ? Math.round((promoters / totalCount) * 100) : 0,
      recentFeedback: feedbackRows.map((r) => ({
        score: r.score as number,
        feedback: r.feedback as string,
        createdAt: String(r.createdAt),
      })),
    };
  } catch (error) {
    console.error("getNPSDistribution error:", error);
    return {
      distribution: [],
      average: 0,
      promoterRate: 0,
      recentFeedback: [],
    };
  }
}

// ─── 5. Archetype Distribution ────────────────────────────────────────────────

export interface ArchetypeCount {
  archetype: string;
  count: number;
}

interface ArchetypeRecord {
  /** Identity key: userId for registered users, anon:<anonymousId> otherwise. */
  identity: string;
  archetype: string;
  source: "report" | "quick";
  createdAt: string;
}

/** Extract archetype name from a CareerReport reportJson payload. */
function extractReportArchetype(reportJson: unknown): string | null {
  try {
    const json =
      typeof reportJson === "string" ? JSON.parse(reportJson) : reportJson;
    const j = json as Record<string, unknown> | null;
    const synthesis = j?.archetype_synthesis as
      | { archetypes?: { archetype_name?: string }[] }
      | undefined;
    if (synthesis?.archetypes?.[0]?.archetype_name) {
      return synthesis.archetypes[0].archetype_name;
    }
    if (typeof j?.archetype_label === "string") return j.archetype_label;
    if (typeof j?.archetype === "string") return j.archetype;
    return null;
  } catch {
    return null;
  }
}

/**
 * Deduplicate archetype records to ONE per identity:
 * CareerReport (deep assessment) wins over QuickDiveResult; within the
 * same source the latest record wins. Exported for unit testing.
 */
export function dedupeArchetypeRecords(
  records: ArchetypeRecord[],
): ArchetypeCount[] {
  const best = new Map<string, ArchetypeRecord>();
  for (const rec of records) {
    if (!rec.archetype) continue;
    const current = best.get(rec.identity);
    if (!current) {
      best.set(rec.identity, rec);
      continue;
    }
    // Report beats quick; same source → latest createdAt wins.
    const recRank = rec.source === "report" ? 1 : 0;
    const curRank = current.source === "report" ? 1 : 0;
    if (
      recRank > curRank ||
      (recRank === curRank &&
        new Date(rec.createdAt).getTime() >
          new Date(current.createdAt).getTime())
    ) {
      best.set(rec.identity, rec);
    }
  }

  const countMap: Record<string, number> = {};
  for (const rec of best.values()) {
    countMap[rec.archetype] = (countMap[rec.archetype] || 0) + 1;
  }

  return Object.entries(countMap)
    .map(([archetype, count]) => ({ archetype, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

/**
 * Archetype distribution across UNIQUE people (not records).
 * A user who took Quick Dive and later generated a full report counts
 * once, with the report archetype. Anonymous Quick Dives count once
 * per anonymousId.
 */
export async function getArchetypeDistribution(): Promise<ArchetypeCount[]> {
  try {
    const [reportRows, quickRows] = await Promise.all([
      sql`
        SELECT "userId", "reportJson", "createdAt"
        FROM "CareerReport"
        WHERE "reportJson" IS NOT NULL
      `,
      sql`
        SELECT "userId", "anonymousId", "archetypeLabel", "id", "createdAt"
        FROM "QuickDiveResult"
        WHERE "archetypeLabel" IS NOT NULL
      `,
    ]);

    const records: ArchetypeRecord[] = [];

    for (const row of reportRows) {
      const archetype = extractReportArchetype(row.reportJson);
      if (!archetype || !row.userId) continue;
      records.push({
        identity: row.userId as string,
        archetype,
        source: "report",
        createdAt: String(row.createdAt),
      });
    }

    for (const row of quickRows) {
      const archetype = row.archetypeLabel as string;
      if (!archetype) continue;
      const identity = row.userId
        ? (row.userId as string)
        : `anon:${(row.anonymousId as string) || (row.id as string)}`;
      records.push({
        identity,
        archetype,
        source: "quick",
        createdAt: String(row.createdAt),
      });
    }

    return dedupeArchetypeRecords(records);
  } catch (error) {
    console.error("getArchetypeDistribution error:", error);
    return [];
  }
}

// ─── 7. Questionnaire Stats ──────────────────────────────────────────────────

export interface TierStats {
  total: number;
  completed: number;
  avgMinutes: number;
  assistantUsed: number;
}

export interface QuestionnaireStats {
  quick: TierStats;
  deep: TierStats;
  completionRate: { quick: number; deep: number };
}

export async function getQuestionnaireStats(
  days: number,
): Promise<QuestionnaireStats> {
  try {
    const rows = await sql`
      SELECT
        "tier",
        COUNT(*)::int AS "count",
        COUNT(CASE WHEN "status" = 'completed' THEN 1 END)::int AS "completed",
        AVG(CASE WHEN "totalTimeMs" IS NOT NULL THEN "totalTimeMs" END)::int AS "avgTimeMs",
        COUNT(CASE WHEN "answerAssistantEnabled" = true THEN 1 END)::int AS "assistantUsed"
      FROM "QuestionnaireSession"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
      GROUP BY "tier"
    `;

    const tierMap: Record<
      string,
      {
        count: number;
        completed: number;
        avgTimeMs: number;
        assistantUsed: number;
      }
    > = {};
    for (const row of rows) {
      tierMap[row.tier as string] = {
        count: (row.count as number) || 0,
        completed: (row.completed as number) || 0,
        avgTimeMs: (row.avgTimeMs as number) || 0,
        assistantUsed: (row.assistantUsed as number) || 0,
      };
    }

    const quick = tierMap["quick"] || {
      count: 0,
      completed: 0,
      avgTimeMs: 0,
      assistantUsed: 0,
    };
    const deep = tierMap["deep"] || {
      count: 0,
      completed: 0,
      avgTimeMs: 0,
      assistantUsed: 0,
    };

    return {
      quick: {
        total: quick.count,
        completed: quick.completed,
        avgMinutes:
          quick.avgTimeMs > 0 ? Math.round(quick.avgTimeMs / 60000) : 0,
        assistantUsed: quick.assistantUsed,
      },
      deep: {
        total: deep.count,
        completed: deep.completed,
        avgMinutes: deep.avgTimeMs > 0 ? Math.round(deep.avgTimeMs / 60000) : 0,
        assistantUsed: deep.assistantUsed,
      },
      completionRate: {
        quick:
          quick.count > 0
            ? Math.round((quick.completed / quick.count) * 100)
            : 0,
        deep:
          deep.count > 0 ? Math.round((deep.completed / deep.count) * 100) : 0,
      },
    };
  } catch (error) {
    console.error("getQuestionnaireStats error:", error);
    return {
      quick: { total: 0, completed: 0, avgMinutes: 0, assistantUsed: 0 },
      deep: { total: 0, completed: 0, avgMinutes: 0, assistantUsed: 0 },
      completionRate: { quick: 0, deep: 0 },
    };
  }
}

// ─── 8. Geography Distribution ───────────────────────────────────────────────

export interface GeoCount {
  country: string;
  count: number;
}

export async function getGeographyDistribution(): Promise<GeoCount[]> {
  try {
    const rows = await sql`
      SELECT
        COALESCE("registrationCountry", 'Unknown') AS "country",
        COUNT(*)::int AS "count"
      FROM "User"
      GROUP BY "country"
      ORDER BY "count" DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      country: r.country as string,
      count: r.count as number,
    }));
  } catch (error) {
    console.error("getGeographyDistribution error:", error);
    return [];
  }
}

// ─── 9. All Users Detailed ───────────────────────────────────────────────────

export interface UserDetailed {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  registrationCountry: string | null;
  registrationIp: string | null;
  careerStage: string | null;
  languages: string[];
  reportCount: number;
  lastReportAt: string | null;
}

export async function getAllUsersDetailed(): Promise<UserDetailed[]> {
  try {
    // Two parallel queries: user data + per-user language aggregation
    const [userRows, langRows] = await Promise.all([
      sql`
        WITH all_reports AS (
          SELECT "id", "userId", "createdAt" FROM "CareerReport"
          UNION ALL
          SELECT "id", "userId", "createdAt" FROM "QuickDiveResult"
        )
        SELECT
          u."id", u."name", u."email", u."isAdmin", u."createdAt",
          u."registrationCountry", u."registrationIp", u."careerStage",
          COUNT(ar."id")::int AS "reportCount",
          MAX(ar."createdAt") AS "lastReportAt"
        FROM "User" u
        LEFT JOIN all_reports ar ON ar."userId" = u."id"
        GROUP BY u."id", u."name", u."email", u."isAdmin", u."createdAt",
                 u."registrationCountry", u."registrationIp", u."careerStage"
        ORDER BY u."createdAt" DESC
        LIMIT 500
      `,
      sql`
        SELECT "userId", array_agg(DISTINCT "language") AS "languages"
        FROM "QuestionnaireSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      `,
    ]);

    // Build language lookup map
    const langMap: Record<string, string[]> = {};
    for (const row of langRows) {
      const langs = row.languages;
      langMap[row.userId as string] = Array.isArray(langs)
        ? langs.map((l: unknown) => String(l))
        : [];
    }

    return userRows.map((r) => ({
      id: r.id as string,
      name: (r.name as string) || null,
      email: r.email as string,
      isAdmin: r.isAdmin === true,
      createdAt: String(r.createdAt),
      registrationCountry: (r.registrationCountry as string) || null,
      registrationIp: (r.registrationIp as string) || null,
      careerStage: (r.careerStage as string) || null,
      languages: langMap[r.id as string] || [],
      reportCount: (r.reportCount as number) || 0,
      lastReportAt: r.lastReportAt ? String(r.lastReportAt) : null,
    }));
  } catch (error) {
    console.error("getAllUsersDetailed error:", error);
    return [];
  }
}

// ─── 10. Language Distribution ───────────────────────────────────────────────

export interface LanguageCount {
  language: string;
  count: number;
}

export async function getLanguageDistribution(): Promise<LanguageCount[]> {
  try {
    const [langRows, totalUsersRow] = await Promise.all([
      sql`
        SELECT "language", COUNT(DISTINCT "userId")::int AS "count"
        FROM "QuestionnaireSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "language"
        ORDER BY "count" DESC
      `,
      sql`SELECT COUNT(*)::int AS "count" FROM "User"`,
    ]);

    const result: LanguageCount[] = langRows.map((r) => ({
      language: r.language as string,
      count: r.count as number,
    }));

    // Count users with no questionnaire record
    const totalUsers = (totalUsersRow[0]?.count as number) || 0;
    const usersWithLang = result.reduce((sum, r) => sum + r.count, 0);
    const unknown = totalUsers - usersWithLang;
    if (unknown > 0) {
      result.push({ language: "unknown", count: unknown });
    }

    return result;
  } catch (error) {
    console.error("getLanguageDistribution error:", error);
    return [];
  }
}

// ─── 11. Dropoff Distribution ─────────────────────────────────────────────────
// (Existing function below)

// ─── 12. Pre-Post Paired Data (Thesis) ───────────────────────────────────────

export interface PrePostPairedRow {
  userId: string;
  sccPre: number;
  sccPost: number;
  postType: string;
}

/**
 * Canonical paired SCC rows for thesis statistics.
 * One row per user per post timepoint: T0 (first pre) × T1 (latest
 * post_immediate) and T0 × T2 (latest post_1week), restricted to the
 * canonical research population (consented, not withdrawn, non-admin).
 * Pairing rules live in lib/db/research-metrics.ts.
 */
export async function getPrePostPairedData(): Promise<PrePostPairedRow[]> {
  try {
    const { t0t1, t0t2 } = await getPairedSccData();
    return [
      ...t0t1.map((p) => ({
        userId: p.userId,
        sccPre: p.pre,
        sccPost: p.post,
        postType: "post_immediate",
      })),
      ...t0t2.map((p) => ({
        userId: p.userId,
        sccPre: p.pre,
        sccPost: p.post,
        postType: "post_1week",
      })),
    ];
  } catch (error) {
    console.error("getPrePostPairedData error:", error);
    return [];
  }
}

// ─── 13. Completion Time Distribution (Thesis) ──────────────────────────────

export interface CompletionTimeBucket {
  bucket: string;
  quickCount: number;
  deepCount: number;
}

export interface CompletionTimeStats {
  buckets: CompletionTimeBucket[];
  quickMedianMs: number;
  deepMedianMs: number;
}

/**
 * Completion-time distribution by tier.
 * Pass `researchOnly: true` to restrict to the canonical research
 * population (thesis charts) — research participants carry the extra
 * T0/T1/T2 survey burden, so mixing them with free users skews timing.
 */
export async function getCompletionTimeDistribution(opts?: {
  researchOnly?: boolean;
}): Promise<CompletionTimeStats> {
  const researchOnly = opts?.researchOnly ?? false;
  try {
    const rows = await sql`
      SELECT qs."tier", qs."totalTimeMs"
      FROM "QuestionnaireSession" qs
      WHERE qs."status" = 'completed'
        AND qs."totalTimeMs" IS NOT NULL
        AND qs."totalTimeMs" > 0
        AND (
          ${researchOnly}::boolean = FALSE
          OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u."id" = qs."userId"
              AND u."researchGroup" IS NOT NULL
              AND u."researchConsentAt" IS NOT NULL
              AND u."isAdmin" = FALSE
              AND EXISTS (
                SELECT 1 FROM "ConsentRecord" cr
                WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
              )
          )
        )
      ORDER BY qs."totalTimeMs"
    `;

    const quickTimes: number[] = [];
    const deepTimes: number[] = [];

    for (const row of rows) {
      const ms = row.totalTimeMs as number;
      if (row.tier === "quick") quickTimes.push(ms);
      else if (row.tier === "deep") deepTimes.push(ms);
    }

    const bucketRanges = [
      { label: "0-5", min: 0, max: 5 },
      { label: "5-10", min: 5, max: 10 },
      { label: "10-15", min: 10, max: 15 },
      { label: "15-20", min: 15, max: 20 },
      { label: "20-25", min: 20, max: 25 },
      { label: "25-30", min: 25, max: 30 },
      { label: "30+", min: 30, max: Infinity },
    ];

    const buckets: CompletionTimeBucket[] = bucketRanges.map(
      ({ label, min, max }) => ({
        bucket: label,
        quickCount: quickTimes.filter((ms) => {
          const mins = ms / 60000;
          return mins >= min && mins < max;
        }).length,
        deepCount: deepTimes.filter((ms) => {
          const mins = ms / 60000;
          return mins >= min && mins < max;
        }).length,
      }),
    );

    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    return {
      buckets,
      quickMedianMs: median(quickTimes),
      deepMedianMs: median(deepTimes),
    };
  } catch (error) {
    console.error("getCompletionTimeDistribution error:", error);
    return { buckets: [], quickMedianMs: 0, deepMedianMs: 0 };
  }
}

// ─── 14. Report Engagement Stats (Thesis) ───────────────────────────────────

export interface ReportEngagementStats {
  avgAnchors: number;
  stdAnchors: number;
  avgCareers: number;
  stdCareers: number;
  avgShadow: number;
  stdShadow: number;
  avgLetter: number;
  stdLetter: number;
  avgExplore: number;
  stdExplore: number;
  avgTotalMs: number;
  avgScrollDepth: number;
  avgScrollbackCount: number;
  n: number;
}

export async function getReportEngagementStats(opts?: {
  researchOnly?: boolean;
}): Promise<ReportEngagementStats> {
  const researchOnly = opts?.researchOnly ?? false;
  try {
    const rows = await sql`
      SELECT
        AVG((("panelTimes"->>'anchors')::int))::numeric(10,1) AS "avgAnchors",
        STDDEV((("panelTimes"->>'anchors')::int))::numeric(10,1) AS "stdAnchors",
        AVG((("panelTimes"->>'careers')::int))::numeric(10,1) AS "avgCareers",
        STDDEV((("panelTimes"->>'careers')::int))::numeric(10,1) AS "stdCareers",
        AVG((("panelTimes"->>'shadow')::int))::numeric(10,1) AS "avgShadow",
        STDDEV((("panelTimes"->>'shadow')::int))::numeric(10,1) AS "stdShadow",
        AVG((("panelTimes"->>'letter')::int))::numeric(10,1) AS "avgLetter",
        STDDEV((("panelTimes"->>'letter')::int))::numeric(10,1) AS "stdLetter",
        AVG((("panelTimes"->>'explore')::int))::numeric(10,1) AS "avgExplore",
        STDDEV((("panelTimes"->>'explore')::int))::numeric(10,1) AS "stdExplore",
        AVG("totalTimeMs")::numeric(10,1) AS "avgTotal",
        AVG("maxScrollDepth")::numeric(5,1) AS "avgScrollDepth",
        AVG(jsonb_array_length("scrollbacks"))::numeric(5,1) AS "avgScrollbackCount",
        COUNT(*)::int AS "n"
      FROM "ReportEngagement"
      WHERE "totalTimeMs" > 5000
        AND (
          ${researchOnly}::boolean = FALSE
          OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u."id" = "ReportEngagement"."userId"
              AND u."researchGroup" IS NOT NULL
              AND u."researchConsentAt" IS NOT NULL
              AND u."isAdmin" = FALSE
              AND EXISTS (
                SELECT 1 FROM "ConsentRecord" cr
                WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
              )
          )
        )
    `;

    const r = rows[0] || {};
    return {
      avgAnchors: parseFloat(String(r.avgAnchors)) || 0,
      stdAnchors: parseFloat(String(r.stdAnchors)) || 0,
      avgCareers: parseFloat(String(r.avgCareers)) || 0,
      stdCareers: parseFloat(String(r.stdCareers)) || 0,
      avgShadow: parseFloat(String(r.avgShadow)) || 0,
      stdShadow: parseFloat(String(r.stdShadow)) || 0,
      avgLetter: parseFloat(String(r.avgLetter)) || 0,
      stdLetter: parseFloat(String(r.stdLetter)) || 0,
      avgExplore: parseFloat(String(r.avgExplore)) || 0,
      stdExplore: parseFloat(String(r.stdExplore)) || 0,
      avgTotalMs: parseFloat(String(r.avgTotal)) || 0,
      avgScrollDepth: parseFloat(String(r.avgScrollDepth)) || 0,
      avgScrollbackCount: parseFloat(String(r.avgScrollbackCount)) || 0,
      n: (r.n as number) || 0,
    };
  } catch (error) {
    console.error("getReportEngagementStats error:", error);
    return {
      avgAnchors: 0,
      stdAnchors: 0,
      avgCareers: 0,
      stdCareers: 0,
      avgShadow: 0,
      stdShadow: 0,
      avgLetter: 0,
      stdLetter: 0,
      avgExplore: 0,
      stdExplore: 0,
      avgTotalMs: 0,
      avgScrollDepth: 0,
      avgScrollbackCount: 0,
      n: 0,
    };
  }
}

// ─── 15. Coaching Depth Stats (Thesis) ──────────────────────────────────────

export interface CoachingDepthStats {
  totalSessions: number;
  avgRounds: number;
  avgMessageLength: number;
  roundDistribution: { rounds: number; count: number }[];
  messageLengthBuckets: { bucket: string; count: number }[];
  feedbackDistribution: { rating: string; count: number }[];
}

export async function getCoachingDepthStats(opts?: {
  researchOnly?: boolean;
}): Promise<CoachingDepthStats> {
  const researchOnly = opts?.researchOnly ?? false;
  try {
    const [sessionRows, feedbackRows] = await Promise.all([
      sql`
        SELECT "roundNumber", "messagesJson"
        FROM "CoachingSession"
        WHERE "roundNumber" > 0
          AND (
            ${researchOnly}::boolean = FALSE
            OR EXISTS (
              SELECT 1 FROM "User" u
              WHERE u."id" = "CoachingSession"."userId"
                AND u."researchGroup" IS NOT NULL
                AND u."researchConsentAt" IS NOT NULL
                AND u."isAdmin" = FALSE
                AND EXISTS (
                  SELECT 1 FROM "ConsentRecord" cr
                  WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
                )
            )
          )
      `,
      sql`
        SELECT "rating", COUNT(*)::int AS "count"
        FROM "CoachingFeedback"
        WHERE (
            ${researchOnly}::boolean = FALSE
            OR EXISTS (
              SELECT 1 FROM "User" u
              WHERE u."id" = "CoachingFeedback"."userId"
                AND u."researchGroup" IS NOT NULL
                AND u."researchConsentAt" IS NOT NULL
                AND u."isAdmin" = FALSE
                AND EXISTS (
                  SELECT 1 FROM "ConsentRecord" cr
                  WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
                )
            )
          )
        GROUP BY "rating"
      `,
    ]);

    const totalSessions = sessionRows.length;
    let totalRounds = 0;
    const roundCounts: Record<number, number> = {};
    const messageLengths: number[] = [];

    for (const row of sessionRows) {
      const rounds = (row.roundNumber as number) || 0;
      totalRounds += rounds;
      roundCounts[rounds] = (roundCounts[rounds] || 0) + 1;

      try {
        const messages =
          typeof row.messagesJson === "string"
            ? JSON.parse(row.messagesJson)
            : row.messagesJson;

        if (Array.isArray(messages)) {
          for (const msg of messages) {
            if (msg.role === "user" && typeof msg.content === "string") {
              messageLengths.push(msg.content.length);
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    const avgRounds =
      totalSessions > 0
        ? Math.round((totalRounds / totalSessions) * 10) / 10
        : 0;
    const avgMessageLength =
      messageLengths.length > 0
        ? Math.round(
            messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length,
          )
        : 0;

    // Round distribution (1-10+)
    const roundDistribution: { rounds: number; count: number }[] = [];
    for (let i = 1; i <= 10; i++) {
      roundDistribution.push({ rounds: i, count: roundCounts[i] || 0 });
    }

    // Message length buckets
    const lengthBucketRanges = [
      { label: "0-50", min: 0, max: 50 },
      { label: "50-100", min: 50, max: 100 },
      { label: "100-200", min: 100, max: 200 },
      { label: "200-500", min: 200, max: 500 },
      { label: "500+", min: 500, max: Infinity },
    ];

    const messageLengthBuckets = lengthBucketRanges.map(
      ({ label, min, max }) => ({
        bucket: label,
        count: messageLengths.filter((l) => l >= min && l < max).length,
      }),
    );

    // Feedback distribution
    const feedbackDistribution = feedbackRows.map((r) => ({
      rating: r.rating as string,
      count: r.count as number,
    }));

    return {
      totalSessions,
      avgRounds,
      avgMessageLength,
      roundDistribution,
      messageLengthBuckets,
      feedbackDistribution,
    };
  } catch (error) {
    console.error("getCoachingDepthStats error:", error);
    return {
      totalSessions: 0,
      avgRounds: 0,
      avgMessageLength: 0,
      roundDistribution: [],
      messageLengthBuckets: [],
      feedbackDistribution: [],
    };
  }
}

// ─── 16. Research Group Comparison (Thesis) ─────────────────────────────────

export interface ResearchGroupData {
  group: string;
  count: number;
  completedCount: number;
  completionRate: number;
  avgTimeMs: number;
  riasecAvg: Record<string, number>;
  npsDistribution: { score: number; count: number }[];
  avgNps: number;
}

export interface ResearchGroupComparison {
  classic: ResearchGroupData | null;
  immersive: ResearchGroupData | null;
}

/**
 * Classic vs Immersive group comparison for the thesis.
 *
 * Person-level metrics — each participant contributes exactly once:
 *   - completed/total = users with ≥1 completed / ≥1 started quick session
 *     (NOT session counts; restart behavior must not skew the denominator)
 *   - avgTimeMs       = mean of each user's FIRST completed quick session
 *     (first exposure, untainted by practice effects on retakes)
 *   - RIASEC          = each user's LATEST QuickDiveResult
 *   - NPS             = each user's LATEST ReportNPS (joined directly on
 *     userId — joining through CareerReport multiplies rows per report)
 * All metrics restricted to the canonical research population
 * (consented, not withdrawn, non-admin).
 */
export async function getResearchGroupComparison(): Promise<ResearchGroupComparison> {
  try {
    const [groupStats, riasecRows, npsRows] = await Promise.all([
      sql`
        WITH research_population AS (
          SELECT u."id", u."researchGroup"
          FROM "User" u
          WHERE u."researchGroup" IS NOT NULL
            AND u."researchConsentAt" IS NOT NULL
            AND u."isAdmin" = FALSE
            AND EXISTS (
              SELECT 1 FROM "ConsentRecord" cr
              WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
            )
        ),
        first_completed_quick AS (
          SELECT DISTINCT ON (qs."userId")
            qs."userId", qs."totalTimeMs"
          FROM "QuestionnaireSession" qs
          WHERE qs."tier" = 'quick' AND qs."status" = 'completed'
          ORDER BY qs."userId", qs."createdAt" ASC
        ),
        any_quick AS (
          SELECT DISTINCT "userId"
          FROM "QuestionnaireSession"
          WHERE "tier" = 'quick' AND "userId" IS NOT NULL
        )
        SELECT
          rp."researchGroup" AS "group",
          COUNT(rp."id")::int AS "userCount",
          COUNT(fcq."userId")::int AS "completed",
          COUNT(aq."userId")::int AS "total",
          AVG(fcq."totalTimeMs")::int AS "avgTimeMs"
        FROM research_population rp
        LEFT JOIN first_completed_quick fcq ON fcq."userId" = rp."id"
        LEFT JOIN any_quick aq ON aq."userId" = rp."id"
        GROUP BY rp."researchGroup"
      `,
      sql`
        SELECT
          u."researchGroup" AS "group",
          qr."scoresJson"
        FROM "User" u
        JOIN LATERAL (
          SELECT "scoresJson"
          FROM "QuickDiveResult"
          WHERE "userId" = u."id"
          ORDER BY "createdAt" DESC
          LIMIT 1
        ) qr ON true
        WHERE u."researchGroup" IS NOT NULL
          AND u."researchConsentAt" IS NOT NULL
          AND u."isAdmin" = FALSE
          AND EXISTS (
            SELECT 1 FROM "ConsentRecord" cr
            WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
          )
      `,
      sql`
        SELECT
          u."researchGroup" AS "group",
          n."score"
        FROM "User" u
        JOIN LATERAL (
          SELECT "score"
          FROM "ReportNPS"
          WHERE "userId" = u."id"
          ORDER BY "createdAt" DESC
          LIMIT 1
        ) n ON true
        WHERE u."researchGroup" IS NOT NULL
          AND u."researchConsentAt" IS NOT NULL
          AND u."isAdmin" = FALSE
          AND EXISTS (
            SELECT 1 FROM "ConsentRecord" cr
            WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
          )
      `,
    ]);

    const buildGroupData = (group: string): ResearchGroupData | null => {
      const stats = groupStats.find((r) => r.group === group);
      if (!stats) return null;

      // RIASEC averages
      const groupRiasec = riasecRows.filter((r) => r.group === group);
      const riasecSums: Record<string, number> = {};
      const riasecCounts: Record<string, number> = {};

      for (const row of groupRiasec) {
        try {
          const scores =
            typeof row.scoresJson === "string"
              ? JSON.parse(row.scoresJson)
              : row.scoresJson;

          if (scores && typeof scores === "object") {
            for (const [key, val] of Object.entries(scores)) {
              if (typeof val === "number") {
                riasecSums[key] = (riasecSums[key] || 0) + val;
                riasecCounts[key] = (riasecCounts[key] || 0) + 1;
              }
            }
          }
        } catch {
          // skip
        }
      }

      const riasecAvg: Record<string, number> = {};
      for (const key of Object.keys(riasecSums)) {
        riasecAvg[key] =
          Math.round((riasecSums[key] / (riasecCounts[key] || 1)) * 10) / 10;
      }

      // NPS
      const groupNps = npsRows.filter((r) => r.group === group);
      const npsDist: Record<number, number> = {};
      let npsTotal = 0;
      let npsSum = 0;

      for (const row of groupNps) {
        const score = row.score as number;
        npsDist[score] = (npsDist[score] || 0) + 1;
        npsTotal++;
        npsSum += score;
      }

      const npsDistribution: { score: number; count: number }[] = [];
      for (let s = 1; s <= 10; s++) {
        npsDistribution.push({ score: s, count: npsDist[s] || 0 });
      }

      return {
        group,
        count: (stats.userCount as number) || 0,
        completedCount: (stats.completed as number) || 0,
        completionRate:
          (stats.total as number) > 0
            ? Math.round(
                ((stats.completed as number) / (stats.total as number)) * 100,
              )
            : 0,
        avgTimeMs: (stats.avgTimeMs as number) || 0,
        riasecAvg,
        npsDistribution,
        avgNps: npsTotal > 0 ? Math.round((npsSum / npsTotal) * 10) / 10 : 0,
      };
    };

    return {
      classic: buildGroupData("classic"),
      immersive: buildGroupData("immersive"),
    };
  } catch (error) {
    console.error("getResearchGroupComparison error:", error);
    return { classic: null, immersive: null };
  }
}

export interface DropoffPoint {
  module: string;
  questionIndex: number;
  count: number;
}

export async function getDropoffDistribution(
  days: number,
  opts?: { researchOnly?: boolean },
): Promise<DropoffPoint[]> {
  const researchOnly = opts?.researchOnly ?? false;
  try {
    const rows = await sql`
      SELECT
        "currentModule" AS "module",
        "currentQuestionIndex" AS "questionIndex",
        COUNT(*)::int AS "count"
      FROM "QuestionnaireSession"
      WHERE
        "tier" = 'deep'
        AND "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND (
          "status" = 'abandoned'
          OR (
            "status" = 'in_progress'
            AND "lastActiveAt" IS NOT NULL
            AND "lastActiveAt" < NOW() - INTERVAL '24 hours'
          )
        )
        AND (
          ${researchOnly}::boolean = FALSE
          OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u."id" = "QuestionnaireSession"."userId"
              AND u."researchGroup" IS NOT NULL
              AND u."researchConsentAt" IS NOT NULL
              AND u."isAdmin" = FALSE
              AND EXISTS (
                SELECT 1 FROM "ConsentRecord" cr
                WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
              )
          )
        )
      GROUP BY "currentModule", "currentQuestionIndex"
      ORDER BY "count" DESC
    `;

    return rows.map((r) => ({
      module: r.module as string,
      questionIndex: r.questionIndex as number,
      count: r.count as number,
    }));
  } catch (error) {
    console.error("getDropoffDistribution error:", error);
    return [];
  }
}
