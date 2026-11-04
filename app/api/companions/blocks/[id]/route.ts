// ============================================================
// /api/companions/blocks/[id] — unblock a previously-blocked user
//
// DELETE — remove a CompanionBlock row by its id. Caller must be the
//          blocker (DB-layer constraint via WHERE blockerId = caller).
//          Note: unblocking does NOT recreate any prior connection;
//          the two parties have to re-friend explicitly.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import { sql } from "@/lib/db/connection";

export const DELETE = withLogging(
  "/api/companions/blocks/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      // Safety endpoint — unblock should remain reachable even when
      // socialEnabled is false (matches POST /blocks rationale).
      const gate = await gateCompanionRequest(request, {
        tier: "write",
        skipSocialEnabledCheck: true,
      });
      if (!gate.ok) return gate.response;

      const { id } = await context.params;
      if (!id) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Block id is required.",
          400,
        );
      }

      const rows = await sql`
        DELETE FROM "CompanionBlock"
        WHERE "id" = ${id} AND "blockerId" = ${gate.userId}
        RETURNING "id"
      `;
      if (rows.length === 0) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Block not found or you do not own it.",
          404,
        );
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      logApiError("/api/companions/blocks/[id]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to remove block",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to unblock. Please try again.",
        500,
      );
    }
  },
);
