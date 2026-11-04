// ============================================================
// User Data — GDPR operations (export, deletion, summary)
//
// Tables: AssessmentResult, CareerReport, QuickDiveResult,
//         CoachingSession, PersonalProfile, UserDeletionRequest, UserSession
// Provides: data summary counts, full export payload, deletion scheduling,
//           cancellation, and session clearing for GDPR compliance.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";

// ── User Data Summary ─────

export interface UserDataSummary {
  assessments: number;
  reports: number;
  quickDive: number;
  coaching: number;
  profile: number;
  /** Whether the user has opted into the Archetype Companion social layer. */
  companionEnabled: boolean;
  /** Count of Companion friend-requests / friendships involving the user. */
  companionConnections: number;
  /** Count of Companion blocks the user has issued. */
  companionBlocks: number;
}

export async function getUserDataSummary(
  userId: string,
): Promise<UserDataSummary> {
  const [
    assessments,
    reports,
    quickDive,
    coaching,
    profile,
    companionFlag,
    companionConnections,
    companionBlocks,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM "AssessmentResult" WHERE "userId" = ${userId}`.catch(
      (err) => {
        console.warn(
          "[user-data] AssessmentResult count query failed:",
          err instanceof Error ? err.message : err,
        );
        return [{ count: 0 }];
      },
    ),
    sql`SELECT COUNT(*) as count FROM "CareerReport" WHERE "userId" = ${userId}`.catch(
      (err) => {
        console.warn(
          "[user-data] CareerReport count query failed:",
          err instanceof Error ? err.message : err,
        );
        return [{ count: 0 }];
      },
    ),
    sql`SELECT COUNT(*) as count FROM "QuickDiveResult" WHERE "userId" = ${userId} AND "resultDataJson" IS NOT NULL`.catch(
      (err) => {
        console.warn(
          "[user-data] QuickDiveResult count query failed:",
          err instanceof Error ? err.message : err,
        );
        return [{ count: 0 }];
      },
    ),
    sql`SELECT COUNT(*) as count FROM "CoachingSession" WHERE "userId" = ${userId}`.catch(
      (err) => {
        console.warn(
          "[user-data] CoachingSession count query failed:",
          err instanceof Error ? err.message : err,
        );
        return [{ count: 0 }];
      },
    ),
    sql`SELECT COUNT(*) as count FROM "PersonalProfile" WHERE "userId" = ${userId}`.catch(
      (err) => {
        console.warn(
          "[user-data] PersonalProfile count query failed:",
          err instanceof Error ? err.message : err,
        );
        return [{ count: 0 }];
      },
    ),
    sql`SELECT "socialEnabled" FROM "User" WHERE "id" = ${userId}`.catch(() => [
      { socialEnabled: false },
    ]),
    sql`SELECT COUNT(*) as count FROM "CompanionConnection" WHERE "requesterId" = ${userId} OR "recipientId" = ${userId}`.catch(
      () => [{ count: 0 }],
    ),
    sql`SELECT COUNT(*) as count FROM "CompanionBlock" WHERE "blockerId" = ${userId}`.catch(
      () => [{ count: 0 }],
    ),
  ]);

  return {
    assessments: Number(assessments[0]?.count ?? 0),
    reports: Number(reports[0]?.count ?? 0),
    quickDive: Number(quickDive[0]?.count ?? 0),
    coaching: Number(coaching[0]?.count ?? 0),
    profile: Number(profile[0]?.count ?? 0),
    companionEnabled: Boolean(companionFlag[0]?.socialEnabled ?? false),
    companionConnections: Number(companionConnections[0]?.count ?? 0),
    companionBlocks: Number(companionBlocks[0]?.count ?? 0),
  };
}

// ── User Data Export ─────

export interface UserExportData {
  assessmentRows: Record<string, unknown>[];
  reportRows: Record<string, unknown>[];
  quickDiveRows: Record<string, unknown>[];
  coachingRows: Record<string, unknown>[];
  /** Companion social-layer data — null when the user never opted in. */
  companionProfile: Record<string, unknown> | null;
  companionConnectionRows: Record<string, unknown>[];
  companionBlockRows: Record<string, unknown>[];
  /** Reports the user has filed (reporterId = userId). Reports filed
   *  AGAINST the user are admin-side metadata and intentionally excluded. */
  companionReportRows: Record<string, unknown>[];
  /** User.socialEnabled flag at export time. */
  companionEnabled: boolean;
  partialFailures: string[];
}

export async function getUserDataForExport(
  userId: string,
): Promise<UserExportData> {
  const partialFailures: string[] = [];

  const [
    assessmentRows,
    reportRows,
    quickDiveRows,
    coachingRows,
    companionProfileRows,
    companionConnectionRows,
    companionBlockRows,
    companionReportRows,
    socialFlagRows,
  ] = await Promise.all([
    sql`SELECT "id", "sessionId", "version", "createdAt" FROM "AssessmentResult" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("assessments");
        return [];
      },
    ),
    sql`SELECT "id", "reportJson", "version", "createdAt" FROM "CareerReport" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("reports");
        return [];
      },
    ),
    sql`SELECT "id", "archetypeCode", "archetypeLabel", "exploreMode", "scoresJson", "resultDataJson", "language", "createdAt" FROM "QuickDiveResult" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("quick_dive");
        return [];
      },
    ),
    sql`SELECT "id", "sessionType", "messagesJson", "startedAt", "endedAt" FROM "CoachingSession" WHERE "userId" = ${userId} ORDER BY "startedAt" DESC`.catch(
      () => {
        partialFailures.push("coaching_sessions");
        return [];
      },
    ),
    // Companion social-layer rows (GDPR-completeness — see plan § "GDPR")
    sql`SELECT "id", "displayName", "bio", "archetypeCode", "scoresJson", "locale", "visibility", "createdAt", "updatedAt" FROM "CompanionProfile" WHERE "userId" = ${userId}`.catch(
      () => {
        partialFailures.push("companion_profile");
        return [];
      },
    ),
    sql`SELECT "id", "requesterId", "recipientId", "status", "requesterMessage", "acceptedAt", "declinedAt", "createdAt" FROM "CompanionConnection" WHERE "requesterId" = ${userId} OR "recipientId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("companion_connections");
        return [];
      },
    ),
    sql`SELECT "id", "blockerId", "blockedId", "reason", "createdAt" FROM "CompanionBlock" WHERE "blockerId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("companion_blocks");
        return [];
      },
    ),
    // Reports the user has filed (T&S submissions). Reports filed AGAINST
    // the user are admin-side audit data, intentionally not exported here.
    sql`SELECT "id", "reportedId", "reason", "details", "status", "reviewedAt", "createdAt" FROM "CompanionReport" WHERE "reporterId" = ${userId} ORDER BY "createdAt" DESC`.catch(
      () => {
        partialFailures.push("companion_reports_filed");
        return [];
      },
    ),
    sql`SELECT "socialEnabled" FROM "User" WHERE "id" = ${userId}`.catch(() => [
      { socialEnabled: false },
    ]),
  ]);

  return {
    assessmentRows: assessmentRows as Record<string, unknown>[],
    reportRows: reportRows as Record<string, unknown>[],
    quickDiveRows: quickDiveRows as Record<string, unknown>[],
    coachingRows: coachingRows as Record<string, unknown>[],
    companionProfile:
      (companionProfileRows[0] as Record<string, unknown>) ?? null,
    companionConnectionRows: companionConnectionRows as Record<
      string,
      unknown
    >[],
    companionBlockRows: companionBlockRows as Record<string, unknown>[],
    companionReportRows: companionReportRows as Record<string, unknown>[],
    companionEnabled: Boolean(socialFlagRows[0]?.socialEnabled ?? false),
    partialFailures,
  };
}

