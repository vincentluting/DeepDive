// ============================================================
// GET  /api/exercises/flow-moments — Get saved flow moments
// POST /api/exercises/flow-moments — Save 3 flow moments
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { parseBody } from '@/lib/validation/parse-body';
import { saveFlowMomentsSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { getExercises, saveExercise } from '@/lib/db/profiles';
import { validateFlowMoments } from '@/lib/action-hub/guided-exercises';

export const GET = withLogging(
  '/api/exercises/flow-moments',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const exercises = await getExercises(guard.user!.id);
      return NextResponse.json({ flowMoments: exercises?.flowMoments ?? null });
    } catch (error) {
      logApiError('/api/exercises/flow-moments', ApiErrorCode.INTERNAL_ERROR, { cause: error });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch flow moments', 500);
    }
  },
);

export const POST = withLogging(
  '/api/exercises/flow-moments',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, saveFlowMomentsSchema);
      if ('error' in parsed) return parsed.error;

      const validationError = validateFlowMoments(parsed.data.moments);
      if (validationError) {
        return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, validationError, 400);
      }

      const saved = await saveExercise(guard.user!.id, 'flowMoments', {
        moments: parsed.data.moments,
        completedAt: new Date().toISOString(),
      });

      if (!saved) {
        return createErrorResponse(ApiErrorCode.ASSESSMENT_NOT_FOUND, 'No profile found.', 404);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError('/api/exercises/flow-moments', ApiErrorCode.INTERNAL_ERROR, { cause: error });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to save flow moments', 500);
    }
  },
);
