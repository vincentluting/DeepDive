// ============================================================
// Assessments — AssessmentResult CRUD
//
// Table: AssessmentResult
// Key fields: id, sessionId, userId, resultJson (JSONB), confidence, version ('2.0'|'3.0')
// Stores the output of runScoringPipelineV3() (v3.0: IPIP-60 + TwIVI + SJT).
// Historical v2.0 rows (IPIP-NEO-120 + PVQ-21) still readable via version='2.0'. v3.0 uses TwIVI.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { AssessmentResult } from "@/lib/types";
import type { AssessmentResultV3 } from "@/lib/types/assessment";
import type { RIASECDimension, BigFiveDimension } from "@/lib/types/dimensions";
import { getLatestQuickDiveByUserId } from "./platform";
import { getCanonicalRiasec } from "./riasec-canonical";
import { buildArchetype } from "@/lib/scoring/riasec-utils";
import { deriveNormReferencedCognitiveStyle } from "@/lib/psychometrics/big-five-norms";

const BIG_FIVE_KEYS: BigFiveDimension[] = [
  "neuroticism",
  "extraversion",
  "openness",
  "agreeableness",
  "conscientiousness",
];

/**
 * F15 — storage-boundary norm-referencing of cognitive style.
 *
 * The (frozen) scoring pipeline still emits MBTI-style letters cut at the raw
 * scale midpoint (3.0). Big Five self-reports are positively elevated, so that
 * cut over-assigns the high pole (~86% J, 92% F/N empirically). We replace the
 * STORED cognitiveStyleCode with the population-median (norm-referenced)
 * version so the research record matches what the profile layer displays.
 *
 * Interim shim: when the norm-referenced derivation moves into the scoring
 * source itself (requires unfreezing lib/scoring/), this becomes a no-op and
 * can be removed. The legacy value remains reproducible via
 * deriveCognitiveStyleFromBigFive(). See lib/psychometrics/big-five-norms.ts.
 */
function normReferenceStoredCognitiveStyle<
  T extends AssessmentResult | AssessmentResultV3,
>(result: T): T {
  const domains = (result.bigFive as { domains?: Record<string, number> })
    ?.domains;
  if (!domains || !result.cognitiveStyleCode) return result;
  if (!BIG_FIVE_KEYS.every((k) => typeof domains[k] === "number"))
    return result;
  return {
    ...result,
    cognitiveStyleCode: deriveNormReferencedCognitiveStyle(
      domains as Record<BigFiveDimension, number>,
    ),
  };
}

/**
 * Lightweight runtime check for JSONB → AssessmentResult.
 * Ensures critical top-level fields exist before casting.
 * Returns null if the data is corrupted or incompatible.
 */
function validateAssessmentJson(raw: unknown): AssessmentResult | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  // Both v2.0 and v3.0 must have these
  if (!data.id || !data.sessionId || !data.bigFive || !data.schwartz)
    return null;
  if (!data.riasecNormalized || typeof data.riasecNormalized !== "object")
    return null;
  return data as unknown as AssessmentResult;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function deriveRawValueScores(
  assessment: AssessmentResult,
): { enhancement: number; transcendence: number } | undefined {
  const raw = assessment.schwartz?.raw as Record<string, unknown> | undefined;
  if (!raw) return undefined;

  const achievement = getNumber(raw.achievement);
  const power = getNumber(raw.power);
  const benevolence = getNumber(raw.benevolence);
  const universalism = getNumber(raw.universalism);

  if (
    achievement === null ||
    power === null ||
    benevolence === null ||
    universalism === null
  ) {
    return undefined;
  }

  return {
    enhancement: (achievement + power) / 2,
    transcendence: (benevolence + universalism) / 2,
  };
}

/**
 * Save AssessmentResult (Deep Dive questionnaire).
 * version='3.0' for current pipeline (IPIP-60 + TwIVI + SJT).
 * Optional idempotencyKey prevents duplicate rows on retries.
 */
