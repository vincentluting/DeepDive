// ============================================================
// GET /api/cron/post1week-reminders — Send post-1week survey reminders
// Scheduled: daily at 09:00 UTC (vercel.json)
// Auth: Authorization: Bearer ${CRON_SECRET}
//
// Finds thesis participants who completed post-immediate 7+ days ago
// but haven't done post-1week yet, and sends them a reminder email.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { buildPost1WeekReminderEmail } from "@/lib/email/templates/post-1week-reminder";
import { guardCron } from "@/lib/api/guard-cron";
import { withLogging } from "@/lib/api/with-logging";
import {
  claimPost1WeekReminder,
  getPost1WeekReminderCandidates,
  markPost1WeekReminderResult,
} from "@/lib/db/post1week-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";

export const GET = withLogging(
  "/api/cron/post1week-reminders",
  async (request: NextRequest) => {
    const cronGuard = guardCron(request);
    if (cronGuard.blocked) return cronGuard.response;

    const start = Date.now();
    try {
      const eligible = await getPost1WeekReminderCandidates();

      if (eligible.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          message: "No eligible participants",
          durationMs: Date.now() - start,
        });
      }

      let sentCount = 0;
      for (const user of eligible) {
        const email = user.email;
        const name = user.name;
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
        // in beta mode. (Also: this cron is currently unscheduled in
        // vercel.json — see commit 6dc9b655.)
        try {
          const sent = await sendEmail({
            to: email,
            subject,
            html,
            category: "transactional",
          });
          await markPost1WeekReminderResult({ id: claimId, sent });
          if (sent) sentCount++;
        } catch (sendErr) {
          await markPost1WeekReminderResult({
            id: claimId,
            sent: false,
            error: sendErr instanceof Error ? sendErr.message : String(sendErr),
          });
        }
      }

      const durationMs = Date.now() - start;
      console.log(
        `[cron:post1week-reminders] Sent ${sentCount}/${eligible.length} — durationMs=${durationMs}`,
      ); // intentional

      return NextResponse.json({
        success: true,
        sent: sentCount,
        total: eligible.length,
        durationMs,
      });
    } catch (error) {
      console.error("[cron:post1week-reminders] Failed:", error); // intentional
      return NextResponse.json(
        { error: "Failed to send reminders" },
        { status: 500 },
      );
    }
  },
);
