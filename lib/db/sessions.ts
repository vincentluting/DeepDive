// ============================================================
// Sessions — QuestionnaireSession CRUD
//
// Table: QuestionnaireSession
// Key fields: id, userId, tier (quick/deep/ultra), language, status,
//             answersJson, currentModule, currentQuestionIndex, completedAt
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type {
  QuestionnaireSession,
  SessionQuestionAnswer,
  ModuleCode,
} from "@/lib/types";

export async function createSession(params: {
  userId?: string;
  tier: "quick" | "deep" | "ultra";
  language: string;
}): Promise<string> {
  const id = randomUUID();
  try {
    await sql`
      INSERT INTO "QuestionnaireSession" ("id", "userId", "tier", "language")
      VALUES (${id}, ${params.userId ?? null}, ${params.tier}, ${params.language})
    `;
  } catch (err) {
    throw new Error(`Failed to create session tier=${params.tier}`, {
      cause: err,
    });
  }
  return id;
}

/**
 * Create a session with a specific client-provided ID.
 * Uses ON CONFLICT DO UPDATE to backfill userId if the session was already created
 * by saveSessionProgress() before this call completed (race condition safety).
 */
export async function createSessionWithId(params: {
  id: string;
  userId?: string;
  tier: "quick" | "deep" | "ultra";
  language: string;
}): Promise<void> {
  await sql`
    INSERT INTO "QuestionnaireSession" ("id", "userId", "tier", "language")
    VALUES (${params.id}, ${params.userId ?? null}, ${params.tier}, ${params.language})
    ON CONFLICT ("id") DO UPDATE SET
      "userId" = COALESCE("QuestionnaireSession"."userId", ${params.userId ?? null})
  `;
}

