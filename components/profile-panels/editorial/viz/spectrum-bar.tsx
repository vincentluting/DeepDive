/**
 * SpectrumBar — Editorial "light spectrum" bar replacing progress / bidirectional
 * fill bars across Inner Landscape panels.
 *
 * Uses a subtle gradient track + a small archetype-coloured dot to mark the
 * value position. Two modes:
 *
 *   - **uni**: value 0..100, fills from left to right (Big Five, pref strength)
 *   - **bidirectional**: value 0..100 where 50 is centre; fills from 50 outward
 *     to left or right (MBTI-style cognitive axes)
 *
 * Intentionally CSS-variable driven so it inherits rev-* palette; animations
 * respect prefers-reduced-motion via globals.css.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpectrumBarProps {
  /** 0..100. In bidirectional mode, 50 is center. */
  value: number;
  /** Fill colour. Defaults to cold-glow. */
  color?: string;
  /** Track background colour. */
  trackColor?: string;
  /** Track height in px. Default 6. */
  height?: number;
  /** Render from centre outwards instead of left-to-right. */
  bidirectional?: boolean;
  /** Draw a subtle vertical tick at the centre. */
  centerTick?: boolean;
  /** Draw a small dot marker at the value position. */
  marker?: boolean;
  /** Animate width on mount (disabled automatically under reduced-motion). */
  animated?: boolean;
  /** Extra class on the outer wrapper. */
  className?: string;
}

export function SpectrumBar({
  value,
  color = "var(--rev-glow-cold)",
  trackColor = "var(--rev-paper-warm)",
  height = 6,
  bidirectional = false,
  centerTick = false,
  marker = false,
  animated = true,
  className,
}: SpectrumBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const [mounted, setMounted] = React.useState(!animated);

  React.useEffect(() => {
    if (!animated) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [animated]);

  // Compute fill position/width for each mode
  let fillStyle: React.CSSProperties;
  if (bidirectional) {
    // value 50 is centre; distance from 50 becomes half-width
    const distance = mounted ? clamped - 50 : 0;
    const absWidth = Math.abs(distance);
    const leftPct = distance >= 0 ? 50 : 50 - absWidth;
    fillStyle = {
      left: `${leftPct}%`,
      width: `${absWidth}%`,
      backgroundColor: color,
      opacity: 0.72,
      transition: animated
        ? "left 600ms ease-out, width 600ms ease-out"
        : undefined,
    };
  } else {
    fillStyle = {
      left: 0,
      width: `${mounted ? clamped : 0}%`,
      backgroundColor: color,
      opacity: 0.72,
      transition: animated ? "width 700ms ease-out" : undefined,
    };
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-full", className)}
      style={{ height, backgroundColor: trackColor }}
      data-slot="spectrum-bar"
      aria-hidden="true"
    >
      {centerTick && (
        <div
          className="absolute top-0 bottom-0 w-px bg-rev-rule/70"
          style={{ left: "50%" }}
        />
      )}
      <div className="absolute top-0 bottom-0 rounded-full" style={fillStyle} />
      {marker && (
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `calc(${mounted ? clamped : 0}% - 4px)`,
            width: 8,
            height: 8,
            backgroundColor: color,
            boxShadow: `0 0 0 2px var(--rev-paper)`,
            transition: animated ? "left 700ms ease-out" : undefined,
          }}
        />
      )}
    </div>
  );
}
