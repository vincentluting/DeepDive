"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { csrfFetch } from "@/lib/auth/csrf-client";
import {
  FLOW_ACTIVITY_TAGS,
  FLOW_SOCIAL_TAGS,
  FLOW_ENVIRONMENT_TAGS,
  analyzeFlowPatterns,
  type FlowMomentEntry,
  type FlowActivityTag,
  type FlowSocialTag,
  type FlowEnvironmentTag,
} from "@/lib/action-hub/guided-exercises";

// ── Types ─────────────────────────────────────────────────

interface FlowMomentsDict {
  title: string;
  subtitle: string;
  instruction: string;
  momentLabel: string;
  descriptionPlaceholder: string;
  activityLabel: string;
  socialLabel: string;
  environmentLabel: string;
  addMoment: string;
  confirm: string;
  completed: string;
  completedHint: string;
  redo: string;
  pattern: string;
  noPattern: string;
  activities: Record<string, string>;
  social: Record<string, string>;
  environment: Record<string, string>;
  errors: Record<string, string>;
}

interface FlowMomentsExerciseProps {
  dict: FlowMomentsDict;
  errors: { networkError: string; generic: string };
  initialResult?: {
    moments: Array<{
      description: string;
      activity: string;
      social: string;
      environment: string;
    }>;
    completedAt: string;
  } | null;
}

const EMPTY_MOMENT: FlowMomentEntry = {
  description: "",
  activity: "creating",
  social: "alone",
  environment: "quiet",
};

// ── Component ─────────────────────────────────────────────

