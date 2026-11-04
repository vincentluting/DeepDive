// ============================================================
// Generate Action Plan — Orchestrator
//
// Called after report generation to create a prioritized action plan.
// Steps:
//   1. Extract seeds from report (pure algorithm)
//   2. Rank seeds using assessment profile + exercise data (pure algorithm)
//   3. Compute plan tier based on exercise completeness
//   4. (Personal tier only) Enrich action copy + guidance via LLM; falls back
//      transparently on any LLM failure.
//   5. Create ActionPlan + ActionItems in DB (with matched-tag attribution).
//
// Three tiers of plan quality:
//   - lite:     no guided exercises completed → generic plan
//   - deep:     one exercise completed → one dimension of personalization
//   - personal: both exercises completed → both dimensions + LLM polish
//
// Algorithmic generation is always the authoritative source of truth.
// LLM only rewrites copy/guidance; ranking, category, priority, phases, and
// matched-tag attribution all come from the pure-function pipeline.
// ============================================================

import { extractSeeds } from "./seed-extractor";
import { rankSeeds, type FlowPatterns } from "./priority-ranker";
import { buildMilestones } from "./milestone-builder";
import {
  assignPlanPhases,
  buildActionGuidance,
  type GuidanceTemplates,
} from "./guidance";
import {
  createActionPlan,
  createActionItem,
  createActionMilestone,
  deleteActionPlanCascade,
} from "@/lib/db/action-hub";
import type { CareerReport } from "@/lib/types/report";
import type { NonNegotiablesResult, FlowMomentEntry } from "./guided-exercises";
import {
  enrichActionPlan,
  applyEnrichment,
  type EnrichLocale,
} from "./llm-enrich";

export type ActionPlanTier = "lite" | "deep" | "personal";

interface GenerateActionPlanParams {
  userId: string;
  reportId: string;
  report: CareerReport;
  /** User's 12-type archetype (e.g. 'R-enhancement') */
  archetype?: string | null;
  /** User's top RIASEC dimension */
  primaryRiasec?: string | null;
  /** Schwartz higher-order value polarity */
  valuePolarity?: "explore" | "anchor" | null;
  /** Full flow-moment pattern (null if exercise not completed) */
  flowPatterns?: FlowPatterns | null;
  /** Raw flow moments — used for LLM enrichment context (personal tier) */
  flowMoments?: FlowMomentEntry[] | null;
  /** User's 3 non-negotiables in priority order (null if exercise not completed) */
  nonNegotiables?: NonNegotiablesResult["selected"] | null;
  /** i18n-resolved labels for each non-neg ID (personal tier only) */
  nonNegotiableLabels?: Record<string, string>;
  /** i18n-resolved guidance templates for persisted next-step copy */
  guidanceTemplates: GuidanceTemplates;
  /** i18n-resolved labels for flow tags used in guidance copy */
  flowLabels?: Record<string, string>;
}

interface GenerateActionPlanResult {
  planId: string;
  itemCount: number;
  milestoneCount: number;
  tier: ActionPlanTier;
  /** Whether LLM enrichment actually ran and produced content */
  llmEnriched: boolean;
}

/**
 * Tier determines both plan depth (6 / 8 / 10 items) and whether
 * LLM enrichment runs. Completeness = each exercise has valid data.
 */
function computeTier(
  flowPatterns: FlowPatterns | null | undefined,
  nonNegotiables: NonNegotiablesResult["selected"] | null | undefined,
): ActionPlanTier {
  const hasFlow =
    !!flowPatterns &&
    (flowPatterns.dominantActivity !== null ||
      flowPatterns.dominantSocial !== null ||
      flowPatterns.dominantEnvironment !== null);
  const hasNonNeg = !!nonNegotiables && nonNegotiables.length === 3;

  if (hasFlow && hasNonNeg) return "personal";
  if (hasFlow || hasNonNeg) return "deep";
  return "lite";
}

const TIER_TO_MAX_ITEMS: Record<ActionPlanTier, number> = {
  lite: 6,
  deep: 8,
  personal: 10,
};

function toEnrichLocale(locale: string | null | undefined): EnrichLocale {
  if (locale === "zh" || locale === "nl") return locale;
  return "en";
}

/**
 * Generate a new action plan from a career report.
 */
