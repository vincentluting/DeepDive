/**
 * TerrainLine — RIASEC as a horizon line.
 *
 * Replaces the recharts radar with an editorial topography: 6 dimensions laid
 * out left-to-right, their scores turned into a smooth Catmull-Rom–Bezier
 * contour. High scores become "peaks", low scores become "valleys". The top
 * two peaks get a Fraunces label; the rest get a subtle tick + sans label
 * underneath.
 *
 * Why this beats the radar in editorial context:
 *   - No polar distortion — perceptually linear, like reading a skyline
 *   - Sits flat in the page, doesn't demand a square aspect
 *   - Labels can be real HTML typography instead of SVG <text>
 *
 * CSS only depends on rev-* variables. No third-party chart library.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TerrainPoint {
  key: string;
  label: string;
  sublabel?: string;
  /** 0..100 */
  value: number;
  /** CSS colour for the peak dot + top-2 label */
  color: string;
}

interface TerrainLineProps {
  /** 6 dimension points in display order */
  points: TerrainPoint[];
  /** Height of the skyline in px. Default 200 */
  height?: number;
  /** Visual top vertical margin (reserved for top-2 Fraunces labels) */
  labelSpace?: number;
  /** Subtle halo behind top-2 peaks */
  halo?: boolean;
  /** Animate path draw on mount */
  animated?: boolean;
  className?: string;
}

