// ============================================================
// Achievement Engine — Check & unlock achievements
//
// Core function: checkAchievements(userId, event, metadata?)
// Called fire-and-forget from API routes after key events.
// Idempotent: duplicate calls are safe (ON CONFLICT DO NOTHING).
// ============================================================

import { getUserAchievements, insertAchievement } from '@/lib/db/achievements'
import { getAchievementsForEvent } from './registry'
import type { UserAchievementRecord } from '@/lib/types/achievement'

/**
 * Check and unlock achievements for a user after an event.
 * Returns array of newly unlocked achievements (empty if none).
 *
 * Usage (fire-and-forget in API routes):
 *   checkAchievements(userId, 'quick_dive_complete', { durationMs }).catch(() => {})
 */
export async function checkAchievements(
  userId: string,
  event: string,
  metadata: Record<string, unknown> = {},
): Promise<UserAchievementRecord[]> {
  // 1. Which achievements listen to this event?
  const candidates = getAchievementsForEvent(event)
  if (candidates.length === 0) return []

  // 2. Which has the user already unlocked?
  const existing = await getUserAchievements(userId)
  const existingKeys = new Set(existing.map((a) => a.achievementKey))

  // 3. Evaluate conditions and unlock
  const unlocked: UserAchievementRecord[] = []

  for (const def of candidates) {
    // Skip already unlocked
    if (existingKeys.has(def.key)) continue

    // Evaluate condition (if any)
    if (def.condition && !def.condition(metadata)) continue

    // Unlock!
    const record = await insertAchievement(userId, def.key, metadata)
    if (record) {
      unlocked.push(record)
    }
  }

  // 4. Invalidate user cache if any achievements unlocked
  if (unlocked.length > 0) {
    import('@/lib/db/cached').then((m) => m.invalidateUserCache(userId)).catch(() => {})
  }

  return unlocked
}
