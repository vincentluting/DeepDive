// ============================================================
// DB module — ReportEngagement
// Tracks passive engagement signals on the report page:
// panel dwell times, scroll-back events, max scroll depth.
// Table is created by initTables() in lib/db/admin.ts (synced with scripts/schema.sql).
// ============================================================

import { sql } from "./connection";

export interface PanelTimes {
  panel1?: number;
  panel2?: number;
  panel3?: number;
  integration?: number;
  [key: string]: number | undefined;
}

export interface ScrollbackEvent {
  from: string;
  to: string;
  atMs: number;
}

export interface SaveEngagementOpts {
  id: string;
  reportId: string;
  userId?: string | null;
  panelTimes: PanelTimes;
  scrollbacks: ScrollbackEvent[];
  maxScrollDepth?: number | null;
  totalTimeMs?: number | null;
}

/**
 * Insert a new engagement record. Fire-and-forget — failures are
 * logged but never thrown. Duplicate IDs are silently ignored.
 */
export async function saveReportEngagement(
  opts: SaveEngagementOpts,
): Promise<void> {
  try {
    const {
      id,
      reportId,
      userId = null,
      panelTimes,
      scrollbacks,
      maxScrollDepth = null,
      totalTimeMs = null,
    } = opts;

    await sql`
      INSERT INTO "ReportEngagement" (
        "id", "reportId", "userId",
        "panelTimes", "scrollbacks",
        "maxScrollDepth", "totalTimeMs"
      )
      VALUES (
        ${id},
        ${reportId},
        ${userId},
        ${JSON.stringify(panelTimes)},
        ${JSON.stringify(scrollbacks)},
        ${maxScrollDepth},
        ${totalTimeMs}
      )
      ON CONFLICT ("id") DO NOTHING
    `;
  } catch (error) {
    console.error("[saveReportEngagement] Failed:", error);
  }
}

// ============================================================
// Admin read queries — aggregate engagement data for dashboard
// ============================================================

export interface EngagementOverview {
  totalSessions: number;
  avgTotalTimeSec: number;
  avgMaxScrollDepth: number;
  avgScrollbacksPerSession: number;
  panelAvgTimeSec: Record<string, number>;
}

export interface EngagementSession {
  id: string;
  reportId: string;
  userId: string | null;
  totalTimeMs: number | null;
  maxScrollDepth: number | null;
  panelTimes: PanelTimes;
  scrollbackCount: number;
  createdAt: string;
}

/**
 * Aggregate engagement stats for the admin dashboard.
 */
export async function getEngagementOverview(
  days: number = 30,
): Promise<EngagementOverview> {
  try {
    const rows = await sql`
      SELECT
        COUNT(*)::int AS "totalSessions",
        COALESCE(AVG("totalTimeMs"), 0)::int AS "avgTotalTimeMs",
        COALESCE(AVG("maxScrollDepth"), 0)::real AS "avgMaxScrollDepth",
        COALESCE(AVG(jsonb_array_length("scrollbacks")), 0)::real AS "avgScrollbacks"
      FROM "ReportEngagement"
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
    `;
    const r = rows[0] ?? {};

    // Aggregate per-panel average dwell times
    const panelRows = await sql`
      SELECT
        key,
        AVG((value::text)::numeric)::int AS "avgMs"
      FROM "ReportEngagement",
           jsonb_each("panelTimes") AS kv(key, value)
      WHERE "createdAt" >= NOW() - MAKE_INTERVAL(days => ${days})
        AND jsonb_typeof(value) = 'number'
      GROUP BY key
      ORDER BY "avgMs" DESC
    `;

    const panelAvgTimeSec: Record<string, number> = {};
    for (const p of panelRows) {
      panelAvgTimeSec[p.key as string] = Math.round((p.avgMs as number) / 1000);
    }

    return {
      totalSessions: (r.totalSessions as number) || 0,
      avgTotalTimeSec: Math.round(((r.avgTotalTimeMs as number) || 0) / 1000),
      avgMaxScrollDepth:
        Math.round(((r.avgMaxScrollDepth as number) || 0) * 100) / 100,
      avgScrollbacksPerSession:
        Math.round(((r.avgScrollbacks as number) || 0) * 10) / 10,
      panelAvgTimeSec,
    };
  } catch (error) {
    console.error("[getEngagementOverview] Failed:", error);
    return {
      totalSessions: 0,
      avgTotalTimeSec: 0,
      avgMaxScrollDepth: 0,
      avgScrollbacksPerSession: 0,
      panelAvgTimeSec: {},
    };
  }
}

/**
 * Recent engagement sessions for the admin table.
 */
export async function getRecentEngagementSessions(
  limit: number = 20,
): Promise<EngagementSession[]> {
  try {
    const rows = await sql`
      SELECT
        "id", "reportId", "userId",
        "totalTimeMs", "maxScrollDepth",
        "panelTimes", "scrollbacks",
        "createdAt"
      FROM "ReportEngagement"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      id: r.id as string,
      reportId: r.reportId as string,
      userId: r.userId as string | null,
      totalTimeMs: r.totalTimeMs as number | null,
      maxScrollDepth: r.maxScrollDepth as number | null,
      panelTimes: (r.panelTimes ?? {}) as PanelTimes,
      scrollbackCount: Array.isArray(r.scrollbacks)
        ? (r.scrollbacks as unknown[]).length
        : 0,
      createdAt: (r.createdAt as Date).toISOString(),
    }));
  } catch (error) {
    console.error("[getRecentEngagementSessions] Failed:", error);
    return [];
  }
}
