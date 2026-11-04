import { NextResponse } from "next/server"
import { authenticateUser, createSession, deleteSession, setSessionCookie } from "@/lib/auth"
import { guardRoute } from "@/lib/api/api-guard"
import { parseBody } from "@/lib/validation/parse-body"
import { loginSchema } from "@/lib/validation/api-schemas"
import { ApiErrorCode, createErrorResponse, logApiError } from "@/lib/api/api-errors"
import { withLogging } from "@/lib/api/with-logging"
import { trackFunnelEvent } from "@/lib/analytics/funnel"

export const POST = withLogging('/api/auth/login', async (request) => {
  try {
    const guard = await guardRoute(request, { tier: 'auth' })
    if (guard.blocked) return guard.response

    const parsed = await parseBody(request, loginSchema)
    if ('error' in parsed) return parsed.error
    const { email, password } = parsed.data

    const user = await authenticateUser(email, password)
    if (!user) {
      logApiError('/api/auth/login', ApiErrorCode.UNAUTHORIZED, {
        message: 'Invalid email or password',
      })
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        'Invalid email or password',
        401,
      )
    }

    // Create session
    const session = await createSession(user.id)

    try {
      await setSessionCookie(session.id)
    } catch (cookieError) {
      // Cookie failure means the client won't receive the session — clean up the orphaned DB row
      // and treat as login failure so the user can retry.
      deleteSession(session.id).catch(() => { /* best-effort cleanup */ })
      logApiError('/api/auth/login', ApiErrorCode.INTERNAL_ERROR, {
        message: 'Failed to set session cookie after successful authentication',
        cause: cookieError,
      })
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Login failed: could not establish session. Please try again.',
        500,
      )
    }

    // Track login (non-blocking)
    trackFunnelEvent('login', { userId: user.id, metadata: {} }).catch(() => {});

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    logApiError('/api/auth/login', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Login failed',
      cause: error,
    })
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Internal server error',
      500,
    )
  }
})
