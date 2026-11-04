// DataTransparency — Footer: collapsed confidence + quality metrics for Profile page
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PersonalProfileData } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { analytics } from "@/lib/analytics/client";
import { ConfidencePanel } from "./confidence-panel";
import { QualityMetrics } from "./quality-metrics";

interface DataTransparencyProps {
  profile: PersonalProfileData;
  locale: string;
}

/** Compute overall data quality from confidence map */
function getOverallQuality(
  confidenceMap: PersonalProfileData["confidenceMap"],
  t: Record<string, string>,
): { label: string; className: string; dotColor: string } {
  const values = Object.values(confidenceMap).filter(
    (v): v is number => v != null && v > 0,
  );
  if (values.length === 0)
    return {
      label: t.dataQualityDeveloping,
      className: "text-rev-ink-soft",
      dotColor: "bg-rev-ink-soft/50",
    };

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 0.6)
    return {
      label: t.dataQualityStrong,
      className: "text-rev-signal-positive",
      dotColor: "bg-rev-signal-positive",
    };
  if (avg >= 0.45)
    return {
      label: t.dataQualityModerate,
      className: "text-rev-signal-info",
      dotColor: "bg-rev-signal-info",
    };
  return {
    label: t.dataQualityDeveloping,
    className: "text-rev-signal-attention",
    dotColor: "bg-rev-signal-attention",
  };
}

export function DataTransparency({ profile, locale }: DataTransparencyProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const [isOpen, setIsOpen] = useState(false);
  const quality = getOverallQuality(
    profile.confidenceMap,
    t as unknown as Record<string, string>,
  );

  return (
    <div className="border-t border-rev-rule/60 pt-8">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          analytics
            .track("profile_transparency_toggled", { expanded: next })
            .catch(() => {});
        }}
        className="w-full flex items-center justify-between gap-3 py-2 cursor-pointer group/dt min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${quality.dotColor} transition-colors`}
          />
          <span className="text-xs text-rev-ink-soft/70 hover:text-rev-ink-soft transition-colors font-sans tracking-[0.14em] uppercase">
            {t.dataTransparencyTitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-medium ${quality.className}`}
          >
            {t.dataTransparencySummary}: {quality.label}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-rev-ink-soft/60" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-8">
              <p className="text-xs text-rev-ink-soft/80 leading-relaxed">
                {t.dataTransparencyDesc}
              </p>

              {/* Confidence Panel */}
              <ConfidencePanel profile={profile} locale={locale} />

              {/* Quality Metrics */}
              {profile.qualityMeta && (
                <div className="p-6 sm:p-7 rounded-[4px] bg-rev-paper-warm border border-rev-rule">
                  <h3 className="text-sm font-semibold text-rev-ink uppercase tracking-[0.14em] mb-4 font-sans">
                    {t.qualityTitle}
                  </h3>
                  <p className="text-xs text-rev-ink-soft mb-4">
                    {t.qualitySubtitle}
                  </p>
                  <QualityMetrics meta={profile.qualityMeta} locale={locale} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
