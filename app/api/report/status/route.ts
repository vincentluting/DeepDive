import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { getReportIdByAssessment } from "@/lib/db/reports";

const querySchema = z.object({
  assessmentId: z.string().min(1),
});

export const GET = withLogging(
  "/api/report/status",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "read",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    try {
      const url = new URL(request.url);
      const parsed = querySchema.safeParse({
        assessmentId: url.searchParams.get("assessmentId"),
      });

      if (!parsed.success) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Missing required query parameter: assessmentId",
          400,
        );
      }

      const { assessmentId } = parsed.data;
      const assessment = await getEffectiveAssessment(
        assessmentId,
        guard.user!.id,
      );

      if (!assessment) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Assessment not found",
          404,
        );
      }

      const reportId = await getReportIdByAssessment(assessmentId);

      return NextResponse.json({
        status: reportId ? "ready" : "pending",
        reportId,
      });
    } catch (error) {
      logApiError("/api/report/status", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch report generation status",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch report generation status",
        500,
      );
    }
  },
);
