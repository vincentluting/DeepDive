// ============================================================
// PATCH /api/companions/reports/[id] — admin marks a report as
//        reviewed or dismissed. Open → reviewed | dismissed only;
//        re-resolving an already-resolved report returns 409.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { companionReportReviewSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { markReportReviewed } from "@/lib/db/companions";

export const PATCH = withLogging(
  "/api/companions/reports/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, {
        tier: "admin",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;
      if (!guard.user?.isAdmin) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Admin access required.",
          403,
        );
      }

      const { id } = await context.params;
      if (!id) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Report id is required.",
          400,
        );
      }

      const parsed = await parseBody(request, companionReportReviewSchema);
      if ("error" in parsed) return parsed.error;

      const ok = await markReportReviewed({
        reportId: id,
        reviewerId: guard.user.id,
        status: parsed.data.status,
      });

      if (!ok) {
        return createErrorResponse(
          ApiErrorCode.CONFLICT,
          "Report is no longer in 'open' state.",
          409,
        );
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      logApiError("/api/companions/reports/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to update report",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update report. Please try again.",
        500,
      );
    }
  },
);
