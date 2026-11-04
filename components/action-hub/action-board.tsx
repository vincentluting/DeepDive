"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { toDateLocaleOrDefault } from "@/lib/i18n/config";
import {
  buildActionGuidance,
  getActionAlternatives,
  getRecommendedAction,
  normalizePlanPhase,
  summarizeActionProgress,
  type GuidanceTemplates,
} from "@/lib/action-hub/guidance";
import type { ActionCategory } from "@/lib/db/action-hub";
import {
  Anchor,
  ArrowRight,
  Bookmark,
  Check,
  MoreHorizontal,
  RefreshCw,
  Waves,
  X,
} from "lucide-react";
import type { PlanTier, ExerciseCompletion } from "./plan-tier-banner";

export interface MatchedFlowDimension {
  activity?: string;
  social?: string;
  environment?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  category: ActionCategory;
  intensity: string;
  status: string;
  priority: number;
  estimatedMinutes: number | null;
  sourceDimension: string | null;
  planPhase: number | null;
  recommendationReason: string | null;
  completionOutcome: string | null;
  completedAt?: string | null;
  matchedNonNegotiable?: string | null;
  matchedFlowDimension?: MatchedFlowDimension | null;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDay: number;
  status: string;
  reachedAt: string | null;
}

interface ActionBoardProps {
  dict: {
    title: string;
    subtitle: string;
    generatePlan: string;
    regeneratePlan: string;
    generating: string;
    noPlan: string;
    noPlanDesc: string;
    goToReport: string;
    categories: Record<string, string>;
    status: Record<string, string>;
    intensity: Record<string, string>;
    actions: Record<string, string>;
    filters: Record<string, string>;
    minutes: string;
    emptyState: string;
    errors: { loadFailed: string; networkError: string; generic: string };
    sectionLabels?: {
      keystone?: string;
      milestones?: string;
      actions?: string;
      exercises?: string;
    };
    keystoneLabel?: string;
    milestones: Record<string, string>;
    progress: Record<string, string>;
    progressExercises?: {
      label?: string;
      counter?: string;
      goToExercise?: string;
    };
    progressModel: {
      phaseLabel: string;
      countLabel: string;
      sourceNote: string;
      phase1: string;
      phase2: string;
      phase3: string;
    };
    nextStep: {
      label: string;
      why: string;
      outcome: string;
      start: string;
      complete: string;
      alternatives: string;
      empty: string;
    };
    guidanceTemplates: GuidanceTemplates;
    tier?: Record<string, unknown>;
    attribution?: {
      flowActivity?: string;
      flowSocial?: string;
      flowEnvironment?: string;
      nonNeg?: string;
      tooltipFlow?: string;
      tooltipNonNeg?: string;
    };
    exercises?: {
      flowMoments?: {
        activities?: Record<string, string>;
        social?: Record<string, string>;
        environment?: Record<string, string>;
      };
      nonNegotiables?: {
        options?: Record<string, string>;
      };
    };
    exerciseNudge?: {
      title?: string;
      description?: string;
      action?: string;
      upgradeToDeep?: string;
      upgradeToPersonal?: string;
    };
    keystoneWhyWithArchetype?: string;
    keystoneWhyNoArchetype?: string;
  };
  locale: string;
  reportId?: string | null;
  /** Server-provided initial data — eliminates client-side fetch on mount */
  initialPlan?: { id: string; createdAt?: string } | null;
  initialItems?: ActionItem[];
  initialMilestones?: Milestone[];
  /** Show nudge when exercises were completed after plan generation */
  initialShowExerciseNudge?: boolean;
  /** Current plan tier, from ActionPlan.contextJson.tier */
  planTier?: PlanTier | null;
  /** Whether the current plan's copy was LLM-polished */
  planLlmEnriched?: boolean;
  /** Which guided exercises the user has already completed */
  exerciseCompletion?: ExerciseCompletion;
}

