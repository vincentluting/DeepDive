// ============================================================
// Analytics Error Logger — observability for the analytics layer
//
// Provides fire-and-forget error recording to the AnalyticsError
// table. Failures in this module never propagate — analytics errors
// must never crash the main user flow.
// ============================================================

import { sql } from '@/lib/db/connection';
import * as Sentry from '@sentry/nextjs';

type AnalyticsLayer = 'funnel' | 'page_visit' | 'engagement' | 'identity' | 'cron';

/**
 * Log an error that occurred inside the analytics layer.
 *
 * Always calls console.error first (guaranteed), then attempts to persist
 * the error to the AnalyticsError table. DB failures are swallowed to
 * avoid recursion.
 */
export async function logAnalyticsError(
  layer: AnalyticsLayer,
  event: string | null,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  // Always log to console first — this must never be skipped
  console.error(`[analytics:${layer}]${event ? ` event="${event}"` : ''}`, error);

  // Report to Sentry for production observability
  try {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { analyticsLayer: layer, analyticsEvent: event ?? 'unknown' },
      extra: context,
      level: 'warning',
    });
  } catch {
    // Sentry failure is non-critical
  }

  // Attempt DB persistence — swallow failures to prevent recursion
  try {
    const id = crypto.randomUUID();
    const errorText = (
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error)
    ).slice(0, 2000);

    await sql`
      INSERT INTO "AnalyticsError" ("id", "layer", "event", "error", "context")
      VALUES (
        ${id},
        ${layer},
        ${event ?? null},
        ${errorText},
        ${context ? JSON.stringify(context) : null}::jsonb
      )
    `;
  } catch (dbErr) {
    console.error('[analytics:errors] Failed to persist error to DB:', dbErr);
  }
}

// ─── Health query ────────────────────────────────────────────

export interface AnalyticsHealth {
  errorsLast1h: number;
  errorsLast24h: number;
  errorsLast7d: number;
  byLayer: { layer: string; count: number }[];
  recentErrors: {
    layer: string;
    event: string | null;
    error: string;
    createdAt: string;
  }[];
}

/**
 * Aggregate error counts for a quick health dashboard.
 * recentErrors is capped at 5 rows.
 */
export async function getAnalyticsHealth(): Promise<AnalyticsHealth> {
  const [countsRows, byLayerRows, recentRows] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 hour')  AS "last1h",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '24 hours') AS "last24h",
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days')   AS "last7d"
      FROM "AnalyticsError"
    `,
    sql`
      SELECT "layer", COUNT(*) AS "count"
      FROM "AnalyticsError"
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY "layer"
      ORDER BY "count" DESC
    `,
    sql`
      SELECT "layer", "event", "error", "createdAt"
      FROM "AnalyticsError"
      ORDER BY "createdAt" DESC
      LIMIT 5
    `,
  ]);

  const counts = countsRows[0] ?? { last1h: 0, last24h: 0, last7d: 0 };

  return {
    errorsLast1h: Number(counts.last1h ?? 0),
    errorsLast24h: Number(counts.last24h ?? 0),
    errorsLast7d: Number(counts.last7d ?? 0),
    byLayer: byLayerRows.map((r) => ({
      layer: r.layer as string,
      count: Number(r.count),
    })),
    recentErrors: recentRows.map((r) => ({
      layer: r.layer as string,
      event: (r.event as string | null) ?? null,
      error: r.error as string,
      createdAt: (r.createdAt as Date).toISOString(),
    })),
  };
}
