"use client";

import { motion } from "framer-motion";
import { Diamond, Sparkles } from "lucide-react";

export type PlanTier = "lite" | "deep" | "personal";

export interface ExerciseCompletion {
  flow: boolean;
  nonNeg: boolean;
}

interface PlanTierBannerProps {
  /** Current plan tier from ActionPlan.contextJson.tier (null = no plan yet) */
  tier: PlanTier | null;
  /** Which of the two driving exercises are complete */
  completion: ExerciseCompletion;
  /** Whether the current plan's content was polished by the LLM */
  llmEnriched?: boolean;
  dict: {
    tier?: {
      lite?: {
        badge?: string;
        headline?: string;
        hint?: string;
        cta?: string;
      };
      deep?: {
        badge?: string;
        headlineFlow?: string;
        headlineNonNeg?: string;
        hint?: string;
        cta?: string;
      };
      personal?: {
        badge?: string;
        headline?: string;
        hint?: string;
        llmBadge?: string;
      };
    };
  };
  /** Smooth-scroll target — clicking the CTA scrolls down to the exercises section */
  exerciseSectionId?: string;
}

/**
 * Three-state banner that tells the user which tier of plan they're on
 * and nudges them toward the richer tiers without cold-wall gating.
 *
 * Lite → warm sand banner with a big CTA
 * Deep → compact badge + "finish the last one" hint
 * Personal → gold accent + optional "Refined by AI" chip
 */
export function PlanTierBanner({
  tier,
  completion,
  llmEnriched,
  dict,
  exerciseSectionId = "exercises-section",
}: PlanTierBannerProps) {
  if (!tier) return null;

  const tierDict = dict.tier ?? {};

  if (tier === "lite") {
    const d = tierDict.lite ?? {};
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[var(--sanc-rule)] bg-[var(--sanc-sand)] p-5"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 mt-1 shrink-0 text-[var(--exec-green)]" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              {d.badge && (
                <span className="font-eyebrow text-[var(--sanc-ink-soft)]">
                  {d.badge}
                </span>
              )}
            </div>
            {d.headline && (
              <p className="font-display-section text-[1.05rem] text-[var(--sanc-ink)] leading-snug">
                {d.headline}
              </p>
            )}
            {d.hint && (
              <p className="text-xs text-[var(--sanc-ink-soft)] leading-relaxed">
                {d.hint}
              </p>
            )}
            {d.cta && (
              <a
                href={`#${exerciseSectionId}`}
                className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-[var(--exec-green)] hover:text-[var(--exec-green-soft)] transition-colors"
              >
                {d.cta} →
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (tier === "deep") {
    const d = tierDict.deep ?? {};
    // Which exercise is already backing the plan?
    const headline = completion.flow
      ? (d.headlineFlow ?? d.headlineNonNeg)
      : (d.headlineNonNeg ?? d.headlineFlow);
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-[var(--sanc-rule)] bg-[var(--sanc-linen)] p-4"
      >
        <div className="flex items-start gap-3">
          <Diamond className="w-4 h-4 mt-0.5 shrink-0 text-[var(--exec-green)]" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              {d.badge && (
                <span className="font-eyebrow text-[var(--exec-green)]">
                  {d.badge}
                </span>
              )}
            </div>
            {headline && (
              <p className="text-sm font-medium text-[var(--sanc-ink)]">
                {headline}
              </p>
            )}
            {d.hint && (
              <p className="text-xs text-[var(--sanc-ink-soft)]">{d.hint}</p>
            )}
            {d.cta && (
              <a
                href={`#${exerciseSectionId}`}
                className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium text-[var(--exec-green)] hover:text-[var(--exec-green-soft)] transition-colors"
              >
                {d.cta} →
              </a>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // personal
  const d = tierDict.personal ?? {};
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[var(--exec-green)]/30 bg-[var(--sanc-linen)] p-4"
      style={{ boxShadow: "inset 3px 0 0 var(--exec-green)" }}
    >
      <div className="flex items-start gap-3">
        <Diamond className="w-4 h-4 mt-0.5 shrink-0 text-[var(--exec-green)]" />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {d.badge && (
              <span className="font-eyebrow text-[var(--exec-green)]">
                {d.badge}
              </span>
            )}
            {llmEnriched && d.llmBadge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide uppercase text-[var(--sanc-ink-soft)] bg-[var(--sanc-sand)] px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                {d.llmBadge}
              </span>
            )}
          </div>
          {d.headline && (
            <p className="text-sm font-medium text-[var(--sanc-ink)]">
              {d.headline}
            </p>
          )}
          {d.hint && (
            <p className="text-xs text-[var(--sanc-ink-soft)] leading-relaxed">
              {d.hint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
