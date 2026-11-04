// ============================================================
// POST /api/pipeline/[id]/retry — user-triggered "try again" for failed pipelines
//
// Why this exists:
// Before 2026-05, the /processing page's "刷新/Refresh" button was a
// `window.location.reload()` — a UX trap. Once a pipeline hit
// retryCount=5, the cron worker stopped claiming it (SQL filter
// `retryCount < MAX_PIPELINE_RETRIES`), and reload only re-polled the
// same dead state. Users stayed stuck indefinitely (assessment
// 377de626-..., 2026-05-09 → 05-10 ~33h).
//
// This endpoint gives the UI a real button: it atomically resets the
// pipeline back to 'pending' so the next cron tick (max ~60s away)
// re-runs the failed step with a fresh retry budget. Pairs with
// changes A (validation error class — fails fast in 2 retries instead
// of 5) and D (Sentry observability) so a "doomed" pipeline at least
// surfaces in Sentry before we burn another retry cycle.
//
// Idempotency / safety:
//   - Ownership check: pipeline.userId === guard.user.id (404 mask)
//   - Status gate: only resets if pipeline.status === 'failed'
//   - Rate limit: 60s since last updatedAt (enforced in SQL)
//   - Reset 0 → no Sentry-worthy spam, returns 200 with `already: true`
//
// History: see plan /Users/l/.claude/plans/parallel-shimmying-dragonfly.md
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import { getPipeline, resetFailedPipeline } from "@/lib/db/pipeline";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withLogging(
  "/api/pipeline/[id]/retry",
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

    // Ownership check: conflate "not found" and "not yours" into 404 to
    // prevent pipelineId enumeration via 404 vs 403 timing.
    const pipeline = await getPipeline(id);
    if (!pipeline || pipeline.userId !== guard.user?.id) {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Pipeline not found",
        404,
      );
    }

    // Only act on 'failed' state. Pending/running/auto_done/completed are
    // either healthy or actively being worked on by the cron worker —
    // resetting them would race with the worker and could leave inconsistent
    // step statuses.
    if (pipeline.status !== "failed") {
      return NextResponse.json({
        success: true,
        already: true,
        status: pipeline.status,
        message: "Pipeline is not in failed state; no reset performed.",
      });
    }

    const updated = await resetFailedPipeline(id);
    if (!updated) {
      // Either lost the status='failed' race or hit the 60s rate limit.
      const fresh = await getPipeline(id);
      const isRateLimited =
        fresh?.status === "failed" &&
        fresh.updatedAt.getTime() > Date.now() - 60_000;
      if (isRateLimited) {
        return createErrorResponse(
          ApiErrorCode.RATE_LIMITED,
          "Please wait a moment before retrying again.",
          429,
        );
      }
      return NextResponse.json({
        success: true,
        already: true,
        status: fresh?.status ?? "unknown",
      });
    }

    trackFunnelEvent("pipeline_retry_requested", {
      userId: guard.user.id,
      metadata: {
        pipelineId: id,
        assessmentId: pipeline.assessmentId,
        priorRetryCount: pipeline.retryCount,
        priorError: pipeline.lastStepError?.slice(0, 200) ?? null,
      },
      idempotencyKey: `pipeline_retry:${id}:${pipeline.updatedAt.toISOString()}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      status: updated.status,
      narrativesStatus: updated.narrativesStatus,
      reportStatus: updated.reportStatus,
      retryCount: updated.retryCount,
    });
  },
);
