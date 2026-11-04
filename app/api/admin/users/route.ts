import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { listUsersWithStats } from "@/lib/db/admin";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/users",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      // Parse query params
      const { searchParams } = new URL(request.url);
      const page = Math.max(
        1,
        parseInt(searchParams.get("page") || "1", 10) || 1,
      );
      const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20),
      );
      const search = searchParams.get("search")?.trim() || "";

      const result = await listUsersWithStats(page, limit, search);

      return NextResponse.json({
        users: result.users,
        total: result.total,
        page,
        limit,
        stats: result.stats,
      });
    } catch (error) {
      logApiError("/api/admin/users", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch admin user list",
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
