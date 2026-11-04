// ============================================================
// CoachMessage — CRUD for proactive coach companion messages
//
// Table: CoachMessage
// Key fields: id, userId, type, trigger, content, isRead, actionUrl
// Stores proactive messages from AI coach to guide users through the journey.
// ============================================================

import { sql } from "./connection";

// ── Types ─────

export interface CoachMessage {
  id: string;
  userId: string;
  type: "guide" | "insight" | "nudge" | "welcome";
  trigger: string;
  content: { en: string; zh: string; [key: string]: string };
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface CreateCoachMessageParams {
  userId: string;
  type: CoachMessage["type"];
  trigger: string;
  content: CoachMessage["content"];
  actionUrl?: string | null;
}

// ── Queries ─────

/** Get unread messages for a user, newest first */
export async function getUnreadMessages(
  userId: string,
): Promise<CoachMessage[]> {
  const rows = await sql<CoachMessage>`
    SELECT * FROM "CoachMessage"
    WHERE "userId" = ${userId} AND "isRead" = FALSE
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;
  return rows;
}

/** Get all messages for a user, newest first */
export async function getMessages(
  userId: string,
  limit = 50,
): Promise<CoachMessage[]> {
  const rows = await sql<CoachMessage>`
    SELECT * FROM "CoachMessage"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows;
}

/** Get unread count for badge display */
export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count FROM "CoachMessage"
    WHERE "userId" = ${userId} AND "isRead" = FALSE
  `;
  return (rows[0]?.count as number) ?? 0;
}

/** Create a new coach message */
export async function createCoachMessage(
  params: CreateCoachMessageParams,
): Promise<CoachMessage> {
  const rows = await sql<CoachMessage>`
    INSERT INTO "CoachMessage" ("userId", "type", "trigger", "content", "actionUrl")
    VALUES (${params.userId}, ${params.type}, ${params.trigger}, ${JSON.stringify(params.content)}, ${params.actionUrl ?? null})
    RETURNING *
  `;
  return rows[0];
}

/** Mark a single message as read */
export async function markMessageRead(
  messageId: string,
  userId: string,
): Promise<void> {
  await sql`
    UPDATE "CoachMessage" SET "isRead" = TRUE
    WHERE "id" = ${messageId} AND "userId" = ${userId}
  `;
}

/** Mark all messages as read for a user */
export async function markAllRead(userId: string): Promise<void> {
  await sql`
    UPDATE "CoachMessage" SET "isRead" = TRUE
    WHERE "userId" = ${userId} AND "isRead" = FALSE
  `;
}

/** Check if a message with this trigger already exists for the user (prevent duplicates) */
export async function hasMessageWithTrigger(
  userId: string,
  trigger: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM "CoachMessage"
    WHERE "userId" = ${userId} AND "trigger" = ${trigger}
    LIMIT 1
  `;
  return rows.length > 0;
}
