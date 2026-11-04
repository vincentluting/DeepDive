// ============================================================
// GET /api/admin/my-ip-hash — Return the ipHash for the current request's IP
// Used by admin panel to show the owner's IP hash for EXCLUDED_IP_HASHES config
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { hashIPAddress } from '@/lib/analytics/page-tracking';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';

export const GET = withLogging('/api/admin/my-ip-hash', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    if (!ip) {
      return NextResponse.json({ ipHash: null, message: 'IP not available' });
    }

    const ipHash = await hashIPAddress(ip);
    const excludedHashes = (process.env.EXCLUDED_IP_HASHES || '').split(',').filter(Boolean);
    const isExcluded = excludedHashes.includes(ipHash);
    return NextResponse.json({ ipHash, isExcluded });
  } catch (error) {
    logApiError('/api/admin/my-ip-hash', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to compute IP hash',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});
