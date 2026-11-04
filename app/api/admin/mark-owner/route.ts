// ============================================================
// /api/admin/mark-owner — Set/clear owner cookie to suppress tracking
// GET: check if current browser is marked as owner
// POST: mark browser as owner (suppresses page visit tracking)
// DELETE: clear owner marker
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';

const OWNER_COOKIE = '_dd_owner';
const ONE_YEAR = 60 * 60 * 24 * 365;

export const GET = withLogging('/api/admin/mark-owner', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const marked = request.cookies.get(OWNER_COOKIE)?.value === '1';
    return NextResponse.json({ marked });
  } catch (error) {
    logApiError('/api/admin/mark-owner', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to check owner status',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});

export const POST = withLogging('/api/admin/mark-owner', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const response = NextResponse.json({ success: true, marked: true });
    response.cookies.set(OWNER_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_YEAR,
      path: '/',
    });
    return response;
  } catch (error) {
    logApiError('/api/admin/mark-owner', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to set owner marker',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});

export const DELETE = withLogging('/api/admin/mark-owner', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const response = NextResponse.json({ success: true, marked: false });
    response.cookies.set(OWNER_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (error) {
    logApiError('/api/admin/mark-owner', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to clear owner marker',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});
