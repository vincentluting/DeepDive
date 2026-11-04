// ============================================================
// PATCH /api/action-hub/items — Update action item status/note
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { parseBody } from '@/lib/validation/parse-body';
import { actionItemUpdateSchema } from '@/lib/validation/api-schemas';
import { completeActionItem, updateActionItemStatus, checkAndReachMilestones } from '@/lib/db/action-hub';

export const maxDuration = 10;

export const PATCH = withLogging(
  '/api/action-hub/items',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, actionItemUpdateSchema);
      if ('error' in parsed) return parsed.error;
      const { itemId, status, note } = parsed.data;
      const userId = guard.user!.id;

      let updated: boolean;
      if (status === 'completed') {
        updated = await completeActionItem(itemId, note, userId);
      } else {
        updated = await updateActionItemStatus(itemId, status, userId);
      }

      if (!updated) {
        return createErrorResponse(ApiErrorCode.SESSION_NOT_FOUND, 'Action item not found', 404);
      }

      let reachedMilestoneIds: string[] = [];
      if (status === 'completed') {
        // Fire-and-forget: achievements (non-critical)
        import('@/lib/achievements/engine').then(m => m.checkAchievements(userId, 'action_item_completed', { isFirst: true })).catch(() => {});
        // Await: milestone check (needed for UI feedback)
        reachedMilestoneIds = await checkAndReachMilestones(itemId).catch(() => [] as string[]);
      }

      return NextResponse.json({ success: true, itemId, status, reachedMilestoneIds });
    } catch (error) {
      logApiError('/api/action-hub/items', ApiErrorCode.INTERNAL_ERROR, {
        message: 'Failed to update action item',
        cause: error,
      });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to update action item', 500);
    }
  },
);
