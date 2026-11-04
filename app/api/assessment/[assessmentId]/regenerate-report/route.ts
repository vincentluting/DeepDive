// ============================================================
// POST /api/assessment/[assessmentId]/regenerate-report
//
// Triggers a fresh report generation for an assessment that already has a
// saved CareerReport — typically after the user uploads a resume from the
// report page's "re-enhance" entry point, but also works for any other
// reason the user wants a rerun (stale report, new real conditions, etc).
//
// Semantics:
//   1. Supersede every active CareerReport for this assessment (soft
//      delete — rows stay in the table for audit / research provenance).
//   2. Reset pipeline.reportStatus to 'pending' so both the foreground SSE
//      caller and the cron worker will treat it as a fresh run. Carries
//      the locale forward so a regenerate in a different language doesn't
//      silently reuse the old locale.
//   3. When the depth-mode dialog requests Standard, mark
//      resumeAnalysisStatus='skipped' so the cron fallback also honors
//      that choice (otherwise a foreground Standard + cron retry would
//      silently produce an Enhanced report).
//   4. Return the pipelineId so the caller can poll /processing UX.
//
// Gated identically to /request-report (entitlement + ownership, both
// with legacy session fallback for rows whose AssessmentResult.userId is
// still null).
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import {
  createPipeline,
  getPipelineByAssessment,
  requestReportGeneration,
  setResumeAnalysisStatusByAssessment,
} from "@/lib/db/pipeline";
import {
  getAssessmentOwner,
  getEffectiveAssessment,
  verifyAssessmentOwnership,
} from "@/lib/db/assessments";
import { getProfileByAssessment } from "@/lib/db/profiles";
import { supersedeActiveReports } from "@/lib/db/reports";
import { getLatestActiveResumeMatch } from "@/lib/db/resume-match";
import { hasRenderableNarratives } from "@/lib/profile-generation/narrative-renderability";
import {
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import { locales as SUPPORTED_LOCALES } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(raw: string | null): string {
  if (!raw) return "en";
  return (SUPPORTED_LOCALES as readonly string[]).includes(raw) ? raw : "en";
}

export const POST = withLogging(
  "/api/assessment/[assessmentId]/regenerate-report",
  async (
    request: NextRequest,
    ctx?: { params: Promise<{ assessmentId: string }> },
  ) => {
    const guard = await guardRoute(request, {
      tier: "ai",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;
    const userId = guard.user!.id;

    const params = ctx?.params ? await ctx.params : undefined;
    const assessmentId = params?.assessmentId;
    if (!assessmentId) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Missing assessmentId",
        400,
      );
    }

    // Entitlement gate — same as /request-report
    const hasAccess = await canAccessFeature(
      userId,
      guard.user!.cohort,
      "aiReport",
    );
    if (!hasAccess) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Report generation requires a purchase or invite code.",
        403,
      );
    }

    // Ownership — verifyAssessmentOwnership folds in the QuestionnaireSession
    // fallback so legacy rows whose AssessmentResult.userId is still null
    // (pre-backfill) don't 404 for their rightful owner. Fold every
    // non-owner outcome into 404 to avoid enumerating assessmentIds.
    const ownership = await verifyAssessmentOwnership(assessmentId, userId);
    if (ownership !== "owner") {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Assessment not found",
        404,
      );
    }
    // sessionId is still needed for pipeline creation below. verify*
    // doesn't return it, so one extra read is worth the clarity.
    const owner = await getAssessmentOwner(assessmentId);
    if (!owner) {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Assessment not found",
        404,
      );
    }

    const requestedLocale = resolveLocale(
      request.nextUrl.searchParams.get("locale"),
    );
    const requestedDepthMode = request.nextUrl.searchParams.get("depthMode");

    // Step 1: supersede active reports FIRST so the next generator doesn't
    // short-circuit on "existing report found". If no active report exists
    // this is a no-op (0 rows affected) and we still proceed — the caller
    // may be requesting a first-time generation via this endpoint too.
    const supersededCount = await supersedeActiveReports(assessmentId);

    // Step 2: ensure pipeline row exists, reflecting current state.
    let pipeline = await getPipelineByAssessment(assessmentId);
    if (!pipeline) {
      if (!owner.sessionId) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Assessment has no session",
          404,
        );
      }
      const profile = await getProfileByAssessment(assessmentId);
      const effectiveAssessment = await getEffectiveAssessment(
        assessmentId,
        userId,
      ).catch(() => null);
      const profileIsFresh =
        !!profile &&
        !!effectiveAssessment &&
        isProfileCurrentForAssessment(profile, effectiveAssessment);
      const hasNarratives =
        profileIsFresh &&
        hasRenderableNarratives(profile.narrativeSnapshots) &&
        isNarrativeCurrentForProfile(profile);
      pipeline = await createPipeline({
        assessmentId,
        userId,
        sessionId: owner.sessionId,
        locale: requestedLocale,
        initial: {
          scoringStatus: "done",
          profileStatus: profileIsFresh ? "done" : "pending",
          narrativesStatus: hasNarratives ? "done" : "pending",
          reportStatus: "not_requested",
        },
      });
    }

    // Step 3: reset reportStatus + locale in one SQL. updatePipelineLocale()
    // explicitly no-ops while reportStatus='done', so if we called it on the
    // common "already has a report" path the pipeline would keep its old
    // locale and cron would regenerate in the wrong language. Write both
    // columns in a single UPDATE so the pipeline is always internally
    // consistent, regardless of prior reportStatus.
    {
      const { sql } = await import("@/lib/db/connection");
      await sql`
        UPDATE "AssessmentPipeline"
        SET "reportStatus" = 'not_requested',
            "locale" = ${requestedLocale},
            "retryCount" = 0,
            "nextAttemptAt" = NULL,
            "lastStepError" = NULL,
            "updatedAt" = NOW()
        WHERE "id" = ${pipeline.id}
      `;
    }

    // Step 4: align pipeline.resumeAnalysisStatus with the caller's intent
    // so the cron worker honors the same Standard/Enhanced choice.
    //
    // - Standard: mark 'skipped' so even if a previously-persisted
    //   ResumeMatchResult is sitting in the DB, the cron fallback won't
    //   silently layer it in.
    // - Enhanced: ensure the status is 'done' whenever an active
    //   ResumeMatchResult actually exists. This matters for legacy
    //   assessments that have evidence from the old inline flow but whose
    //   pipeline was only just created above — the upload API's
    //   best-effort update would have no-op'd against the missing
    //   pipeline row. Without this backfill the regenerate would produce
    //   a Standard report despite the banner UX implying Enhanced.
    if (requestedDepthMode === "standard") {
      await setResumeAnalysisStatusByAssessment(assessmentId, "skipped").catch(
        () => {},
      );
    } else {
      const existingMatch = await getLatestActiveResumeMatch(
        assessmentId,
      ).catch(() => null);
      if (existingMatch) {
        await setResumeAnalysisStatusByAssessment(assessmentId, "done").catch(
          () => {},
        );
      }
    }

    const updated = await requestReportGeneration(pipeline.id);
    if (!updated) {
      // Race: another regenerate already flipped it, or state doesn't match.
      const refreshed = await getPipelineByAssessment(assessmentId);
      return NextResponse.json({
        success: true,
        pipelineId: pipeline.id,
        reportStatus: refreshed?.reportStatus ?? "pending",
        supersededCount,
        already: true,
      });
    }

    return NextResponse.json({
      success: true,
      pipelineId: pipeline.id,
      reportStatus: updated.reportStatus,
      reportRequestedAt: updated.reportRequestedAt?.toISOString() ?? null,
      supersededCount,
    });
  },
);
