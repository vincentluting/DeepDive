"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MODULE_DEPTH_COLORS,
  getModuleList,
  getTotalQuestions,
  useQuestionnaireStore,
  type ModuleCode,
} from "@/store/questionnaire-store";
import {
  clearApiSaveTimer,
  immediateApiSave,
} from "@/lib/questionnaire/store-utils";
import { QuestionRenderer } from "./question-renderer";
import { ModuleTransition } from "./module-transition";
import { MicroFeedback } from "./micro-feedback";
import { ExplorationMap } from "./exploration-map";
import { CompletionCeremony } from "./completion-ceremony";
import { ProfileRevealCeremony } from "./profile-reveal-ceremony";
import {
  IPIP_CHAPTERS,
  IPIP_60_ITEM_DOMAIN_MAP,
  IPIP_60_PRESENTATION_ORDER,
} from "@/lib/questionnaire";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import {
  useQuestionnaireFlow,
  AUTO_ADVANCE_DELAY_MS,
} from "./use-questionnaire-flow";
import { useAssessmentSubmission } from "./use-assessment-submission";
import { BackToExplore } from "@/components/layout/back-to-explore";
import { DeepDiveIntro } from "./deep-dive-intro";
import { PageArtLayer } from "@/components/design/meridian/page-art-layer";
import { ExpeditionRail } from "@/components/design/meridian/expedition-rail";
import {
  DepthGauge,
  type DepthStation,
} from "@/components/design/meridian/depth-gauge";
import { prefersReducedMotion } from "@/lib/device";
import type { ResolvedModules } from "@/lib/questionnaire/module-resolver";
import { ARCHETYPES } from "@/lib/content";
import { getClientId } from "@/lib/auth/client-id";
import { analytics } from "@/lib/analytics/client";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";

// ============================================================
// Depth interpolation — maps question progress to a depth reading
// ============================================================

const MODULE_DEPTH_RANGES: Record<ModuleCode, { start: number; end: number }> =
  {
    A: { start: 50, end: 200 },
    B: { start: 200, end: 800 },
    C: { start: 800, end: 2000 },
  };

const DEPTH_STATION_DEPTHS = [0, 200, 400, 600] as const;

function getInterpolatedDepth(
  module: ModuleCode,
  progressInModule: number,
): number {
  const range = MODULE_DEPTH_RANGES[module];
  return Math.round(
    range.start + (range.end - range.start) * (progressInModule / 100),
  );
}

// ============================================================
// Three-layer Ambient Particles + Background Light System
// ============================================================
// Layer 1: Far plankton (CSS-only, 25 particles, very subtle)
// Layer 2: Mid-range particles (Framer Motion, 6-8, slow drift)
// Layer 3: Rare bioluminescence pulse (Module C only, 1-2)
// + Background light gradient that fades with depth

interface Particle {
  id: number;
  x: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

// Module-specific atmosphere config
const ATMOSPHERE: Record<
  ModuleCode,
  {
    midCount: number;
    midSize: [number, number];
    midDuration: [number, number];
    midColor: string;
    midGlow: string;
    hasBioluminescence: boolean;
    lightGradient: string; // Top-down sunlight simulation
  }
> = {
  A: {
    midCount: 6,
    midSize: [2, 4],
    midDuration: [10, 18],
    midColor: "rgba(125, 211, 252, VAR)",
    midGlow: "0 0 4px rgba(56, 189, 248, GVAR)",
    hasBioluminescence: false,
    // Sunlit surface — faint light from above
    lightGradient:
      "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(56, 189, 248, 0.06) 0%, transparent 70%)",
  },
  B: {
    midCount: 4,
    midSize: [2, 5],
    midDuration: [14, 24],
    midColor: "rgba(186, 230, 253, VAR)",
    midGlow: "0 0 5px rgba(45, 212, 191, GVAR)",
    hasBioluminescence: false,
    // Twilight — almost no light
    lightGradient:
      "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(45, 212, 191, 0.02) 0%, transparent 60%)",
  },
  C: {
    midCount: 3,
    midSize: [3, 6],
    midDuration: [18, 30],
    midColor: "rgba(200, 220, 255, VAR)",
    midGlow: "none",
    hasBioluminescence: true,
    // Abyss — pitch black, no ambient light
    lightGradient: "none",
  },
};

// Far plankton positions — deterministic to avoid hydration mismatch
const FAR_PLANKTON = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x: (i * 37 + 13) % 100,
  y: (i * 53 + 7) % 100,
  size: 1 + (i % 3) * 0.5,
  opacity: 0.015 + (i % 5) * 0.008,
  duration: 20 + (i % 7) * 4,
  delay: (i % 11) * 2,
}));

