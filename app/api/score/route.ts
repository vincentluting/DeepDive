// ============================================================
// POST /api/score — Scoring Algorithm Endpoint (v3.0 only)
//
// Payload: { sessionId, sjt[], pvq{} | values{}, ipip{}, riasecNormalized{} }
// Output: AssessmentResultV3 (with id)
// v3.0: archetype computed internally from RIASEC + Schwartz higher-order.
// Accepts `values` (TwIVI) with `pvq` as backward-compat alias.
// ============================================================

import { NextResponse } from "next/server";
import { runScoringPipelineV3 } from "@/lib/scoring";
import { saveAssessmentResult } from "@/lib/db/assessments";
import { ensureSessionExists, completeSession } from "@/lib/db/sessions";
import { getCurrentUser } from "@/lib/auth";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { scoreSchemaCombined } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { serverAnalytics } from "@/lib/analytics/client";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { saveAdminPreset } from "@/lib/db/admin-presets";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import { getCanonicalRiasec } from "@/lib/db/riasec-canonical";
import { canAccess } from "@/lib/cohort/entitlements";
import type { RIASECDimension } from "@/lib/types";

export const POST = withLogging("/api/score", async (request) => {
  try {
    // Bug-log #052 (= codex C1-8 / C5-3 / C3-7) + #040 entitlement gap:
    // legacy /api/score was anonymous-write — any unauthenticated client
    // could persist an AssessmentResult with a chosen RIASEC payload, and
    // even authenticated users without a Deep Dive cohort entitlement could
    // bypass the cohort access matrix here. Combined with the bug-log #006
    // schema lock (canonical TwIVI-20 / IPIP-60 / 6-unique-SJT), the
    // `requireAuth: true` guard + `canAccess(..., "deepDive")` entitlement
    // check below close both injection paths into the thesis data pool.
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    // Entitlement gate: the page-level Deep Dive route already checks
    // `canAccess` (app/[locale]/(immersive)/deepdive/page.tsx) but the API
    // is reachable directly; mirror the gate so a caller without the
    // `deepDive` entitlement cannot write an AssessmentResult.
    if (!canAccess(guard.user!.cohort, "deepDive")) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Your cohort does not have Deep Dive access",
        403,
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

    // Ensure session row exists before FK-dependent operations
    await ensureSessionExists(sessionId, locale ?? "en", "deep", user?.id);

    // ---- Resolve values field: prefer `values` (TwIVI), fall back to `pvq` (PVQ-21) ----
    const valuesInput = values ?? pvq;

    // ---- Validate required fields ----
    if (sjt === undefined || ipip === undefined || valuesInput === undefined) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Scoring requires sjt, ipip, and values (or pvq) fields",
        400,
      );
    }

    // Server-authoritative RIASEC: always fetch latest Quick Dive from DB
    // instead of trusting client-provided data (which may be stale if user
    // retook Quick Dive in another tab while Deep Dive was open).
    let serverRiasec: Record<string, number> | null = null;
    if (user?.id) {
      try {
        const qd = await getLatestQuickDiveByUserId(user.id);
        if (qd) {
          const canonical = getCanonicalRiasec(qd);
          serverRiasec = canonical.riasecNormalized;
        }
      } catch (err) {
        console.warn(
          "[score] Failed to fetch latest Quick Dive, falling back to client data:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // Use server-fetched RIASEC if available, fall back to client-provided
    const effectiveRiasec = serverRiasec ?? riasecNormalized;

    if (!effectiveRiasec) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Scoring requires riasecNormalized from Quick Dive",
        400,
      );
    }

    // Validate RIASEC dimensions: all 6 must be present, numeric, and in [0, 100]
    const RIASEC_DIMS = ["R", "I", "A", "S", "E", "C"] as const;
    for (const dim of RIASEC_DIMS) {
      const val = effectiveRiasec[dim];
      if (typeof val !== "number" || !isFinite(val) || val < 0 || val > 100) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `Invalid RIASEC dimension ${dim}: must be a number between 0 and 100`,
          400,
        );
      }
    }

    // Convert string-keyed record to number-keyed (JSON keys are always strings)
    const valuesNumeric: Record<number, number> = {};
    for (const [k, v] of Object.entries(valuesInput)) {
      valuesNumeric[Number(k)] = v;
    }
    const ipipNumeric: Record<number, number> = {};
    for (const [k, v] of Object.entries(ipip)) {
      ipipNumeric[Number(k)] = v;
    }

    // Convert itemResponseTimes string keys → number keys (optional)
    const convertRtKeys = (
      rt: Record<string, number>,
    ): Record<number, number> =>
      Object.fromEntries(
        Object.entries(rt).map(([k, v]) => [Number(k), v]),
      ) as Record<number, number>;

    const ipipItemCount = Object.keys(ipipNumeric).length;
    const mt = metadata?.moduleTimes;
    const version = "3.0" as const;

    if (ipipItemCount > 60) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "v2.0 scoring pipeline has been removed. Please use the v3.0 questionnaire (60 IPIP items).",
        400,
      );
    }

    // v3.0 pathway: IPIP-60 + TwIVI (86-item questionnaire)
    // Build v3 metadata with correct key names (accept legacy keys as fallback)
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
            sjt: rt.sjt ? convertRtKeys(rt.sjt) : undefined,
            ddvq:
              (rt.ddvq ? convertRtKeys(rt.ddvq) : undefined) ??
              (rt.pvq ? convertRtKeys(rt.pvq) : undefined),
            ipip60:
              (rt.ipip60 ? convertRtKeys(rt.ipip60) : undefined) ??
              (rt.ipip30 ? convertRtKeys(rt.ipip30) : undefined) ??
              (rt.ipip ? convertRtKeys(rt.ipip) : undefined),
          }
        : undefined,
    };

    const result = runScoringPipelineV3(
      { sjt, values: valuesNumeric, ipip60: ipipNumeric },
      effectiveRiasec as Record<RIASECDimension, number>,
      pipelineMetaV3,
    );

    // Idempotency: sessionId is unique per questionnaire attempt, so use it as the key
    const idempotencyKey = `${sessionId}_score_v${version}`;
    const assessmentId = await saveAssessmentResult(
      result,
      user?.id,
      version,
      idempotencyKey,
    );

    // Mark session as completed in DB — retry with exponential backoff
    // to prevent stale "active" sessions from triggering false resume prompts.
    // Assessment is already saved; this is a critical follow-up operation.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await completeSession(sessionId, metadata?.totalTimeMs ?? 0);
        break;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : err;
        if (attempt < 3) {
          console.warn(
            `[score] completeSession attempt ${attempt}/3 failed, retrying in ${attempt * 500}ms:`,
            errMsg,
          );
          await new Promise((r) => setTimeout(r, attempt * 500));
        } else {
          console.error(
            "[score] completeSession failed after 3 attempts — session may remain active:",
            errMsg,
          );
        }
      }
    }

    // Unified lifecycle: completion registry + journey + cache + achievements
    if (user?.id) {
      // Lifecycle is non-blocking. The core API contract is "score and return
      // assessmentId"; lifecycle drift (journey/cache/registry) is repaired
      // lazily by the pipeline worker's afterProfileGenerated, which has
      // built-in journey recovery for missing intermediate states. Letting a
      // lifecycle failure crash this request would force the client to retry
      // an already-saved assessment with no benefit.
      try {
        await afterAssessmentComplete({
          userId: user.id,
          assessmentType: "deep_dive",
          resultId: sessionId,
        });
      } catch (err) {
        logApiError("/api/score", ApiErrorCode.INTERNAL_ERROR, {
          message:
            "afterAssessmentComplete failed (non-fatal, pipeline-worker will repair)",
          cause: err,
        });
      }

      // Auto-save preset for admin users (best-effort, non-blocking)
      if (guard.user?.isAdmin) {
        saveAdminPreset({
          userId: user.id,
          deepDiveAnswers: {
            sjt,
            values: valuesInput,
            ipip60: ipip,
          },
          locale: locale ?? "en",
        }).catch(() => {});
      }
    }

    serverAnalytics
      .track(
        "deepdive_completed",
        {
          sessionId,
          totalTimeMs: metadata?.totalTimeMs,
          language: locale ?? "en",
          pipelineVersion: version,
        },
        { userId: user?.id },
      )
      .catch((err) => {
        console.warn(
          "[funnel] Failed to track deepdive_completed:",
          err instanceof Error ? err.message : err,
        );
      });

    // Fire-and-forget: notify coach companion + auto-configure persona
    if (user?.id) {
      import("@/lib/coaching/trigger-coach-message").then(
        ({ triggerCoachMessage }) => {
          triggerCoachMessage(user.id, "deep_dive_complete").catch(() => {});
        },
      );
      // Auto-configure coach persona from assessment data (if not already set)
      Promise.all([
        import("@/lib/coaching/persona-defaults"),
        import("@/lib/db/connection"),
      ])
        .then(async ([{ generatePersonaDefaults }, { sql: db }]) => {
          const rows =
            await db`SELECT "coachPersona" FROM "User" WHERE "id" = ${user.id}`;
          if (rows[0]?.coachPersona) return; // Already configured
          const ipipKeys = Object.keys(ipipNumeric);
          const facetLabels = ipipKeys.map((k) =>
            k.replace(/^\d+/, "").replace(/_/g, " "),
          );
          const persona = generatePersonaDefaults({
            topFacets: facetLabels.slice(0, 5),
            bottomFacets: facetLabels.slice(-5),
            locale: locale ?? "en",
          });
          await db`UPDATE "User" SET "coachPersona" = ${JSON.stringify(persona)} WHERE "id" = ${user.id}`;
        })
        .catch(() => {});
    }

    return NextResponse.json({ ...result, id: assessmentId });
  } catch (error) {
    logApiError("/api/score", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to score assessment",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to score assessment",
      500,
    );
  }
});
