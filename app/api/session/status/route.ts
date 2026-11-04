// ============================================================
// GET /api/session/status?id=<sessionId> — Check session status in DB
// Returns: { status: 'active' | 'completed' | 'abandoned' | 'not_found' }
// Lightweight endpoint for client-side session restore validation
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";
import { sql } from "@/lib/db/connection";

export const GET = withLogging(
  "/api/session/status",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "read" });
    if (guard.blocked) return guard.response;

    const sessionId = request.nextUrl.searchParams.get("id");
    if (!sessionId) {
      return NextResponse.json({ status: "not_found" });
    }

    const userId = guard.user?.id ?? null;

    try {
      // Only allow checking sessions that belong to the current user or are unowned
      const rows = await sql`
      SELECT "status" FROM "QuestionnaireSession"
      WHERE "id" = ${sessionId}
        AND ("userId" IS NULL OR "userId" = ${userId})
    `;

      if (rows.length === 0) {
        return NextResponse.json({ status: "not_found" });
      }

      return NextResponse.json({ status: rows[0].status ?? "active" });
    } catch (error) {
      logApiError("/api/session/status", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to check session status",
        cause: error,
      });
      return NextResponse.json({ status: "not_found" }, { status: 500 });
    }
  },
);
