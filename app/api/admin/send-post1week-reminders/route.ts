// ============================================================
// POST /api/admin/send-post1week-reminders
//
// Admin-triggered batch email: finds thesis participants who
// completed post-immediate 7+ days ago but haven't done
// post-1week yet, and sends them a reminder email.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { sendEmail } from "@/lib/email/client";
import { buildPost1WeekReminderEmail } from "@/lib/email/templates/post-1week-reminder";
import {
  claimPost1WeekReminder,
  getPost1WeekReminderCandidates,
  markPost1WeekReminderResult,
} from "@/lib/db/post1week-reminders";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";

export const POST = withLogging(
  "/api/admin/send-post1week-reminders",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const eligible = await getPost1WeekReminderCandidates();

      if (eligible.length === 0) {
        return NextResponse.json({
          sent: 0,
          message: "No eligible participants found",
        });
      }

      const results: { participant: string; sent: boolean }[] = [];

      for (const user of eligible) {
        const email = user.email;
        const name = user.name;
        // Detect locale from email domain or default to en
        const locale =
          email.endsWith(".cn") ||
          email.includes("qq.com") ||
          email.includes("163.com")
            ? "zh"
            : "en";

        const claimId = await claimPost1WeekReminder({
          userId: user.userId,
          email,
          locale,
          postImmediateAt: user.postImmediateAt,
        });
        if (!claimId) continue;

        const { subject, html } = buildPost1WeekReminderEmail({
          name,
          locale,
          appUrl: APP_URL,
        });

        // category: transactional — thesis post-1week reminder; suppressed
        // in beta mode. Admin-triggered but still a system notification.
        try {
          const sent = await sendEmail({
            to: email,
            subject,
            html,
            category: "transactional",
          });
          await markPost1WeekReminderResult({ id: claimId, sent });
          results.push({ participant: user.userId.slice(0, 8), sent });
        } catch (sendErr) {
          await markPost1WeekReminderResult({
            id: claimId,
            sent: false,
            error: sendErr instanceof Error ? sendErr.message : String(sendErr),
          });
          results.push({ participant: user.userId.slice(0, 8), sent: false });
        }
      }

      const sentCount = results.filter((r) => r.sent).length;

      return NextResponse.json({
        sent: sentCount,
        total: eligible.length,
        results,
      });
    } catch (error) {
      logApiError(
        "/api/admin/send-post1week-reminders",
        ApiErrorCode.INTERNAL_ERROR,
        { message: "Failed to send post-1week reminders", cause: error },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to send reminders",
        500,
      );
    }
  },
);
