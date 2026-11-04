// ============================================================
// GET  /api/exercises/energy-log — Get energy log entries
// POST /api/exercises/energy-log — Save a single day's entry
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { parseBody } from '@/lib/validation/parse-body';
import { saveEnergyEntrySchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { getExercises, saveExercise } from '@/lib/db/profiles';
import { validateEnergyEntry, type EnergyLogEntry, type EnergyLogResult } from '@/lib/action-hub/guided-exercises';

export const GET = withLogging(
  '/api/exercises/energy-log',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const exercises = await getExercises(guard.user!.id);
      return NextResponse.json({ energyLog: exercises?.energyLog ?? null });
    } catch (error) {
      logApiError('/api/exercises/energy-log', ApiErrorCode.INTERNAL_ERROR, { cause: error });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch energy log', 500);
    }
  },
);

export const POST = withLogging(
  '/api/exercises/energy-log',
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: 'auth', requireAuth: true });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, saveEnergyEntrySchema);
      if ('error' in parsed) return parsed.error;

      const entry: EnergyLogEntry = {
        ...parsed.data,
        overallEnergy: parsed.data.overallEnergy as EnergyLogEntry['overallEnergy'],
        date: new Date().toISOString().split('T')[0],
      };

      const validationError = validateEnergyEntry(entry);
      if (validationError) {
        return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, validationError, 400);
      }

      const userId = guard.user!.id;

      // Read existing log, merge new entry
      const existing = await getExercises(userId);
      const currentLog: EnergyLogResult = (existing?.energyLog as EnergyLogResult) ?? {
        entries: [],
        completedAt: null,
        startedAt: new Date().toISOString(),
      };

      // Replace entry for same day, or append
      const entries = currentLog.entries.filter((e: EnergyLogEntry) => e.day !== entry.day);
      entries.push(entry);
      entries.sort((a: EnergyLogEntry, b: EnergyLogEntry) => a.day - b.day);

      const isComplete = entries.length >= 7;

      const saved = await saveExercise(userId, 'energyLog', {
        entries,
        completedAt: isComplete ? new Date().toISOString() : null,
        startedAt: currentLog.startedAt,
      });

      if (!saved) {
        return createErrorResponse(ApiErrorCode.ASSESSMENT_NOT_FOUND, 'No profile found.', 404);
      }

      return NextResponse.json({
        success: true,
        day: entry.day,
        totalDays: entries.length,
        isComplete,
      });
    } catch (error) {
      logApiError('/api/exercises/energy-log', ApiErrorCode.INTERNAL_ERROR, { cause: error });
      return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to save energy entry', 500);
    }
  },
);
