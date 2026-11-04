// ============================================================
// AppendixData — Collapsed-by-default raw measurements drawer.
//
// In the legacy Dive shell, the RIASEC radar + DPTI bars + AI-Era insight
// cards live mid-flow as primary content. The Revelation rewrite demotes
// them to an editorial appendix at the very end — silent until a curious
// reader opens the drawer.
//
// Founder decision (plan §P1.6): default closed, accept ~95% of users
// never see the radar. The full chart will live in the Deep Dive report.
// This appendix gives data-curious users enough to scratch the itch
// without crowding the result page.
// ============================================================

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AI_ERA_RIASEC_INSIGHTS,
  DPTI_LABELS,
  getDPTIScores,
  getDPTIInterpretation,
  type RiasecKey,
} from "@/components/quickdive/quickdive-data";

const RIASEC_DIM_LABELS: Record<string, { en: string; zh: string }> = {
  R: { en: "Realistic", zh: "实干派" },
  I: { en: "Investigative", zh: "探究派" },
  A: { en: "Artistic", zh: "创作派" },
  S: { en: "Social", zh: "助人派" },
  E: { en: "Enterprising", zh: "进取派" },
  C: { en: "Conventional", zh: "规则派" },
};

interface AppendixDataProps {
  sortedScores: [string, number][];
  primaryDim: string;
  locale: string;
  /** Max raw score per RIASEC dimension. Classic Mini-IP = 0-4 × 5 items = 20;
   *  immersive narrative = 1-5 × 5 items = 25. MUST match the active flow or the
   *  percentage/fraction over- or under-reports. Defaults to 20 (classic). */
  rawScoreMax?: number;
  /** Localised "APPENDIX · RAW MEASUREMENTS" eyebrow */
  eyebrow: string;
  /** Localised "Open the data drawer" toggle */
  toggleLabel: string;
  /** Optional localised section labels — body falls back to inline strings
   *  when keys are absent from the dictionary. */
  interestsLabel?: string;
  dptiLabel?: string;
  aiEraPositionLabel?: string;
  aiEraInsightLabel?: string;
  aiEraAdvantageLabel?: string;
  aiEraRiskLabel?: string;
  aiEraDirectionLabel?: string;
}

export function AppendixData({
  sortedScores,
  primaryDim,
  locale,
  rawScoreMax = 20,
  eyebrow,
  toggleLabel,
  interestsLabel,
  dptiLabel,
  aiEraPositionLabel,
  aiEraInsightLabel,
  aiEraAdvantageLabel,
  aiEraRiskLabel,
  aiEraDirectionLabel,
}: AppendixDataProps) {
  const [open, setOpen] = useState(false);
  const isZh = locale === "zh";
  const dpti = getDPTIScores(sortedScores);
  const dptiInterp = getDPTIInterpretation(dpti);
  const aiEra = AI_ERA_RIASEC_INSIGHTS[primaryDim];

  return (
    <section
      data-slot="rev-appendix"
      className="mx-auto max-w-[var(--rev-measure)] mt-10 mb-2"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="quickdive-appendix-toggle"
        className="group w-full flex items-center justify-between gap-4 py-5 border-t border-rev-rule transition-colors hover:bg-rev-paper-warm/40 px-4 -mx-4 rounded-[2px]"
      >
        <span className="flex flex-col items-start gap-1 text-left">
          <span className="font-sans uppercase font-medium tracking-[0.18em] text-[11px] text-rev-signal-info">
            {eyebrow}
          </span>
          <span className="font-serif italic text-rev-ink-soft text-[13px]">
            {toggleLabel}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="text-rev-ink-soft"
        >
          <ChevronDown size={18} strokeWidth={1.5} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="appendix-body"
            data-testid="quickdive-appendix-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-8 pb-4 space-y-10">
              {/* ── RIASEC scores — six dimensions, ranked ── */}
              <div>
                <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info mb-4">
                  {interestsLabel}
                </p>
                <dl className="space-y-2.5">
                  {sortedScores.map(([key, value]) => {
                    const label = RIASEC_DIM_LABELS[key];
                    // Divisor MUST match the scale: classic Mini-IP 0-4×5=20,
                    // immersive 1-5×5=25. Hardcoded /12 over-reported by 67%;
                    // hardcoded /20 still over-reported immersive — hence the
                    // rawScoreMax prop, set per exploreMode by the caller.
                    const pct = Math.round((value / rawScoreMax) * 100);
                    return (
                      <div
                        key={key}
                        className="flex items-baseline gap-3 font-serif text-[14px] text-rev-ink"
                      >
                        <dt className="w-10 font-sans tracking-[0.1em] text-[11px] text-rev-ink-soft">
                          {key}
                        </dt>
                        <dt className="flex-1 italic">
                          {label ? (isZh ? label.zh : label.en) : key}
                        </dt>
                        <dd className="tabular-nums text-rev-ink-soft">
                          {value}/{rawScoreMax}
                        </dd>
                        <dd className="w-10 text-right tabular-nums text-rev-ink-soft text-[12px]">
                          {pct}%
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              {/* ── DPTI orientation — four work-data axes ── */}
              <div>
                <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info mb-4">
                  {dptiLabel}
                </p>
                <dl className="space-y-2.5">
                  {(
                    Object.keys(DPTI_LABELS) as (keyof typeof DPTI_LABELS)[]
                  ).map((key) => {
                    const val = dpti[key];
                    const labelInfo = DPTI_LABELS[key];
                    const dimLabel = isZh ? labelInfo.zh : labelInfo.en;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 font-serif text-[14px] text-rev-ink"
                      >
                        <dt className="flex-1 italic">{dimLabel}</dt>
                        <div className="w-32 h-[3px] bg-rev-rule overflow-hidden">
                          <div
                            className="h-full bg-rev-glow-cold/70"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <dd className="w-10 text-right tabular-nums text-rev-ink-soft text-[12px]">
                          {val}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {dptiInterp && (
                  <p className="mt-4 font-serif italic text-rev-ink-soft text-[13px] leading-[1.7]">
                    {isZh ? dptiInterp.zh : dptiInterp.en}
                  </p>
                )}
              </div>

              {/* ── AI-era stance — three short paragraphs ── */}
              {aiEra && (
                <div>
                  <p className="font-sans uppercase tracking-[0.16em] text-[10px] text-rev-signal-info mb-4">
                    {aiEraInsightLabel ?? aiEraPositionLabel}
                  </p>
                  <div className="space-y-4 font-serif text-[14px] leading-[1.75] text-rev-ink">
                    <p>
                      <span className="block font-sans uppercase tracking-[0.14em] text-[10px] text-rev-signal-positive mb-1">
                        {aiEraAdvantageLabel}
                      </span>
                      {isZh ? aiEra.advantage.zh : aiEra.advantage.en}
                    </p>
                    <p>
                      <span className="block font-sans uppercase tracking-[0.14em] text-[10px] text-rev-signal-attention mb-1">
                        {aiEraRiskLabel}
                      </span>
                      {isZh ? aiEra.risk.zh : aiEra.risk.en}
                    </p>
                    <p>
                      <span className="block font-sans uppercase tracking-[0.14em] text-[10px] text-rev-signal-info mb-1">
                        {aiEraDirectionLabel}
                      </span>
                      {isZh ? aiEra.direction.zh : aiEra.direction.en}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Re-export so the main shell can keep its imports terse. */
export type { RiasecKey };
