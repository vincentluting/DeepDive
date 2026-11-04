'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { prefersReducedMotion } from '@/lib/device';
import { hapticSuccess } from '@/lib/haptic';
import { getDictionaryClient } from '@/lib/i18n/get-dictionary-client';
import { getLocalizedField, pickLocaleText } from '@/lib/i18n/localize';

// ============================================================
// CompletionCeremony — Peak-End Rule animation
// Full-screen overlay shown AFTER the last answer is submitted
// but BEFORE report generation/loading begins.
// 8-second choreographed sequence (or 2s static for reduced motion)
// ============================================================

interface CompletionCeremonyProps {
  locale: 'zh' | 'en';
  onComplete: () => void;
  stats?: {
    archetypeName?: { en: string; zh: string };
    topModuleCInsight?: { en: string; zh: string };
  };
}

// Phase timing constants (ms)
const PHASE_1_END = 1000;    // Background fade in
const PHASE_2_END = 3000;    // Pieces descend
const PHASE_3_END = 4500;    // Pieces converge + merge
const STATS_START = 3800;    // Stats flash start
const STATS_END = 5000;      // Stats flash end
const _PHASE_4_END = 6000;    // Text reveal (kept for timeline reference)
const TEASER_START = 5500;   // Data teaser card appears
const TEASER_END = 7000;     // Data teaser card fades
const PHASE_5_END = 9000;    // Fade out + call onComplete
const REDUCED_MOTION_MS = 2500;

// Piece definitions
const PIECES = [
  {
    label_zh: '兴趣',
    label_en: 'Interests',
    color: 'rgba(14, 165, 233, 0.6)',
    glow: 'rgba(14, 165, 233, 0.35)',
  },
  {
    label_zh: '价值',
    label_en: 'Values',
    color: 'rgba(20, 184, 166, 0.6)',
    glow: 'rgba(20, 184, 166, 0.35)',
  },
  {
    label_zh: '人格',
    label_en: 'Personality',
    color: 'rgba(99, 102, 241, 0.6)',
    glow: 'rgba(99, 102, 241, 0.35)',
  },
];

// Typewriter hook for text reveal
function useTypewriter(text: string, charDelayMs: number, startAfterMs: number) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), startAfterMs);
    return () => clearTimeout(startTimer);
  }, [startAfterMs]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, charDelayMs);
    return () => clearInterval(interval);
  }, [started, text, charDelayMs]);

  return displayed;
}

// Diamond glyph (reused from deep-dive-intro.tsx)
function DiamondGlyph({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 4L32 20L20 36L8 20L20 4Z"
        stroke="rgba(14, 165, 233, 0.7)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M20 10L26 20L20 30L14 20L20 10Z"
        stroke="rgba(14, 165, 233, 0.5)"
        strokeWidth="1"
        fill="rgba(14, 165, 233, 0.1)"
      />
      <circle cx="20" cy="20" r="2" fill="rgba(14, 165, 233, 0.5)" />
    </svg>
  );
}

