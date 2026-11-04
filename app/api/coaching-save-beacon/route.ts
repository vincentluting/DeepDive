// ============================================================
// POST /api/coaching-save-beacon — Best-effort coaching message save via sendBeacon
//
// Called from beforeunload via navigator.sendBeacon().
// CSRF exempt (sendBeacon cannot set custom headers).
// guardRoute exempt: best-effort beacon must never return non-200 (rate limit 429 would break contract).
// Auth: getCurrentUser() validates session cookie (sendBeacon sends cookies automatically).
// Only persists messages — does NOT run LLM extraction.
// Full insight extraction happens when user properly ends the session.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { saveCoachingBeacon } from "@/lib/db/coaching";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod/v4";

const ok = () => NextResponse.json({ ok: true });

const coachingBeaconSchema = z.object({
  sessionId: z.string().min(1).max(64),
  reportId: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.string().max(32),
        content: z.string().max(4000),
      }),
    )
    .min(1)
    .max(100),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = coachingBeaconSchema.safeParse(body);
    if (!parsed.success) return ok(); // Best-effort: silently skip invalid payloads

    const { sessionId, reportId, messages, locale } = parsed.data;

    // Verify user from session cookie (sendBeacon sends cookies automatically)
    const user = await getCurrentUser();
    if (!user) return ok(); // Not authenticated — silently skip
    const userId = user.id;

    const userMessageCount = messages.filter(
      (m: { role: string }) => m.role === "user",
    ).length;

    // Only save if user actually sent at least one message
    if (userMessageCount === 0) return ok();

    await saveCoachingBeacon({
      id: sessionId,
      userId,
      reportId: reportId || null,
      roundNumber: userMessageCount,
      maxRounds: 10,
      messagesJson: JSON.stringify(messages),
      sessionType: `coaching_beacon_${locale || "en"}`,
      locale: locale || "en",
    });

    return ok();
  } catch (err) {
    // Best-effort: never fail the beacon response, but log for observability
    console.warn(
      "[coaching-save-beacon] Error:",
      err instanceof Error ? err.message : err,
    );
    return ok();
  }
}
