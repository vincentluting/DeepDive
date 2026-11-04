// ============================================================
// POST /api/session/ensure — Ensure session row exists in DB
// Called synchronously before FK-dependent operations (score, reality-conditions)
// to eliminate the race condition where the fire-and-forget session creation
// hasn't completed yet.
// Input: { sessionId, tier?, language }
// Output: { success: true }
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { ensureSessionExists } from '@/lib/db/sessions';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { sessionCreateSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

export const POST = withLogging('/api/session/ensure', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, sessionCreateSchema);
    if ('error' in parsed) return parsed.error;
    const { sessionId, tier, language } = parsed.data;

    await ensureSessionExists(sessionId, language, tier ?? 'deep', guard.user?.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/session/ensure', ApiErrorCode.DB_CONSTRAINT_FAILED, {
      message: 'Failed to ensure session exists',
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.DB_CONSTRAINT_FAILED,
      'Failed to ensure session exists',
      500,
    );
  }
});
