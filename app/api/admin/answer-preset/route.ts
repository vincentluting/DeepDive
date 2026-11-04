// ============================================================
// Admin Answer Preset API
//
// GET  /api/admin/answer-preset — Get admin's saved answer preset
// POST /api/admin/answer-preset — Import latest session answers as preset
//
// Admin-only: requires guardRoute with tier: 'admin'.
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { getAdminPreset, saveAdminPreset, deleteAdminPreset } from '@/lib/db/admin-presets';
import { sql } from '@/lib/db/connection';

// ── GET: Retrieve admin's answer preset ──────────────────────

export const GET = withLogging('/api/admin/answer-preset', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const preset = await getAdminPreset(guard.user!.id);

    return NextResponse.json({
      preset: preset ? {
        id: preset.id,
        name: preset.name,
        hasQuickDive: !!preset.quickDiveAnswers,
        hasDeepDive: !!preset.deepDiveAnswers,
        locale: preset.locale,
        updatedAt: preset.updatedAt,
      } : null,
    });
  } catch (error) {
    logApiError('/api/admin/answer-preset', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to get preset',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to get preset', 500);
  }
});

// ── POST: Import answers from latest sessions ────────────────

export const POST = withLogging('/api/admin/answer-preset', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    const userId = guard.user!.id;

    // Fetch latest completed Quick Dive result for this user
    const qdRows = await sql`
      SELECT "scoresJson", "resultDataJson", "language"
      FROM "QuickDiveResult"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    // Fetch latest completed Deep Dive session for this user
    const ddRows = await sql`
      SELECT "answersJson", "language", "totalTimeMs"
      FROM "QuestionnaireSession"
      WHERE "userId" = ${userId} AND "tier" = 'deep' AND "status" = 'completed'
      ORDER BY "completedAt" DESC
      LIMIT 1
    `;

    if (qdRows.length === 0 && ddRows.length === 0) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'No completed assessments found. Complete Quick Dive or Deep Dive first.',
        400,
      );
    }

    const locale = (qdRows[0]?.language as string) || (ddRows[0]?.language as string) || 'en';

    // Build Quick Dive answers from saved scores
    const quickDiveAnswers = qdRows.length > 0
      ? {
          scores: qdRows[0].scoresJson as Record<string, number>,
          resultData: qdRows[0].resultDataJson as Record<string, unknown> | null,
        }
      : null;

    // Build Deep Dive answers from session answersJson
    // The answersJson contains the raw question-answer pairs that need to be
    // transformed into the scoring pipeline input format (sjt, values, ipip60)
    let deepDiveAnswers: Record<string, unknown> | null = null;
    if (ddRows.length > 0) {
      const rawAnswers = ddRows[0].answersJson as Array<{
        moduleCode: string;
        itemId: number;
        value: unknown;
      }>;
      deepDiveAnswers = transformSessionAnswers(rawAnswers);
    }

    const presetId = await saveAdminPreset({
      userId,
      name: 'My Answers',
      quickDiveAnswers,
      deepDiveAnswers,
      locale,
    });

    return NextResponse.json({
      id: presetId,
      imported: {
        quickDive: !!quickDiveAnswers,
        deepDive: !!deepDiveAnswers,
      },
      locale,
    });
  } catch (error) {
    logApiError('/api/admin/answer-preset', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to import preset',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to import preset', 500);
  }
});

// ── DELETE: Remove admin's answer preset ─────────────────────

export const DELETE = withLogging('/api/admin/answer-preset', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'admin' });
    if (guard.blocked) return guard.response;

    await deleteAdminPreset(guard.user!.id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logApiError('/api/admin/answer-preset', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to delete preset',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to delete preset', 500);
  }
});

// ── Helper: Transform raw session answers to scoring input ───

/**
 * Transform QuestionnaireSession.answersJson (array of per-question answers)
 * into the scoring pipeline input format { sjt, values, ipip60 }.
 *
 * Module A (SJT): 6 scenarios with wouldChoice/shouldChoice
 * Module B (TwIVI): 20 items rated 1-6
 * Module C (IPIP-60): 60 items rated 1-5
 */
function transformSessionAnswers(
  rawAnswers: Array<{ moduleCode: string; itemId: number; value: unknown }>,
): Record<string, unknown> {
  // Module B: TwIVI (values)
  const values: Record<number, number> = {};
  // Module C: IPIP-60
  const ipip60: Record<number, number> = {};
  // Module A: SJT — group by scenario
  const sjtMap = new Map<number, { wouldChoice?: string; shouldChoice?: string }>();

  for (const answer of rawAnswers) {
    const { moduleCode, itemId, value } = answer;

    if (moduleCode === 'B') {
      values[itemId] = value as number;
    } else if (moduleCode === 'C') {
      ipip60[itemId] = value as number;
    } else if (moduleCode === 'A') {
      // SJT answers: value is { wouldChoice, shouldChoice } or similar
      // The itemId maps to scenario number
      if (typeof value === 'object' && value !== null) {
        const v = value as { wouldChoice?: string; shouldChoice?: string };
        sjtMap.set(itemId, {
          wouldChoice: v.wouldChoice,
          shouldChoice: v.shouldChoice,
        });
      }
    }
  }

  // Build SJT array sorted by scenario ID
  const sjt = Array.from(sjtMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([scenarioId, choices]) => ({
      scenarioId,
      wouldChoice: choices.wouldChoice ?? 'A',
      shouldChoice: choices.shouldChoice ?? 'A',
    }));

  return { sjt, values, ipip60 };
}
