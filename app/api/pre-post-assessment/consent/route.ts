// POST /api/pre-post-assessment/consent
// Records the actual moment a research participant reads and agrees to informed consent.
// Sets User.researchConsentAt to NOW() only on FIRST consent — subsequent calls are no-ops.
// Preserving the original timestamp is a research-ethics requirement:
// the recorded time must reflect when consent was actually given, not the last re-click.

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { recordResearchConsent } from "@/lib/db/consent-records";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { sql } from "@/lib/db/connection";

// SECURITY (bug-log #019): consent MUST be an explicit boolean true.
// Previously the route never parsed the body — a logged-in user could POST
// `{"consentGiven": false}` or even an empty body and the route would still
// record researchConsentAt, which is an informed-consent law violation.
//
// `.strict()` rejects unknown keys so the body contract is locked down — no
// silent acceptance of `{ consentGiven: true, anythingElse: ... }`. The
// research-ethics audit trail must reflect exactly what the participant agreed
// to; extra fields could hide downstream-trusted attributes.
const consentBodySchema = z
  .object({
    consentGiven: z.literal(true),
  })
  .strict();

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

export const POST = withLogging(
  "/api/pre-post-assessment/consent",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      // SECURITY (bug-log #019): require explicit `consentGiven: true` in body.
      // Anything else (false / missing / empty body / extra fields only) is rejected
      // before we touch the DB. This blocks the previous attack where any
      // authenticated user could POST without a body and still mark consent.
      const parsed = await parseBody(request, consentBodySchema);
      if ("error" in parsed) return parsed.error;

      const userId = guard.user!.id;

      await recordResearchConsent({
        userId,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
        sessionId: null,
      });

      // Track consent submission for the recruitment funnel — fire-and-forget.
      // Idempotent in spirit: recordResearchConsent only writes on first
      // consent, but the event fires on every submit so the funnel reflects
      // the user's intent (re-clicks are rare and bounded).
      void (async () => {
        try {
          const rows = (await sql`
            SELECT "cohort", "researchGroup" FROM "User" WHERE "id" = ${userId}
          `) as Array<{
            cohort: string | null;
            researchGroup: string | null;
          }>;
          const locale = request.cookies.get("NEXT_LOCALE")?.value ?? undefined;
          await trackFunnelEvent("consent_submitted", {
            userId,
            metadata: {
              cohort: rows[0]?.cohort ?? undefined,
              researchGroup: rows[0]?.researchGroup ?? undefined,
              locale,
            },
          });
        } catch {
          /* analytics must never break the consent path */
        }
      })();

      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError(
        "/api/pre-post-assessment/consent",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to record research consent",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
