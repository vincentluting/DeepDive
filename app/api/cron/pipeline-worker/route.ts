// ============================================================
// GET /api/cron/pipeline-worker — Advance pending AssessmentPipeline rows
//
// Scheduled: every minute (vercel.json). Also invokable on-demand via
// POST /api/assessment/complete (kick-start without waiting for cron).
//
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Semantics: claim up to BATCH_SIZE workable rows, advance each by ONE step
// concurrently. One step per tick bounds wall-clock cost and isolates failures.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";
import { claimWorkablePipelines } from "@/lib/db/pipeline";
import { advancePipeline } from "@/lib/pipeline/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 5;

export const GET = withLogging(
  "/api/cron/pipeline-worker",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    const workerId = randomUUID();
    const start = Date.now();

    try {
      const claimed = await claimWorkablePipelines(BATCH_SIZE, workerId);

      if (claimed.length === 0) {
        return NextResponse.json({
          success: true,
          workerId,
          claimed: 0,
          durationMs: Date.now() - start,
        });
      }

      // Advance each claimed row concurrently. advancePipeline never rejects
      // (errors are captured internally), but allSettled guards against
      // unexpected bugs in one pipeline dragging down the others.
      const settled = await Promise.allSettled(
        claimed.map(({ row }) => advancePipeline(row, workerId)),
      );

      const outcomes = settled.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        console.error(
          "[cron:pipeline-worker] unexpected advancePipeline rejection:",
          r.reason,
        );
        return {
          pipelineId: claimed[i].row.id,
          step: "none" as const,
          result: "failed" as const,
          error:
            r.reason instanceof Error ? r.reason.message : String(r.reason),
        };
      });

      const summary = {
        done: outcomes.filter((o) => o.result === "done").length,
        retry: outcomes.filter((o) => o.result === "retry").length,
        failed: outcomes.filter((o) => o.result === "failed").length,
        skipped: outcomes.filter((o) => o.result === "skipped").length,
        deferred: outcomes.filter((o) => o.result === "deferred").length,
      };

      return NextResponse.json({
        success: true,
        workerId,
        claimed: claimed.length,
        summary,
        outcomes,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      console.error("[cron:pipeline-worker] Fatal error:", err);
      return NextResponse.json(
        {
          success: false,
          workerId,
          error: err instanceof Error ? err.message : "unknown",
          durationMs: Date.now() - start,
        },
        { status: 500 },
      );
    }
  },
);
