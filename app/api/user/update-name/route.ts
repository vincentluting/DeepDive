// ============================================================
// PATCH /api/user/update-name — Update user display name
// Input:  { name: string }
// Output: { ok: true }
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { updateNameSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { sql } from "@/lib/db/connection";

export const PATCH = withLogging("/api/user/update-name", async (request) => {
  try {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, updateNameSchema);
    if ("error" in parsed) return parsed.error;

    const { name } = parsed.data;
    const userId = guard.user!.id;

    await sql`
      UPDATE "User"
      SET "name" = ${name}, "updatedAt" = NOW()
      WHERE "id" = ${userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    logApiError("/api/user/update-name", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to update user name",
      cause: err,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to update display name. Please try again.",
      500,
    );
  }
});
