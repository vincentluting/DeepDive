"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { csrfFetch } from "@/lib/auth/csrf-client";
import {
  NON_NEGOTIABLE_OPTIONS,
  type NonNegotiableDimension,
} from "@/lib/action-hub/guided-exercises";

// ── Dimension marker ────────────────────────────────────────────
// Single unified dot color (editorial discipline: one accent per page).
// Dimensions are distinguished by numeric prefix + typography in the
// section header, not by color alpha — alpha-only differentiation fails
// WCAG SC 1.4.1 for color-blind / low-vision users.
const DIM_DOT = "bg-[var(--exec-green)]";

// ── Types ─────────────────────────────────────────────────

type Step = "select" | "narrow" | "rank" | "done";

interface NonNegotiablesDict {
  title: string;
  subtitle: string;
  instruction: string;
  stepSelect: string;
  stepSelectHint: string;
  stepNarrow: string;
  stepNarrowHint: string;
  stepRank: string;
  stepRankHint: string;
  tooMany: string;
  confirm: string;
  completed: string;
  completedHint: string;
  redo: string;
  rank: string;
  removeLabel: string;
  dimensions: Record<string, string>;
  options: Record<string, string>;
}

interface NonNegotiablesExerciseProps {
  dict: NonNegotiablesDict;
  errors: { networkError: string; generic: string };
  initialResult?: {
    selected: [string, string, string];
    completedAt: string;
  } | null;
}

// ── Component ─────────────────────────────────────────────

