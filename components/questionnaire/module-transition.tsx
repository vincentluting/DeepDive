"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { hapticDepthDescent } from "@/lib/haptic";
import { getZoneForModule } from "@/lib/questionnaire/constants";
import type { Locale } from "@/lib/i18n/config";
import type { AnswerValue } from "@/lib/types";
import { DDVQ21_VALUE_MAP } from "@/lib/scoring/score-ddvq21";

interface ModuleTransitionProps {
  moduleName: string;
  depth: string;
  /** Previous phase depth (e.g. "5m") for the animated descent reading */
  previousDepth?: string;
  label: string;
  /** Stats for the completed phase */
  completedPhaseStats?: {
    phaseName: string;
    questionsAnswered: number;
    totalQuestions: number;
  };
  /** The next phase name (preview) */
  nextPhaseName?: string;
  language?: "en" | "zh";
  /** 2-B5: Phase background colors for gradient transition */
  fromBg?: string;
  toBg?: string;
  /** Prompt 8: Autonomy Micro-Dose — show pace selector during B→C transition */
  isBtoCTransition?: boolean;
  /** User-triggered continue callback */
  onContinue?: () => void;
  /** Optional secondary action: return to the last answered question to revise it. */
  onReconsider?: () => void;
  /** Localized label for the reconsider link (passed by shell to avoid extra namespace coupling). */
  reconsiderLabel?: string;
  /** Which zone just completed: 'A' | 'B' | 'C' — for ocean-zone theming */
  completedZone?: "A" | "B" | "C";
  /** Answers so far — used for SJT tension count micro-insight */
  answers?: Array<{
    moduleCode: string;
    value: AnswerValue;
  }>;
}

