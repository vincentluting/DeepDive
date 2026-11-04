import { type NextRequest, NextResponse } from 'next/server'
import { guardRoute } from '@/lib/api/api-guard'
import { withLogging } from '@/lib/api/with-logging'
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors'
import { getLatestDeepDiveSessionId, markSessionAbandoned } from '@/lib/db/sessions'
import { deleteAssessmentsBySession } from '@/lib/db/assessments'
import { deleteReportByAssessment } from '@/lib/db/reports'
import { deleteRealConditionsBySession } from '@/lib/db/conditions'
import { resetDeepDiveModules } from '@/lib/db/exploration-progress'
import { deleteAssessmentCompletion } from '@/lib/db/assessment-completion'
import { invalidateUserCache } from '@/lib/db/cached'
import { rollbackJourneyAfterDeepReset } from '@/lib/db/journey'
import { recomputeUserContext } from '@/lib/db/user-context'

export const POST = withLogging('/api/deepdive/reset', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'write', requireAuth: true })
  if (guard.blocked) return guard.response

  const userId = guard.user!.id

  try {
    // 1. Find the latest deep-dive session for this user
    const sessionId = await getLatestDeepDiveSessionId(userId)

    if (sessionId) {
      // 2. Delete AssessmentResult(s), capturing the assessment ID for report cleanup
      const assessmentId = await deleteAssessmentsBySession(sessionId)

      // 3. Delete the linked CareerReport (if any)
      if (assessmentId) {
        await deleteReportByAssessment(assessmentId)
      }

      // 4. Delete orphaned RealConditions linked to this session
      await deleteRealConditionsBySession(sessionId)

      // 5. Mark the session as abandoned (preserves data for research)
      await markSessionAbandoned(sessionId)
    }

    // 6. Reset exploration progress modules: deepDive, profile, report, realityCheck → null
    await resetDeepDiveModules(userId)

    // 7. Clear deep_dive completion record
    await deleteAssessmentCompletion(userId, 'deep_dive')

    // 8. Roll back journey state to the highest still-valid state
    await rollbackJourneyAfterDeepReset(userId)

    // 9. Recompute persisted user context from remaining data
    await recomputeUserContext(userId)

    // 10. Invalidate server-side cache so Dashboard/Profile reflect the reset
    invalidateUserCache(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError('/api/deepdive/reset', ApiErrorCode.INTERNAL_ERROR, {
      userId,
      message: 'Failed to reset Deep Dive data',
      cause: error,
    })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to reset Deep Dive data', 500)
  }
})
