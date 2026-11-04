import { type NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { getUserPasswordHash, getPendingDeletionRequest, createDeletionRequest, clearUserSessions, cancelDeletionRequest } from '@/lib/db/user-data';
import { verifyPassword } from '@/lib/auth/passwords';
import { parseBody } from '@/lib/validation/parse-body';
import { userDataDeleteSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';

const COOLING_PERIOD_DAYS = 30;

/**
 * POST /api/user-data/delete
 * Request account deletion (soft delete with 30-day cooling period).
 * Requires password verification for security.
 */
export const POST = withLogging('/api/user-data/delete', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write', requireAuth: true });
    if (guard.blocked) return guard.response;

    // Parse and validate password from request body
    const parsed = await parseBody(request, userDataDeleteSchema);
    if ('error' in parsed) return parsed.error;
    const password = parsed.data.password;

    const userId = guard.user!.id;

    // Fetch password hash and verify
    const passwordHash = await getUserPasswordHash(userId);
    if (passwordHash) {
      // Password-based user — verify password
      const isPasswordValid = await verifyPassword(password, passwordHash);
      if (!isPasswordValid) {
        return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, 'Incorrect password', 401);
      }
    }
    // OAuth-only users (no password) skip password verification — they are
    // already authenticated via their session. The deletion cooling period
    // provides additional protection.

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + COOLING_PERIOD_DAYS);

    // Check for existing pending deletion request
    const existing = await getPendingDeletionRequest(userId);

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyPending: true,
        scheduledDeletionAt: existing.scheduledDeletionAt,
        message: 'Deletion is already scheduled.',
      });
    }

    // Insert new deletion request
    await createDeletionRequest(userId, scheduledDate);

    // Clear all user sessions (force logout)
    await clearUserSessions(userId);
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      scheduledDeletionAt: scheduledDate.toISOString(),
      coolingPeriodDays: COOLING_PERIOD_DAYS,
      message: `Account scheduled for deletion on ${scheduledDate.toISOString().slice(0, 10)}. Sign in within ${COOLING_PERIOD_DAYS} days to cancel.`,
    });
  } catch (error) {
    logApiError('/api/user-data/delete', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to process deletion request',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to process deletion request', 500);
  }
});

/**
 * GET /api/user-data/delete
 * Check deletion status for the current user.
 */
export const GET = withLogging('/api/user-data/delete', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read', requireAuth: true });
    if (guard.blocked) return guard.response;

    const pending = await getPendingDeletionRequest(guard.user!.id);

    if (!pending) {
      return NextResponse.json({ pending: false });
    }

    return NextResponse.json({
      pending: true,
      requestedAt: pending.requestedAt,
      scheduledDeletionAt: pending.scheduledDeletionAt,
    });
  } catch (error) {
    logApiError('/api/user-data/delete', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to check deletion status',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to check deletion status', 500);
  }
});

/**
 * DELETE /api/user-data/delete
 * Cancel a pending deletion request (user changed their mind).
 */
export const DELETE = withLogging('/api/user-data/delete', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write', requireAuth: true });
    if (guard.blocked) return guard.response;

    const cancelled = await cancelDeletionRequest(guard.user!.id);

    if (!cancelled) {
      return NextResponse.json({
        success: true,
        message: 'No pending deletion to cancel.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Deletion request cancelled. Your account is safe.',
    });
  } catch (error) {
    logApiError('/api/user-data/delete', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to cancel deletion request',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to cancel deletion request', 500);
  }
});
