// ============================================================
// GET /api/public-profile/[username] — Public profile data
// No authentication required. Returns profile + social links
// only if the user has set isPublic = true.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getPublicProfileByUsername } from '@/lib/db/profiles';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';
import { guardRoute } from '@/lib/api/api-guard';

export const GET = withLogging('/api/public-profile/[username]', async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  try {
    const guard = await guardRoute(request, { tier: 'read' });
    if (guard.blocked) return guard.response;

    const params = await context.params;
    const { username } = params;

    if (!username || username.length < 3 || username.length > 30) {
      return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, 'Invalid username', 400);
    }

    const data = await getPublicProfileByUsername(username);
    if (!data) {
      return createErrorResponse(ApiErrorCode.ASSESSMENT_NOT_FOUND, 'Profile not found', 404);
    }

    // Return only public-safe fields
    const { profileJson, socialLinks } = data;
    return NextResponse.json({
      archetype: profileJson.archetype,
      collabMapping: profileJson.collabMapping,
      narrativeSnapshots: profileJson.narrativeSnapshots
        ? { coreInsight: profileJson.narrativeSnapshots.coreInsight }
        : null,
      schwartzAnchors: profileJson.schwartzAnchors
        ? { top3: profileJson.schwartzAnchors.top3 }
        : null,
      socialLinks,
    });
  } catch (error) {
    logApiError('/api/public-profile/[username]', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch public profile',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch public profile', 500);
  }
});
