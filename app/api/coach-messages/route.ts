// ============================================================
// GET /api/coach-messages — fetch user's coach companion messages
// PATCH /api/coach-messages — mark messages as read
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
import { coachMessageMarkReadSchema } from "@/lib/validation/api-schemas";
import {
  getMessages,
  getUnreadCount,
  markMessageRead,
  markAllRead,
} from "@/lib/db/coach-messages";

export const GET = withLogging("/api/coach-messages", async (request) => {
  const guard = await guardRoute(request, {
    tier: "read",
    requireAuth: true,
  });
  if (guard.blocked) return guard.response;

  try {
    const userId = guard.user!.id;

    const [messages, unreadCount] = await Promise.all([
      getMessages(userId, 50),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    logApiError("/api/coach-messages", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to fetch coach messages",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to fetch messages",
      500,
    );
  }
});

export const PATCH = withLogging("/api/coach-messages", async (request) => {
  const guard = await guardRoute(request, {
    tier: "read",
    requireAuth: true,
  });
  if (guard.blocked) return guard.response;

  try {
    const userId = guard.user!.id;
    const parsed = await parseBody(request, coachMessageMarkReadSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    if (body.markAll) {
      await markAllRead(userId);
    } else if (body.messageId) {
      await markMessageRead(body.messageId, userId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("/api/coach-messages", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to update coach message read status",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to update messages",
      500,
    );
  }
});
