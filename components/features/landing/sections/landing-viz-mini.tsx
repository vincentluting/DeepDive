"use client";

/**
 * Landing mini-visualizations — lightweight, static, theme-aware SVG/CSS
 * primitives the template needs but the product doesn't ship yet (area
 * sparkline, dot matrix, milestone timeline, coach-bubble preview).
 *
 * All are presentational: they take numbers + already-localized labels as
 * props (parents resolve text from the preview dictionary), so this file
 * holds zero display strings and stays i18n-clean. Colors come from the
 * Meridian base layer (--md-*), so light/dark adapt automatically.
 */
import * as React from "react";

/** Compact Catmull-Rom → cubic-Bezier smoothing for the sparkline. */
function smoothPath(xs: number[], ys: number[], tension = 0.5): string {
  const n = xs.length;
  if (n < 2) return n === 1 ? `M ${xs[0]} ${ys[0]}` : "";
  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0x = xs[i - 1] ?? xs[i];
    const p0y = ys[i - 1] ?? ys[i];
    const p2x = xs[i + 1];
    const p2y = ys[i + 1];
    const p3x = xs[i + 2] ?? xs[i + 1];
    const p3y = ys[i + 2] ?? ys[i + 1];
    const c1x = xs[i] + (p2x - p0x) * (tension / 3);
    const c1y = ys[i] + (p2y - p0y) * (tension / 3);
    const c2x = p2x - (p3x - xs[i]) * (tension / 3);
    const c2y = p2y - (p3y - ys[i]) * (tension / 3);
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2x.toFixed(2)} ${p2y.toFixed(2)}`;
  }
  return d;
}

/** Reality-fit / progress area chart from a 0..100 series. */
export function AreaSparkline({
  series,
  height = 56,
  className,
}: {
  series: readonly number[];
  height?: number;
  className?: string;
}) {
  const gid = React.useId();
  const n = series.length;
  const W = 100;
  const H = 40;
  const pad = 3;
  const xs = series.map((_, i) =>
    n > 1 ? pad + (i * (W - pad * 2)) / (n - 1) : W / 2,
  );
  const ys = series.map((v) => {
    const c = Math.max(0, Math.min(100, v));
    return H - pad - (c / 100) * (H - pad * 2);
  });
  const line = smoothPath(xs, ys, 0.5);
  const area = line
    ? `${line} L ${xs[n - 1].toFixed(2)} ${H} L ${xs[0].toFixed(2)} ${H} Z`
    : "";

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--md-sea)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--md-sea)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#spark-${gid})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="var(--md-sea)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={xs[n - 1]}
        cy={ys[n - 1]}
        r={1.7}
        fill="var(--md-gold)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Fit-signals dot matrix — `filled` of `total` dots lit per row. */
export function DotMatrix({
  rows,
  total,
  className,
}: {
  rows: readonly { key: string; filled: number }[];
  total: number;
  className?: string;
}) {
  return (
    <div className={`dd-dotmatrix${className ? ` ${className}` : ""}`}>
      {rows.map((r) => (
        <div key={r.key} className="dd-dotmatrix__row">
          {Array.from({ length: total }).map((_, i) => (
            <i key={i} data-on={i < r.filled ? "1" : "0"} aria-hidden="true" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton evidence-note rows (decorative line widths in %). */
export function EvidenceRows({
  widths,
  className,
}: {
  widths: readonly number[];
  className?: string;
}) {
  return (
    <div className={`dd-evidence${className ? ` ${className}` : ""}`}>
      {widths.map((w, i) => (
        <span key={i} className="dd-evidence__row">
          <i style={{ width: `${w}%` }} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Vertical milestone timeline with done/pending nodes. */
export function MilestoneTimeline({
  items,
  className,
}: {
  items: readonly { key: string; label: string; done: boolean }[];
  className?: string;
}) {
  return (
    <ol className={`dd-timeline${className ? ` ${className}` : ""}`}>
      {items.map((m) => (
        <li
          key={m.key}
          className="dd-timeline__item"
          data-done={m.done ? "1" : "0"}
        >
          <span className="dd-timeline__node" aria-hidden="true" />
          <span className="dd-timeline__label">{m.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Static coaching-conversation preview (assistant left, user right). */
export function CoachBubbles({
  turns,
  className,
}: {
  turns: readonly { role: "user" | "assistant"; text: string }[];
  className?: string;
}) {
  return (
    <div className={`dd-coach-preview${className ? ` ${className}` : ""}`}>
      {turns.map((t, i) => (
        <p key={i} className={`dd-coach-bubble dd-coach-bubble--${t.role}`}>
          {t.text}
        </p>
      ))}
    </div>
  );
}
