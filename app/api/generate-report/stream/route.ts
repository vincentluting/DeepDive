// ============================================================
// POST /api/generate-report/stream — SSE Report Generation
//
// Same pipeline as /api/generate-report, but returns Server-Sent
// Events with real-time progress updates instead of a single JSON
// response. The frontend shows which pipeline stage is active.
//
// Events:
//   { stage: "preparing" }     — validating access, fetching data
//   { stage: "algorithms" }    — computing profile + career match
//   { stage: "career_match" }  — LLM: career match narrative
//   { stage: "integration" }   — LLM: integration + letter
//   { stage: "complete", reportId: "..." }  — done
//   { stage: "error", message: "..." }      — pipeline failed
// ============================================================

import { generateCareerReport } from "@/lib/report-generation";
import type { ReportProgressStage } from "@/lib/report-generation";
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
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { computeInputHash } from "@/lib/report/prerequisites";
import {
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import { afterReportGenerated } from "@/lib/db/assessment-lifecycle";
import { markReportDoneByAssessment } from "@/lib/db/pipeline";
import {
  acquireReportLock,
  releaseReportLock,
} from "@/lib/db/report-generation-lock";

export const maxDuration = 300;
const LOCK_WAIT_TIMEOUT_MS = 200_000;
const LOCK_WAIT_INTERVAL_MS = 1500;

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  // --- Auth + rate limiting (same as non-streaming endpoint) ---
  const guard = await guardRoute(request as never, {
    tier: "ai",
    requireAuth: true,
  });
  if (guard.blocked) return guard.response;

  const hasAccess = await canAccessFeature(
    guard.user?.id,
    guard.user?.cohort,
    "aiReport",
  );
  if (!hasAccess) {
    return new Response(
      JSON.stringify({
        error: "Report generation requires a purchase or invite code.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = await parseBody(request as never, generateReportSchema);
  if ("error" in parsed) return parsed.error;
  const { assessmentId, sessionId, locale, refresh, depthMode } = parsed.data;

  // --- Ownership gate (before ANY fast-path) ---
  // Never reveal the existence / id of a report for an assessment the caller
  // does not own. 404 for both not-found and forbidden (anti-enumeration). #059.
  const ownership = await verifyAssessmentOwnership(
    assessmentId,
    guard.user!.id,
  );
  if (ownership !== "owner") {
    return new Response(JSON.stringify({ error: "Assessment not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Check existing report (skip pipeline if already generated) ---
  if (!refresh) {
    const existingReport = await getReportByAssessment(assessmentId);
    if (existingReport) {
      return new Response(JSON.stringify({ reportId: existingReport.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Refresh mode: delete stale report
  if (refresh) {
    await sql`DELETE FROM "CareerReport" WHERE "assessmentId" = ${assessmentId} AND "userId" = ${guard.user!.id}`;
  }

  // --- Setup SSE stream ---
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const forceE2EDisconnect =
    process.env.NODE_ENV !== "production" &&
    request.headers.get("x-e2e-stream-disconnect") === "1";
  let writerClosed = false;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const closeWriter = async () => {
    if (writerClosed) return;
    writerClosed = true;
    try {
      await writer.close();
    } catch {
      // Already closed / client disconnected
    }
  };

  const sendEvent = async (data: Record<string, unknown>) => {
    try {
      await writer.write(encoder.encode(sseEvent(data)));
    } catch {
      // Client disconnected — ignore
    }
  };

  // Run pipeline in background, stream progress events
  const pipelinePromise = (async () => {
    let lockHandle: Awaited<ReturnType<typeof acquireReportLock>> | null = null;

    try {
      lockHandle = await acquireReportLock(assessmentId);
      if (!lockHandle) {
        await sendEvent({ stage: "preparing" });

        const waitUntil = Date.now() + LOCK_WAIT_TIMEOUT_MS;
        while (Date.now() < waitUntil) {
          const existingId = await getReportIdByAssessment(assessmentId);
          if (existingId) {
            await sendEvent({ stage: "complete", reportId: existingId });
            return;
          }
          await sleep(LOCK_WAIT_INTERVAL_MS);
        }

        await sendEvent({
          stage: "error",
          message:
            "Report generation is already in progress. Please try again in a moment.",
        });
        return;
      }

      // --- Fetch assessment ---
      await sendEvent({ stage: "preparing" });
      if (forceE2EDisconnect) {
        await closeWriter();
      }
      const user = await getCurrentUser();
      const assessment = await getEffectiveAssessment(assessmentId, user?.id);
      if (!assessment) {
        await sendEvent({ stage: "error", message: "Assessment not found" });
        return;
      }

      // --- Fetch real conditions + profile ---
      const effectiveSessionId = sessionId || assessment.sessionId;
      let realConditions = await getRealConditionsByUserId(user?.id);
      if (!realConditions && effectiveSessionId) {
        realConditions = await getRealConditions(effectiveSessionId);
      }

      const profile = await getProfileByAssessment(assessmentId);
      const profileIsFresh = profile
        ? isProfileCurrentForAssessment(profile, assessment)
        : false;
      const profileAlgoSnapshot = profileIsFresh
        ? (profile?.algoSnapshot ?? undefined)
        : undefined;
      const profileNarratives =
        profileIsFresh &&
        profile?.narrativeSnapshots &&
        isNarrativeCurrentForProfile(profile)
          ? {
              archetypeNarrative:
                profile.narrativeSnapshots.archetypeNarrative ?? "",
              bigFiveNarrative:
                profile.narrativeSnapshots.bigFiveNarrative ?? "",
              sjtTensionNarrative:
                profile.narrativeSnapshots.sjtTensionNarrative ?? "",
              valueNarrative: profile.narrativeSnapshots.valueNarrative ?? "",
              adaptabilityNarrative: "",
              valuesCrossImpactNarrative:
                profile.narrativeSnapshots.crossDimensionNarrative ?? "",
              crossConnections: [],
            }
          : null;

      const inputHash = computeInputHash({
        assessmentId,
        realConditions,
        riasecNormalized: assessment.riasecNormalized,
      });

      // Resume enhancement — latest non-superseded evidence, if any.
      // Honor the depth-mode dialog's Standard choice by skipping the DB
      // read entirely. Null + the generator's existing null-branch produces
      // the same report a user without a resume would get.
      const resumeMatch =
        depthMode === "standard"
          ? null
          : await (async () => {
              const { getLatestActiveResumeMatch } =
                await import("@/lib/db/resume-match");
              return getLatestActiveResumeMatch(assessmentId).catch(() => null);
            })();

      // --- Generate report with progress callbacks ---
      const onProgress = (stage: ReportProgressStage) => {
        sendEvent({ stage });
      };

      const report = await generateCareerReport(
        assessment,
        realConditions,
        locale || "en",
        profileAlgoSnapshot,
        profileNarratives,
        onProgress,
        resumeMatch,
        guard.user?.id ?? null,
      );

      // --- Save to DB (with retry) ---
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
            await new Promise((r) => setTimeout(r, saveAttempt * 1000));
          } else {
            throw saveErr;
          }
        }
      }

      if (!id) {
        const existingId = await getReportIdByAssessment(assessmentId);
        if (!existingId) {
          throw new Error(
            "Report save returned null and no existing report found",
          );
        }
        id = existingId;
      }

      // --- Journey state + tracking (fire-and-forget) ---
      if (user?.id) {
        afterReportGenerated(user.id).catch((err) =>
          console.error(
            "[generate-report/stream] Journey advance failed:",
            err,
          ),
        );
      }

      // Sync pipeline.reportStatus immediately so the dashboard banner /
      // observability lifecycle reflect completion without the ~60s cron lag.
      markReportDoneByAssessment(assessmentId).catch((err) => {
        console.warn(
          `[generate-report/stream] pipeline sync failed (non-fatal) for ${assessmentId}:`,
          err instanceof Error ? err.message : err,
        );
      });

      trackFunnelEvent("report_generated", {
        userId: user?.id,
        metadata: { assessmentId, reportId: id, locale: locale || "en" },
        idempotencyKey: `report_gen:${assessmentId}`,
      }).catch(() => {});

      if (user?.id) {
        const achEvent = refresh ? "report_regenerated" : "report_generated";
        import("@/lib/achievements/engine")
          .then((m) =>
            m.checkAchievements(user.id, achEvent, {
              assessmentId,
              reportId: id,
            }),
          )
          .catch(() => {});

        if (!refresh) {
          import("@/lib/coaching/trigger-coach-message").then(
            ({ triggerCoachMessage }) => {
              triggerCoachMessage(user!.id, "report_generated").catch(() => {});
            },
          );
        }
      }

      // --- Send completion event ---
      await sendEvent({ stage: "complete", reportId: id });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      logApiError("/api/generate-report/stream", ApiErrorCode.INTERNAL_ERROR, {
        message: errMsg,
        cause: error,
      });
      await sendEvent({
        stage: "error",
        message: "Failed to generate career report. Please try again.",
      });
    } finally {
      if (lockHandle) {
        await releaseReportLock(lockHandle);
      }
      await closeWriter();
    }
  })();

  // Don't await — let it run while streaming
  void pipelinePromise;

  return new Response(stream.readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
