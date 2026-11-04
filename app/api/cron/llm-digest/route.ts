// ============================================================
// GET /api/cron/llm-digest — Daily LLM health digest
// Scheduled: every day at 09:30 UTC (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// What it does:
//   1. Aggregates last 24h of LLM usage by provider
//   2. Computes success rate, degraded rate, top error messages
//   3. Runs a live probe of all providers (current state)
//   4. If alert thresholds breached → Sentry critical
//   5. Reports cron health to Sentry Cron Monitor (slug: "llm-digest")
//   6. Returns full digest as JSON for caller (and Vercel cron logs)
//
// Alert thresholds:
//   - Any provider success rate < 95% AND has ≥10 calls → critical
//   - Overall degraded rate > 5% → critical
//   - Live probe overallStatus !== 'healthy' → critical
//   - Same auth error appearing ≥3 times → critical (suggests stale key)
//
// Cron self-monitoring:
//   Sentry.captureCheckIn() is called at start ("in_progress") and end
//   ("ok"/"error"). Configure a Sentry Cron Monitor with slug "llm-digest"
//   and schedule "30 9 * * *" so Sentry alerts if no check-in arrives in
//   24h+ — catching the case where the cron itself fails to fire.
//
// This is the canary for incidents like 2026-04-02 → 04-04: a 48-hour
// outage went undetected for 3 days because nobody was watching the
// degraded rate. After this cron, the same outage would surface in <24h.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";
import { getLLMHealthDigest } from "@/lib/db/llm-usage";
import { checkAllProviders } from "@/lib/ai/health-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALERT_SUCCESS_RATE_THRESHOLD = 95.0;
const ALERT_DEGRADED_RATE_THRESHOLD = 5.0;
const ALERT_MIN_CALLS_FOR_RATE_CHECK = 10;
const ALERT_REPEAT_AUTH_ERROR_THRESHOLD = 3;

/** Sentry Cron Monitor slug — must match what's configured in Sentry UI. */
const CRON_MONITOR_SLUG = "llm-digest";

export const GET = withLogging(
  "/api/cron/llm-digest",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    // Sentry Cron Monitor: report "in_progress" so Sentry knows the cron fired.
    // If we never report "ok"/"error", Sentry alerts on missed check-in.
    const checkInId = Sentry.captureCheckIn({
      monitorSlug: CRON_MONITOR_SLUG,
      status: "in_progress",
    });

    const start = Date.now();
    try {
      // Run digest aggregation and live probe in parallel — they're independent.
      const [digest, liveProbe] = await Promise.all([
        getLLMHealthDigest(24, "production"),
        checkAllProviders(),
      ]);

      const alerts: Array<{
        severity: "critical" | "warning";
        message: string;
      }> = [];

      // Check 1: per-provider success rate
      for (const p of digest.byProvider) {
        if (
          p.totalCalls >= ALERT_MIN_CALLS_FOR_RATE_CHECK &&
          p.successRate < ALERT_SUCCESS_RATE_THRESHOLD
        ) {
          alerts.push({
            severity: "critical",
            message: `LLM provider "${p.provider}" success rate ${p.successRate}% (${p.failureCount}/${p.totalCalls} failed) below ${ALERT_SUCCESS_RATE_THRESHOLD}% threshold over 24h`,
          });
        }
      }

      // Check 2: overall degraded rate
      if (digest.overallDegradedRate > ALERT_DEGRADED_RATE_THRESHOLD) {
        alerts.push({
          severity: "critical",
          message: `LLM overall degraded rate ${digest.overallDegradedRate}% (${digest.totalDegraded}/${digest.totalCalls} fell back to backup provider) above ${ALERT_DEGRADED_RATE_THRESHOLD}% threshold over 24h`,
        });
      }

      // Check 3: live probe status
      if (liveProbe.overallStatus !== "healthy") {
        const unhealthy = liveProbe.providers.filter(
          (p) => p.status !== "healthy" && p.status !== "not_configured",
        );
        alerts.push({
          severity: "critical",
          message: `LLM live probe ${liveProbe.overallStatus.toUpperCase()}: ${unhealthy
            .map((p) => `${p.provider}=${p.status}(${p.reason ?? "?"})`)
            .join(", ")}`,
        });
      }

      // Check 4: repeated auth errors (key likely revoked)
      const authErrors = digest.topErrors.filter(
        (e) =>
          e.errorMessage.includes("invalid API key") ||
          e.errorMessage.includes("401") ||
          e.errorMessage.includes("403"),
      );
      for (const e of authErrors) {
        if (e.count >= ALERT_REPEAT_AUTH_ERROR_THRESHOLD) {
          alerts.push({
            severity: "critical",
            message: `LLM auth error repeated ${e.count}× on ${e.provider}: ${e.errorMessage.slice(0, 100)} — API key likely revoked or rotated`,
          });
        }
      }

      // Fire Sentry alerts (one per alert so they can be grouped)
      for (const alert of alerts) {
        Sentry.captureMessage(alert.message, {
          level: alert.severity === "critical" ? "error" : "warning",
          tags: { source: "llm-digest", severity: alert.severity },
          extra: {
            digest,
            liveProbe,
          },
        });
      }

      const durationMs = Date.now() - start;
      console.log(
        `[cron:llm-digest] Done — ${digest.totalCalls} calls, success ${digest.overallSuccessRate}%, degraded ${digest.overallDegradedRate}%, probe ${liveProbe.overallStatus}, alerts ${alerts.length}, durationMs ${durationMs}`,
      );

      // Report cron success — even if alerts fired (job did its work).
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: CRON_MONITOR_SLUG,
        status: "ok",
        duration: durationMs / 1000,
      });

      return NextResponse.json({
        success: true,
        digest,
        liveProbe,
        alerts,
        durationMs,
      });
    } catch (err) {
      console.error("[cron:llm-digest] Failed:", err);
      Sentry.captureException(err, {
        tags: { source: "llm-digest" },
      });
      // Report cron failure so Sentry Cron Monitor flags it (separate from
      // the captureException above which goes into general error tracking).
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: CRON_MONITOR_SLUG,
        status: "error",
        duration: (Date.now() - start) / 1000,
      });
      return NextResponse.json(
        { success: false, error: "LLM digest failed" },
        { status: 500 },
      );
    }
  },
);
