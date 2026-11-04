import { type NextRequest, NextResponse } from "next/server"
import { getLatestReportIdForUser } from "@/lib/db/reports"
import { guardRoute } from "@/lib/api/api-guard"
import { ApiErrorCode, createErrorResponse, logApiError } from "@/lib/api/api-errors"
import { withLogging } from '@/lib/api/with-logging'

export const GET = withLogging('/api/reports/latest', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'read', requireAuth: true })
  if (guard.blocked) return guard.response

  try {
    const userId = guard.user!.id

    const id = await getLatestReportIdForUser(userId)

    return NextResponse.json({ id })
  } catch (error) {
    logApiError('/api/reports/latest', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch latest report',
      cause: error,
    })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch latest report', 500)
  }
});
