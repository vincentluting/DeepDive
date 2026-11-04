import { type NextRequest, NextResponse } from 'next/server';
import { saveSessionProgress } from '@/lib/db/sessions';
import { sql } from '@/lib/db/connection';
import { guardRoute } from '@/lib/api/api-guard';
import type { ModuleCode, SessionQuestionAnswer } from '@/lib/types';
import { parseBody } from '@/lib/validation/parse-body';
import { sessionSaveSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

// Map client-side phase numbers to module codes (v2.0: A/B/C)
const PHASE_TO_MODULE: Record<number, ModuleCode> = {
  1: 'A',
  2: 'B',
  3: 'C',
};

export const POST = withLogging('/api/session/save', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, sessionSaveSchema);
    if ('error' in parsed) return parsed.error;
    const { sessionId, answers, currentModule, currentPhase, currentQuestionIndex, language, explorationProgress } = parsed.data;

    // Accept either currentModule or currentPhase from the client
    const module: ModuleCode = (currentModule as ModuleCode | undefined)
      ?? PHASE_TO_MODULE[currentPhase as number]
      ?? 'A';

    // userId from guardRoute (undefined for anonymous users)
    const userId = guard.user?.id;

    // Ownership check: prevent saving to sessions owned by other users
    const existing = await sql`
      SELECT "userId" FROM "QuestionnaireSession" WHERE "id" = ${sessionId}
    `;
    if (existing.length > 0 && existing[0].userId && existing[0].userId !== (userId ?? null)) {
      return createErrorResponse(ApiErrorCode.UNAUTHORIZED, 'Session belongs to another user', 403);
    }

    await saveSessionProgress(
      sessionId,
      answers as SessionQuestionAnswer[],
      module,
      currentQuestionIndex as number,
      language,
      explorationProgress as Record<string, unknown> | undefined,
      userId,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/session/save', ApiErrorCode.INTERNAL_ERROR, { message: 'Failed to save session', cause: error });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to save session', 500);
  }
});
