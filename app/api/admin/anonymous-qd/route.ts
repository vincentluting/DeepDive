// GET  /api/admin/anonymous-qd — List anonymous Quick Dive completions
// PATCH /api/admin/anonymous-qd — Update admin note on a QuickDiveResult

import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";
import { guardRoute } from "@/lib/api/api-guard";
import { isUserAdmin } from "@/lib/auth/admin";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { parseBody } from "@/lib/validation/parse-body";
import { z } from "zod/v4";

const patchSchema = z.object({
  id: z.string().min(1).max(64),
  adminNote: z.string().max(500).nullable(),
});

const deleteSchema = z.object({
  id: z.string().min(1).max(64),
});

async function checkAdmin(
  guard: Awaited<ReturnType<typeof guardRoute>>,
): Promise<NextResponse | null> {
  if (guard.blocked) return guard.response;
  if (!guard.user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = await isUserAdmin(guard.user.id, guard.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export const GET = withLogging("/api/admin/anonymous-qd", async (request) => {
  const guard = await guardRoute(request, {
    tier: "read",
    requireAuth: true,
  });
  const denied = await checkAdmin(guard);
  if (denied) return denied;

  try {
    // All QD results (anonymous + registered), ordered by most recent
    const rows = await sql`
    SELECT
      qd."id",
      qd."anonymousId",
      qd."userId",
      qd."archetypeCode",
      qd."archetypeLabel",
      qd."language",
      qd."exploreMode",
      qd."adminNote",
      qd."environment",
      qd."createdAt",
      u."email" AS "userEmail",
      u."name" AS "userName",
      il."userId" IS NOT NULL AS "converted",
      conv_u."email" AS "convertedEmail",
      conv_u."name" AS "convertedName",
      conv_u."createdAt" AS "convertedAt"
    FROM "QuickDiveResult" qd
    LEFT JOIN "User" u ON u."id" = qd."userId"
    LEFT JOIN "IdentityLink" il ON il."anonymousId" = qd."anonymousId"
    LEFT JOIN "User" conv_u ON conv_u."id" = il."userId"
    ORDER BY qd."createdAt" DESC
    LIMIT 200
  `;

    // Summary stats
    const statsRows = await sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE "userId" IS NULL)::int AS anonymous,
      count(*) FILTER (WHERE "userId" IS NOT NULL)::int AS registered,
      count(DISTINCT "anonymousId") FILTER (WHERE "anonymousId" IS NOT NULL AND "userId" IS NULL)::int AS unique_anonymous
    FROM "QuickDiveResult"
  `;

    return NextResponse.json({
      results: rows,
      stats: statsRows[0] ?? {
        total: 0,
        anonymous: 0,
        registered: 0,
        unique_anonymous: 0,
      },
    });
  } catch (error) {
    logApiError("/api/admin/anonymous-qd", ApiErrorCode.INTERNAL_ERROR, {
      message: "anonymous-qd GET failed",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Internal server error",
      500,
    );
  }
});

export const PATCH = withLogging(
  "/api/admin/anonymous-qd",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    const denied = await checkAdmin(guard);
    if (denied) return denied;

    try {
      const parsed = await parseBody(request, patchSchema);
      if ("error" in parsed) return parsed.error;

      const { id, adminNote } = parsed.data;
      await sql`
      UPDATE "QuickDiveResult"
      SET "adminNote" = ${adminNote}
      WHERE "id" = ${id}
    `;

      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/admin/anonymous-qd", ApiErrorCode.INTERNAL_ERROR, {
        message: "anonymous-qd PATCH failed",
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

export const DELETE = withLogging(
  "/api/admin/anonymous-qd",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    const denied = await checkAdmin(guard);
    if (denied) return denied;

    try {
      const parsed = await parseBody(request, deleteSchema);
      if ("error" in parsed) return parsed.error;

      const { id } = parsed.data;
      const result = await sql`
      DELETE FROM "QuickDiveResult"
      WHERE "id" = ${id}
      RETURNING "id"
    `;

      if (result.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ deleted: id });
    } catch (error) {
      logApiError("/api/admin/anonymous-qd", ApiErrorCode.INTERNAL_ERROR, {
        message: "anonymous-qd DELETE failed",
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
