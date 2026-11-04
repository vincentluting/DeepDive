import { type NextRequest, NextResponse } from "next/server";
import {
  getQuickDiveReport,
  checkQuickDiveOwnership,
  deleteQuickDiveReport,
} from "@/lib/db/platform";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { invalidateUserCache } from "@/lib/db/cached";

// Intentionally public (no guardRoute): QuickDive reports are shareable via UUID link.
// Response contains archetype + RIASEC scores only — no PII (email, name, userId).
export const GET = withLogging(
  "/api/quickdive/report/[id]",
  async (
    _request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const { id } = await context.params;
      const report = await getQuickDiveReport(id);

      if (!report) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Quick Dive report not found",
          404,
        );
      }

      return NextResponse.json({
        id: report.id,
        archetypeCode: report.archetypeCode,
        archetypeLabel: report.archetypeLabel,
        scoresJson: report.scoresJson,
        resultData: report.resultDataJson,
        language: report.language,
        createdAt: report.createdAt,
        exploreMode: report.exploreMode,
        avatarGender: report.avatarGender,
      });
    } catch (error) {
      logApiError("/api/quickdive/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Error fetching Quick Dive report",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to get Quick Dive report",
        500,
      );
    }
  },
);

export const DELETE = withLogging(
  "/api/quickdive/report/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    try {
      const { id } = await context.params;
      const user = await getCurrentUserWithAdmin();

      if (!user) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required",
          401,
        );
      }

      // Admin can delete any report
      if (user.isAdmin) {
        const report = await getQuickDiveReport(id);
        if (!report) {
          return createErrorResponse(
            ApiErrorCode.ASSESSMENT_NOT_FOUND,
            "Quick Dive report not found",
            404,
          );
        }
        await deleteQuickDiveReport(id);
        invalidateUserCache(user.id);
        return NextResponse.json({ success: true });
      }

      // Regular user: verify ownership then delete
      const hasAccess = await checkQuickDiveOwnership(id, user.id);
      if (!hasAccess) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Quick Dive report not found or you don't have permission",
          404,
        );
      }

      await deleteQuickDiveReport(id);
      invalidateUserCache(user.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/quickdive/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Delete Quick Dive report error",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete Quick Dive report",
        500,
      );
    }
  },
);
