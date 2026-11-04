'use client';

import { useEffect, useRef } from 'react';

const MIN_DURATION_MS = 1000;
const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Read the visit-id cookie set by middleware.
 * Returns null if not available (e.g., SSR, bot, old visit).
 */
export function getVisitIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)visit-id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Track how long the user actively spends on the current page.
 * - Pauses when tab is hidden (visibilitychange)
 * - Reports via sendBeacon (fallback: fetch keepalive) on page leave
 * - Ignores stays under 1 second; caps at 30 minutes
 *
 * @param visitId The visit ID from the visit-id cookie. Pass null to disable.
 */
export function usePageDuration(visitId: string | null): void {
  const startRef = useRef<number>(Date.now());
  const hiddenMsRef = useRef<number>(0);
  const hiddenStartRef = useRef<number | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!visitId) return;

    // Reset on mount / visitId change
    startRef.current = Date.now();
    hiddenMsRef.current = 0;
    hiddenStartRef.current = null;
    sentRef.current = false;

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenStartRef.current = Date.now();
        sendDuration(); // also report when tab hides
      } else {
        if (hiddenStartRef.current !== null) {
          hiddenMsRef.current += Date.now() - hiddenStartRef.current;
          hiddenStartRef.current = null;
        }
      }
    }

    function sendDuration() {
      if (sentRef.current) return;
      const hidden = hiddenMsRef.current +
        (hiddenStartRef.current !== null ? Date.now() - hiddenStartRef.current : 0);
      const activeMs = Date.now() - startRef.current - hidden;
      if (activeMs < MIN_DURATION_MS) return;
      sentRef.current = true;

      const durationMs = Math.min(activeMs, MAX_DURATION_MS);
      const body = JSON.stringify({ visitId, durationMs });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/duration',
          new Blob([body], { type: 'application/json' }),
        );
      } else {
        fetch('/api/analytics/duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', sendDuration);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', sendDuration);
      sendDuration();
    };
  }, [visitId]);
}
