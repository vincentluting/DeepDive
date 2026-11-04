import { useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import type { AuthUser } from "@/store/auth-store"

// Re-export for backward compatibility with consuming components
export type HeaderUserInfo = AuthUser

export interface UseHeaderUserResult {
  user: HeaderUserInfo | null
  isLoading: boolean
  hasInProgressSession: boolean
  latestReportId: string | null
  /** 0=new, 1=quickDiveOnly, 2=deepReport, 3=powerUser */
  userLevel: 0 | 1 | 2 | 3
}

/**
 * Reads user session from the global auth store.
 * First call triggers a parallel fetch; subsequent calls return cached data instantly.
 */
export function useHeaderUser(): UseHeaderUserResult {
  const { user, isLoading, hasInProgressSession, latestReportId, userLevel, initialized, fetchSession, checkInProgressSession } =
    useAuthStore()

  useEffect(() => {
    fetchSession()
    checkInProgressSession()
  }, [fetchSession, checkInProgressSession])

  return {
    user,
    isLoading: !initialized || isLoading,
    hasInProgressSession,
    latestReportId,
    userLevel,
  }
}
