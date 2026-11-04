// ============================================================
// GET /api/cron/refresh-analytics — Refresh materialized views
// Scheduled: hourly (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { refreshMaterializedViews } from '@/lib/db/analytics-materialized';
import { logAnalyticsError } from '@/lib/analytics/errors';
import { guardCron } from '@/lib/api/guard-cron';
import { withLogging } from '@/lib/api/with-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withLogging('/api/cron/refresh-analytics', async (request: NextRequest) => {
  const cronGuard = guardCron(request);
  if (cronGuard.blocked) return cronGuard.response;

  const start = Date.now();
  try {
    console.log('[cron:refresh-analytics] Starting materialized view refresh'); // intentional
    const result = await refreshMaterializedViews();
    const durationMs = Date.now() - start;
    console.log(`[cron:refresh-analytics] Done — durationMs=${durationMs}`); // intentional

    return NextResponse.json({
      success: true,
      views: result.views,
      durationMs,
    });
  } catch (err) {
    await logAnalyticsError('cron', 'refresh-analytics', err);
    return NextResponse.json(
      { success: false, error: 'Analytics refresh failed' },
      { status: 500 },
    );
  }
});
