// ============================================================
// Archetype Companion — DB Access Layer
//
// Tables: CompanionProfile, CompanionConnection, CompanionBlock,
//         CompanionReport, plus User.socialEnabled flag.
//
// Race protection notes:
//   - acceptConnectionRequest() guards on status='pending' so a second
//     concurrent accept becomes a no-op (returns false).
//   - createConnectionRequest() relies on the UNIQUE(requesterId,recipientId)
//     constraint and reports duplicates rather than throwing.
// ============================================================

import { sql } from "./connection";
import type {
  CompanionBlock,
  CompanionConnection,
  CompanionConnectionBuckets,
  CompanionConnectionBucketsWithProfiles,
  CompanionConnectionStatus,
  CompanionConnectionWithProfile,
  CompanionLocale,
  CompanionProfile,
  CompanionReport,
  CompanionReportReason,
  CompanionReportStatus,
  CompanionRiasecScores,
  CompanionVisibility,
} from "@/lib/types/companion";

// ── Row → Domain mappers ─────────────────────────────────────

function rowToProfile(r: Record<string, unknown>): CompanionProfile {
  return {
    id: r.id as string,
    userId: r.userId as string,
    displayName: r.displayName as string,
    bio: (r.bio as string | null) ?? null,
    archetypeCode: r.archetypeCode as string,
    scoresJson: r.scoresJson as CompanionRiasecScores,
    locale: r.locale as CompanionLocale,
    visibility: r.visibility as CompanionVisibility,
    createdAt: new Date(r.createdAt as string),
    updatedAt: new Date(r.updatedAt as string),
  };
}

function rowToConnection(r: Record<string, unknown>): CompanionConnection {
  return {
    id: r.id as string,
    requesterId: r.requesterId as string,
    recipientId: r.recipientId as string,
    status: r.status as CompanionConnectionStatus,
    requesterMessage: (r.requesterMessage as string | null) ?? null,
    acceptedAt: r.acceptedAt ? new Date(r.acceptedAt as string) : null,
    declinedAt: r.declinedAt ? new Date(r.declinedAt as string) : null,
    createdAt: new Date(r.createdAt as string),
  };
}

function rowToBlock(r: Record<string, unknown>): CompanionBlock {
  return {
    id: r.id as string,
    blockerId: r.blockerId as string,
    blockedId: r.blockedId as string,
    reason: (r.reason as string | null) ?? null,
    createdAt: new Date(r.createdAt as string),
  };
}

function rowToReport(r: Record<string, unknown>): CompanionReport {
  return {
    id: r.id as string,
    reporterId: r.reporterId as string,
    reportedId: r.reportedId as string,
    reason: r.reason as CompanionReportReason,
    details: (r.details as string | null) ?? null,
    status: r.status as CompanionReportStatus,
    reviewedBy: (r.reviewedBy as string | null) ?? null,
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt as string) : null,
    createdAt: new Date(r.createdAt as string),
  };
}

// ────────────────────────────────────────────────────────────
// User.socialEnabled — per-user opt-in
// ────────────────────────────────────────────────────────────

export async function setUserSocialEnabled(
  userId: string,
  enabled: boolean,
): Promise<void> {
  await sql`
    UPDATE "User"
    SET "socialEnabled" = ${enabled}, "updatedAt" = NOW()
    WHERE "id" = ${userId}
  `;
}

export async function getUserSocialEnabled(
  userId: string,
): Promise<boolean | null> {
  const rows = await sql`
    SELECT "socialEnabled" FROM "User" WHERE "id" = ${userId}
  `;
  if (rows.length === 0) return null;
  return rows[0].socialEnabled as boolean;
}

// ────────────────────────────────────────────────────────────
// CompanionProfile
// ────────────────────────────────────────────────────────────

export interface UpsertCompanionProfileInput {
  userId: string;
  displayName: string;
  bio?: string | null;
  archetypeCode: string;
  scoresJson: CompanionRiasecScores;
  locale: CompanionLocale;
  visibility?: CompanionVisibility;
}

/**
 * Create or update a companion profile (one per user).
 * On conflict, displayName/bio/locale/visibility are updated;
 * archetypeCode/scoresJson are also refreshed in case the user
 * has retaken Quick Dive.
 */
