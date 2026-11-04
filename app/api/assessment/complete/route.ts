// ============================================================
// POST /api/assessment/complete — Deep Dive completion entry
//
// New server-orchestrated replacement for the fragile client-driven chain
// (score → profile → narratives → report). This endpoint:
//
//   1. Runs scoring synchronously (fast, <1s, pure algo).
//   2. Saves AssessmentResult + completes QuestionnaireSession.
//   3. Creates an AssessmentPipeline row (scoringStatus='done').
//   4. Returns { pipelineId, assessmentId } — frontend navigates to
//      /{locale}/processing?pipelineId=... to observe progress.
//
// Downstream steps (profile, narratives, report) are advanced by the
// cron worker at /api/cron/pipeline-worker, one step per tick. The client
// is no longer responsible for driving them.
//
// Idempotency: if this endpoint is called twice for the same sessionId,
// saveAssessmentResult uses an idempotency key and createPipeline uses
// ON CONFLICT UPDATE. Callers may retry safely.
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { after, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { scoreSchemaCombined } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { runScoringPipelineV3 } from "@/lib/scoring";
import { saveAssessmentResult } from "@/lib/db/assessments";
import { completeSession, ensureSessionExists } from "@/lib/db/sessions";
import { getCurrentUser } from "@/lib/auth";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import { getCanonicalRiasec } from "@/lib/db/riasec-canonical";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { createPipeline } from "@/lib/db/pipeline";
import { canAccess } from "@/lib/cohort/entitlements";
import { advancePipeline } from "@/lib/pipeline/orchestrator";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import type { RIASECDimension } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = withLogging("/api/assessment/complete", async (request) => {
  try {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    // Bug-log #040 entitlement gap (mirrors /api/score):
    // The page-level Deep Dive route checks `canAccess` (see
    // app/[locale]/(immersive)/deepdive/page.tsx), but a caller can hit
    // this API directly. Without this check, a user without a Deep Dive
    // cohort entitlement could persist an AssessmentResult and trigger
    // the whole pipeline.
    if (!canAccess(guard.user!.cohort, "deepDive")) {
      // Use a generic error helper signature used elsewhere in this file.
      return NextResponse.json(
        { error: "Your cohort does not have Deep Dive access" },
        { status: 403 },
      );
    }

    const parsed = await parseBody(request, scoreSchemaCombined);
    if ("error" in parsed) return parsed.error;
    const {
      sessionId,
      sjt,
      pvq,
      values,
      ipip,
      riasecNormalized,
      metadata,
      locale,
    } = parsed.data;

    const user = await getCurrentUser();
    if (!user?.id) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Authentication required to complete assessment",
        401,
      );
    }

    const effectiveLocale = locale ?? "en";

    // Ensure session row exists before FK-dependent operations
    await ensureSessionExists(sessionId, effectiveLocale, "deep", user.id);

    // ---- Resolve values field: prefer `values` (TwIVI), fall back to `pvq` (PVQ-21) ----
    const valuesInput = values ?? pvq;

    if (sjt === undefined || ipip === undefined || valuesInput === undefined) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Completion requires sjt, ipip, and values fields",
        400,
      );
    }

    // Server-authoritative RIASEC (matches /api/score)
    let serverRiasec: Record<string, number> | null = null;
    try {
      const qd = await getLatestQuickDiveByUserId(user.id);
      if (qd) {
        const canonical = getCanonicalRiasec(qd);
        serverRiasec = canonical.riasecNormalized;
      }
    } catch (err) {
      console.warn(
        "[assessment/complete] Failed to fetch latest Quick Dive:",
        err instanceof Error ? err.message : err,
      );
    }

    const effectiveRiasec = serverRiasec ?? riasecNormalized;
    if (!effectiveRiasec) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Scoring requires riasecNormalized from Quick Dive",
        400,
      );
    }

    // Validate RIASEC dimensions
    const RIASEC_DIMS = ["R", "I", "A", "S", "E", "C"] as const;
    for (const dim of RIASEC_DIMS) {
      const v = effectiveRiasec[dim];
      if (typeof v !== "number" || !isFinite(v) || v < 0 || v > 100) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `Invalid RIASEC dimension ${dim}: must be 0-100`,
          400,
        );
      }
    }

    // Convert string-keyed records to number-keyed
    const valuesNumeric: Record<number, number> = {};
    for (const [k, v] of Object.entries(valuesInput))
      valuesNumeric[Number(k)] = v;
    const ipipNumeric: Record<number, number> = {};
    for (const [k, v] of Object.entries(ipip)) ipipNumeric[Number(k)] = v;

    const convertRt = (rt: Record<string, number>): Record<number, number> =>
      Object.fromEntries(
        Object.entries(rt).map(([k, v]) => [Number(k), v]),
      ) as Record<number, number>;

    const mt = metadata?.moduleTimes;
    const rt = metadata?.itemResponseTimes;
    const pipelineMetaV3 = {
      sessionId,
      totalTimeMs: metadata?.totalTimeMs ?? 0,
      moduleTimes: {
        sjt: mt?.sjt ?? 0,
        ddvq: mt?.ddvq ?? mt?.pvq ?? 0,
        ipip60: mt?.ipip60 ?? mt?.ipip30 ?? mt?.ipip ?? 0,
      },
      itemResponseTimes: rt
        ? {
            sjt: rt.sjt ? convertRt(rt.sjt) : undefined,
            ddvq:
              (rt.ddvq ? convertRt(rt.ddvq) : undefined) ??
              (rt.pvq ? convertRt(rt.pvq) : undefined),
            ipip60:
              (rt.ipip60 ? convertRt(rt.ipip60) : undefined) ??
              (rt.ipip30 ? convertRt(rt.ipip30) : undefined) ??
              (rt.ipip ? convertRt(rt.ipip) : undefined),
          }
        : undefined,
    };

    // ---- 1. Run scoring (pure algo, <1s) ----
    const scoringResult = runScoringPipelineV3(
      { sjt, values: valuesNumeric, ipip60: ipipNumeric },
      effectiveRiasec as Record<RIASECDimension, number>,
      pipelineMetaV3,
    );

    const idempotencyKey = `${sessionId}_score_v3.0`;
    const assessmentId = await saveAssessmentResult(
      scoringResult,
      user.id,
      "3.0",
      idempotencyKey,
    );

    // ---- 2. Complete the questionnaire session (retry on transient failure) ----
    //
    // Failure here leaves session.completedAt = null but assessment IS saved.
    // Pipeline worker can still advance; analytics may misclassify the session
    // as "abandoned" until the next manual cleanup. Sentry-warn on terminal
    // failure so ops can investigate without blocking the user response.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await completeSession(sessionId, metadata?.totalTimeMs ?? 0);
        break;
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 500));
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            "[assessment/complete] completeSession failed after 3 attempts:",
            message,
          );
          Sentry.captureMessage("completeSession failed after 3 attempts", {
            level: "warning",
            tags: {
              area: "assessment-complete",
              outcome: "session-cleanup-failed",
            },
            extra: {
              sessionId,
              userId: user.id,
              assessmentId,
              lastError: message,
            },
          });
        }
      }
    }

    // ---- 3. Create AssessmentPipeline row with scoring already done ----
    //
    // Pipeline creation must happen BEFORE lifecycle side effects. The pipeline
    // is the durable artifact the cron worker uses to recover from failures;
    // if we let lifecycle (registry/journey/cache) crash this request, the
    // pipeline never exists and the client can only retry via localStorage,
    // hitting the same non-transient failure each time.
    const pipeline = await createPipeline({
      assessmentId,
      userId: user.id,
      sessionId,
      locale: effectiveLocale,
      initial: { scoringStatus: "done" },
    });

    // ---- 4. Assessment lifecycle side effects — non-blocking ----
    //
    // Lifecycle (AssessmentCompletion registry, journey transition, user
    // context recompute, achievements) runs after the response is sent.
    // Failures are repaired by the pipeline worker: advancePipeline →
    // runProfileStep → afterProfileGenerated includes journey recovery
    // ("if state is still quick_dive_complete, advance COMPLETE_DEEP_DIVE
    // first") so journey drift self-heals on the next worker tick.
    after(async () => {
      try {
        await afterAssessmentComplete({
          userId: user.id,
          assessmentType: "deep_dive",
          resultId: sessionId,
        });
      } catch (err) {
        logApiError("/api/assessment/complete", ApiErrorCode.INTERNAL_ERROR, {
          message:
            "afterAssessmentComplete failed (non-fatal, pipeline-worker will repair)",
          cause: err,
        });
      }
    });

    // Kick-start the first async step immediately so users are not dependent
    // on the next cron tick before their algorithmic profile exists. The cron
    // worker remains the durable self-healing path for retries and narratives.
    if (pipeline.profileStatus !== "done") {
      after(async () => {
        try {
          await advancePipeline(pipeline, `completion-kick:${pipeline.id}`);
        } catch (err) {
          console.warn(
            "[assessment/complete] pipeline kick-start failed (cron will retry):",
            err instanceof Error ? err.message : err,
          );
        }
      });
    }

    // ---- 5. Funnel — deepdive_completed (schema-compliant) + pipeline_started ----
    trackFunnelEvent("deepdive_completed", {
      userId: user.id,
      metadata: {
        sessionId,
        language: effectiveLocale,
        totalTimeMs: metadata?.totalTimeMs ?? 0,
        pipelineVersion: "v4.0",
      },
      idempotencyKey: `deepdive_complete:${sessionId}`,
    }).catch(() => {});

    trackFunnelEvent("pipeline_started", {
      userId: user.id,
      metadata: { pipelineId: pipeline.id, assessmentId },
      idempotencyKey: `pipeline_started:${pipeline.id}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      pipelineId: pipeline.id,
      assessmentId,
      sessionId,
    });
  } catch (error) {
    logApiError("/api/assessment/complete", ApiErrorCode.INTERNAL_ERROR, {
      message: "Assessment complete error",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to complete assessment",
      500,
    );
  }
});
