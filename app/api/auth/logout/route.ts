import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, clearSessionCookie } from "@/lib/auth"
import { guardRoute } from "@/lib/api/api-guard"
import { ApiErrorCode, createErrorResponse, logApiError } from "@/lib/api/api-errors"
import { withLogging } from '@/lib/api/with-logging'
import { trackFunnelEvent } from "@/lib/analytics/funnel"

export const POST = withLogging('/api/auth/logout', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'auth' });
  if (guard.blocked) return guard.response;

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    // Track logout before deleting session (non-blocking)
    if (guard.user?.id) {
      trackFunnelEvent('logout', { userId: guard.user.id, metadata: {} }).catch(() => {});
    }

    if (sessionId) {
      await deleteSession(sessionId)
    }
    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError('/api/auth/logout', ApiErrorCode.INTERNAL_ERROR, { message: 'Logout failed', cause: error })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Logout failed', 500)
  }
});
