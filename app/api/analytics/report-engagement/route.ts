// ============================================================
// POST /api/analytics/report-engagement — Save report engagement data
// Called client-side via sendBeacon or fetch keepalive when user
// leaves the report page or the tab becomes hidden.
// Body: { id, reportId, panelTimes, scrollbacks, maxScrollDepth, totalTimeMs }
// Failures are silently swallowed — never affects user experience.
// CSRF exempt (sendBeacon cannot set custom headers).
// No guardRoute — sendBeacon tracking must stay lightweight (no auth DB query).
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { saveReportEngagement } from '@/lib/db/report-engagement';
import { getCurrentUser } from '@/lib/auth';
import { parseBody } from '@/lib/validation/parse-body';
import { reportEngagementSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';
import { checkRateLimit } from '@/lib/api/rate-limit';

const ok = () => NextResponse.json({ ok: true });

const MAX_TOTAL_MS = 60 * 60 * 1000; // 1 hour cap
const MAX_SCROLLBACKS = 50;
const ALLOWED_SECTIONS = ['anchors', 'strengths', 'careers', 'shadow', 'letter', 'explore'];

export const POST = withLogging('/api/analytics/report-engagement', async (request: NextRequest) => {
  try {
    if (process.env.E2E_DISABLE_ANALYTICS === 'true') return ok();

    // Lightweight IP-based rate limit (no auth needed for beacon)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rl = checkRateLimit(`analytics:engagement:${ip}`, { maxRequests: 30, windowSeconds: 60 });
    if (!rl.allowed) return ok();
    // Use project-standard Zod validation — fail silently on bad input
    const parsed = await parseBody(request, reportEngagementSchema);
    if ('error' in parsed) return ok();

    const { id, reportId, panelTimes, scrollbacks, maxScrollDepth, totalTimeMs } = parsed.data;

    // Resolve userId from session (best-effort)
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch (err) {
      // Session lookup failed — log and continue without userId
      logApiError('/api/analytics/report-engagement', ApiErrorCode.INTERNAL_ERROR, {
        message: 'Session lookup failed for engagement tracking',
        cause: err,
      });
    }

    // Sanitize numeric fields
    const safeMaxScrollDepth =
      typeof maxScrollDepth === 'number' && isFinite(maxScrollDepth)
        ? Math.min(Math.max(maxScrollDepth, 0), 1)
        : null;

    const safeTotalTimeMs =
      typeof totalTimeMs === 'number' && totalTimeMs > 0
        ? Math.min(totalTimeMs, MAX_TOTAL_MS)
        : null;

    // Sanitize panel times — only keep expected keys, cap at MAX_TOTAL_MS
    const safePanelTimes: Record<string, number> = {};
    for (const key of ALLOWED_SECTIONS) {
      if (typeof panelTimes[key] === 'number' && panelTimes[key] > 0) {
        safePanelTimes[key] = Math.min(panelTimes[key], MAX_TOTAL_MS);
      }
    }

    // Sanitize scrollback events — cap array length
    const safeScrollbacks = scrollbacks
      .slice(0, MAX_SCROLLBACKS)
      .filter(
        (e) =>
          e &&
          typeof e.from === 'string' &&
          typeof e.to === 'string' &&
          typeof e.atMs === 'number',
      );

    await saveReportEngagement({
      id,
      reportId,
      userId,
      panelTimes: safePanelTimes,
      scrollbacks: safeScrollbacks,
      maxScrollDepth: safeMaxScrollDepth,
      totalTimeMs: safeTotalTimeMs,
    });

    return ok();
  } catch (err) {
    logApiError('/api/analytics/report-engagement', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to save report engagement',
      cause: err,
    });
    // Never fail loudly — engagement data is best-effort
    return ok();
  }
});
