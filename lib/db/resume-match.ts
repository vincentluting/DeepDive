// ============================================================
// ResumeMatchResult — persisted "Career Evidence" CRUD
//
// Table: ResumeMatchResult (migration 078)
// Holds the parsed resume + RIASEC match output so it survives across
// sessions, reloads, and report regenerates. Supersession is soft — old
// rows are kept for thesis provenance and audit.
// ============================================================

import { randomUUID } from "crypto";
import { sql } from "./connection";
import type { ResumeData, ResumeMatchResult } from "@/lib/resume/types";

export type ResumeEvidenceSource = "resume" | "linkedin" | "portfolio";
export type ResumeFlowVersion = "v1-inline" | "v2-dialog";

export interface ResumeMatchRow {
  id: string;
  assessmentId: string;
  userId: string | null;
  sourceType: ResumeEvidenceSource;
  fileName: string | null;
  fileType: string | null;
  resumeData: ResumeData;
  matchResult: ResumeMatchResult;
  flowVersion: ResumeFlowVersion;
  supersededAt: Date | null;
  createdAt: Date;
}

interface CreateArgs {
  assessmentId: string;
  userId: string | null;
  sourceType?: ResumeEvidenceSource;
  fileName: string | null;
  fileType: string | null;
  resumeData: ResumeData;
  matchResult: ResumeMatchResult;
  flowVersion?: ResumeFlowVersion;
}

function rowToModel(raw: Record<string, unknown>): ResumeMatchRow {
  return {
    id: raw.id as string,
    assessmentId: raw.assessmentId as string,
    userId: (raw.userId as string | null) ?? null,
    sourceType: raw.sourceType as ResumeEvidenceSource,
    fileName: (raw.fileName as string | null) ?? null,
    fileType: (raw.fileType as string | null) ?? null,
    resumeData: raw.resumeDataJson as ResumeData,
    matchResult: raw.matchResultJson as ResumeMatchResult,
    flowVersion: raw.flowVersion as ResumeFlowVersion,
    supersededAt: raw.supersededAt
      ? new Date(raw.supersededAt as string)
      : null,
    createdAt: new Date(raw.createdAt as string),
  };
}

/**
 * Mark every active ResumeMatchResult for an assessment as superseded.
 * Idempotent; returns the number of rows affected.
 *
 * Call this before inserting a fresh row so the partial unique index
 * (one active row per assessment) is respected.
 */
export async function supersedeActiveResumeMatches(
  assessmentId: string,
): Promise<number> {
  const rows = await sql`
    UPDATE "ResumeMatchResult"
      SET "supersededAt" = NOW()
    WHERE "assessmentId" = ${assessmentId}
      AND "supersededAt" IS NULL
    RETURNING "id"
  `;
  return rows.length;
}

/**
 * Persist a new resume match. The supersede of any previously-active row is
 * combined with the INSERT into a single CTE statement so the two writes are
 * atomic: if the INSERT fails (DB error, concurrent conflict on the partial
 * unique index, validation trap), the CTE rolls back and the prior active
 * row stays intact. Avoids the "a failed retry silently wiped out my
 * previous evidence" failure mode flagged in cross-review.
 *
 * Note: Neon's HTTP driver issues each sql`` tag as its own HTTP request and
 * does NOT carry multi-statement transactions across tags, so we cannot
 * wrap two separate statements in a transaction. The CTE is the right
 * abstraction here — the database plans and executes it as one statement.
 */
export async function createResumeMatchResult(
  args: CreateArgs,
): Promise<string> {
  const id = randomUUID();
  const resumeDataStr = JSON.stringify(args.resumeData);
  const matchResultStr = JSON.stringify(args.matchResult);

  try {
    await sql`
      WITH superseded AS (
        UPDATE "ResumeMatchResult"
          SET "supersededAt" = NOW()
        WHERE "assessmentId" = ${args.assessmentId}
          AND "supersededAt" IS NULL
        RETURNING "id"
      )
      INSERT INTO "ResumeMatchResult" (
        "id",
        "assessmentId",
        "userId",
        "sourceType",
        "fileName",
        "fileType",
        "resumeDataJson",
        "matchResultJson",
        "flowVersion"
      )
      VALUES (
        ${id},
        ${args.assessmentId},
        ${args.userId},
        ${args.sourceType ?? "resume"},
        ${args.fileName},
        ${args.fileType},
        ${resumeDataStr}::jsonb,
        ${matchResultStr}::jsonb,
        ${args.flowVersion ?? "v2-dialog"}
      )
    `;
  } catch (err) {
    throw new Error(
      `createResumeMatchResult DB insert failed for assessment ${args.assessmentId}`,
      { cause: err },
    );
  }

  return id;
}

/**
 * Load the latest non-superseded resume match for an assessment, or null
 * if the user never uploaded (or explicitly superseded every upload).
 *
 * Consumed by the report generator to decide whether to enrich narratives
 * with alignedDimensions / conflictingDimensions.
 */
export async function getLatestActiveResumeMatch(
  assessmentId: string,
): Promise<ResumeMatchRow | null> {
  const rows = await sql`
    SELECT *
    FROM "ResumeMatchResult"
    WHERE "assessmentId" = ${assessmentId}
      AND "supersededAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToModel(rows[0] as Record<string, unknown>);
}

export async function getLatestActiveResumeMatchForUser(
  userId: string,
): Promise<ResumeMatchRow | null> {
  const rows = await sql`
    SELECT *
    FROM "ResumeMatchResult"
    WHERE "userId" = ${userId}
      AND "supersededAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToModel(rows[0] as Record<string, unknown>);
}

/**
 * Full history (including superseded rows) for a given assessment.
 * Primarily used by admin/thesis export tooling — regular product paths
 * should prefer getLatestActiveResumeMatch.
 */
export async function listResumeMatchHistory(
  assessmentId: string,
): Promise<ResumeMatchRow[]> {
  const rows = await sql`
    SELECT *
    FROM "ResumeMatchResult"
    WHERE "assessmentId" = ${assessmentId}
    ORDER BY "createdAt" DESC
  `;
  return rows.map((r) => rowToModel(r as Record<string, unknown>));
}
