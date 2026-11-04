"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { hapticLight } from "@/lib/haptic";
import { MINI_IP_LIKERT_OPTIONS } from "@/lib/assessment/mini-ip";
import { ChevronLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { QuickDiveQuestionData } from "./quickdive-data";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

interface ClassicExploreQuestionProps {
  question: QuickDiveQuestionData;
  questionIndex: number;
  totalQuestions: number;
  locale: Locale;
  onAnswer: (value: 0 | 1 | 2 | 3 | 4) => void;
  onGoBack?: () => void;
  t: Record<string, string>;
}

export function ClassicExploreQuestion({
  question,
  questionIndex,
  totalQuestions,
  locale,
  onAnswer,
  onGoBack,
  t,
}: ClassicExploreQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<0 | 1 | 2 | 3 | 4 | null>(
    null,
  );

  // Reset selection when question changes
  useEffect(() => {
    setSelectedValue(null);
  }, [question, questionIndex]);

  const handleSelect = (value: 0 | 1 | 2 | 3 | 4) => {
    if (selectedValue !== null) return;
    setSelectedValue(value);
    hapticLight();

    // Keep the tactile confirmation, then advance quickly for a steady click rhythm.
    setTimeout(() => {
      onAnswer(value);
    }, 55);
  };

  // Use locale-matched Likert options. Fallback to en so a misrouted locale
  // (e.g. stale /nl/... link that slipped past proxy) never crashes render.
  const options =
    MINI_IP_LIKERT_OPTIONS[locale as keyof typeof MINI_IP_LIKERT_OPTIONS] ??
    MINI_IP_LIKERT_OPTIONS.en;
  const activityPrompt = t.activityPrompt;

  const isZh = locale === "zh";
  const questionText = isZh ? question.prompt : question.promptEn;

  return (
    <QuickDiveMonographShell
      phase="playing"
      t={t}
      eyebrow={activityPrompt}
      title={questionText}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      counterTestId="quickdive-riasec-counter"
      action={
        onGoBack ? (
          <div className="dd-quickdive-monograph__nav-actions">
            <button
              onClick={() => {
                hapticLight();
                onGoBack();
              }}
              className="dd-quickdive-monograph__secondary-action"
              aria-label={t.previousQuestion}
            >
              <ChevronLeft size={16} />
              <span>{t.previousQuestion}</span>
            </button>
          </div>
        ) : null
      }
    >
      <div className="dd-quickdive-monograph__question">
        <div
          className="dd-quickdive-monograph__options"
          role="group"
          aria-label={t.chooseResponse}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isDisabled = selectedValue !== null;

            return (
              <motion.button
                key={option.value}
                data-testid={`quickdive-riasec-option-${option.value}`}
                initial={false}
                whileTap={{ scale: 0.975 }}
                onClick={() =>
                  handleSelect(option.value as 0 | 1 | 2 | 3 | 4)
                }
                disabled={isDisabled}
                aria-label={option.label}
                className="dd-quickdive-monograph__option"
                data-selected={isSelected ? "true" : "false"}
                data-muted={isDisabled && !isSelected ? "true" : "false"}
              >
                <span className="dd-quickdive-monograph__option-dot">
                  {option.value}
                  {isSelected && (
                    <motion.span
                      aria-hidden="true"
                      className="dd-quickdive-monograph__option-ripple"
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 3.2 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    />
                  )}
                </span>
                <span className="dd-quickdive-monograph__option-label">
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </QuickDiveMonographShell>
  );
}
