import { type NextRequest, NextResponse } from "next/server";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  logApiError,
  createErrorResponse,
} from "@/lib/api/api-errors";
import { findCareerNarrative } from "@/lib/content/career-narratives";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800",
};

/**
 * GET /api/career-narrative?careerId=xxx
 *
 * Returns a single career narrative by careerId.
 * Static content — cached aggressively. Keeps the 2.2MB career-narratives
 * module server-side instead of bundling it into client JS.
 *
 * No guardRoute: public static content with no user data or writes.
 */
export const GET = withLogging(
  "/api/career-narrative",
  async (request: NextRequest) => {
    try {
      const careerId = request.nextUrl.searchParams.get("careerId");
      if (!careerId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "careerId is required",
          400,
        );
      }

      const narrative = findCareerNarrative(careerId);
      if (!narrative) {
        return NextResponse.json(null, { status: 200, headers: CACHE_HEADERS });
      }

      return NextResponse.json(narrative, { headers: CACHE_HEADERS });
    } catch (error) {
      logApiError("/api/career-narrative", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch career narrative",
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
