// ============================================================
// Cached DB queries — unstable_cache wrappers for hot paths
//
// These functions cache user-specific data for 120s, eliminating
// redundant Neon HTTP round trips when navigating between pages.
// Each query that takes ~100ms over HTTP is served in ~0ms from cache.
//
// Cache is automatically invalidated:
//   - After 120s (revalidate TTL)
//   - On-demand via invalidateUserCache(userId) — call this after
//     any mutation (report generated, profile saved, assessment completed)
// ============================================================

import { unstable_cache, revalidateTag } from 'next/cache'
import { getProfile as _getProfile } from './profiles'
import { getUserProfileInsights as _getUserProfileInsights } from './profiles'
import { getUserReports as _getUserReports } from './reports'
import { getLatestReportIdForUser as _getLatestReportIdForUser } from './reports'
import { getLatestQuickDiveByUserId as _getLatestQuickDiveByUserId } from './platform'
import { getDeepDiveStatusForUser as _getDeepDiveStatusForUser } from './sessions'
import { getCoachingSessionCount as _getCoachingSessionCount } from './coaching'

const REVALIDATE_SECONDS = 120

/**
 * Invalidate all cached data for a user.
 * Call this after any mutation: report generated, profile saved,
 * assessment completed, coaching session finished, etc.
 */
export function invalidateUserCache(userId: string) {
  // Next.js 16 revalidateTag requires (tag, cacheLifeProfile)
  // 'default' matches the built-in default cache profile
  revalidateTag(`user-data-${userId}`, 'default')
}

/** Cached getProfile — 30s TTL per user */
export function getCachedProfile(userId: string) {
  return unstable_cache(
    () => _getProfile(userId),
    ['profile', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getUserProfileInsights — 30s TTL per user */
export function getCachedUserProfileInsights(userId: string) {
  return unstable_cache(
    () => _getUserProfileInsights(userId),
    ['profile-insights', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getUserReports — 30s TTL per user */
export function getCachedUserReports(userId: string) {
  return unstable_cache(
    () => _getUserReports(userId),
    ['user-reports', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getLatestReportIdForUser — 30s TTL per user */
export function getCachedLatestReportId(userId: string) {
  return unstable_cache(
    () => _getLatestReportIdForUser(userId),
    ['latest-report-id', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getLatestQuickDiveByUserId — 30s TTL per user */
export function getCachedLatestQuickDive(userId: string) {
  return unstable_cache(
    () => _getLatestQuickDiveByUserId(userId),
    ['latest-quickdive', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getDeepDiveStatusForUser — 30s TTL per user */
export function getCachedDeepDiveStatus(userId: string) {
  return unstable_cache(
    () => _getDeepDiveStatusForUser(userId),
    ['deepdive-status', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}

/** Cached getCoachingSessionCount — 30s TTL per user */
export function getCachedCoachingSessionCount(userId: string) {
  return unstable_cache(
    () => _getCoachingSessionCount(userId),
    ['coaching-count', userId],
    { revalidate: REVALIDATE_SECONDS, tags: [`user-data-${userId}`] },
  )()
}
