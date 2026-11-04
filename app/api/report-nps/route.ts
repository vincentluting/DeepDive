// ============================================================
// POST/GET /api/report-nps — Report NPS Score
// POST: Save a user's NPS score (1-10) + optional feedback
// GET:  Retrieve existing NPS for a report
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { reportNpsSchema } from "@/lib/validation/api-schemas";
import { saveNPS, getNPS } from "@/lib/db/nps";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export const POST = withLogging(
  "/api/report-nps",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, reportNpsSchema);
      if ("error" in parsed) return parsed.error;

      const { reportId, score, pmfResponse, feedback, locale } = parsed.data;
      const userId = guard.user!.id;

      const result = await saveNPS(reportId, score, {
        userId,
        pmfResponse: pmfResponse ?? null,
        feedback: feedback ?? null,
        locale: locale ?? null,
      });

      // Fire-and-forget: don't block response on analytics
      trackFunnelEvent("report_nps_submitted", {
        userId,
        metadata: { reportId, score, hasFeedback: !!feedback },
      }).catch(() => {});

      return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
      logApiError("/api/report-nps", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to save NPS",
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
  "/api/report-nps",
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
      const nps = await getNPS(reportId, userId);
      return NextResponse.json({ nps });
    } catch (error) {
      logApiError("/api/report-nps", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch NPS",
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