// ── User Password ─────

export async function getUserPasswordHash(
  userId: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT "passwordHash" FROM "User" WHERE "id" = ${userId}
  `;
  if (rows.length === 0) return null;
  return rows[0].passwordHash as string;
}

// ── Deletion Request Management ─────

export interface DeletionRequest {
  id: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  cancelledAt: string | null;
}

export async function getPendingDeletionRequest(
  userId: string,
): Promise<DeletionRequest | null> {
  const rows = await sql<DeletionRequest>`
    SELECT "id", "requestedAt", "scheduledDeletionAt", "cancelledAt"
    FROM "UserDeletionRequest"
    WHERE "userId" = ${userId} AND "executedAt" IS NULL AND "cancelledAt" IS NULL
  `;
  if (rows.length === 0) return null;
  return rows[0];
}

export async function createDeletionRequest(
  userId: string,
  scheduledDate: Date,
): Promise<void> {
  const id = randomUUID();
  await sql`
    INSERT INTO "UserDeletionRequest" ("id", "userId", "scheduledDeletionAt")
    VALUES (${id}, ${userId}, ${scheduledDate})
    ON CONFLICT ("userId") DO UPDATE SET
      "requestedAt" = NOW(),
      "scheduledDeletionAt" = ${scheduledDate},
      "cancelledAt" = NULL,
      "executedAt" = NULL
  `;
}

export async function clearUserSessions(userId: string): Promise<void> {
  try {
    await sql`DELETE FROM "UserSession" WHERE "userId" = ${userId}`;
  } catch (dbErr) {
    throw new Error(`clearUserSessions failed for user ${userId}`, {
      cause: dbErr,
    });
  }
}

/**
 * Hard-delete a user and ALL associated data.
 *
 * Three phases (order matters for FK constraints):
 *   Phase 1 — NO ACTION / RESTRICT tables that BLOCK user deletion
 *   Phase 2 — SET NULL tables that would leave orphan rows (userId → NULL)
 *   Phase 3 — User deletion (CASCADE handles the rest)
 *
 * Shared by: admin delete, test cleanup, GDPR execution.
 */
export async function hardDeleteUser(userId: string): Promise<void> {
  await cleanupUserDependencies([userId]);
  await sql`DELETE FROM "User" WHERE "id" = ${userId}`;
}

/**
 * Clean up all non-CASCADE foreign key references before deleting users.
 * Must run BEFORE the User row is removed.
 */
export async function cleanupUserDependencies(
  userIds: string[],
): Promise<void> {
  // ── Phase 1: NO ACTION / RESTRICT — block deletion if not cleaned ──
  await sql`DELETE FROM "CoachingFeedback" WHERE "sessionId" IN (SELECT "id" FROM "CoachingSession" WHERE "userId" = ANY(${userIds}))`;
  await sql`DELETE FROM "CoachingSession" WHERE "userId" = ANY(${userIds})`;
  await sql`UPDATE "InviteCode" SET "createdBy" = NULL WHERE "createdBy" = ANY(${userIds})`;

  // ── Phase 2: SET NULL tables — pre-delete to prevent orphan rows ──
  await sql`DELETE FROM "CareerReport" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "PersonalProfile" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "AssessmentResult" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "QuestionnaireSession" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "QuickDiveResult" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "RealConditions" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "ReportEngagement" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "CoachingReviewPool" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "CoachingTurnEval" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "CoachingTheme" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "CoachMessage" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "UserDeletionRequest" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "ConsentRecord" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "ReportNPS" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "PrePostAssessment" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "UserAchievement" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "UserFunnel" WHERE "userId" = ANY(${userIds})`;
  await sql`DELETE FROM "ReportReaction" WHERE "userId" = ANY(${userIds})`;
}

export async function cancelDeletionRequest(userId: string): Promise<boolean> {
  const result = await sql`
    UPDATE "UserDeletionRequest"
    SET "cancelledAt" = NOW()
    WHERE "userId" = ${userId} AND "executedAt" IS NULL AND "cancelledAt" IS NULL
    RETURNING "id"
  `;
  return result.length > 0;
}
