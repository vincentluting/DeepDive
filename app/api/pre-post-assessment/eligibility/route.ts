// ============================================================
// GET /api/pre-post-assessment/eligibility
// Check if user is eligible for post_1week follow-up assessment
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { isEligibleForPost1Week } from '@/lib/db/pre-post-assessment';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';

export const GET = withLogging('/api/pre-post-assessment/eligibility', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read' });
    if (guard.blocked) return guard.response;

    const userId = guard.user?.id;
    if (!userId) {
      return NextResponse.json({ eligible: false, postImmediateDate: null });
    }

    // Also check if user is a research participant
    const result = await isEligibleForPost1Week(userId);
    return NextResponse.json(result);
  } catch (error) {
    logApiError('/api/pre-post-assessment/eligibility', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to check post_1week eligibility',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});
