// ============================================================
// Coaching — CoachingSession CRUD
//
// Table: CoachingSession
// Key fields: id, userId, sessionType, reportId, roundNumber, maxRounds,
//             messagesJson, summaryJson, savedToProfile, tagsGeneratedJson
// Stores AI coaching conversations. Messages serialized as JSON.
// ============================================================

import type {
  CoachingCorrectionSignal,
  CoachingMode,
  CoachingSessionState,
  TurnUnderstanding,
} from "@/lib/coaching/conversation-router";

import { sql } from "./connection";

export interface CoachingMessage {
  role: "user" | "assistant";
  content: string;
  kind?: "message" | "correction";
}

export interface CoachingSessionRow {
  id: string;
  userId: string;
  reportId: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  updatedAt: Date;
  roundNumber: number;
  maxRounds: number;
  messagesJson: CoachingMessage[];
  summaryJson: string | null;
  savedToProfile: boolean;
  mode: CoachingMode;
  stateJson: CoachingSessionState | Record<string, never>;
  locale: string;
  status: "active" | "completed";
}

// ── Coaching Session Persistence ─────

export interface SaveCoachingSessionParams {
  id: string;
  userId: string;
  reportId: string | null;
  roundNumber: number;
  maxRounds: number;
  messagesJson: string;
  sessionType: string;
  mode?: CoachingMode;
  stateJson?: CoachingSessionState | null;
  locale?: string;
  status?: "active" | "completed";
}

export interface SaveCoachingTurnAuditParams {
  sessionId: string;
  userId: string;
  turnNumber: number;
  strategyVersion: CoachingSessionState["strategyVersion"];
  mode: CoachingMode;
  understanding: TurnUnderstanding;
  correctionSignal: CoachingCorrectionSignal | "message_text" | null;
  needsRepair: boolean;
  assistantResponseLength: number;
  hasActionDraft: boolean;
  hasRecommendation: boolean;
}

export async function saveCoachingSession(
  params: SaveCoachingSessionParams,
): Promise<void> {
  try {
    await sql`
      INSERT INTO "CoachingSession" (
        id, "userId", "reportId", "startedAt", "endedAt", "updatedAt",
        "roundNumber", "maxRounds", "messagesJson", "sessionType",
        "savedToProfile", "mode", "stateJson", "locale", "status"
      )
      VALUES (
        ${params.id}, ${params.userId}, ${params.reportId}, NOW(),
        ${params.status === "completed" ? sql`NOW()` : null}, NOW(),
        ${params.roundNumber}, ${params.maxRounds}, ${params.messagesJson},
        ${params.sessionType}, ${false}, ${params.mode ?? "explore"},
        ${JSON.stringify(params.stateJson ?? {})}, ${params.locale ?? "en"},
        ${params.status ?? "active"}
      )
      ON CONFLICT (id) DO UPDATE SET
        "reportId" = COALESCE(EXCLUDED."reportId", "CoachingSession"."reportId"),
        "endedAt" = CASE
          WHEN EXCLUDED."status" = 'completed' THEN NOW()
          ELSE NULL
        END,
        "updatedAt" = NOW(),
        "roundNumber" = EXCLUDED."roundNumber",
        "maxRounds" = EXCLUDED."maxRounds",
        "messagesJson" = EXCLUDED."messagesJson",
        "sessionType" = EXCLUDED."sessionType",
        "mode" = EXCLUDED."mode",
        "stateJson" = EXCLUDED."stateJson",
        "locale" = EXCLUDED."locale",
        "status" = EXCLUDED."status"
      WHERE "CoachingSession"."userId" = EXCLUDED."userId"
    `;
  } catch (dbErr) {
    throw new Error(
      `saveCoachingSession DB upsert failed for session ${params.id}`,
      { cause: dbErr },
    );
  }
}

/**
 * Persist a coaching session from a tab-close beacon. Unlike saveCoachingSession,
 * this only updates the conversation payload (messagesJson / roundNumber) on an
 * existing row — it deliberately does NOT touch mode / stateJson / status, which
 * the beacon doesn't carry and which would otherwise be reset to defaults,
 * restarting the FSM and polluting telemetry (#096). A brand-new row falls back
 * to the column defaults for those fields.
 */
export async function saveCoachingBeacon(params: {
  id: string;
  userId: string;
  reportId: string | null;
  roundNumber: number;
  maxRounds: number;
  messagesJson: string;
  sessionType: string;
  locale?: string;
}): Promise<void> {
  await sql`
    INSERT INTO "CoachingSession" (
      id, "userId", "reportId", "startedAt", "updatedAt",
      "roundNumber", "maxRounds", "messagesJson", "sessionType", "locale"
    )
    VALUES (
      ${params.id}, ${params.userId}, ${params.reportId}, NOW(), NOW(),
      ${params.roundNumber}, ${params.maxRounds}, ${params.messagesJson},
      ${params.sessionType}, ${params.locale ?? "en"}
    )
    ON CONFLICT (id) DO UPDATE SET
      "updatedAt" = NOW(),
      "roundNumber" = EXCLUDED."roundNumber",
      "messagesJson" = EXCLUDED."messagesJson"
    WHERE "CoachingSession"."userId" = EXCLUDED."userId"
  `;
}

