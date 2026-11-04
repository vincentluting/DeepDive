"use client";

import { motion } from "framer-motion";
import { Sparkles, Compass, Brain } from "lucide-react";
import type { ReportDict } from "@/lib/types";
import { SCHWARTZ_VALUE_LABELS } from "@/lib/scoring/constants";
import type { Locale } from "@/lib/i18n/config";
import { pickLocaleText } from "@/lib/i18n/localize";
import { ChapterEyebrow } from "@/components/revelation/chapter-eyebrow";

interface StrengthsSummaryProps {
  archetypeLabel: string;
  coreStrengths: Array<
    { zh: string; en: string } & Partial<Record<Locale, string>>
  >;
  coreInsight: string | undefined;
  locale: Locale;
  t: ReportDict;
  /** Top 3 Schwartz value keys (e.g. ['self-direction', 'achievement', 'benevolence']) */
  schwartzTop3?: string[] | null;
  /** 4-letter cognitive style code (e.g. 'INTJ') or null if balanced */
  cognitiveStyleCode?: string | null;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * "Strengths You Already Have" — affirm before directing.
 * Displays archetype-derived core strengths + the integration coreInsight.
 * Positioned between Career Anchors and Career Match.
 */
export function StrengthsSummary({
  archetypeLabel,
  coreStrengths,
  coreInsight,
  locale,
  t,
  schwartzTop3,
  cognitiveStyleCode,
}: StrengthsSummaryProps) {
  if (!coreStrengths || coreStrengths.length === 0) return null;

  const introText = (t.strengthsSummaryArchetypeIntro || "").replace(
    "{{archetype}}",
    archetypeLabel,
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_QUINT }}
        className="text-center mb-8"
      >
        <ChapterEyebrow className="mb-2">
          {t.strengthsSummaryLabel}
        </ChapterEyebrow>
        <h2
          className="text-xl sm:text-2xl font-semibold mb-3"
          style={{ color: "var(--report-text-primary)" }}
        >
          {t.strengthsSummaryTitle}
        </h2>
        <p
          className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--report-text-secondary)" }}
        >
          {t.strengthsSummarySubtitle}
        </p>
      </motion.div>

      {/* Archetype strengths */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT_QUINT }}
        className="rounded-xl p-4 sm:p-5"
        style={{
          background: "var(--report-card-bg)",
          backdropFilter: "var(--report-card-backdrop)",
          border: "1px solid var(--report-card-border)",
        }}
      >
        <p
          className="text-sm mb-4 leading-relaxed"
          style={{ color: "var(--report-text-secondary)" }}
        >
          {introText}
        </p>
        <div className="space-y-2">
          {coreStrengths.map((strength, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.5 + i * 0.1,
                ease: EASE_OUT_QUINT,
              }}
              className="flex items-start gap-2.5"
            >
              <Sparkles
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--color-grad-from)" }}
              />
              <span
                className="text-sm leading-relaxed"
                style={{ color: "var(--report-text-primary)" }}
              >
                {pickLocaleText(strength, locale)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cross-framework strength signals: values + cognitive style */}
      {(schwartzTop3?.length || cognitiveStyleCode) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: EASE_OUT_QUINT }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {/* Schwartz top 3 values as pills */}
          {schwartzTop3 && schwartzTop3.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Compass
                className="w-3 h-3 shrink-0"
                style={{ color: "var(--report-tag-label)", opacity: 0.6 }}
              />
              <span
                className="text-[10px] font-medium uppercase tracking-wider mr-0.5"
                style={{ color: "var(--report-tag-label)", opacity: 0.6 }}
              >
                {t.strengthsSummaryValuesLabel}
              </span>
              {schwartzTop3.map((val) => {
                const label =
                  SCHWARTZ_VALUE_LABELS[
                    val as keyof typeof SCHWARTZ_VALUE_LABELS
                  ];
                return (
                  <span
                    key={val}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      background: "var(--report-card-bg)",
                      border: "1px solid var(--report-card-border)",
                      color: "var(--report-text-primary)",
                    }}
                  >
                    {label ? pickLocaleText(label, locale) : val}
                  </span>
                );
              })}
            </div>
          )}

          {/* Cognitive style badge */}
          {cognitiveStyleCode && (
            <div className="flex items-center gap-1.5">
              <Brain
                className="w-3 h-3 shrink-0"
                style={{ color: "var(--report-tag-label)", opacity: 0.6 }}
              />
              <span
                className="text-[10px] font-medium uppercase tracking-wider mr-0.5"
                style={{ color: "var(--report-tag-label)", opacity: 0.6 }}
              >
                {t.strengthsSummaryCognitiveLabel}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium"
                style={{
                  background: "var(--report-card-bg)",
                  border: "1px solid var(--report-card-border)",
                  color: "var(--report-text-primary)",
                }}
              >
                {cognitiveStyleCode}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Core insight */}
      {coreInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: EASE_OUT_QUINT }}
          className="mt-4 rounded-xl p-4 sm:p-5"
          style={{
            background: "var(--report-card-bg)",
            border: "1px solid var(--report-card-border)",
          }}
        >
          <p
            className="text-[10px] font-medium uppercase tracking-[0.08em] mb-2"
            style={{ color: "var(--report-tag-label)" }}
          >
            {t.strengthsSummaryCoreInsightLabel}
          </p>
          <p
            className="text-sm leading-relaxed italic"
            style={{ color: "var(--report-text-secondary)" }}
          >
            {coreInsight}
          </p>
        </motion.div>
      )}
    </div>
  );
}
