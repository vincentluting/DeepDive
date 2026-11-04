// ============================================================
// GET /api/admin/analytics — Page visit analytics for admin panel
// Returns visit overview, trends, top pages, referrers, etc.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { adminAnalyticsCleanupSchema } from "@/lib/validation/api-schemas";
import {
  getVisitOverview,
  getVisitTrend,
  getRecentVisitors,
  getTopPages,
  getTopReferrers,
  getSuspiciousActivity,
  getVisitsByCountry,
  getVisitorJourney,
  getTopCampaigns,
  cleanupOldVisits,
  backfillInternalTraffic,
  backfillOwnerTraffic,
  getCountryInsight,
  scanNotableVisitors,
} from "@/lib/db/analytics-visits";
import { sql } from "@/lib/db/connection";
import { refreshMaterializedViews } from "@/lib/db/analytics-materialized";
import {
  getReactionDistribution,
  getNPSDistribution,
  getArchetypeDistribution,
  getQuestionnaireStats,
  getGeographyDistribution,
  getLanguageDistribution,
  getDropoffDistribution,
  getPrePostPairedData,
  getCompletionTimeDistribution,
  getReportEngagementStats,
  getCoachingDepthStats,
  getResearchGroupComparison,
} from "@/lib/db/admin-insights";
import { getAnalyticsHealth } from "@/lib/analytics/errors";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/analytics",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);

      // Journey drill-down: ?journey=<ipHash>
      const journeyHash = searchParams.get("journey");
      if (journeyHash) {
        const journey = await getVisitorJourney(journeyHash.slice(0, 64));
        return NextResponse.json({ journey });
      }

      const rawDays = parseInt(searchParams.get("days") || "30", 10);
      const days = isNaN(rawDays) ? 30 : Math.min(365, Math.max(1, rawDays));
      const filterReal = searchParams.get("filter") === "real";
      const countryFilter = searchParams.get("country") || "";
      const section = searchParams.get("section") || "";

      // Analytics health section (loaded on-demand)
      if (section === "health") {
        const health = await getAnalyticsHealth();
        return NextResponse.json({ health });
      }

      // Thesis-specific data section (loaded on-demand)
      if (section === "thesis") {
        const [
          prePostPaired,
          completionTime,
          reportEngagement,
          coachingDepth,
          researchGroups,
          dropoff,
        ] = await Promise.all([
          getPrePostPairedData(),
          // Thesis charts: restrict timing stats to the canonical research
          // population (research users carry extra T0/T1/T2 survey burden)
          getCompletionTimeDistribution({ researchOnly: true }),
          // Thesis page: scope engagement/coaching/dropoff to the canonical
          // research population, consistent with completionTime + researchGroups
          // above (admin-metrics.md §1.1). #088
          getReportEngagementStats({ researchOnly: true }),
          getCoachingDepthStats({ researchOnly: true }),
          getResearchGroupComparison(),
          getDropoffDistribution(days, { researchOnly: true }),
        ]);

        return NextResponse.json({
          prePostPaired,
          completionTime,
          reportEngagement,
          coachingDepth,
          researchGroups,
          dropoff,
        });
      }

      // Manual cron trigger section (admin-only)
      if (section === "run-cron") {
        const job = searchParams.get("job");
        const cronStart = Date.now();

        if (job === "scan-notable") {
          const newCount = await scanNotableVisitors();
          return NextResponse.json({
            success: true,
            job,
            newCount,
            durationMs: Date.now() - cronStart,
          });
        }

        if (job === "refresh-analytics") {
          const result = await refreshMaterializedViews();
          return NextResponse.json({
            success: true,
            job,
            views: result.views,
            durationMs: Date.now() - cronStart,
          });
        }

        if (job === "cleanup-old-data") {
          const pageVisits = await cleanupOldVisits(180);
          const errorsResult = await sql`
          DELETE FROM "AnalyticsError"
          WHERE "createdAt" < NOW() - INTERVAL '30 days'
        `;
          const errors =
            (errorsResult as unknown as { count?: number }).count ?? 0;
          const notableResult = await sql`
          DELETE FROM "NotableVisitor"
          WHERE "dismissed" = TRUE
            AND "expiresAt" < NOW() - INTERVAL '90 days'
        `;
          const notable =
            (notableResult as unknown as { count?: number }).count ?? 0;
          return NextResponse.json({
            success: true,
            job,
            deletedCounts: { pageVisits, errors, notable },
            durationMs: Date.now() - cronStart,
          });
        }

        return NextResponse.json(
          { error: `Unknown job: ${job}` },
          { status: 400 },
        );
      }

      // Load excluded IP hashes from env for owner traffic filtering
      const excludedIpHashes = filterReal
        ? (process.env.EXCLUDED_IP_HASHES || "").split(",").filter(Boolean)
        : [];

      const [
        overview,
        trend,
        recentVisitors,
        topPages,
        topReferrers,
        suspicious,
        byCountry,
        reactions,
        nps,
        archetypes,
        questionnaireStats,
        campaigns,
        registrationGeo,
        languageDistribution,
        dropoff,
      ] = await Promise.all([
        getVisitOverview(days, excludedIpHashes),
        getVisitTrend(days, excludedIpHashes),
        getRecentVisitors(
          countryFilter ? 100 : 50,
          filterReal,
          countryFilter,
          excludedIpHashes,
        ),
        getTopPages(days, 10),
        getTopReferrers(days, 10),
        getSuspiciousActivity(1),
        getVisitsByCountry(days),
        getReactionDistribution(),
        getNPSDistribution(),
        getArchetypeDistribution(),
        getQuestionnaireStats(days),
        getTopCampaigns(days),
        getGeographyDistribution(),
        getLanguageDistribution(),
        getDropoffDistribution(days),
      ]);

      let countryInsight = null;
      if (countryFilter) {
        countryInsight = await getCountryInsight(countryFilter, days);
      }

      return NextResponse.json(
        {
          overview,
          trend,
          recentVisitors,
          topPages,
          topReferrers,
          suspicious,
          byCountry,
          reactions,
          nps,
          archetypes,
          questionnaireStats,
          campaigns,
          countryInsight,
          registrationGeo,
          languageDistribution,
          dropoff,
          days,
        },
        {
          headers: { "Cache-Control": "private, max-age=300" },
        },
      );
    } catch (error) {
      logApiError("/api/admin/analytics", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch analytics data",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);

/**
 * POST /api/admin/analytics — Trigger data cleanup or backfill
 * Body: { action: "cleanup" | "backfill-internal", retentionDays?: number }
 */
export const POST = withLogging(
  "/api/admin/analytics",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const parsed = await parseBody(request, adminAnalyticsCleanupSchema);
      if ("error" in parsed) return parsed.error;

      if (parsed.data.action === "cleanup") {
        const retentionDays = Math.max(
          7,
          typeof parsed.data.retentionDays === "number"
            ? parsed.data.retentionDays
            : 90,
        );
        const deleted = await cleanupOldVisits(retentionDays);
        return NextResponse.json({ success: true, deletedRows: deleted });
      }

      if (parsed.data.action === "backfill-internal") {
        const updated = await backfillInternalTraffic();
        return NextResponse.json({ success: true, updatedRows: updated });
      }

      if (parsed.data.action === "backfill-owner") {
        const updated = await backfillOwnerTraffic();
        return NextResponse.json({ success: true, updatedRows: updated });
      }

      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Unknown action",
        400,
      );
    } catch (error) {
      logApiError("/api/admin/analytics", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to process analytics action",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
