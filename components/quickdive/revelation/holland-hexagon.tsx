// ============================================================
// HollandHexagon — true six-axis RIASEC radar for the chart-archive result.
//
// A hexagonal radar (not the horizontal Terrain skyline) matching the Sounding
// chart-archive design: concentric isobath rings, six hairline spokes, a sea-ink
// data polygon, and brass vertex dots. Vertex positions are FIXED to the design
// layout — I at top, then clockwise R · E · A · S · C — so every report reads
// the same shape.
//
// Pure static SVG, responsive (viewBox + width 100%), SSR-safe. No animation —
// the plate reads the same on first paint and under reduced-motion.
// ============================================================

import type { RiasecKey } from "@/components/quickdive/quickdive-data";

/** Clockwise placement angle (degrees from top) per dimension — fixed to the
 *  design plate: I(top) → R → E → A → S → C. */
const ANGLE: Record<RiasecKey, number> = {
  I: 0,
  R: 60,
  E: 120,
  A: 180,
  S: 240,
  C: 300,
};

const ORDER: RiasecKey[] = ["I", "R", "E", "A", "S", "C"];

const VIEW = 320;
const C = VIEW / 2;
const MAX_R = 104;
const RINGS = [0.25, 0.5, 0.75, 1];

/** Rounded to 2dp so server and client serialize SVG coordinates to byte-
 *  identical strings (raw floats hydration-mismatch on the last digit). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function point(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [
    round2(C + radius * Math.sin(rad)),
    round2(C - radius * Math.cos(rad)),
  ];
}

function hexPath(radius: number): string {
  return (
    ORDER.map((k, i) => {
      const [x, y] = point(ANGLE[k], radius);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z"
  );
}

export interface HollandHexagonProps {
  /** Normalized 0–100 score per dimension. */
  scores: Record<RiasecKey, number>;
  /** Accessible description (localized by caller). */
  ariaLabel: string;
  className?: string;
}

export function HollandHexagon({
  scores,
  ariaLabel,
  className,
}: HollandHexagonProps) {
  const dataPoints = ORDER.map((k) => {
    const pct = Math.max(0, Math.min(100, Math.round(scores[k] ?? 0)));
    const [x, y] = point(ANGLE[k], (pct / 100) * MAX_R);
    return { k, pct, x, y };
  });

  const dataPath =
    dataPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
      )
      .join(" ") + " Z";

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        width="100%"
        height="auto"
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Concentric isobath rings */}
        {RINGS.map((r) => (
          <path
            key={r}
            d={hexPath(r * MAX_R)}
            fill="none"
            stroke="var(--rev-rule)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Spokes */}
        {ORDER.map((k) => {
          const [x, y] = point(ANGLE[k], MAX_R);
          return (
            <line
              key={k}
              x1={C}
              y1={C}
              x2={x}
              y2={y}
              stroke="var(--rev-rule)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={dataPath}
          fill="color-mix(in srgb, var(--rev-glow-cold) 22%, transparent)"
          stroke="var(--rev-signal-info)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Brass vertex dots */}
        {dataPoints.map((p) => (
          <circle
            key={p.k}
            cx={p.x}
            cy={p.y}
            r={3.6}
            fill="var(--rev-signal-attention)"
            stroke="var(--rev-paper)"
            strokeWidth={1.2}
          />
        ))}

        {/* Axis labels — letter + score, outside each vertex */}
        {dataPoints.map((p) => {
          const [lx, ly] = point(ANGLE[p.k], MAX_R + 26);
          const anchor = lx < C - 6 ? "end" : lx > C + 6 ? "start" : "middle";
          return (
            <text
              key={p.k}
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={15}
            >
              <tspan
                fontFamily="var(--font-display), Georgia, serif"
                fill="var(--rev-ink)"
              >
                {p.k}
              </tspan>
              <tspan
                dx={6}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                fill="var(--rev-signal-attention)"
                fontSize={13}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {p.pct}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
