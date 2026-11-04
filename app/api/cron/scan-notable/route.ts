// ============================================================
// GET /api/cron/scan-notable — Scan for notable visitors
// Scheduled: daily at 09:00 UTC (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { scanNotableVisitors } from '@/lib/db/analytics-visits';
import { logAnalyticsError } from '@/lib/analytics/errors';
import { guardCron } from '@/lib/api/guard-cron';
import { withLogging } from '@/lib/api/with-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withLogging('/api/cron/scan-notable', async (request: NextRequest) => {
  const cronGuard = guardCron(request);
  if (cronGuard.blocked) return cronGuard.response;

  const start = Date.now();
  try {
    console.log('[cron:scan-notable] Starting scan'); // intentional
    const newCount = await scanNotableVisitors();
    const durationMs = Date.now() - start;
    console.log(`[cron:scan-notable] Done — newCount=${newCount} durationMs=${durationMs}`); // intentional

    return NextResponse.json({
      success: true,
      newCount,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    await logAnalyticsError('cron', 'scan-notable', err);
    return NextResponse.json(
      { success: false, error: 'Notable visitor scan failed' },
      { status: 500 },
    );
  }
});
