"use client";

// ============================================================
// ProfileRevealCeremony — Gamified waiting experience
//
// Replaces the bare spinner shown while LLM narratives generate.
// Progressively reveals algorithmic profile data (archetype,
// RIASEC, Big Five, values) to make the ~15-30s wait engaging.
// Navigates to /profile only after both the ceremony finishes
// AND narratives are ready (or failed).
// ============================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { prefersReducedMotion } from "@/lib/device";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Archetype color by RIASEC primary ──
// Consumed as hex+alpha suffix (`${archetypeColor}18`, `${archetypeColor}40`)
// in radial-gradient + boxShadow string concat — CSS variables break this.
/* eslint-disable local/no-hardcoded-brand-colors */
const ARCHETYPE_COLORS: Record<string, string> = {
  R: "#E74C3C",
  I: "#3498DB",
  A: "#9B59B6",
  S: "#F39C12",
  E: "#E67E22",
  C: "#1ABC9C",
};
/* eslint-enable local/no-hardcoded-brand-colors */

// ── Dimension labels (bilingual constants — not UI copy) ──

const RIASEC_NAMES: Record<string, { en: string; zh: string }> = {
  R: { en: "Realistic", zh: "现实型" },
  I: { en: "Investigative", zh: "研究型" },
  A: { en: "Artistic", zh: "艺术型" },
  S: { en: "Social", zh: "社会型" },
  E: { en: "Enterprising", zh: "企业型" },
  C: { en: "Conventional", zh: "常规型" },
};

const BIG_FIVE_NAMES: Record<string, { en: string; zh: string }> = {
  openness: { en: "Openness", zh: "开放性" },
  conscientiousness: { en: "Conscientiousness", zh: "尽责性" },
  extraversion: { en: "Extraversion", zh: "外向性" },
  agreeableness: { en: "Agreeableness", zh: "宜人性" },
  neuroticism: { en: "Emotional Sensitivity", zh: "情绪敏感性" },
};

const SCHWARTZ_NAMES: Record<string, { en: string; zh: string }> = {
  achievement: { en: "Achievement", zh: "成就" },
  power: { en: "Power", zh: "权力" },
  stimulation: { en: "Stimulation", zh: "刺激" },
  "self-direction": { en: "Self-Direction", zh: "自主" },
  hedonism: { en: "Hedonism", zh: "享乐" },
  benevolence: { en: "Benevolence", zh: "仁慈" },
  universalism: { en: "Universalism", zh: "普世" },
  conformity: { en: "Conformity", zh: "顺从" },
  tradition: { en: "Tradition", zh: "传统" },
  security: { en: "Security", zh: "安全" },
};

// ── Phase timing (ms) ──

const T = {
  STATS: 500, // Phase 0: stats flash
  ARCHETYPE: 4000, // Phase 1: archetype reveal
  LANDSCAPE: 9000, // Phase 2: trait highlights
  WAITING: 14000, // Phase 3: narrative status
  NAV_DELAY: 1500, // Delay after "ready" before navigating
};

// ── Types ──

export interface ProfileRevealData {
  userId?: string | null;
  archetype: {
    primary: string;
    label_en: string;
    label_zh: string;
    tagline_en: string;
    tagline_zh: string;
  };
  riasecScores: Record<string, number>;
  bigFiveScores: Record<string, number>;
  schwartzAnchors?: { top3: string[] };
  qualityMeta?: { totalQuestions: number; totalTimeMs: number };
}

interface Props {
  locale: "en" | "zh";
  profileData: ProfileRevealData;
  narrativeReady: boolean;
  onNavigate: () => void;
}

// ── Animation presets ──

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const outQuint = [0.22, 1, 0.36, 1] as const;
const outExpo = [0.16, 1, 0.3, 1] as const;

// ── Component ──

