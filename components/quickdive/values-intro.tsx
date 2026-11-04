"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { hapticMedium } from "@/lib/haptic";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

interface ValuesIntroProps {
  onStart: () => void;
  locale: string;
}

export function ValuesIntro({ onStart, locale }: ValuesIntroProps) {
  const t = getDictionaryClient(locale as Locale).quickDive;
  const copy = {
    title: t.valuesIntroTitle,
    subtitle: t.valuesIntroSubtitle,
    description: t.valuesIntroDesc,
    timeHint: t.valuesIntroTime,
    cta: t.valuesIntroCta,
  };

  const handleStart = useCallback(() => {
    hapticMedium();
    onStart();
  }, [onStart]);

  return (
    <QuickDiveMonographShell
      phase="values-intro"
      t={t}
      eyebrow={copy.subtitle}
      title={copy.title}
      description={copy.description}
      side={
        <div className="dd-quickdive-monograph__compass-side">
          <p className="dd-quickdive-monograph__side-kicker">
            {t.monographValuesPlate}
          </p>
          <div className="dd-quickdive-monograph__compass" aria-hidden="true">
            <span />
          </div>
          <p>{t.monographValuesCopy}</p>
        </div>
      }
      action={
        <motion.button
          onClick={handleStart}
          data-testid="quickdive-values-start"
          className="dd-quickdive-monograph__primary-action"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <span>{copy.cta}</span>
          <small>{copy.timeHint}</small>
        </motion.button>
      }
    >
      <div className="dd-quickdive-monograph__interlude-list">
        <p>{t.monographValuesStep1}</p>
        <p>{t.monographValuesStep2}</p>
        <p>{t.monographValuesStep3}</p>
      </div>
    </QuickDiveMonographShell>
  );
}
