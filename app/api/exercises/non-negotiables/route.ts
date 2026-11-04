// ============================================================
// GET  /api/exercises/non-negotiables — Get saved selection
// POST /api/exercises/non-negotiables — Save non-negotiables
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { parseBody } from '@/lib/validation/parse-body';
import { saveNonNegotiablesSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { getExercises, saveExercise } from '@/lib/db/profiles';
import { validateNonNegotiables } from '@/lib/action-hub/guided-exercises';

// ── GET: Retrieve saved non-negotiables ─────────────

export const GET = withLogging(
  '/api/exercises/non-negotiables',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const userId = guard.user!.id;
      const exercises = await getExercises(userId);

      return NextResponse.json({
        nonNegotiables: exercises?.nonNegotiables ?? null,
      });
    } catch (error) {
      logApiError('/api/exercises/non-negotiables', ApiErrorCode.INTERNAL_ERROR, {
        message: 'Failed to fetch non-negotiables',
        cause: error,
      });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch non-negotiables', 500);
    }
  },
);

// ── POST: Save non-negotiables selection ─────────────

export const POST = withLogging(
  '/api/exercises/non-negotiables',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, saveNonNegotiablesSchema);
      if ('error' in parsed) return parsed.error;

      const { selected } = parsed.data;

      // Validate against known option IDs
      const validationError = validateNonNegotiables(selected);
      if (validationError) {
        return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, validationError, 400);
      }

      const userId = guard.user!.id;
      const saved = await saveExercise(userId, 'nonNegotiables', {
        selected,
        completedAt: new Date().toISOString(),
      });

      if (!saved) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          'No profile found. Complete your assessment first.',
          404,
        );
      }

      return NextResponse.json({ success: true, selected });
    } catch (error) {
      logApiError('/api/exercises/non-negotiables', ApiErrorCode.INTERNAL_ERROR, {
        message: 'Failed to save non-negotiables',
        cause: error,
      });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to save non-negotiables', 500);
    }
  },
);
