// ============================================================
// Fire-and-forget coach message trigger.
// Call from API routes when journey milestones are reached.
// Never throws — failures are silently logged.
// ============================================================

import {
  createCoachMessage,
  hasMessageWithTrigger,
} from "@/lib/db/coach-messages";
import {
  generateProactiveMessage,
  type MessageTrigger,
} from "./proactive-messages";

/**
 * Trigger a proactive coach message for a user.
 * Idempotent: won't create duplicate messages for the same trigger.
 * Fire-and-forget: never throws.
 */
export async function triggerCoachMessage(
  userId: string,
  trigger: MessageTrigger,
): Promise<void> {
  try {
    const exists = await hasMessageWithTrigger(userId, trigger);
    if (exists) return;

    const params = generateProactiveMessage(userId, trigger);
    if (!params) return;

    await createCoachMessage(params);
  } catch (err) {
    if (__DEV__)
      console.warn(`[coach-message] Failed to trigger "${trigger}":`, err);
  }
}

const __DEV__ = process.env.NODE_ENV === "development";
