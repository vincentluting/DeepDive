import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { resetPasswordSchema } from "@/lib/validation/api-schemas";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import { validateResetToken, consumeResetToken } from "@/lib/db/password-reset";
import { hashPassword } from "@/lib/auth";
import { sql } from "@/lib/db/connection";
import { clearUserSessions } from "@/lib/db/user-data";

export const POST = withLogging("/api/auth/reset-password", async (request) => {
  const guard = await guardRoute(request, { tier: "auth" });
  if (guard.blocked) return guard.response;

  const parsed = await parseBody(request, resetPasswordSchema);
  if ("error" in parsed) return parsed.error;
  const { token, password } = parsed.data;

  const userId = await validateResetToken(token);
  if (!userId) {
    return createErrorResponse(
      ApiErrorCode.VALIDATION_ERROR,
      "Invalid or expired reset link",
      400,
    );
  }

  // Atomic: update password + consume token in one transaction
  const passwordHash = await hashPassword(password);
  await sql`BEGIN`;
  try {
    await sql`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}, "updatedAt" = NOW()
      WHERE "id" = ${userId}
    `;
    await consumeResetToken(token);
    await sql`COMMIT`;
  } catch (err) {
    await sql`ROLLBACK`;
    throw err;
  }

  // Invalidate all existing sessions so a stolen session can't persist
  await clearUserSessions(userId);

  return NextResponse.json({ success: true });
});
