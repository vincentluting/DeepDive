"use client";

import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { CHARACTERS, pickText, C, GRADIENTS } from "./data";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { prefersReducedMotion } from "@/lib/device";
import { hapticMedium } from "@/lib/haptic";

// ── Component ───────────────────────────────────────────────

interface ImmersiveExploreCharactersProps {
  locale: Locale;
  onComplete: () => void;
}

export function ImmersiveExploreCharacters({
  locale,
  onComplete,
}: ImmersiveExploreCharactersProps) {
  const t = getDictionaryClient(locale).narrativeExplore;
  const reduced = prefersReducedMotion();

  const [visibleCount, setVisibleCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  // Reveal characters one by one
  useEffect(() => {
    if (visibleCount >= CHARACTERS.length) {
      const timer = setTimeout(() => setAllRevealed(true), 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => {
        setVisibleCount((c: number) => c + 1);
      },
      reduced ? 200 : 600,
    );
    return () => clearTimeout(timer);
  }, [visibleCount, reduced]);

  const handleContinue = useCallback(() => {
    hapticMedium();
    onComplete();
  }, [onComplete]);

  return (
    <div
      className="h-dvh min-h-dvh overflow-y-auto overscroll-contain flex flex-col items-center justify-start lg:justify-center px-6 py-10 lg:py-12"
      style={{ background: GRADIENTS.charsBg }}
    >
      {/* Title */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.6 }}
      >
        <h2
          className="text-lg lg:text-xl font-light tracking-wide mb-2"
          style={{ color: C.gold }}
        >
          {t.charactersTitle}
        </h2>
        <p
          className="text-xs lg:text-sm font-light"
          style={{ color: C.textTertiary }}
        >
          {t.charactersSubtitle}
        </p>
      </motion.div>

      {/* Character list */}
      <div className="w-full max-w-sm lg:max-w-md flex flex-col gap-4 mb-10">
        <AnimatePresence>
          {CHARACTERS.slice(0, visibleCount).map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduced ? 0.15 : 0.4,
                delay: reduced ? 0 : 0.05 * i,
              }}
              className="flex items-start gap-4 px-4 py-3 rounded-lg"
              style={{
                background: C.whiteSubtle,
                border: `1px solid ${C.whiteBorder}`,
              }}
            >
              {/* Portrait — editorial illustration if available, fallback to initial badge */}
              {char.portraitUrl ? (
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden relative"
                  style={{
                    border: `1px solid ${C.brownMuted}`,
                    boxShadow: `0 2px 14px rgba(139, 96, 64, 0.22)`,
                  }}
                >
                  <Image
                    src={char.portraitUrl}
                    alt={pickText(char.name, locale)}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: C.brownSubtle,
                    color: C.goldSubtle,
                    border: `1px solid ${C.brownMuted}`,
                  }}
                >
                  {pickText(char.name, locale).charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm lg:text-base font-medium mb-0.5"
                  style={{ color: C.gold }}
                >
                  {pickText(char.name, locale)}
                </p>
                <p
                  className="text-xs lg:text-sm font-light leading-relaxed"
                  style={{ color: C.textSecondary }}
                >
                  {pickText(char.description, locale)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {allRevealed && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.5 }}
            onClick={handleContinue}
            className="px-8 py-3 min-h-[44px] rounded-lg text-sm font-light tracking-wide transition-opacity hover:opacity-80"
            style={{
              background: `rgba(139, 104, 64, 0.25)`,
              color: C.gold,
              border: `1px solid rgba(139, 104, 64, 0.35)`,
            }}
          >
            {t.charactersContinue}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
