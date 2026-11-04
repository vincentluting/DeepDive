"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import type { ChapterConfig } from "./data";
import { pickText, C, T, CHAPTER_COMPLETION_MESSAGES } from "./data";
import { prefersReducedMotion } from "@/lib/device";
import { hapticSuccess } from "@/lib/haptic";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";

// ── Tap-to-continue prompt (VN-style) ─────────────────────

function AdvancePrompt({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-6 flex flex-col items-center gap-1.5"
    >
      <span
        className="text-[11px] font-mono tracking-[0.15em]"
        style={{ color: C.textMuted }}
      >
        {label}
      </span>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1.5 1.5L7 7L12.5 1.5"
            stroke={C.textMuted}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ── Component ───────────────────────────────────────────────

interface ImmersiveChapterTransitionProps {
  fromChapter: ChapterConfig;
  toChapter: ChapterConfig;
  locale: Locale;
  onComplete: () => void;
}

export function ImmersiveChapterTransition({
  fromChapter,
  toChapter,
  locale,
  onComplete,
}: ImmersiveChapterTransitionProps) {
  const t = getDictionaryClient(locale).narrativeExplore;
  const reduced = prefersReducedMotion();

  // Simplified 2-stage flow: "departure" (celebrate + exit combined) → "enter" (click to continue)
  const completionMsg = CHAPTER_COMPLETION_MESSAGES[fromChapter.key];
  const [stage, setStage] = useState<"departure" | "enter">("departure");
  const [ready, setReady] = useState(false);

  // Fire haptic feedback on mount
  useEffect(() => {
    if (stage === "departure") hapticSuccess();
  }, [stage]);

  // Show continue indicator after content animations complete
  useEffect(() => {
    setReady(false);
    const delay = reduced ? 400 : 800;
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [stage, reduced]);

  // Keyboard: Enter/Space to advance
  useEffect(() => {
    if (!ready) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (stage === "departure") setStage("enter");
        else onComplete();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ready, stage, onComplete]);

  const handleClick = useCallback(() => {
    if (!ready) return;
    if (stage === "departure") setStage("enter");
    else onComplete();
  }, [ready, stage, onComplete]);

  const exitNarrative = pickText(fromChapter.transitionNarrative, locale);
  const enterNarrative = pickText(toChapter.entryNarrative, locale);

  const bgStyle =
    stage === "enter" ? toChapter.bgGradient : fromChapter.bgGradient;

  // Scene backdrop: fromChapter on departure (farewell), toChapter on enter (arrival)
  const backdropImage =
    stage === "enter" ? toChapter.sceneImageUrl : fromChapter.sceneImageUrl;

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-y-auto overscroll-contain flex flex-col items-center justify-start sm:justify-center px-6 lg:px-10 py-12 transition-all duration-700"
      style={{ background: bgStyle, cursor: ready ? "pointer" : "default" }}
      onClick={handleClick}
    >
      {/* Scene backdrop — cinematic atmospheric layer */}
      {backdropImage && (
        <motion.div
          key={`backdrop-${stage}-${backdropImage}`}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === "enter" ? 0.55 : 0.32 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.3 : 1.4, ease: T.ease }}
        >
          <Image
            src={backdropImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Vignette to keep narrative readable */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)",
            }}
          />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : T.normal }}
          className="relative z-10 w-full max-w-md lg:max-w-lg text-center flex flex-col items-center gap-6"
        >
          {/* ── Departure Stage: completion seal + exit narrative ── */}
          {stage === "departure" && (
            <>
              {/* Completion seal */}
              {completionMsg && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduced ? 0.15 : 0.5, ease: T.ease }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    border: `1.5px solid ${fromChapter.accentColor}80`,
                    background: `${fromChapter.accentColor}12`,
                  }}
                >
                  <motion.svg width={20} height={20} viewBox="0 0 20 20">
                    <motion.path
                      d="M4 10.5L8.5 15L16 5"
                      fill="none"
                      stroke={fromChapter.accentColor}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        delay: reduced ? 0 : 0.3,
                        duration: reduced ? 0.1 : 0.5,
                      }}
                    />
                  </motion.svg>
                </motion.div>
              )}

              {/* Chapter title + completion message */}
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0.05 : 0.2, duration: 0.4 }}
                className="text-lg lg:text-xl font-semibold tracking-wide"
                style={{ color: fromChapter.accentColor }}
              >
                {pickText(fromChapter.title, locale)}
              </motion.h2>

              {completionMsg && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0.1 : 0.4, duration: 0.4 }}
                  className="text-xs lg:text-sm font-light tracking-[0.08em]"
                  style={{ color: C.textMuted }}
                >
                  {pickText(completionMsg, locale)}
                </motion.p>
              )}

              {/* Exit narrative */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0.15 : 0.6, duration: T.normal }}
                className="text-sm lg:text-base font-light leading-[1.9] whitespace-pre-line"
                style={{ color: C.textPrimary }}
              >
                {exitNarrative}
              </motion.div>

              {/* Companion farewell — static one-liner from the chapter's lead character */}
              {(() => {
                const farewell = (
                  t as unknown as Record<string, string | undefined>
                )[`chapterFarewell_${fromChapter.key}`];
                if (!farewell) return null;
                return (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0.2 : 1.1,
                      duration: T.normal,
                    }}
                    className="text-xs lg:text-sm font-light italic leading-relaxed mt-2 px-4"
                    style={{
                      color: `${fromChapter.accentColor}d0`,
                      borderLeft: `2px solid ${fromChapter.accentColor}66`,
                      paddingLeft: 12,
                      textAlign: "left",
                      maxWidth: 460,
                    }}
                  >
                    {farewell}
                  </motion.p>
                );
              })()}

              {ready && <AdvancePrompt label={t.tapToContinue} />}
            </>
          )}

          {/* ── Enter Stage: next chapter narrative ── */}
          {stage === "enter" && (
            <>
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0.1 : T.fast, duration: 0.4 }}
                className="text-[11px] lg:text-[13px] font-mono font-medium tracking-[0.25em] uppercase"
                style={{
                  color: C.textPrimary,
                  textShadow:
                    "0 1px 12px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.4)",
                }}
              >
                {interpolate(t.chapterTitleWithName, {
                  n: toChapter.index,
                  title: pickText(toChapter.title, locale),
                })}
              </motion.span>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduced ? 0.15 : T.fast,
                  duration: T.normal,
                }}
                className="text-sm lg:text-base font-light leading-[1.9] whitespace-pre-line"
                style={{ color: C.textPrimary }}
              >
                {enterNarrative}
              </motion.div>

              {ready && <AdvancePrompt label={t.tapToContinue} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
