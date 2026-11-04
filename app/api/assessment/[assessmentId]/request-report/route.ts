// ============================================================
// POST /api/assessment/[assessmentId]/request-report
//
// Idempotent "I want a Deep Dive report" signal. Works for any user who has
// a completed assessment — handles both new users (pipeline row exists from
// /api/assessment/complete) and legacy users (no pipeline row yet; we create
// one reflecting current DB state).
//
// This is the proper entry point for the profile page's "View Deep Dive
// Report" CTA. It flips reportStatus → 'pending' so the cron worker will
// retry on the user's behalf if the foreground streaming call fails.
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
  updatePipelineLocale,
} from "@/lib/db/pipeline";
import { hasRenderableNarratives } from "@/lib/profile-generation/narrative-renderability";
import {
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import { locales as SUPPORTED_LOCALES } from "@/lib/i18n/config";
import {
  getAssessmentOwner,
  getEffectiveAssessment,
} from "@/lib/db/assessments";
import { getProfileByAssessment } from "@/lib/db/profiles";
import { getReportByAssessment } from "@/lib/db/reports";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { setResumeAnalysisStatusByAssessment } from "@/lib/db/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(raw: string | null): string {
  if (!raw) return "en";
  return (SUPPORTED_LOCALES as readonly string[]).includes(raw) ? raw : "en";
}

export const POST = withLogging(
  "/api/assessment/[assessmentId]/request-report",
  async (
    request: NextRequest,
    ctx?: { params: Promise<{ assessmentId: string }> },
  ) => {
    const guard = await guardRoute(request, {
      tier: "ai",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const params = ctx?.params ? await ctx.params : undefined;
    const assessmentId = params?.assessmentId;
    if (!assessmentId) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Missing assessmentId",
        400,
      );
    }

    // Entitlement gate — same as /api/generate-report
    const hasAccess = await canAccessFeature(
      guard.user!.id,
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

    // Ownership check: verify this user owns the assessment row. Using the
    // raw owner getter (not getEffectiveAssessment) — that merges in the
    // caller's own QuickDive data and would silently succeed for any victim
    // assessmentId. Pretend the row doesn't exist rather than leaking
    // presence via a distinct 403.
    const owner = await getAssessmentOwner(assessmentId);
    if (!owner || owner.userId !== guard.user!.id) {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Assessment not found",
        404,
      );
    }

    const requestedLocale = resolveLocale(
      request.nextUrl.searchParams.get("locale"),
    );

    // Depth-mode signal from the Profile "Generate report" dialog. We only
    // need it for one thing: if the user picked "standard", mark the
    // pipeline's resumeAnalysisStatus as "skipped" so the cron fallback
    // also honors that choice when it runs the report step. If the user
    // picked "enhanced" we leave the status alone — the upload API already
    // flipped it to "done" if a resume was actually persisted.
    const requestedDepthMode = request.nextUrl.searchParams.get("depthMode");
    if (requestedDepthMode === "standard") {
      await setResumeAnalysisStatusByAssessment(assessmentId, "skipped").catch(
        () => {},
      );
    }

    // Find or create pipeline row reflecting current DB state.
    let pipeline = await getPipelineByAssessment(assessmentId);
    if (!pipeline) {
      if (!owner.sessionId) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Assessment has no session",
          404,
        );
      }
      const [profile, existingReport] = await Promise.all([
        getProfileByAssessment(assessmentId),
        getReportByAssessment(assessmentId),
      ]);
      const effectiveAssessment = await getEffectiveAssessment(
        assessmentId,
        guard.user!.id,
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
        userId: guard.user!.id,
        sessionId: owner.sessionId,
        locale: requestedLocale,
        initial: {
          scoringStatus: "done",
          profileStatus: profileIsFresh ? "done" : "pending",
          narrativesStatus: hasNarratives ? "done" : "pending",
          reportStatus: existingReport ? "done" : "not_requested",
        },
      });
    } else if (requestedLocale !== pipeline.locale) {
      // Existing pipeline but user is retrying from a different language —
      // sync the locale before flipping reportStatus so cron generates
      // the report in the user's current language. No-op if report already
      // done (we don't silently re-generate on locale mismatch).
      await updatePipelineLocale(pipeline.id, requestedLocale).catch(() => {
        // Non-fatal — worst case user gets report in the original locale.
      });
    }

    // Report already generated — nothing to do, return current state.
    if (pipeline.reportStatus === "done") {
      return NextResponse.json({
        success: true,
        pipelineId: pipeline.id,
        reportStatus: "done",
        already: true,
      });
    }
    if (pipeline.reportStatus === "running") {
      return NextResponse.json({
        success: true,
        pipelineId: pipeline.id,
        reportStatus: "running",
        already: true,
      });
    }

    // Flip report status → pending (handles both not_requested and failed).
    const updated = await requestReportGeneration(pipeline.id);
    if (!updated) {
      // Race: concurrent click already flipped it. Return current state.
      const refreshed = await getPipelineByAssessment(assessmentId);
      return NextResponse.json({
        success: true,
        pipelineId: pipeline.id,
        reportStatus: refreshed?.reportStatus ?? "pending",
        already: true,
      });
    }

    trackFunnelEvent("report_generation_requested", {
      userId: guard.user!.id,
      metadata: { pipelineId: pipeline.id, assessmentId },
      idempotencyKey: `report_req:${pipeline.id}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      pipelineId: pipeline.id,
      reportStatus: updated.reportStatus,
      reportRequestedAt: updated.reportRequestedAt?.toISOString() ?? null,
    });
  },
);
