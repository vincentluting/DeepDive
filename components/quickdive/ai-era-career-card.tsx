// ============================================================
// AI-Era Career Spark — single featured AI-era career recommendation
//
// Shown between Zone 2c (DPTI) and Zone 3 (Career Directions).
// Highlights the best ai-native or transformed career match
// from the full 1,140-career pool.
// ============================================================

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";
import type { CareerItem } from "./quickdive-data";
import { AiEraBadge } from "@/components/report/ai-era-badge";
import { AiImpactBadge } from "@/components/report/ai-impact-badge";
import { IMMERSIVE_CARD, IMMERSIVE_TEXT } from "./immersive-result-theme";

interface AiEraCareerCardProps {
  career: CareerItem;
  locale: string;
  t: Record<string, string>;
  immersive?: boolean;
  /** Drop the rounded card chrome (RevArtifact in the Revelation shell
   *  already provides framing) and bypass the viewport-gate animation. */
  monograph?: boolean;
}

export function AiEraCareerCard({
  career,
  locale,
  t,
  immersive = false,
  monograph = false,
}: AiEraCareerCardProps) {
  const isZh = locale === "zh";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const cardBg = immersive ? IMMERSIVE_CARD.background : "var(--glass-shallow)";
  const cardBorder = immersive
    ? IMMERSIVE_CARD.border
    : "1px solid var(--warm-glow-border)";
  const accentColor = immersive ? "rgba(168, 140, 255, 0.9)" : "#7C5AE3";
  const textPrimary = immersive ? IMMERSIVE_TEXT.primary : "var(--foreground)";
  const textSecondary = immersive
    ? IMMERSIVE_TEXT.secondary
    : "var(--text-secondary-on-shallow)";

  const displayName = isZh
    ? career.title_zh || career.name
    : career.title_en || career.name;

  return (
    <motion.div
      ref={ref}
      initial={monograph ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      animate={
        monograph || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
      }
      transition={{ duration: immersive ? 0.7 : 0.45, ease: "easeOut" }}
      className={monograph ? undefined : "mb-6"}
    >
      <div
        className={
          monograph ? "relative" : "relative rounded-2xl overflow-hidden"
        }
        style={
          monograph
            ? undefined
            : {
                background: cardBg,
                border: cardBorder,
                boxShadow: immersive
                  ? "0 2px 20px rgba(124, 90, 227, 0.08)"
                  : "var(--warm-glow-shadow)",
              }
        }
      >
        {/* Top accent line — violet gradient (suppressed in monograph mode) */}
        {!monograph && (
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent 10%, ${accentColor} 50%, transparent 90%)`,
              opacity: 0.5,
            }}
          />
        )}

        <div className="p-5">
          {/* Header — icon + label */}
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={isInView ? { rotate: [0, 15, -10, 8, 0] } : {}}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeInOut" }}
            >
              <Zap size={14} style={{ color: accentColor }} />
            </motion.div>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              {t.aiEraSparkLabel}
            </span>
          </div>

          {/* Subtitle */}
          <p
            className="text-xs leading-relaxed mb-4"
            style={{ color: textSecondary }}
          >
            {t.aiEraSparkTitle}
          </p>

          {/* Career name + AI-era badge */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-2">
            <h3
              className="text-base font-bold leading-tight flex-1 min-w-0"
              style={{ color: textPrimary }}
            >
              {displayName}
            </h3>
            {career.aiImpactLabel && (
              <AiImpactBadge
                label={career.aiImpactLabel}
                score={career.aiExposureScore}
                locale={locale as "en" | "zh"}
              />
            )}
            {career.aiEraCategory && (
              <AiEraBadge
                category={career.aiEraCategory}
                locale={locale as "en" | "zh"}
              />
            )}
          </div>

          {/* Tagline */}
          {career.tagline && (
            <p
              className="text-xs leading-relaxed mb-3"
              style={{ color: textSecondary }}
            >
              {career.tagline}
            </p>
          )}

          {/* Match bar */}
          <div className="mb-3">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: immersive
                  ? "rgba(255,255,255,0.06)"
                  : "var(--locked-bg)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: immersive
                    ? "linear-gradient(90deg, rgba(124, 90, 227, 0.6), rgba(168, 140, 255, 0.88))"
                    : "linear-gradient(90deg, #7C5AE3, #A88CFF)",
                }}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${career.pct}%` } : { width: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: textSecondary }}>
                {t.aiEraSparkNote}
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ color: accentColor }}
              >
                {career.pct}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