type FilterKey = "all" | "todo" | "inProgress" | "done";

export function ActionBoard({
  dict,
  locale,
  reportId,
  initialPlan,
  initialItems,
  initialMilestones,
  initialShowExerciseNudge,
  planTier = null,
  planLlmEnriched = false,
  exerciseCompletion = { flow: false, nonNeg: false },
}: ActionBoardProps) {
  const hasServerData = initialPlan !== undefined;
  const [items, setItems] = useState<ActionItem[]>(initialItems ?? []);
  const [milestones, setMilestones] = useState<Milestone[]>(
    initialMilestones ?? [],
  );
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id ?? null);
  const [loading, setLoading] = useState(!hasServerData);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("todo");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showExerciseNudge, setShowExerciseNudge] = useState(
    initialShowExerciseNudge ?? false,
  );

  // Only fetch on mount if no server data was provided (backward compat)
  useEffect(() => {
    if (!hasServerData) fetchPlan();
  }, [hasServerData]);

  // Listen for exercise completion events from sibling components
  useEffect(() => {
    const handler = () => {
      if (planId) setShowExerciseNudge(true);
    };
    window.addEventListener("exercise-completed", handler);
    return () => window.removeEventListener("exercise-completed", handler);
  }, [planId]);

  async function fetchPlan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/action-hub/plan");
      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          setPlanId(data.plan.id);
          setItems(data.items ?? []);
          setMilestones(data.milestones ?? []);
        }
      } else if (res.status >= 500) {
        setError(dict.errors.loadFailed);
      }
    } catch {
      setError(dict.errors.networkError);
    }
    setLoading(false);
  }

  async function handleGenerate() {
    if (!reportId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/action-hub/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg =
          typeof errData?.error === "string"
            ? errData.error
            : (errData?.error?.message ?? dict.errors.generic);
        setError(msg);
        setGenerating(false);
        return;
      }
      const data = await res.json();
      if (data.plan) {
        setPlanId(data.plan.id);
        setItems(data.items ?? []);
        setMilestones(data.milestones ?? []);
        setShowExerciseNudge(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.errors.networkError);
    }
    setGenerating(false);
  }

  async function updateItemStatus(itemId: string, status: string) {
    // Optimistic update: also stamp completedAt so the date badge appears
    // immediately. Cleared when user un-completes (status !== completed/skipped).
    const nowIso = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status,
              completedAt:
                status === "completed"
                  ? (item.completedAt ?? nowIso)
                  : status === "skipped"
                    ? (item.completedAt ?? nowIso)
                    : null,
            }
          : item,
      ),
    );
    try {
      const res = await csrfFetch("/api/action-hub/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status }),
      });
      if (status === "completed") {
        // Update milestones that were auto-reached
        const data = await res.json().catch(() => null);
        if (data?.reachedMilestoneIds?.length) {
          const reachedIds = new Set<string>(data.reachedMilestoneIds);
          setMilestones((prev) =>
            prev.map((ms) =>
              reachedIds.has(ms.id)
                ? {
                    ...ms,
                    status: "reached",
                    reachedAt: new Date().toISOString(),
                  }
                : ms,
            ),
          );
        }
      }
    } catch {
      fetchPlan();
    }
  }

  const displayItems = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        planPhase: normalizePlanPhase(item.planPhase, index),
      })),
    [items],
  );

  const guidanceLabels = useMemo(() => {
    const flowMoments = dict.exercises?.flowMoments;
    return {
      nonNegotiableLabels: dict.exercises?.nonNegotiables?.options ?? {},
      flowLabels: {
        ...(flowMoments?.activities ?? {}),
        ...(flowMoments?.social ?? {}),
        ...(flowMoments?.environment ?? {}),
      },
    };
  }, [dict.exercises]);

  // Derive the recommended next step so we can exclude it from the list below
  const nextStepItem = getRecommendedAction(displayItems);
  const nextStepId = nextStepItem?.id ?? null;
  const alternativeItems = getActionAlternatives(displayItems, nextStepId, 3);
  const progressSummary = summarizeActionProgress(displayItems);

  function focusTodoLedger() {
    setFilter("todo");
    document
      .querySelector(".dd-action-ledger-band")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resolveGuidance(item: ActionItem) {
    if (item.recommendationReason && item.completionOutcome) {
      return {
        recommendationReason: item.recommendationReason,
        completionOutcome: item.completionOutcome,
      };
    }
    return buildActionGuidance(item, dict.guidanceTemplates, guidanceLabels);
  }

  // Filter items (excluding the Next Step item to avoid duplication)
  const filteredItems = useMemo(
    () =>
      displayItems.filter((item) => {
        if (item.id === nextStepId && filter !== "all") return false;
        if (filter === "all") return true;
        if (filter === "todo") return item.status === "pending";
        if (filter === "inProgress") return item.status === "in_progress";
        if (filter === "done")
          return item.status === "completed" || item.status === "skipped";
        return true;
      }),
    [displayItems, filter, nextStepId],
  );

  // Category stats — computed once per items change. Was 2× filter per
  // category per render (12 scans for 6 categories); now single O(n) pass.
  const categoryTotals = useMemo(() => {
    const stats: Record<string, { total: number; done: number }> = {};
    for (const item of displayItems) {
      const entry = stats[item.category] ?? { total: 0, done: 0 };
      entry.total += 1;
      if (item.status === "completed" || item.status === "skipped") {
        entry.done += 1;
      }
      stats[item.category] = entry;
    }
    return stats;
  }, [displayItems]);

  // Grouped view of the filtered items — O(n) per filter change instead of
  // CATEGORY_ORDER.length × filteredItems.length on every render.
  const filteredByCategory = useMemo(() => {
    const groups: Record<string, ActionItem[]> = {};
    for (const item of filteredItems) {
      (groups[item.category] ??= []).push(item);
    }
    return groups;
  }, [filteredItems]);

  // Stats
  const completed = displayItems.filter((i) => i.status === "completed").length;

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-[var(--sanc-rule)] border-t-[var(--exec-green)] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // No plan state
  if (!planId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 space-y-5"
      >
        {/* Minimal circle — a single lantern flame */}
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--sanc-rule)] flex items-center justify-center mx-auto mb-4">
          <div className="w-3 h-3 rounded-full bg-[var(--exec-green)]/70" />
        </div>
        <h2 className="font-display-section text-xl sm:text-2xl text-[var(--sanc-ink)]">
          {dict.noPlan}
        </h2>
        <p className="font-serif-italic text-sm text-[var(--sanc-ink-soft)] max-w-md mx-auto leading-relaxed">
          {dict.noPlanDesc}
        </p>
        {reportId ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--exec-green)] text-[var(--sanc-salt)] text-sm font-medium hover:bg-[var(--exec-green-soft)] disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-[var(--sanc-salt)]/40 border-t-[var(--sanc-salt)] rounded-full animate-spin" />
                {dict.generating}
              </>
            ) : (
              dict.generatePlan
            )}
          </button>
        ) : (
          <Link
            href={`/${locale}/reports`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--exec-green)] text-[var(--sanc-salt)] text-sm font-medium hover:bg-[var(--exec-green-soft)] transition-colors"
          >
            {dict.goToReport}
          </Link>
        )}
        {error && (
          <p className="text-sm text-[var(--exec-red)] mt-2">{error}</p>
        )}
      </motion.div>
    );
  }

  // Expected tier if the user regenerates right now, based on current
  // exercise completion. If this exceeds planTier, the nudge copy
  // escalates to "upgrade to Deep/Personal Plan".
  const expectedTier: PlanTier =
    exerciseCompletion.flow && exerciseCompletion.nonNeg
      ? "personal"
      : exerciseCompletion.flow || exerciseCompletion.nonNeg
        ? "deep"
        : "lite";
  const tierRank: Record<PlanTier, number> = { lite: 0, deep: 1, personal: 2 };
  const wouldUpgrade =
    planTier != null && tierRank[expectedTier] > tierRank[planTier];
  const upgradeNudgeTitle = wouldUpgrade
    ? expectedTier === "personal"
      ? dict.exerciseNudge?.upgradeToPersonal
      : dict.exerciseNudge?.upgradeToDeep
    : null;
  const phaseLabels = [
    dict.progressModel.phase1,
    dict.progressModel.phase2,
    dict.progressModel.phase3,
  ];
  const pathwaySteps =
    milestones.length > 0
      ? milestones.map((ms, index) => ({
          id: ms.id,
          title: ms.title,
          description: formatMilestoneDay(dict.milestones.day, ms.targetDay),
          reached: ms.status === "reached",
          current:
            ms.status !== "reached" &&
            normalizePlanPhase(null, index) === progressSummary.currentPhase,
        }))
      : phaseLabels.map((label, index) => {
          const phase = index + 1;
          const allDone =
            completed === displayItems.length && displayItems.length > 0;
          return {
            id: `phase-${phase}`,
            title: label,
            description: dict.progressModel.phaseLabel
              .replace("{{current}}", String(phase))
              .replace("{{total}}", String(progressSummary.totalPhases)),
            reached: allDone || phase < progressSummary.currentPhase,
            current: !allDone && phase === progressSummary.currentPhase,
          };
        });
  const exerciseDone =
    (exerciseCompletion.flow ? 1 : 0) + (exerciseCompletion.nonNeg ? 1 : 0);
  const tierCopy = dict.tier as
    | Record<
        PlanTier,
        {
          badge?: string;
          headline?: string;
          headlineFlow?: string;
          headlineNonNeg?: string;
          hint?: string;
          cta?: string;
          llmBadge?: string;
        }
      >
    | undefined;
  const currentTierCopy = planTier ? tierCopy?.[planTier] : null;
  const tierBadge = currentTierCopy?.badge ?? null;
  const tierHeadline =
    planTier === "deep"
      ? exerciseCompletion.flow
        ? (currentTierCopy?.headlineFlow ?? currentTierCopy?.headlineNonNeg)
        : (currentTierCopy?.headlineNonNeg ?? currentTierCopy?.headlineFlow)
      : currentTierCopy?.headline;
  const exerciseCounter =
    dict.progressExercises?.counter
      ?.replace("{{done}}", String(exerciseDone))
      .replace("{{total}}", "2") ?? `${exerciseDone}/2`;
  const keystoneLabel = dict.keystoneLabel ?? dict.nextStep.label;
  const ledgerLabel = dict.sectionLabels?.actions ?? dict.title;

  return (
    <div className="dd-action-board-grid">
      <div className="dd-action-workspace">
        {/* Dark-mode instrument readout; hidden in light where Pathway owns this. */}
        <section className="dd-action-phase-overview" aria-label={ledgerLabel}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-eyebrow text-[var(--sanc-ink-soft)]">
              {dict.progressModel.phaseLabel
                .replace("{{current}}", String(progressSummary.currentPhase))
                .replace("{{total}}", String(progressSummary.totalPhases))}
            </span>
            <span className="font-stat text-[var(--exec-green)]">
              {dict.progressModel.countLabel
                .replace("{{completed}}", String(progressSummary.completed))
                .replace("{{total}}", String(progressSummary.total))}
            </span>
          </div>
          <div className="dd-phase-track">
            {phaseLabels.map((label, index) => {
              const phase = index + 1;
              const isPast =
                completed === displayItems.length && displayItems.length > 0
                  ? true
                  : phase < progressSummary.currentPhase;
              const isCurrent = phase === progressSummary.currentPhase;
              return (
                <div
                  key={label}
                  className="dd-phase-step"
                  data-state={
                    isPast ? "past" : isCurrent ? "current" : "future"
                  }
                >
                  <span className="dd-phase-line" />
                  <span className="font-stat">{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Exercise nudge — lantern on linen (single accent, no amber) */}
        <AnimatePresence>
          {showExerciseNudge && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="dd-action-nudge"
            >
              <div className="flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-[var(--exec-green)] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--sanc-ink)]">
                    {upgradeNudgeTitle ??
                      dict.exerciseNudge?.title ??
                      dict.regeneratePlan}
                  </p>
                  <p className="text-xs text-[var(--sanc-ink-soft)] mt-0.5">
                    {dict.exerciseNudge?.description ?? dict.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowExerciseNudge(false)}
                    className="text-[var(--sanc-ink-soft)]/70 hover:text-[var(--sanc-ink)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--exec-green)] text-[var(--sanc-salt)] text-xs font-medium hover:bg-[var(--exec-green-soft)] disabled:opacity-50 transition-colors"
                  >
                    {generating ? (
                      <div className="w-3 h-3 border-2 border-[var(--sanc-salt)]/40 border-t-[var(--sanc-salt)] rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {dict.exerciseNudge?.action ?? dict.regeneratePlan}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="dd-action-band dd-action-keystone-band">
          <ActionBandIndex index="01" label={keystoneLabel} />
          {nextStepItem && completed < displayItems.length ? (
            (() => {
              const guidance = resolveGuidance(nextStepItem);
              return (
                <motion.div
                  key={nextStepItem.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="dd-keystone-content"
                >
                  <div className="dd-keystone-main">
                    <p className="font-eyebrow text-[var(--md-gold-text)]">
                      {dict.nextStep.label}
                    </p>
                    <h3>{nextStepItem.title}</h3>
                    {nextStepItem.description &&
                      nextStepItem.description !== nextStepItem.title && (
                        <p className="dd-keystone-desc">
                          {nextStepItem.description}
                        </p>
                      )}
                    <div className="dd-keystone-guidance">
                      <div>
                        <p className="font-eyebrow">{dict.nextStep.why}</p>
                        <p>{guidance.recommendationReason}</p>
                      </div>
                      <div>
                        <p className="font-eyebrow">{dict.nextStep.outcome}</p>
                        <p>{guidance.completionOutcome}</p>
                      </div>
                    </div>
                    <AttributionChips item={nextStepItem} dict={dict} />
                  </div>
                  <div className="dd-keystone-actions">
                    <button
                      type="button"
                      aria-label={dict.filters.todo}
                      className="dd-icon-button"
                      onClick={focusTodoLedger}
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={dict.nextStep.alternatives}
                      aria-expanded={showAlternatives}
                      disabled={alternativeItems.length === 0}
                      className="dd-icon-button"
                      onClick={() => setShowAlternatives((value) => !value)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        updateItemStatus(
                          nextStepItem.id,
                          nextStepItem.status === "pending"
                            ? "in_progress"
                            : "completed",
                        )
                      }
                      className="dd-primary-action"
                    >
                      {nextStepItem.status === "pending"
                        ? dict.nextStep.start
                        : dict.nextStep.complete}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showAlternatives && alternativeItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="dd-keystone-alternatives"
                      >
                        <p className="font-eyebrow text-[var(--sanc-ink-soft)]">
                          {dict.nextStep.alternatives}
                        </p>
                        <div>
                          {alternativeItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                updateItemStatus(item.id, "in_progress")
                              }
                            >
                              <span>{item.title}</span>
                              {item.estimatedMinutes && (
                                <small>
                                  {item.estimatedMinutes} {dict.minutes}
                                </small>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()
          ) : (
            <p className="dd-action-empty">{dict.nextStep.empty}</p>
          )}
        </section>

        <section className="dd-action-band dd-action-pathway-band">
          <ActionBandIndex index="02" label={dict.milestones.title} />
          <div className="dd-pathway-track">
            {pathwaySteps.map((step, index) => (
              <div
                key={step.id}
                className="dd-pathway-step"
                data-state={
                  step.reached ? "reached" : step.current ? "current" : "future"
                }
              >
                <span className="dd-pathway-node">
                  {step.reached && <Check className="h-4 w-4" />}
                </span>
                <span className="dd-pathway-title">{step.title}</span>
                <span className="dd-pathway-meta">
                  {step.reached
                    ? dict.milestones.reached
                    : step.current
                      ? dict.status.in_progress
                      : step.description}
                </span>
                {index < pathwaySteps.length - 1 && (
                  <span className="dd-pathway-connector" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="dd-action-band dd-action-ledger-band">
          <ActionBandIndex index="03" label={ledgerLabel} />
          <div className="dd-ledger-content">
            <div className="dd-ledger-toolbar">
              <div className="dd-action-filters" role="tablist">
                {(["all", "todo", "inProgress", "done"] as FilterKey[]).map(
                  (key) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className="dd-action-filter"
                      data-active={filter === key}
                      role="tab"
                      aria-selected={filter === key}
                    >
                      {dict.filters[key]}
                    </button>
                  ),
                )}
              </div>
              {(tierBadge || dict.progressExercises?.label) && (
                <a
                  href="#exercises-section"
                  className="dd-tier-pill"
                  title={dict.progressExercises?.goToExercise ?? ""}
                >
                  {tierBadge && <span>{tierBadge}</span>}
                  {dict.progressExercises?.label && (
                    <span>
                      {dict.progressExercises.label} {exerciseCounter}
                    </span>
                  )}
                  {planLlmEnriched && currentTierCopy?.llmBadge && (
                    <span>{currentTierCopy.llmBadge}</span>
                  )}
                </a>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <p className="dd-action-empty">{dict.emptyState}</p>
            ) : (
              <div className="dd-ledger-list">
                {CATEGORY_ORDER.map((cat) => {
                  const catItems = filteredByCategory[cat];
                  if (!catItems || catItems.length === 0) return null;
                  const stats = categoryTotals[cat] ?? { total: 0, done: 0 };
                  return (
                    <div key={cat} className="dd-ledger-category">
                      <div className="dd-ledger-category-head">
                        <span className="font-eyebrow">
                          {dict.categories[cat] ?? cat}
                        </span>
                        <span className="font-stat">
                          {stats.done}/{stats.total}
                        </span>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {catItems.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ActionItemCard
                              item={item}
                              dict={dict}
                              locale={locale}
                              onStatusChange={updateItemStatus}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {(() => {
                  const other = filteredItems.filter(
                    (i) => !CATEGORY_ORDER.includes(i.category),
                  );
                  if (other.length === 0) return null;
                  return (
                    <div className="dd-ledger-category">
                      <AnimatePresence mode="popLayout">
                        {other.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ActionItemCard
                              item={item}
                              dict={dict}
                              locale={locale}
                              onStatusChange={updateItemStatus}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      </div>

      <aside
        className="dd-action-signal-rail"
        aria-label={dict.milestones.title}
      >
        <div>
          <p className="font-eyebrow text-[var(--md-gold-text)]">
            {dict.milestones.title}
          </p>
          <div className="dd-signal-milestones">
            {pathwaySteps.slice(0, 4).map((step) => (
              <div
                key={step.id}
                className="dd-signal-step"
                data-state={
                  step.reached ? "reached" : step.current ? "current" : "future"
                }
              >
                <span className="dd-signal-dot" />
                <div>
                  <p>{step.title}</p>
                  <span>
                    {step.reached
                      ? dict.milestones.reached
                      : step.current
                        ? dict.status.in_progress
                        : step.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dd-signal-readout">
          <p className="font-eyebrow text-[var(--sanc-ink-soft)]">
            {dict.progress.overall}
          </p>
          <strong>
            {progressSummary.completed}/{progressSummary.total}
          </strong>
          <span>{dict.progress.itemsDone}</span>
        </div>
        {tierBadge && (
          <div className="dd-signal-readout">
            <p className="font-eyebrow text-[var(--sanc-ink-soft)]">
              {tierBadge}
            </p>
            {tierHeadline && <span>{tierHeadline}</span>}
          </div>
        )}
        {alternativeItems.length > 0 && (
          <div>
            <p className="font-eyebrow text-[var(--sanc-ink-soft)]">
              {dict.nextStep.alternatives}
            </p>
            <div className="dd-signal-alternatives">
              {alternativeItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateItemStatus(item.id, "in_progress")}
                >
                  <span>{item.title}</span>
                  {item.estimatedMinutes && (
                    <small>
                      {item.estimatedMinutes} {dict.minutes}
                    </small>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function ActionBandIndex({ index, label }: { index: string; label: string }) {
  return (
    <div className="dd-action-band-index" aria-hidden="true">
      <span>{index}</span>
      <strong>{label}</strong>
    </div>
  );
}

// Category display order — matches canonical ActionCategory enum
const CATEGORY_ORDER = [
  "explore",
  "learn",
  "network",
  "create",
  "apply",
  "reflect",
];

function formatMilestoneDay(template: string, targetDay: number): string {
  return template.includes("{{day}}")
    ? template.replace("{{day}}", String(targetDay))
    : `${template} ${targetDay}`;
}

// Completion date badge — "APR 22" (en) / "4月22日" (zh) / locale-native others.
// Uses Intl.DateTimeFormat so every locale gets culturally correct formatting;
// English output is uppercased for editorial/dashboard feel.
function formatCompletedBadge(
  iso: string | null | undefined,
  locale: string,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const formatted = new Intl.DateTimeFormat(toDateLocaleOrDefault(locale), {
      month: "short",
      day: "numeric",
    }).format(d);
    // Uppercase the month abbreviation for English / Latin locales — gives the
    // terminal-dashboard feel ("APR 22" not "Apr 22"). Non-Latin scripts are
    // untouched (uppercase is a no-op for CJK).
    return locale === "zh" ? formatted : formatted.toUpperCase();
  } catch {
    // Fallback if Intl misbehaves for an unknown locale
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

// ── Sub-components ────────────────────────────────────────

function ActionItemCard({
  item,
  dict,
  locale,
  onStatusChange,
}: {
  item: ActionItem;
  dict: ActionBoardProps["dict"];
  locale: string;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isCompleted = item.status === "completed";
  const isSkipped = item.status === "skipped";
  const isDone = isCompleted || isSkipped;
  const isActive = item.status === "in_progress";
  const isPending = item.status === "pending";
  const completedBadge =
    isCompleted && item.completedAt
      ? formatCompletedBadge(item.completedAt, locale)
      : null;

  const nextStatus = isPending
    ? "in_progress"
    : isActive
      ? "completed"
      : "in_progress";

  return (
    <div className="dd-action-ledger-row" data-status={item.status}>
      <button
        onClick={() => onStatusChange(item.id, nextStatus)}
        className="dd-ledger-check group/check"
        aria-label={
          isDone
            ? dict.actions.undo
            : isActive
              ? dict.actions.complete
              : dict.actions.start
        }
      >
        {isDone ? (
          <span className="dd-ledger-check-dot is-done">
            <Check className="h-3 w-3" />
          </span>
        ) : isActive ? (
          <span className="dd-ledger-check-dot is-active" />
        ) : (
          <span className="dd-ledger-check-dot" />
        )}
      </button>

      <div className="dd-ledger-title-cell">
        <p className={isDone ? "is-done" : undefined}>{item.title}</p>
        {item.description && item.description !== item.title && !isDone && (
          <span>{item.description}</span>
        )}
        {!isDone && <AttributionChips item={item} dict={dict} />}
        {isActive && (
          <button
            onClick={() => onStatusChange(item.id, "pending")}
            className="dd-ledger-inline-action"
          >
            {dict.actions.pause}
          </button>
        )}
        {isDone && (
          <button
            onClick={() => onStatusChange(item.id, "in_progress")}
            className="dd-ledger-inline-action"
          >
            {dict.actions.undo}
          </button>
        )}
      </div>

      <span className="dd-ledger-meta-cell">
        {dict.categories[item.category] ?? item.category}
      </span>

      <span className="dd-ledger-meta-cell tabular-nums">
        {item.estimatedMinutes
          ? `${item.estimatedMinutes} ${dict.minutes}`
          : ""}
      </span>

      <span className="dd-ledger-status-cell">
        {completedBadge ?? dict.status[item.status] ?? item.status}
      </span>
    </div>
  );
}

// ── Attribution chips — "Flow · alone" / "Anchor · psych safety" ──────────

function AttributionChips({
  item,
  dict,
}: {
  item: ActionItem;
  dict: ActionBoardProps["dict"];
}) {
  const attr = dict.attribution;
  const exercisesDict = dict.exercises;
  if (!attr) return null;

  const flow = item.matchedFlowDimension;
  const nonNegId = item.matchedNonNegotiable;
  if (!flow && !nonNegId) return null;

  // Prefer the strongest/most specific single flow dimension to keep chips terse.
  // Priority: activity → social → environment.
  let flowChip: { label: string; tooltip: string } | null = null;
  if (flow?.activity) {
    const tag =
      exercisesDict?.flowMoments?.activities?.[flow.activity] ?? flow.activity;
    flowChip = {
      label: (attr.flowActivity ?? "Flow · {{tag}}").replace("{{tag}}", tag),
      tooltip: (attr.tooltipFlow ?? "").replace("{{tag}}", tag),
    };
  } else if (flow?.social) {
    const tag =
      exercisesDict?.flowMoments?.social?.[flow.social] ?? flow.social;
    flowChip = {
      label: (attr.flowSocial ?? "Flow · {{tag}}").replace("{{tag}}", tag),
      tooltip: (attr.tooltipFlow ?? "").replace("{{tag}}", tag),
    };
  } else if (flow?.environment) {
    const tag =
      exercisesDict?.flowMoments?.environment?.[flow.environment] ??
      flow.environment;
    flowChip = {
      label: (attr.flowEnvironment ?? "Flow · {{tag}}").replace("{{tag}}", tag),
      tooltip: (attr.tooltipFlow ?? "").replace("{{tag}}", tag),
    };
  }

  let nonNegChip: { label: string; tooltip: string } | null = null;
  if (nonNegId) {
    const label =
      exercisesDict?.nonNegotiables?.options?.[nonNegId] ?? nonNegId;
    nonNegChip = {
      label: (attr.nonNeg ?? "Anchor · {{label}}").replace("{{label}}", label),
      tooltip: (attr.tooltipNonNeg ?? "").replace("{{label}}", label),
    };
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {flowChip && (
        <span
          title={flowChip.tooltip}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--sanc-linen)] px-2 py-0.5 text-[10px] font-medium text-[var(--sanc-ink-soft)] border border-[var(--sanc-rule)]/60"
        >
          <Waves className="w-2.5 h-2.5 text-[var(--exec-green)]" />
          {flowChip.label}
        </span>
      )}
      {nonNegChip && (
        <span
          title={nonNegChip.tooltip}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--sanc-sand)] px-2 py-0.5 text-[10px] font-medium text-[var(--sanc-ink-soft)] border border-[var(--sanc-rule)]/60"
        >
          <Anchor className="w-2.5 h-2.5 text-[var(--exec-green)]" />
          {nonNegChip.label}
        </span>
      )}
    </div>
  );
}
