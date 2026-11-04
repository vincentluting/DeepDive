// ============================================================
// Authoritative Report Resolver
//
// Resolves the report id the current request should operate on, surviving
// stale `UserContext.latestReportId` (which is a cached projection updated
// out-of-band by the assessment pipeline).
//
// Resolution order:
//   1. URL `reportId` query param (only if ownership verified — defends
//      against enumeration attacks)
//   2. `UserContext.latestReportId` (fast path)
//   3. Fallback: if FSM says report should exist but ctx is empty, query
//      the authoritative DB for the latest report. Covers cache lag and
//      cross-tab races where tab A just generated and tab B is stale.
//   4. null — no report, gate the user.
// ============================================================

import {
  checkReportOwnership,
  getLatestReportIdForUser,
} from "@/lib/db/reports";
import { hasReached, type JourneyState } from "./state-machine";

export interface ResolveReportIdInput {
  readonly userId: string;
  readonly reportIdParam?: string;
  readonly latestReportIdFromContext: string | null;
  readonly journeyState: JourneyState;
}

export interface ResolveReportIdResult {
  /** The resolved report id, or null when the user genuinely has no report. */
  readonly reportId: string | null;
  /** How the id was resolved — useful for telemetry and debugging. */
  readonly source: "url_param" | "context" | "db_recovery" | "none";
}

export async function resolveReportId(
  input: ResolveReportIdInput,
): Promise<ResolveReportIdResult> {
  const { userId, reportIdParam, latestReportIdFromContext, journeyState } =
    input;

  // 1. URL param — must verify ownership before trusting it.
  if (reportIdParam) {
    const owned = await checkReportOwnership(reportIdParam, userId).catch(
      () => false,
    );
    if (owned) {
      return { reportId: reportIdParam, source: "url_param" };
    }
    // Fall through — invalid/foreign reportId in URL is treated as "no hint".
    // Do not throw or expose the failure (anti-enumeration).
  }

  // 2. UserContext fast path — verify the cached id still resolves to a row
  // the user owns. UserContext is per-user (so ownership is implicit), but
  // the report could have been deleted by admin tools / GDPR purge while the
  // cache still pointed at it. Without this check the consumer would treat
  // a deleted report as live and crash on the next DB read.
  if (latestReportIdFromContext) {
    const stillOwned = await checkReportOwnership(
      latestReportIdFromContext,
      userId,
    ).catch(() => false);
    if (stillOwned) {
      return { reportId: latestReportIdFromContext, source: "context" };
    }
    // Stale cache — fall through to authoritative DB recovery below.
  }

  // 3. DB recovery — only when FSM says we *should* have a report.
  // This catches stale UserContext after a freshly-generated report on
  // another tab/request, and assessment-pipeline cache-write lag.
  if (hasReached(journeyState, "report_generated")) {
    const dbId = await getLatestReportIdForUser(userId).catch(() => null);
    if (dbId) {
      // Best-effort observability — don't block the request.
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.addBreadcrumb({
          category: "journey",
          level: "info",
          message: "resolveReportId recovered stale UserContext",
          data: { userId, journeyState },
        });
      } catch {
        // Sentry absent — non-fatal.
      }
      return { reportId: dbId, source: "db_recovery" };
    }
  }

  // 4. No report.
  return { reportId: null, source: "none" };
}
