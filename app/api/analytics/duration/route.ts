// ============================================================
// POST /api/analytics/duration — Update page dwell time
// Called client-side via sendBeacon or fetch keepalive when user leaves.
// Body: { visitId: string, durationMs: number }
// CSRF exempt (sendBeacon cannot set custom headers).
// No guardRoute — sendBeacon tracking must stay lightweight (no auth DB query).
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { updateVisitDuration } from '@/lib/analytics/page-tracking';
import { parseBody } from '@/lib/validation/parse-body';
import { analyticsDurationSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';
import { checkRateLimit } from '@/lib/api/rate-limit';

const ok = () => NextResponse.json({ ok: true });

const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes cap
const MIN_DURATION_MS = 1000;            // Ignore < 1 second

export const POST = withLogging('/api/analytics/duration', async (request: NextRequest) => {
  try {
    if (process.env.E2E_DISABLE_ANALYTICS === 'true') return ok();

    // Lightweight IP-based rate limit (no auth needed for beacon)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rl = checkRateLimit(`analytics:duration:${ip}`, { maxRequests: 60, windowSeconds: 60 });
    if (!rl.allowed) return ok();
    // Use project-standard Zod validation — fail silently on bad input
    const parsed = await parseBody(request, analyticsDurationSchema);
    if ('error' in parsed) return ok();

    const { visitId, durationMs } = parsed.data;

    if (durationMs < MIN_DURATION_MS) {
      // Silently ignore too-short durations
      return ok();
    }

    const capped = Math.min(durationMs, MAX_DURATION_MS);
    await updateVisitDuration(visitId, capped);

    return ok();
  } catch (err) {
    logApiError('/api/analytics/duration', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to update visit duration',
      cause: err,
    });
    // Never fail loudly — duration is best-effort
    return ok();
  }
});
