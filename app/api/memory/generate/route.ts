// ============================================================
// POST /api/memory/generate — Deterministic Memory Generation
//
// Generates 10-15 memory entries from the user's assessment,
// profile, and report data WITHOUT calling any LLM.
//
// Body: { forceRegenerate?: boolean }
//   forceRegenerate: if true, deactivates existing memories first
//
// Returns: { memories: MemoryEntry[], count: number }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { memoryGenerateSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';
import { deactivateAllMemories, saveMemories } from '@/lib/db/memory';
import { getProfile } from '@/lib/db/profiles';
import { getLatestReportJsonByUserId } from '@/lib/db/reports';
import { generateMemoriesFromAssessment } from '@/lib/memory/generate-from-assessment';

export const POST = withLogging('/api/memory/generate', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write', requireAuth: true });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, memoryGenerateSchema);
    if ('error' in parsed) return parsed.error;
    const { forceRegenerate } = parsed.data;

    const userId = guard.user!.id;

    // Fetch supporting data (all nullable — generation degrades gracefully)
    const [profile, report] = await Promise.all([
      getProfile(userId),
      getLatestReportJsonByUserId(userId),
    ]);

    const memories = generateMemoriesFromAssessment({
      profile,
      assessment: null, // profile already contains all derived scores
      report,
      locale: 'en',
    });

    if (forceRegenerate) {
      await deactivateAllMemories(userId);
    }

    await saveMemories(userId, memories);

    return NextResponse.json({ memories, count: memories.length });
  } catch (error) {
    logApiError('/api/memory/generate', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to generate memories',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to generate memories', 500);
  }
});
