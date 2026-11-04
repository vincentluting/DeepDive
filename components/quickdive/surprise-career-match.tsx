"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles } from "lucide-react";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface SurpriseCareerMatchProps {
  career: { name: string; pct: number; tagline?: string };
  archetypeCode: string;
  archetypeTitle: string; // Chinese
  archetypeTitleEn: string; // English
  locale: string;
  animationDelay?: number;
  /** When true, uses warm archive aesthetic from immersive mode */
  immersive?: boolean;
  /** Drop the rounded card chrome (RevArtifact in the Revelation shell
   *  already provides framing) and skip the 3D flip dance. */
  monograph?: boolean;
}

export function SurpriseCareerMatch({
  career,
  archetypeCode: _archetypeCode,
  archetypeTitle,
  archetypeTitleEn,
  locale,
  animationDelay = 0,
  immersive = false,
  monograph = false,
}: SurpriseCareerMatchProps) {
  const isZh = locale === "zh";
  const t = getDictionaryClient(locale as Locale).quickDive;
  const archetypeName = isZh ? archetypeTitle : archetypeTitleEn;

  const headerText = interpolate(t.topMatchHeader, {
    archetype: archetypeName,
  });
  const footerText = t.topMatchFooter;
  const bonusLabel = immersive ? t.immersiveTopMatch : t.topMatch;

  const accentColor = immersive ? "rgba(255, 225, 160, 0.95)" : "#E8763A";

  // Flip reveal state (immersive only)
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-40px" });
  const [revealed, setRevealed] = useState(!immersive);

  // Trigger flip when card scrolls into view (immersive only)
  if (immersive && isInView && !revealed) {
    setTimeout(() => setRevealed(true), 600);
  }

  const cardStyle = immersive
    ? {
        background: "#1A1610",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
      }
    : {
        background: "var(--glass-shallow)",
        border: "1px solid var(--warm-glow-border)",
        boxShadow: "var(--warm-glow-shadow)",
      };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: animationDelay,
        duration: immersive ? 0.8 : 0.45,
        ease: "easeOut",
      }}
      className={monograph ? undefined : "mb-6"}
      style={{ perspective: immersive ? 800 : undefined }}
    >
      {/* Immersive: 3D flip container */}
      <div
        className="relative w-full"
        style={
          immersive
            ? {
                transformStyle: "preserve-3d",
                transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                transform: revealed ? "rotateY(0deg)" : "rotateY(180deg)",
              }
            : undefined
        }
      >
        {/* Front face (career content — visible when revealed) */}
        <div
          className={
            monograph ? "relative" : "relative rounded-2xl overflow-hidden"
          }
          style={
            monograph
              ? immersive
                ? { backfaceVisibility: "hidden" }
                : undefined
              : {
                  ...cardStyle,
                  ...(immersive ? { backfaceVisibility: "hidden" } : {}),
                }
          }
        >
          {/* Subtle warm glow top accent (suppressed in monograph mode) */}
          {!monograph && (
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: immersive
                  ? "linear-gradient(90deg, transparent 10%, rgba(240, 220, 170, 0.3) 50%, transparent 90%)"
                  : "linear-gradient(90deg, transparent 10%, var(--warm-glow-line) 50%, transparent 90%)",
              }}
            />
          )}

          <div className="p-5">
            {/* Header row — sparkle icon + bonus badge */}
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={revealed ? { rotate: [0, 12, -8, 6, 0] } : {}}
                transition={{
                  delay: animationDelay + 0.6,
                  duration: 0.7,
                  ease: "easeInOut",
                }}
              >
                <Sparkles size={15} style={{ color: accentColor }} />
              </motion.div>
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: accentColor }}
              >
                {bonusLabel}
              </span>
            </div>

            {/* Header explanation text */}
            <p
              className="text-xs leading-relaxed mb-4"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.9)"
                  : "var(--text-secondary-on-shallow)",
              }}
            >
              {headerText}
            </p>

            {/* Career name */}
            <h3
              className="text-base font-bold leading-tight mb-1"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.96)"
                  : "var(--foreground)",
              }}
            >
              {career.name}
            </h3>

            {/* Tagline — what this career actually does */}
            {career.tagline && (
              <p
                className="text-xs leading-relaxed mb-3"
                style={{
                  color: immersive
                    ? "rgba(255, 255, 255, 0.68)"
                    : "var(--text-secondary-on-shallow)",
                }}
              >
                {career.tagline}
              </p>
            )}

            {/* Match bar — width from actual RIASEC score */}
            <div className="mb-4">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: immersive
                    ? "rgba(255, 255, 255, 0.06)"
                    : "var(--locked-bg)",
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: immersive
                      ? "linear-gradient(90deg, rgba(139, 104, 64, 0.8), rgba(255, 225, 160, 0.88))"
                      : "linear-gradient(90deg, #E8763A, #F59E5A)",
                  }}
                  initial={{ width: 0 }}
                  animate={
                    revealed ? { width: `${career.pct}%` } : { width: 0 }
                  }
                  transition={{
                    delay: immersive ? 0.3 : animationDelay + 0.4,
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>

            {/* Footer hint */}
            <p
              className="text-xs"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.75)"
                  : "var(--text-secondary-on-shallow)",
              }}
            >
              {footerText}
            </p>
          </div>
        </div>

        {/* Back face (sealed "?" cover — visible before flip, immersive only) */}
        {immersive && (
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{
              ...cardStyle,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Wax seal circle */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(112, 96, 80, 0.6) 0%, rgba(112, 96, 80, 0.25) 100%)",
                border: "2px solid rgba(112, 96, 80, 0.4)",
                boxShadow: "0 0 20px rgba(112, 96, 80, 0.15)",
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{
                  color: "rgba(200, 185, 165, 0.7)",
                  fontFamily: "var(--font-display, serif)",
                }}
              >
                ?
              </span>
            </div>
            <span
              className="text-[10px] font-mono tracking-[0.2em] uppercase"
              style={{ color: "rgba(200, 185, 165, 0.35)" }}
            >
              {t.immersiveRevealing}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
