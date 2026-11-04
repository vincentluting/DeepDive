// ============================================================
// POST /api/session/save-beacon — Best-effort session save via sendBeacon
//
// Called from beforeunload via navigator.sendBeacon().
// CSRF exempt (sendBeacon cannot set custom headers).
// guardRoute exempt: best-effort beacon must never return non-200 (rate limit 429 would break contract).
// Auth: getCurrentUser() validates session cookie; ownership check prevents cross-user writes.
// Accepts the same payload as /api/session/save but only updates existing sessions (no creation).
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { saveSessionProgress } from "@/lib/db/sessions";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db/connection";
import type { ModuleCode, SessionQuestionAnswer } from "@/lib/types";
import { locales } from "@/lib/i18n/config";
import { z } from "zod/v4";

const ok = () => NextResponse.json({ ok: true });

const sessionBeaconSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.unknown()),
  currentModule: z.string().optional(),
  currentQuestionIndex: z.number().optional(),
  language: z.enum(locales).optional(),
  explorationProgress: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = sessionBeaconSchema.safeParse(body);
    if (!parsed.success) return ok(); // Best-effort: silently skip invalid payloads

    const {
      sessionId,
      answers,
      currentModule,
      currentQuestionIndex,
      language,
      explorationProgress,
    } = parsed.data;

    // Verify user from session cookie (sendBeacon sends cookies automatically)
    const user = await getCurrentUser();
    const userId = user?.id;

    // Ownership check: prevent saving to sessions owned by other users
    const existing = await sql`
      SELECT "userId" FROM "QuestionnaireSession" WHERE "id" = ${sessionId}
    `;
    if (
      existing.length > 0 &&
      existing[0].userId &&
      existing[0].userId !== (userId ?? null)
    ) {
      return ok(); // Silently skip — best-effort beacon should not expose errors
    }

    const module: ModuleCode = (currentModule as ModuleCode) ?? "A";

    await saveSessionProgress(
      sessionId,
      answers as unknown as SessionQuestionAnswer[],
      module,
      currentQuestionIndex ?? 0,
      language,
      explorationProgress as Record<string, unknown> | undefined,
      userId,
    );

    return ok();
  } catch (err) {
    // Best-effort: never fail the beacon response, but log for debugging
    console.warn(
      "[session/save-beacon] Beacon save failed:",
      err instanceof Error ? err.message : err,
    );
    return ok();
  }
}
