// ============================================================
// Conditions — RealConditions CRUD
//
// Table: RealConditions
// Key fields: id, sessionId, userId, conditionsJson (JSONB)
// Stores user-provided real-world context (location, industry, language, etc.)
// used to generate Panel 3 (action pathway) of the career report.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { RealConditions } from "@/lib/types";
import { ensureSessionExists } from "./sessions";

/**
 * Normalize legacy RealConditions JSONB to current schema.
 * Handles migration from China-centric field names to international ones:
 *   stayOrReturn → locationFlexibility
 *   returnTimeline → relocationTimeline
 *   culturalIdentity.familyExpectationPressure → .externalExpectationPressure
 *   culturalIdentity.familyExpectationNote → .externalExpectationNote
 *   culturalIdentity.primaryIdentity / workCulturePref → removed (phantom fields)
 */
function normalizeConditions(raw: Record<string, unknown>): RealConditions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = { ...raw } as any;

  // stayOrReturn → locationFlexibility
  if ("stayOrReturn" in data && !("locationFlexibility" in data)) {
    const map: Record<string, string> = {
      stay: "stay-local",
      return: "relocate-home",
      undecided: "open",
      open: "open",
    };
    data.locationFlexibility = map[data.stayOrReturn] || "open";
    delete data.stayOrReturn;
  }

  // returnTimeline → relocationTimeline
  if ("returnTimeline" in data && !("relocationTimeline" in data)) {
    data.relocationTimeline = data.returnTimeline;
    delete data.returnTimeline;
  }

  // culturalIdentity inner fields
  if (data.culturalIdentity && typeof data.culturalIdentity === "object") {
    const ci = { ...data.culturalIdentity };

    if (
      "familyExpectationPressure" in ci &&
      !("externalExpectationPressure" in ci)
    ) {
      ci.externalExpectationPressure = ci.familyExpectationPressure;
      delete ci.familyExpectationPressure;
    }
    if ("familyExpectationNote" in ci && !("externalExpectationNote" in ci)) {
      ci.externalExpectationNote = ci.familyExpectationNote;
      delete ci.familyExpectationNote;
    }

    // Remove phantom fields that were never collected
    delete ci.primaryIdentity;
    delete ci.workCulturePref;

    data.culturalIdentity = ci;
  }

  return data as RealConditions;
}

export async function saveRealConditions(
  sessionId: string,
  userId: string | null,
  conditions: RealConditions,
): Promise<string> {
  // Defensive: ensure session row exists before FK-dependent INSERT.
  // This guards against the race condition where the fire-and-forget
  // session creation from the client hasn't completed yet.
  await ensureSessionExists(sessionId);

  const id = randomUUID();
  let conditionsJsonStr: string;
  try {
    conditionsJsonStr = JSON.stringify(conditions);
  } catch (serErr) {
    throw new Error(
      `Failed to serialize RealConditions for session ${sessionId}: ${serErr instanceof Error ? serErr.message : "unknown error"}`,
      { cause: serErr },
    );
  }
  try {
    await sql`
      INSERT INTO "RealConditions" ("id", "sessionId", "userId", "conditionsJson")
      VALUES (${id}, ${sessionId}, ${userId}, ${conditionsJsonStr}::jsonb)
    `;
  } catch (dbErr) {
    throw new Error(
      `saveRealConditions DB insert failed for session ${sessionId}`,
      { cause: dbErr },
    );
  }
  return id;
}

export async function getRealConditions(
  sessionId: string,
): Promise<RealConditions | null> {
  const rows = await sql`
    SELECT "conditionsJson" FROM "RealConditions"
    WHERE "sessionId" = ${sessionId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return normalizeConditions(rows[0].conditionsJson as Record<string, unknown>);
}

/**
 * Get the most recent reality conditions for a user.
 * This is the primary read path — conditions are person-level, not session-level.
 * Falls back to null if no conditions exist or userId is missing.
 */
/**
 * Delete all RealConditions rows linked to a session (used by retake flow).
 */
export async function deleteRealConditionsBySession(
  sessionId: string,
): Promise<void> {
  await sql`DELETE FROM "RealConditions" WHERE "sessionId" = ${sessionId}`;
}

export async function getRealConditionsByUserId(
  userId: string | null | undefined,
): Promise<RealConditions | null> {
  if (!userId) return null;
  const rows = await sql`
    SELECT "conditionsJson" FROM "RealConditions"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return normalizeConditions(rows[0].conditionsJson as Record<string, unknown>);
}
