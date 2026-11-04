import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { deleteAssessmentCompletion } from "@/lib/db/assessment-completion";
import { invalidateUserCache } from "@/lib/db/cached";
import { recomputeUserContext } from "@/lib/db/user-context";

export const POST = withLogging(
  "/api/quickdive/reset",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const userId = guard.user!.id;

    try {
      // Keep all historical QuickDiveResult records (retake history).
      // Only clear completion status so user can redo the questionnaire.
      await Promise.all([
        deleteAssessmentCompletion(userId, "quick_dive"),
        deleteAssessmentCompletion(userId, "immersive_dive"),
      ]);
      await recomputeUserContext(userId);
      invalidateUserCache(userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/quickdive/reset", ApiErrorCode.INTERNAL_ERROR, {
        userId,
        message: "Failed to reset Quick Dive data",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to reset Quick Dive data",
        500,
      );
    }
  },
);
