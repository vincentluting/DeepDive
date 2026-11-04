// ============================================================
// GET /api/cron/job-worker — Drain generic DurableJob queue
//
// Scheduled: every minute (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";
import { getDurableJobHealth } from "@/lib/db/durable-jobs";
import { runDueJobs } from "@/lib/jobs/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 10;

export const GET = withLogging(
  "/api/cron/job-worker",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    try {
      const result = await runDueJobs({ limit: BATCH_SIZE });
      const health = await getDurableJobHealth();

      return NextResponse.json({
        success: true,
        ...result,
        health,
      });
    } catch (err) {
      console.error("[cron:job-worker] Fatal error:", err);
      return NextResponse.json(
        {
          success: false,
          error: err instanceof Error ? err.message : "unknown",
        },
        { status: 500 },
      );
    }
  },
);
