// ============================================================
// GET /api/session/resume — Find the user's latest in-progress session
// Returns session data so the client can restore from DB when localStorage is empty
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";
import { sql } from "@/lib/db/connection";

export const GET = withLogging(
  "/api/session/resume",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "read",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const userId = guard.user!.id;

    try {
      const rows = await sql`
      SELECT "id", "language", "answersJson", "currentQuestionIndex", "currentModule",
             "explorationProgressJson", "startedAt"
      FROM "QuestionnaireSession"
      WHERE "userId" = ${userId}
        AND "status" = 'in_progress'
        AND "startedAt" > NOW() - INTERVAL '48 hours'
      ORDER BY "startedAt" DESC
      LIMIT 1
    `;

      if (rows.length === 0) {
        return NextResponse.json({ session: null });
      }

      const row = rows[0];
      const answers = row.answersJson ?? [];

      // Only return sessions that have actual progress
      if (!Array.isArray(answers) || answers.length === 0) {
        return NextResponse.json({ session: null });
      }

      return NextResponse.json({
        session: {
          id: row.id,
          language: row.language,
          answersJson: answers,
          currentQuestionIndex: row.currentQuestionIndex,
          currentModule: row.currentModule,
          explorationProgressJson: row.explorationProgressJson,
          startedAt: new Date(row.startedAt).getTime(),
          answerCount: answers.length,
        },
      });
    } catch (error) {
      logApiError("/api/session/resume", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to resume session",
        cause: error,
      });
      return NextResponse.json({ session: null });
    }
  },
);
