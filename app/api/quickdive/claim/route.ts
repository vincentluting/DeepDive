import { type NextRequest, NextResponse } from "next/server";
import { claimQuickDiveResult, getQuickDiveReport } from "@/lib/db/platform";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { quickdiveClaimSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";

export const POST = withLogging(
  "/api/quickdive/claim",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, quickdiveClaimSchema);
    if ("error" in parsed) return parsed.error;
    const { resultId } = parsed.data;

    try {
      const result = await claimQuickDiveResult(resultId, guard.user!.id);
      if (result === "claimed" || result === "already_owned") {
        const report = await getQuickDiveReport(resultId);
        const assessmentType = isImmersiveExploreMode(report?.exploreMode)
          ? "immersive_dive"
          : "quick_dive";

        try {
          await afterAssessmentComplete({
            userId: guard.user!.id,
            assessmentType,
            resultId,
          });
        } catch (lifecycleError) {
          // Claim succeeded — don't fail the request over journey progression
          logApiError(
            "/api/quickdive/claim",
            ApiErrorCode.DB_CONSTRAINT_FAILED,
            {
              message: "Claim succeeded but lifecycle progression failed",
              cause: lifecycleError,
            },
          );
        }

        return NextResponse.json({
          success: true,
          claimed: result === "claimed",
        });
      }
      // 'conflict' — owned by different user or not found
      return createErrorResponse(
        ApiErrorCode.DB_CONSTRAINT_FAILED,
        "This Quick Dive result has already been claimed",
        409,
      );
    } catch (error) {
      logApiError("/api/quickdive/claim", ApiErrorCode.DB_CONSTRAINT_FAILED, {
        message: "Failed to claim QuickDive result",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.DB_CONSTRAINT_FAILED,
        "Failed to claim QuickDive result",
        500,
      );
    }
  },
);
