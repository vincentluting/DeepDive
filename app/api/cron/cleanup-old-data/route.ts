// ============================================================
// GET /api/cron/cleanup-old-data — Prune stale rows + capacity check
// Scheduled: daily at 03:00 UTC (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Steps (sequential):
//   1. cleanupOldVisits(180)           → delete PageVisit > 180 days
//   2. DELETE AnalyticsError > 30 days
//   3. DELETE dismissed NotableVisitor expired > 90 days
//   4. DELETE expired UserSession > 30 days past expiry
//   5. DELETE LLMUsageLog > 90 days  (added 2026-05-18: thesis recruitment
//      will fill this table fast; without TTL Neon free 0.5GB ceiling hits
//      within weeks and inserts start failing → lost research data)
//   6. Sweep orphan rows (L3 safety net for E2E test data leaks)
//   7. SELECT pg_database_size — Sentry warn at 80% of Neon free ceiling
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";
import { cleanupOldVisits } from "@/lib/db/analytics-visits";
import { logAnalyticsError } from "@/lib/analytics/errors";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Neon free tier ceiling per project. Warn at 80% so we have a runway
// before INSERTs start failing mid-collection.
const NEON_FREE_BYTES = 500 * 1024 * 1024; // 0.5 GB
const CAPACITY_WARN_THRESHOLD = 0.8;

export const GET = withLogging(
  "/api/cron/cleanup-old-data",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    const start = Date.now();
    try {
      console.log("[cron:cleanup-old-data] Starting cleanup"); // intentional

      // Step 1: Delete PageVisit records older than 180 days
      const pageVisits = await cleanupOldVisits(180);

      // Step 2: Delete AnalyticsError records older than 30 days
      const errorsResult = await sql`
      DELETE FROM "AnalyticsError"
      WHERE "createdAt" < NOW() - INTERVAL '30 days'
    `;
      const errors = (errorsResult as unknown as { count?: number }).count ?? 0;

      // Step 3: Delete dismissed NotableVisitor records expired > 90 days ago
      const notableResult = await sql`
      DELETE FROM "NotableVisitor"
      WHERE "dismissed" = TRUE
        AND "expiresAt" < NOW() - INTERVAL '90 days'
    `;
      const notable =
        (notableResult as unknown as { count?: number }).count ?? 0;

      // Step 4: Delete expired UserSession records (past expiry by 30+ days)
      const sessionsResult = await sql`
      DELETE FROM "UserSession"
      WHERE "expiresAt" < NOW() - INTERVAL '30 days'
    `;
      const sessions =
        (sessionsResult as unknown as { count?: number }).count ?? 0;

      // Step 5: Delete LLMUsageLog rows older than 90 days
      const llmResult = await sql`
      DELETE FROM "LLMUsageLog"
      WHERE "createdAt" < NOW() - INTERVAL '90 days'
    `;
      const llmUsage = (llmResult as unknown as { count?: number }).count ?? 0;

      // Step 6: L3 safety net — sweep orphan rows left by E2E test data leaks
      // These are rows where userId was SET NULL after test user deletion
      const orphanResults = await Promise.all([
        sql`DELETE FROM "CareerReport" WHERE "userId" IS NULL`,
        sql`DELETE FROM "PersonalProfile" WHERE "userId" IS NULL`,
        sql`DELETE FROM "AssessmentResult" WHERE "userId" IS NULL`,
        sql`DELETE FROM "QuestionnaireSession" WHERE "userId" IS NULL`,
        sql`DELETE FROM "QuickDiveResult" WHERE "userId" IS NULL AND "anonymousId" IS NULL`,
        sql`DELETE FROM "RealConditions" WHERE "userId" IS NULL`,
        sql`DELETE FROM "ReportEngagement" WHERE "userId" IS NULL`,
        sql`DELETE FROM "UserFunnel" WHERE "userId" IS NULL AND "clientId" IS NULL`,
      ]);
      const orphanTotal = orphanResults.reduce(
        (sum, r) => sum + ((r as unknown as { count?: number }).count ?? 0),
        0,
      );

      // Step 7: Capacity check — Sentry warn before the Neon ceiling halts us.
      // Failures here must not block the cron (cleanup ran successfully) —
      // capture and continue.
      let dbSizeBytes: number | null = null;
      let dbSizeRatio: number | null = null;
      try {
        const sizeRows = (await sql`
        SELECT pg_database_size(current_database()) AS bytes
      `) as Array<{ bytes: string | number }>;
        const raw = sizeRows[0]?.bytes;
        dbSizeBytes =
          typeof raw === "string" ? Number.parseInt(raw, 10) : (raw ?? null);
        if (dbSizeBytes && Number.isFinite(dbSizeBytes)) {
          dbSizeRatio = dbSizeBytes / NEON_FREE_BYTES;
          if (dbSizeRatio >= CAPACITY_WARN_THRESHOLD) {
            try {
              const Sentry = await import("@sentry/nextjs");
              Sentry.captureMessage(
                `Neon DB size ${(dbSizeRatio * 100).toFixed(1)}% of free-tier ceiling`,
                {
                  level: dbSizeRatio >= 0.95 ? "error" : "warning",
                  tags: { cron: "cleanup-old-data", check: "db-capacity" },
                  extra: {
                    dbSizeBytes,
                    ceilingBytes: NEON_FREE_BYTES,
                    ratio: dbSizeRatio,
                  },
                },
              );
            } catch {
              // Sentry unavailable — non-fatal.
            }
          }
        }
      } catch (sizeErr) {
        // pg_database_size may be restricted on some plans; don't fail the
        // whole cron over a missing capacity signal.
        console.error("[cron:cleanup-old-data] capacity check failed", sizeErr);
      }

      const durationMs = Date.now() - start;
      console.log(
        // intentional
        `[cron:cleanup-old-data] Done — pageVisits=${pageVisits} errors=${errors} notable=${notable} sessions=${sessions} llmUsage=${llmUsage} orphans=${orphanTotal} dbSizeBytes=${dbSizeBytes} dbSizeRatio=${dbSizeRatio?.toFixed(3)} durationMs=${durationMs}`,
      );

      return NextResponse.json({
        success: true,
        deletedCounts: {
          pageVisits,
          errors,
          notable,
          sessions,
          llmUsage,
          orphans: orphanTotal,
        },
        capacity: {
          dbSizeBytes,
          ceilingBytes: NEON_FREE_BYTES,
          ratio: dbSizeRatio,
        },
        durationMs,
      });
    } catch (err) {
      await logAnalyticsError("cron", "cleanup-old-data", err);
      return NextResponse.json(
        { success: false, error: "Cleanup job failed" },
        { status: 500 },
      );
    }
  },
);
