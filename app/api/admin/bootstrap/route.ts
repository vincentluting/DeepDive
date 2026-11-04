import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { bootstrapAdmin } from "@/lib/db/admin";
import { parseBody } from "@/lib/validation/parse-body";
import { adminBootstrapSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { guardRoute } from "@/lib/api/api-guard";

/**
 * POST /api/admin/bootstrap
 *
 * Bootstrap admin access for a user by email.
 *
 * SECURITY (bug-log #016): production is fully disabled — the previous design
 * trusted `SESSION_SECRET` as a shared-secret Bearer, which means any leak of
 * SESSION_SECRET (Vercel env, logs, .env.local commit) would grant admin
 * escalation. In production, new admins must be promoted via direct DB UPDATE
 * by an existing admin, not through any HTTP path.
 *
 * Dev / local: Bearer SESSION_SECRET still works for first-time founder bootstrap.
 *
 * Body: { "email": "user@example.com" }
 */
export const POST = withLogging(
  "/api/admin/bootstrap",
  async (request: NextRequest) => {
    try {
      // SECURITY (bug-log #016): completely disabled in production.
      // No HTTP path should grant admin in prod — use DB UPDATE instead.
      if (process.env.NODE_ENV === "production") {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Not found",
          404,
        );
      }

      // Rate limiting (auth tier = brute-force protection) — Bearer token check follows
      const guard = await guardRoute(request, { tier: "auth" });
      if (guard.blocked) return guard.response;

      // Authenticate with SESSION_SECRET (timing-safe comparison) — dev only
      const authHeader = request.headers.get("authorization");
      const secret = process.env.SESSION_SECRET;
      const expected = secret ? `Bearer ${secret}` : "";

      if (
        !secret ||
        !authHeader ||
        authHeader.length !== expected.length ||
        !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
      ) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Unauthorized",
          401,
        );
      }

      const parsed = await parseBody(request, adminBootstrapSchema);
      if ("error" in parsed) return parsed.error;
      const email = parsed.data.email.toLowerCase().trim();

      const user = await bootstrapAdmin(email);

      if (!user) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Bootstrap failed — user not found",
          404,
        );
      }

      return NextResponse.json({
        success: true,
        user,
      });
    } catch (error) {
      logApiError("/api/admin/bootstrap", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to bootstrap admin",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to bootstrap admin",
        500,
      );
    }
  },
);
