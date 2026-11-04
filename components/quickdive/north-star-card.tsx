// ============================================================
// Career North Star Card — aspirational direction map
//
// Shows 3 directional peaks (Leadership / Expertise / Impact)
// based on the user's 12-type archetype code.
// Positioned between AI-Era Career Spark and Career Directions.
// ============================================================

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Crown, Gem, Globe, Compass } from "lucide-react";
import { NORTH_STAR_MAP, type NorthStarEntry } from "@/lib/content/north-star";
import { IMMERSIVE_CARD, IMMERSIVE_TEXT } from "./immersive-result-theme";

interface NorthStarCardProps {
  archetypeCode: string;
  locale: string;
  t: Record<string, string>;
  immersive?: boolean;
  /** When true, the outer chrome (rounded card + border + gold accent line)
   *  is dropped because the parent (RevArtifact in the Revelation shell) is
   *  already supplying the frame. The viewport-gate animation is also
   *  bypassed so the content is always visible. */
  monograph?: boolean;
}

const DIMENSION_ICONS = {
  leadership: Crown,
  expertise: Gem,
  impact: Globe,
} as const;

type Dimension = keyof typeof DIMENSION_ICONS;

export function NorthStarCard({
  archetypeCode,
  locale,
  t,
  immersive = false,
  monograph = false,
}: NorthStarCardProps) {
  const config = NORTH_STAR_MAP[archetypeCode];
  if (!config) return null;

  const isZh = locale === "zh";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const cardBg = immersive ? IMMERSIVE_CARD.background : "var(--glass-shallow)";
  const cardBorder = immersive
    ? IMMERSIVE_CARD.border
    : "1px solid var(--warm-glow-border)";
  const accentColor = immersive ? "rgba(212, 175, 55, 0.9)" : "#B8860B";
  const textPrimary = immersive ? IMMERSIVE_TEXT.primary : "var(--foreground)";
  const textSecondary = immersive
    ? IMMERSIVE_TEXT.secondary
    : "var(--text-secondary-on-shallow)";

  const dimensions: { key: Dimension; label: string; data: NorthStarEntry }[] =
    [
      {
        key: "leadership",
        label: t.northStarLeadership,
        data: config.leadership,
      },
      { key: "expertise", label: t.northStarExpertise, data: config.expertise },
      { key: "impact", label: t.northStarImpact, data: config.impact },
    ];

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
                  ? "0 2px 20px rgba(184, 134, 11, 0.06)"
                  : "var(--warm-glow-shadow)",
              }
        }
      >
        {/* Top accent line — gold gradient (suppressed in monograph mode) */}
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
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={isInView ? { rotate: [0, 12, -8, 5, 0] } : {}}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeInOut" }}
            >
              <Compass size={14} style={{ color: accentColor }} />
            </motion.div>
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: accentColor }}
            >
              {t.northStarTitle}
            </span>
          </div>

          {/* Subtitle */}
          <p
            className="text-xs leading-relaxed mb-5"
            style={{ color: textSecondary }}
          >
            {t.northStarSubtitle}
          </p>

          {/* 3 Dimension rows */}
          <div className="space-y-4">
            {dimensions.map(({ key, label, data }, i) => {
              const Icon = DIMENSION_ICONS[key];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={
                    isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
                  }
                  transition={{
                    delay: 0.2 + i * 0.12,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                >
                  {/* Dimension label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon
                      size={12}
                      style={{ color: accentColor, opacity: 0.7 }}
                    />
                    <span
                      className="text-[10px] font-medium tracking-wider uppercase"
                      style={{ color: accentColor, opacity: 0.8 }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Role title */}
                  <h4
                    className="text-sm font-bold leading-tight mb-0.5"
                    style={{ color: textPrimary }}
                  >
                    {isZh ? data.role_zh : data.role_en}
                  </h4>

                  {/* Why sentence */}
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: textSecondary }}
                  >
                    {isZh ? data.why_zh : data.why_en}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Disclaimer + Deep Dive hook */}
          <div
            className="mt-5 pt-3"
            style={{
              borderTop: immersive
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid var(--warm-glow-border)",
            }}
          >
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: textSecondary, opacity: 0.8 }}
            >
              {t.northStarDisclaimer}{" "}
              <span style={{ color: accentColor, opacity: 1 }}>
                {t.northStarDeepDiveHook}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
