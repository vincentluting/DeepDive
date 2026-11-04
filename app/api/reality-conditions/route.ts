// ============================================================
// POST /api/reality-conditions — Save Reality Conditions
// Input: { sessionId, userId?, conditions: RealConditions }
// Output: { success: true, id: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  saveRealConditions,
  getRealConditions,
  getRealConditionsByUserId,
} from "@/lib/db/conditions";
import { ensureSessionExists } from "@/lib/db/sessions";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { realityConditionsSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const POST = withLogging(
  "/api/reality-conditions",
  async (request: NextRequest) => {
    try {
      // SECURITY (bug-log #015): require auth + server-authoritative userId.
      // Previously: client-supplied body.userId was trusted, letting any caller write to
      // any victim user's RC. Now: require login, ignore body.userId, use guard.user.id.
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, realityConditionsSchema);
      if ("error" in parsed) return parsed.error;

      const { sessionId, conditions } = parsed.data;

      // Server-authoritative userId. Client-supplied parsed.data.userId is intentionally
      // ignored — guard.user is non-null thanks to requireAuth.
      const effectiveUserId = guard.user!.id;

      // Ensure session row exists before FK-dependent INSERT
      await ensureSessionExists(sessionId);

      const id = await saveRealConditions(
        sessionId,
        effectiveUserId,
        conditions,
      );

      if (effectiveUserId) {
        import("@/lib/achievements/engine")
          .then((m) =>
            m.checkAchievements(effectiveUserId, "depth_updated", {
              module: "realityCheck",
            }),
          )
          .catch(() => {});
      }

      return NextResponse.json({ success: true, id });
    } catch (error) {
      logApiError(
        "/api/reality-conditions",
        ApiErrorCode.DB_CONSTRAINT_FAILED,
        {
          message: "Failed to save reality conditions",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.DB_CONSTRAINT_FAILED,
        "Failed to save reality conditions",
        500,
      );
    }
  },
);

export const GET = withLogging(
  "/api/reality-conditions",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: "read" });
      if (guard.blocked) return guard.response;

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");
      const sessionId = searchParams.get("sessionId");

      // SECURITY (bug-log #014): userId-based lookup requires auth + ownership match.
      // Previously: unauthenticated request with ?userId=<victim> leaked victim's RC
      // because guard.user was null and effectiveUserId fell through to query userId.
      // Now: any userId query param requires the caller to be logged in AND own it.
      if (userId) {
        if (!guard.user) {
          // Anonymous caller requesting userId-bound data — anti-enumeration 404.
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Not found",
            404,
          );
        }
        if (userId !== guard.user.id) {
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Not found",
            404,
          );
        }
      }

      // For authenticated users, always use their guard userId (ignore client userId).
      // For anonymous callers, fall back to sessionId-only lookup.
      const effectiveUserId = guard.user?.id ?? null;

      if (!effectiveUserId && !sessionId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Missing required query parameter: userId or sessionId",
          400,
        );
      }

      let conditions = null;
      if (effectiveUserId) {
        conditions = await getRealConditionsByUserId(effectiveUserId);
      } else if (sessionId) {
        conditions = await getRealConditions(sessionId);
      }

      if (!conditions) {
        return NextResponse.json({ conditions: null });
      }

      return NextResponse.json({ conditions });
    } catch (error) {
      logApiError("/api/reality-conditions", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to get reality conditions",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to get reality conditions",
        500,
      );
    }
  },
);
