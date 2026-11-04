'use client';

import { useEffect, useRef } from 'react';

const INTERSECTION_THRESHOLD = 0.3;
const MAX_TOTAL_MS = 60 * 60 * 1000; // 1 hour cap

interface ScrollbackEvent {
  from: string;
  to: string;
  atMs: number;
}

interface PanelTimes {
  [panelId: string]: number;
}

/**
 * Generate a random ID for this engagement session.
 */
function generateEngagementId(): string {
  return `re_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Send engagement data via sendBeacon (fallback: fetch keepalive).
 * Fire-and-forget — errors are silently swallowed.
 */
function sendEngagement(payload: object): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/analytics/report-engagement',
        new Blob([body], { type: 'application/json' }),
      );
    } else {
      fetch('/api/analytics/report-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Silently swallow — tracking is never critical
  }
}

/**
 * Passive engagement tracker for the report page.
 *
 * - Uses IntersectionObserver (threshold 0.3) to track time spent
 *   in each section that has a `data-panel-id` attribute.
 * - Detects scroll direction reversals and records scrollback events
 *   (e.g. user scrolled back from pathway to profile).
 * - Tracks maxScrollDepth as a fraction [0, 1].
 * - Sends accumulated data via sendBeacon on visibilitychange (hidden)
 *   and pagehide — whichever fires first.
 *
 * @param reportId The report being viewed.
 */
export function useReportEngagement(reportId: string): void {
  const engagementIdRef = useRef<string>(generateEngagementId());
  const sentRef = useRef(false);
  const startMsRef = useRef<number>(Date.now());

  // Panel dwell time accumulators
  const panelTimesRef = useRef<PanelTimes>({});
  // Per-panel: timestamp when this panel became visible
  const panelStartRef = useRef<Record<string, number>>({});

  // Scrollback tracking
  const scrollbacksRef = useRef<ScrollbackEvent[]>([]);
  const lastScrollTopRef = useRef<number>(0);
  // Most recently "active" panel (highest in viewport)
  const activePanelRef = useRef<string | null>(null);
  // The panel that was previously active (for scrollback detection)
  const prevPanelRef = useRef<string | null>(null);

  // Max scroll depth
  const maxScrollDepthRef = useRef<number>(0);

  useEffect(() => {
    if (!reportId) return;

    // Reset state on reportId change
    engagementIdRef.current = generateEngagementId();
    sentRef.current = false;
    startMsRef.current = Date.now();
    panelTimesRef.current = {};
    panelStartRef.current = {};
    scrollbacksRef.current = [];
    lastScrollTopRef.current = 0;
    activePanelRef.current = null;
    prevPanelRef.current = null;
    maxScrollDepthRef.current = 0;

    // ─── Snapshot panel timers (pause all active panels) ────────────────
    function snapshotPanelTimers(): void {
      const now = Date.now();
      for (const [panelId, startMs] of Object.entries(panelStartRef.current) as [string, number][]) {
        const elapsed = now - startMs;
        panelTimesRef.current[panelId] = (panelTimesRef.current[panelId] ?? 0) + elapsed;
        panelStartRef.current[panelId] = now; // reset so resume works correctly
      }
    }

    // ─── IntersectionObserver ────────────────────────────────────────────
    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();

        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const panelId = el.dataset.panelId;
          if (!panelId) continue;

          if (entry.isIntersecting) {
            // Panel entered viewport — start timer
            panelStartRef.current[panelId] = now;

            // Scrollback detection: if we're going to a panel that was
            // previously seen before the current active panel, it's a scrollback.
            const prev = activePanelRef.current;
            if (
              prev &&
              prev !== panelId &&
              // Detect backward movement by comparing panel order
              getPanelOrder(panelId) < getPanelOrder(prev)
            ) {
              scrollbacksRef.current.push({
                from: prev,
                to: panelId,
                atMs: now - startMsRef.current,
              });
            }

            prevPanelRef.current = activePanelRef.current;
            activePanelRef.current = panelId;
          } else {
            // Panel left viewport — stop timer
            if (panelStartRef.current[panelId] !== undefined) {
              const elapsed = now - panelStartRef.current[panelId];
              panelTimesRef.current[panelId] = (panelTimesRef.current[panelId] ?? 0) + elapsed;
              delete panelStartRef.current[panelId];
            }
          }
        }
      },
      { threshold: INTERSECTION_THRESHOLD },
    );

    // Observe all elements with data-panel-id
    function attachObservers(): void {
      const panels = document.querySelectorAll<HTMLElement>('[data-panel-id]');
      panels.forEach((el) => observer.observe(el));
    }

    // Attach after a short tick so the DOM is ready
    const attachTimer = setTimeout(attachObservers, 200);

    // ─── Scroll depth tracking ───────────────────────────────────────────
    function handleScroll(): void {
      const scrollEl = document.documentElement;
      const scrollTop = scrollEl.scrollTop || document.body.scrollTop;
      const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
      if (scrollHeight > 0) {
        const depth = scrollTop / scrollHeight;
        if (depth > maxScrollDepthRef.current) {
          maxScrollDepthRef.current = depth;
        }
      }
      lastScrollTopRef.current = scrollTop;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ─── Send on page leave ──────────────────────────────────────────────
    function send(): void {
      if (sentRef.current) return;
      sentRef.current = true;

      snapshotPanelTimers();

      const totalTimeMs = Math.min(Date.now() - startMsRef.current, MAX_TOTAL_MS);

      sendEngagement({
        id: engagementIdRef.current,
        reportId,
        panelTimes: panelTimesRef.current,
        scrollbacks: scrollbacksRef.current,
        maxScrollDepth: maxScrollDepthRef.current > 0 ? maxScrollDepthRef.current : null,
        totalTimeMs,
      });
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'hidden') {
        send();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', send);

    return () => {
      clearTimeout(attachTimer);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', send);
      send();
    };
  }, [reportId]);
}

/**
 * Assign a numeric order to each panel ID so we can detect backward
 * scrolling (scrollback events) by comparing order values.
 */
function getPanelOrder(panelId: string): number {
  const order: Record<string, number> = {
    anchors: 1,
    strengths: 2,
    careers: 3,
    shadow: 4,
    letter: 5,
    explore: 6,
  };
  return order[panelId] ?? 99;
}
