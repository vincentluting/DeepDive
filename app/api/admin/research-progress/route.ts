// ============================================================
// GET /api/admin/research-progress — Research participant progress
// Returns per-participant completion status across the full pipeline.
// Only returns consented research participants
// (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL).
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { getResearchParticipantProgress } from "@/lib/db/research-progress";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/research-progress",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const result = await getResearchParticipantProgress();

      return NextResponse.json(result);
    } catch (error) {
      logApiError("/api/admin/research-progress", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch research progress",
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
