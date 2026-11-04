import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  getDeepDiveExportData,
  getDeepDiveExportCount,
  DEEP_DIVE_CSV_HEADERS,
  type DeepDiveExportRecord,
  type DeepDiveExportFilters,
} from "@/lib/db/admin";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { escapeCsvField } from "@/lib/api/csv";

function rowToCSVLine(row: DeepDiveExportRecord): string {
  return DEEP_DIVE_CSV_HEADERS.map((key) => escapeCsvField(row[key])).join(",");
}

function buildCSV(rows: DeepDiveExportRecord[]): string {
  const header = DEEP_DIVE_CSV_HEADERS.join(",");
  const lines = rows.map(rowToCSVLine);
  return [header, ...lines].join("\r\n");
}

export const GET = withLogging(
  "/api/admin/research-export/deep-dive",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);
      const countOnly = searchParams.get("countOnly") === "true";
      const from = searchParams.get("from") || undefined;
      const to = searchParams.get("to") || undefined;
      if (from && isNaN(Date.parse(from))) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Invalid 'from' date",
          400,
        );
      }
      if (to && isNaN(Date.parse(to))) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Invalid 'to' date",
          400,
        );
      }
      const limitParam = searchParams.get("limit");
      const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
      const limit = Number.isFinite(parsedLimit) ? parsedLimit : 10000;

      const filters: DeepDiveExportFilters = { from, to, limit };

      if (countOnly) {
        const count = await getDeepDiveExportCount(filters);
        return NextResponse.json({ count });
      }

      const rows = await getDeepDiveExportData(filters);
      const csv = buildCSV(rows);

      const today = new Date().toISOString().split("T")[0];
      const filename = `deepdive-item-level-${today}-UTC.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      logApiError(
        "/api/admin/research-export/deep-dive",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to generate deep dive export",
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