export async function saveAssessmentResult(
  result: AssessmentResult | AssessmentResultV3,
  userId?: string,
  version: "2.0" | "3.0" = "2.0",
  idempotencyKey?: string,
): Promise<string> {
  // If idempotencyKey provided, check for existing result first
  if (idempotencyKey) {
    const existing = await sql`
      SELECT "id" FROM "AssessmentResult"
      WHERE "idempotencyKey" = ${idempotencyKey}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return existing[0].id as string;
    }
  }

  // F15: persist the norm-referenced cognitive style (see helper above).
  const toStore = normReferenceStoredCognitiveStyle(result);
  const id = toStore.id || randomUUID();
  let resultJsonStr: string;
  try {
    resultJsonStr = JSON.stringify(toStore);
  } catch (serErr) {
    throw new Error(
      `Failed to serialize AssessmentResult for session ${result.sessionId}: ${serErr instanceof Error ? serErr.message : "unknown error"}`,
      { cause: serErr },
    );
  }
  try {
    await sql`
      INSERT INTO "AssessmentResult" ("id", "sessionId", "userId", "resultJson", "confidence", "version", "idempotencyKey")
      VALUES (
        ${id},
        ${result.sessionId},
        ${userId ?? null},
        ${resultJsonStr}::jsonb,
        ${null},
        ${version},
        ${idempotencyKey ?? null}
      )
    `;
  } catch (dbErr) {
    // Handle unique constraint violation on idempotencyKey (concurrent request)
    if (idempotencyKey && (dbErr as { code?: string }).code === "23505") {
      const existing = await sql`
        SELECT "id" FROM "AssessmentResult"
        WHERE "idempotencyKey" = ${idempotencyKey}
        LIMIT 1
      `;
      if (existing.length > 0) return existing[0].id as string;
    }
    throw new Error(
      `saveAssessmentResult DB insert failed for session ${result.sessionId}`,
      { cause: dbErr },
    );
  }
  return id;
}

/**
 * Get an assessment result by ID.
 * Returns v2.0 or v3.0 results.
 */
export async function getAssessmentResult(
  assessmentId: string,
): Promise<AssessmentResult | null> {
  const rows = await sql`
    SELECT "resultJson", "version" FROM "AssessmentResult"
    WHERE "id" = ${assessmentId} AND "version" IN ('2.0', '3.0')
  `;
  if (rows.length === 0) return null;
  return validateAssessmentJson(rows[0].resultJson);
}

/**
 * Get the raw owner of an assessment row without loading/validating the JSON.
 * Returns the assessment's userId and sessionId if the row exists.
 *
 * USE THIS at route boundaries before invoking any derived-content trigger
 * (report generation, pipeline creation, etc.). getEffectiveAssessment
 * intentionally does NOT enforce ownership — it merges in the caller's own
 * QuickDive data, so passing a victim's assessmentId with an attacker's
 * userId silently returns the victim's data. See 2026-04-22 security audit.
 */
export async function getAssessmentOwner(
  assessmentId: string,
): Promise<{ userId: string | null; sessionId: string | null } | null> {
  const rows = (await sql`
    SELECT "userId", "sessionId" FROM "AssessmentResult"
    WHERE "id" = ${assessmentId}
  `) as Array<{ userId: string | null; sessionId: string | null }>;
  return rows[0] ?? null;
}

/**
 * Verify that a user owns an assessment, with a legacy fallback through
 * QuestionnaireSession ownership. Returns:
 *   - "owner": userId matches (directly or via linked session)
 *   - "not-found": assessment row doesn't exist
 *   - "forbidden": row exists but the user doesn't own it
 *
 * Why the session fallback: some historical AssessmentResult rows have
 * `userId = null` because they were created before the auth backfill
 * paths existed. Their QuestionnaireSession row typically already carries
 * the correct userId, so we accept that as proof of ownership. For any
 * row where both are null (truly anonymous), callers must reject — we
 * return "forbidden" (not "owner") in that case.
 */
export async function verifyAssessmentOwnership(
  assessmentId: string,
  userId: string,
): Promise<"owner" | "not-found" | "forbidden"> {
  const owner = await getAssessmentOwner(assessmentId);
  if (!owner) return "not-found";

  if (owner.userId) {
    return owner.userId === userId ? "owner" : "forbidden";
  }

  // Legacy path: AssessmentResult.userId is null. Fall through to the
  // linked session.
  if (!owner.sessionId) return "forbidden";
  const sessionRows = (await sql`
    SELECT "userId" FROM "QuestionnaireSession"
    WHERE "id" = ${owner.sessionId}
    LIMIT 1
  `) as Array<{ userId: string | null }>;
  const sessionUserId = sessionRows[0]?.userId ?? null;
  if (sessionUserId === userId) return "owner";
  return "forbidden";
}

/**
 * Get assessment with RIASEC overridden by latest Quick Dive.
 *
 * The DD assessment freezes RIASEC at scoring time, but QD can be retaken.
 * This is the SINGLE merge point — all API routes that need current RIASEC
 * should call this instead of getAssessmentResult() + manual merging.
 *
 * Ownership: when userId is provided, ownership is enforced via
 * verifyAssessmentOwnership. A forbidden/not-found result returns null,
 * indistinguishable from "assessment doesn't exist" — callers already treat
 * null as a 404. Anonymous flows (no userId) intentionally skip the check
 * and never get a QD merge.
 *
 * Returns null when: assessment doesn't exist OR the caller's userId doesn't
 * own it. Returns the assessment (with QD merge when userId provided) on owner.
 */
export async function getEffectiveAssessment(
  assessmentId: string,
  userId?: string,
): Promise<AssessmentResult | null> {
  if (userId) {
    const ownership = await verifyAssessmentOwnership(assessmentId, userId);
    if (ownership !== "owner") return null;
  }

  const assessment = await getAssessmentResult(assessmentId);
  if (!assessment || !userId) return assessment;

  try {
    const qd = await getLatestQuickDiveByUserId(userId);
    if (!qd) return assessment;

    const canonical = getCanonicalRiasec(qd);
    const latestRiasec = canonical.riasecNormalized as Record<
      RIASECDimension,
      number
    >;
    // Use QD's orientation (raw-mean-based) as authoritative source,
    // not DD's stored orientation which may have been computed with
    // ipsative centering (pre-fix data). Both now use raw means,
    // but QD canonical has always been raw-based.
    const valueScores =
      canonical.archetype.valueScores ?? deriveRawValueScores(assessment);
    const recomputedArchetype = buildArchetype(
      latestRiasec,
      canonical.archetype.orientation,
      valueScores,
    );

    return {
      ...assessment,
      riasecNormalized: latestRiasec,
      archetype: recomputedArchetype,
    };
  } catch {
    return assessment;
  }
}

export async function getLatestSessionIdForUser(
  userId: string,
): Promise<string | null> {
  try {
    const rows = await sql`
      SELECT "sessionId" FROM "AssessmentResult"
      WHERE "userId" = ${userId} AND "version" IN ('2.0', '3.0')
      ORDER BY "createdAt" DESC LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rows[0].sessionId as string;
  } catch (error) {
    console.error("Failed to fetch latest session for user:", error);
    return null;
  }
}

