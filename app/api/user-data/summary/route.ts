import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { getUserDataSummary } from '@/lib/db/user-data';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';

/**
 * GET /api/user-data/summary
 * Returns counts of each data category stored for the current user.
 */
export const GET = withLogging('/api/user-data/summary', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read', requireAuth: true });
    if (guard.blocked) return guard.response;

    const summary = await getUserDataSummary(guard.user!.id);

    return NextResponse.json(summary);
  } catch (error) {
    logApiError('/api/user-data/summary', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to get data summary',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to get data summary', 500);
  }
});
