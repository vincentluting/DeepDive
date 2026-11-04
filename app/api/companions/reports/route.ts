// ============================================================
// /api/companions/reports — Trust & Safety report queue
//
// POST  — file a report against another Companion user. Reports flow
//         into /admin/companion-reports for human triage. v1 has no
//         automated moderation.
// GET   — admin-only: list open reports oldest-first.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { companionReportSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import { createReport, listOpenReports } from "@/lib/db/companions";
import { sql } from "@/lib/db/connection";

export const POST = withLogging(
  "/api/companions/reports",
  async (request: NextRequest) => {
    try {
      // Safety endpoint — let the user file a report even after they
      // disable Companion. Forcing them to re-enable to seek redress
      // would be an unsafe recovery path.
      const gate = await gateCompanionRequest(request, {
        tier: "write",
        skipSocialEnabledCheck: true,
      });
      if (!gate.ok) return gate.response;

      const parsed = await parseBody(request, companionReportSchema);
      if ("error" in parsed) return parsed.error;
      const { reportedId, reason, details } = parsed.data;

      if (reportedId === gate.userId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "You cannot report yourself.",
          400,
        );
      }

      // Verify the reported user exists. We don't gate on their cohort
      // or socialEnabled state — even an inactive user should be reportable
      // (e.g. they disabled Companion after sending an inappropriate message).
      const exists = (await sql`
        SELECT 1 FROM "User" WHERE "id" = ${reportedId} LIMIT 1
      `) as unknown as Array<unknown>;
      if (exists.length === 0) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Reported user not found.",
          404,
        );
      }

      const report = await createReport({
        reporterId: gate.userId,
        reportedId,
        reason,
        details: details ?? null,
      });

      return NextResponse.json({ ok: true, report });
    } catch (err) {
      logApiError("/api/companions/reports", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to create report",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to file report. Please try again.",
        500,
      );
    }
  },
);

export const GET = withLogging(
  "/api/companions/reports",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "admin",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;
      if (!guard.user?.isAdmin) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Admin access required.",
          403,
        );
      }

      const reports = await listOpenReports();
      return NextResponse.json({ ok: true, reports });
    } catch (err) {
      logApiError("/api/companions/reports", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to list reports",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load reports. Please try again.",
        500,
      );
    }
  },
);