export async function upsertCompanionProfile(
  data: UpsertCompanionProfileInput,
): Promise<CompanionProfile> {
  const id = crypto.randomUUID();
  const visibility = data.visibility ?? "discoverable";
  const bio = data.bio ?? null;

  const rows = await sql`
    INSERT INTO "CompanionProfile" (
      "id", "userId", "displayName", "bio",
      "archetypeCode", "scoresJson", "locale", "visibility"
    )
    VALUES (
      ${id}, ${data.userId}, ${data.displayName}, ${bio},
      ${data.archetypeCode}, ${JSON.stringify(data.scoresJson)}::jsonb,
      ${data.locale}, ${visibility}
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "displayName"   = EXCLUDED."displayName",
      "bio"           = EXCLUDED."bio",
      "archetypeCode" = EXCLUDED."archetypeCode",
      "scoresJson"    = EXCLUDED."scoresJson",
      "locale"        = EXCLUDED."locale",
      "visibility"    = EXCLUDED."visibility",
      "updatedAt"     = NOW()
    RETURNING *
  `;
  return rowToProfile(rows[0]);
}

export async function getCompanionProfileByUserId(
  userId: string,
): Promise<CompanionProfile | null> {
  const rows = await sql`
    SELECT * FROM "CompanionProfile" WHERE "userId" = ${userId} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToProfile(rows[0]);
}

export async function setCompanionVisibility(
  userId: string,
  visibility: CompanionVisibility,
): Promise<void> {
  await sql`
    UPDATE "CompanionProfile"
    SET "visibility" = ${visibility}, "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `;
}

/** Permanently remove the public companion identity (used by GDPR purge). */
export async function deleteCompanionProfile(userId: string): Promise<void> {
  await sql`
    DELETE FROM "CompanionProfile" WHERE "userId" = ${userId}
  `;
}

// ────────────────────────────────────────────────────────────
// CompanionConnection (state machine)
// ────────────────────────────────────────────────────────────

export type CreateConnectionResult =
  | { ok: true; connection: CompanionConnection }
  | { ok: false; reason: "duplicate" | "self" | "blocked" };

/**
 * Send a friend request. Returns 'duplicate' if a row already exists for
 * the (requester, recipient) pair (whether pending/accepted/declined).
 * Returns 'blocked' if either side has blocked the other.
 */
export async function createConnectionRequest(input: {
  requesterId: string;
  recipientId: string;
  requesterMessage?: string | null;
}): Promise<CreateConnectionResult> {
  if (input.requesterId === input.recipientId) {
    return { ok: false, reason: "self" };
  }

  // Check mutual blocks AND any existing connection in either direction.
  // The DB UNIQUE constraint is ordered (requesterId, recipientId), so it
  // alone wouldn't stop A→B and B→A from coexisting (race / reciprocal).
  // We do the bidirectional probe in application code to keep the SQL
  // schema simple — single round trip with two predicates.
  const conflictRows = (await sql`
    SELECT 'blocked' AS kind FROM "CompanionBlock"
    WHERE ("blockerId" = ${input.requesterId} AND "blockedId" = ${input.recipientId})
       OR ("blockerId" = ${input.recipientId} AND "blockedId" = ${input.requesterId})
    UNION ALL
    SELECT 'duplicate' AS kind FROM "CompanionConnection"
    WHERE ("requesterId" = ${input.requesterId} AND "recipientId" = ${input.recipientId})
       OR ("requesterId" = ${input.recipientId} AND "recipientId" = ${input.requesterId})
    LIMIT 1
  `) as unknown as Array<{ kind: "blocked" | "duplicate" }>;

  if (conflictRows.length > 0) {
    return { ok: false, reason: conflictRows[0].kind };
  }

  const id = crypto.randomUUID();
  const message = input.requesterMessage ?? null;

  try {
    const rows = await sql`
      INSERT INTO "CompanionConnection" (
        "id", "requesterId", "recipientId", "status", "requesterMessage"
      )
      VALUES (${id}, ${input.requesterId}, ${input.recipientId}, 'pending', ${message})
      RETURNING *
    `;
    return { ok: true, connection: rowToConnection(rows[0]) };
  } catch (e: unknown) {
    // UNIQUE violation → duplicate. Belt-and-braces in case a concurrent
    // insert squeezes between our SELECT and INSERT (only catches same-direction).
    if (
      e instanceof Error &&
      /companion_connection_unique_pair|unique/i.test(e.message)
    ) {
      return { ok: false, reason: "duplicate" };
    }
    throw e;
  }
}

/**
 * Recipient accepts a pending request. Returns true on transition,
 * false if the row was not in 'pending' state (race protection).
 */
