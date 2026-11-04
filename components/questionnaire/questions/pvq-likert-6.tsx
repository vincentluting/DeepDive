"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PVQItem, AnswerValue } from "@/lib/types";
import type { TextTheme } from "@/store/questionnaire-store";
import { DDVQ_SCALE_LABELS } from "@/lib/questionnaire";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import { prefersReducedMotion } from "@/lib/device";

// ============================================================
// PVQ-21 Likert-6 — 6-point scale for Portrait Values items
// ============================================================
// Module B: 21 Schwartz value items
// Each item describes a person; user rates how similar they are.
// Scale: 1 (Not at all like me) → 6 (Very much like me)
// ============================================================

interface PVQLikert6Props {
  item: PVQItem;
  value: number | undefined;
  onChange: (value: AnswerValue) => void;
  language: string;
  textTheme: TextTheme;
  /** Optional: user gender for pronoun-matched English text */
  userGender?: "male" | "female" | "neutral";
  /** Optional: override scale labels. Defaults to DDVQ_SCALE_LABELS. */
  scaleLabels?: Record<
    number,
    { en: string; zh: string; [key: string]: string | undefined }
  >;
}

const SCALE_POINTS = [6, 5, 4, 3, 2, 1] as const;

// Mobile-only left border accent — thicker/brighter on high numbers to signal scale direction
function getMobileLeftBorderClass(point: number): string {
  if (point >= 5) return "max-md:border-l-[3px] max-md:border-l-sky-400/70";
  if (point >= 3) return "max-md:border-l-2 max-md:border-l-sky-300/40";
  return "max-md:border-l max-md:border-l-white/20";
}

interface PVQScaleButtonProps {
  point: number;
  isSelected: boolean;
  onClick: () => void;
  label: { en: string; zh: string; [key: string]: string | undefined };
  language: string;
  idx: number;
}

// Scale button with staggered entrance, selection pulse, and responsive checkmark
function PVQScaleButton({
  point,
  isSelected,
  onClick,
  label,
  language,
  idx,
}: PVQScaleButtonProps) {
  const [animScale, setAnimScale] = useState(1);
  const [animOpacity, setAnimOpacity] = useState(0);
  const [animY, setAnimY] = useState(8);
  const prevIsSelectedRef = useRef(isSelected);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Capture initial selection state so entrance effect is stable
  const initialIsSelectedRef = useRef(isSelected);

  // Staggered entrance animation on mount (skip delay if user prefers reduced motion)
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const delay = reduced ? 0 : idx * 30;
    const t = setTimeout(() => {
      setAnimOpacity(1);
      setAnimY(0);
      setAnimScale(initialIsSelectedRef.current ? 1.02 : 1);
    }, delay);
    return () => clearTimeout(t);
  }, [idx]);

  // Selection pulse: 1.0 → 1.06 → 1.02 over ~180ms when newly selected
  useEffect(() => {
    if (isSelected === prevIsSelectedRef.current) return;

    if (isSelected) {
      setAnimScale(1.06);
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setAnimScale(1.02), 80);
    } else {
      clearTimeout(pulseTimerRef.current);
      setAnimScale(1);
    }
    prevIsSelectedRef.current = isSelected;
  }, [isSelected]);

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => clearTimeout(pulseTimerRef.current);
  }, []);

  return (
    <motion.button
      animate={{ opacity: animOpacity, scale: animScale, y: animY }}
      transition={{ duration: 0.1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={[
        // Mobile: horizontal bar layout
        "flex flex-row items-center gap-3 w-full min-h-[44px] px-3 py-2",
        // Desktop: vertical card layout (original)
        "md:flex-col md:items-center md:gap-1.5 md:px-2 md:py-3 md:min-h-0",
        "rounded-xl text-left md:text-center transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041E2B] outline-none",
        isSelected
          ? "bg-sky-500/25 border-2 border-sky-400/50"
          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]",
        // Mobile left border accent indicating scale direction
        getMobileLeftBorderClass(point),
      ].join(" ")}
    >
      {/* Number with desktop checkmark */}
      <div className="relative flex items-center justify-center shrink-0 w-6 h-6">
        <span
          className={`text-lg font-medium ${isSelected ? "text-sky-300" : "text-white/60"}`}
        >
          {point}
        </span>
        {/* Desktop-only: small checkmark near the number */}
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.15 }}
              className="hidden md:block absolute -top-1.5 -right-2.5 text-[9px] leading-none text-sky-300"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Label text */}
      <span
        className={`text-sm md:text-xs lg:text-sm leading-tight flex-1 ${isSelected ? "text-sky-200/80" : "text-white/70"}`}
      >
        {(label as Record<string, string | undefined>)[language] || label.en}
      </span>

      {/* Mobile-only: slide-in checkmark on the right side of the bar */}
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden shrink-0 text-sky-300 text-sm"
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function PVQLikert6({
  item,
  value,
  onChange,
  language,
  textTheme: _textTheme,
  userGender = "male",
  scaleLabels = DDVQ_SCALE_LABELS,
}: PVQLikert6Props) {
  const t = getDictionaryClient(language as Locale).pvqLikert;

  // Select locale-appropriate text with fallback to English
  // For en: use gender-appropriate text; for zh: use text_zh; for others: try locale field, fall back to en
  const itemText =
    language === "en"
      ? userGender === "female"
        ? item.text_en_female
        : item.text_en
      : getLocalizedField(item, "text", language as Locale) || item.text_en;

  const isZh = language === "zh";

  // Adaptive font size based on text length
  const textLen = itemText.length;
  const descFontSize = isZh
    ? "clamp(0.9375rem, 2.5vw, 1.25rem)"
    : textLen <= 90
      ? "clamp(0.9375rem, 2.5vw, 1.25rem)"
      : textLen <= 120
        ? "clamp(0.875rem, 2vw, 1.125rem)"
        : "clamp(0.8125rem, 1.8vw, 1rem)";

  const handleSelect = (rating: number) => {
    const answer: AnswerValue = { type: "pvq", rating };
    onChange(answer);
  };

  // Keyboard shortcut: press 1-6 to select rating
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6) {
        handleSelect(num);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="flex flex-col">
      {/* Person description — fixed height zone, vertically centered */}
      <div className="h-[140px] md:h-[120px] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-4 py-4 lg:px-6 lg:py-5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
        >
          <p
            className="text-white/85 leading-relaxed"
            style={{ fontSize: descFontSize }}
          >
            {itemText}
          </p>
        </motion.div>
      </div>

      {/* Scale — fixed position below text zone */}
      <div className="space-y-6 shrink-0 mt-6">
        {/* Scale prompt */}
        <p className="text-sm lg:text-base text-white/70 text-center">
          {t.prompt}
        </p>

        {/* 6-point scale — mobile: vertical stack of full-width bars, desktop: 6-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5 md:gap-3">
          {SCALE_POINTS.map((point, idx) => {
            const label = scaleLabels[point] ?? DDVQ_SCALE_LABELS[point];
            const isSelected = value === point;

            return (
              <PVQScaleButton
                key={point}
                point={point}
                isSelected={isSelected}
                onClick={() => handleSelect(point)}
                label={label}
                language={language}
                idx={idx}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
