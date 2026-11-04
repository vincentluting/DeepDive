// ============================================================
// Career Narrative Card — Golden Quote + Day-in-the-Life
//
// Displays a visually striking pull-quote (the "这就是我！" moment)
// and an expandable day-in-the-life career narrative.
//
// Priority: career-level narrative (API, 1140 careers) → Holland code
// narrative (client, 83 codes) → null (hidden).
//
// The career-narratives module (~2.2MB) is kept server-side via an
// API route to avoid bloating the client bundle.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { findNarrative } from "@/lib/content/holland-code-narratives";

interface CareerNarrative {
  careerId: string;
  quote_zh: string;
  quote_en: string;
  dayInLife_zh: string;
  dayInLife_en: string;
}

interface CareerNarrativeCardProps {
  /** Best-match career ID for career-level narrative lookup */
  careerId?: string;
  /** Best-match career title (zh) */
  careerTitleZh?: string;
  /** Best-match career title (en) */
  careerTitleEn?: string;
  /** Fallback: 3-letter Holland code for code-level narrative */
  hollandCode3: string;
  locale: string;
  themeColor: string;
  t: Record<string, string>;
  animationDelay?: number;
  /** When true, uses warm archive aesthetic from immersive mode */
  immersive?: boolean;
  /** Drop the rounded card chrome on both inner sections (golden quote and
   *  day-in-life) — the parent RevArtifact in the Revelation shell already
   *  provides framing. */
  monograph?: boolean;
}