export async function getCoachingSessionForUser(
  sessionId: string,
  userId: string,
): Promise<CoachingSessionRow | null> {
  const rows = await sql`
    SELECT *
    FROM "CoachingSession"
    WHERE "id" = ${sessionId} AND "userId" = ${userId}
    LIMIT 1
  `;
  return (rows[0] as CoachingSessionRow | undefined) ?? null;
}

export async function getRecentCoachingSessions(
  userId: string,
  limit = 5,
): Promise<CoachingSessionRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20));
  return (await sql`
    SELECT *
    FROM "CoachingSession"
    WHERE "userId" = ${userId}
      AND jsonb_array_length("messagesJson") > 0
    ORDER BY "updatedAt" DESC
    LIMIT ${safeLimit}
  `) as CoachingSessionRow[];
}

export async function saveCoachingTurnAudit(
  params: SaveCoachingTurnAuditParams,
): Promise<void> {
  const id = `${params.sessionId}:${params.turnNumber}`;
  const understanding = params.understanding;

  await sql`
    INSERT INTO "CoachingTurnAudit" (
      "id", "sessionId", "userId", "turnNumber", "strategyVersion", "mode",
      "primaryIntent", "coreQuestion", "importantFacts", "constraints",
      "desiredHelp", "ambiguities", "confidence", "correctionSignal",
      "needsRepair", "assistantResponseLength", "hasActionDraft",
      "hasRecommendation", "completedAt"
    )
    VALUES (
      ${id}, ${params.sessionId}, ${params.userId}, ${params.turnNumber},
      ${params.strategyVersion}, ${params.mode}, ${understanding.primaryIntent},
      ${understanding.coreQuestion}, ${JSON.stringify(understanding.importantFacts)},
      ${JSON.stringify(understanding.constraints)}, ${understanding.desiredHelp},
      ${JSON.stringify(understanding.ambiguities)}, ${understanding.confidence},
      ${params.correctionSignal}, ${params.needsRepair},
      ${params.assistantResponseLength}, ${params.hasActionDraft},
      ${params.hasRecommendation}, NOW()
    )
    ON CONFLICT ("sessionId", "turnNumber") DO UPDATE SET
      "strategyVersion" = EXCLUDED."strategyVersion",
      "mode" = EXCLUDED."mode",
      "primaryIntent" = EXCLUDED."primaryIntent",
      "coreQuestion" = EXCLUDED."coreQuestion",
      "importantFacts" = EXCLUDED."importantFacts",
      "constraints" = EXCLUDED."constraints",
      "desiredHelp" = EXCLUDED."desiredHelp",
      "ambiguities" = EXCLUDED."ambiguities",
      "confidence" = EXCLUDED."confidence",
      "correctionSignal" = EXCLUDED."correctionSignal",
      "needsRepair" = EXCLUDED."needsRepair",
      "assistantResponseLength" = EXCLUDED."assistantResponseLength",
      "hasActionDraft" = EXCLUDED."hasActionDraft",
      "hasRecommendation" = EXCLUDED."hasRecommendation",
      "completedAt" = NOW()
    WHERE "CoachingTurnAudit"."userId" = EXCLUDED."userId"
  `;
}

export async function markCoachingSessionSaved(
  sessionId: string,
): Promise<boolean> {
  try {
    await sql`
      UPDATE "CoachingSession" SET "savedToProfile" = true WHERE id = ${sessionId}
    `;
    return true;
  } catch (err) {
    console.error(
      `[coaching] Failed to mark session ${sessionId} as saved:`,
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export async function getCoachingSessionCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM "CoachingSession"
    WHERE "userId" = ${userId}
  `;
  return (rows[0]?.count as number) ?? 0;
}

/**
 * Sum the coaching rounds (user turns) a user has accumulated across their
 * coaching sessions. Sessions are persisted per-round with status 'active'
 * (see persistCoachingStream), so the live session is already in the table
 * mid-conversation. Pass `excludeSessionId` to leave the current session out:
 * the caller adds the live `round` separately, and counting it here too would
 * double-count and shrink the trial window. Prior sessions (completed or
 * abandoned) still count, so the trial limit can't be reset by abandoning one.
 */
export async function getTotalCoachingRoundsForUser(
  userId: string,
  excludeSessionId?: string,
): Promise<number> {
  const rows = excludeSessionId
    ? await sql`
        SELECT COALESCE(SUM("roundNumber"), 0)::int AS total
        FROM "CoachingSession"
        WHERE "userId" = ${userId} AND "id" <> ${excludeSessionId}
      `
    : await sql`
        SELECT COALESCE(SUM("roundNumber"), 0)::int AS total
        FROM "CoachingSession"
        WHERE "userId" = ${userId}
      `;
  return (rows[0]?.total as number) ?? 0;
}
