"use client";

// ============================================================
// Live product stages — the landing's product shots, rebuilt in code so
// each capability has its OWN composition (a portrait card of growing
// dimension bars, a directions leaderboard, a tools grid, a coach thread)
// instead of four near-identical full-page screenshots. Code-built means
// vector-crisp, light/dark native, reduced-motion friendly, and ALIVE:
// bars grow, numbers count up, the card tilts to the cursor.
// ============================================================

import { useEffect, useRef, useState, type RefObject } from "react";

import type { PreviewDictionary } from "./landing-dictionaries";

/** Count from 0 → target on an eased curve once `start` flips true. */
function useCountUp(target: number, start: boolean, durationMs = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, durationMs]);
  return val;
}

/**
 * Parallax tilt — the card leans toward the cursor (desktop, fine pointer).
 * Writes --tilt-rx/--tilt-ry CSS vars on a rAF; the base perspective lives
 * in CSS. Disabled for reduced-motion and touch.
 */
function useTilt<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px)",
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const apply = () => {
      raf = 0;
      if (!pending) return;
      const r = el.getBoundingClientRect();
      const dx = (pending.x - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (pending.y - (r.top + r.height / 2)) / (r.height / 2);
      // clamp so off-card cursor doesn't over-rotate
      const cx = Math.max(-1, Math.min(1, dx));
      const cy = Math.max(-1, Math.min(1, dy));
      el.style.setProperty("--tilt-ry", `${cx * 5}deg`);
      el.style.setProperty("--tilt-rx", `${-cy * 4}deg`);
    };
    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.setProperty("--tilt-ry", "0deg");
      el.style.setProperty("--tilt-rx", "0deg");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

function CardChrome({ label }: { label: string }) {
  return (
    <div className="dd-live-chrome">
      <i />
      <i />
      <i />
      <em>{label}</em>
    </div>
  );
}

function GlanceStat({
  value,
  label,
  start,
}: {
  value: number;
  label: string;
  start: boolean;
}) {
  const n = useCountUp(value, start);
  return (
    <div className="dd-live-glance-item">
      <strong>{n}</strong>
      <small>{label}</small>
    </div>
  );
}

/** Archetype seal — the lead archetype the interest profile maps to. */
function ArchetypeSeal({ name, label }: { name: string; label: string }) {
  return (
    <div className="dd-live-seal">
      <span className="dd-live-seal-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <circle
            cx="24"
            cy="24"
            r="11.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <circle cx="24" cy="24" r="2.6" fill="currentColor" />
        </svg>
      </span>
      <span className="dd-live-seal-text">
        <small>{label}</small>
        <strong>{name}</strong>
      </span>
    </div>
  );
}

/**
 * Hero protagonist — a living portrait card that reads like the real
 * profile page: the lead archetype it maps to (a real one of the twelve),
 * the six interest dimensions of Quick Dive, and the platform facts. Bars
 * grow, numbers count up; the wrapper tilts to the cursor.
 */
export function LivePortrait({ d }: { d: PreviewDictionary }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 280);
    return () => window.clearTimeout(id);
  }, []);

  // Six interest dimensions (RIASEC order) — the real output of Quick Dive,
  // self-consistent with the "interest profile" title. The sample weights
  // peak on Investigate + Lead, which is exactly what maps to the lead
  // archetype shown in the seal ("Strategist" / 战略家 · 洞察模式).
  const dims = d.showcase.portrait.dims;
  const widths = [58, 90, 54, 62, 84, 66];
  const stats = d.science.stats;
  const eyebrow = d.showcase.depthCards[0]?.t ?? d.journey.label;
  const archetype = d.archetypes.items[1] ?? d.archetypes.items[0];

  return (
    <div className="dd-live-card dd-live-portrait" aria-hidden="true">
      <CardChrome label="Deep Dive" />
      <div className="dd-live-body">
        <div className="dd-live-head">
          <div>
            <p className="dd-live-eyebrow">{eyebrow}</p>
            <h3 className="dd-live-title">{d.showcase.portrait.title}</h3>
          </div>
          <ArchetypeSeal name={archetype.name} label={d.glassCard.label} />
        </div>
        <ul className={`dd-live-dims${armed ? " is-armed" : ""}`}>
          {dims.map((dim, i) => (
            <li key={dim}>
              <span>{dim}</span>
              <i>
                <b
                  style={
                    {
                      "--w": `${widths[i % widths.length]}%`,
                      "--delay": `${i * 100}ms`,
                    } as React.CSSProperties
                  }
                />
              </i>
            </li>
          ))}
        </ul>
        <div className="dd-live-glance">
          {stats.map((s) => (
            <GlanceStat
              key={s.l}
              value={Number(s.v)}
              label={s.l}
              start={armed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The hero showpiece — frame + parallax tilt wrapping the living portrait.
 * Three transform layers, one job each: the outer column sinks with scroll
 * (CSS), the rise plays the entrance, the frame holds perspective + tilt.
 */
export function HeroShowpiece({ d }: { d: PreviewDictionary }) {
  const frameRef = useRef<HTMLDivElement>(null);
  useTilt(frameRef);
  return (
    <div className="dd-hero-showpiece" aria-hidden="true">
      <div
        className="dd-hero-rise"
        style={{ "--rise-delay": "900ms" } as React.CSSProperties}
      >
        <div className="dd-hero-showpiece-frame" ref={frameRef}>
          <LivePortrait d={d} />
        </div>
      </div>
    </div>
  );
}
