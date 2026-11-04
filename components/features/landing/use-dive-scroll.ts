"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";

/**
 * Landing scroll engine — the single scroll listener for the dive narrative.
 *
 * Continuous values (painting fade, particle depth) run through one RAF
 * handler; discrete narrative bands run through one IntersectionObserver.
 * All scroll-linked visuals must derive from this engine; never attach a
 * second scroll listener on the landing page.
 */

/** Narrative depth bands — drive the `.dd-landing-water` veil opacity. */
export type DepthBand = "surface" | "photic" | "twilight" | "abyss";

/**
 * `data-depth-section` marker → narrative band + rail station.
 * "surfacing" (footer) lets the water veil recede while the rail stays at
 * the final station — the visitor comes back up holding the pearl.
 */
const DEPTH_SECTIONS: Record<string, { band: DepthBand; station: number }> = {
  surface: { band: "surface", station: 0 },
  photic: { band: "photic", station: 1 },
  twilight: { band: "twilight", station: 2 },
  abyss: { band: "abyss", station: 3 },
  surfacing: { band: "photic", station: 3 },
};

/** Painting opacity for a given descent offset (pure — unit tested). */
export function oceanOpacityFor(descended: number): number {
  const depth = Math.min(descended / 1600, 1);
  return Math.max(0.08, 1 - depth * 0.86);
}

/** Resolve a depth-section marker to band + station (pure — unit tested). */
export function resolveDepthSection(
  marker: string | undefined,
): { band: DepthBand; station: number } | null {
  if (!marker) return null;
  return DEPTH_SECTIONS[marker] ?? null;
}

// ── Continuous water veil ──
// The veil used to step through four opacity tiers (900ms fade per band
// boundary) — visibly banded when scrolling. It now interpolates a single
// 0–1 progress between section anchors; CSS multiplies it by the
// mode-specific cap (light .42 / dark .8), so both modes share one
// variable and the caps stay frozen.

/** Normalised veil progress each narrative band settles at. Multiplied by
 *  the mode cap these land on the original tiers: light .16/.30/.42,
 *  dark .30/.57/.80. */
export const BAND_PROGRESS: Record<DepthBand, number> = {
  surface: 0,
  photic: 0.38,
  twilight: 0.71,
  abyss: 1,
};

export interface VeilStop {
  /** Descent offset (px from the top of the landing root) of this anchor. */
  y: number;
  /** Veil progress (0–1) the descent settles at by this anchor. */
  v: number;
}

/**
 * Build interpolation stops from the section markers (pure — unit tested).
 * `lead` mirrors the IO trigger band: a section's level is fully reached
 * when its top crosses `viewportHeight * lead` from the viewport top.
 * Consecutive same-value stops form plateaus (the "dwell" at each depth);
 * the footer's `surfacing` marker maps back to photic so the veil recedes.
 */
export function buildVeilStops(
  sections: Array<{ marker: string; top: number }>,
  viewportHeight: number,
  lead = 0.35,
): VeilStop[] {
  const stops: VeilStop[] = [];
  for (const { marker, top } of sections) {
    const resolved = resolveDepthSection(marker);
    if (!resolved) continue;
    stops.push({
      y: Math.max(0, top - viewportHeight * lead),
      v: BAND_PROGRESS[resolved.band],
    });
  }
  return stops;
}

/** Piecewise-linear veil progress for a descent offset (pure — unit tested). */
export function veilProgressFor(descended: number, stops: VeilStop[]): number {
  if (stops.length === 0) return 0;
  if (descended <= stops[0].y) return stops[0].v;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (descended <= next.y) {
      if (next.y === prev.y) return next.v;
      const t = (descended - prev.y) / (next.y - prev.y);
      return prev.v + (next.v - prev.v) * t;
    }
  }
  return stops[stops.length - 1].v;
}

export function useDiveScroll(rootRef: RefObject<HTMLDivElement | null>): {
  activeStation: number;
  depthRef: MutableRefObject<number>;
} {
  const [activeStation, setActiveStation] = useState(0);
  const depthRef = useRef(0);

  // Continuous: painting fade + shared depth value (particles read this).
  // Descent is measured from the root's own viewport position, and the
  // listener captures on document — correct no matter which ancestor
  // actually scrolls (html/body or a nested scroll container).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let measureFrame = 0;
    let stops: VeilStop[] = [];
    let lastVeil = -1;
    let lastSink = -1;

    const update = () => {
      const descended = Math.max(0, -root.getBoundingClientRect().top);
      depthRef.current = Math.min(descended / 1600, 1);
      root.style.setProperty(
        "--landing-ocean-opacity",
        String(oceanOpacityFor(descended)),
      );
      const veil = veilProgressFor(descended, stops);
      if (Math.abs(veil - lastVeil) > 0.001) {
        lastVeil = veil;
        root.style.setProperty("--landing-veil-progress", veil.toFixed(4));
      }
      // Hero showpiece sinks over the first ~720px of descent.
      const sink = Math.min(descended / 720, 1);
      if (Math.abs(sink - lastSink) > 0.001) {
        lastSink = sink;
        root.style.setProperty("--hero-sink", sink.toFixed(4));
      }
    };

    // One batched read pass: section tops relative to the root (descent
    // offsets are scroll-position independent). Re-measured on resize and
    // when the root's content height changes (returning-card swap, fonts).
    const measure = () => {
      const rootTop = root.getBoundingClientRect().top;
      const sections = Array.from(
        root.querySelectorAll<HTMLElement>("[data-depth-section]"),
      ).map((el) => ({
        marker: el.dataset.depthSection ?? "",
        top: el.getBoundingClientRect().top - rootTop,
      }));
      stops = buildVeilStops(sections, window.innerHeight);
      lastVeil = -1; // force one variable write after re-measuring
      update();
    };

    const queueMeasure = () => {
      if (measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        measure();
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    measure();
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", queueMeasure);
    const resizeObserver = new ResizeObserver(queueMeasure);
    resizeObserver.observe(root);
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", queueMeasure);
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
    };
  }, [rootRef]);

  // Discrete: narrative band + rail station from section markers.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-depth-section]"),
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const marker = (visible[0]?.target as HTMLElement | undefined)?.dataset
          .depthSection;
        const resolved = resolveDepthSection(marker);
        if (!resolved) return;
        if (root.dataset.depthBand !== resolved.band) {
          root.dataset.depthBand = resolved.band;
        }
        setActiveStation(resolved.station);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);

  return { activeStation, depthRef };
}

/**
 * Scroll-reveal system — claims the `.dd-landing-reveal` class.
 *
 * SSR HTML stays fully visible; only after the observer is armed does the
 * container class `.dd-rev-armed` allow the hidden initial state, so no-JS
 * visitors and crawlers never see blank sections.
 */
export function useLandingReveal(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".dd-landing-reveal"),
    );
    if (targets.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return; // content stays visible, no reveal pass

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    root.classList.add("dd-rev-armed");
    targets.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      root.classList.remove("dd-rev-armed");
    };
  }, [rootRef]);
}
