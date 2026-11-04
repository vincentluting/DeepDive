// ============================================================
// Profiles — PersonalProfile & UserProfile CRUD
//
// Tables: PersonalProfile, UserProfile
// PersonalProfile key fields: id, assessmentId, userId, profileJson (JSONB), version
// UserProfile key fields: id, userId, insightsJson, lastUpdated
// PersonalProfile stores the output of generateProfile() (Big Five facets → profile).
// UserProfile.insightsJson stores user-facing coaching insights for dashboard/settings.
//   (See lib/db/memory.ts header for the full Memory vs ProfileInsights architecture note.)
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { PersonalProfileData } from "@/lib/types";
import { normalizeProfile } from "@/lib/profile-generation/normalize-profile";
import { isSafeHttpUrl } from "@/lib/utils/url-safety";

// ── UserProfile table (insights JSON, distinct from PersonalProfile) ─────

export interface UserProfileInsights {
  /** JSONB column — Neon returns a parsed JS object, not a string. */
  insightsJson: Record<string, unknown>;
  lastUpdated: string;
}

export async function getUserProfileInsights(
  userId: string,
): Promise<UserProfileInsights | null> {
  const rows = await sql`
    SELECT "insightsJson", "lastUpdated"
    FROM "UserProfile"
    WHERE "userId" = ${userId}
  `;
  if (rows.length === 0) return null;

  // insightsJson is a JSONB column — Neon returns it as a parsed JS object.
  // Defensively handle legacy TEXT rows (string) that predate migration 007.
  const raw = rows[0].insightsJson;
  let insightsJson: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      insightsJson = JSON.parse(raw) || {};
    } catch {
      /* ignore */
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    insightsJson = raw as Record<string, unknown>;
  }

  return {
    insightsJson,
    lastUpdated: rows[0].lastUpdated as string,
  };
}

export async function updateUserProfileInsights(
  userId: string,
  insightsJson: string,
): Promise<void> {
  const id = randomUUID();
  try {
    await sql`
      INSERT INTO "UserProfile" ("id", "userId", "insightsJson", "lastUpdated")
      VALUES (${id}, ${userId}, ${insightsJson}::jsonb, NOW())
      ON CONFLICT ("userId") DO UPDATE
        SET "insightsJson" = EXCLUDED."insightsJson",
            "lastUpdated" = NOW()
    `;
  } catch (dbErr) {
    throw new Error(`updateUserProfileInsights failed for user ${userId}`, {
      cause: dbErr,
    });
  }
}

/** Get public profile data by username — returns profile + social links if public */
export async function getPublicProfileByUsername(username: string): Promise<{
  profileJson: PersonalProfileData;
  socialLinks: Array<{ platform: string; url: string }>;
} | null> {
  // Join UserProfile (for username/isPublic/socialLinks) with PersonalProfile (for profileJson)
  const rows = await sql`
    SELECT pp."profileJson", up."insightsJson"
    FROM "UserProfile" up
    JOIN "PersonalProfile" pp ON pp."userId" = up."userId"
    WHERE LOWER(up."username") = LOWER(${username})
      AND up."isPublic" = true
    ORDER BY pp."updatedAt" DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  const profileJson = normalizeProfile(rows[0].profileJson);
  if (!profileJson) return null;

  const insights = rows[0].insightsJson as Record<string, unknown> | null;
  const socialLinks = Array.isArray(insights?.socialLinks)
    ? (insights.socialLinks as Array<{ platform: string; url: string }>).filter(
        (link) => isSafeHttpUrl(link?.url),
      )
    : [];

  return { profileJson, socialLinks };
}

// ── PersonalProfile — exercises ─────

export interface ExercisesJson {
  nonNegotiables?: {
    selected: [string, string, string];
    completedAt: string;
  };
  flowMoments?: {
    moments: Array<{
      description: string;
      activity: string;
      social: string;
      environment: string;
    }>;
    completedAt: string;
  };
  energyLog?: {
    entries: Array<{
      day: number;
      energizer: string;
      drain: string;
      overallEnergy: number;
      date: string;
    }>;
    completedAt: string | null;
    startedAt: string;
  };
}

/** Get exercises JSON for a user's latest profile */
export async function getExercises(
  userId: string,
): Promise<ExercisesJson | null> {
  const rows = await sql`
    SELECT "exercisesJson" FROM "PersonalProfile"
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  const raw = rows[0].exercisesJson;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ExercisesJson;
  }
  return {};
}