/** Simple Catmull-Rom → cubic-Bezier conversion for smooth peaks. */
function buildSmoothPath(xs: number[], ys: number[], tension = 0.5): string {
  const n = xs.length;
  if (n === 0) return "";
  if (n === 1) return `M ${xs[0]} ${ys[0]}`;

  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0x = xs[i - 1] ?? xs[i];
    const p0y = ys[i - 1] ?? ys[i];
    const p1x = xs[i];
    const p1y = ys[i];
    const p2x = xs[i + 1];
    const p2y = ys[i + 1];
    const p3x = xs[i + 2] ?? xs[i + 1];
    const p3y = ys[i + 2] ?? ys[i + 1];

    const c1x = p1x + (p2x - p0x) * (tension / 3);
    const c1y = p1y + (p2y - p0y) * (tension / 3);
    const c2x = p2x - (p3x - p1x) * (tension / 3);
    const c2y = p2y - (p3y - p1y) * (tension / 3);

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2x.toFixed(2)} ${p2y.toFixed(2)}`;
  }
  return d;
}

export function TerrainLine({
  points,
  height = 200,
  labelSpace = 56,
  halo = true,
  animated = true,
  className,
}: TerrainLineProps) {
  // Opacity-based fade-in. We don't animate the SVG `d` attribute: it's
  // inconsistently supported across browsers, and the old approach of
  // flattening ys to the baseline during the pre-mount frame caused a
  // visible "pop" instead of a smooth reveal. Opacity fade is universally
  // supported and honours prefers-reduced-motion via globals.css.
  const [mounted, setMounted] = React.useState(!animated);
  React.useEffect(() => {
    if (!animated) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [animated]);

  // viewBox coordinates (0..100 × 0..60). We'll scale to the container.
  const VB_W = 100;
  const VB_H = 60;
  const BASELINE_Y = VB_H - 4; // leave 4u for baseline rule
  const TOP_Y = 6; // leave 6u headroom for highest peak

  const n = points.length;
  const padX = 6;
  const stepX = n > 1 ? (VB_W - padX * 2) / (n - 1) : 0;
  const xs = points.map((_, i) => padX + i * stepX);
  const ys = points.map((p) => {
    const usable = BASELINE_Y - TOP_Y;
    const v = Math.max(0, Math.min(100, p.value));
    return BASELINE_Y - (v / 100) * usable;
  });

  const linePath = buildSmoothPath(xs, ys, 0.5);
  const areaPath = linePath
    ? `${linePath} L ${xs[n - 1].toFixed(2)} ${BASELINE_Y} L ${xs[0].toFixed(2)} ${BASELINE_Y} Z`
    : "";

  // Determine top-2 indices (stable ties by order)
  const ranked = points
    .map((p, i) => ({ i, v: p.value }))
    .sort((a, b) => b.v - a.v);
  const top1 = ranked[0]?.i ?? -1;
  const top2 = ranked[1]?.i ?? -1;

  const totalHeight = height + labelSpace;

  return (
    <div
      data-slot="terrain-line"
      className={cn("relative w-full", className)}
      style={{ height: totalHeight }}
    >
      <svg
        className="absolute inset-x-0"
        style={{
          top: labelSpace,
          height,
          opacity: mounted ? 1 : 0,
          transition: animated ? "opacity 700ms ease-out" : undefined,
        }}
        width="100%"
        height={height}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="terrain-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.18"
            />
            <stop
              offset="100%"
              stopColor="var(--rev-glow-cold)"
              stopOpacity="0.03"
            />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line
          x1={padX}
          y1={BASELINE_Y}
          x2={VB_W - padX}
          y2={BASELINE_Y}
          stroke="var(--rev-rule)"
          strokeWidth={0.4}
          vectorEffect="non-scaling-stroke"
        />

        {/* area fill */}
        {areaPath && <path d={areaPath} fill="url(#terrain-area)" />}

        {/* smooth horizon line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--rev-ink)"
            strokeOpacity={0.55}
            strokeWidth={0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* dots per dimension */}
        {points.map((p, i) => {
          const isTop1 = i === top1;
          const isTop2 = i === top2;
          const isTop = isTop1 || isTop2;
          return (
            <g key={p.key}>
              {halo && isTop && (
                <circle
                  cx={xs[i]}
                  cy={ys[i]}
                  r={isTop1 ? 3 : 2.2}
                  fill={p.color}
                  opacity={isTop1 ? 0.2 : 0.13}
                />
              )}
              <circle
                cx={xs[i]}
                cy={ys[i]}
                r={isTop ? 1.3 : 1}
                fill={p.color}
                stroke="var(--rev-paper)"
                strokeWidth={0.3}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {/* Labels overlaid with real HTML typography */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: labelSpace }}
        aria-hidden="true"
      >
        {points.map((p, i) => {
          const isTop1 = i === top1;
          const isTop2 = i === top2;
          const isTop = isTop1 || isTop2;
          const xPct = xs[i];
          return (
            <div
              key={p.key}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${xPct}%`, bottom: 4, width: 100 }}
            >
              <div
                className="font-display font-normal leading-[1.05] tracking-[-0.01em]"
                style={{
                  fontSize: isTop1 ? 22 : isTop2 ? 18 : 14,
                  color: isTop ? p.color : "var(--rev-ink-soft)",
                  opacity: isTop ? 1 : 0.8,
                }}
              >
                {p.label}
              </div>
              {p.sublabel && (
                <div
                  className="font-sans uppercase tracking-[0.12em] leading-tight mt-1"
                  style={{
                    fontSize: 9,
                    color: isTop ? p.color : "var(--rev-ink-soft)",
                    opacity: isTop ? 0.7 : 0.55,
                  }}
                >
                  {p.sublabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score readout row beneath the skyline */}
      <div
        className="absolute inset-x-0"
        style={{ top: labelSpace + height, height: 24 }}
        aria-hidden="true"
      >
        {points.map((p, i) => (
          <div
            key={p.key}
            className="absolute -translate-x-1/2 text-center font-serif italic text-[11px] text-rev-ink-soft/75"
            style={{ left: `${xs[i]}%`, top: 2, width: 60 }}
          >
            {Math.round(p.value)}
          </div>
        ))}
      </div>

      {/* Accessible sr-only summary */}
      <dl className="sr-only">
        {points.map((p) => (
          <React.Fragment key={p.key}>
            <dt>{p.label}</dt>
            <dd>{Math.round(p.value)}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
