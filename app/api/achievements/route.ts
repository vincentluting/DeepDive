// ============================================================
// GET /api/achievements — Get user's unlocked achievements + full registry
// Output: { achievements: UserAchievementRecord[], registry: PublicAchievementInfo[], total: number }
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { guardRoute } from '@/lib/api/api-guard'
import { withLogging } from '@/lib/api/with-logging'
import { getUserAchievements } from '@/lib/db/achievements'
import { ACHIEVEMENT_REGISTRY } from '@/lib/achievements/registry'
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import type { Locale } from '@/lib/i18n/config'

export const GET = withLogging('/api/achievements', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read', requireAuth: true })
    if (guard.blocked) return guard.response

    const userId = guard.user!.id
    const achievements = await getUserAchievements(userId)
    const unlockedKeys = new Set(achievements.map((a) => a.achievementKey))

    // Build public registry: show name/description for visible achievements,
    // hide details for hidden achievements that aren't yet unlocked
    const locale = (request.headers.get('x-locale') || 'en') as Locale
    const dict = await getDictionary(locale)
    const hiddenLabel = dict.dashboardPage?.achievementHidden ?? 'Hidden achievement'
    const registry = ACHIEVEMENT_REGISTRY.map((def) => {
      const unlocked = unlockedKeys.has(def.key)
      const isHiddenAndLocked = def.hidden && !unlocked

      return {
        key: def.key,
        name: isHiddenAndLocked ? '???' : (locale === 'zh' ? def.nameZh : def.nameEn),
        description: isHiddenAndLocked ? hiddenLabel : (locale === 'zh' ? def.descriptionZh : def.descriptionEn),
        rarity: def.rarity,
        hidden: def.hidden,
        unlocked,
        unlockedAt: unlocked ? achievements.find((a) => a.achievementKey === def.key)?.unlockedAt : null,
      }
    })

    return NextResponse.json({
      achievements,
      registry,
      total: ACHIEVEMENT_REGISTRY.length,
      unlocked: achievements.length,
    })
  } catch (error) {
    logApiError('/api/achievements', ApiErrorCode.INTERNAL_ERROR, { cause: error })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch achievements', 500)
  }
})