function AmbientParticles({ module }: { module: ModuleCode }) {
  const atm = ATMOSPHERE[module];
  const [midParticles, setMidParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setMidParticles(
      Array.from({ length: atm.midCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        startY: 80 + Math.random() * 20,
        size:
          atm.midSize[0] + Math.random() * (atm.midSize[1] - atm.midSize[0]),
        duration:
          atm.midDuration[0] +
          Math.random() * (atm.midDuration[1] - atm.midDuration[0]),
        delay: Math.random() * 6,
        opacity: 0.03 + Math.random() * 0.06,
      })),
    );
  }, [module, atm.midCount, atm.midSize, atm.midDuration]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Background light — fades with depth */}
      {atm.lightGradient !== "none" && (
        <div
          className="absolute inset-0"
          style={{ background: atm.lightGradient }}
        />
      )}

      {/* Layer 1: Far plankton — CSS animation, very subtle */}
      {FAR_PLANKTON.map((p) => (
        <div
          key={`far-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(200, 230, 255, ${p.opacity})`,
            animation: `float-drift ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Layer 2: Mid-range particles — Framer Motion, slow drift upward */}
      {midParticles.map((p) => (
        <motion.div
          key={`mid-${module}-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: atm.midColor.replace("VAR", String(p.opacity)),
            boxShadow:
              atm.midGlow !== "none"
                ? atm.midGlow.replace("GVAR", String(p.opacity * 0.5))
                : "none",
          }}
          initial={{ y: `${p.startY}vh`, opacity: 0, scale: 0.5 }}
          animate={{
            y: ["-5vh"],
            opacity: [0, p.opacity * 4, p.opacity * 2, 0],
            scale: [0.5, 1, 0.7],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Layer 3: Rare bioluminescence pulse — Module C only */}
      {atm.hasBioluminescence && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "25%",
              top: "40%",
              width: 80,
              height: 80,
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
            }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{
              duration: 8,
              delay: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              left: "70%",
              top: "65%",
              width: 60,
              height: 60,
              background:
                "radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)",
            }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.6, 1.1, 0.6] }}
            transition={{
              duration: 10,
              delay: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// Chapter Transition Overlay (for IPIP chapters within Module C)
// User-dismissed: shows completion badge, encouraging line, and Continue button
// ============================================================

function ChapterTransition({
  chapterId,
  language,
  onContinue,
  onReconsider,
  reconsiderLabel,
  overallProgress,
  currentDepthM,
}: {
  chapterId: number;
  language: "en" | "zh";
  onContinue: () => void;
  /** Optional secondary action: return to the last answered question to revise it. */
  onReconsider?: () => void;
  /** Localized label for the reconsider link. */
  reconsiderLabel?: string;
  /** Overall visual progress (0-100) for the depth progress bar */
  overallProgress?: number;
  /** Current depth in meters for the progress bar label */
  currentDepthM?: number;
}) {
  const t = getDictionaryClient(language).questionnaireShell;
  const nextChapter = IPIP_CHAPTERS.find((c) => c.id === chapterId + 1);
  // Fallback to completed chapter data if next doesn't exist
  const displayChapter =
    nextChapter || IPIP_CHAPTERS.find((c) => c.id === chapterId);
  if (!displayChapter) return null;

  // Per-chapter encouraging lines (entering chapter chapterId+1)
  const encourageLineKey =
    `chapterTransitionLine${chapterId + 1}` as keyof typeof t;
  const encouragingLine = (t[encourageLineKey] as string) || "";

  // Completion badge label via interpolation
  const completedBadge = interpolate(t.chapterCompletedBadge, {
    chapter: chapterId,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.60)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Vertical depth progress bar — right side */}
      {overallProgress !== undefined && (
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <div
            className="relative flex-none"
            style={{
              width: "1px",
              height: "140px",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            {/* Filled portion */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${Math.min(overallProgress, 100)}%`,
                background:
                  "linear-gradient(180deg, rgba(14,165,233,0.55) 0%, rgba(14,165,233,0.18) 100%)",
              }}
            />
            {/* Glowing position dot */}
            <motion.div
              style={{
                position: "absolute",
                left: "50%",
                top: `${Math.min(overallProgress, 100)}%`,
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "rgb(14, 165, 233)",
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                boxShadow: [
                  "0 0 6px rgba(14,165,233,0.8)",
                  "0 0 14px rgba(14,165,233,0.4)",
                  "0 0 6px rgba(14,165,233,0.8)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          {currentDepthM !== undefined && (
            <span className="text-[9px] font-mono text-white/60 whitespace-nowrap">
              {currentDepthM}m
            </span>
          )}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="text-center max-w-sm lg:max-w-md mx-auto px-6"
      >
        {/* Completed chapter badge with pulsing halo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-pulse-halo"
          style={{
            background: "rgba(14,165,233,0.12)",
            border: "1px solid rgba(14,165,233,0.25)",
          }}
        >
          <span className="text-xs text-sky-300/80 tracking-wide">
            {completedBadge}
          </span>
        </motion.div>

        {/* Next chapter label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="block text-xs text-sky-300/60 tracking-wider uppercase"
        >
          {interpolate(t.chapterN, { n: chapterId + 1 })}
        </motion.span>

        {/* Next chapter title */}
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl lg:text-2xl font-light text-white mt-2"
        >
          {getLocalizedField(displayChapter, "title", language as Locale)}
        </motion.h3>

        {/* Duration estimate */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-white/60 mt-1"
        >
          {interpolate(t.chapterDuration, { minutes: displayChapter.minutes })}
        </motion.p>

        {/* Encouraging line */}
        {encouragingLine && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-white/65 mt-3 italic"
          >
            {encouragingLine}
          </motion.p>
        )}

        {/* Ambient glow divider */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="h-px mx-auto mt-5 mb-5"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(14,165,233,0.30), transparent)",
            maxWidth: "160px",
          }}
        />

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          onClick={onContinue}
          className="min-h-[44px] px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 border border-sky-400/25 active:scale-[0.97]"
        >
          {t.chapterTransitionContinue}
        </motion.button>
        {onReconsider && reconsiderLabel && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            onClick={onReconsider}
            className="block mx-auto mt-3 min-h-[36px] px-3 py-1 text-xs text-white/55 hover:text-white/85 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/40 rounded transition-colors"
          >
            {reconsiderLabel}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Progress bar color interpolation (sky-blue → gold at the end)
// ============================================================

function _getProgressBarColor(remaining: number): string {
  if (remaining > 10) return "rgba(0, 175, 215, 0.55)";
  // Interpolate from sky-blue to warm gold as remaining goes from 10 → 0
  const t = (10 - remaining) / 10;
  const r = Math.round(0 + (245 - 0) * t);
  const g = Math.round(175 + (200 - 175) * t);
  const b = Math.round(215 + (100 - 215) * t);
  const a = 0.55 + t * 0.15; // slightly brighter at end
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ============================================================
// Domain completion badges (Module C) — N · E · O · A · C
// ============================================================

function _DomainBadges({
  answers,
  language,
}: {
  answers: Array<{
    moduleCode: string;
    itemId: number;
    value: { type: string };
  }>;
  language: "en" | "zh";
}) {
  const domainLabels = ["N", "E", "O", "A", "C"];
  const domainLabelsOrder = ["N", "E", "O", "A", "C"];
  const domainCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const a of answers) {
      if (a.moduleCode === "C" && a.value.type === "ipip") {
        const domain = IPIP_60_ITEM_DOMAIN_MAP[a.itemId];
        if (domain) {
          const idx = domainLabelsOrder.indexOf(domain);
          if (idx >= 0) counts[idx]++;
        }
      }
    }
    return counts;
  }, [answers]);

  const allComplete = domainCounts.every((count) => count >= 6);
  const [showFlourish, setShowFlourish] = useState(false);
  const prevAllCompleteRef = useRef(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (allComplete && !prevAllCompleteRef.current) {
      prevAllCompleteRef.current = true;
      if (!reduced) {
        setShowFlourish(true);
        const timer = setTimeout(() => setShowFlourish(false), 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [allComplete, reduced]);

  return (
    <div
      className="flex items-center justify-center gap-1 mt-1.5"
      aria-label={
        getDictionaryClient(language as Locale).questionnaireShell
          .personalityDomainProgress
      }
    >
      {domainLabels.map((label, idx) => {
        const complete = domainCounts[idx] >= 6;
        return (
          <motion.div
            key={label}
            className="flex items-center justify-center rounded-full font-mono"
            style={{
              width: "18px",
              height: "18px",
              fontSize: "9px",
              border: complete
                ? "1px solid rgba(14,165,233,0.4)"
                : "1px solid rgba(255,255,255,0.15)",
              background: complete ? "rgba(14,165,233,0.15)" : "transparent",
              color: complete
                ? "rgba(14,165,233,0.9)"
                : "rgba(255,255,255,0.2)",
              transition: "all 0.5s ease",
            }}
            animate={
              showFlourish
                ? {
                    boxShadow: [
                      "0 0 0px rgba(14,165,233,0)",
                      "0 0 10px rgba(14,165,233,0.7)",
                      "0 0 0px rgba(14,165,233,0)",
                    ],
                  }
                : { boxShadow: "0 0 0px rgba(14,165,233,0)" }
            }
            transition={
              showFlourish
                ? { duration: 1.5, delay: idx * 0.08, ease: "easeInOut" }
                : {}
            }
          >
            {label}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// Chapter Mini Progress Bar (Module C only)
// Thin bar showing progress within the 60-item Module C (IPIP-60)
// ============================================================

function ChapterMiniProgressBar({
  itemId,
  language,
  reduced,
}: {
  itemId: number;
  language: "en" | "zh";
  reduced: boolean;
}) {
  // v3.0: simple progress within 60-item Module C
  // Find the position of this item in the presentation order
  const position = IPIP_60_PRESENTATION_ORDER.indexOf(itemId);
  const progressPct =
    position >= 0
      ? ((position + 1) / IPIP_60_PRESENTATION_ORDER.length) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.3 }}
      className="mt-1.5 px-0.5"
      aria-label={
        getDictionaryClient(language as Locale).questionnaireShell
          .personalitySnapshotProgress
      }
    >
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-px rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          {reduced ? (
            <div
              className="h-full rounded-full"
              style={{
                background: "rgba(125,211,252,0.38)",
                width: `${progressPct}%`,
              }}
            />
          ) : (
            <motion.div
              className="h-full rounded-full"
              style={{ background: "rgba(125,211,252,0.38)" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </div>
        <span className="text-[9px] text-white/60 font-mono whitespace-nowrap tabular-nums">
          {position >= 0 ? position + 1 : 0}/{IPIP_60_PRESENTATION_ORDER.length}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================
// Animated Depth Counter — smooth odometer-style number transition
// ============================================================

function AnimatedDepthCounter({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;
    prevValueRef.current = value;

    if (from === to) return;

    const duration = 300; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span
      className="text-[10px] font-mono mt-1.5 whitespace-nowrap"
      style={{ color }}
    >
      {displayValue}m
    </span>
  );
}

// ============================================================
// BreathingMoment — subtle encouraging text overlay (Module C)
// Appears every 8 IPIP items (excluding chapter boundaries)
// ============================================================

const BREATHING_MOMENT_TOTAL = 8;

function getBreathingMomentIndex(itemId: number): number {
  // v3.0: simple rotation through breathing messages
  const position = IPIP_60_PRESENTATION_ORDER.indexOf(itemId);
  return position >= 0 ? Math.floor(position / 10) % BREATHING_MOMENT_TOTAL : 0;
}

function _BreathingMoment({
  visible,
  itemId,
  language,
}: {
  visible: boolean;
  itemId: number;
  language: "en" | "zh";
}) {
  const t = getDictionaryClient(language).breathingMoments;
  const msgIndex = getBreathingMomentIndex(itemId);
  const message = t[`message${msgIndex}`] || t["message0"];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-x-0 pointer-events-none z-10 flex items-center justify-center px-8"
          style={{ top: "58%", transform: "translateY(-50%)" }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-white/60 text-center tracking-wide italic">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// QuestionnaireShell v2.0
// ============================================================

export function QuestionnaireShell({
  archetypeCode,
  quickDiveData,
  resolvedModules,
}: {
  archetypeCode?: string | null;
  quickDiveData?: {
    riasecNormalized: Record<string, number>;
  } | null;
  resolvedModules?: ResolvedModules;
}) {
  const flow = useQuestionnaireFlow();

  const submission = useAssessmentSubmission(
    flow.session?.id,
    flow.language,
    flow.urlLocale,
    quickDiveData,
  );

  const {
    session,
    questionInfo,
    language: _language,
    currentValue,
    showModuleTransition,
    showChapterTransition,
    showMicroInsight,
    microInsightType,
    isAutoAdvancing,
    saveStatus,
    hasAnswer,
    visualProgress,
    moduleProgress,
    currentModule,
    estimatedTimeRemaining,
    isFirstQuestion,
    isLastQuestion,
    urlLocale,
    handleAnswerChange,
    handleNext,
    handlePrevious,
    handleMicroInsightContinue,
    handleModuleTransitionContinue,
    handleChapterTransitionContinue,
    handleReconsider,
    allowNavigation,
    buildScoringInput,
    wasRestored,
  } = flow;
  const language = (_language || "en") as "en" | "zh";
  const reconsiderLabel = getDictionaryClient(language).questionnaireShell
    .reconsiderLastAnswer as string | undefined;

  const router = useRouter();

  // Active modules list
  const activeModules = useMemo(() => getModuleList(), []);
  const activeTotalQuestions = useMemo(() => getTotalQuestions(), []);

  // Completion ceremony state
  const [showCompletionCeremony, setShowCompletionCeremony] = useState(false);
  const [ceremonyScoringInput, setCeremonyScoringInput] =
    useState<ReturnType<typeof flow.buildScoringInput>>(null);

  // Cross-tab conflict detection
  const tabConflict = useQuestionnaireStore((s) => s.tabConflict);
  const dismissTabConflict = useQuestionnaireStore((s) => s.dismissTabConflict);

  // Save & Exit state
  const [showSaveExitConfirm, setShowSaveExitConfirm] = useState(false);

  // Welcome Back overlay state (shown once when a session is restored with existing answers)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const welcomeBackShownRef = useRef(false);

  useEffect(() => {
    if (wasRestored && !welcomeBackShownRef.current) {
      welcomeBackShownRef.current = true;
      setShowWelcomeBack(true);
    }
  }, [wasRestored]);

  // Auto-dismiss Welcome Back after 5 seconds
  useEffect(() => {
    if (!showWelcomeBack) return;
    const timer = setTimeout(() => setShowWelcomeBack(false), 5000);
    return () => clearTimeout(timer);
  }, [showWelcomeBack]);

  // Set analytics context on mount
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  // Track deepdive_started when user submits their first answer (not on page load)
  const hasTrackedDeepdiveStart = useRef(false);
  useEffect(() => {
    if (hasTrackedDeepdiveStart.current) return;
    if (!session || session.answers.length === 0) return;
    hasTrackedDeepdiveStart.current = true;
    analytics
      .track("deepdive_started", {
        sessionId: session.id,
        language: urlLocale,
        inheritedRIASEC: !!quickDiveData?.riasecNormalized,
      })
      .catch(() => {});
  }, [
    session?.id,
    session?.answers.length,
    urlLocale,
    quickDiveData?.riasecNormalized,
  ]);

  // Track Deep Dive abandonment when user leaves mid-questionnaire
  // NOTE: /api/analytics/event is CSRF exempt — sendBeacon cannot carry headers
  useEffect(() => {
    // Only track when actively answering (session exists, not completed, has ≥1 answer)
    if (!session || session.completedAt) return;
    if (session.answers.length === 0) return;

    const sendAbandon = () => {
      const today = new Date().toISOString().slice(0, 10);
      sendAnalyticsSafely("/api/analytics/event", {
        event: "deepdive_abandoned",
        clientId: getClientId(),
        idempotencyKey: `dd_abandon:${session.id}:${today}`,
        metadata: {
          sessionId: session.id,
          currentModule,
          questionIndex: questionInfo?.index,
          lastQuestionId: questionInfo
            ? String(questionInfo.itemId)
            : undefined,
          questionsAnswered: session.answers.length,
          totalQuestions: activeTotalQuestions,
          completionRate: Math.round(
            ((session.currentQuestionIndex + 1) / activeTotalQuestions) * 100,
          ),
          timeSpentMs: session.startedAt
            ? Date.now() - session.startedAt
            : undefined,
          locale: urlLocale,
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendAbandon();
    };

    window.addEventListener("beforeunload", sendAbandon);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", sendAbandon);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    session?.id,
    session?.answers.length,
    session?.completedAt,
    currentModule,
    activeTotalQuestions,
    urlLocale,
  ]);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  // Deep Dive Intro gate
  const [hasPassedIntro, setHasPassedIntro] = useState(false);

  // Resolve bilingual archetype name from code (for DeepDiveIntro personalization)
  const introArchetypeName = useMemo(() => {
    if (!archetypeCode) return null;
    const archetype = ARCHETYPES[archetypeCode];
    if (!archetype) return null;
    return { en: archetype.label_en, zh: archetype.label_zh };
  }, [archetypeCode]);

  // Save & Exit: flush pending save immediately, then navigate to dashboard
  const handleSaveAndExit = useCallback(() => {
    // Flush debounced save and do an immediate API save
    clearApiSaveTimer();
    const currentSession = useQuestionnaireStore.getState().session;
    if (currentSession && !currentSession.completedAt) {
      immediateApiSave(currentSession);
    }
    allowNavigation();
    setShowSaveExitConfirm(true);
    setTimeout(() => {
      router.push(`/${urlLocale}/dashboard`);
    }, 1200);
  }, [allowNavigation, router, urlLocale]);

  // Show Deep Dive Intro for fresh sessions
  if (
    session &&
    session.currentQuestionIndex === 0 &&
    session.answers.length === 0 &&
    !hasPassedIntro
  ) {
    return (
      <DeepDiveIntro
        locale={language}
        onBegin={() => setHasPassedIntro(true)}
        archetypeName={introArchetypeName ?? undefined}
        resolvedModules={resolvedModules}
      />
    );
  }

  const currentMod = currentModule();
  const currentModuleInfo =
    activeModules.find((m) => m.module === currentMod) || activeModules[0];
  const currentDepthColors =
    MODULE_DEPTH_COLORS[currentMod] || MODULE_DEPTH_COLORS.A;
  const t = getDictionaryClient(language).questionnaireShell;

  // Wrap handleNext to route "complete" signal to the submission hook
  const onNext = () => {
    const result = handleNext();
    if (result === "complete") {
      const scoringInput = buildScoringInput();
      if (scoringInput) {
        // Track deepdive_completed immediately when last answer is submitted
        if (session) {
          analytics
            .track("deepdive_completed", {
              sessionId: session.id,
              language: urlLocale,
            })
            .catch(() => {});
        }
        // Show completion ceremony before beginning submission pipeline
        setCeremonyScoringInput(scoringInput);
        setShowCompletionCeremony(true);
      }
    }
  };

  // Compute ceremony stats from session answers
  const getCeremonyStats = () => {
    if (!session) return undefined;

    // Compute top Module C domain insight (branded labels, not Big Five names)
    const DOMAIN_LABELS: Record<string, { en: string; zh: string }> = {
      N: { en: "Emotional Depth", zh: "情感深度" },
      E: { en: "Social Energy", zh: "社交能量" },
      O: { en: "Creative Openness", zh: "创意开放" },
      A: { en: "Empathic Connection", zh: "共情连接" },
      C: { en: "Strategic Focus", zh: "策略专注" },
    };
    const domainOrder = ["N", "E", "O", "A", "C"];
    const domainAgreeCount = [0, 0, 0, 0, 0];
    for (const a of session.answers) {
      if (
        a.moduleCode === "C" &&
        a.value.type === "ipip" &&
        a.value.rating >= 4
      ) {
        const domain = IPIP_60_ITEM_DOMAIN_MAP[a.itemId];
        if (domain) {
          const domainIdx = domainOrder.indexOf(domain);
          if (domainIdx >= 0) domainAgreeCount[domainIdx]++;
        }
      }
    }
    let topDomainIdx = 0;
    let topCount = domainAgreeCount[0];
    for (let i = 1; i < 5; i++) {
      if (domainAgreeCount[i] > topCount) {
        topCount = domainAgreeCount[i];
        topDomainIdx = i;
      }
    }
    const topInsight =
      topCount > 0 ? DOMAIN_LABELS[domainOrder[topDomainIdx]] : undefined;

    return {
      archetypeName: introArchetypeName ?? undefined,
      topModuleCInsight: topInsight,
    };
  };

  // Handle ceremony completion — proceed to submission pipeline
  const handleCeremonyComplete = () => {
    setShowCompletionCeremony(false);
    if (ceremonyScoringInput) {
      submission.beginSubmission(ceremonyScoringInput);
    }
  };

  // Show Completion Ceremony overlay
  if (showCompletionCeremony) {
    return (
      <CompletionCeremony
        locale={language as "zh" | "en"}
        onComplete={handleCeremonyComplete}
        stats={getCeremonyStats()}
      />
    );
  }

  // Show recoverable completion processing state. The completion POST is
  // idempotent and auto-retried by useAssessmentSubmission, so avoid presenting
  // this as a terminal failure.
  if (submission.pipelineError) {
    const tReview = getDictionaryClient(language).questionnaireReviewPage;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {tReview.pipelineRecoveryTitle ?? tReview.pipelineErrorTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tReview.pipelineRecoveryMessage ?? tReview.pipelineErrorMessage}
            </p>
            {submission.recoveryAttempt > 0 && (
              <p className="text-xs text-muted-foreground">
                {interpolate(
                  tReview.pipelineRecoveryRetrying ??
                    "Still working — retry {{attempt}} is in progress.",
                  { attempt: submission.recoveryAttempt },
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={submission.retrySubmission}
              disabled={submission.isSubmitting}
              className="w-full"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              {tReview.pipelineRetry}
            </Button>
            <Button
              variant="ghost"
              onClick={submission.dismissError}
              className="w-full"
            >
              {tReview.pipelineRecoveryLeave ?? tReview.pipelineContinue}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show scoring transition (prevents flash between scoring → resume upload)
  if (submission.showScoringTransition) {
    const tReview = getDictionaryClient(language).questionnaireReviewPage;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {tReview.analyzingResponses}
          </p>
        </motion.div>
      </div>
    );
  }

  // Show Profile Reveal ceremony (gamified wait while LLM narratives generate)
  if (submission.showPreparingProfile && submission.profileRevealData) {
    return (
      <ProfileRevealCeremony
        locale={language as "en" | "zh"}
        profileData={submission.profileRevealData}
        narrativeReady={submission.narrativeReady}
        onNavigate={() => {
          allowNavigation(); // bypass beforeunload guard before full-page nav
          submission.navigateToProfile();
        }}
      />
    );
  }

  // Fallback: preparing profile but no reveal data yet (shouldn't happen)
  if (submission.showPreparingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !questionInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#041E2B]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Compute module-level progress
  const { current: modCurrent, total: modTotal } = moduleProgress();
  const modProgressPct = (modCurrent / modTotal) * 100;
  const interpolatedDepth = getInterpolatedDepth(currentMod, modProgressPct);
  const vProgress = visualProgress();
  const remaining = activeTotalQuestions - session.currentQuestionIndex - 1;

  // For IPIP chapter display
  const _currentChapter = questionInfo.chapter;

  // Module index for stepper
  const currentModIdx = activeModules.findIndex((m) => m.module === currentMod);
  const currentModuleLabel = getLocalizedField(
    currentModuleInfo,
    "name",
    language as Locale,
  );
  const currentDepthLabel = getLocalizedField(
    currentDepthColors,
    "label",
    language as Locale,
  );
  const depthActiveIndex = Math.min(
    DEPTH_STATION_DEPTHS.length - 1,
    Math.max(
      0,
      Math.round((vProgress / 100) * (DEPTH_STATION_DEPTHS.length - 1)),
    ),
  );
  const depthStations: DepthStation[] = DEPTH_STATION_DEPTHS.map(
    (depth, index) => ({
      depth: `${depth}m`,
      label:
        index === depthActiveIndex
          ? currentDepthLabel
          : interpolate(t.phaseLabel, { phase: index + 1 }),
    }),
  );
  const deepDiveTitle = getDictionaryClient(language).deepDiveIntro.title;
  const phaseLabel = interpolate(t.phaseLabel, { phase: currentMod });

  return (
    <div
      className="dd-questionnaire-shell min-h-dvh transition-colors duration-1000 relative overflow-hidden"
      data-testid="deepdive-meridian-shell"
      data-module={currentMod}
    >
      <PageArtLayer route="deepdive" />
      <div className="dd-questionnaire-lightfield" aria-hidden="true" />

      <AmbientParticles module={currentMod} />

      {/* Module Transition Overlay (A→B, B→C) */}
      <AnimatePresence>
        {showModuleTransition &&
          (() => {
            const nextModInfo = activeModules[currentModIdx + 1];
            const nextDepthColors = nextModInfo
              ? MODULE_DEPTH_COLORS[nextModInfo.module as ModuleCode]
              : currentDepthColors;
            const isBtoCTransition = nextModInfo?.module === "C";

            return (
              <ModuleTransition
                moduleName={
                  nextModInfo
                    ? getLocalizedField(nextModInfo, "name", language as Locale)
                    : getLocalizedField(
                        currentModuleInfo,
                        "name",
                        language as Locale,
                      )
                }
                depth={nextDepthColors?.depth || currentDepthColors.depth}
                previousDepth={currentDepthColors.depth}
                label={
                  getLocalizedField(
                    nextDepthColors,
                    "label",
                    language as Locale,
                  ) ||
                  getLocalizedField(
                    currentDepthColors,
                    "label",
                    language as Locale,
                  )
                }
                language={language}
                completedPhaseStats={{
                  phaseName: getLocalizedField(
                    currentModuleInfo,
                    "name",
                    language as Locale,
                  ),
                  questionsAnswered: currentModuleInfo.questionCount,
                  totalQuestions: currentModuleInfo.questionCount,
                }}
                fromBg={currentDepthColors.bg}
                toBg={nextDepthColors?.bg || currentDepthColors.bg}
                isBtoCTransition={isBtoCTransition}
                onContinue={handleModuleTransitionContinue}
                onReconsider={handleReconsider}
                reconsiderLabel={reconsiderLabel}
                completedZone={currentModuleInfo.module as "A" | "B" | "C"}
                answers={session.answers}
              />
            );
          })()}
      </AnimatePresence>

      {/* Chapter Transition Overlay (within IPIP) — user-dismissed */}
      <AnimatePresence>
        {showChapterTransition && (
          <ChapterTransition
            chapterId={1}
            language={language}
            onContinue={handleChapterTransitionContinue}
            onReconsider={handleReconsider}
            reconsiderLabel={reconsiderLabel}
            overallProgress={vProgress}
            currentDepthM={interpolatedDepth}
          />
        )}
      </AnimatePresence>

      {/* MicroInsight Overlay */}
      <AnimatePresence>
        {showMicroInsight && microInsightType && (
          <MicroFeedback
            triggerType={microInsightType}
            answers={session.answers}
            language={language}
            onContinue={handleMicroInsightContinue}
            onReconsider={handleReconsider}
            reconsiderLabel={reconsiderLabel}
          />
        )}
      </AnimatePresence>

      {/* Save & Exit Toast (top-center) */}
      <AnimatePresence>
        {showSaveExitConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="fixed top-5 left-1/2 z-50 -translate-x-1/2 px-4 py-2 rounded-full text-xs text-sky-300/90 border border-sky-400/25"
            style={{
              background: "rgba(14,165,233,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            {t.saveAndExitConfirm}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross-Tab Conflict Warning */}
      <AnimatePresence>
        {tabConflict && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="fixed top-5 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl text-sm border border-amber-400/30"
            style={{
              background: "rgba(245,158,11,0.12)",
              backdropFilter: "blur(8px)",
            }}
            data-testid="cross-tab-warning"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-amber-200/90">
                {getDictionaryClient(language).crossTabWarning?.message ??
                  "This questionnaire is active in another tab."}
              </p>
              <p className="text-amber-300/60 text-xs">
                {getDictionaryClient(language).crossTabWarning?.action ??
                  "Close the other tab, then continue here."}
              </p>
            </div>
            <button
              onClick={dismissTabConflict}
              className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/15 transition-colors"
            >
              {getDictionaryClient(language).crossTabWarning?.dismiss ??
                "Got it"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Back Overlay (session restore with existing answers) */}
      <AnimatePresence>
        {showWelcomeBack &&
          session &&
          (() => {
            const tShell = getDictionaryClient(language).questionnaireShell;
            const mod = currentModule();
            const modInfo =
              activeModules.find((m) => m.module === mod) || activeModules[0];
            const progressPct = Math.round(
              ((session.currentQuestionIndex + 1) / activeTotalQuestions) * 100,
            );
            return (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center px-6"
                style={{
                  background: "rgba(4, 30, 43, 0.88)",
                  backdropFilter: "blur(10px)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <motion.div
                  className="flex flex-col items-center gap-4 max-w-sm w-full text-center"
                  initial={{ scale: 0.94, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                >
                  <h2 className="text-2xl font-semibold text-white/90">
                    {tShell.welcomeBack}
                  </h2>
                  <p className="text-sm text-white/75">
                    {interpolate(tShell.welcomeBackProgress, {
                      count: session.answers.length,
                      total: activeTotalQuestions,
                    })}
                  </p>
                  {/* Mini progress bar */}
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "rgba(14,165,233,0.70)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/60">
                    {getLocalizedField(modInfo, "name", language as Locale)}
                  </p>
                  <button
                    onClick={() => setShowWelcomeBack(false)}
                    className="mt-2 min-h-[44px] px-8 py-2.5 rounded-xl text-sm font-medium bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 border border-sky-400/25 active:scale-[0.97] transition-all"
                  >
                    {tShell.welcomeBackContinue}
                  </button>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* Main Content */}
      <div className="dd-questionnaire-frame relative z-10">
        <ExpeditionRail
          surface="dive"
          kicker={phaseLabel}
          title={deepDiveTitle}
          intro={currentModuleLabel}
          signatureName={currentDepthLabel}
          sections={[
            { id: "questionnaire-current", label: currentModuleLabel },
          ]}
          depthStations={depthStations}
          depthActiveIndex={depthActiveIndex}
          className="dd-questionnaire-rail"
        />

        <main id="questionnaire-current" className="dd-questionnaire-main">
          <div className="dd-questionnaire-topbar">
            <BackToExplore
              locale={language}
              confirmBeforeLeave
              textTheme="light"
            />
            <button
              onClick={handleSaveAndExit}
              className="dd-questionnaire-save"
            >
              <Bookmark size={14} aria-hidden="true" />
              {t.saveAndExit}
            </button>
          </div>

          <div className="dd-questionnaire-stage">
            <section
              className="dd-questionnaire-card md-panel"
              aria-labelledby="deepdive-current-module"
            >
              <header className="dd-questionnaire-card-head">
                <div className="dd-questionnaire-card-title-block">
                  <p className="dd-questionnaire-kicker">{phaseLabel}</p>
                  <h2
                    id="deepdive-current-module"
                    className="dd-questionnaire-title"
                  >
                    {currentModuleLabel}
                  </h2>
                </div>
                <div className="dd-questionnaire-depth-pill">
                  <span>{currentDepthLabel}</span>
                  <strong>
                    <AnimatedDepthCounter
                      value={interpolatedDepth}
                      color="currentColor"
                    />
                  </strong>
                </div>
              </header>

              <div
                className="dd-questionnaire-mobile-progress"
                style={{ "--progress": `${vProgress}%` } as React.CSSProperties}
              >
                <div className="dd-questionnaire-progress-line">
                  <motion.span
                    className="dd-questionnaire-progress-dot"
                    animate={{ left: `${vProgress}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.span
                    className="dd-questionnaire-progress-scan"
                    style={{ left: `${vProgress}%` }}
                    animate={{
                      scaleX: [0, 1, 0.3, 0],
                      opacity: [0, 0.72, 0.36, 0],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      repeatDelay: 2.1,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>

              <div className="dd-questionnaire-map">
                <ExplorationMap
                  currentModule={currentMod}
                  moduleProgress={moduleProgress()}
                  currentDepthMeters={interpolatedDepth}
                  language={language}
                  answers={session.answers}
                  triggeredInsights={session.triggeredBonusInsights}
                  reduced={reducedMotion}
                />
              </div>

              <AnimatePresence>
                {currentMod === "C" &&
                  !showChapterTransition &&
                  !showMicroInsight && (
                    <ChapterMiniProgressBar
                      key="chapter-mini-bar"
                      itemId={questionInfo.itemId}
                      language={language}
                      reduced={reducedMotion}
                    />
                  )}
              </AnimatePresence>

              <div className="dd-questionnaire-meta">
                <div className="dd-questionnaire-meta-left">
                  <span>{currentModuleLabel}</span>
                  <span>
                    {interpolate(t.moduleLabel, {
                      current: currentMod,
                      total: activeModules.length,
                    })}
                  </span>
                </div>
                <div className="dd-questionnaire-meta-right">
                  <span data-testid="deepdive-question-counter">
                    {session.currentQuestionIndex + 1}/{activeTotalQuestions}
                  </span>
                  <span className="dd-questionnaire-meta-dot" />
                  <span>
                    {interpolate(t.timeRemaining, {
                      minutes: estimatedTimeRemaining(),
                    })}
                  </span>
                  {saveStatus === "saving" && <span>{t.saving}</span>}
                  {saveStatus === "saved" && (
                    <span className="dd-questionnaire-save-status">
                      &#10003;
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="dd-questionnaire-save-error">
                      {t.saveFailed}
                    </span>
                  )}
                </div>
              </div>

              <div className="dd-questionnaire-countdown">
                {(() => {
                  if (remaining === 0) {
                    return <p className="is-final">{t.finalItem}</p>;
                  }
                  if (remaining <= 5) {
                    return (
                      <motion.p
                        className="is-urgent"
                        animate={{ opacity: [0.72, 1, 0.72] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {interpolate(t.itemsLeft, { count: remaining })}
                      </motion.p>
                    );
                  }
                  if (remaining <= 10) {
                    return (
                      <p className="is-warm">
                        {interpolate(t.itemsLeft, { count: remaining })}
                      </p>
                    );
                  }
                  if (remaining <= 20) {
                    return (
                      <p className="is-cool">
                        {interpolate(t.itemsLeft, { count: remaining })}
                      </p>
                    );
                  }
                  return <p>{interpolate(t.remaining, { remaining })}</p>;
                })()}
              </div>

              <div className="dd-questionnaire-question">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${questionInfo.module}-${questionInfo.itemId}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Faster exit than enter shrinks the "wait" gap between
                    // questions so rapid auto-advance feels less stuttery.
                    exit={{
                      opacity: 0,
                      y: -8,
                      transition: { duration: 0.12, ease: "easeIn" },
                    }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <QuestionRenderer
                      questionInfo={questionInfo}
                      value={currentValue}
                      onChange={handleAnswerChange}
                      language={language}
                      textTheme="light"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <footer className="dd-questionnaire-actions">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstQuestion()}
                  className="dd-questionnaire-button dd-questionnaire-button--secondary disabled:opacity-40"
                >
                  {t.back}
                </button>

                <div className="dd-questionnaire-next-wrap">
                  <button
                    onClick={onNext}
                    disabled={!hasAnswer}
                    className={[
                      "dd-questionnaire-button",
                      "dd-questionnaire-button--primary",
                      "disabled:opacity-40",
                      hasAnswer ? "is-ready" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isLastQuestion() ? t.completeDeepDive : t.next}
                  </button>
                  {isAutoAdvancing && (
                    <motion.div
                      className="dd-questionnaire-auto-advance"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTO_ADVANCE_DELAY_MS / 1000,
                        ease: "linear",
                      }}
                    />
                  )}
                </div>
              </footer>
            </section>

            <aside className="dd-questionnaire-aside">
              <DepthGauge
                stations={depthStations}
                activeIndex={depthActiveIndex}
              />
              <div className="dd-questionnaire-focus md-panel">
                <p>{currentDepthLabel}</p>
                <strong>{interpolatedDepth}m</strong>
                <span />
                <small>{interpolate(t.remaining, { remaining })}</small>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
