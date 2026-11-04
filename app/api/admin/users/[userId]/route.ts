import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { hardDeleteUser } from "@/lib/db/user-data";
import { sql } from "@/lib/db/connection";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

/**
 * DELETE /api/admin/users/[userId]
 * Hard-delete a user and ALL associated data (cascade).
 * Admin-only. Cannot delete yourself.
 */
export const DELETE = withLogging(
  "/api/admin/users/[userId]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, { tier: "admin" });
      if (guard.blocked) return guard.response;

      const { userId } = await context.params;

      // Prevent self-deletion
      if (guard.user!.id === userId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Cannot delete your own account from admin panel",
          400,
        );
      }

      // Verify user exists
      const users = await sql`
        SELECT "id", "email", "name", "isAdmin" FROM "User" WHERE "id" = ${userId}
      `;

      if (users.length === 0) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "User not found",
          404,
        );
      }

      const targetUser = users[0];

      // Extra safety: prevent deleting other admins
      if (targetUser.isAdmin) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Cannot delete admin users",
          400,
        );
      }

      await hardDeleteUser(userId);

      // GDPR + no-prod-console rule: don't retain the deleted user's email in
      // prod logs — that defeats the hard-delete. Dev-only, and log only the
      // user id + the acting admin (sufficient audit reference).
      if (process.env.NODE_ENV !== "production") {
        console.log(`[admin] user ${userId} deleted by ${guard.user!.email}`);
      }

      return NextResponse.json({
        success: true,
        deletedUser: {
          id: userId,
          email: targetUser.email,
          name: targetUser.name,
        },
      });
    } catch (error) {
      logApiError("/api/admin/users/[userId]", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to delete user",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to delete user",
        500,
      );
    }
  },
);