export function NonNegotiablesExercise({
  dict,
  errors,
  initialResult,
}: NonNegotiablesExerciseProps) {
  const [step, setStep] = useState<Step>(initialResult ? "done" : "select");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialResult?.selected ?? []),
  );
  const [ranked, setRanked] = useState<string[]>(() =>
    initialResult?.selected ? [...initialResult.selected] : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOption = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeOption = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const goToNarrow = useCallback(() => {
    if (selected.size >= 3) setStep("narrow");
  }, [selected.size]);
  const goToRank = useCallback(() => {
    if (selected.size === 3) {
      setRanked([...selected]);
      setStep("rank");
    }
  }, [selected]);
  const goBack = useCallback(() => {
    if (step === "narrow") setStep("select");
    else if (step === "rank") setStep("narrow");
  }, [step]);
  const startOver = useCallback(() => {
    setSelected(new Set());
    setRanked([]);
    setStep("select");
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (ranked.length !== 3) return;
    setSaving(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/exercises/non-negotiables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: ranked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const err = data?.error;
        setError(
          typeof err === "string" ? err : (err?.message ?? errors.generic),
        );
        setSaving(false);
        return;
      }
      setStep("done");
      window.dispatchEvent(new CustomEvent("exercise-completed"));
    } catch {
      setError(errors.networkError);
    }
    setSaving(false);
  }, [ranked]);

  const groupedOptions = NON_NEGOTIABLE_OPTIONS.reduce(
    (acc, opt) => {
      if (!acc[opt.dimension]) acc[opt.dimension] = [];
      acc[opt.dimension].push(opt);
      return acc;
    },
    {} as Record<NonNegotiableDimension, typeof NON_NEGOTIABLE_OPTIONS>,
  );

  const dimensionOrder: NonNegotiableDimension[] = [
    "financial",
    "location",
    "time",
    "culture",
    "growth",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[var(--sanc-rule)] bg-[var(--sanc-sand)] overflow-hidden"
    >
      {/* Header — editorial, no icon box */}
      <div className="px-6 pt-6 pb-3">
        <h3 className="font-display-section text-base text-[var(--sanc-ink)] leading-tight">
          {dict.title}
        </h3>
        <p className="font-serif-italic text-xs text-[var(--sanc-ink-soft)] mt-1">
          {dict.subtitle}
        </p>
      </div>

      {/* Step indicator — refined thin bar */}
      {step !== "done" && (
        <div className="px-6 pb-4">
          <div className="flex gap-1">
            {(["select", "narrow", "rank"] as const).map((s, i) => (
              <div
                key={s}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  s === step
                    ? "bg-foreground"
                    : i < ["select", "narrow", "rank"].indexOf(step)
                      ? "bg-foreground/40"
                      : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <StepSelect
              key="select"
              dict={dict}
              groupedOptions={groupedOptions}
              dimensionOrder={dimensionOrder}
              selected={selected}
              onToggle={toggleOption}
              onNext={goToNarrow}
            />
          )}
          {step === "narrow" && (
            <StepNarrow
              key="narrow"
              dict={dict}
              selected={selected}
              onRemove={removeOption}
              onBack={goBack}
              onNext={goToRank}
            />
          )}
          {step === "rank" && (
            <StepRank
              key="rank"
              dict={dict}
              ranked={ranked}
              onReorder={setRanked}
              onBack={goBack}
              onConfirm={handleConfirm}
              saving={saving}
              error={error}
            />
          )}
          {step === "done" && (
            <StepDone
              key="done"
              dict={dict}
              ranked={
                ranked.length === 3
                  ? ranked
                  : [...(initialResult?.selected ?? [])]
              }
              onRedo={startOver}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Step 1: Multi-select — text-driven, no icons ──────────

function StepSelect({
  dict,
  groupedOptions,
  dimensionOrder,
  selected,
  onToggle,
  onNext,
}: {
  dict: NonNegotiablesDict;
  groupedOptions: Record<NonNegotiableDimension, typeof NON_NEGOTIABLE_OPTIONS>;
  dimensionOrder: NonNegotiableDimension[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <p className="text-sm text-muted-foreground/80">{dict.instruction}</p>

      <div>
        <p className="text-sm font-medium text-foreground">{dict.stepSelect}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {dict.stepSelectHint}
        </p>
      </div>

      {dimensionOrder.map((dim, idx) => {
        const options = groupedOptions[dim];
        if (!options) return null;
        const numeric = String(idx + 1).padStart(2, "0");

        return (
          <div key={dim} className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span
                className="text-[11px] tabular-nums font-medium text-[var(--exec-green)]"
                aria-label={`Dimension ${idx + 1}`}
              >
                {numeric}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${DIM_DOT}`}
                aria-hidden
              />
              <span className="text-[11px] font-medium text-[var(--sanc-ink-soft)] tracking-wide uppercase">
                {dict.dimensions[dim]}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt) => {
                const isSelected = selected.has(opt.id);
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onToggle(opt.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-200 ${
                      isSelected
                        ? "border-foreground/20 bg-foreground/[0.04] text-foreground font-medium"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {/* Selection checkbox — square + check = clearly multi-select */}
                    <div
                      className={`shrink-0 w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-foreground bg-foreground"
                          : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          viewBox="0 0 12 12"
                          className="w-2.5 h-2.5 text-background"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M2.5 6.5l2.5 2.5 4.5-5"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 min-w-0">
                      {dict.options[opt.id]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          disabled={selected.size < 3}
          className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {dict.stepNarrow}{" "}
          <span className="text-xs opacity-60 ml-1">({selected.size})</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Step 2: Narrow down to 3 ──────────────────────────────

function StepNarrow({
  dict,
  selected,
  onRemove,
  onBack,
  onNext,
}: {
  dict: NonNegotiablesDict;
  selected: Set<string>;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const selectedOptions = NON_NEGOTIABLE_OPTIONS.filter((o) =>
    selected.has(o.id),
  );
  const excess = selected.size - 3;
  const canProceed = selected.size === 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{dict.stepNarrow}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {dict.stepNarrowHint}
        </p>
      </div>

      {!canProceed && (
        <p className="text-xs font-medium text-[var(--exec-red)]">
          {dict.tooMany
            .replace("{{count}}", String(selected.size))
            .replace("{{excess}}", String(excess))}
        </p>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {selectedOptions.map((opt) => {
            const dot = DIM_DOT;
            return (
              <motion.div
                key={opt.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="flex-1 min-w-0 text-sm font-medium text-foreground">
                  {dict.options[opt.id]}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemove(opt.id)}
                  className="text-sm text-muted-foreground/70 hover:text-red-500 transition-colors px-1"
                  aria-label={dict.removeLabel}
                >
                  ×
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="pt-2 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {dict.stepSelect}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {dict.stepRank}
        </button>
      </div>
    </motion.div>
  );
}

// ── Step 3: Drag to rank ──────────────────────────────────

function StepRank({
  dict,
  ranked,
  onReorder,
  onBack,
  onConfirm,
  saving,
  error,
}: {
  dict: NonNegotiablesDict;
  ranked: string[];
  onReorder: (items: string[]) => void;
  onBack: () => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{dict.stepRank}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {dict.stepRankHint}
        </p>
      </div>

      <Reorder.Group
        axis="y"
        values={ranked}
        onReorder={onReorder}
        className="space-y-2"
      >
        {ranked.map((id, i) => {
          const opt = NON_NEGOTIABLE_OPTIONS.find((o) => o.id === id);
          if (!opt) return null;
          const dot = DIM_DOT;

          return (
            <Reorder.Item
              key={id}
              value={id}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/50 bg-card cursor-grab active:cursor-grabbing"
            >
              {/* Drag handle — text, not icon */}
              <span className="text-[10px] text-muted-foreground/50 select-none shrink-0">
                ::
              </span>
              <span className="w-5 h-5 rounded-full bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
                {i + 1}
              </span>
              <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground">
                {dict.options[id]}
              </span>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="pt-2 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {dict.stepNarrow}
        </button>
        <button
          onClick={onConfirm}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {saving && (
            <span className="inline-block w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2 align-middle" />
          )}
          {dict.confirm}
        </button>
      </div>
    </motion.div>
  );
}

// ── Done state — clean, minimal ──────────────────────────

function StepDone({
  dict,
  ranked,
  onRedo,
}: {
  dict: NonNegotiablesDict;
  ranked: string[];
  onRedo: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {dict.completed}
        </p>
        <button
          onClick={onRedo}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          {dict.redo}
        </button>
      </div>
      <p className="text-xs text-muted-foreground/60">{dict.completedHint}</p>

      <div className="space-y-2">
        {ranked.map((id, i) => {
          const opt = NON_NEGOTIABLE_OPTIONS.find((o) => o.id === id);
          if (!opt) return null;
          const dot = DIM_DOT;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card"
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                  i === 0
                    ? "bg-foreground text-background"
                    : "bg-foreground/[0.06] text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground">
                {dict.options[id]}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
