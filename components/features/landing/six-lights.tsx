"use client";

// ============================================================
// SixLights — revived from the Revelation-era hero (5777e58c~1),
// Meridian-tuned and relocated to the twilight interlude so it no
// longer competes with the hero (the reason it was removed in v6).
//
// Six archetype glyphs idle-breathe around the interlude copy — large
// enough and bright enough to register as the page's one "magic"
// moment. With a fine pointer on desktop, a glyph brightens as the
// cursor approaches; very close, its archetype name fades in with the
// "one of these is you" whisper underneath.
//
// Meridian changes vs the original:
// - strokes/captions are tokenised (noon: sea-deep ink lines; midnight:
//   phosphorescent cyan) via CSS variables, not hardcoded rgba
// - keyframes live in globals.css (registered for reduced motion)
// - positions are relative to the interlude container, not the hero
// - the container rect is cached (no layout reads on the move path)
// ============================================================

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

interface GlyphSpec {
  id: string;
  topPct: number;
  leftPct: number;
  size: number;
  duration: number;
  delay: number;
  draw: (stroke: string) => ReactNode;
}

// ── Six simplified RIASEC glyphs as monochrome SVG strokes ──
// Ringed around the central copy (which spans roughly 30–70% width):
// two columns of three, pulled in from the edges so they live inside
// the visitor's field of view.
const GLYPHS: GlyphSpec[] = [
  {
    // R Realistic — hexagon (built/structural)
    id: "R",
    topPct: 14,
    leftPct: 17,
    size: 108,
    duration: 7.5,
    delay: 0,
    draw: (s) => (
      <polygon
        points="50,6 88,28 88,72 50,94 12,72 12,28"
        fill="none"
        stroke={s}
        strokeWidth="1.25"
      />
    ),
  },
  {
    // I Investigative — concentric circles (analytical)
    id: "I",
    topPct: 66,
    leftPct: 13,
    size: 96,
    duration: 8.5,
    delay: 1.4,
    draw: (s) => (
      <>
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
        <circle
          cx="50"
          cy="50"
          r="10"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
      </>
    ),
  },
  {
    // A Artistic — three intersecting curves
    id: "A",
    topPct: 12,
    leftPct: 78,
    size: 118,
    duration: 6.8,
    delay: 2.6,
    draw: (s) => (
      <>
        <path
          d="M10 80 Q 50 10 90 80"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M10 60 Q 50 -5 90 60"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M10 95 Q 50 30 90 95"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    // S Social — three small linked circles (a quiet crowd)
    id: "S",
    topPct: 68,
    leftPct: 82,
    size: 100,
    duration: 8.0,
    delay: 0.9,
    draw: (s) => (
      <>
        <circle
          cx="32"
          cy="38"
          r="18"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
        <circle
          cx="68"
          cy="38"
          r="18"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
        <circle
          cx="50"
          cy="68"
          r="18"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
      </>
    ),
  },
  {
    // E Enterprising — upward arrow / aspiration
    id: "E",
    topPct: 40,
    leftPct: 8,
    size: 88,
    duration: 7.2,
    delay: 3.6,
    draw: (s) => (
      <path
        d="M50 6 L86 64 L60 64 L60 94 L40 94 L40 64 L14 64 Z"
        fill="none"
        stroke={s}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    ),
  },
  {
    // C Conventional — grid (order)
    id: "C",
    topPct: 42,
    leftPct: 88,
    size: 84,
    duration: 9.0,
    delay: 4.4,
    draw: (s) => (
      <>
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke={s}
          strokeWidth="1.25"
        />
        <line x1="10" y1="37" x2="90" y2="37" stroke={s} strokeWidth="1.25" />
        <line x1="10" y1="63" x2="90" y2="63" stroke={s} strokeWidth="1.25" />
        <line x1="37" y1="10" x2="37" y2="90" stroke={s} strokeWidth="1.25" />
        <line x1="63" y1="10" x2="63" y2="90" stroke={s} strokeWidth="1.25" />
      </>
    ),
  },
];

const NEAR_PX = 320;
const VERY_NEAR_PX = 130;
const REACTOR_MQ = "(hover: hover) and (pointer: fine) and (min-width: 1024px)";

export function SixLights({
  captions,
  hoverCaption,
}: {
  /** Archetype display names, one per RIASEC glyph (R/I/A/S/E/C order). */
  captions: string[];
  hoverCaption: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [reduced, setReduced] = useState(false);
  const [reactorOn, setReactorOn] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reactor = window.matchMedia(REACTOR_MQ);
    const sync = () => {
      setReduced(reduce.matches);
      setReactorOn(reactor.matches && !reduce.matches);
    };
    sync();
    reduce.addEventListener("change", sync);
    reactor.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      reactor.removeEventListener("change", sync);
    };
  }, []);

  // Mouse reactor — rAF-throttled, container rect cached between resizes.
  useEffect(() => {
    if (!reactorOn) return;
    let frame = 0;
    let rectFrame = 0;
    let pending: { x: number; y: number } | null = null;

    const refreshRect = () => {
      rectRef.current = containerRef.current?.getBoundingClientRect() ?? null;
    };
    // rAF-deferred so the scroll path itself never forces a layout read
    const queueRefreshRect = () => {
      if (rectFrame) return;
      rectFrame = requestAnimationFrame(() => {
        rectFrame = 0;
        refreshRect();
      });
    };

    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (pending) setCursor(pending);
        });
      }
    };
    const onLeave = () => setCursor(null);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", queueRefreshRect);
    // scroll moves the container under a fixed cursor — rect must follow
    document.addEventListener("scroll", queueRefreshRect, {
      capture: true,
      passive: true,
    });
    refreshRect();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", queueRefreshRect);
      document.removeEventListener("scroll", queueRefreshRect, {
        capture: true,
      });
      if (frame) cancelAnimationFrame(frame);
      if (rectFrame) cancelAnimationFrame(rectFrame);
    };
  }, [reactorOn]);

  return (
    <div ref={containerRef} aria-hidden="true" className="dd-six-lights">
      {GLYPHS.map((g, index) => {
        let boost = 0;
        let captionOn = false;
        const rect = rectRef.current;
        if (cursor && rect && reactorOn) {
          const gx = rect.left + (g.leftPct / 100) * rect.width;
          const gy = rect.top + (g.topPct / 100) * rect.height;
          const dist = Math.hypot(cursor.x - gx, cursor.y - gy);
          if (dist < NEAR_PX) {
            boost = (1 - dist / NEAR_PX) * 0.55;
            captionOn = dist < VERY_NEAR_PX;
          }
        }

        const breath: CSSProperties = reduced
          ? { opacity: 0.45 }
          : {
              animation: `ddSixBreathe ${g.duration}s ease-in-out ${g.delay}s infinite`,
            };

        return (
          <div
            key={g.id}
            className="dd-six-glyph"
            style={{
              top: `${g.topPct}%`,
              left: `${g.leftPct}%`,
              width: g.size,
              height: g.size,
            }}
          >
            <div style={{ width: g.size, height: g.size, ...breath }}>
              <svg viewBox="0 0 100 100" width={g.size} height={g.size}>
                {g.draw("var(--dd-six-stroke)")}
              </svg>
              {boost > 0 && (
                <svg
                  className="dd-six-glyph-bright"
                  viewBox="0 0 100 100"
                  width={g.size}
                  height={g.size}
                  style={{ opacity: Math.min(0.55, boost) }}
                >
                  {g.draw("var(--dd-six-stroke-bright)")}
                </svg>
              )}
            </div>
            {captionOn && (
              <span className="dd-six-caption" style={{ top: g.size + 14 }}>
                {captions[index] && <strong>{captions[index]}</strong>}
                {hoverCaption}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Static mobile fallback — three glyphs with archetype names, no reactor. */
export function SixLightsStatic({ captions }: { captions: string[] }) {
  const picks = [0, 2, 3]; // R / A / S — visually distinct trio
  return (
    <div className="dd-six-static" aria-hidden="true">
      {picks.map((index) => {
        const g = GLYPHS[index];
        return (
          <figure key={g.id}>
            <svg viewBox="0 0 100 100" width={56} height={56}>
              {g.draw("var(--dd-six-stroke)")}
            </svg>
            <figcaption>{captions[index]}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}
