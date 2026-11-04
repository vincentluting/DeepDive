// ============================================================
// Archetype Identity Card — Full identity card with trait
// descriptions and O*NET rarity data for the Quick Dive result.
//
// Share = copy result URL + native share API.
// PNG social card removed — OG metadata on public result page
// handles social preview rendering automatically.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { findLabel } from "./quickdive-data";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_APP_URL } from "@/lib/utils";

// Official Holland/RIASEC type names (academic standard)
const HOLLAND_OFFICIAL: Record<string, { zh: string; en: string }> = {
  R: { zh: "现实型", en: "Realistic" },
  I: { zh: "研究型", en: "Investigative" },
  A: { zh: "艺术型", en: "Artistic" },
  S: { zh: "社会型", en: "Social" },
  E: { zh: "企业型", en: "Enterprising" },
  C: { zh: "常规型", en: "Conventional" },
};

interface ArchetypeIdentityCardProps {
  archetypeCode: string;
  locale: string;
  animationDelay?: number;
  /** 3-letter Holland Code (e.g. "RIA") — shown in badge */
  hollandCode3?: string;
  /** Combination narrative for the top-2 types */
  comboNarrative?: string;
  /** Called when the share button is clicked (for analytics) */
  onShare?: () => void;
  /** When true, uses warm archive aesthetic from immersive mode */
  immersive?: boolean;
  /** When true, the card is rendered inside the Revelation editorial shell.
   *  In this mode the redundant primary archetype name is hidden (the
   *  RevChapter title already displays it) and the chrome flattens to fit
   *  the paper aesthetic. */
  monograph?: boolean;
  /** Saved result ID for shareable URL */
  savedReportId?: string | null;
}

export function ArchetypeIdentityCard({
  archetypeCode,
  locale,
  animationDelay = 0,
  hollandCode3,
  comboNarrative: _comboNarrative,
  onShare,
  immersive = false,
  monograph = false,
  savedReportId,
}: ArchetypeIdentityCardProps) {
  const isZh = locale === "zh";
  const t = getDictionaryClient(locale as Locale).quickDive;
  const label = findLabel(archetypeCode);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!label) return null;

  const primaryName = isZh ? label.label_zh : label.label_en;
  const descriptionText = isZh ? label.tagline_zh : label.tagline_en;

  // Build Holland Code explanation line: "现实 · 研究 · 艺术"
  const hollandExplanation = hollandCode3
    ? hollandCode3
        .split("")
        .map((ch) => {
          const h = HOLLAND_OFFICIAL[ch];
          return h ? (isZh ? h.zh.replace("型", "") : h.en) : ch;
        })
        .join(" · ")
    : undefined;
  const attribution = immersive ? t.immersiveAttribution : t.onetSource;

  const stagger = 0.12;

  const handleShare = useCallback(async () => {
    onShare?.();
    const base = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
    const url = savedReportId
      ? `${base}/${locale}/result/qd/${savedReportId}`
      : `${base}/${locale}/share/${archetypeCode.toLowerCase()}`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${primaryName} — DeepDive`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [locale, archetypeCode, savedReportId, primaryName, onShare]);

  return (
    <motion.div
      className="text-center py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: animationDelay, duration: 0.4 }}
    >
      {/* 1. Type code badge */}
      <motion.div
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-5"
        style={
          immersive
            ? {
                background: "rgba(255, 225, 160, 0.06)",
                border: "1px solid rgba(255, 225, 160, 0.2)",
              }
            : {
                background: `${label.colorHex}10`,
                border: `1px solid ${label.colorHex}28`,
              }
        }
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay,
          duration: immersive ? 0.8 : 0.4,
        }}
      >
        <span
          className="text-xs font-mono tracking-[0.2em] uppercase"
          style={{
            color: immersive
              ? "rgba(255, 225, 160, 0.85)"
              : "var(--foreground)",
          }}
        >
          {hollandCode3 || t.typeBadge}
        </span>
      </motion.div>

      {/* 1b. Holland Code explanation */}
      {hollandExplanation && (
        <motion.p
          className="text-xs mb-4 -mt-2 tracking-wide"
          style={{
            color: immersive
              ? "rgba(255, 255, 255, 0.7)"
              : "var(--muted-foreground)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: animationDelay + 0.06,
            duration: immersive ? 0.8 : 0.4,
          }}
        >
          {hollandExplanation}
        </motion.p>
      )}

      {/* 2. Primary archetype name — typewriter reveal in immersive mode.
            Hidden in monograph mode because RevChapter already renders the
            archetype name as its display title. */}
      {monograph ? null : immersive ? (
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
          style={{
            color: "rgba(255, 255, 255, 0.95)",
            fontFamily: "var(--font-display, inherit)",
          }}
        >
          {primaryName.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: animationDelay + stagger + i * 0.06,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>
      ) : (
        <motion.h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-display, inherit)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay + stagger, duration: 0.5 }}
        >
          {primaryName}
        </motion.h1>
      )}

      {/* 3. Tagline description */}
      <motion.p
        className="text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-6"
        style={{
          color: immersive
            ? "rgba(255, 255, 255, 0.78)"
            : "var(--muted-foreground)",
          lineHeight: 1.8,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay + stagger * 2,
          duration: immersive ? 0.8 : 0.5,
        }}
      >
        {descriptionText}
      </motion.p>

      {/* 4. Data source attribution */}
      <motion.p
        className="text-[10px] sm:text-xs mb-5"
        style={{
          color: immersive
            ? "rgba(255, 255, 255, 0.55)"
            : "var(--muted-foreground)",
          fontStyle: immersive ? "italic" : undefined,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: animationDelay + stagger * 3,
          duration: 0.4,
        }}
      >
        {attribution}
      </motion.p>

      {/* 5. Share button — copy link + native share */}
      <motion.button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
        style={
          immersive
            ? {
                background: "rgba(255, 225, 160, 0.1)",
                border: "1px solid rgba(255, 225, 160, 0.25)",
                color: "rgba(255, 225, 160, 0.92)",
              }
            : {
                background: `${label.colorHex}12`,
                border: `1px solid ${label.colorHex}30`,
                color: "var(--foreground)",
              }
        }
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: animationDelay + stagger * 5,
          duration: 0.4,
        }}
        aria-label={t.shareMyType}
      >
        {linkCopied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {t.linkCopied}
          </>
        ) : (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM3.5 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 3l-5 2.5M4 7.5 9 10"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {t.shareMyTypeTitle}
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
