"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IPIPItem, AnswerValue } from "@/lib/types";
import type { TextTheme } from "@/store/questionnaire-store";
import { IPIP_SCALE_LABELS } from "@/lib/questionnaire";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";

// ============================================================
// IPIP-60 Likert-5 — 5-point scale for personality items
// ============================================================
// Module C: 60 Big Five items across 5 domains, 30 facets (2 items per facet)
// Scale: 1 (Very Inaccurate) → 5 (Very Accurate)
// Items displayed one per page for consistent pacing.
// ============================================================

interface IPIPLikert5Props {
  item: IPIPItem;
  value: number | undefined;
  onChange: (value: AnswerValue) => void;
  language: string;
  textTheme: TextTheme;
  /** Current item number within Module C (1-60) for display */
  itemNumber?: number;
}

const SCALE_POINTS = [1, 2, 3, 4, 5] as const;

// Subtle accent colors per scale point for visual differentiation
const POINT_ACCENTS: Record<number, { selected: string; text: string }> = {
  1: { selected: "bg-rose-500/20 border-rose-400/40", text: "text-rose-300" },
  2: {
    selected: "bg-orange-500/20 border-orange-400/40",
    text: "text-orange-300",
  },
  3: { selected: "bg-white/15 border-white/25", text: "text-white/80" },
  4: { selected: "bg-sky-500/20 border-sky-400/40", text: "text-sky-300" },
  5: {
    selected: "bg-emerald-500/20 border-emerald-400/40",
    text: "text-emerald-300",
  },
};

interface IPIPScaleButtonProps {
  point: number;
  isSelected: boolean;
  onClick: () => void;
  accent: { selected: string; text: string };
  label: { en: string; zh: string; [key: string]: string | undefined };
  language: string;
  idx: number;
}

// Scale button with staggered entrance, selection pulse, and checkmark indicator
function IPIPScaleButton({
  point,
  isSelected,
  onClick,
  accent,
  label,
  language,
  idx,
}: IPIPScaleButtonProps) {
  const [animScale, setAnimScale] = useState(0.95);
  const [animOpacity, setAnimOpacity] = useState(0);
  const prevIsSelectedRef = useRef(isSelected);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Capture initial selection state so entrance effect doesn't re-run on selection changes
  const initialIsSelectedRef = useRef(isSelected);

  // Staggered entrance animation on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setAnimOpacity(1);
      setAnimScale(initialIsSelectedRef.current ? 1.04 : 1);
    }, idx * 30);
    return () => clearTimeout(t);
  }, [idx]);

  // Selection pulse: 1.0 → 1.10 → 1.04 over ~150ms when newly selected
  useEffect(() => {
    if (isSelected === prevIsSelectedRef.current) return;

    if (isSelected) {
      setAnimScale(1.1);
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setAnimScale(1.04), 70);
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
      animate={{ opacity: animOpacity, scale: animScale }}
      transition={{ duration: 0.1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex-1 sm:max-w-[100px] lg:max-w-[120px] flex flex-col items-center gap-2 px-1.5 sm:px-2 py-4 rounded-xl transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041E2B] outline-none
        ${
          isSelected
            ? `${accent.selected} border-2`
            : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
        }`}
    >
      {/* Scale number with fade-in checkmark */}
      <div className="relative flex items-center justify-center w-6 h-6">
        <span
          className={`text-base font-medium ${isSelected ? accent.text : "text-white/50"}`}
        >
          {point}
        </span>
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.15 }}
              className={`absolute -top-1.5 -right-3 text-[9px] leading-none ${accent.text}`}
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <span
        className={`text-[10px] lg:text-xs leading-tight text-center ${isSelected ? "text-white/80" : "text-white/60"}`}
      >
        {(label as Record<string, string | undefined>)[language] || label.en}
      </span>
    </motion.button>
  );
}

export function IPIPLikert5({
  item,
  value,
  onChange,
  language,
  textTheme: _textTheme,
}: IPIPLikert5Props) {
  const locale = language as Locale;
  const t = getDictionaryClient(locale).ipipLikert;
  const itemText = getLocalizedField(item, "text", locale) || item.text_en;
  const isZh = locale === "zh";

  // Adaptive font size based on text length
  const textLen = itemText.length;
  const statementFontSize = isZh
    ? "clamp(1.25rem, 3.5vw, 1.875rem)"
    : textLen <= 20
      ? "clamp(1.25rem, 3.5vw, 1.875rem)"
      : textLen <= 35
        ? "clamp(1.125rem, 3vw, 1.5rem)"
        : "clamp(1rem, 2.5vw, 1.25rem)";

  const handleSelect = useCallback(
    (rating: number) => {
      const answer: AnswerValue = { type: "ipip", rating };
      onChange(answer);
    },
    [onChange],
  );

  // Keyboard: number keys 1–5 select directly; ← / → nudge the rating up or
  // down (starting mid-scale). Bound to [handleSelect, value] so the arrow
  // step reads the latest selection instead of re-binding on every render.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        handleSelect(num);
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const current = value ?? 3;
        handleSelect(
          e.key === "ArrowRight"
            ? Math.min(5, current + 1)
            : Math.max(1, current - 1),
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSelect, value]);

  return (
    <div className="flex flex-col">
      {/* Statement — fixed height zone, vertically centered */}
      <div className="h-[100px] md:h-[120px] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p
            className="font-light text-white/90 leading-relaxed tracking-wide"
            style={{ fontSize: statementFontSize }}
          >
            {itemText}
          </p>
        </motion.div>
      </div>

      {/* Instruction + Scale — fixed position below text zone */}
      <div className="space-y-6 shrink-0">
        <p className="text-sm lg:text-base text-white/70 text-center">
          {t.prompt}
        </p>

        {/* 5-point horizontal scale */}
        <div className="flex items-stretch gap-2.5 sm:gap-3 justify-center">
          {SCALE_POINTS.map((point, idx) => {
            const label = IPIP_SCALE_LABELS[point];
            const isSelected = value === point;
            const accent = POINT_ACCENTS[point];

            return (
              <IPIPScaleButton
                key={point}
                point={point}
                isSelected={isSelected}
                onClick={() => handleSelect(point)}
                accent={accent}
                label={label}
                language={language}
                idx={idx}
              />
            );
          })}
        </div>

        {/* Scale endpoints for quick orientation */}
        <div className="flex justify-between px-2">
          <span className="text-[10px] lg:text-xs text-white/50">
            {(IPIP_SCALE_LABELS[1] as Record<string, string | undefined>)[
              language
            ] || IPIP_SCALE_LABELS[1].en}
          </span>
          <span className="text-[10px] lg:text-xs text-white/50">
            {(IPIP_SCALE_LABELS[5] as Record<string, string | undefined>)[
              language
            ] || IPIP_SCALE_LABELS[5].en}
          </span>
        </div>
      </div>
    </div>
  );
}
