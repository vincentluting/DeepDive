// ============================================================
// POST /api/report-reaction-trigger — Coaching Trigger on Reaction
//
// Called non-blocking from ReportReactionCheck after a user reacts.
// Stores the reaction as a coaching trigger context so that when the
// user navigates to coaching, the conversation can reference it.
//
// This endpoint is lightweight and fire-and-forget from the client.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { reportReactionSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

export const POST = withLogging(
  "/api/report-reaction-trigger",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, reportReactionSchema);
      if ("error" in parsed) return parsed.error;

      const { reaction } = parsed.data;

      // The reaction is already persisted by /api/report-reaction.
      // This endpoint acknowledges the trigger so the client doesn't 404.
      // The coaching system picks up reaction context via triggerContext
      // when the user navigates to coaching from the reaction CTA.
      return NextResponse.json({
        success: true,
        triggerContext: `report_reaction_${reaction}`,
      });
    } catch (error) {
      logApiError("/api/report-reaction-trigger", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to process reaction trigger",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