export function HollandNarrativeCard({
  careerId,
  careerTitleZh,
  careerTitleEn,
  hollandCode3,
  locale,
  themeColor,
  t,
  animationDelay = 0,
  immersive = false,
  monograph = false,
}: CareerNarrativeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [careerNarrative, setCareerNarrative] =
    useState<CareerNarrative | null>(null);
  const [loaded, setLoaded] = useState(!careerId); // skip loading if no careerId
  const isZh = locale === "zh";

  // Fetch career narrative from API (keeps 2.2MB module server-side)
  useEffect(() => {
    if (!careerId) return;
    let cancelled = false;
    fetch(`/api/career-narrative?careerId=${encodeURIComponent(careerId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setCareerNarrative(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [careerId]);

  // Holland code fallback (small module, safe to bundle)
  const hollandNarrative =
    !careerNarrative && loaded ? findNarrative(hollandCode3) : undefined;

  if (!loaded) return null;
  if (!careerNarrative && !hollandNarrative) return null;

  const quote = careerNarrative
    ? isZh
      ? careerNarrative.quote_zh
      : careerNarrative.quote_en
    : isZh
      ? hollandNarrative!.quote_zh
      : hollandNarrative!.quote_en;

  const dayInLife = careerNarrative
    ? isZh
      ? careerNarrative.dayInLife_zh
      : careerNarrative.dayInLife_en
    : isZh
      ? hollandNarrative!.dayInLife_zh
      : hollandNarrative!.dayInLife_en;

  const careerTitle = careerNarrative
    ? isZh
      ? careerTitleZh || careerId
      : careerTitleEn || careerId
    : isZh
      ? hollandNarrative!.career_zh
      : hollandNarrative!.career_en;

  return (
    <div
      className={monograph ? "flex flex-col gap-5" : "mb-6 flex flex-col gap-5"}
    >
      {/* ── Golden Quote — editorial pull-quote ── */}
      <motion.div
        className={
          monograph ? "relative" : "relative rounded-2xl overflow-hidden"
        }
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay,
          duration: immersive ? 0.8 : 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Subtle gradient background — suppressed in monograph mode */}
        {!monograph && (
          <div
            className="absolute inset-0"
            style={{
              background: immersive
                ? "linear-gradient(145deg, #1A1610 0%, #0F0C06 100%)"
                : `linear-gradient(145deg, ${themeColor}0C 0%, ${themeColor}04 60%, transparent 100%)`,
            }}
          />
        )}

        {/* Top accent line — suppressed in monograph mode */}
        {!monograph && (
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: immersive
                ? "linear-gradient(90deg, transparent 5%, rgba(255, 225, 160, 0.25) 30%, rgba(255, 225, 160, 0.4) 50%, rgba(255, 225, 160, 0.25) 70%, transparent 95%)"
                : `linear-gradient(90deg, transparent 5%, ${themeColor}40 30%, ${themeColor}60 50%, ${themeColor}40 70%, transparent 95%)`,
            }}
          />
        )}

        <div className="relative px-6 py-7 lg:px-8 lg:py-9">
          {/* Decorative quotation mark — sits in the left gutter, behind the
              text. fontSize uses clamp() so it scales down on narrow viewports
              and the blockquote pl-* clears it on every breakpoint. */}
          <div
            className="absolute top-3 left-3 lg:top-4 lg:left-5 select-none pointer-events-none"
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              lineHeight: 1,
              color: immersive
                ? "rgba(255, 225, 160, 0.12)"
                : `${themeColor}18`,
            }}
            aria-hidden="true"
          >
            &ldquo;
          </div>

          {/* Quote text — pl-* keeps the first line clear of the decorative
              quote glyph (which is absolutely positioned in the gutter). */}
          <blockquote
            className="relative z-10 text-base sm:text-lg lg:text-xl leading-relaxed pl-12 sm:pl-14 lg:pl-20"
            style={{
              fontFamily: "var(--font-display, inherit)",
              color: immersive
                ? "rgba(255, 255, 255, 0.95)"
                : "var(--foreground)",
              lineHeight: isZh ? 1.9 : 1.7,
              fontWeight: 500,
            }}
          >
            {quote}
          </blockquote>

          {/* Attribution line */}
          <div className="flex items-center gap-2 mt-4 pl-2">
            <div
              className="w-8 h-px"
              style={{
                background: immersive
                  ? "rgba(255, 225, 160, 0.3)"
                  : `${themeColor}40`,
              }}
            />
            <span
              className="text-[10px] font-mono tracking-[0.15em] uppercase"
              style={{
                color: immersive
                  ? "rgba(255, 225, 160, 0.82)"
                  : `${themeColor}88`,
              }}
            >
              {hollandCode3}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Day-in-the-Life — expandable narrative card ── */}
      <motion.div
        className={monograph ? undefined : "rounded-2xl overflow-hidden"}
        style={
          monograph
            ? undefined
            : immersive
              ? {
                  background: "#1A1610",
                  border: "1px solid rgba(255, 225, 160, 0.1)",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
                }
              : {
                  background: "var(--glass-shallow)",
                  border: "1px solid var(--card-border-subtle)",
                  boxShadow: "var(--card-shadow-subtle)",
                }
        }
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay + 0.12,
          duration: immersive ? 0.8 : 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Header — always visible, clickable */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 lg:px-7 lg:py-5 cursor-pointer group transition-colors"
          style={{ background: "transparent" }}
        >
          <div className="flex flex-col items-start gap-1">
            <span
              className="text-[10px] font-mono tracking-[0.15em] uppercase"
              style={{
                color: immersive
                  ? "rgba(255, 225, 160, 0.82)"
                  : `${themeColor}88`,
              }}
            >
              {t.dayInLifeLabel}
            </span>
            <span
              className="text-sm lg:text-base font-semibold text-left"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.95)"
                  : "var(--foreground)",
                fontFamily: "var(--font-display, inherit)",
              }}
            >
              {careerTitle}
            </span>
          </div>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 ml-3"
          >
            <ChevronDown
              size={18}
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.55)"
                  : "var(--text-secondary-on-shallow)",
              }}
            />
          </motion.div>
        </button>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {/* Separator */}
              <div
                className="mx-5 lg:mx-7 h-px"
                style={{
                  background: immersive
                    ? "rgba(255, 225, 160, 0.12)"
                    : `${themeColor}15`,
                }}
              />

              {/* Narrative body */}
              <div className="px-5 py-5 lg:px-7 lg:py-6">
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{
                    color: immersive
                      ? "rgba(255, 255, 255, 0.85)"
                      : "var(--foreground)",
                    opacity: immersive ? 1 : 0.88,
                    lineHeight: isZh ? 2 : 1.8,
                  }}
                >
                  {dayInLife}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
