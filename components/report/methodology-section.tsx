"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, ShieldCheck } from "lucide-react";
import type { ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

interface MethodologySectionProps {
  locale: Locale;
  t: ReportDict;
  /** Assessment sample size (platform total), if available */
  sampleSize?: number;
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Framework {
  id: string;
  nameKey: string;
  descKey: string;
  citation: string;
}

const FRAMEWORKS: Framework[] = [
  {
    id: "riasec",
    nameKey: "methodRiasecName",
    descKey: "methodRiasecDesc",
    citation:
      "Holland, J. L. (1997). Making Vocational Choices (3rd ed.). Psychological Assessment Resources.",
  },
  {
    id: "bigfive",
    nameKey: "methodBigFiveName",
    descKey: "methodBigFiveDesc",
    citation:
      "Goldberg, L. R. et al. (2006). The International Personality Item Pool. Psychological Assessment, 18(2).",
  },
  {
    id: "schwartz",
    nameKey: "methodSchwartzName",
    descKey: "methodSchwartzDesc",
    citation:
      "Schwartz, S. H. (2012). An Overview of the Schwartz Theory of Basic Values. Online Readings in Psychology and Culture, 2(1).",
  },
  {
    id: "sjt",
    nameKey: "methodSjtName",
    descKey: "methodSjtDesc",
    citation:
      "McDaniel, M. A. et al. (2007). Situational Judgment Tests. Personnel Psychology, 60(1).",
  },
];

/**
 * Methodology & Evidence section — trust anchor at the bottom of the report.
 * Collapsible by default, shows the scientific frameworks behind the assessment.
 */
export function MethodologySection({
  locale,
  t,
  sampleSize,
}: MethodologySectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section id="methodology" className="mt-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_QUINT }}
      >
        {/* Always-visible trust anchor — surfaces "why this isn't a horoscope"
            without requiring the reader to expand the citations below. */}
        {t.methodologyTrustHeadline && (
          <div
            className="mb-3 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{
              background: "var(--report-card-bg)",
              border: "1px solid var(--report-card-border)",
            }}
          >
            <ShieldCheck
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "var(--report-text-secondary)" }}
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--report-text-primary)" }}
            >
              {t.methodologyTrustHeadline}
            </p>
          </div>
        )}

        {/* Collapsible trigger */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors"
          style={{
            background: "var(--report-card-bg)",
            border: "1px solid var(--report-card-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen
              className="h-4 w-4"
              style={{ color: "var(--report-text-secondary)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--report-text-primary)" }}
            >
              {t.methodologyTitle}
            </span>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              className="h-4 w-4"
              style={{ color: "var(--report-text-tertiary)" }}
            />
          </motion.div>
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_QUINT }}
              className="overflow-hidden"
            >
              <div
                className="mt-2 px-4 py-5 sm:px-6 sm:py-6 rounded-xl space-y-6"
                style={{
                  background: "var(--report-card-bg)",
                  border: "1px solid var(--report-card-border)",
                }}
              >
                {/* Intro */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--report-text-secondary)" }}
                >
                  {t.methodologyIntro}
                </p>

                {/* Frameworks grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {FRAMEWORKS.map((fw) => (
                    <div
                      key={fw.id}
                      className="p-4 rounded-lg"
                      style={{
                        background: "var(--report-tag-bg)",
                        border: "1px solid var(--report-tag-border)",
                      }}
                    >
                      <h4
                        className="text-sm font-semibold mb-1.5"
                        style={{ color: "var(--report-text-primary)" }}
                      >
                        {t[fw.nameKey]}
                      </h4>
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: "var(--report-text-secondary)" }}
                      >
                        {t[fw.descKey]}
                      </p>
                      <p
                        className="text-[10px] leading-relaxed italic"
                        style={{ color: "var(--report-text-tertiary)" }}
                      >
                        {fw.citation}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Sample size note */}
                {sampleSize && sampleSize > 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--report-text-tertiary)" }}
                  >
                    {t.methodologySampleNote?.replace(
                      "{{n}}",
                      sampleSize.toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      ),
                    )}
                  </p>
                )}

                {/* Limitations & anti-Barnum */}
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: "var(--report-tag-bg)",
                    border: "1px solid var(--report-tag-border)",
                  }}
                >
                  <h4
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--report-text-primary)" }}
                  >
                    {t.methodologyLimitationsTitle}
                  </h4>
                  <ul className="space-y-2">
                    <li
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--report-text-secondary)" }}
                    >
                      • {t.methodologyLimitation1}
                    </li>
                    <li
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--report-text-secondary)" }}
                    >
                      • {t.methodologyLimitation2}
                    </li>
                    <li
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--report-text-secondary)" }}
                    >
                      • {t.methodologyAntiBarnum}
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
