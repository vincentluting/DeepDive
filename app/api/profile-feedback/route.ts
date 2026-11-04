// ============================================================
// POST /api/profile-feedback — Profile narrative accuracy feedback
// Saves micro-feedback (accurate/unsure) for profile narrative sections.
// Appends to UserProfile.insightsJson.profileFeedback array.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { profileFeedbackSchema } from '@/lib/validation/api-schemas';
import { getUserProfileInsights, updateUserProfileInsights } from '@/lib/db/profiles';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

// GET — Retrieve socialLinks from UserProfile.insightsJson
export const GET = withLogging('/api/profile-feedback', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read', requireAuth: true });
    if (guard.blocked) return guard.response;

    const existing = await getUserProfileInsights(guard.user!.id);
    const insightsJson: Record<string, unknown> = existing?.insightsJson ?? {};
    const socialLinks = Array.isArray(insightsJson.socialLinks) ? insightsJson.socialLinks : [];

    return NextResponse.json({ socialLinks });
  } catch (error) {
    logApiError('/api/profile-feedback', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch profile data',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch profile data', 500);
  }
});

// POST — Save feedback or socialLinks
export const POST = withLogging('/api/profile-feedback', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write', requireAuth: true });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, profileFeedbackSchema);
    if ('error' in parsed) return parsed.error;

    const { section, accurate, data } = parsed.data;
    const userId = guard.user!.id;

    // Read existing insights
    const existing = await getUserProfileInsights(userId);
    const insightsJson: Record<string, unknown> = existing?.insightsJson ?? {};

    let updated: Record<string, unknown>;

    if (section === 'socialLinks' && Array.isArray(data)) {
      // Social links: replace entire array (max 5 entries, validated)
      const sanitized = (data as Array<{ platform?: string; url?: string }>)
        .slice(0, 5)
        .filter(item => item && typeof item.url === 'string' && item.url.trim().length > 0)
        .map(item => ({
          platform: String(item.platform || 'other').slice(0, 20),
          url: String(item.url).slice(0, 500),
        }));
      updated = { ...insightsJson, socialLinks: sanitized };
    } else {
      // Default: append feedback entry
      const existingFeedback = Array.isArray(insightsJson.profileFeedback)
        ? insightsJson.profileFeedback
        : [];
      existingFeedback.push({
        section,
        accurate,
        timestamp: new Date().toISOString(),
      });
      updated = { ...insightsJson, profileFeedback: existingFeedback };
    }

    await updateUserProfileInsights(userId, JSON.stringify(updated));

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/profile-feedback', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to save profile feedback',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to save feedback', 500);
  }
});
