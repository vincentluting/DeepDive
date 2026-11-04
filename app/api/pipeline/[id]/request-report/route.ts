// ============================================================
// POST /api/pipeline/[id]/request-report — user-triggered report generation
//
// Flipped from the profile page "View Deep Dive Report" button.
// Moves reportStatus from 'not_requested' → 'pending'. The cron worker
// picks up the step on the next tick; client polls status to follow along.
//
// Idempotent: if the user double-clicks or the request already succeeded
// (reportStatus 'pending' | 'running' | 'done'), returns the current state.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import { getPipeline, requestReportGeneration } from "@/lib/db/pipeline";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withLogging(
  "/api/pipeline/[id]/request-report",
  async (request: NextRequest, ctx?: { params: Promise<{ id: string }> }) => {
    const guard = await guardRoute(request, {
      tier: "ai",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const params = ctx?.params ? await ctx.params : undefined;
    const id = params?.id;
    if (!id) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Missing pipeline id",
        400,
      );
    }

    // Ownership check: conflate "not found" and "not yours" into a single 404
    // so attackers can't enumerate pipelineIds by observing 404 vs 403. Mirrors
    // the pattern in /api/assessment/[assessmentId]/request-report.
    const pipeline = await getPipeline(id);
    if (!pipeline || pipeline.userId !== guard.user?.id) {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Pipeline not found",
        404,
      );
    }

    // Entitlement gate — cohort access OR Stripe purchase
    const hasAccess = await canAccessFeature(
      guard.user.id,
      guard.user.cohort,
      "aiReport",
    );
    if (!hasAccess) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Report generation requires a purchase or invite code. Visit /pricing to get started.",
        403,
      );
    }

    // Already running / done — return current state (idempotent).
    if (
      pipeline.reportStatus === "pending" ||
      pipeline.reportStatus === "running"
    ) {
      return NextResponse.json({
        success: true,
        already: true,
        reportStatus: pipeline.reportStatus,
      });
    }
    if (pipeline.reportStatus === "done") {
      return NextResponse.json({
        success: true,
        already: true,
        reportStatus: "done",
      });
    }

    const updated = await requestReportGeneration(id);
    if (!updated) {
      // Race — another request already flipped it.
      return NextResponse.json({
        success: true,
        already: true,
        reportStatus: "pending",
      });
    }

    trackFunnelEvent("report_generation_requested", {
      userId: guard.user.id,
      metadata: { pipelineId: id, assessmentId: pipeline.assessmentId },
      idempotencyKey: `report_req:${id}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      reportStatus: updated.reportStatus,
      reportRequestedAt: updated.reportRequestedAt?.toISOString() ?? null,
    });
  },
);
