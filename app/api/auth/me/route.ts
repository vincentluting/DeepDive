import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserWithAdmin } from "@/lib/auth"
import { getUserContext } from "@/lib/db/user-context"
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors"
import { withLogging } from '@/lib/api/with-logging'
import { guardRoute } from '@/lib/api/api-guard'

export const GET = withLogging('/api/auth/me', async (request: NextRequest) => {
  try {
    const guard = await guardRoute(request, { tier: 'read' });
    if (guard.blocked) return guard.response;

    const user = await getCurrentUserWithAdmin()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Include userLevel for nav locked state. Keep this endpoint lightweight:
    // recomputing UserContext can fan out into many DB reads on first login.
    const ctx = await getUserContext(user.id).catch(() => null)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      userLevel: ctx?.userLevel ?? 0,
    })
  } catch (error) {
    logApiError('/api/auth/me', ApiErrorCode.INTERNAL_ERROR, { message: 'Get current user error', cause: error })
    return NextResponse.json({ user: null })
  }
});
