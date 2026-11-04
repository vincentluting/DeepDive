// ============================================================
// Invite Code Management — Cohort enrollment via invite codes
// ============================================================

import { sql } from "./connection";

// ── Types ────────────────────────────────────────

export interface InviteCodeRow {
  id: string;
  code: string;
  cohortId: string;
  researchGroup: "classic" | "immersive" | null;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  claimedByUserIds: string[];
  expiresAt: Date | null;
  adminNote: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Queries ──────────────────────────────────────

/** Create a new invite code */
export async function saveInviteCode(data: {
  code: string;
  cohortId: string;
  createdBy: string;
  maxUses?: number;
  expiresAt?: Date | null;
  researchGroup?: "classic" | "immersive" | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  const upperCode = data.code.toUpperCase().trim();

  await sql`
    INSERT INTO "InviteCode" ("id", "code", "cohortId", "createdBy", "maxUses", "expiresAt", "researchGroup")
    VALUES (
      ${id},
      ${upperCode},
      ${data.cohortId},
      ${data.createdBy},
      ${data.maxUses ?? 1},
      ${data.expiresAt?.toISOString() ?? null},
      ${data.researchGroup ?? null}
    )
  `;

  return id;
}

/**
 * Validate an invite code without claiming it.
 * Returns cohortId if valid, or a reason string if invalid.
 */
export async function validateInviteCode(code: string): Promise<
  | {
      valid: true;
      codeId: string;
      cohortId: string;
      researchGroup: "classic" | "immersive" | null;
    }
  | { valid: false; reason: string }
> {
  const upperCode = code.toUpperCase().trim();

  const rows = await sql`
    SELECT "id", "cohortId", "maxUses", "usedCount", "expiresAt", "isActive", "researchGroup"
    FROM "InviteCode"
    WHERE "code" = ${upperCode}
  `;

  if (rows.length === 0) {
    return { valid: false, reason: "Code not found" };
  }

  const row = rows[0];

  if (!row.isActive) {
    return { valid: false, reason: "Code deactivated" };
  }

  if (row.expiresAt && new Date(row.expiresAt as string) < new Date()) {
    return { valid: false, reason: "Code expired" };
  }

  if ((row.usedCount as number) >= (row.maxUses as number)) {
    return { valid: false, reason: "Code usage limit reached" };
  }

  return {
    valid: true,
    codeId: row.id as string,
    cohortId: row.cohortId as string,
    researchGroup: (row.researchGroup as "classic" | "immersive") ?? null,
  };
}

/**
 * Claim an invite code atomically.
 *
 * Bug-log #085 (+ #102): the previous implementation was a bare
 * `usedCount = usedCount + 1` with no capacity guard, while `validateInviteCode`
 * checked capacity in a separate SELECT. Two concurrent claims on a maxUses=1
 * code could both pass validation and both increment → over-enrollment, which
 * breaks one-code-one-participant research integrity. The capacity / active /
 * expiry checks now live in the UPDATE's WHERE clause so the check-and-increment
 * is a single atomic statement (TOCTOU-safe). `claimedByUserIds` is appended
 * only if the user isn't already present (idempotent on the JSONB array).
 *
 * @returns true if the claim succeeded; false if the code was full,
 *          deactivated, or expired (caller must treat false as a hard failure,
 *          NOT a transient error to retry).
 */
export async function claimInviteCode(
  codeId: string,
  userId: string,
): Promise<boolean> {
  // Fresh claim: consume one slot only if capacity remains, the code is
  // active/unexpired, AND this user hasn't already claimed it. The
  // `NOT (claimedByUserIds @> [userId])` guard makes the increment idempotent
  // per-user: a register-flow retry that re-enters after claiming once (e.g.
  // the User UPDATE failed on the first attempt) must NOT double-consume
  // capacity (codex review of #085 — the retry wraps claim + UPDATE together).
  const rows = await sql`
    UPDATE "InviteCode"
    SET
      "usedCount" = "usedCount" + 1,
      "claimedByUserIds" = "claimedByUserIds" || ${JSON.stringify([userId])}::jsonb,
      "updatedAt" = NOW()
    WHERE "id" = ${codeId}
      AND "usedCount" < "maxUses"
      AND "isActive" = true
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      AND NOT ("claimedByUserIds" @> ${JSON.stringify([userId])}::jsonb)
    RETURNING "id"
  `;
  if (rows.length > 0) return true;

  // No row updated. Two cases: (a) the code is full/inactive/expired, or
  // (b) this user already claimed it (idempotent re-entry). Distinguish them
  // so a retry returns success without consuming another slot.
  const already = await sql`
    SELECT 1 FROM "InviteCode"
    WHERE "id" = ${codeId}
      AND "claimedByUserIds" @> ${JSON.stringify([userId])}::jsonb
  `;
  return already.length > 0;
}

/** Toggle invite code active status */
export async function toggleInviteCode(
  codeId: string,
  isActive: boolean,
): Promise<void> {
  await sql`
    UPDATE "InviteCode"
    SET "isActive" = ${isActive}, "updatedAt" = NOW()
    WHERE "id" = ${codeId}
  `;
}

/** Update the admin-only assignment note for an invite code */
export async function updateInviteCodeNote(
  codeId: string,
  adminNote: string | null,
): Promise<void> {
  await sql`
    UPDATE "InviteCode"
    SET "adminNote" = ${adminNote}, "updatedAt" = NOW()
    WHERE "id" = ${codeId}
  `;
}

/**
 * Permanently delete an invite code.
 * Refuses to delete codes that have been claimed (usedCount > 0) — caller should deactivate those instead.
 */
export async function deleteInviteCode(
  codeId: string,
): Promise<{ deleted: boolean; reason?: "not_found" | "has_usage" }> {
  const rows = await sql`
    SELECT "usedCount" FROM "InviteCode" WHERE "id" = ${codeId} LIMIT 1
  `;
  if (rows.length === 0) return { deleted: false, reason: "not_found" };
  if ((rows[0].usedCount as number) > 0) {
    return { deleted: false, reason: "has_usage" };
  }
  await sql`DELETE FROM "InviteCode" WHERE "id" = ${codeId}`;
  return { deleted: true };
}

/** List all invite codes (admin) */
export async function listInviteCodes(): Promise<InviteCodeRow[]> {
  const rows = await sql`
    SELECT "id", "code", "cohortId", "researchGroup", "createdBy", "maxUses", "usedCount",
           "claimedByUserIds", "expiresAt", "adminNote", "isActive", "createdAt", "updatedAt"
    FROM "InviteCode"
    ORDER BY "createdAt" DESC
  `;

  return rows.map((r) => ({
    id: r.id as string,
    code: r.code as string,
    cohortId: r.cohortId as string,
    researchGroup: (r.researchGroup as "classic" | "immersive") ?? null,
    createdBy: r.createdBy as string,
    maxUses: r.maxUses as number,
    usedCount: r.usedCount as number,
    claimedByUserIds: Array.isArray(r.claimedByUserIds)
      ? (r.claimedByUserIds as string[])
      : [],
    expiresAt: r.expiresAt ? new Date(r.expiresAt as string) : null,
    adminNote: (r.adminNote as string) ?? null,
    isActive: r.isActive as boolean,
    createdAt: new Date(r.createdAt as string),
    updatedAt: new Date(r.updatedAt as string),
  }));
}

// ── Claimed-user progress (admin invite panel) ──────────────

/** Furthest journey step a claimed user has reached. */
export type ClaimedUserStep =
  | "registered"
  | "quickDive"
  | "deepDive"
  | "report"
  | "coaching";

export interface ClaimedUserProgress {
  userId: string;
  email: string;
  /** Account display name (User.name); null for the rare legacy row without one. */
  name: string | null;
  furthestStep: ClaimedUserStep;
  /** ISO timestamp — when the account was created (≈ when they joined via the code). */
  createdAt: string;
  /** ISO timestamp — last write to the user row; a proxy for "last active" / stall detection. */
  updatedAt: string;
  /** ISO 3166-1 alpha-2 registration country (sparsely populated); null when unknown. */
  country: string | null;
  /** Language of the user's most recent assessment (zh/en/…); null before any assessment. */
  language: string | null;
}

/**
 * Given a set of user IDs (e.g. an invite code's claimedByUserIds), return each
 * user's account identity (email + name), recruitment metadata (join time, last
 * activity, country, assessment language) and the furthest step they reached in
 * the journey pipeline.
 *
 * Deliberately has NO research-consent gate: invite codes include beta_2026
 * users who never give research consent, and the admin panel needs to show all
 * of them. Returns [] for empty input without issuing a query.
 */
export async function getClaimedUsersProgress(
  userIds: string[],
): Promise<ClaimedUserProgress[]> {
  // Defensive: a legacy InviteCode row can hold a non-array claimedByUserIds,
  // so a caller's flatMap may leak non-string ids in here. Drop anything unusable.
  const ids = userIds.filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return [];

  const rows = await sql`
    SELECT
      u."id" AS "userId",
      u."email",
      u."name",
      u."createdAt",
      u."updatedAt",
      u."registrationCountry" AS "country",
      (
        SELECT a."language" FROM (
          SELECT q2."language", q2."createdAt" FROM "QuickDiveResult" q2
            WHERE q2."userId" = u."id"
          UNION ALL
          SELECT s2."language", s2."createdAt" FROM "QuestionnaireSession" s2
            WHERE s2."userId" = u."id"
        ) a
        WHERE a."language" IS NOT NULL
        ORDER BY a."createdAt" DESC
        LIMIT 1
      ) AS "language",
      CASE
        WHEN cs."userId" IS NOT NULL THEN 'coaching'
        WHEN cr."userId" IS NOT NULL THEN 'report'
        WHEN dd."userId" IS NOT NULL THEN 'deepDive'
        WHEN qd."userId" IS NOT NULL THEN 'quickDive'
        ELSE 'registered'
      END AS "furthestStep"
    FROM "User" u
    LEFT JOIN (SELECT DISTINCT "userId" FROM "QuickDiveResult") qd
      ON qd."userId" = u."id"
    LEFT JOIN (
      SELECT DISTINCT "userId" FROM "QuestionnaireSession"
      WHERE "tier" = 'deep' AND "status" = 'completed'
    ) dd ON dd."userId" = u."id"
    LEFT JOIN (SELECT DISTINCT "userId" FROM "CareerReport") cr
      ON cr."userId" = u."id"
    LEFT JOIN (SELECT DISTINCT "userId" FROM "CoachingSession") cs
      ON cs."userId" = u."id"
    WHERE u."id" = ANY(${ids})
  `;

  return rows.map((r) => ({
    userId: r.userId as string,
    email: r.email as string,
    name: (r.name as string) ?? null,
    furthestStep: r.furthestStep as ClaimedUserStep,
    createdAt: new Date(r.createdAt as string).toISOString(),
    updatedAt: new Date(r.updatedAt as string).toISOString(),
    country: (r.country as string) ?? null,
    language: (r.language as string) ?? null,
  }));
}
