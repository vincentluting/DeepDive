"use client";

import React from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { ClaimedUserStep } from "@/lib/db/invite-codes";

// ── Single source of truth for the 5-step recruitment funnel ──
// Mirrors lib/db/invite-codes.ts:getClaimedUsersProgress, which collapses the
// algorithmic `profile_generated` milestone into Deep Dive on purpose (a
// recruiter cares "did they finish the deep dive / get a report", not the
// internal pipeline stage).
export const JOURNEY_STEP_ORDER: ClaimedUserStep[] = [
  "registered",
  "quickDive",
  "deepDive",
  "report",
  "coaching",
];

/** Position of a step in the funnel (0–4). Unknown steps fall back to 0. */
export function stepIndex(step: ClaimedUserStep): number {
  const i = JOURNEY_STEP_ORDER.indexOf(step);
  return i < 0 ? 0 : i;
}

function stepLabels(locale: Locale): Record<ClaimedUserStep, string> {
  const t = (getDictionaryClient(locale).admin?.inviteCodes || {}) as Record<
    string,
    string
  >;
  return {
    registered: t.stepRegistered || "Registered",
    quickDive: t.stepQuickDive || "Quick Dive",
    deepDive: t.stepDeepDive || "Deep Dive",
    report: t.stepReport || "Report",
    coaching: t.stepCoaching || "Coaching",
  };
}

/** Localized label for a single step (exported for use in filters/summaries). */
export function stepLabel(step: ClaimedUserStep, locale: Locale): string {
  return stepLabels(locale)[step];
}

/**
 * Horizontal 5-dot progress indicator for a claimed user's furthest journey
 * step. Filled dots/segments up to the reached step; the terminal `coaching`
 * step renders in emerald to signal a fully converted participant.
 *
 * Pure presentation — no data fetching. Light/dark parity via theme tokens.
 */
export function JourneyProgressStepper({
  step,
  locale,
  className = "",
  showLabel = true,
}: {
  step: ClaimedUserStep;
  locale: Locale;
  className?: string;
  showLabel?: boolean;
}) {
  const current = stepIndex(step);
  const labels = stepLabels(locale);
  const isComplete = step === "coaching";
  const reachedFill = isComplete ? "bg-emerald-500" : "bg-primary";
  const labelColor = isComplete
    ? "text-emerald-600 dark:text-emerald-400"
    : current === 0
      ? "text-muted-foreground"
      : "text-primary";

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      role="img"
      aria-label={`${labels[step]} (${current + 1}/${JOURNEY_STEP_ORDER.length})`}
    >
      <div className="flex items-center">
        {JOURNEY_STEP_ORDER.map((s, i) => {
          const reached = i <= current;
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <span
                  className={`h-0.5 w-3.5 sm:w-5 rounded-full ${
                    reached ? reachedFill : "bg-muted"
                  }`}
                  aria-hidden="true"
                />
              )}
              <span
                title={labels[s]}
                className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                  reached
                    ? `${reachedFill} border-transparent`
                    : "bg-background border-muted-foreground/30"
                }`}
                aria-hidden="true"
              />
            </React.Fragment>
          );
        })}
      </div>
      {showLabel && (
        <span className={`text-[11px] font-medium leading-none ${labelColor}`}>
          {labels[step]}
        </span>
      )}
    </div>
  );
}
