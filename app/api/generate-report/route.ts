// ============================================================
// POST /api/generate-report — Report Generation Endpoint
//
// Input:  { assessmentId: string, sessionId?: string }
// Output: { reportId: string }
//
// Pipeline: Fetch assessment → Fetch profile algo snapshot + real conditions
//           → generateCareerReport() (2-3 LLM calls, 1-2 parallel + 1 sequential)
//           → Save to DB → Return reportId
// ============================================================

import { NextResponse } from "next/server";
import { generateCareerReport } from "@/lib/report-generation";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { sql } from "@/lib/db/connection";
import {
  getEffectiveAssessment,
  verifyAssessmentOwnership,
} from "@/lib/db/assessments";
import {
  getRealConditions,
  getRealConditionsByUserId,
} from "@/lib/db/conditions";
import { getProfileByAssessment } from "@/lib/db/profiles";
import {
  saveReportTransactional,
  getReportByAssessment,
  getReportIdByAssessment,
} from "@/lib/db/reports";
import { getCurrentUser } from "@/lib/auth";
import { parseBody } from "@/lib/validation/parse-body";
import { generateReportSchema } from "@/lib/validation/api-schemas";
import { getLocalizedField } from "@/lib/i18n/localize";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { getJourneyState as _getJourneyState } from "@/lib/db/journey";
import { computeInputHash } from "@/lib/report/prerequisites";
import {
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import { afterReportGenerated } from "@/lib/db/assessment-lifecycle";
import { hasReached as _hasReached } from "@/lib/journey/state-machine";
import {
  acquireReportLock,
  releaseReportLock,
} from "@/lib/db/report-generation-lock";
import { markReportDoneByAssessment } from "@/lib/db/pipeline";

// Vercel Fluid Compute (default since 2025-04) allows up to 300s on Hobby plan.
// Report pipeline needs ~60-120s for 2-3 LLM calls; 300s gives ample headroom.
export const maxDuration = 300;

// In-memory lock — fast path for same-instance concurrent requests.
// Cross-instance dedup is handled by ReportGenerationLock (DB-level).
const _generationInFlight = new Map<string, Promise<string>>();

// Poll for another instance's completed report while our generation is locked out.
// Aligned with PIPELINE_TIMEOUT_MS (180s) + slack for DB save.
const LOCK_WAIT_TIMEOUT_MS = 200_000;
const LOCK_WAIT_INTERVAL_MS = 1500;

export const POST = withLogging("/api/generate-report", async (request) => {
  // Lock is released via this helper on every exit path (success, early return,
  // generation finally, AND the outer catch — incl. preflight failures before
  // the generation try/finally). Nulling after release makes it idempotent so
  // no path double-releases. Fixes #036 (preflight throw stranded the lock to TTL).
  let lockHandle: Awaited<ReturnType<typeof acquireReportLock>> = null;
  const releaseLock = async () => {
    if (lockHandle) {
      await releaseReportLock(lockHandle);
      lockHandle = null;
    }
  };
  try {
    const observeE2ESource =
      process.env.NODE_ENV !== "production" &&
      request.headers.get("x-e2e-observe-report-source") === "1";
    const jsonSuccess = (
      reportId: string,
      e2eSource:
        | "existing_report"
        | "same_instance_inflight"
        | "lock_wait_existing"
        | "generated",
    ) =>
      NextResponse.json(
        observeE2ESource ? { reportId, e2eSource } : { reportId },
      );

    const guard = await guardRoute(request, { tier: "ai", requireAuth: true });
    if (guard.blocked) return guard.response;

    // Entitlement gate — cohort access OR Stripe purchase
    const hasAccess = await canAccessFeature(
      guard.user?.id,
      guard.user?.cohort,
      "aiReport",
    );
    if (!hasAccess) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Report generation requires a purchase or invite code. Visit /pricing to get started.",
        403,
      );
    }

    const parsed = await parseBody(request, generateReportSchema);
    if ("error" in parsed) return parsed.error;
    const { assessmentId, sessionId, locale, refresh, depthMode } = parsed.data;

    // --- 0. Ownership gate (before ANY fast-path) ---
    // Never reveal even the existence / id of a report for an assessment the
    // caller does not own. 404 for both not-found and forbidden so the cases
    // are indistinguishable (anti-enumeration). #059 / security P3-1.
    const ownership = await verifyAssessmentOwnership(
      assessmentId,
      guard.user!.id,
    );
    if (ownership !== "owner") {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Assessment not found",
        404,
      );
    }

    // --- 1. Check if report already exists for this assessment ---
    if (!refresh) {
      const existingReport = await getReportByAssessment(assessmentId);
      if (existingReport) {
        return jsonSuccess(existingReport.id, "existing_report");
      }
    }

    // --- 1a. Refresh mode: delete stale report so a fresh one can be generated ---
    if (refresh) {
      await sql`DELETE FROM "CareerReport" WHERE "assessmentId" = ${assessmentId} AND "userId" = ${guard.user!.id}`;
    }

    // --- 1b. Same-instance dedup: attach to an in-flight generation if present. ---
    const inFlight = _generationInFlight.get(assessmentId);
    if (inFlight) {
      try {
        const reportId = await inFlight;
        return jsonSuccess(reportId, "same_instance_inflight");
      } catch {
        // If the in-flight generation failed, we'll try again below
      }
    }

    // --- 1c. Cross-instance dedup: claim DB lock before starting LLM pipeline. ---
    // Without this, two Vercel instances would both run the full 3×LLM pipeline
    // and race at save time — the loser's $0.10+ of LLM calls go to waste.
    lockHandle = await acquireReportLock(assessmentId);
    if (!lockHandle) {
      // Another instance is generating. Poll CareerReport for their result.
      const waitUntil = Date.now() + LOCK_WAIT_TIMEOUT_MS;
      while (Date.now() < waitUntil) {
        await new Promise((r) => setTimeout(r, LOCK_WAIT_INTERVAL_MS));
        const existingId = await getReportIdByAssessment(assessmentId);
        if (existingId) {
          return jsonSuccess(existingId, "lock_wait_existing");
        }
      }
      // Timed out — lock expired or peer crashed. Let the next retry claim it.
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Report generation in progress from another request. Please retry in a moment.",
        503,
      );
    }

    // --- 2. Fetch assessment with latest QD RIASEC merged ---
    const user = await getCurrentUser();
    const assessment = await getEffectiveAssessment(assessmentId, user?.id);
    if (!assessment) {
      await releaseLock();
      logApiError("/api/generate-report", ApiErrorCode.ASSESSMENT_NOT_FOUND, {
        message: `Assessment not found: ${assessmentId}`,
      });
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Assessment not found",
        404,
      );
    }

    // --- 3. Fetch RealConditions (optional) ---
    // Primary: userId-based lookup (conditions are person-level)
    const effectiveSessionId = sessionId || assessment.sessionId;
    if (!sessionId && assessment.sessionId) {
      logApiError("/api/generate-report", ApiErrorCode.VALIDATION_ERROR, {
        message: `sessionId not in request, falling back to assessment.sessionId=${assessment.sessionId} for assessmentId=${assessmentId} (legacy path)`,
      });
    }
    let realConditions = await getRealConditionsByUserId(user?.id);
    // Fallback: sessionId-based for legacy data without userId
    if (!realConditions && effectiveSessionId) {
      realConditions = await getRealConditions(effectiveSessionId);
    }

    // --- 3b. Read profile's algo snapshot + narratives (if profile exists) ---
    const profile = await getProfileByAssessment(assessmentId);
    const profileIsFresh = profile
      ? isProfileCurrentForAssessment(profile, assessment)
      : false;
    const profileAlgoSnapshot = profileIsFresh
      ? (profile?.algoSnapshot ?? undefined)
      : undefined;
    // Extract LLM-generated identity narratives for richer integration context
    const profileNarratives =
      profileIsFresh &&
      profile?.narrativeSnapshots &&
      isNarrativeCurrentForProfile(profile)
        ? {
            archetypeNarrative:
              profile.narrativeSnapshots.archetypeNarrative ?? "",
            bigFiveNarrative: profile.narrativeSnapshots.bigFiveNarrative ?? "",
            sjtTensionNarrative:
              profile.narrativeSnapshots.sjtTensionNarrative ?? "",
            valueNarrative: profile.narrativeSnapshots.valueNarrative ?? "",
            adaptabilityNarrative: "",
            valuesCrossImpactNarrative:
              profile.narrativeSnapshots.crossDimensionNarrative ?? "",
            crossConnections: [],
          }
        : null;

    // --- 3c. Compute input hash for staleness detection ---
    const inputHash = computeInputHash({
      assessmentId,
      realConditions,
      riasecNormalized: assessment.riasecNormalized,
    });

    // --- 3d. Resume enhancement — latest non-superseded evidence, if any.
    //         Skip entirely when the caller asked for "standard" mode so
    //         the depth-mode dialog's Standard choice is honored even if
    //         the user uploaded a resume in a previous session. ---
    const resumeMatch =
      depthMode === "standard"
        ? null
        : await (async () => {
            const { getLatestActiveResumeMatch } =
              await import("@/lib/db/resume-match");
            return getLatestActiveResumeMatch(assessmentId).catch(() => null);
          })();

    // --- 4. Generate report (with in-memory dedup + DB-level UNIQUE constraint) ---
    const generationPromise = (async () => {
      const report = await generateCareerReport(
        assessment,
        realConditions,
        locale || "en",
        profileAlgoSnapshot,
        profileNarratives,
        undefined,
        resumeMatch,
        guard.user?.id ?? null,
      );

      // --- 5. Save to DB atomically (backfill + insert + narrative snapshots) ---
      // v3.0: narrative snapshots are written during profile generation, not report generation.
      // Only pass integration-level narratives that are produced by the report pipeline.
      const narrativeSnapshots = {
        letterToUser: report.integration?.letterToUser,
        coreInsight: report.integration?.coreInsight,
        careerDrainSummary: report.careerDrainWarning?.drainingDirections
          ? report.careerDrainWarning.drainingDirections
              .slice(0, 2)
              .map(
                (d) =>
                  getLocalizedField(d, "title", locale) || d.title_en || "",
              )
              .join(", ")
          : undefined,
        populatedAt: new Date().toISOString(),
      };

      // Save with retry — LLM output is expensive to regenerate (180s + API credits).
      // A transient DB hiccup should not discard the generated content.
      let id: string | null = null;
      for (let saveAttempt = 1; saveAttempt <= 3; saveAttempt++) {
        try {
          id = await saveReportTransactional(
            report,
            user?.id,
            effectiveSessionId,
            assessmentId,
            narrativeSnapshots,
            inputHash,
          );
          break;
        } catch (saveErr) {
          if (saveAttempt < 3) {
            console.warn(
              `[generate-report] DB save attempt ${saveAttempt}/3 failed, retrying in ${saveAttempt}s:`,
              saveErr instanceof Error ? saveErr.message : saveErr,
            );
            await new Promise((r) => setTimeout(r, saveAttempt * 1000));
          } else {
            throw saveErr; // Let outer catch handle after all retries exhausted
          }
        }
      }

      // Dedup: another serverless instance completed first — return existing report ID
      if (!id) {
        const existingId = await getReportIdByAssessment(assessmentId);
        if (!existingId) {
          throw new Error(
            `Report save returned null and no existing report found for assessment ${assessmentId}`,
          );
        }
        return existingId;
      }

      return id;
    })();

    _generationInFlight.set(assessmentId, generationPromise);
    let reportId: string;
    try {
      reportId = await generationPromise;
    } finally {
      _generationInFlight.delete(assessmentId);
      await releaseLock();
    }

    // Sync pipeline state so observability / dashboard banners reflect the
    // report save immediately, not after the next cron tick (~60s lag).
    markReportDoneByAssessment(assessmentId).catch((err) => {
      console.warn(
        `[generate-report] pipeline sync failed (non-fatal) for ${assessmentId}:`,
        err instanceof Error ? err.message : err,
      );
    });

    // --- 7. Advance journey state machine (with retry) ---
    // Report is the user's reward for 86 questions — never withhold it
    // because of a secondary system (journey state) failure.
    // But retry once because journey failure blocks coaching access.
    if (user?.id) {
      for (let jAttempt = 1; jAttempt <= 2; jAttempt++) {
        try {
          await afterReportGenerated(user.id);
          break;
        } catch (journeyErr) {
          if (jAttempt < 2) {
            console.warn(
              `[generate-report] Journey advance attempt ${jAttempt}/2 failed, retrying in 1s:`,
              journeyErr instanceof Error ? journeyErr.message : journeyErr,
            );
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            console.error(
              `[generate-report] Journey advance failed for user ${user.id}, report ${reportId} still returned:`,
              journeyErr,
            );
          }
        }
      }
    }

    // --- 8. Track report generation completion (fire-and-forget) ---
    trackFunnelEvent("report_generated", {
      userId: user?.id,
      metadata: { assessmentId, reportId, locale: locale || "en" },
      idempotencyKey: `report_gen:${assessmentId}`,
    }).catch(() => {});

    if (user?.id) {
      const achEvent = refresh ? "report_regenerated" : "report_generated";
      import("@/lib/achievements/engine")
        .then((m) =>
          m.checkAchievements(user.id, achEvent, { assessmentId, reportId }),
        )
        .catch(() => {});

      // Fire-and-forget: notify coach companion
      if (!refresh) {
        import("@/lib/coaching/trigger-coach-message").then(
          ({ triggerCoachMessage }) => {
            triggerCoachMessage(user!.id, "report_generated").catch(() => {});
          },
        );
      }
    }

    // --- 9. Return reportId ---
    return jsonSuccess(reportId, "generated");
  } catch (error) {
    // Release the report lock on ANY failure path (incl. preflight before the
    // generation try/finally) so a transient error can't strand the lock until
    // its TTL and block this assessment's report for every caller (#036).
    await releaseLock();
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Map provider-specific errors to typed codes (both OpenAI and Anthropic)
    let code = ApiErrorCode.INTERNAL_ERROR;
    let message = "Failed to generate career report";
    let status = 500;

    if (
      errMsg.includes("OPENAI_API_KEY") ||
      errMsg.includes("ANTHROPIC_API_KEY")
    ) {
      code = ApiErrorCode.AI_NOT_CONFIGURED;
      message = "AI service is not configured";
      status = 503;
    } else if (
      errMsg.includes("API error: 401") ||
      errMsg.includes("invalid API key")
    ) {
      code = ApiErrorCode.AI_KEY_INVALID;
      message = "AI service authentication failed";
      status = 502;
    } else if (
      errMsg.includes("API error: 429") ||
      errMsg.includes("rate limit")
    ) {
      code = ApiErrorCode.AI_RATE_LIMITED;
      message = "AI service is temporarily overloaded, please retry";
      status = 429;
    } else if (
      errMsg.includes("API error: 5") ||
      errMsg.includes("server error") ||
      errMsg.includes("overloaded")
    ) {
      code = ApiErrorCode.AI_SERVICE_ERROR;
      message = "AI service is temporarily unavailable, please retry";
      status = 502;
    } else if (errMsg.includes("timed out") || errMsg.includes("timeout")) {
      code = ApiErrorCode.AI_SERVICE_ERROR;
      message = "AI service response timed out, please retry";
      status = 504;
    }

    logApiError("/api/generate-report", code, {
      message,
      cause: error,
    });

    return createErrorResponse(code, message, status);
  }
});
