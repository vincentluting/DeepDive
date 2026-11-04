'use client';

import { usePageDuration, getVisitIdFromCookie } from '@/lib/analytics/time-on-page';

/**
 * Drop-in client component that tracks how long the user spends on each page.
 * Reads the visit-id cookie set by middleware and fires /api/analytics/duration
 * when the user navigates away. Add to any layout to enable tracking.
 */
export function PageDurationTracker() {
  const visitId = getVisitIdFromCookie();
  usePageDuration(visitId);
  return null;
}
