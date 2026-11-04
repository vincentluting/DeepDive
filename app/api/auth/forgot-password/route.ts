import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { forgotPasswordSchema } from "@/lib/validation/api-schemas";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";
import { findUserByEmail } from "@/lib/auth";
import { createPasswordResetToken } from "@/lib/db/password-reset";
import { sendEmail } from "@/lib/email/client";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";

export const POST = withLogging(
  "/api/auth/forgot-password",
  async (request) => {
    const guard = await guardRoute(request, { tier: "auth" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, forgotPasswordSchema);
    if ("error" in parsed) return parsed.error;
    const { email, locale = "en" } = parsed.data;

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({ success: true });

    const user = await findUserByEmail(email);
    if (!user) return successResponse;

    const rawToken = await createPasswordResetToken(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";
    const resetUrl = `${appUrl}/${locale}/reset-password?token=${rawToken}`;

    const { subject, html } = buildPasswordResetEmail({
      name: user.name,
      resetUrl,
      locale,
    });

    // category: critical — user explicitly requested this; always sends
    // even in beta mode (EMAIL_MODE=beta) since users cannot recover
    // their account without it.
    const sent = await sendEmail({
      to: email,
      subject,
      html,
      category: "critical",
    });
    if (sent === false) {
      logApiError("/api/auth/forgot-password", ApiErrorCode.EMAIL_SERVICE_ERROR, {
        userId: user.id,
        message:
          "Password reset email failed to send. Check RESEND_API_KEY and EMAIL_FROM_ADDRESS domain verification.",
      });
    }

    return successResponse;
  },
);