export function ProfileRevealCeremony({
  locale,
  profileData,
  narrativeReady,
  onNavigate,
}: Props) {
  const [phase, setPhase] = useState(-1);
  const [navigating, setNavigating] = useState(false);
  const reduced = prefersReducedMotion();
  const t = getDictionaryClient(locale).profileReveal;

  // ── Computed highlights ──

  const archetypeColor =
    // eslint-disable-next-line local/no-hardcoded-brand-colors -- hex required for `${archetypeColor}NN` alpha concat below.
    ARCHETYPE_COLORS[profileData.archetype.primary] || "#3498DB";
  const archetypeName =
    locale === "zh"
      ? profileData.archetype.label_zh
      : profileData.archetype.label_en;
  const archetypeTagline =
    locale === "zh"
      ? profileData.archetype.tagline_zh
      : profileData.archetype.tagline_en;

  const topRiasec = useMemo(() => {
    const entries = Object.entries(profileData.riasecScores);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]; // [dimension, score]
  }, [profileData.riasecScores]);

  const topBigFive = useMemo(() => {
    const entries = Object.entries(profileData.bigFiveScores);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [profileData.bigFiveScores]);

  const topValues = profileData.schwartzAnchors?.top3?.slice(0, 3) ?? [];

  // ── Phase timing ──

  useEffect(() => {
    if (reduced) {
      setPhase(3);
      return;
    }
    const timers = [
      setTimeout(() => setPhase(0), T.STATS),
      setTimeout(() => setPhase(1), T.ARCHETYPE),
      setTimeout(() => setPhase(2), T.LANDSCAPE),
      setTimeout(() => setPhase(3), T.WAITING),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  // ── Navigate when ceremony done + narrative ready ──
  // Stable ref avoids effect re-runs when onNavigate reference changes.
  // Two effects: one detects readiness, one fires the delayed navigation.
  // Splitting prevents setNavigating(true) from triggering cleanup that
  // clears the pending timer (React re-runs effect when deps change).
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    if (narrativeReady && phase >= 3 && !navigating) {
      setNavigating(true);
    }
  }, [narrativeReady, phase, navigating]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => onNavigateRef.current(), T.NAV_DELAY);
    return () => clearTimeout(timer);
  }, [navigating]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #011828 0%, #041E2B 100%)",
      }}
    >
      {/* Ambient archetype glow — fades in with phase 1 */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${archetypeColor}18, transparent 70%)`,
          opacity: phase >= 1 ? 1 : 0,
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 gap-8">
        {/* ── Phase 0: Stats flash ── */}
        <AnimatePresence>
          {phase === 0 && (
            <motion.div
              key="stats"
              {...fadeUp}
              transition={{ duration: 0.6, ease: outQuint }}
              className="text-center"
            >
              <h2 className="font-display text-2xl sm:text-3xl text-white/90 mb-3">
                {t.journeyComplete}
              </h2>
              <p className="text-white/50 text-sm">{t.craftingNarrative}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phase 1+: Archetype reveal (stays on screen) ── */}
        {phase >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: outExpo }}
            className="text-center"
          >
            {/* Glow orb */}
            <motion.div
              className="mx-auto mb-6 w-20 h-20 rounded-full"
              animate={{
                boxShadow: [
                  `0 0 40px ${archetypeColor}40, 0 0 80px ${archetypeColor}20`,
                  `0 0 60px ${archetypeColor}60, 0 0 120px ${archetypeColor}30`,
                  `0 0 40px ${archetypeColor}40, 0 0 80px ${archetypeColor}20`,
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
              style={{
                background: `radial-gradient(circle, ${archetypeColor}40, ${archetypeColor}10)`,
              }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2"
            >
              {t.yourArchetype}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: outExpo }}
              className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-3"
            >
              {archetypeName}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-white/60 text-sm sm:text-base max-w-xs mx-auto leading-relaxed"
            >
              {archetypeTagline}
            </motion.p>
          </motion.div>
        )}

        {/* ── Phase 2+: Landscape highlight cards ── */}
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 max-w-md"
          >
            {/* Top RIASEC */}
            {topRiasec && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: outQuint }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
              >
                <p className="text-[10px] uppercase tracking-wider text-white/60 mb-0.5">
                  {t.topInterest}
                </p>
                <p className="text-sm text-white/90 font-medium">
                  {RIASEC_NAMES[topRiasec[0]]?.[locale] ?? topRiasec[0]}
                  <span className="text-white/30 ml-1.5 text-xs">
                    {Math.round(topRiasec[1])}
                  </span>
                </p>
              </motion.div>
            )}

            {/* Top Big Five */}
            {topBigFive && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: outQuint }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
              >
                <p className="text-[10px] uppercase tracking-wider text-white/60 mb-0.5">
                  {t.topTrait}
                </p>
                <p className="text-sm text-white/90 font-medium">
                  {BIG_FIVE_NAMES[topBigFive[0]]?.[locale] ?? topBigFive[0]}
                  <span className="text-white/30 ml-1.5 text-xs">
                    {Math.round(topBigFive[1])}
                  </span>
                </p>
              </motion.div>
            )}

            {/* Top Values */}
            {topValues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: outQuint }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
              >
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">
                  {t.coreValues}
                </p>
                <p className="text-sm text-white/90 font-medium">
                  {topValues
                    .map((v) => SCHWARTZ_NAMES[v]?.[locale] ?? v)
                    .join(" · ")}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Phase 3: Narrative status ── */}
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-4"
          >
            <AnimatePresence mode="wait">
              {navigating ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <p className="text-sm text-white/80">{t.profileReady}</p>
                  </div>
                  {/* Fallback button — auto-navigation fires after 1.5s, but if
                      it fails for any reason the user can tap this manually. */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    onClick={() => onNavigateRef.current()}
                    className="px-6 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-colors border border-white/10"
                  >
                    {t.viewProfile}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-white/30" />
                  </motion.div>
                  <p className="text-sm text-white/40">{t.craftingNarrative}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
