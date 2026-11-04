import { type NextRequest, NextResponse } from "next/server";
import {
  getReportJsonById,
  getAssessmentDataForReport,
  checkReportExists,
  deleteReportById,
  checkReportOwnership,
} from "@/lib/db/reports";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { invalidateUserCache } from "@/lib/db/cached";
import { sql } from "@/lib/db/connection";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";
import { getLatestActiveResumeMatch } from "@/lib/db/resume-match";

export const GET = withLogging(
  "/api/report/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, {
        tier: "read",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const { id } = await context.params;

      // Ownership check: non-admin users can only access their own reports
      const user = await getCurrentUserWithAdmin();
      if (!user) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required",
          401,
        );
      }
      if (!user.isAdmin) {
        const hasAccess = await checkReportOwnership(id, user.id);
        if (!hasAccess) {
          return createErrorResponse(
            ApiErrorCode.ASSESSMENT_NOT_FOUND,
            "Report not found",
            404,
          );
        }
      }

      // Fetch from CareerReport
      let reportData: Record<string, unknown>;
      try {
        const result = await getReportJsonById(id);
        if (!result) {
          return createErrorResponse(
            ApiErrorCode.ASSESSMENT_NOT_FOUND,
            "Report not found",
            404,
          );
        }
        reportData = result;
      } catch (parseError) {
        logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
          message: `Corrupted report JSON for report id=${id}`,
          cause: parseError,
        });
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Corrupted report data",
          500,
        );
      }

      // Resolve assessment sessionId + evidence data for explainability
      let assessmentSessionId: string | null = null;
      let evidenceChain: Record<string, unknown> | null = null;
      let archetype: Record<string, unknown> | null = null;
      let schwartzTop3: string[] | null = null;
      let behavioralConsistency: number | null = null;
      let bigFiveFacets: Record<string, number> | null = null;
      let assessmentMeta: {
        rushCount: number;
        hesitationCount: number;
        totalQuestions: number;
        answeredQuestions: number;
      } | null = null;
      const assessmentId =
        typeof reportData.assessmentId === "string"
          ? reportData.assessmentId
          : null;
      if (assessmentId) {
        try {
          const assessData = await getAssessmentDataForReport(assessmentId);
          if (assessData) {
            assessmentSessionId = assessData.sessionId;
            const resultData = assessData.resultJson;
            evidenceChain =
              (resultData.evidenceChain as Record<string, unknown>) || null;
            archetype =
              (resultData.archetype as Record<string, unknown>) || null;
            // Extract Schwartz top3 values for report display
            const schwartzData = resultData.schwartz as
              | Record<string, unknown>
              | undefined;
            if (schwartzData?.top3 && Array.isArray(schwartzData.top3)) {
              schwartzTop3 = schwartzData.top3 as string[];
            }
            // Behavioral consistency — proportion of SJT dilemmas where the
            // ideal ("should") choice matched the likely ("would") one. Surfaced
            // in the report's Shadow chapter (ideals vs. actions).
            const tensionsData = resultData.tensions as
              | Record<string, unknown>
              | undefined;
            if (typeof tensionsData?.overallConsistency === "number") {
              behavioralConsistency = tensionsData.overallConsistency;
            }
            // Raw Big Five facet scores (30, 1-5) for the report's
            // "Beneath the Surface" facet signature.
            const bigFiveData = resultData.bigFive as
              | Record<string, unknown>
              | undefined;
            if (bigFiveData?.facets && typeof bigFiveData.facets === "object") {
              bigFiveFacets = bigFiveData.facets as Record<string, number>;
            }
            if (resultData.meta) {
              const meta = resultData.meta as Record<string, unknown>;
              assessmentMeta = {
                rushCount: (meta.rushCount as number) ?? 0,
                hesitationCount: (meta.hesitationCount as number) ?? 0,
                totalQuestions: (meta.totalQuestions as number) ?? 48,
                answeredQuestions: (meta.answeredQuestions as number) ?? 0,
              };
            }
          }
        } catch (e) {
          logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
            message: "Failed to resolve assessment data",
            cause: e,
          });
        }
      }

      // Report row metadata + active resume (drives ResumeRegenerateBanner's
      // stale-warning UX: if currentResume.uploadedAt > reportCreatedAt, the
      // banner nudges the user to regenerate so the report reflects the
      // resume they actually have on file today).
      let reportCreatedAt: string | null = null;
      let currentResume: {
        fileName: string | null;
        uploadedAt: string;
      } | null = null;
      try {
        const reportRows = (await sql`
          SELECT "createdAt" FROM "CareerReport" WHERE "id" = ${id} LIMIT 1
        `) as Array<{ createdAt: Date | string }>;
        if (reportRows[0]?.createdAt) {
          reportCreatedAt = new Date(reportRows[0].createdAt).toISOString();
        }
      } catch (e) {
        logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
          message: "Failed to resolve report createdAt",
          cause: e,
        });
      }
      if (assessmentId) {
        try {
          const match = await getLatestActiveResumeMatch(assessmentId);
          if (match) {
            currentResume = {
              fileName: match.fileName,
              uploadedAt: match.createdAt.toISOString(),
            };
          }
        } catch (e) {
          logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
            message: "Failed to resolve current resume match",
            cause: e,
          });
        }
      }

      // Round Zero immersive completion gate — drives the companion easter egg
      // on the report page and in the coaching system prompt. Classic Quick Dive
      // users have an archetypeCode but never met the 6 companions, so the
      // narrative callback must be suppressed for them.
      let walkedRoundZero = false;
      if (user?.id) {
        try {
          const rows = await sql<{ exploreMode: string | null }>`
            SELECT "exploreMode" FROM "QuickDiveResult"
            WHERE "userId" = ${user.id}
            ORDER BY "createdAt" DESC
            LIMIT 1
          `;
          walkedRoundZero = isImmersiveExploreMode(rows[0]?.exploreMode);
        } catch (e) {
          logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
            message: "Failed to resolve exploreMode for Round Zero gate",
            cause: e,
          });
          // Default safe: do not show companion callback if mode unknown
          walkedRoundZero = false;
        }
      }

      return NextResponse.json({
        report: reportData,
        phase: 1,
        assessmentId,
        assessmentSessionId,
        currentUserId: user?.id ?? null,
        researchGroup: user?.researchGroup ?? null,
        walkedRoundZero,
        evidenceChain,
        archetype,
        assessmentMeta,
        schwartzTop3,
        behavioralConsistency,
        bigFiveFacets,
        reportCreatedAt,
        currentResume,
      });
    } catch (error) {
      logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Error fetching report",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to get report",
        500,
      );
    }
  },
);

export const DELETE = withLogging(
  "/api/report/[id]",
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
          "Authentication required. Please log in to delete reports.",
          401,
        );
      }

      if (user.isAdmin) {
        const exists = await checkReportExists(id);

        if (!exists) {
          return createErrorResponse(
            ApiErrorCode.ASSESSMENT_NOT_FOUND,
            "Report not found",
            404,
          );
        }

        await deleteReportById(id);
        invalidateUserCache(user.id);
        return NextResponse.json({
          success: true,
          message: "Report deleted successfully",
        });
      }

      // For non-admin users, verify ownership through full chain
      const hasAccess = await checkReportOwnership(id, user.id);

      if (!hasAccess) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Report not found or you don't have permission to delete it",
          404,
        );
      }

      await deleteReportById(id);
      invalidateUserCache(user.id);

      return NextResponse.json({
        success: true,
        message: "Report deleted successfully",
      });
    } catch (error) {
      logApiError("/api/report/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Delete report error",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete report",
        500,
      );
    }
  },
);
