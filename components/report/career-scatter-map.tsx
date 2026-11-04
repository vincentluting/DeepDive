"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CareerDirection, ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";

interface CareerScatterMapProps {
  directions: CareerDirection[];
  locale: Locale;
  t: ReportDict;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Career Match Scatter Map — a visual overview of all career directions
 * plotted on Interest Fit (X) vs Value Fit (Y), with bubble size = total match score.
 * Gives users an instant "one image, thousand words" overview before diving into cards.
 */
export function CareerScatterMap({
  directions,
  locale,
  t,
}: CareerScatterMapProps) {
  // SVG viewport dimensions — increased H to give labels breathing room
  const W = 320;
  const H = 260;
  const PAD_X = 40;
  const PAD_TOP = 24;
  const PAD_BOTTOM = 44;

  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  // P1 fix: dedupe by title_en + drop directions missing matchBreakdown.
  // Historical reports may have CareerDirection without matchBreakdown — guard
  // here so the report page never crashes on legacy data.
  const safeDirections = useMemo(() => {
    const seen = new Set<string>();
    const out: CareerDirection[] = [];
    for (const d of directions ?? []) {
      const breakdown = d.matchBreakdown;
      const x = breakdown?.interestFit;
      const y = breakdown?.valueFit;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const key = getLocalizedField(d, "title", locale) || String(d.rank);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(d);
    }
    return out;
  }, [directions, locale]);

  // Compute scale from data range (add buffer so dots don't sit on edges)
  const bounds = useMemo(() => {
    if (safeDirections.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    let minX = 100,
      maxX = 0,
      minY = 100,
      maxY = 0;
    for (const d of safeDirections) {
      const x = d.matchBreakdown.interestFit;
      const y = d.matchBreakdown.valueFit;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    // Add 15% buffer so points don't sit on edges
    const rangeX = Math.max(maxX - minX, 20);
    const rangeY = Math.max(maxY - minY, 20);
    return {
      minX: Math.max(0, minX - rangeX * 0.15),
      maxX: Math.min(100, maxX + rangeX * 0.15),
      minY: Math.max(0, minY - rangeY * 0.15),
      maxY: Math.min(100, maxY + rangeY * 0.15),
    };
  }, [safeDirections]);

  const scaleX = (v: number) =>
    PAD_X + ((v - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
  const scaleY = (v: number) =>
    PAD_TOP + plotH - ((v - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;

  // Bubble radius from match score (min 6, max 14 — smaller to reduce overlap)
  const radius = (score: number) => 6 + (score / 100) * 8;

  // Resolved bubble centers. Directions with near-identical fit scores (e.g.
  // three roles all at ~86% interest) would otherwise stack into one blob.
  // Start from the true plotted position, then run a few rounds of pairwise
  // repulsion so overlapping bubbles spread apart while staying close to their
  // real coordinates. Deterministic (index-based separation, no Math.random)
  // so it is stable across renders.
  const points = useMemo(() => {
    const pts = safeDirections.map((d) => {
      const score = Number.isFinite(d.matchScore)
        ? (d.matchScore as number)
        : 0;
      return {
        cx: scaleX(d.matchBreakdown.interestFit),
        cy: scaleY(d.matchBreakdown.valueFit),
        r: radius(score),
      };
    });
    const GAP = 5;
    const minX = PAD_X;
    const maxX = W - PAD_X;
    const minY = PAD_TOP;
    const maxY = H - PAD_BOTTOM;
    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          let dx = b.cx - a.cx;
          let dy = b.cy - a.cy;
          let dist = Math.hypot(dx, dy);
          const minDist = a.r + b.r + GAP;
          if (dist >= minDist) continue;
          if (dist < 0.01) {
            // Coincident points — separate along a deterministic angle.
            const angle = (j * 2.399963) % (Math.PI * 2); // golden angle
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.cx = Math.min(maxX, Math.max(minX, a.cx - ux * push));
          a.cy = Math.min(maxY, Math.max(minY, a.cy - uy * push));
          b.cx = Math.min(maxX, Math.max(minX, b.cx + ux * push));
          b.cy = Math.min(maxY, Math.max(minY, b.cy + uy * push));
          moved = true;
        }
      }
      if (!moved) break;
    }
    return pts;
  }, [safeDirections, bounds]);

  // Pre-compute label slots with greedy collision detection. Each bubble gets
  // a slot (above/below) + dynamic tier (0..N). When all currently-placed
  // slots collide, we keep incrementing tier so the 5th+ bubble in a dense
  // cluster always finds a free vertical band rather than silently stacking.
  const COLLISION_THRESHOLD = 56; // px in SVG coords (wider for wrapped 2-line labels)
  const labelPositions = useMemo(() => {
    const positions: Array<{ above: boolean; tier: number }> = [];
    // placed[tier] = { below: number[]; above: number[] }
    const placed: Array<{ below: number[]; above: number[] }> = [
      { below: [], above: [] },
    ];
    const collides = (xs: number[], cx: number) =>
      xs.some((px) => Math.abs(px - cx) < COLLISION_THRESHOLD);
    safeDirections.forEach((d, idx) => {
      const cx = points[idx]?.cx ?? scaleX(d.matchBreakdown.interestFit);
      // Walk tiers from 0 upward; at each tier try below then above before
      // escalating. Guarantees no two labels share a (tier, side, ~x) cell.
      let tier = 0;
      while (true) {
        if (!placed[tier]) placed.push({ below: [], above: [] });
        if (!collides(placed[tier].below, cx)) {
          positions.push({ above: false, tier });
          placed[tier].below.push(cx);
          return;
        }
        if (!collides(placed[tier].above, cx)) {
          positions.push({ above: true, tier });
          placed[tier].above.push(cx);
          return;
        }
        tier += 1;
      }
    });
    return positions;
  }, [safeDirections, bounds, points]);

  if (safeDirections.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_QUINT }}
      className="w-full max-w-md mx-auto mb-8"
    >
      <p
        className="section-label text-center mb-3"
        style={{ color: "var(--report-micro-label)", opacity: 0.6 }}
      >
        {t.scatterMapLabel}
      </p>

      <div
        className="rounded-xl p-3 sm:p-4 ocean-border-card"
        style={{
          background: "var(--report-card-bg)",
          border: "1px solid var(--report-card-border)",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${t.scatterMapAriaLabel} — ${safeDirections
            .map(
              (d) =>
                `${d.rank}: ${getLocalizedField(d, "title", locale)} (${Math.round(
                  Number.isFinite(d.matchScore) ? (d.matchScore as number) : 0,
                )}%)`,
            )
            .join(", ")}`}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <g key={frac}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={PAD_TOP + plotH * (1 - frac)}
                y2={PAD_TOP + plotH * (1 - frac)}
                stroke="var(--report-card-border)"
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
              <line
                y1={PAD_TOP}
                y2={H - PAD_BOTTOM}
                x1={PAD_X + plotW * frac}
                x2={PAD_X + plotW * frac}
                stroke="var(--report-card-border)"
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
            </g>
          ))}

          {/* Axes */}
          <line
            x1={PAD_X}
            y1={H - PAD_BOTTOM}
            x2={W - PAD_X}
            y2={H - PAD_BOTTOM}
            stroke="var(--report-text-tertiary)"
            strokeWidth={1}
          />
          <line
            x1={PAD_X}
            y1={PAD_TOP}
            x2={PAD_X}
            y2={H - PAD_BOTTOM}
            stroke="var(--report-text-tertiary)"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <text
            x={W / 2}
            y={H - 24}
            textAnchor="middle"
            fill="var(--report-text-secondary)"
            fontSize={9}
            fontFamily="var(--font-sans)"
          >
            {t.scatterAxisInterest}
          </text>
          <text
            x={10}
            y={PAD_TOP + plotH / 2}
            textAnchor="middle"
            fill="var(--report-text-secondary)"
            fontSize={9}
            fontFamily="var(--font-sans)"
            transform={`rotate(-90, 10, ${PAD_TOP + plotH / 2})`}
          >
            {t.scatterAxisValues}
          </text>

          {/* Data points */}
          {safeDirections.map((d, i) => {
            // De-overlapped center (falls back to the raw plotted position).
            const cx = points[i]?.cx ?? scaleX(d.matchBreakdown.interestFit);
            const cy = points[i]?.cy ?? scaleY(d.matchBreakdown.valueFit);
            // Sanitize matchScore — guards against non-number/NaN producing r="undefined"
            const safeScore = Number.isFinite(d.matchScore)
              ? (d.matchScore as number)
              : 0;
            const r = radius(safeScore);
            const title = getLocalizedField(d, "title", locale);
            const slot = labelPositions[i] ?? { above: false, tier: 0 };
            // Label box dimensions in SVG units; CSS inside <foreignObject>
            // handles natural wrapping so long titles like "Health
            // Information Manager" are never cut off mid-word.
            const labelW = 88;
            const labelH = 28;
            // Vertical offset from bubble edge. Tier 0 = adjacent; each
            // additional tier pushes label by one labelH band further to
            // separate dense clusters.
            const offsetBase = 4;
            const offsetPerTier = labelH + 4;
            const offset = offsetBase + slot.tier * offsetPerTier;
            const rawLabelY = slot.above
              ? cy - r - offset - labelH
              : cy + r + offset;
            // P1 fix: clamp labelY so above/below labels at extreme valueFit
            // (0 or 100) stay inside the SVG viewBox instead of being cut off.
            const labelY = Math.min(Math.max(rawLabelY, 2), H - labelH - 2);

            return (
              <g
                key={d.rank}
                role="img"
                aria-label={`Rank ${d.rank}: ${title}, match score ${Math.round(
                  safeScore,
                )} percent`}
              >
                {/* Bubble — scale animation via wrapping groups (outer translate,
                    inner motion scale) to avoid framer-motion writing `r="undefined"`
                    on SVG circles when animating the r attribute directly. */}
                <g transform={`translate(${cx} ${cy})`}>
                  <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + i * 0.1,
                      ease: EASE_OUT_QUINT,
                    }}
                  >
                    <circle
                      r={r}
                      fill={d.rank === 1 ? "var(--md-gold)" : "var(--md-sea)"}
                      fillOpacity={Math.max(0.45, 1 - (d.rank - 1) * 0.15)}
                      stroke="var(--report-card-bg)"
                      strokeWidth={1.5}
                    />
                  </motion.g>
                </g>
                {/* Rank number inside bubble */}
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={r > 10 ? 9 : 7}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  style={{ pointerEvents: "none" }}
                >
                  {d.rank}
                </text>
                {/* Label — uses foreignObject so CSS can wrap long titles */}
                <foreignObject
                  x={cx - labelW / 2}
                  y={labelY}
                  width={labelW}
                  height={labelH}
                  style={{ overflow: "visible" }}
                >
                  <div
                    style={{
                      fontSize: "8.5px",
                      lineHeight: "1.15",
                      textAlign: "center",
                      color: "var(--report-text-secondary)",
                      fontFamily: "var(--font-sans)",
                      wordBreak: "break-word",
                      hyphens: "auto",
                    }}
                  >
                    {title}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Legend — explains what bubble size and numbers represent */}
        <div
          className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-1 text-[10px] leading-snug"
          style={{ color: "var(--report-text-tertiary)" }}
        >
          <span>{t.scatterLegendSize}</span>
          <span>{t.scatterLegendRank}</span>
        </div>
      </div>
    </motion.div>
  );
}