export function ModuleTransition({
  moduleName,
  depth,
  previousDepth,
  label,
  completedPhaseStats,
  nextPhaseName,
  language = "zh",
  fromBg,
  toBg,
  isBtoCTransition: _isBtoCTransition = false,
  onContinue,
  onReconsider,
  reconsiderLabel,
  completedZone,
  answers,
}: ModuleTransitionProps) {
  const mt = getDictionaryClient(language as Locale).moduleTransition;

  // 2-B5 + 2-B11: Haptic on mount
  useEffect(() => {
    hapticDepthDescent();
  }, []);

  // Show continue button after a short delay to let the visual settle
  const [showContinue, setShowContinue] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowContinue(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Compute SJT tension count for Zone A micro-insight
  const sjtTensionCount =
    completedZone === "A" && answers
      ? answers
          .filter((a) => a.moduleCode === "A" && a.value.type === "sjt")
          .filter(
            (a) =>
              a.value.type === "sjt" &&
              a.value.wouldChoice !== a.value.shouldChoice,
          ).length
      : 0;

  // Zone-specific completion title, insight, and next-zone teaser
  const zoneContent = completedZone
    ? getZoneContent(completedZone, mt, sjtTensionCount, answers, language)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background:
          fromBg && toBg
            ? `linear-gradient(180deg, ${fromBg}CC 0%, ${toBg}EE 65%, ${toBg} 100%)`
            : "rgba(0,0,0,0.70)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Descent ritual — cinematic ambient layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-sky-500/[0.06] blur-[100px]" />

        {/* Bioluminescence flash — brief, cinematic */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full blur-[140px]"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.20) 0%, transparent 65%)",
          }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.3, 1.3, 1.6] }}
          transition={{ duration: 1.8, ease: "easeOut", times: [0, 0.25, 1] }}
        />

        {/* Sonar pulse ring — expanding circle */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ border: "1px solid rgba(14,165,233,0.15)" }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ border: "1px solid rgba(14,165,233,0.10)" }}
          initial={{ width: 0, height: 0, opacity: 0.4 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.8 }}
        />

        {/* Drifting particles during transition */}
        {[15, 35, 55, 75, 90].map((x, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/[0.04]"
            style={{ left: `${x}%`, width: 2, height: 2 }}
            initial={{ top: "110%", opacity: 0 }}
            animate={{ top: "-5%", opacity: [0, 0.3, 0] }}
            transition={{ duration: 4 + i, delay: i * 0.4, ease: "linear" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        transition={{ type: "spring", damping: 20, stiffness: 180, delay: 0.2 }}
        className="text-center max-w-sm mx-auto px-6 relative"
      >
        {/* Descent line — slow, meditative pulse */}
        <motion.div
          className="flex flex-col items-center mb-6"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-px bg-gradient-to-b from-sky-400/50 to-transparent"
            initial={{ height: 0 }}
            animate={{ height: 32 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-sky-400/50 mt-px"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />
        </motion.div>

        {/* Zone completion badge with checkmark */}
        {zoneContent ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/25 text-sky-300 text-xs font-medium">
              {/* Glow dot replaces emoji */}
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {zoneContent.title}
            </span>
          </motion.div>
        ) : (
          completedPhaseStats && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mb-5"
            >
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/25 text-sky-300 text-xs font-medium">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {completedPhaseStats.phaseName} {mt.complete}
              </span>
              <p className="text-[11px] text-white/70 mt-2.5">
                {completedPhaseStats.questionsAnswered}/
                {completedPhaseStats.totalQuestions} {mt.questionsAnswered}
              </p>
            </motion.div>
          )
        )}

        {/* Micro-insight for completed zone */}
        {zoneContent && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm text-white/60 leading-relaxed mb-3 italic"
          >
            {zoneContent.insight}
          </motion.p>
        )}

        {/* Depth descent animation — "↓ 5m → 50m" */}
        {previousDepth && previousDepth !== depth && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-3"
          >
            <motion.span
              className="text-sm font-mono text-sky-400/90 tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              ↓{" "}
            </motion.span>
            <motion.span
              className="text-sm font-mono text-sky-400/80"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {previousDepth}
            </motion.span>
            <motion.span
              className="text-sm font-mono text-sky-400/70 mx-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              →
            </motion.span>
            <motion.span
              className="text-sm font-mono text-sky-300 font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {depth}
            </motion.span>
          </motion.div>
        )}

        {/* Depth indicator label */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: previousDepth ? 0.3 : 0.1 }}
          className="text-sm text-sky-400/80 mb-2 font-medium tracking-wide"
        >
          {depth} · {label}
        </motion.p>

        {/* Phase name — large centered text */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: previousDepth ? 0.45 : 0.25, duration: 0.5 }}
          className="text-2xl md:text-3xl font-light text-white tracking-tight"
        >
          {moduleName}
        </motion.h2>

        {/* Glow line divider */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 64, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/60 to-transparent mx-auto mt-5"
        />

        {/* Next zone teaser */}
        {zoneContent?.next ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-[11px] text-white/70 mt-5 leading-relaxed"
          >
            {zoneContent.next}
          </motion.p>
        ) : (
          nextPhaseName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-[11px] text-white/60 mt-5"
            >
              {mt.upNext}: {nextPhaseName}
            </motion.p>
          )
        )}

        {/* Continue button — user-dismissed, appears after 0.5s */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showContinue ? 1 : 0, y: showContinue ? 0 : 8 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={onContinue}
            className="min-h-[44px] px-8 py-2.5 rounded-xl text-sm font-medium
              bg-sky-500/20 text-sky-200 hover:bg-sky-500/30
              border border-sky-400/25 active:scale-[0.97] transition-all duration-150"
          >
            {mt.continue}
          </button>
          {onReconsider && reconsiderLabel && (
            <button
              type="button"
              onClick={onReconsider}
              className="block mx-auto mt-4 min-h-[36px] px-3 py-1 text-xs text-white/55 hover:text-white/85 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/40 rounded transition-colors"
            >
              {reconsiderLabel}
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Zone content helpers ────────────────────────────────────

/** Compute top 2 Schwartz value types from TwIVI answers (Module B, items 1-20). */
function computeTopValues(
  answers: Array<{ moduleCode: string; value: AnswerValue }>,
): [string, string] | null {
  const bAnswers = answers.filter(
    (a) => a.moduleCode === "B" && a.value.type === "ddvq",
  );
  if (bAnswers.length < 10) return null;

  // TwIVI items are 1-indexed within Module B
  const ratings: Record<number, number> = {};
  bAnswers.forEach((a, i) => {
    if (a.value.type === "ddvq") ratings[i + 1] = a.value.rating;
  });

  // Compute raw mean per value type
  const valueMeans: [string, number][] = [];
  for (const [valType, itemIds] of Object.entries(DDVQ21_VALUE_MAP)) {
    const scores = itemIds
      .map((id) => ratings[id])
      .filter((v) => v !== undefined);
    if (scores.length > 0) {
      valueMeans.push([
        valType,
        scores.reduce((s, v) => s + v, 0) / scores.length,
      ]);
    }
  }

  valueMeans.sort((a, b) => b[1] - a[1]);
  return valueMeans.length >= 2 ? [valueMeans[0][0], valueMeans[1][0]] : null;
}

/** Localized Schwartz value labels */
const VALUE_LABELS: Record<string, { en: string; zh: string }> = {
  "self-direction": { en: "Self-Direction", zh: "自主" },
  stimulation: { en: "Stimulation", zh: "刺激" },
  hedonism: { en: "Hedonism", zh: "享乐" },
  achievement: { en: "Achievement", zh: "成就" },
  power: { en: "Power", zh: "权力" },
  security: { en: "Security", zh: "安全" },
  conformity: { en: "Conformity", zh: "遵从" },
  tradition: { en: "Tradition", zh: "传统" },
  benevolence: { en: "Benevolence", zh: "仁慈" },
  universalism: { en: "Universalism", zh: "博爱" },
};

function getZoneContent(
  zone: "A" | "B" | "C",
  mt: Record<string, string>,
  sjtTensionCount: number,
  answers?: Array<{ moduleCode: string; value: AnswerValue }>,
  language?: string,
): { title: string; insight: string; next: string; icon: string } {
  const oceanZone = getZoneForModule(zone);
  const icon = oceanZone?.icon || "";
  const isZh = language === "zh";

  switch (zone) {
    case "A":
      return {
        title: mt.zoneAComplete,
        insight:
          sjtTensionCount > 0
            ? interpolate(mt.zoneAInsight, { count: sjtTensionCount })
            : mt.zoneAInsightZero,
        next: mt.zoneANext,
        icon,
      };
    case "B": {
      const topValues = answers ? computeTopValues(answers) : null;
      const insight = topValues
        ? interpolate(mt.zoneBInsightPersonalized, {
            value1: isZh
              ? (VALUE_LABELS[topValues[0]]?.zh ?? topValues[0])
              : (VALUE_LABELS[topValues[0]]?.en ?? topValues[0]),
            value2: isZh
              ? (VALUE_LABELS[topValues[1]]?.zh ?? topValues[1])
              : (VALUE_LABELS[topValues[1]]?.en ?? topValues[1]),
          })
        : mt.zoneBInsight;
      return {
        title: mt.zoneBComplete,
        insight,
        next: mt.zoneBNext,
        icon,
      };
    }
    case "C":
      return {
        title: mt.zoneCComplete,
        insight: mt.zoneCInsight,
        next: mt.zoneCNext,
        icon,
      };
  }
}
