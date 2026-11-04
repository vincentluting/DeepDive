"use client";

import { motion } from "framer-motion";
import {
  Compass,
  Anchor as AnchorIcon,
  User,
  ArrowUpRight,
} from "lucide-react";

import type { CareerAnchor, ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import { ChapterEyebrow } from "@/components/revelation/chapter-eyebrow";

const SOURCE_ICONS = {
  riasec: Compass,
  schwartz: AnchorIcon,
  bigfive: User,
  "cross-dimension": Compass,
} as const;

interface CareerAnchorsProps {
  anchors: CareerAnchor[];
  locale: Locale;
  t: ReportDict;
  archetypeLabel: string;
  schwartzTop3?: string[] | null;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Chapter 1: Career Anchors — lightweight bridge from Profile identity to career navigation.
 * Displays 3 binary preference pairs derived from RIASEC, Schwartz values, and Big Five.
 * NOT a repeat of Profile — translates "who you are" into "what matters for your career."
 */
export function CareerAnchors({
  anchors,
  locale,
  t,
  archetypeLabel: _archetypeLabel,
  schwartzTop3: _schwartzTop3,
}: CareerAnchorsProps) {
  if (!anchors || anchors.length === 0) return null;

  const sourceLabels: Record<string, string> = {
    riasec: t.anchorSourceInterest,
    schwartz: t.anchorSourceValues,
    bigfive: t.anchorSourcePersonality,
    "cross-dimension": t.anchorSourceCross,
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_QUINT }}
        className="text-center mb-8"
      >
        <ChapterEyebrow className="mb-2">{t.careerAnchorsLabel}</ChapterEyebrow>
        <h2
          className="text-xl sm:text-2xl font-semibold mb-3"
          style={{ color: "var(--report-text-primary)" }}
        >
          {t.careerAnchorsTitle}
        </h2>
        <p
          className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--report-text-secondary)" }}
        >
          {t.careerAnchorsSubtitle}
        </p>
      </motion.div>

      {/* Anchor cards */}
      <div className="space-y-3">
        {anchors.map((anchor, i) => {
          const Icon = SOURCE_ICONS[anchor.source] || Compass;
          // Prefer structured positive/negative fields (new). Fall back to
          // splitting the legacy "X > Y" label for reports generated before
          // 2026-05-23. If the legacy label also lacks the separator, default
          // to showing the whole label as positive and empty negative.
          let positive = getLocalizedField(anchor, "positive", locale);
          let negative = getLocalizedField(anchor, "negative", locale);
          if (!positive || !negative) {
            const legacy = getLocalizedField(anchor, "label", locale);
            const [legacyPos, legacyNeg] = legacy.split(" > ");
            positive = positive || legacyPos || legacy;
            negative = negative || legacyNeg || "";
          }
          if (!positive) return null;

          return (
            <motion.div
              key={anchor.source}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.4 + i * 0.15,
                ease: EASE_OUT_QUINT,
              }}
              className="relative overflow-hidden rounded-xl p-4 pl-5 sm:p-5 sm:pl-6 ocean-border-card"
              style={{
                background: "var(--report-card-bg)",
                backdropFilter: "var(--report-card-backdrop)",
                border: "1px solid var(--report-card-border)",
              }}
            >
              {/* Editorial accent spine — gives the three anchor cards a shared
                  navigational rhythm (sea → gold). */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{
                  background:
                    "linear-gradient(180deg, var(--md-sea), var(--md-gold))",
                  opacity: 0.85,
                }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--report-tag-bg)" }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "var(--report-text-secondary)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Source label */}
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.08em] block mb-2"
                    style={{ color: "var(--report-tag-label)" }}
                  >
                    {sourceLabels[anchor.source] || anchor.source}
                  </span>

                  {/* Preference pair — explicit "move toward" / "away from" labels */}
                  <div className="space-y-2.5">
                    <div>
                      <span
                        className="text-[10px] font-medium uppercase tracking-[0.08em] block mb-1"
                        style={{ color: "var(--report-tag-label)" }}
                      >
                        {t.anchorMoveToward}
                      </span>
                      <p
                        className="flex items-start gap-1.5 text-base sm:text-lg font-semibold leading-snug"
                        style={{ color: "var(--report-text-primary)" }}
                      >
                        <ArrowUpRight
                          className="w-4 h-4 mt-1 shrink-0"
                          strokeWidth={2.4}
                          style={{ color: "var(--md-gold-text)" }}
                        />
                        <span>{positive}</span>
                      </p>
                    </div>
                    {negative && (
                      <div
                        className="pt-2.5"
                        style={{
                          borderTop:
                            "1px solid color-mix(in srgb, var(--report-card-border) 80%, transparent)",
                        }}
                      >
                        <span
                          className="text-[10px] font-medium uppercase tracking-[0.08em] block mb-0.5"
                          style={{ color: "var(--report-text-tertiary)" }}
                        >
                          {t.anchorAwayFrom}
                        </span>
                        <p
                          className="text-sm font-medium leading-snug line-through decoration-1"
                          style={{
                            color: "var(--report-text-tertiary)",
                            textDecorationColor:
                              "color-mix(in srgb, var(--report-text-tertiary) 50%, transparent)",
                          }}
                        >
                          {negative}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Transition text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9, ease: EASE_OUT_QUINT }}
        className="mt-8 text-center"
      >
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--report-text-secondary)" }}
        >
          {t.careerAnchorsTransition}
        </p>
      </motion.div>
    </div>
  );
}