export async function getSession(
  sessionId: string,
): Promise<QuestionnaireSession | null> {
  const rows = await sql`
    SELECT * FROM "QuestionnaireSession" WHERE "id" = ${sessionId}
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    userId: row.userId as string | undefined,
    tier: row.tier as "quick" | "deep" | "ultra",
    language: row.language as string,
    answers: (row.answersJson as SessionQuestionAnswer[]) || [],
    startedAt: new Date(row.startedAt as string).getTime(),
    completedAt: row.completedAt
      ? new Date(row.completedAt as string).getTime()
      : undefined,
    totalTimeMs: (row.totalTimeMs as number) || undefined,
    currentModule: row.currentModule as ModuleCode,
    currentQuestionIndex: row.currentQuestionIndex as number,
    answerAssistantEnabled: row.answerAssistantEnabled as boolean,
    explorationProgress:
      (row.explorationProgressJson as Record<string, unknown>) || {},
  };
}

export async function saveSessionProgress(
  sessionId: string,
  answers: SessionQuestionAnswer[],
  currentModule: ModuleCode,
  currentQuestionIndex: number,
  language?: string,
  explorationProgress?: Record<string, unknown>,
  userId?: string,
): Promise<void> {
  const explorationJson = explorationProgress
    ? JSON.stringify(explorationProgress)
    : "{}";

  await sql`
    INSERT INTO "QuestionnaireSession" ("id", "userId", "answersJson", "currentModule", "currentQuestionIndex", "language", "explorationProgressJson", "lastActiveAt", "updatedAt")
    VALUES (
      ${sessionId},
      ${userId ?? null},
      ${JSON.stringify(answers)}::jsonb,
      ${currentModule},
      ${currentQuestionIndex},
      ${language ?? "en"},
      ${explorationJson}::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "userId" = COALESCE("QuestionnaireSession"."userId", ${userId ?? null}),
      "answersJson" = ${JSON.stringify(answers)}::jsonb,
      "currentModule" = ${currentModule},
      "currentQuestionIndex" = ${currentQuestionIndex},
      "explorationProgressJson" = ${explorationJson}::jsonb,
      "lastActiveAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "QuestionnaireSession"."status" != 'completed'
      -- Progress-monotonicity guard: never let a write with fewer answers
      -- overwrite a stored snapshot with more. The debounced /session/save
      -- and the beforeunload sendBeacon (/session/save-beacon) can race with
      -- out-of-order payloads; without this a late stale beacon could clobber
      -- newer progress (data loss). Backward navigation keeps the answer
      -- count, and reset flows don't go through this function, so this only
      -- blocks the clobber case. The jsonb_typeof fallback keeps the prior
      -- last-write-wins behavior for any non-array legacy row.
      AND (
        jsonb_typeof("QuestionnaireSession"."answersJson") IS DISTINCT FROM 'array'
        OR jsonb_array_length(${JSON.stringify(answers)}::jsonb)
           >= jsonb_array_length("QuestionnaireSession"."answersJson")
      )
  `;
}

/**
 * Ensure a session row exists in the DB before FK-dependent operations.
 * Uses INSERT ... ON CONFLICT DO NOTHING so it's safe to call multiple times.
 * This is the critical guard against FK constraint failures when
 * RealConditions or AssessmentResult rows reference a session that
 * hasn't been persisted yet (race condition with fire-and-forget creation).
 */
export async function ensureSessionExists(
  sessionId: string,
  language: string = "en",
  tier: "quick" | "deep" | "ultra" = "deep",
  userId?: string,
): Promise<void> {
  await sql`
    INSERT INTO "QuestionnaireSession" ("id", "tier", "language", "userId")
    VALUES (${sessionId}, ${tier}, ${language}, ${userId ?? null})
    ON CONFLICT ("id") DO UPDATE SET
      "userId" = COALESCE("QuestionnaireSession"."userId", ${userId ?? null})
  `;
}

export async function completeSession(
  sessionId: string,
  totalTimeMs: number,
): Promise<void> {
  await sql`
    UPDATE "QuestionnaireSession"
    SET "status" = 'completed',
        "completedAt" = NOW(),
        "totalTimeMs" = ${totalTimeMs},
        "updatedAt" = NOW()
    WHERE "id" = ${sessionId}
  `;
}

export async function backfillSessionUserId(
  sessionId: string,
  userId: string,
): Promise<void> {
  await sql`
    UPDATE "QuestionnaireSession" SET "userId" = ${userId}
    WHERE "id" = ${sessionId} AND "userId" IS NULL
  `;
}

/**
 * Get the most recent deep-dive QuestionnaireSession ID for a user.
 * Returns null if the user has no deep-dive sessions.
 */
export async function getLatestDeepDiveSessionId(
  userId: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT "id" FROM "QuestionnaireSession"
    WHERE "userId" = ${userId} AND "tier" = 'deep'
      AND "status" != 'abandoned'
    ORDER BY "startedAt" DESC
    LIMIT 1
  `;
  return (rows[0]?.id as string) ?? null;
}

/**
 * Mark a QuestionnaireSession as abandoned (status = 'abandoned').
 */
export async function markSessionAbandoned(sessionId: string): Promise<void> {
  await sql`
    UPDATE "QuestionnaireSession"
    SET "status" = 'abandoned', "updatedAt" = NOW()
    WHERE "id" = ${sessionId}
  `;
}

/**
 * Lightweight check: get Deep Dive completion status for a user.
 * Returns hasResults (any completed session exists) and inProgress (active session with answers).
 */
export async function getDeepDiveStatusForUser(userId: string): Promise<{
  hasResults: boolean;
  inProgress: boolean;
}> {
  const completedRows = await sql`
    SELECT 1 FROM "QuestionnaireSession"
    WHERE "userId" = ${userId} AND "tier" = 'deep'
      AND ("status" = 'completed' OR "completedAt" IS NOT NULL)
    LIMIT 1
  `;
  if (completedRows.length > 0) {
    return { hasResults: true, inProgress: false };
  }

  const activeRows = await sql`
    SELECT COALESCE(jsonb_array_length("answersJson"::jsonb), 0) AS "answerCount"
    FROM "QuestionnaireSession"
    WHERE "userId" = ${userId} AND "tier" = 'deep'
      AND "status" NOT IN ('completed', 'abandoned')
    ORDER BY "startedAt" DESC
    LIMIT 1
  `;
  const hasAnswers =
    activeRows.length > 0 && Number(activeRows[0].answerCount) > 0;

  return { hasResults: false, inProgress: hasAnswers };
}