/**
 * Get assessment by session — returns v2.0 or v3.0 results.
 */
export async function getAssessmentResultBySession(
  sessionId: string,
): Promise<AssessmentResult | null> {
  const rows = await sql`
    SELECT "resultJson", "version" FROM "AssessmentResult"
    WHERE "sessionId" = ${sessionId} AND "version" IN ('2.0', '3.0')
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return validateAssessmentJson(rows[0].resultJson);
}

export async function getLatestAssessmentResultJsonByUserId(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const rows = await sql`
    SELECT "resultJson" FROM "AssessmentResult"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  const json = rows[0].resultJson;
  if (typeof json === "string") {
    try {
      return JSON.parse(json);
    } catch {
      console.error(`[assessments] Corrupted resultJson for user ${userId}`);
      return null;
    }
  }
  return json as Record<string, unknown>;
}

/**
 * Get the latest assessment for a user, including its DB row ID.
 * Returns both the parsed result and the row ID for updates.
 */
export async function getLatestAssessmentForUser(userId: string): Promise<{
  id: string;
  result: AssessmentResult;
} | null> {
  const rows = await sql`
    SELECT "id", "resultJson" FROM "AssessmentResult"
    WHERE "userId" = ${userId} AND "version" = '3.0'
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  const result = validateAssessmentJson(rows[0].resultJson);
  if (!result) return null;
  return { id: rows[0].id as string, result };
}

/**
 * Update RIASEC + archetype in an existing assessment's resultJson.
 * Used by partial rescore when Quick Dive is retaken.
 */
export async function updateAssessmentRiasec(
  assessmentId: string,
  updatedResultJson: Record<string, unknown>,
): Promise<void> {
  try {
    const rows = await sql`
      UPDATE "AssessmentResult"
      SET "resultJson" = ${JSON.stringify(updatedResultJson)}::jsonb
      WHERE "id" = ${assessmentId}
      RETURNING "id"
    `;
    if (rows.length === 0) {
      console.warn(
        `[assessments] updateAssessmentRiasec: no rows updated for ${assessmentId}`,
      );
    }
  } catch (err) {
    throw new Error(`Failed to update RIASEC for assessment ${assessmentId}`, {
      cause: err,
    });
  }
}

export async function backfillAssessmentUserId(
  assessmentId: string,
  userId: string,
): Promise<void> {
  try {
    await sql`
      UPDATE "AssessmentResult" SET "userId" = ${userId}
      WHERE "id" = ${assessmentId} AND "userId" IS NULL
    `;
  } catch (err) {
    throw new Error(
      `Failed to backfill userId for assessment ${assessmentId}`,
      { cause: err },
    );
  }
}

/**
 * Delete all AssessmentResult rows for a session, returning the first deleted ID
 * (used to find the linked CareerReport before deletion).
 */
export async function deleteAssessmentsBySession(
  sessionId: string,
): Promise<string | null> {
  const rows = await sql`
    DELETE FROM "AssessmentResult"
    WHERE "sessionId" = ${sessionId}
    RETURNING "id"
  `;
  return (rows[0]?.id as string) ?? null;
}