export async function acceptConnectionRequest(
  connectionId: string,
  recipientId: string,
): Promise<boolean> {
  const rows = await sql`
    UPDATE "CompanionConnection"
    SET "status" = 'accepted', "acceptedAt" = NOW()
    WHERE "id" = ${connectionId}
      AND "recipientId" = ${recipientId}
      AND "status" = 'pending'
    RETURNING "id"
  `;
  return rows.length > 0;
}

/** Recipient declines a pending request. */
export async function declineConnectionRequest(
  connectionId: string,
  recipientId: string,
): Promise<boolean> {
  const rows = await sql`
    UPDATE "CompanionConnection"
    SET "status" = 'declined', "declinedAt" = NOW()
    WHERE "id" = ${connectionId}
      AND "recipientId" = ${recipientId}
      AND "status" = 'pending'
    RETURNING "id"
  `;
  return rows.length > 0;
}

/**
 * Either side may unfriend. Hard-deletes the row.
 * Caller must verify userId matches requesterId or recipientId.
 */
export async function deleteConnection(
  connectionId: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM "CompanionConnection"
    WHERE "id" = ${connectionId}
      AND ("requesterId" = ${userId} OR "recipientId" = ${userId})
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function getConnectionById(
  connectionId: string,
): Promise<CompanionConnection | null> {
  const rows = await sql`
    SELECT * FROM "CompanionConnection" WHERE "id" = ${connectionId} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToConnection(rows[0]);
}

/** All connections involving the user, bucketed by direction and status. */
export async function getConnectionBuckets(
  userId: string,
): Promise<CompanionConnectionBuckets> {
  const rows = await sql`
    SELECT * FROM "CompanionConnection"
    WHERE "requesterId" = ${userId} OR "recipientId" = ${userId}
    ORDER BY "createdAt" DESC
  `;
  const buckets: CompanionConnectionBuckets = {
    incomingPending: [],
    outgoingPending: [],
    accepted: [],
  };
  for (const r of rows) {
    const conn = rowToConnection(r);
    if (conn.status === "accepted") {
      buckets.accepted.push(conn);
    } else if (conn.status === "pending") {
      if (conn.recipientId === userId) buckets.incomingPending.push(conn);
      else buckets.outgoingPending.push(conn);
    }
    // declined rows are intentionally omitted from the UI buckets
  }
  return buckets;
}

/**
 * Same as getConnectionBuckets but joins each row with the OTHER party's
 * CompanionProfile in a single SQL — used by /api/companions/connections
 * so each list row can render name + archetype + bio.
 *
 * Declined rows are still omitted from UI surfaces (matches getConnectionBuckets).
 */
export async function getConnectionBucketsWithProfiles(
  userId: string,
): Promise<CompanionConnectionBucketsWithProfiles> {
  const rows = (await sql`
    SELECT
      c."id",
      c."requesterId",
      c."recipientId",
      c."status",
      c."requesterMessage",
      c."acceptedAt",
      c."declinedAt",
      c."createdAt",
      cp."id"            AS "otherProfileId",
      cp."userId"        AS "otherUserId",
      cp."displayName"   AS "otherDisplayName",
      cp."bio"           AS "otherBio",
      cp."archetypeCode" AS "otherArchetypeCode",
      cp."locale"        AS "otherLocale",
      cp."visibility"    AS "otherVisibility",
      cp."createdAt"     AS "otherCreatedAt",
      cp."updatedAt"     AS "otherUpdatedAt",
      u_other."cohort"   AS "otherCohort"
      -- scoresJson intentionally omitted — see PublicCompanionProfile
    FROM "CompanionConnection" c
    LEFT JOIN "User" u_other
      ON u_other."id" = (
        CASE
          WHEN c."requesterId" = ${userId} THEN c."recipientId"
          ELSE c."requesterId"
        END
      )
    LEFT JOIN "CompanionProfile" cp
      ON cp."userId" = u_other."id"
      -- Privacy matrix. The connection row itself is always returned
      -- (so the viewer can act on it) but personal fields are nulled
      -- when the peer has gone dark or hasn't opted into being seen
      -- by this viewer yet. Reveal the profile when ANY of:
      --   1) peer.visibility = 'discoverable'  (open profile)
      --   2) connection.status = 'accepted'    (already friends)
      --   3) connection.status = 'pending' AND viewer is the recipient
      --      (the sender implicitly disclosed their identity by reaching
      --       out — without this the recipient sees a blank "—" and has
      --       to accept blind, which is worse for safety)
      -- Outgoing pending against a friends_only target stays hidden:
      -- the viewer chose to reach out, but the target hasn't agreed
      -- to be seen by them yet.
      AND u_other."socialEnabled" = TRUE
      AND cp."visibility" <> 'hidden'
      AND (
           cp."visibility" = 'discoverable'
        OR c."status" = 'accepted'
        OR (c."status" = 'pending' AND c."recipientId" = ${userId})
      )
    WHERE (c."requesterId" = ${userId} OR c."recipientId" = ${userId})
      -- TOCTOU defence — if a CompanionBlock now exists between viewer
      -- and peer (created after the connection row), the row should
      -- disappear from buckets entirely. This handles the race where
      -- a peer blocked the viewer while a pending request was in flight.
      AND NOT EXISTS (
        SELECT 1 FROM "CompanionBlock" b
        WHERE (b."blockerId" = ${userId} AND b."blockedId" = u_other."id")
           OR (b."blockerId" = u_other."id" AND b."blockedId" = ${userId})
      )
    ORDER BY c."createdAt" DESC
  `) as unknown as Record<string, unknown>[];

  const buckets: CompanionConnectionBucketsWithProfiles = {
    incomingPending: [],
    outgoingPending: [],
    accepted: [],
  };

  // Lazy-imported here (rather than top of file) to keep the cohort
  // module out of cycles with @/lib/db/* and to make the dependency
  // visible at the only call site that needs it.
  const { canAccess } = await import("@/lib/cohort/entitlements");

  for (const r of rows) {
    const conn = rowToConnection(r);

    // PublicCompanionProfile — strips scoresJson by construction
    let other: import("@/lib/types/companion").PublicCompanionProfile | null =
      null;
    if (r.otherProfileId) {
      // Defence in depth — even though the SQL JOIN already gates on
      // u_other.socialEnabled = TRUE, an old peer whose cohort was later
      // moved to one without socialFeatures (e.g. switched into the
      // research cohort) might still have the flag set. The cohort
      // entitlement is the SOURCE OF TRUTH — re-check here so that
      // moving cohorts immediately stops surfacing public profile
      // fields, even before any cleanup job runs.
      const otherCohort = (r.otherCohort as string | null) ?? null;
      if (!canAccess(otherCohort, "socialFeatures")) {
        other = null;
      } else {
        other = {
          id: r.otherProfileId as string,
          userId: r.otherUserId as string,
          displayName: r.otherDisplayName as string,
          bio: (r.otherBio as string | null) ?? null,
          archetypeCode: r.otherArchetypeCode as string,
          locale: r.otherLocale as CompanionLocale,
          visibility: r.otherVisibility as CompanionVisibility,
          createdAt: new Date(r.otherCreatedAt as string),
          updatedAt: new Date(r.otherUpdatedAt as string),
        };
      }
    }

    const entry: CompanionConnectionWithProfile = { connection: conn, other };

    if (conn.status === "accepted") {
      buckets.accepted.push(entry);
    } else if (conn.status === "pending") {
      if (conn.recipientId === userId) buckets.incomingPending.push(entry);
      else buckets.outgoingPending.push(entry);
    }
    // declined rows omitted on purpose
  }

  return buckets;
}

/**
 * Count of pending requests where the given user is the recipient.
 * Used by the Dashboard entry card to show a "you have N new requests" badge.
 * Cheap query — uses idx_companion_connection_recipient_pending.
 */
export async function countIncomingPendingByUser(
  userId: string,
): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS "count"
    FROM "CompanionConnection"
    WHERE "recipientId" = ${userId} AND "status" = 'pending'
  `) as unknown as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/** True iff there's an accepted connection between the two users (in either direction). */
