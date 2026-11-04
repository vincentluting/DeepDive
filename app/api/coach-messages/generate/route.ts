// ============================================================
// POST /api/coach-messages/generate — trigger a proactive coach message
// Input: { trigger: MessageTrigger }
// Called internally when journey milestones are reached.
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  logApiError,
  createErrorResponse,
} from "@/lib/api/api-errors";
import { parseBody } from "@/lib/validation/parse-body";
import { coachMessageGenerateSchema } from "@/lib/validation/api-schemas";
import {
  createCoachMessage,
  hasMessageWithTrigger,
} from "@/lib/db/coach-messages";
import { generateProactiveMessage } from "@/lib/coaching/proactive-messages";
import type { MessageTrigger } from "@/lib/coaching/proactive-messages";

const VALID_TRIGGERS: MessageTrigger[] = [
  "welcome",
  "quick_dive_complete",
  "deep_dive_complete",
  "report_generated",
  "report_viewed",
  "return_nudge",
  "profile_generated",
  "action_plan_created",
];

export const POST = withLogging(
  "/api/coach-messages/generate",
  async (request) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    try {
      const userId = guard.user!.id;
      const parsed = await parseBody(request, coachMessageGenerateSchema);
      if ("error" in parsed) return parsed.error;
      const trigger = parsed.data.trigger as MessageTrigger;

      if (!trigger || !VALID_TRIGGERS.includes(trigger)) {
        return NextResponse.json({ error: "Invalid trigger" }, { status: 400 });
      }

      // Prevent duplicate messages for the same trigger
      const exists = await hasMessageWithTrigger(userId, trigger);
      if (exists) {
        return NextResponse.json({ skipped: true, reason: "already_sent" });
      }

      const params = generateProactiveMessage(userId, trigger);
      if (!params) {
        return NextResponse.json({ error: "Unknown trigger" }, { status: 400 });
      }

      const message = await createCoachMessage(params);
      return NextResponse.json({ message });
    } catch (error) {
      logApiError("/api/coach-messages/generate", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to generate coach message",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to generate message",
        500,
      );
    }
  },
);
