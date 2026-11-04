// ============================================================
// GET /api/health/db — Database migration drift health check
//
// Reports whether every migration file in scripts/migrations/ has been
// applied to this database. Catches the failure mode where a migration
// is committed (schema.sql + code updated) but never reaches the live
// DB — which otherwise surfaces to users as an opaque runtime 500.
//
// Auth model (mirrors /api/health/llm):
//   - Requires `Authorization: Bearer ${HEALTH_CHECK_SECRET}`
//   - Falls back to CRON_SECRET if HEALTH_CHECK_SECRET is unset
//   - 401 if neither is configured (fail-closed)
//
// HTTP status:
//   200 — no drift (all migrations applied)
//   503 — drift detected (pending migrations listed in body)
//   500 — could not determine status (e.g. _migrations table missing)
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { withLogging } from "@/lib/api/with-logging";
import { getMigrationDriftStatus } from "@/lib/db/migration-status";

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
  "/api/health/db",
  async (request: NextRequest) => {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      const drift = await getMigrationDriftStatus();
      return NextResponse.json(
        {
          status: drift.pendingCount === 0 ? "healthy" : "drift",
          ...drift,
          checkedAt: new Date().toISOString(),
        },
        {
          status: drift.pendingCount === 0 ? 200 : 503,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  },
);
