/**
 * PhaseDiagram — Two-axis coordinate plane with a luminous marker.
 *
 * Used for Interpersonal Energy (Agency × Communion) and any other
 * "where do you sit on two scales?" viz. Renders:
 *   - Thin cross axes
 *   - Four quadrant labels in Fraunces italic
 *   - Low/high axis endpoints as small sans caps
 *   - A single glowing dot at (x, y)
 *
 * Coordinate convention (0..100):
 *   x — horizontal, 0 = left, 100 = right
 *   y — vertical logical, 0 = bottom, 100 = top (display inverts)
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PhaseDiagramProps {
  /** 0..100 horizontal */
  x: number;
  /** 0..100 vertical (higher = up) */
  y: number;
  /** Italicised quadrant labels, NE = top-right, clockwise to NW. */
  quadrants: {
    NE: string;
    SE: string;
    SW: string;
    NW: string;
  };
  /** Endpoint labels for each axis (small sans caps). */
  axisLabels: {
    x: { low: string; high: string };
    y: { low: string; high: string };
  };
  /** Which quadrant is "active" — bolder label. */
  activeQuadrant?: "NE" | "SE" | "SW" | "NW";
  /** Size in px (square). Default 260. */
  size?: number;
  className?: string;
}

export function PhaseDiagram({
  x,
  y,
  quadrants,
  axisLabels,
  activeQuadrant,
  size = 260,
  className,
}: PhaseDiagramProps) {
  const cx = Math.max(0, Math.min(100, x));
  const cy = Math.max(0, Math.min(100, 100 - y)); // invert for display

  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size }}
      data-slot="phase-diagram"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="phase-marker-glow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.55"
            />
            <stop
              offset="100%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        {/* Outer border */}
        <rect
          x={0.5}
          y={0.5}
          width={99}
          height={99}
          fill="none"
          stroke="var(--rev-rule)"
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
        />

        {/* Cross axes */}
        <line
          x1={0}
          y1={50}
          x2={100}
          y2={50}
          stroke="var(--rev-rule)"
          strokeWidth={0.3}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={50}
          y1={0}
          x2={50}
          y2={100}
          stroke="var(--rev-rule)"
          strokeWidth={0.3}
          vectorEffect="non-scaling-stroke"
        />

        {/* Marker glow */}
        <circle cx={cx} cy={cy} r={8} fill="url(#phase-marker-glow)" />

        {/* Marker ring */}
        <circle
          cx={cx}
          cy={cy}
          r={2.8}
          fill="none"
          stroke="var(--rev-glow-cold)"
          strokeOpacity={0.55}
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
        />

        {/* Marker solid */}
        <circle
          cx={cx}
          cy={cy}
          r={1.8}
          fill="var(--rev-glow-cold)"
          stroke="var(--rev-paper)"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Quadrant labels in Fraunces italic */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {(
          [
            { q: "NE", top: "14%", left: "75%" },
            { q: "SE", top: "82%", left: "75%" },
            { q: "SW", top: "82%", left: "25%" },
            { q: "NW", top: "14%", left: "25%" },
          ] as const
        ).map(({ q, top, left }) => {
          const isActive = activeQuadrant === q;
          return (
            <div
              key={q}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 text-center",
                "font-display italic leading-[1.1]",
                isActive ? "text-rev-ink" : "text-rev-ink-soft/60",
              )}
              style={{
                top,
                left,
                fontSize: isActive ? 14 : 12,
                maxWidth: 100,
              }}
            >
              {quadrants[q]}
            </div>
          );
        })}
      </div>

      {/* Axis endpoint labels (small sans caps) */}
      <div
        className="absolute pointer-events-none font-sans uppercase tracking-[0.14em] text-[9px] text-rev-ink-soft/70"
        aria-hidden="true"
      >
        <span className="absolute left-1 top-1/2 -translate-y-1/2">
          {axisLabels.x.low}
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2">
          {axisLabels.x.high}
        </span>
        <span className="absolute top-1 left-1/2 -translate-x-1/2">
          {axisLabels.y.high}
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2">
          {axisLabels.y.low}
        </span>
      </div>
    </div>
  );
}
