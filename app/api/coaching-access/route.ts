// ============================================================
// GET /api/coaching-access — Return the current user's coaching access level
//
// Auth: required
// Tier: read
//
// Response:
//   { level: 0|1|2, maxRounds: number|null, completedRounds: number, primaryRiasecType: string|null }
//
//   level 0 — No Quick Dive completed; coaching locked
//   level 1 — Quick Dive done, no Deep Dive; limited to COACH_STATE1_MAX_ROUNDS rounds
//   level 2 — Deep Dive completed; fully unlocked
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { getCoachAccessLevel } from '@/lib/coaching/get-coach-access-level';

export const GET = withLogging('/api/coaching-access', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read', requireAuth: true });
    if (guard.blocked) return guard.response;

    const access = await getCoachAccessLevel(guard.user!.id);
    return NextResponse.json({ ...access, userId: guard.user!.id });
  } catch (error) {
    logApiError('/api/coaching-access', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to get coach access level',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to get coach access level', 500);
  }
});
