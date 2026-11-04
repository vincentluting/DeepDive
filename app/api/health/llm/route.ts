// ============================================================
// GET /api/health/llm — LLM provider health check endpoint
//
// Returns the live status of every configured LLM provider by running
// a minimal probe (5-token completion) against each one in parallel.
//
// Auth model:
//   - Default: requires `Authorization: Bearer ${HEALTH_CHECK_SECRET}`
//   - If HEALTH_CHECK_SECRET is unset, falls back to CRON_SECRET
//   - Returns 401 if neither is configured (fail-closed by design)
//
// Recommended monitoring setup:
//   - External monitor (UptimeRobot / Vercel cron / GitHub Actions) hits
//     this every 15 minutes with the auth header
//   - Alert on overallStatus !== 'healthy' for >2 consecutive probes
//
// Response shape: see lib/ai/health-check.ts (LLMHealthReport)
// HTTP status:
//   200 — overall healthy
//   207 — overall degraded (some providers healthy, some not)
//   503 — overall unhealthy (no provider healthy)
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { checkAllProviders } from "@/lib/ai/health-check";
import {
  peekHealthSnapshot,
  getHealthRoutingConfig,
  isHealthRoutingEnabled,
} from "@/lib/ai/provider-health";
import { withLogging } from "@/lib/api/with-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Validate Bearer token. Accepts HEALTH_CHECK_SECRET, falls back to CRON_SECRET. */
function isAuthorized(request: NextRequest): boolean {
  const expectedSecret =
    process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET;
  if (!expectedSecret) return false;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return safeCompare(authHeader, `Bearer ${expectedSecret}`);
}

export const GET = withLogging(
  "/api/health/llm",
  async (request: NextRequest) => {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Probe providers live AND peek the routing-health DB view in
    // parallel. peekHealthSnapshot is a read-only path that does NOT
    // touch the module cache used by selectHealthiest — so a diagnostic
    // probe can never poison real routing decisions during a transient
    // DB hiccup. It also has its own 3s timeout so a slow Neon query
    // cannot drag down the overall LLM health endpoint.
    const [report, peek] = await Promise.all([
      checkAllProviders(),
      peekHealthSnapshot(),
    ]);

    report.routingHealth = {
      enabled: isHealthRoutingEnabled(),
      config: getHealthRoutingConfig(),
      snapshots: peek.snapshots,
      stale: peek.stale,
      stalenessReason: peek.error,
    };

    // HTTP status mirrors overall health so monitoring tools can alert on
    // status code alone without parsing the body.
    const httpStatus =
      report.overallStatus === "healthy"
        ? 200
        : report.overallStatus === "degraded"
          ? 207
          : 503;

    return NextResponse.json(report, {
      status: httpStatus,
      headers: { "Cache-Control": "no-store" },
    });
  },
);
