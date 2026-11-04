// ============================================================
// POST /api/coaching-feedback — Coaching Session Satisfaction
// Saves a satisfaction rating (okay/helpful/very_helpful)
// and an optional highlight comment for a coaching session.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { coachingFeedbackSchema } from "@/lib/validation/api-schemas";
import { saveCoachingFeedback } from "@/lib/db/coaching-feedback";
import { getCoachingSessionForUser } from "@/lib/db/coaching";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const POST = withLogging(
  "/api/coaching-feedback",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, coachingFeedbackSchema);
      if ("error" in parsed) return parsed.error;

      const { sessionId, rating, reasons, highlight, tags } = parsed.data;
      const userId = guard.user?.id ?? null;
      if (!userId) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required",
          401,
        );
      }

      const session = await getCoachingSessionForUser(sessionId, userId);
      if (!session) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Coaching session not found",
          404,
        );
      }

      const result = await saveCoachingFeedback({
        sessionId,
        userId,
        rating,
        reasons,
        highlight: highlight ?? null,
        tags: tags ?? [],
      });

      return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
      logApiError("/api/coaching-feedback", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to save coaching feedback",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to save feedback",
        500,
      );
    }
  },
);
