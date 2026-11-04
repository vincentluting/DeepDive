import { NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";
import {
  saveSessionProgress,
  getLatestDeepDiveSessionId,
} from "@/lib/db/sessions";
import { MODULE_RANGES } from "@/lib/questionnaire/store-utils";
import type { ModuleCode } from "@/lib/questionnaire/store-utils";

/**
 * POST /api/test/seed-questionnaire
 *
 * Seed a user's questionnaire session to a specific module/question.
 * Fills preceding modules with deterministic answers so the questionnaire
 * resumes at the target position.
 *
 * E2E-only: blocked in production, email pattern validated.
 *
 * Input: { email, targetModule: "A"|"B"|"C", questionIndex?: number, sessionId?: string }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  if (process.env.VERCEL) {
    const auth = request.headers.get("authorization");
    const expected = process.env.CRON_SECRET;
    if (!expected || auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);
  const email = body?.email;
  const targetModule = body?.targetModule as ModuleCode | undefined;
  const questionIndex =
    typeof body?.questionIndex === "number" ? body.questionIndex : 0;
  const requestedSessionId =
    typeof body?.sessionId === "string" ? body.sessionId : null;

  if (typeof email !== "string" || !email.endsWith("@test.deepdive.dev")) {
    return NextResponse.json(
      { error: "Invalid email — must end with @test.deepdive.dev" },
      { status: 400 },
    );
  }

  if (!targetModule || !["A", "B", "C"].includes(targetModule)) {
    return NextResponse.json(
      { error: "targetModule must be A, B, or C" },
      { status: 400 },
    );
  }

  try {
    // Find user
    const users = await sql`
      SELECT "id" FROM "User" WHERE "email" = ${email} LIMIT 1
    `;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = users[0].id as string;

    // Find existing session. Tests can pass a specific sessionId to avoid
    // races when a user has multiple in-progress deep-dive sessions.
    let sessionId = requestedSessionId;
    if (sessionId) {
      const sessions = await sql`
        SELECT "id" FROM "QuestionnaireSession"
        WHERE "id" = ${sessionId}
          AND "userId" = ${userId}
          AND "tier" = 'deep'
        LIMIT 1
      `;
      if (sessions.length === 0) {
        return NextResponse.json(
          { error: "Session not found for user" },
          { status: 404 },
        );
      }
    } else {
      sessionId = await getLatestDeepDiveSessionId(userId);
    }
    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "No deep-dive session found — create one via /api/session/create first",
        },
        { status: 404 },
      );
    }

    // Build filler answers for all modules before targetModule
    const answers = buildFillerAnswers(targetModule);

    // Calculate global question index
    const globalIndex = MODULE_RANGES[targetModule].start + questionIndex;

    // Save to DB — positions the session at the target
    await saveSessionProgress(
      sessionId,
      answers,
      targetModule,
      globalIndex,
      "en",
      undefined,
      userId,
    );

    return NextResponse.json({
      success: true,
      sessionId,
      currentModule: targetModule,
      currentQuestionIndex: globalIndex,
      fillerAnswerCount: answers.length,
    });
  } catch (error) {
    console.error("[test/seed-questionnaire] Failed:", error);
    return NextResponse.json(
      { error: "Failed to seed questionnaire" },
      { status: 500 },
    );
  }
}

// ── Filler answer generators ──

/** SJT filler: 6 scenarios with deterministic would/should choices */
function buildSjtAnswers() {
  return Array.from({ length: 6 }, (_, i) => ({
    questionId: `sjt-${i + 1}`,
    value: { type: "sjt" as const, wouldChoice: "A", shouldChoice: "B" },
    responseTimeMs: 3000,
    timestamp: Date.now() + i * 1000,
  }));
}

/** PVQ/TwIVI filler: 20 value items rated 3 (midpoint of 1-6 scale) */
function buildPvqAnswers() {
  return Array.from({ length: 20 }, (_, i) => ({
    questionId: `ddvq-${i + 1}`,
    value: { type: "pvq" as const, rating: 3 },
    responseTimeMs: 2000,
    timestamp: Date.now() + 10000 + i * 500,
  }));
}

/** Build all filler answers needed to reach targetModule */
function buildFillerAnswers(targetModule: ModuleCode) {
  if (targetModule === "A") return [];
  if (targetModule === "B") return buildSjtAnswers();
  // targetModule === "C"
  return [...buildSjtAnswers(), ...buildPvqAnswers()];
}
