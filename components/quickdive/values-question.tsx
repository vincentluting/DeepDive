"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { hapticLight } from "@/lib/haptic";
import { pickLocaleText } from "@/lib/i18n/localize";
import {
  QUICK_TWIVI_ITEMS,
  DDVQ_SCALE_LABELS,
} from "@/lib/assessment/twivi-quick";
import { ChevronLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

interface ValuesQuestionProps {
  questionIndex: number; // 0-7
  totalQuestions: number; // 8
  locale: Locale;
  onAnswer: (value: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onGoBack?: () => void;
  t?: Record<string, string>;
}

const SCALE_VALUES = [6, 5, 4, 3, 2, 1] as const;

export function ValuesQuestion({
  questionIndex,
  totalQuestions,
  locale,
  onAnswer,
  onGoBack,
  t,
}: ValuesQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const item = QUICK_TWIVI_ITEMS[questionIndex];

  useEffect(() => {
    setSelectedValue(null);
  }, [questionIndex]);

  const handleSelect = useCallback(
    (value: 1 | 2 | 3 | 4 | 5 | 6) => {
      if (selectedValue !== null) return;
      setSelectedValue(value);
      hapticLight();
      setTimeout(() => onAnswer(value), 55);
    },
    [selectedValue, onAnswer],
  );

  if (!item) return null;

  const itemText = pickLocaleText(item.text, locale);
  const instruction =
    t?.instruction ??
    pickLocaleText(
      {
        en: "How much is this person like you?",
        zh: "这个人和你有多像？",
      },
      locale,
    );

  return (
    <QuickDiveMonographShell
      phase="values-playing"
      t={t ?? {}}
      eyebrow={instruction}
      title={itemText}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      counterTestId="quickdive-values-counter"
      side={
        <div className="dd-quickdive-monograph__compass-side">
          <p className="dd-quickdive-monograph__side-kicker">
            {t?.monographValuesPlate}
          </p>
          <div className="dd-quickdive-monograph__compass" aria-hidden="true">
            <span />
          </div>
          <p>{t?.monographValuesCopy}</p>
        </div>
      }
      action={
        onGoBack ? (
          <div className="dd-quickdive-monograph__nav-actions">
            <button
              onClick={() => {
                hapticLight();
                onGoBack();
              }}
              className="dd-quickdive-monograph__secondary-action"
              aria-label={t?.previousQuestion}
            >
              <ChevronLeft size={16} />
              <span>{t?.previousQuestion}</span>
            </button>
          </div>
        ) : null
      }
    >
      <div className="dd-quickdive-monograph__question">
        <span className="dd-quickdive-monograph__mini-label">
          {t?.partLabel ??
            pickLocaleText({ en: "Part 2", zh: "第二部分" }, locale)}
        </span>

        <div className="dd-quickdive-monograph__options">
          {SCALE_VALUES.map((value) => {
            const scaleLabel = DDVQ_SCALE_LABELS[value];
            const label = pickLocaleText(scaleLabel, locale);
            const isSelected = selectedValue === value;

            return (
              <motion.button
                key={value}
                data-testid={`quickdive-value-option-${value}`}
                onClick={() => handleSelect(value as 1 | 2 | 3 | 4 | 5 | 6)}
                disabled={selectedValue !== null}
                initial={false}
                whileTap={{ scale: 0.975 }}
                className="dd-quickdive-monograph__option"
                data-selected={isSelected ? "true" : "false"}
                data-muted={
                  selectedValue !== null && !isSelected ? "true" : "false"
                }
              >
                <span className="dd-quickdive-monograph__option-dot">
                  {value}
                </span>
                <span className="dd-quickdive-monograph__option-label">
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </QuickDiveMonographShell>
  );
}
