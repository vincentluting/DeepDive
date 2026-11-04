// ============================================================
// POST /api/session/create — Create a new QuestionnaireSession in DB
// Input: { sessionId, tier?, language }
// Output: { success: true }
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createSessionWithId } from '@/lib/db/sessions';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { sessionCreateSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

export const POST = withLogging('/api/session/create', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'write' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, sessionCreateSchema);
    if ('error' in parsed) return parsed.error;
    const { sessionId, tier, language } = parsed.data;

    const user = guard.user;

    await createSessionWithId({
      id: sessionId,
      tier: tier ?? 'deep',
      language,
      userId: user?.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/session/create', ApiErrorCode.DB_CONSTRAINT_FAILED, {
      message: 'Failed to create session',
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.DB_CONSTRAINT_FAILED,
      'Failed to create session',
      500,
    );
  }
});
