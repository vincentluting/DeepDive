"use client";

import type { Locale } from "@/lib/i18n/config";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerDirection, ReportDict } from "@/lib/types";
import { getWeightedMatchFactors } from "@/lib/career-matching/weights";

interface MatchBreakdownExplainerProps {
  direction: CareerDirection;
  locale: Locale;
  t: ReportDict;
}

interface BreakdownDimension {
  key: string;
  labelKey: string;
  descKey: string;
  value: number;
  color: string;
}

export function MatchBreakdownExplainer({
  direction,
  locale: _locale,
  t,
}: MatchBreakdownExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const breakdown = direction.matchBreakdown;
  if (!breakdown) return null;

  const FACTOR_META: Record<
    string,
    { labelKey: string; descKey: string; color: string }
  > = {
    interestFit: {
      labelKey: "whyThisDirectionInterest",
      descKey: "whyThisDirectionInterestDesc",
      color: "bg-teal-500",
    },
    valueFit: {
      labelKey: "whyThisDirectionValues",
      descKey: "whyThisDirectionValuesDesc",
      color: "bg-cyan-500",
    },
    personalityFit: {
      labelKey: "whyThisDirectionPersonality",
      descKey: "whyThisDirectionPersonalityDesc",
      color: "bg-sky-500",
    },
    adaptabilityFit: {
      labelKey: "whyThisDirectionAdaptability",
      descKey: "whyThisDirectionAdaptabilityDesc",
      color: "bg-indigo-500",
    },
  };

  // Only explain factors that actually contribute to the weighted match
  // (weight > 0 in the engine's WEIGHT_PRESETS), so the breakdown never
  // overstates a factor that doesn't drive the score (e.g. adaptability is 0).
  const scores = breakdown as Record<string, number | undefined>;
  const dimensions: BreakdownDimension[] = getWeightedMatchFactors("full")
    .filter((f) => FACTOR_META[f.key])
    .map((f) => ({
      key: f.key,
      labelKey: FACTOR_META[f.key].labelKey,
      descKey: FACTOR_META[f.key].descKey,
      value: scores[f.key] ?? 0,
      color: FACTOR_META[f.key].color,
    }));

  const title = t.whyThisDirectionTitle;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      {/* Collapsible trigger */}
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/30">
              {dimensions.map((dim) => (
                <div key={dim.key} className="pt-3 first:pt-2.5">
                  {/* Label + score */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {t[dim.labelKey]}
                    </span>
                    <span className="text-xs font-semibold text-primary tabular-nums">
                      {dim.value}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        dim.color,
                      )}
                      style={{ width: `${Math.min(dim.value, 100)}%` }}
                    />
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {t[dim.descKey]}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
