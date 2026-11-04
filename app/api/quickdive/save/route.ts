import { type NextRequest, NextResponse } from "next/server";
import { saveQuickDiveResult } from "@/lib/db/platform";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { quickdiveSaveSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { saveAdminPreset } from "@/lib/db/admin-presets";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";

export const POST = withLogging(
  "/api/quickdive/save",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: "write" });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, quickdiveSaveSchema);
      if ("error" in parsed) return parsed.error;
      const {
        scores,
        code,
        label,
        locale,
        resultData,
        exploreMode,
        anonymousId,
        avatarGender,
        chibiGender,
      } = parsed.data;

      // Use user from guard (already resolved) — anonymous saves still work
      const userId = guard.user?.id ?? null;

      // #106: research participants must record the explore mode matching their
      // assigned A/B group. The client UI enforces this, but the API must not
      // trust body.exploreMode — a classic participant could otherwise save an
      // immersive result (or vice versa) and corrupt the A/B comparison.
      if (guard.user?.researchGroup) {
        const assignedImmersive = guard.user.researchGroup === "immersive";
        if (isImmersiveExploreMode(exploreMode) !== assignedImmersive) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "exploreMode does not match the assigned research group",
            400,
          );
        }
      }

      // Detect environment from request hostname or URL
      const host = request.headers.get("host") || new URL(request.url).hostname;
      const isDev =
        host.startsWith("localhost") || host.startsWith("127.0.0.1");

      const id = await saveQuickDiveResult({
        scores,
        archetypeCode: code,
        archetypeLabel: label,
        language: locale,
        userId,
        anonymousId: userId ? null : (anonymousId ?? null),
        resultData: resultData ? (resultData as Record<string, unknown>) : null,
        exploreMode,
        environment: isDev ? "development" : "production",
        avatarGender: avatarGender ?? chibiGender ?? null,
      });

      // Unified lifecycle: completion registry + journey + cache + achievements
      if (userId) {
        const assessmentType = isImmersiveExploreMode(exploreMode)
          ? "immersive_dive"
          : ("quick_dive" as const);
        await afterAssessmentComplete({
          userId,
          assessmentType,
          resultId: id,
          achievementContext: { exploreMode },
        });

        // Auto-save preset for admin users (best-effort, non-blocking)
        if (guard.user?.isAdmin) {
          saveAdminPreset({
            userId,
            quickDiveAnswers: {
              scores,
              resultData: resultData ?? null,
            },
            locale,
          }).catch(() => {});
        }
      }

      // Fire-and-forget: notify coach companion
      if (userId) {
        import("@/lib/coaching/trigger-coach-message").then(
          ({ triggerCoachMessage }) => {
            triggerCoachMessage(userId, "quick_dive_complete").catch(() => {});
          },
        );
      }

      return NextResponse.json({ success: true, id });
    } catch (error) {
      logApiError("/api/quickdive/save", ApiErrorCode.DB_CONSTRAINT_FAILED, {
        message: "Failed to save QuickDive result",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.DB_CONSTRAINT_FAILED,
        "Failed to save QuickDive result",
        500,
      );
    }
  },
);