export function CompletionCeremony({ locale, onComplete, stats }: CompletionCeremonyProps) {
  const isZh = locale === 'zh';
  const reducedMotion = prefersReducedMotion();
  const dictionary = getDictionaryClient(locale);
  const t = dictionary.completionCeremony;
  const profileRevealT = dictionary.profileReveal;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Timeline phase tracking
  const [phase, setPhase] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Text for typewriter effect
  const revealText = t.revealText;
  const typewriterDelay = isZh ? 60 : 80; // ms per char (zh) or per char cluster (en)
  const typedText = useTypewriter(
    revealText,
    typewriterDelay,
    reducedMotion ? 0 : PHASE_3_END + 300,
  );

  // Reduced motion: show static for 2s then complete
  useEffect(() => {
    if (!reducedMotion) return;
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, REDUCED_MOTION_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  // Full animation timeline
  useEffect(() => {
    if (reducedMotion) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: background fade (0s)
    setPhase(1);

    // Phase 2: pieces descend (1s)
    timers.push(setTimeout(() => setPhase(2), PHASE_1_END));

    // Phase 3: pieces converge (3s)
    timers.push(setTimeout(() => {
      setPhase(3);
      hapticSuccess();
    }, PHASE_2_END));

    // Stats flash (3.8s)
    timers.push(setTimeout(() => setShowStats(true), STATS_START));
    timers.push(setTimeout(() => setShowStats(false), STATS_END));

    // Phase 4: text reveal (4.5s)
    timers.push(setTimeout(() => setPhase(4), PHASE_3_END));

    // Teaser card (5.5s – 7s)
    timers.push(setTimeout(() => setShowTeaser(true), TEASER_START));
    timers.push(setTimeout(() => setShowTeaser(false), TEASER_END));

    // Phase 5: fade out (7s → 9s for extended teaser timeline)
    timers.push(setTimeout(() => {
      setPhase(5);
      setFadeOut(true);
    }, TEASER_END));

    // Complete (9s)
    timers.push(setTimeout(() => {
      onCompleteRef.current();
    }, PHASE_5_END));

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  // ─── Reduced motion: static version ───
  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, #041E2B 0%, #020D14 100%)',
        }}
      >
        <DiamondGlyph size={56} />
        <p className="text-lg text-white/75 tracking-wide mt-6">
          {revealText}
        </p>
      </div>
    );
  }

  // ─── Full animation ───
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: fadeOut ? 1.5 : 1 }}
      style={{
        background: 'radial-gradient(ellipse at 50% 60%, #041E2B 0%, #020D14 100%)',
      }}
    >
      {/* Radial light burst on merge */}
      <AnimatePresence>
        {phase >= 3 && phase < 5 && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid rgba(14, 165, 233, 0.15)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 800, height: 800, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Three puzzle pieces */}
      <div className="relative" style={{ width: 280, height: 120 }}>
        {PIECES.map((piece, i) => {
          // Phase 2: descend to spread positions
          // Phase 3: converge to center
          const spreadX = (i - 1) * 90; // -90, 0, 90
          const descendDelay = i * 0.4;

          const isDescended = phase >= 2;
          const isMerged = phase >= 3;

          return (
            <motion.div
              key={piece.label_en}
              className="absolute flex flex-col items-center justify-center rounded-2xl"
              style={{
                width: 72,
                height: 72,
                left: '50%',
                top: '50%',
                marginLeft: -36,
                marginTop: -36,
                background: isMerged
                  ? 'transparent'
                  : `radial-gradient(circle, ${piece.color} 0%, transparent 70%)`,
                border: isMerged
                  ? 'none'
                  : `1px solid ${piece.glow}`,
                boxShadow: isMerged
                  ? 'none'
                  : `0 0 20px ${piece.glow}, inset 0 0 12px ${piece.glow}`,
              }}
              initial={{ y: -300, x: spreadX, opacity: 0, scale: 0.6 }}
              animate={{
                y: isDescended ? (isMerged ? 0 : 0) : -300,
                x: isDescended ? (isMerged ? 0 : spreadX) : spreadX,
                opacity: isDescended ? (isMerged ? 0 : 1) : 0,
                scale: isDescended ? (isMerged ? 0.5 : 1) : 0.6,
              }}
              transition={
                isMerged
                  ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  : {
                      type: 'spring',
                      damping: 15,
                      stiffness: 80,
                      delay: descendDelay,
                    }
              }
            >
              {/* Particle trail during descent */}
              {phase === 2 && (
                <motion.div
                  className="absolute w-1 h-8 rounded-full pointer-events-none"
                  style={{
                    top: -32,
                    background: `linear-gradient(180deg, transparent, ${piece.glow})`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1.2, delay: descendDelay }}
                />
              )}
              <span className="text-xs text-white/75 font-light tracking-wide">
                {getLocalizedField(piece, 'label', locale)}
              </span>
            </motion.div>
          );
        })}

        {/* Merged diamond glyph */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              className="absolute flex items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: -28,
                marginTop: -28,
                width: 56,
                height: 56,
              }}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(14, 165, 233, 0.2)',
                    '0 0 40px rgba(14, 165, 233, 0.35)',
                    '0 0 20px rgba(14, 165, 233, 0.2)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full p-2"
              >
                <DiamondGlyph size={48} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completion status flash */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[11px] text-white/70 tracking-widest uppercase">
              {profileRevealT.journeyComplete}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Text reveal with typewriter */}
      {phase >= 4 && (
        <motion.p
          className="text-lg text-white/80 tracking-wide mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {typedText}
          <motion.span
            className="inline-block w-px h-5 bg-white/75 ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          />
        </motion.p>
      )}

      {/* Phase 3.5: Data teaser card — glimpse of results */}
      <AnimatePresence>
        {showTeaser && stats && (stats.archetypeName || stats.topModuleCInsight) && (
          <motion.div
            className="mt-6 px-6 py-4 rounded-2xl text-center max-w-xs"
            style={{
              background: 'rgba(14, 165, 233, 0.06)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(14, 165, 233, 0.10)',
            }}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] text-white/60 tracking-widest uppercase mb-2">
              {t.teaserGlimpse}
            </p>
            {stats.archetypeName && (
              <motion.p
                className="text-base font-medium text-sky-300/90 tracking-wide"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              >
                {pickLocaleText(stats.archetypeName, locale)}
              </motion.p>
            )}
            {stats.topModuleCInsight && (
              <motion.p
                className="text-sm text-white/75 mt-1.5"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
              >
                {t.teaserStrongestSignal}{pickLocaleText(stats.topModuleCInsight, locale)}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
