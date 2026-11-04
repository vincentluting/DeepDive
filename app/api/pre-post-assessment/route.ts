// ============================================================
// POST/GET /api/pre-post-assessment
// POST: Save a combined SCC + CDC + research questions measurement
// GET:  Retrieve pre/post comparison for current user
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { parseBody } from "@/lib/validation/parse-body";
import { prePostAssessmentSchema } from "@/lib/validation/api-schemas";
import {
  savePrePostAssessment,
  getPrePostAssessments,
} from "@/lib/db/pre-post-assessment";
import { getCoachingSessionCount } from "@/lib/db/coaching";
import { getJourneyState } from "@/lib/db/journey";
import { hasReached } from "@/lib/journey/state-machine";
import {
  hasResearchConsent,
  recordResearchConsent,
} from "@/lib/db/consent-records";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

export const POST = withLogging(
  "/api/pre-post-assessment",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, prePostAssessmentSchema);
      if ("error" in parsed) return parsed.error;

      const {
        assessmentType,
        sccResponses,
        cdcResponses,
        experienceFeedback,
        sessionId,
      } = parsed.data;
      const userId = guard.user!.id;

      // Validate timing constraints for post assessments
      if (
        assessmentType === "post_immediate" ||
        assessmentType === "post_1week"
      ) {
        const existing = await getPrePostAssessments(userId);

        if (guard.user!.researchGroup && !(await hasResearchConsent(userId))) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "Must provide research consent before post assessment",
            400,
          );
        }

        // post_immediate requires a pre assessment, no duplicate, and coaching for research participants
        if (assessmentType === "post_immediate") {
          if (!existing.pre) {
            return createErrorResponse(
              ApiErrorCode.VALIDATION_ERROR,
              "Must complete pre assessment before post_immediate",
              400,
            );
          }
          if (existing.postImmediate) {
            return createErrorResponse(
              ApiErrorCode.VALIDATION_ERROR,
              "post_immediate already submitted",
              400,
            );
          }
          // Research participants must complete the full intervention before T1.
          // Bug-log #018 + codex final review tightening:
          //
          // Initial fix required `deep_dive_complete`. Codex final review
          // pointed out that the consent text (lib/cdse/research-consent.ts:22)
          // explicitly says T1 happens "immediately after the AI coaching",
          // which itself happens AFTER the personal profile and the AI report.
          // So the gate must require `report_generated` (the state that is
          // only reached once Deep Dive → profile → report has all completed)
          // PLUS coachingCount > 0. Anything weaker lets a participant submit
          // T1 with a partial intervention and the CDC-5 pre/post comparison
          // would measure the wrong cause.
          if (guard.user!.researchGroup) {
            const journeyState = await getJourneyState(userId);
            if (!hasReached(journeyState, "report_generated")) {
              return createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                "Must complete the Deep Dive assessment and generate your report before post_immediate",
                400,
              );
            }
            const coachingCount = await getCoachingSessionCount(userId);
            if (coachingCount === 0) {
              return createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                "Must complete at least one coaching session before post_immediate",
                400,
              );
            }
          }
        }

        // post_1week requires post_immediate, no duplicate, and 7-day gap
        if (assessmentType === "post_1week") {
          if (!existing.postImmediate) {
            return createErrorResponse(
              ApiErrorCode.VALIDATION_ERROR,
              "Must complete post_immediate before post_1week",
              400,
            );
          }
          if (existing.post1Week) {
            return createErrorResponse(
              ApiErrorCode.VALIDATION_ERROR,
              "post_1week already submitted",
              400,
            );
          }
          const daysSince =
            (Date.now() -
              new Date(existing.postImmediate.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysSince < 7) {
            return createErrorResponse(
              ApiErrorCode.VALIDATION_ERROR,
              "post_1week requires at least 7 days after post_immediate",
              400,
            );
          }
        }
      }

      // Prevent duplicate pre assessment
      if (assessmentType === "pre") {
        const existing = await getPrePostAssessments(userId);
        if (existing.pre) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "Pre assessment already submitted",
            400,
          );
        }
      }

      // experienceFeedback: post measurements store Trust/UES/Constraints/Features;
      // pre measurement stores demographics (demo_age, demo_employment, demo_experience)
      const feedback = experienceFeedback;

      // Bug-log #007: cdcResponses is now schema-required (5 keys, 1-5).
      // The `?? undefined` fallback was only meaningful when the schema
      // allowed missing/empty payloads; with strict validation the
      // request would have returned 400 before reaching here.
      const id = await savePrePostAssessment({
        userId,
        assessmentType,
        sccResponses,
        cdcResponses,
        experienceFeedback: feedback,
      });

      // #108: record the T0/T1/T2 completion so the recruitment funnel isn't
      // blind to assessment conversion. Idempotent per user+timepoint so a
      // re-submit can't double-count; best-effort, never blocks the save.
      const TIMEPOINT_FUNNEL_EVENT = {
        pre: "pre_assessment_completed",
        post_immediate: "post_immediate_completed",
        post_1week: "post_1week_completed",
      } as const;
      void trackFunnelEvent(TIMEPOINT_FUNNEL_EVENT[assessmentType], {
        userId,
        idempotencyKey: `${assessmentType}_completed:${userId}`,
        metadata: { researchGroup: guard.user?.researchGroup ?? undefined },
      }).catch(() => {});

      // Audit fallback for T0: the dedicated consent endpoint is best-effort
      // from the client (post-assessment-survey.tsx swallows fetch errors
      // and still advances). A successfully persisted T0 submission with a
      // canonical SCC-12 payload is itself an explicit consent act, so we
      // backfill both User.researchConsentAt and ConsentRecord here if needed.
      //
      // Isolated from the primary response: any failure in this audit path
      // must NOT turn the already-committed T0 insert into a 500. On retry
      // the duplicate guard above would then permanently leave
      // researchConsentAt NULL with no recovery path.
      if (assessmentType === "pre" && guard.user!.researchGroup) {
        try {
          const backfill = await recordResearchConsent({
            userId,
            ipAddress: request.headers
              .get("x-forwarded-for")
              ?.split(",")[0]
              ?.trim(),
            userAgent: request.headers.get("user-agent"),
            sessionId: sessionId ?? null,
          });
          if (backfill.timestampBackfilled || backfill.auditInserted) {
            console.warn(
              "[audit] research consent backfilled at T0 submit — consent endpoint likely failed earlier",
              { userId, route: "/api/pre-post-assessment" },
            );
          }
        } catch (backfillErr) {
          // Non-fatal: T0 row is already in DB. Log with userId so researchers
          // can offline-reconcile the affected participant's researchConsentAt.
          // Primary response still succeeds so the client does not retry (the
          // duplicate guard would otherwise trap the retry permanently).
          logApiError("/api/pre-post-assessment", ApiErrorCode.INTERNAL_ERROR, {
            userId,
            message:
              "research consent backfill DB error after T0 save succeeded — audit fields may remain incomplete for this userId; offline reconcile required",
            cause: backfillErr,
          });
        }
      }

      return NextResponse.json({ success: true, id });
    } catch (error) {
      logApiError("/api/pre-post-assessment", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to save pre-post assessment",
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

export const GET = withLogging(
  "/api/pre-post-assessment",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: "read" });
      if (guard.blocked) return guard.response;

      const userId = guard.user?.id;
      if (!userId) {
        return NextResponse.json({
          pre: null,
          postImmediate: null,
          post1Week: null,
        });
      }

      const result = await getPrePostAssessments(userId);
      return NextResponse.json(result);
    } catch (error) {
      logApiError("/api/pre-post-assessment", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch pre-post assessments",
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
