"use client";

import { motion } from "framer-motion";
import type { PersonalProfileData } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getTermText } from "@/lib/content/term-glossary";

interface ConfidencePanelProps {
  profile: PersonalProfileData;
  locale: string;
}

const DIMENSION_KEYS = [
  "riasec",
  "bigFive",
  "collab",
  "values",
  "crossCultural",
] as const;

function getDimensionLabel(
  key: (typeof DIMENSION_KEYS)[number],
  t: Record<string, string>,
): string {
  if (key === "collab") return t.disc;
  return t[key];
}

// Color thresholds for confidence bars — mapped to Revelation signal tokens
function getConfidenceColor(value: number): {
  bar: string;
  text: string;
  bg: string;
  border: string;
} {
  if (value >= 0.7)
    return {
      bar: "bg-rev-signal-positive",
      text: "text-rev-signal-positive",
      bg: "bg-rev-paper",
      border: "border-l-rev-signal-positive",
    };
  if (value >= 0.5)
    return {
      bar: "bg-rev-signal-info",
      text: "text-rev-signal-info",
      bg: "bg-rev-paper",
      border: "border-l-rev-signal-info",
    };
  if (value >= 0.4)
    return {
      bar: "bg-rev-signal-attention",
      text: "text-rev-signal-attention",
      bg: "bg-rev-paper",
      border: "border-l-rev-signal-attention",
    };
  return {
    bar: "bg-rev-ink-soft/40",
    text: "text-rev-ink-soft",
    bg: "bg-rev-paper",
    border: "",
  };
}

// Confidence level descriptor
function getConfidenceLevel(value: number, t: Record<string, string>): string {
  if (value >= 0.7) return t.confidenceHigh;
  if (value >= 0.5) return t.confidenceMedium;
  if (value >= 0.4) return t.confidenceLow;
  return t.confidenceExploratory;
}

// Low confidence guidance
function getLowConfidenceHint(t: Record<string, string>): string {
  return t.lowConfidenceHint;
}

/** Get overall confidence narrative */
function getOverallNarrative(
  confidenceMap: PersonalProfileData["confidenceMap"],
  t: Record<string, string>,
): string {
  const values = Object.values(confidenceMap).filter(
    (v): v is number => v != null && v > 0,
  );
  if (values.length === 0) return t.confidenceOverallLow;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 0.6) return t.confidenceOverallHigh;
  if (avg >= 0.45) return t.confidenceOverallMedium;
  return t.confidenceOverallLow;
}

export function ConfidencePanel({ profile, locale }: ConfidencePanelProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const { confidenceMap } = profile;

  // Sort dimensions: high confidence first for visual prominence
  const sortedKeys = [...DIMENSION_KEYS].sort((a, b) => {
    return (confidenceMap[b] ?? 0) - (confidenceMap[a] ?? 0);
  });

  const overallNarrative = getOverallNarrative(
    confidenceMap,
    t as unknown as Record<string, string>,
  );

  return (
    <div className="p-6 sm:p-7 rounded-[4px] bg-rev-paper-warm border border-rev-rule relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-rev-ink uppercase tracking-[0.14em] font-sans">
          {t.confidencePanel}
        </h3>
      </div>
      <p className="text-xs text-rev-ink-soft leading-relaxed mb-4">
        {getTermText("confidence", locale as "en" | "zh")?.definition}
      </p>
      {/* Overall summary */}
      <p className="font-serif text-[13px] text-rev-ink leading-relaxed mb-4 pl-3 border-l-2 border-rev-glow-cold italic">
        {overallNarrative}
      </p>
      <p className="text-[11px] text-rev-ink-soft/80 mb-6 uppercase tracking-[0.1em]">
        {t.dimensionConfidence}
      </p>

      <div className="space-y-3">
        {sortedKeys.map((key, index) => {
          const value = confidenceMap[key] ?? 0;
          const colors = getConfidenceColor(value);
          const level = getConfidenceLevel(
            value,
            t as unknown as Record<string, string>,
          );
          const isHighConfidence = value >= 0.7;
          const isLowConfidence = value < 0.4;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`rounded-[2px] p-2.5 transition-colors ${
                isHighConfidence
                  ? `${colors.bg} border-l-2 ${colors.border}`
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs ${isHighConfidence ? "text-rev-ink font-semibold" : "text-rev-ink-soft font-medium"}`}
                >
                  {getDimensionLabel(key, t as unknown as Record<string, string>)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {level}
                  </span>
                  <span className="text-[11px] text-rev-ink-soft/70 font-mono tabular-nums w-10 text-right">
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-rev-paper border border-rev-rule rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(value * 100, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.05 + 0.2,
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                />
              </div>
              {/* Hard cap annotations */}
              {key === "crossCultural" && value >= 0.54 && (
                <p className="text-[10px] text-rev-ink-soft/70 mt-1">
                  {t.hardCapCrossCultural}
                </p>
              )}
              {/* Low confidence hint */}
              {isLowConfidence && (
                <p className="text-[10px] text-rev-ink-soft/70 mt-1 italic">
                  {getLowConfidenceHint(t as unknown as Record<string, string>)}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
