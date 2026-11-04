// ============================================================
// Safe Analytics Send — sendBeacon with fetch fallback
//
// sendBeacon is fire-and-forget with no success callback.
// On mobile / weak network it can silently drop payloads.
// This wrapper tries sendBeacon first, then falls back to
// fetch with keepalive (survives page unload in modern browsers).
// ============================================================

/**
 * Send analytics data with best-effort delivery guarantee.
 * Tries sendBeacon first, falls back to fetch + keepalive.
 * Safe to call from beforeunload / visibilitychange handlers.
 */
export function sendAnalyticsSafely(url: string, data: Record<string, unknown>): void {
  try {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });

    // Try sendBeacon first (best for unload scenarios)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    // Fallback: fetch with keepalive (survives page unload in modern browsers)
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        body: json,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Best-effort — tracking failure is non-critical
      });
    }
  } catch {
    // Tracking failure is non-critical
  }
}
