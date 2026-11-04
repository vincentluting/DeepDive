// ============================================================
// GET /api/admin/ops/durable-jobs — DurableJob queue health
//
// Admin-only read endpoint for ops dashboards. Unlike the cron worker route,
// this does not claim or mutate jobs.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { getDurableJobHealth } from "@/lib/db/durable-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withLogging(
  "/api/admin/ops/durable-jobs",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const health = await getDurableJobHealth();
      return NextResponse.json(
        {
          success: true,
          health,
        },
        {
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    } catch (error) {
      logApiError("/api/admin/ops/durable-jobs", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch durable job health",
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