/** Save a specific exercise result (merge into exercisesJson) */
export async function saveExercise(
  userId: string,
  exerciseKey: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const rows = await sql`
    UPDATE "PersonalProfile"
    SET "exercisesJson" = jsonb_set(
      COALESCE("exercisesJson", '{}'),
      ${`{${exerciseKey}}`}::text[],
      ${JSON.stringify(data)}::jsonb
    ),
    "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "id" FROM "PersonalProfile"
      WHERE "userId" = ${userId}
      ORDER BY "updatedAt" DESC LIMIT 1
    )
    RETURNING "id"
  `;
  return rows.length > 0;
}

// ── PersonalProfile table ─────

export async function saveProfile(
  profile: PersonalProfileData,
): Promise<string> {
  const id = profile.id || randomUUID();
  try {
    // Atomic upsert: ON CONFLICT avoids SELECT-then-INSERT race condition.
    // Preserve existing narratives only when the profile input fingerprint is
    // unchanged. If inputs changed, old narratives are stale and must not be
    // merged into a newly computed algorithmic profile.
    const profileJson = JSON.stringify(profile);
    const rows = await sql`
      INSERT INTO "PersonalProfile" ("id", "assessmentId", "userId", "profileJson", "version")
      VALUES (
        ${id},
        ${profile.assessmentId},
        ${profile.userId ?? null},
        ${profileJson}::jsonb,
        ${profile.version ?? "6.0"}
      )
      ON CONFLICT ("assessmentId") DO UPDATE SET
        "profileJson" = CASE
          WHEN COALESCE("PersonalProfile"."profileJson"->>'profileInputHash', '') =
               COALESCE(${profileJson}::jsonb->>'profileInputHash', '')
          THEN jsonb_set(
            ${profileJson}::jsonb,
            '{narrativeSnapshots}',
            COALESCE("PersonalProfile"."profileJson"->'narrativeSnapshots', '{}'::jsonb)
              || COALESCE(${profileJson}::jsonb->'narrativeSnapshots', '{}'::jsonb)
          )
          ELSE jsonb_set(
            ${profileJson}::jsonb,
            '{narrativeSnapshots}',
            COALESCE(${profileJson}::jsonb->'narrativeSnapshots', '{}'::jsonb)
          )
        END,
        "userId" = COALESCE(${profile.userId ?? null}, "PersonalProfile"."userId"),
        "version" = ${profile.version ?? "6.0"},
        "updatedAt" = NOW()
      RETURNING "id"
    `;
    return rows[0].id as string;
  } catch (dbErr) {
    throw new Error(
      `saveProfile DB upsert failed for assessment ${profile.assessmentId}`,
      { cause: dbErr },
    );
  }
}

export async function getProfile(
  userId: string,
): Promise<PersonalProfileData | null> {
  const rows = await sql`
    SELECT "profileJson" FROM "PersonalProfile"
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return normalizeProfile(rows[0].profileJson);
}

export async function getProfileByAssessment(
  assessmentId: string,
): Promise<PersonalProfileData | null> {
  const rows = await sql`
    SELECT "profileJson" FROM "PersonalProfile"
    WHERE "assessmentId" = ${assessmentId}
    ORDER BY "updatedAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return normalizeProfile(rows[0].profileJson);
}

export async function updateProfileNarratives(
  assessmentId: string,
  narrativeSnapshots: NonNullable<PersonalProfileData["narrativeSnapshots"]>,
): Promise<void> {
  // Atomic merge: preserve existing narrative keys (e.g. report-level letterToUser)
  // while overlaying new identity narratives. Single SQL — no read-modify-write race.
  try {
    await sql`
      UPDATE "PersonalProfile"
      SET "profileJson" = jsonb_set(
        "profileJson",
        '{narrativeSnapshots}',
        COALESCE("profileJson"->'narrativeSnapshots', '{}'::jsonb)
          || ${JSON.stringify(narrativeSnapshots)}::jsonb
      ),
      "updatedAt" = NOW()
      WHERE "assessmentId" = ${assessmentId}
    `;
  } catch (dbErr) {
    throw new Error(
      `updateProfileNarratives DB update failed for assessment ${assessmentId}`,
      { cause: dbErr },
    );
  }
}
