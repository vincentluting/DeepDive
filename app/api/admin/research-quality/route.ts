// ============================================================
// GET /api/admin/research-quality — Thesis data-quality report
//
// Web version of `npm run verify:thesis` (research chain section):
// shares the EXACT validation rules via lib/research/thesis-validation,
// plus multi-record timepoint warnings from the canonical pairing module.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  validateResearchChain,
  computeResearchSummary,
} from "@/lib/research/thesis-validation";
import { getResearchChainRows } from "@/lib/db/research-data-quality";
import { getMultiRecordUsers } from "@/lib/db/research-metrics";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

export const GET = withLogging(
  "/api/admin/research-quality",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const [chainRows, multiRecordUsers] = await Promise.all([
        getResearchChainRows(),
        getMultiRecordUsers(),
      ]);

      const now = Date.now();
      const issues = chainRows.flatMap((row) =>
        validateResearchChain(row, now),
      );
      const summary = computeResearchSummary(chainRows, now);

      // Map multi-record userIds to emails for the admin table
      const emailByUserId = new Map(
        chainRows.map((r) => [r.userId, r.email] as const),
      );

      return NextResponse.json({
        summary,
        issues,
        multiRecordUsers: multiRecordUsers.map((m) => ({
          ...m,
          email: emailByUserId.get(m.userId) || "",
        })),
        errorCount: issues.filter((i) => i.severity === "error").length,
        warningCount: issues.filter((i) => i.severity === "warning").length,
        infoCount: issues.filter((i) => i.severity === "info").length,
        generatedAt: new Date(now).toISOString(),
      });
    } catch (error) {
      logApiError("/api/admin/research-quality", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to compute research data quality",
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