export async function generateActionPlan(
  params: GenerateActionPlanParams,
): Promise<GenerateActionPlanResult> {
  const {
    userId,
    reportId,
    report,
    archetype,
    primaryRiasec,
    valuePolarity,
    flowPatterns,
    flowMoments,
    nonNegotiables,
    nonNegotiableLabels,
    guidanceTemplates,
    flowLabels,
  } = params;

  const tier = computeTier(flowPatterns, nonNegotiables);
  const maxItems = TIER_TO_MAX_ITEMS[tier];

  // 1. Extract seeds from report
  const seeds = extractSeeds(report);

  // 2. Rank (exercise data influences ranking + matched-tag attribution when available)
  const ranked = rankSeeds({
    seeds,
    archetype,
    primaryRiasec,
    valuePolarity,
    hasRealConditions: report.careerPathway?.realConditionsProvided ?? false,
    flowPatterns: flowPatterns ?? null,
    nonNegotiables: nonNegotiables ?? null,
    maxItems,
  });

  const locale = report.locale ?? "en";
  const milestones = buildMilestones(ranked, locale);
  const phased = assignPlanPhases(ranked, milestones);
  const guided = phased.map((item) => ({
    ...item,
    ...buildActionGuidance(item, guidanceTemplates, {
      nonNegotiableLabels,
      flowLabels,
    }),
  }));

  // Generate stable IDs up-front so LLM enrichment can reference them.
  const itemsWithIds = guided.map((r) => ({ id: crypto.randomUUID(), ...r }));

  // 3. Personal tier only — attempt LLM enrichment; always safe to fall back.
  let llmEnriched = false;
  let finalItems: typeof itemsWithIds = itemsWithIds;
  if (
    tier === "personal" &&
    flowMoments &&
    flowMoments.length === 3 &&
    nonNegotiables &&
    nonNegotiableLabels
  ) {
    const locale = toEnrichLocale(report.locale);
    const enrichment = await enrichActionPlan({
      locale,
      archetype: archetype ?? null,
      flowMoments,
      flowDominance: {
        activity: flowPatterns?.dominantActivity ?? null,
        social: flowPatterns?.dominantSocial ?? null,
        environment: flowPatterns?.dominantEnvironment ?? null,
      },
      nonNegotiables,
      nonNegotiableLabels,
      items: itemsWithIds,
    });
    if (enrichment) {
      finalItems = applyEnrichment(itemsWithIds, enrichment);
      llmEnriched = true;
    }
  }

  // 4-6. Persist plan + items + milestones. The neon HTTP driver gives no
  // interactive transaction across these writes, so on any failure we
  // compensate by hard-deleting the partial plan — never leave an orphan
  // (the failure mode we hit when ActionItem inserts threw on schema drift).
  const planId = crypto.randomUUID();
  try {
    await createActionPlan({
      id: planId,
      userId,
      reportId,
      contextJson: {
        archetype: archetype ?? null,
        primaryRiasec: primaryRiasec ?? null,
        valuePolarity: valuePolarity ?? null,
        seedCount: seeds.length,
        locale: report.locale,
        tier,
        llmEnriched,
        dominantFlowActivity: flowPatterns?.dominantActivity ?? null,
        dominantFlowSocial: flowPatterns?.dominantSocial ?? null,
        dominantFlowEnvironment: flowPatterns?.dominantEnvironment ?? null,
        nonNegotiables: nonNegotiables ?? null,
      },
      locale: report.locale,
    });

    // 5. Create action items (enriched if personal tier succeeded, otherwise algorithmic)
    for (const item of finalItems) {
      await createActionItem({
        id: item.id,
        planId,
        userId,
        title: item.title,
        description: item.description,
        category: item.category,
        intensity: item.intensity,
        priority: item.priority,
        estimatedMinutes: item.estimatedMinutes,
        sourceDimension: item.sourceDimension,
        planPhase: item.planPhase,
        recommendationReason: item.recommendationReason,
        completionOutcome: item.completionOutcome,
        matchedNonNegotiable: item.matchedNonNegotiable ?? null,
        matchedFlowDimension: item.matchedFlowDimension ?? null,
      });
    }

    // 6. Create milestones
    for (const milestone of milestones) {
      const title =
        locale === "zh"
          ? milestone.title_zh
          : locale === "nl"
            ? milestone.title_nl
            : milestone.title_en;
      const description =
        locale === "zh"
          ? milestone.description_zh
          : locale === "nl"
            ? milestone.description_nl
            : milestone.description_en;

      await createActionMilestone({
        id: crypto.randomUUID(),
        planId,
        title,
        description,
        targetDay: milestone.targetDay,
      });
    }
  } catch (err) {
    // Roll back the partial plan so a mid-flight failure never strands an
    // orphaned empty plan; best-effort cleanup, then re-throw the original error.
    await deleteActionPlanCascade(planId).catch(() => {});
    throw err;
  }

  return {
    planId,
    itemCount: finalItems.length,
    milestoneCount: milestones.length,
    tier,
    llmEnriched,
  };
}
