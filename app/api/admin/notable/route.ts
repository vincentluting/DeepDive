// ============================================================
// /api/admin/notable — Notable visitor detection & management
//
// GET:   Return active (non-expired, non-dismissed) notable visitors
// POST:  Trigger a scan of recent visits to find notable visitors
// PATCH: Dismiss a notable visitor (body: { ipHash: string })
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import {
  getNotableVisitors,
  scanNotableVisitors,
  dismissNotableVisitor,
} from '@/lib/db/analytics-visits';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';
import { parseBody } from '@/lib/validation/parse-body';
import { notablePatchSchema } from '@/lib/validation/api-schemas';

export const GET = withLogging('/api/admin/notable', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const visitors = await getNotableVisitors();
    return NextResponse.json({ visitors });
  } catch (error) {
    logApiError('/api/admin/notable', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch notable visitors',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});

export const POST = withLogging('/api/admin/notable', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const count = await scanNotableVisitors();
    return NextResponse.json({ success: true, newCount: count });
  } catch (error) {
    logApiError('/api/admin/notable', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to scan notable visitors',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});

export const PATCH = withLogging('/api/admin/notable', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, notablePatchSchema);
    if ('error' in parsed) return parsed.error;
    const { ipHash } = parsed.data;

    await dismissNotableVisitor(ipHash);
    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/admin/notable', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to dismiss notable visitor',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});
