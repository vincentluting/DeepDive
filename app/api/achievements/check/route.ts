// ============================================================
// POST /api/achievements/check — Client-side achievement trigger
// Input: { event: string, metadata?: Record<string, unknown> }
// Output: { unlocked: UserAchievementRecord[] }
//
// Used by frontend components to fire achievement events that
// can't be detected server-side (e.g., viewing a dimension card).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { guardRoute } from '@/lib/api/api-guard'
import { withLogging } from '@/lib/api/with-logging'
import { checkAchievements } from '@/lib/achievements/engine'
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors'
import { z } from 'zod/v4'
import { parseBody } from '@/lib/validation/parse-body'

const achievementCheckSchema = z.object({
  event: z.string().max(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const POST = withLogging('/api/achievements/check', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'auth', requireAuth: true })
    if (guard.blocked) return guard.response

    const parsed = await parseBody(request, achievementCheckSchema)
    if ('error' in parsed) return parsed.error

    const { event, metadata } = parsed.data
    const unlocked = await checkAchievements(guard.user!.id, event, metadata ?? {})

    return NextResponse.json({ unlocked })
  } catch (error) {
    logApiError('/api/achievements/check', ApiErrorCode.INTERNAL_ERROR, { cause: error })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to check achievements', 500)
  }
})
