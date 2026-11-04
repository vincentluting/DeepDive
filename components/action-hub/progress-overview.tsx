"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Zap, Trophy } from "lucide-react";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Types ──────────────────────────────────────────────────

interface TimelineEvent {
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ProgressData {
  events: TimelineEvent[];
  total: number;
  stats: {
    actionsCompleted: number;
    milestonesReached: number;
  };
  depth: {
    depthM: number;
    completionPercent: number;
    zoneName: string;
  };
}

interface ProgressOverviewProps {
  dict: Record<string, unknown>;
  locale: string;
  data: ProgressData | null;
  /** Guided-exercise completion (drives the "Exercises x/2" mini counter) */
  exerciseCompletion?: { flow: boolean; nonNeg: boolean };
  /** DOM id of the exercises section — clicking the counter scrolls to it */
  exerciseSectionId?: string;
}

// ── Relative time helper ───────────────────────────────────

function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

function relativeTime(timestamp: string, locale: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const t = getDictionaryClient(resolveLocale(locale)).coachCompanion;

  if (mins < 1) return t.justNow;
  if (mins < 60)
    return (t.minutesAgo ?? "{n}m ago").replace("{n}", String(mins));
  if (hours < 24)
    return (t.hoursAgo ?? "{n}h ago").replace("{n}", String(hours));
  if (days < 7) return (t.daysAgo ?? "{n}d ago").replace("{n}", String(days));
  return (t.weeksAgo ?? "{n}w ago").replace(
    "{n}",
    String(Math.floor(days / 7)),
  );
}

// ── Event icon mapping ─────────────────────────────────────

function EventIcon({ type }: { type: string }) {
  const iconClass = "w-3.5 h-3.5";
  switch (type) {
    case "action_completed":
      return (
        <CheckCircle2 className={`${iconClass} text-[var(--exec-green)]`} />
      );
    case "action_started":
      return <Zap className={`${iconClass} text-[var(--exec-green)]/80`} />;
    case "milestone_reached":
      return <Trophy className={`${iconClass} text-[var(--exec-green)]`} />;
    default:
      return <Clock className={`${iconClass} text-[var(--sanc-ink-soft)]`} />;
  }
}

// ── Component ──────────────────────────────────────────────

export function ProgressOverview({
  dict,
  locale,
  data,
  exerciseCompletion,
  exerciseSectionId = "exercises-section",
}: ProgressOverviewProps) {
  const progressDict = dict.progress as Record<string, string>;
  const progressExercisesDict = dict.progressExercises as
    | { label?: string; counter?: string; goToExercise?: string }
    | undefined;

  if (!data || data.total === 0) {
    return null;
  }

  const exerciseDone = exerciseCompletion
    ? (exerciseCompletion.flow ? 1 : 0) + (exerciseCompletion.nonNeg ? 1 : 0)
    : null;

  const { depth, events } = data;
  const recentEvents = events.slice(0, 5);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Outer <SectionLabel> supplies the heading; render compact rows here */}

      {/* Depth readout — pure data, no Ocean-palette ring (Sanctuary purity) */}
      <div className="rounded-lg border border-[var(--sanc-rule)] bg-[var(--sanc-sand)] p-5 flex items-baseline gap-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display-section text-[clamp(1.75rem,3.2vw,2.25rem)] tabular-nums text-[var(--exec-green)]">
            {depth.depthM}
          </span>
          <span className="font-stat text-[var(--sanc-ink-soft)]">m</span>
        </div>
        <div className="h-6 w-px bg-[var(--sanc-rule)]" aria-hidden />
        <div className="flex flex-col">
          <span className="font-eyebrow text-[var(--sanc-ink-soft)]">
            {progressDict.zone}
          </span>
          <span className="text-sm text-[var(--sanc-ink)]">
            {depth.zoneName}
          </span>
        </div>
        <div className="h-6 w-px bg-[var(--sanc-rule)]" aria-hidden />
        <div className="flex flex-col">
          <span className="font-eyebrow text-[var(--sanc-ink-soft)]">
            {progressDict.depth}
          </span>
          <span className="text-sm tabular-nums text-[var(--sanc-ink)]">
            {Math.round(depth.completionPercent)}%
          </span>
        </div>
        {exerciseDone !== null && progressExercisesDict?.label && (
          <>
            <div className="h-6 w-px bg-[var(--sanc-rule)]" aria-hidden />
            <a
              href={`#${exerciseSectionId}`}
              className="flex flex-col group hover:opacity-80 transition-opacity"
              title={progressExercisesDict.goToExercise ?? ""}
            >
              <span className="font-eyebrow text-[var(--sanc-ink-soft)]">
                {progressExercisesDict.label}
              </span>
              <span className="text-sm tabular-nums text-[var(--sanc-ink)] group-hover:text-[var(--exec-green)]">
                {(progressExercisesDict.counter ?? "{{done}}/{{total}}")
                  .replace("{{done}}", String(exerciseDone))
                  .replace("{{total}}", "2")}
              </span>
            </a>
          </>
        )}
      </div>

      {/* Timeline — editorial log, no colored hover */}
      {recentEvents.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="font-eyebrow text-[var(--sanc-ink-soft)] mb-3">
            {progressDict.timeline}
          </h3>
          {recentEvents.map((event, i) => (
            <div
              key={`${event.timestamp}-${i}`}
              className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-[var(--sanc-linen)]/60 transition-colors"
            >
              <div className="mt-0.5">
                <EventIcon type={event.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-[var(--sanc-ink)]">
                  {event.title}
                </p>
              </div>
              <span className="text-[11px] text-[var(--sanc-ink-soft)]/75 tabular-nums shrink-0">
                {relativeTime(event.timestamp, locale)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
