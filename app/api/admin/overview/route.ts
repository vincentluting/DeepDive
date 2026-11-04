// ============================================================
// GET /api/admin/overview — operations cockpit payload
// Single aggregated round-trip for the /admin landing page.
// Partial-failure tolerant (segments fail to null independently).
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { getAdminOverviewData } from "@/lib/db/admin-overview";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/overview",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const data = await getAdminOverviewData();
      return NextResponse.json(data);
    } catch (error) {
      logApiError("/api/admin/overview", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to compose admin overview",
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
