// ============================================================
// GET /api/admin/report-engagement — Report engagement stats
//
// Query params:
//   days — time window (1-365, default 30)
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  getEngagementOverview,
  getRecentEngagementSessions,
} from "@/lib/db/report-engagement";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/report-engagement",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);
      const days = Math.min(
        365,
        Math.max(1, parseInt(searchParams.get("days") || "30", 10)),
      );

      const [overview, sessions] = await Promise.all([
        getEngagementOverview(days),
        getRecentEngagementSessions(20),
      ]);

      return NextResponse.json(
        { overview, sessions, days },
        {
          headers: { "Cache-Control": "private, max-age=300" },
        },
      );
    } catch (error) {
      logApiError("/api/admin/report-engagement", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch report engagement data",
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
