import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { getProfile } from "@/lib/db/profiles";
import { getUserDataForExport } from "@/lib/db/user-data";
import { assembleExport } from "@/lib/data-export/json-resume-mapper";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

export const POST = withLogging(
  "/api/user-data/export",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const userId = guard.user!.id;

      const [profile, exportData] = await Promise.all([
        getProfile(userId),
        getUserDataForExport(userId),
      ]);

      // Log partial failures for diagnostics
      for (const source of exportData.partialFailures) {
        logApiError("/api/user-data/export", ApiErrorCode.INTERNAL_ERROR, {
          userId,
          message: `Failed to fetch ${source} rows for export`,
        });
      }

      const assembled = assembleExport({
        user: { name: guard.user!.name ?? null, email: guard.user!.email },
        profile,
        assessmentRows: exportData.assessmentRows,
        reportRows: exportData.reportRows,
        quickDiveRows: exportData.quickDiveRows,
        coachingRows: exportData.coachingRows,
      });

      // Companion social-layer data — appended outside the JSON Resume
      // canonical schema since it has no representation there. We always
      // include the section (with empty arrays + flag) so the user sees
      // exactly what we hold for them, even if they never enabled it.
      const companionSection = {
        socialEnabled: exportData.companionEnabled,
        profile: exportData.companionProfile,
        connections: exportData.companionConnectionRows,
        blocks: exportData.companionBlockRows,
        // Reports the user has filed via /api/companions/reports.
        // Reports filed AGAINST the user are admin-side audit data and
        // are intentionally NOT surfaced here.
        reportsFiled: exportData.companionReportRows,
      };

      // Surface partial failures so the client knows the export may be incomplete
      const warnings = exportData.partialFailures.map(
        (source) => `Failed to load ${source} — this section may be incomplete`,
      );
      const outputData =
        exportData.partialFailures.length > 0
          ? { ...assembled, companion: companionSection, _warnings: warnings }
          : { ...assembled, companion: companionSection };

      // Return as downloadable JSON
      return new NextResponse(JSON.stringify(outputData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="deep-dive-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    } catch (error) {
      logApiError("/api/user-data/export", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to export data",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to export data",
        500,
      );
    }
  },
);
