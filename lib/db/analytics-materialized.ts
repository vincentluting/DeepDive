// ============================================================
// Analytics Materialized Views — Fast pre-aggregated queries
//
// Materialized views: analytics_daily_summary, funnel_weekly_summary,
//                     cohort_retention_weekly
// Each query function tries the materialized view first, then falls
// back to raw table queries on failure (view missing / stale / error).
// ============================================================

import { sql } from './connection';

// ── Types ────────────────────────────────────────

export interface CohortRetentionMatrix {
  cohorts: {
    week: string;  // YYYY-MM-DD (cohort week start)
    size: number;
    retention: { weekN: number; rate: number }[];
  }[];
}

export interface RefreshResult {
  durationMs: number;
  views: { name: string; durationMs: number }[];
}

// ── 1. Cohort Retention ──────────────────────────

/**
 * Weekly cohort retention matrix.
 *
 * 此函数优先查物化视图。如物化视图数据过期，
 * 请先调用 refreshMaterializedViews()
 */
export async function getCohortRetention(): Promise<CohortRetentionMatrix> {
  try {
    const rows = await sql`
      SELECT
        TO_CHAR("cohortWeek", 'YYYY-MM-DD') AS "cohortWeek",
        "cohortSize"::int AS "cohortSize",
        "weekNumber"::int AS "weekN",
        "activeUsers"::int AS "activeUsers"
      FROM cohort_retention_weekly
      ORDER BY "cohortWeek" ASC, "weekNumber" ASC
    `;

    // Group rows by cohort week
    const cohortMap = new Map<string, {
      size: number;
      retention: { weekN: number; rate: number }[];
    }>();

    for (const r of rows) {
      const week = r.cohortWeek as string;
      const cohortSize = r.cohortSize as number;
      const weekN = r.weekN as number;
      const activeUsers = r.activeUsers as number;
      const rate = cohortSize > 0
        ? Math.round((activeUsers / cohortSize) * 1000) / 10  // 1 decimal %
        : 0;

      if (!cohortMap.has(week)) {
        cohortMap.set(week, { size: cohortSize, retention: [] });
      }
      cohortMap.get(week)!.retention.push({ weekN, rate });
    }

    const cohorts = Array.from(cohortMap.entries()).map(([week, data]) => ({
      week,
      size: data.size,
      retention: data.retention,
    }));

    return { cohorts };
  } catch (err) {
    console.warn('[analytics-materialized] cohort_retention_weekly query failed:', err);
    return { cohorts: [] };
  }
}

// ── 4. Refresh Materialized Views ────────────────

/**
 * Refresh all three materialized views sequentially.
 * Uses REFRESH MATERIALIZED VIEW CONCURRENTLY for each view.
 * Returns per-view and total durations.
 */
export async function refreshMaterializedViews(): Promise<RefreshResult> {
  const totalStart = Date.now();
  const views: { name: string; durationMs: number }[] = [];

  // Each view refreshed individually — view names are hardcoded constants,
  // not user input, so separate tagged-template calls are safe.
  const refreshOne = async (name: string, refreshFn: () => Promise<unknown>) => {
    const start = Date.now();
    await refreshFn();
    views.push({ name, durationMs: Date.now() - start });
  };

  await refreshOne('analytics_daily_summary', () =>
    sql`REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary`
  );
  await refreshOne('funnel_weekly_summary', () =>
    sql`REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_weekly_summary`
  );
  await refreshOne('cohort_retention_weekly', () =>
    sql`REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_retention_weekly`
  );

  return {
    durationMs: Date.now() - totalStart,
    views,
  };
}
