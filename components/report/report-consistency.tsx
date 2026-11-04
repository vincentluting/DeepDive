"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import type { ReportDict } from "@/lib/types";

interface ReportConsistencyProps {
  /** SJT behavioral consistency on a 0-1 scale (proportion of dilemmas where
   *  the ideal "should" choice matched the likely "would" choice). */
  consistency?: number | null;
  t: ReportDict;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * "Ideals vs. Actions" — surfaces the SJT should/would consistency in the
 * report (Shadow chapter). Previously computed but never shown to the reader.
 *
 * The number is specific to this reader and band-interpreted constructively
 * (high alignment / workable gap / active negotiation) — anti-Barnum, not a
 * generic statement. Returns null when no SJT data exists (e.g. Quick Dive).
 */
export function ReportConsistency({ consistency, t }: ReportConsistencyProps) {
  if (consistency == null || Number.isNaN(consistency)) return null;

  const clamped = Math.max(0, Math.min(1, consistency));
  const pct = Math.round(clamped * 100);
  const band =
    clamped >= 0.67
      ? t.consistencyHigh
      : clamped >= 0.34
        ? t.consistencyModerate
        : t.consistencyLow;
  if (!band) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
      className="w-full max-w-2xl mx-auto px-4 sm:px-6 mt-8"
    >
      <div
        className="rounded-xl p-4 sm:p-5"
        style={{
          background: "var(--report-card-bg)",
          backdropFilter: "var(--report-card-backdrop)",
          border: "1px solid var(--report-card-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Scale
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--report-tag-label)" }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-[0.15em]"
            style={{ color: "var(--report-tag-label)" }}
          >
            {t.consistencyEyebrow}
          </span>
          <span
            className="ml-auto text-2xl font-semibold tabular-nums"
            style={{ color: "var(--report-text-primary)" }}
          >
            {pct}%
          </span>
        </div>

        {/* Alignment bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mb-3"
          style={{ background: "var(--report-tag-bg)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "var(--report-text-secondary)",
            }}
          />
        </div>

        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--report-text-secondary)" }}
        >
          {band}
        </p>
      </div>
    </motion.div>
  );
}
