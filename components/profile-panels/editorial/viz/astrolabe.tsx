/**
 * Astrolabe — Schwartz 10-value map rendered as a celestial chart.
 *
 * Each value takes a fixed angle around the circle; its radius is driven by
 * its rank (rank 1 = outer ring, rank 10 = inner ring). Top-3 are rendered
 * as Fraunces italic roman numerals (I, II, III) with a magnitude glow. A
 * conflict pair is drawn as a dashed chord.
 *
 * The point of this visual: values don't compete on a bar chart — they
 * orbit each other. Rank matters, but so does the constellation they form.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AstrolabePoint {
  key: string;
  label: string;
  /** 1 = highest rank, 10 = lowest */
  rank: number;
}

interface AstrolabeProps {
  points: AstrolabePoint[];
  /** Pair of value keys with a detected tension */
  conflictPair?: { a: string; b: string } | null;
  /** Size in pixels (renders as square). */
  size?: number;
  className?: string;
}

const ROMAN = ["", "I", "II", "III"];

export function Astrolabe({
  points,
  conflictPair,
  size = 320,
  className,
}: AstrolabeProps) {
  const n = points.length;
  if (n === 0) return null;

  // Geometry
  const cx = 50;
  const cy = 50;
  const outerR = 42; // rank 1
  const innerR = 14; // rank n
  // Map rank 1..n to outerR..innerR
  const radiusForRank = (rank: number) => {
    const t = (rank - 1) / Math.max(1, n - 1);
    return outerR - t * (outerR - innerR);
  };

  const angleForIndex = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  // Compute positions keyed by value name for conflict lookup
  const positions = new Map<
    string,
    { x: number; y: number; rank: number; index: number }
  >();
  points.forEach((p, i) => {
    const a = angleForIndex(i);
    const r = radiusForRank(p.rank);
    positions.set(p.key, {
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      rank: p.rank,
      index: i,
    });
  });

  const conflictA = conflictPair && positions.get(conflictPair.a);
  const conflictB = conflictPair && positions.get(conflictPair.b);

  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size }}
      data-slot="astrolabe"
      role="img"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="astrolabe-center" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.12"
            />
            <stop
              offset="70%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.02"
            />
            <stop
              offset="100%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        {/* Central glow */}
        <circle cx={cx} cy={cy} r={outerR + 4} fill="url(#astrolabe-center)" />

        {/* Orbital rings — subtle guide lines for the outer, mid, inner tier */}
        {[outerR, (outerR + innerR) / 2, innerR].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--rev-rule)"
            strokeOpacity={0.4}
            strokeWidth={0.25}
            strokeDasharray="0.6 1.2"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Conflict chord (dashed) */}
        {conflictA && conflictB && (
          <line
            x1={conflictA.x}
            y1={conflictA.y}
            x2={conflictB.x}
            y2={conflictB.y}
            stroke="var(--rev-signal-attention)"
            strokeOpacity={0.7}
            strokeWidth={0.55}
            strokeDasharray="1.6 1.2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Star points */}
        {points.map((p, i) => {
          const pos = positions.get(p.key);
          if (!pos) return null;
          const isTop1 = p.rank === 1;
          const isTop2 = p.rank === 2;
          const isTop3 = p.rank === 3;
          const isTop = isTop1 || isTop2 || isTop3;
          const dotR = isTop1 ? 1.6 : isTop2 ? 1.3 : isTop3 ? 1.1 : 0.8;
          const haloR = isTop1 ? 3.5 : isTop2 ? 2.8 : isTop3 ? 2.4 : 0;
          return (
            <g key={`star-${i}`}>
              {haloR > 0 && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={haloR}
                  fill="var(--rev-glow-cold)"
                  opacity={isTop1 ? 0.22 : isTop2 ? 0.15 : 0.1}
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={dotR}
                fill={isTop ? "var(--rev-glow-cold)" : "var(--rev-ink-soft)"}
                opacity={isTop ? 1 : 0.55}
                stroke="var(--rev-paper)"
                strokeWidth={0.2}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* HTML labels overlaid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {points.map((p, i) => {
          const pos = positions.get(p.key);
          if (!pos) return null;
          const isTop = p.rank <= 3;
          // Push labels outward along their angle so they don't overlap the dot
          const a = angleForIndex(i);
          const labelOffset = 6; // in viewBox units
          const lx = pos.x + Math.cos(a) * labelOffset;
          const ly = pos.y + Math.sin(a) * labelOffset;
          return (
            <div
              key={`label-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
              style={{
                left: `${lx}%`,
                top: `${ly}%`,
                // Scale label max-width with the dial; at 320px we get ~112,
                // at 240px ~84 — keeps 10 labels from colliding on mobile.
                maxWidth: Math.round(Math.min(120, size * 0.35)),
              }}
            >
              {isTop && (
                <div
                  className="font-display italic text-rev-glow-cold leading-none mb-0.5"
                  style={{ fontSize: 11, letterSpacing: "0.04em" }}
                >
                  {ROMAN[p.rank] ?? ""}
                </div>
              )}
              <div
                className={cn(
                  "leading-tight",
                  isTop
                    ? "font-serif italic text-rev-ink text-[11px]"
                    : "font-sans text-rev-ink-soft/70 text-[10px]",
                )}
              >
                {p.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible summary */}
      <ol className="sr-only">
        {points.map((p) => (
          <li key={p.key}>
            {p.label} — rank {p.rank}
          </li>
        ))}
      </ol>
    </div>
  );
}
