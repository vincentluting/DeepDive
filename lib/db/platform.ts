// ============================================================
// Platform — QuickDiveResult CRUD
//
// Table: QuickDiveResult
// Key fields: id, scoresJson (JSONB), archetypeCode, archetypeLabel,
//             language, userId, resultDataJson (JSONB), exploreMode
// Stores Quick Dive (5-minute) assessment results and RIASEC scores.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";

export async function saveQuickDiveResult(params: {
  scores: Record<string, number>;
  archetypeCode: string;
  archetypeLabel: string;
  language: string;
  userId?: string | null;
  anonymousId?: string | null;
  resultData?: Record<string, unknown> | null;
  exploreMode?: string;
  environment?: string;
  /** Product name is avatarGender; stored in legacy QuickDiveResult.chibiGender column. */
  avatarGender?: "male" | "female" | null;
  /** @deprecated Use avatarGender. */
  chibiGender?: "male" | "female" | null;
}): Promise<string> {
  const id = randomUUID();
  const mode = params.exploreMode || "narrative";
  const env = params.environment || "production";
  try {
    await sql`
      INSERT INTO "QuickDiveResult" ("id", "scoresJson", "archetypeCode", "archetypeLabel", "language", "userId", "anonymousId", "resultDataJson", "exploreMode", "environment", "chibiGender")
      VALUES (
        ${id},
        ${JSON.stringify(params.scores)}::jsonb,
        ${params.archetypeCode},
        ${params.archetypeLabel},
        ${params.language},
        ${params.userId ?? null},
        ${params.anonymousId ?? null},
        ${params.resultData ? JSON.stringify(params.resultData) : null}::jsonb,
        ${mode},
        ${env},
        ${params.avatarGender ?? params.chibiGender ?? null}
      )
    `;
  } catch (dbErr) {
    throw new Error(`saveQuickDiveResult DB insert failed`, { cause: dbErr });
  }
  return id;
}

export async function getQuickDiveReport(id: string): Promise<{
  id: string;
  archetypeCode: string;
  archetypeLabel: string;
  scoresJson: Record<string, number>;
  resultDataJson: Record<string, unknown> | null;
  language: string;
  userId: string | null;
  createdAt: string;
  exploreMode: string;
  avatarGender: "male" | "female" | null;
  /** @deprecated Use avatarGender. */
  chibiGender: "male" | "female" | null;
} | null> {
  const rows = await sql`
    SELECT "id", "archetypeCode", "archetypeLabel", "scoresJson", "resultDataJson", "language", "userId", "createdAt", "exploreMode", "chibiGender"
    FROM "QuickDiveResult"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  const cg = row.chibiGender as string | null;
  return {
    id: row.id as string,
    archetypeCode: row.archetypeCode as string,
    archetypeLabel: row.archetypeLabel as string,
    scoresJson: row.scoresJson as Record<string, number>,
    resultDataJson: (row.resultDataJson as Record<string, unknown>) ?? null,
    language: row.language as string,
    userId: (row.userId as string) ?? null,
    createdAt: String(row.createdAt),
    exploreMode: (row.exploreMode as string) || "narrative",
    avatarGender: cg === "male" || cg === "female" ? cg : null,
    chibiGender: cg === "male" || cg === "female" ? cg : null,
  };
}

export async function checkQuickDiveOwnership(
  id: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT "id" FROM "QuickDiveResult"
    WHERE "id" = ${id} AND "userId" = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function deleteQuickDiveReport(id: string): Promise<void> {
  await sql`DELETE FROM "QuickDiveResult" WHERE "id" = ${id}`;
}

/**
 * Delete all Quick Dive results for a user (used by retake flow).
 */
export async function deleteQuickDiveResultsByUser(
  userId: string,
): Promise<void> {
  await sql`DELETE FROM "QuickDiveResult" WHERE "userId" = ${userId}`;
}

/**
 * Claim an anonymous Quick Dive result by setting its userId.
 * Only claims if the record currently has no userId (prevents stealing).
 * Returns 'claimed' (newly claimed), 'already_owned' (idempotent — same user),
 * or 'conflict' (owned by a different user or result not found).
 */
export async function claimQuickDiveResult(
  resultId: string,
  userId: string,
): Promise<"claimed" | "already_owned" | "conflict"> {
  // Atomic UPDATE: only sets userId if currently NULL
  const result = await sql`
    UPDATE "QuickDiveResult"
    SET "userId" = ${userId}
    WHERE "id" = ${resultId} AND "userId" IS NULL
  `;
  if ((result as unknown as { count: number }).count > 0) return "claimed";

  // Row wasn't updated — check why
  const rows = await sql`
    SELECT "userId" FROM "QuickDiveResult" WHERE "id" = ${resultId}
  `;
  if (rows.length === 0) return "conflict";
  if (rows[0].userId === userId) return "already_owned";
  return "conflict";
}

/**
 * Lightweight check: does this user have at least one Quick Dive result?
 */
export async function hasQuickDiveResult(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM "QuickDiveResult"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getLatestQuickDiveByUserId(userId: string): Promise<{
  archetypeCode: string;
  archetypeLabel: string;
  scoresJson: Record<string, number>;
  resultDataJson: Record<string, unknown> | null;
  exploreMode: string;
  avatarGender: "male" | "female" | null;
  /** @deprecated Use avatarGender. */
  chibiGender: "male" | "female" | null;
} | null> {
  const rows = await sql`
    SELECT "archetypeCode", "archetypeLabel", "scoresJson", "resultDataJson", "exploreMode", "chibiGender"
    FROM "QuickDiveResult"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const cg = rows[0].chibiGender as string | null;
  return {
    archetypeCode: rows[0].archetypeCode as string,
    archetypeLabel: rows[0].archetypeLabel as string,
    scoresJson: rows[0].scoresJson as Record<string, number>,
    resultDataJson: (rows[0].resultDataJson as Record<string, unknown>) ?? null,
    exploreMode: (rows[0].exploreMode as string) ?? "classic",
    avatarGender: cg === "male" || cg === "female" ? cg : null,
    chibiGender: cg === "male" || cg === "female" ? cg : null,
  };
}
