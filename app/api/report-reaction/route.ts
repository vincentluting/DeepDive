// ============================================================
// POST/GET /api/report-reaction — Report Emotional Reaction
// POST: Save a user's reaction to their report
// GET:  Retrieve existing reaction for a report
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { reportReactionSchema } from "@/lib/validation/api-schemas";
import { saveReaction, getReaction } from "@/lib/db/reactions";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export const POST = withLogging(
  "/api/report-reaction",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, reportReactionSchema);
      if ("error" in parsed) return parsed.error;

      const { reportId, reaction } = parsed.data;
      const userId = guard.user!.id;

      const result = await saveReaction(reportId, reaction, userId);

      trackFunnelEvent("report_reacted", {
        userId,
        metadata: { reportId, reaction },
        idempotencyKey: `report_reacted:${reportId}:${userId}`,
        isAdmin: !!guard.user?.isAdmin,
      }).catch(() => {});

      return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
      logApiError("/api/report-reaction", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to save reaction",
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

export const GET = withLogging(
  "/api/report-reaction",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "read",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const { searchParams } = new URL(request.url);
      const reportId = searchParams.get("reportId");

      if (!reportId) {
        return NextResponse.json(
          { error: "reportId query parameter is required" },
          { status: 400 },
        );
      }

      const userId = guard.user!.id;
      const reaction = await getReaction(reportId, userId);
      return NextResponse.json({ reaction });
    } catch (error) {
      logApiError("/api/report-reaction", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch reaction",
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
