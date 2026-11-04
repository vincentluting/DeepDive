// ============================================================
// GET /api/coaching-sessions — List or load resumable sessions
//
// Query:  ?id=<sessionId> or ?limit=<1..20>
// Output: { session } or { sessions }
// ============================================================

import { NextRequest, NextResponse } from "next/server";

import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import {
  getCoachingSessionForUser,
  getRecentCoachingSessions,
} from "@/lib/db/coaching";

export const GET = withLogging(
  "/api/coaching-sessions",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "auth",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;
      const userId = guard.user!.id;
      const sessionId = request.nextUrl.searchParams.get("id");

      if (sessionId) {
        const session = await getCoachingSessionForUser(sessionId, userId);
        if (!session) {
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Coaching session not found",
            404,
          );
        }
        return NextResponse.json({ session });
      }

      const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 5);
      const sessions = await getRecentCoachingSessions(
        userId,
        Number.isFinite(rawLimit) ? rawLimit : 5,
      );
      return NextResponse.json({ sessions });
    } catch (error) {
      logApiError("/api/coaching-sessions", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to load coaching sessions",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load coaching sessions",
        500,
      );
    }
  },
);
