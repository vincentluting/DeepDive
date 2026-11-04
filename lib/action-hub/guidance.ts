// ============================================================
// Action Hub Guidance — phase, recommendation, and progress helpers
//
// Pure helpers shared by action-plan generation and the client Action Board.
// They keep "recommended next step" behavior deterministic and provide
// localized reason/outcome text from i18n templates.
// ============================================================

import type { ActionCategory } from "@/lib/db/action-hub";
import type { RankedAction } from "./priority-ranker";

export type PlanPhase = 1 | 2 | 3;

export interface GuidanceTemplates {
  reasonDefault: string;
  outcomeDefault: string;
  sourcePanel3Week1: string;
  matchedFlowReason: string;
  matchedNonNegReason: string;
  reasonByCategory: Record<ActionCategory, string>;
  outcomeByCategory: Record<ActionCategory, string>;
}

export interface GuidanceLabels {
  nonNegotiableLabels?: Record<string, string>;
  flowLabels?: Record<string, string>;
}

export interface ActionGuidance {
  recommendationReason: string;
  completionOutcome: string;
}

interface PhaseMilestone {
  phase: PlanPhase;
  actionIndices: number[];
}

interface GuidanceSource {
  category: ActionCategory;
  sourceDimension?: string | null;
  matchedNonNegotiable?: string | null;
  matchedFlowDimension?: {
    activity?: string;
    social?: string;
    environment?: string;
  } | null;
}

export interface ActionProgressItem {
  id: string;
  status: string;
  priority?: number | null;
  planPhase?: number | null;
}

export interface ActionProgressSummary {
  currentPhase: PlanPhase;
  totalPhases: 3;
  completed: number;
  total: number;
}

export function assignPlanPhases<T extends RankedAction>(
  actions: T[],
  milestones: PhaseMilestone[],
): Array<T & { planPhase: PlanPhase }> {
  const phaseByIndex = new Map<number, PlanPhase>();
  for (const milestone of milestones) {
    for (const index of milestone.actionIndices) {
      phaseByIndex.set(index, milestone.phase);
    }
  }

  return actions.map((action, index) => ({
    ...action,
    planPhase: phaseByIndex.get(index) ?? 3,
  }));
}

export function buildActionGuidance(
  item: GuidanceSource,
  templates: GuidanceTemplates,
  labels: GuidanceLabels = {},
): ActionGuidance {
  const nonNegotiableReason = getNonNegotiableReason(item, templates, labels);
  const flowReason = getFlowReason(item, templates, labels);
  const sourceReason =
    item.sourceDimension === "panel3_week1"
      ? templates.sourcePanel3Week1
      : null;

  return {
    recommendationReason:
      nonNegotiableReason ??
      flowReason ??
      sourceReason ??
      templates.reasonByCategory[item.category] ??
      templates.reasonDefault,
    completionOutcome:
      templates.outcomeByCategory[item.category] ?? templates.outcomeDefault,
  };
}

export function normalizePlanPhase(
  value: number | null | undefined,
  indexFallback = 0,
): PlanPhase {
  if (value === 1 || value === 2 || value === 3) return value;
  if (indexFallback < 3) return 1;
  if (indexFallback < 7) return 2;
  return 3;
}

export function getRecommendedAction<T extends ActionProgressItem>(
  items: T[],
): T | null {
  const active = sortByPhaseThenPriority(
    items.filter((item) => item.status === "in_progress"),
  )[0];
  if (active) return active;

  const pending = items.filter((item) => item.status === "pending");
  if (pending.length === 0) return null;

  const lowestPhase = Math.min(
    ...pending.map((item) => normalizePlanPhase(item.planPhase)),
  );
  return (
    sortByPhaseThenPriority(
      pending.filter(
        (item) => normalizePlanPhase(item.planPhase) === lowestPhase,
      ),
    )[0] ?? null
  );
}

export function getActionAlternatives<T extends ActionProgressItem>(
  items: T[],
  primaryId: string | null | undefined,
  maxItems: number,
): T[] {
  return sortByPhaseThenPriority(
    items.filter(
      (item) => item.status === "pending" && item.id !== primaryId,
    ),
  ).slice(0, maxItems);
}

export function summarizeActionProgress(
  items: ActionProgressItem[],
): ActionProgressSummary {
  const unresolved = items.filter(
    (item) => item.status !== "completed" && item.status !== "skipped",
  );
  const currentPhase =
    unresolved.length > 0
      ? normalizePlanPhase(
          Math.min(...unresolved.map((item) => normalizePlanPhase(item.planPhase))),
        )
      : 3;

  return {
    currentPhase,
    totalPhases: 3,
    completed: items.filter((item) => item.status === "completed").length,
    total: items.length,
  };
}

function getNonNegotiableReason(
  item: GuidanceSource,
  templates: GuidanceTemplates,
  labels: GuidanceLabels,
): string | null {
  if (!item.matchedNonNegotiable) return null;
  const label = labels.nonNegotiableLabels?.[item.matchedNonNegotiable];
  if (!label) return null;
  return replaceLabel(templates.matchedNonNegReason, label);
}

function getFlowReason(
  item: GuidanceSource,
  templates: GuidanceTemplates,
  labels: GuidanceLabels,
): string | null {
  const match = item.matchedFlowDimension;
  const flowId = match?.activity ?? match?.social ?? match?.environment;
  if (!flowId) return null;
  const label = labels.flowLabels?.[flowId] ?? flowId;
  return replaceLabel(templates.matchedFlowReason, label);
}

function replaceLabel(template: string, label: string): string {
  return template.replace("{{label}}", label);
}

function sortByPhaseThenPriority<T extends ActionProgressItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const phaseDiff =
      normalizePlanPhase(a.planPhase) - normalizePlanPhase(b.planPhase);
    if (phaseDiff !== 0) return phaseDiff;
    return (b.priority ?? 0) - (a.priority ?? 0);
  });
}