export function FlowMomentsExercise({
  dict,
  errors,
  initialResult,
}: FlowMomentsExerciseProps) {
  const isDone = !!initialResult;
  const [moments, setMoments] = useState<FlowMomentEntry[]>(
    () =>
      (initialResult?.moments as FlowMomentEntry[] | undefined) ?? [
        { ...EMPTY_MOMENT },
      ],
  );
  const [step, setStep] = useState<"input" | "done">(isDone ? "done" : "input");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMoment = useCallback(
    (index: number, field: keyof FlowMomentEntry, value: string) => {
      setMoments((prev) =>
        prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
      );
    },
    [],
  );

  const addMoment = useCallback(() => {
    if (moments.length < 3) {
      setMoments((prev) => [...prev, { ...EMPTY_MOMENT }]);
      setCurrentIndex(moments.length);
    }
  }, [moments.length]);

  const canSubmit =
    moments.length === 3 &&
    moments.every((m) => m.description.trim().length >= 3);

  const handleConfirm = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/exercises/flow-moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moments }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? errors.generic);
        setSaving(false);
        return;
      }
      setStep("done");
      window.dispatchEvent(new CustomEvent("exercise-completed"));
    } catch {
      setError(errors.networkError);
    }
    setSaving(false);
  }, [canSubmit, moments]);

  const startOver = useCallback(() => {
    setMoments([{ ...EMPTY_MOMENT }]);
    setCurrentIndex(0);
    setStep("input");
    setError(null);
  }, []);

  const patterns = step === "done" ? analyzeFlowPatterns(moments) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[var(--sanc-rule)] bg-[var(--sanc-sand)] overflow-hidden"
    >
      {/* Header — editorial, no icon */}
      <div className="px-6 pt-6 pb-3">
        <h3 className="font-display-section text-base text-[var(--sanc-ink)] leading-tight">
          {dict.title}
        </h3>
        <p className="font-serif-italic text-xs text-[var(--sanc-ink-soft)] mt-1">
          {dict.subtitle}
        </p>
      </div>

      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground/80">
                {dict.instruction}
              </p>

              {/* Moment tabs — text pills, no icons */}
              <div className="flex gap-1.5">
                {moments.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      currentIndex === i
                        ? "bg-foreground text-background"
                        : moments[i].description.trim().length >= 3
                          ? "bg-foreground/10 text-foreground"
                          : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
                    }`}
                  >
                    {dict.momentLabel.replace("{{n}}", String(i + 1))}
                  </button>
                ))}
                {moments.length < 3 && (
                  <button
                    onClick={addMoment}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    + {dict.addMoment}
                  </button>
                )}
              </div>

              {/* Current moment editor */}
              {moments[currentIndex] && (
                <MomentEditor
                  moment={moments[currentIndex]}
                  dict={dict}
                  onChange={(field, value) =>
                    updateMoment(currentIndex, field, value)
                  }
                />
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              {/* Navigation — text only */}
              <div className="pt-2 flex justify-between items-center">
                {currentIndex > 0 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                    className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {dict.momentLabel.replace("{{n}}", String(currentIndex))}
                  </button>
                ) : (
                  <div />
                )}

                {currentIndex < moments.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-4 py-2 rounded-xl text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {dict.momentLabel.replace(
                      "{{n}}",
                      String(currentIndex + 2),
                    )}{" "}
                    →
                  </button>
                ) : canSubmit ? (
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >
                    {saving && (
                      <span className="inline-block w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2 align-middle" />
                    )}
                    {dict.confirm}
                  </button>
                ) : null}
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {dict.completed}
                </p>
                <button
                  onClick={startOver}
                  className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {dict.redo}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60">
                {dict.completedHint}
              </p>

              {/* Moments summary — clean, no colored boxes */}
              {moments.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border/50 bg-card p-4"
                >
                  <p className="text-sm text-foreground font-medium">
                    {m.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <span className="text-[11px] text-muted-foreground/60">
                      {dict.activities[m.activity]}
                    </span>
                    <span className="text-[11px] text-muted-foreground/30">
                      ·
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {dict.social[m.social]}
                    </span>
                    <span className="text-[11px] text-muted-foreground/30">
                      ·
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {dict.environment[m.environment]}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Pattern analysis */}
              {patterns && (
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-4 mt-2">
                  <p className="text-xs font-medium text-foreground mb-2">
                    {patterns.dominantActivity ||
                    patterns.dominantSocial ||
                    patterns.dominantEnvironment
                      ? dict.pattern
                      : dict.noPattern}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {patterns.dominantActivity && (
                      <span className="text-[11px] text-muted-foreground">
                        {dict.activities[patterns.dominantActivity]}
                      </span>
                    )}
                    {patterns.dominantSocial && (
                      <span className="text-[11px] text-muted-foreground">
                        {dict.social[patterns.dominantSocial]}
                      </span>
                    )}
                    {patterns.dominantEnvironment && (
                      <span className="text-[11px] text-muted-foreground">
                        {dict.environment[patterns.dominantEnvironment]}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Moment editor — text-only tags, no icons ─────────────

function MomentEditor({
  moment,
  dict,
  onChange,
}: {
  moment: FlowMomentEntry;
  dict: FlowMomentsDict;
  onChange: (field: keyof FlowMomentEntry, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-foreground/[0.015] p-4">
      {/* Description */}
      <div>
        <input
          type="text"
          value={moment.description}
          onChange={(e) =>
            onChange("description", e.target.value.slice(0, 120))
          }
          placeholder={dict.descriptionPlaceholder}
          maxLength={120}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/20 placeholder:text-muted-foreground/60 transition-colors"
        />
        <p className="text-[10px] text-muted-foreground/60 mt-1 text-right">
          {moment.description.length}/120
        </p>
      </div>

      {/* Activity tags — text-only pills */}
      <TagGroup<FlowActivityTag>
        label={dict.activityLabel}
        tags={FLOW_ACTIVITY_TAGS}
        labels={dict.activities}
        value={moment.activity}
        onSelect={(v) => onChange("activity", v)}
      />

      {/* Social tags */}
      <TagGroup<FlowSocialTag>
        label={dict.socialLabel}
        tags={FLOW_SOCIAL_TAGS}
        labels={dict.social}
        value={moment.social}
        onSelect={(v) => onChange("social", v)}
        layout="flex"
      />

      {/* Environment tags */}
      <TagGroup<FlowEnvironmentTag>
        label={dict.environmentLabel}
        tags={FLOW_ENVIRONMENT_TAGS}
        labels={dict.environment}
        value={moment.environment}
        onSelect={(v) => onChange("environment", v)}
        layout="grid"
      />
    </div>
  );
}

// ── Generic text-only tag group — no icons ────────────────

function TagGroup<T extends string>({
  label,
  tags,
  labels,
  value,
  onSelect,
  layout = "wrap",
}: {
  label: string;
  tags: readonly T[];
  labels: Record<string, string>;
  value: T;
  onSelect: (tag: T) => void;
  layout?: "wrap" | "flex" | "grid";
}) {
  const containerClass =
    layout === "grid"
      ? "grid grid-cols-2 gap-2"
      : layout === "flex"
        ? "flex gap-2"
        : "flex flex-wrap gap-1.5";
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground/60 mb-2 tracking-wide uppercase">
        {label}
      </p>
      <div className={containerClass}>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(tag)}
            className={`px-3 py-2 rounded-xl border text-xs transition-all duration-200 ${layout === "flex" ? "flex-1 text-center" : ""} ${
              value === tag
                ? "border-foreground/20 bg-foreground/[0.05] text-foreground font-medium"
                : "border-border/50 text-muted-foreground/70 hover:border-border hover:text-foreground"
            }`}
          >
            {labels[tag]}
          </button>
        ))}
      </div>
    </div>
  );
}
