import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { getReportsByUserId } from "@/lib/db/reports";
import { sql } from "@/lib/db/connection";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";
import { parseBody } from "@/lib/validation/parse-body";
import { adminDeleteReportSchema } from "@/lib/validation/api-schemas";

export const GET = withLogging(
  "/api/admin/users/[userId]/reports",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, { tier: "admin" });
      if (guard.blocked) return guard.response;

      const { userId } = await context.params;

      const [careerReports, quickDiveResults] = await Promise.all([
        getReportsByUserId(userId),
        sql`
        SELECT "id", "archetypeCode", "archetypeLabel", "exploreMode", "createdAt"
        FROM "QuickDiveResult"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `,
      ]);

      const formattedReports = careerReports.map((r) => {
        let archetypeLabel: string | null = null;
        try {
          const json =
            typeof r.reportJson === "string"
              ? JSON.parse(r.reportJson as string)
              : r.reportJson;

          if (json?.archetype_synthesis?.archetypes?.[0]?.archetype_name) {
            archetypeLabel =
              json.archetype_synthesis.archetypes[0].archetype_name;
          } else if (json?.archetype_label) {
            archetypeLabel = json.archetype_label;
          } else if (typeof json?.archetype === "string") {
            archetypeLabel = json.archetype;
          }
        } catch {
          // Skip parse errors
        }

        // Migration 094: surface quality + provider provenance so admin can
        // spot reports that fell back / used non-primary models. Providers
        // = distinct list of unique providers used across all LLM sections.
        const providers = r.llmProviderMap
          ? Array.from(
              new Set(Object.values(r.llmProviderMap).map((p) => p.provider)),
            ).sort()
          : null;

        return {
          id: r.id,
          type: "deep_dive" as const,
          createdAt: r.createdAt,
          version: r.version || null,
          archetypeLabel,
          exploreMode: null,
          qualityScore: r.qualityScore,
          degradedSections: r.degradedSections,
          providers,
          llmProviderMap: r.llmProviderMap,
        };
      });

      const formattedQuickDives = quickDiveResults.map((r) => ({
        id: r.id as string,
        type: (isImmersiveExploreMode(r.exploreMode as string)
          ? "immersive_dive"
          : "quick_dive") as "quick_dive" | "immersive_dive",
        createdAt: r.createdAt as string,
        version: null,
        archetypeLabel: `${r.archetypeCode} · ${r.archetypeLabel}`,
        exploreMode: r.exploreMode as string,
      }));

      // Merge and sort by date descending
      const all = [...formattedReports, ...formattedQuickDives].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return NextResponse.json({ reports: all });
    } catch (error) {
      logApiError(
        "/api/admin/users/[userId]/reports",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to fetch user reports",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);

export const DELETE = withLogging(
  "/api/admin/users/[userId]/reports",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, { tier: "admin" });
      if (guard.blocked) return guard.response;

      const { userId } = await context.params;
      const parsed = await parseBody(request, adminDeleteReportSchema);
      if ("error" in parsed) return parsed.error;

      const { reportId, reportType } = parsed.data;

      if (reportType === "deep_dive") {
        // Delete cascade: ReportReaction, ReportNPS, ReportEngagement
        const result = await sql`
          DELETE FROM "CareerReport"
          WHERE "id" = ${reportId} AND "userId" = ${userId}
          RETURNING "id"
        `;
        if (result.length === 0) {
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Report not found",
            404,
          );
        }
      } else {
        // quick_dive or immersive_dive
        const result = await sql`
          DELETE FROM "QuickDiveResult"
          WHERE "id" = ${reportId} AND "userId" = ${userId}
          RETURNING "id"
        `;
        if (result.length === 0) {
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Report not found",
            404,
          );
        }
      }

      return NextResponse.json({ deleted: reportId });
    } catch (error) {
      logApiError(
        "/api/admin/users/[userId]/reports",
        ApiErrorCode.INTERNAL_ERROR,
        { message: "Failed to delete report", cause: error },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
