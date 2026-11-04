// ============================================================
// Achievements — UserAchievement CRUD
//
// Table: UserAchievement
// Key fields: id, userId, achievementKey, unlockedAt, metadata
// Unique constraint: (userId, achievementKey) — prevents duplicates
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { UserAchievementRecord } from "@/lib/types/achievement";

/**
 * Get all achievements for a user (unlocked, sorted by most recent).
 */
export async function getUserAchievements(
  userId: string,
): Promise<UserAchievementRecord[]> {
  const rows = await sql<UserAchievementRecord>`
    SELECT "id", "userId", "achievementKey", "unlockedAt", "metadata"
    FROM "UserAchievement"
    WHERE "userId" = ${userId}
    ORDER BY "unlockedAt" DESC
  `;
  return rows;
}

/**
 * Get count of unlocked achievements for a user.
 */
export async function getUserAchievementCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM "UserAchievement"
    WHERE "userId" = ${userId}
  `;
  return rows[0]?.count ?? 0;
}

/**
 * Insert a new achievement. Idempotent: ON CONFLICT DO NOTHING.
 * Returns the record if newly inserted, null if already exists.
 */
export async function insertAchievement(
  userId: string,
  achievementKey: string,
  metadata: Record<string, unknown> = {},
): Promise<UserAchievementRecord | null> {
  const id = randomUUID();
  const rows = await sql<UserAchievementRecord>`
    INSERT INTO "UserAchievement" ("id", "userId", "achievementKey", "metadata")
    VALUES (${id}, ${userId}, ${achievementKey}, ${JSON.stringify(metadata)}::jsonb)
    ON CONFLICT ("userId", "achievementKey") DO NOTHING
    RETURNING "id", "userId", "achievementKey", "unlockedAt", "metadata"
  `;
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Check if a user has a specific achievement.
 */
export async function hasAchievement(
  userId: string,
  achievementKey: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM "UserAchievement"
    WHERE "userId" = ${userId} AND "achievementKey" = ${achievementKey}
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Delete all achievements for a user (used in account deletion / test cleanup).
 */
export async function deleteUserAchievements(userId: string): Promise<void> {
  await sql`
    DELETE FROM "UserAchievement" WHERE "userId" = ${userId}
  `;
}
