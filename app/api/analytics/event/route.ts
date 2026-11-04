import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { analyticsEventSchema } from "@/lib/validation/api-schemas";
import { trackFunnelEvent, type FunnelEvent } from "@/lib/analytics/funnel";
import { isUserAdmin } from "@/lib/auth/admin";
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";

/**
 * POST /api/analytics/event
 * Lightweight client-side funnel event endpoint.
 * Accepts { event, metadata? } — loosely validated so tracking never blocks UX.
 */
export const POST = withLogging(
  "/api/analytics/event",
  async (request: NextRequest) => {
    try {
      if (process.env.E2E_DISABLE_ANALYTICS === "true") {
        return NextResponse.json({ success: true });
      }

      // Telemetry tier: high burst allowance (240/min authenticated). If ever
      // rate-limited, silently return success instead of propagating 429 to the
      // client — funnel events are fire-and-forget and must never surface errors.
      const guard = await guardRoute(request, { tier: "telemetry" });
      if (guard.blocked) return NextResponse.json({ success: true });

      const parsed = await parseBody(request, analyticsEventSchema);
      if ("error" in parsed) {
        // Tracking failure is non-critical — return success anyway
        return NextResponse.json({ success: true });
      }

      const event = parsed.data.event as FunnelEvent | undefined;
      if (!event) {
        return NextResponse.json({ success: true });
      }

      const userId = guard.user?.id ?? null;
      const clientId = parsed.data.clientId ?? null;

      // L2 defense: reject ghost events with no identity.
      // Real browsers always have a clientId (from getClientId/localStorage).
      // Monitoring bots with ephemeral contexts send null for both.
      if (!userId && !clientId) {
        return NextResponse.json({ success: true }); // silent drop — non-critical
      }

      // Check if event is from an admin user — tagged for filtering in analytics
      let adminFlag = false;
      if (userId && guard.user?.email) {
        try {
          adminFlag = await isUserAdmin(userId, guard.user.email);
        } catch {
          /* non-critical */
        }
      }

      try {
        await trackFunnelEvent(event, {
          userId,
          clientId,
          metadata: parsed.data.metadata ?? {},
          idempotencyKey: parsed.data.idempotencyKey,
          isAdmin: adminFlag,
        });
      } catch (trackErr) {
        // Tracking failure is non-critical — log but don't fail the request
        logApiError("/api/analytics/event", ApiErrorCode.INTERNAL_ERROR, {
          message: "Funnel event tracking failed",
          cause: trackErr,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/analytics/event", ApiErrorCode.INTERNAL_ERROR, {
        message: "Analytics event handler failed",
        cause: error,
      });
      return NextResponse.json({ success: true });
    }
  },
);