export async function areFriends(
  userIdA: string,
  userIdB: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM "CompanionConnection"
    WHERE "status" = 'accepted'
      AND (
        ("requesterId" = ${userIdA} AND "recipientId" = ${userIdB})
        OR ("requesterId" = ${userIdB} AND "recipientId" = ${userIdA})
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

// ────────────────────────────────────────────────────────────
// CompanionBlock
// ────────────────────────────────────────────────────────────

export async function createBlock(input: {
  blockerId: string;
  blockedId: string;
  reason?: string | null;
}): Promise<CompanionBlock> {
  const id = crypto.randomUUID();
  const reason = input.reason ?? null;

  const rows = await sql`
    INSERT INTO "CompanionBlock" ("id", "blockerId", "blockedId", "reason")
    VALUES (${id}, ${input.blockerId}, ${input.blockedId}, ${reason})
    ON CONFLICT ("blockerId", "blockedId") DO UPDATE SET
      "reason" = EXCLUDED."reason"
    RETURNING *
  `;
  return rowToBlock(rows[0]);
}

export async function removeBlock(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM "CompanionBlock"
    WHERE "blockerId" = ${blockerId} AND "blockedId" = ${blockedId}
    RETURNING "id"
  `;
  return rows.length > 0;
}

/** True iff either side has blocked the other (mutual symmetry for discovery filtering). */
export async function isBlockedEitherWay(
  userIdA: string,
  userIdB: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM "CompanionBlock"
    WHERE ("blockerId" = ${userIdA} AND "blockedId" = ${userIdB})
       OR ("blockerId" = ${userIdB} AND "blockedId" = ${userIdA})
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function listBlocksByBlocker(
  blockerId: string,
): Promise<CompanionBlock[]> {
  const rows = await sql`
    SELECT * FROM "CompanionBlock"
    WHERE "blockerId" = ${blockerId}
    ORDER BY "createdAt" DESC
  `;
  return rows.map((r) => rowToBlock(r));
}

// ────────────────────────────────────────────────────────────
// CompanionReport
// ────────────────────────────────────────────────────────────

export async function createReport(input: {
  reporterId: string;
  reportedId: string;
  reason: CompanionReportReason;
  details?: string | null;
}): Promise<CompanionReport> {
  const id = crypto.randomUUID();
  const details = input.details ?? null;

  const rows = await sql`
    INSERT INTO "CompanionReport" (
      "id", "reporterId", "reportedId", "reason", "details"
    )
    VALUES (${id}, ${input.reporterId}, ${input.reportedId}, ${input.reason}, ${details})
    RETURNING *
  `;
  return rowToReport(rows[0]);
}

/** Admin overview: count of unhandled T&S reports. */
export async function countOpenReports(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS "count"
    FROM "CompanionReport"
    WHERE "status" = 'open'
  `;
  return Number(rows[0]?.count ?? 0);
}

/** Admin queue: open reports oldest-first. */
export async function listOpenReports(): Promise<CompanionReport[]> {
  const rows = await sql`
    SELECT * FROM "CompanionReport"
    WHERE "status" = 'open'
    ORDER BY "createdAt" ASC
  `;
  return rows.map((r) => rowToReport(r));
}

/**
 * Same as listOpenReports but JOINs reporter/reported users + companion
 * profiles so the admin page can render names without per-row fetches.
 */
export interface OpenReportWithDetails {
  report: CompanionReport;
  reporterEmail: string | null;
  reporterDisplayName: string | null;
  reportedEmail: string | null;
  reportedDisplayName: string | null;
}

export async function listOpenReportsWithDetails(): Promise<
  OpenReportWithDetails[]
> {
  const rows = (await sql`
    SELECT
      cr.*,
      u_reporter."email"           AS "reporterEmail",
      cp_reporter."displayName"    AS "reporterDisplayName",
      u_reported."email"           AS "reportedEmail",
      cp_reported."displayName"    AS "reportedDisplayName"
    FROM "CompanionReport" cr
    LEFT JOIN "User" u_reporter           ON u_reporter."id" = cr."reporterId"
    LEFT JOIN "CompanionProfile" cp_reporter ON cp_reporter."userId" = cr."reporterId"
    LEFT JOIN "User" u_reported           ON u_reported."id" = cr."reportedId"
    LEFT JOIN "CompanionProfile" cp_reported ON cp_reported."userId" = cr."reportedId"
    WHERE cr."status" = 'open'
    ORDER BY cr."createdAt" ASC
  `) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    report: rowToReport(r),
    reporterEmail: (r.reporterEmail as string | null) ?? null,
    reporterDisplayName: (r.reporterDisplayName as string | null) ?? null,
    reportedEmail: (r.reportedEmail as string | null) ?? null,
    reportedDisplayName: (r.reportedDisplayName as string | null) ?? null,
  }));
}

export async function markReportReviewed(input: {
  reportId: string;
  reviewerId: string;
  status: Extract<CompanionReportStatus, "reviewed" | "dismissed">;
}): Promise<boolean> {
  const rows = await sql`
    UPDATE "CompanionReport"
    SET "status" = ${input.status},
        "reviewedBy" = ${input.reviewerId},
        "reviewedAt" = NOW()
    WHERE "id" = ${input.reportId}
      AND "status" = 'open'
    RETURNING "id"
  `;
  return rows.length > 0;
}
