// ============================================================
// GET /api/cron/process-deletion-requests — Execute due GDPR deletions
// Scheduled: daily at 03:30 UTC (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Hard-deletes users whose scheduledDeletionAt has passed (and that
// have not been cancelled / already executed) via the shared
// hardDeleteUser pipeline. Delegates to processDeletionQueue so the
// same logic is used by the CLI (scripts/process-deletion-requests.ts).
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";
import { processDeletionQueue } from "@/lib/db/user-deletion-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withLogging(
  "/api/cron/process-deletion-requests",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    const start = Date.now();
    try {
      const result = await processDeletionQueue();
      const durationMs = Date.now() - start;
      console.log(
        `[cron:process-deletion-requests] total=${result.total} ok=${result.succeeded} failed=${result.failed} durationMs=${durationMs}`,
      ); // intentional

      return NextResponse.json({
        success: result.failed === 0,
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        failures: result.failures,
        durationMs,
      });
    } catch (error) {
      console.error("[cron:process-deletion-requests] Failed:", error); // intentional
      return NextResponse.json(
        { error: "Failed to process deletion queue" },
        { status: 500 },
      );
    }
  },
);
