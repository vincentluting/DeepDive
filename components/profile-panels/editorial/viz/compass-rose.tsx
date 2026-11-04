/**
 * CompassRose — Five-direction compass used for TKI conflict modes.
 *
 * Each of the 5 modes occupies one compass point:
 *   N  — Competing     (high assertiveness, low cooperativeness)
 *   E  — Collaborating (high + high)
 *   S  — Accommodating (low + high)
 *   W  — Avoiding      (low + low)
 *   C  — Compromising  (middle, drawn at origin)
 *
 * Primary gets a gold needle; secondary, a shorter silver one.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CompassDirection = "N" | "E" | "S" | "W" | "C";

export interface CompassRoseProps {
  primary: CompassDirection;
  secondary?: CompassDirection | null;
  /** Localised labels per direction */
  labels: Record<CompassDirection, string>;
  /** Size in px (square). Default 260. */
  size?: number;
  className?: string;
}

// Angle in radians for each compass direction (SVG y-down)
const DIR_ANGLE: Record<CompassDirection, number> = {
  N: -Math.PI / 2,
  E: 0,
  S: Math.PI / 2,
  W: Math.PI,
  C: 0,
};

const DIR_LABEL_POS: Record<CompassDirection, { top: string; left: string }> = {
  N: { top: "6%", left: "50%" },
  E: { top: "50%", left: "94%" },
  S: { top: "94%", left: "50%" },
  W: { top: "50%", left: "6%" },
  C: { top: "50%", left: "50%" },
};

export function CompassRose({
  primary,
  secondary,
  labels,
  size = 260,
  className,
}: CompassRoseProps) {
  const cx = 50;
  const cy = 50;
  const outerR = 38;
  const primaryR = outerR - 4;
  const secondaryR = primaryR * 0.7;

  const renderNeedle = (
    dir: CompassDirection,
    tone: "gold" | "silver",
    length: number,
  ) => {
    if (dir === "C") {
      // Centre mark — a small diamond
      const d = tone === "gold" ? 2.2 : 1.6;
      return (
        <g key={`center-${tone}`}>
          <polygon
            points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
            fill={
              tone === "gold"
                ? "var(--rev-signal-attention)"
                : "var(--rev-ink-soft)"
            }
            opacity={tone === "gold" ? 0.95 : 0.65}
          />
        </g>
      );
    }
    const angle = DIR_ANGLE[dir];
    const tipX = cx + Math.cos(angle) * length;
    const tipY = cy + Math.sin(angle) * length;
    // Base width perpendicular for triangle needle
    const perp = angle + Math.PI / 2;
    const baseR = tone === "gold" ? 2 : 1.3;
    const bx1 = cx + Math.cos(perp) * baseR;
    const by1 = cy + Math.sin(perp) * baseR;
    const bx2 = cx - Math.cos(perp) * baseR;
    const by2 = cy - Math.sin(perp) * baseR;
    const stroke =
      tone === "gold" ? "var(--rev-signal-attention)" : "var(--rev-ink-soft)";
    return (
      <g key={`needle-${dir}-${tone}`}>
        <polygon
          points={`${tipX.toFixed(2)},${tipY.toFixed(2)} ${bx1.toFixed(2)},${by1.toFixed(2)} ${bx2.toFixed(2)},${by2.toFixed(2)}`}
          fill={stroke}
          opacity={tone === "gold" ? 0.95 : 0.55}
        />
      </g>
    );
  };

  return (
    <div
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size }}
      data-slot="compass-rose"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="compass-center-glow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.08"
            />
            <stop
              offset="100%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        {/* Outer dial */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="none"
          stroke="var(--rev-rule)"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerR * 0.72}
          fill="url(#compass-center-glow)"
          stroke="var(--rev-rule)"
          strokeOpacity={0.4}
          strokeWidth={0.3}
          strokeDasharray="0.6 1.2"
          vectorEffect="non-scaling-stroke"
        />

        {/* 4 cardinal tick marks */}
        {(["N", "E", "S", "W"] as const).map((dir) => {
          const a = DIR_ANGLE[dir];
          const x1 = cx + Math.cos(a) * (outerR - 3);
          const y1 = cy + Math.sin(a) * (outerR - 3);
          const x2 = cx + Math.cos(a) * outerR;
          const y2 = cy + Math.sin(a) * outerR;
          return (
            <line
              key={`tick-${dir}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--rev-rule)"
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Secondary needle (silver) — draw first so primary sits on top */}
        {secondary && renderNeedle(secondary, "silver", secondaryR)}
        {/* Primary needle (gold) */}
        {renderNeedle(primary, "gold", primaryR)}

        {/* Pivot dot */}
        <circle cx={cx} cy={cy} r={0.9} fill="var(--rev-ink)" opacity={0.8} />
      </svg>

      {/* Direction labels */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {(["N", "E", "S", "W", "C"] as const).map((dir) => {
          const pos = DIR_LABEL_POS[dir];
          const isPrimary = dir === primary;
          const isSecondary = dir === secondary;
          return (
            <div
              key={`label-${dir}`}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap",
                isPrimary
                  ? "font-display italic text-rev-ink text-[13px]"
                  : isSecondary
                    ? "font-serif italic text-rev-ink-soft text-[11px]"
                    : "font-sans uppercase tracking-[0.12em] text-rev-ink-soft/60 text-[10px]",
              )}
              style={{
                top: pos.top,
                left: pos.left,
                // Pull center label up slightly so it doesn't overlap pivot
                transform:
                  dir === "C"
                    ? "translate(-50%, calc(-50% + 14px))"
                    : undefined,
              }}
            >
              {labels[dir]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
