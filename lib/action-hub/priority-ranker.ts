// ============================================================
// Priority Ranker — Score and rank action seeds
//
// Pure function — no DB, no LLM calls.
// Takes seeds from seed-extractor + user's assessment profile
// + optional exercise data (flow moments, non-negotiables) and
// produces a prioritized list of ActionItems ready for DB insertion.
//
// Scoring formula (weights rebalanced when exercise data exists):
//   finalScore = rawWeight × 0.45
//              + archetypeBoost × 0.15
//              + diversityBonus × 0.10
//              + urgencyBonus × 0.10
//              + flowBoost × 0.12
//              + nonNegBoost × 0.08
// Without exercises → falls back to original 4-factor split.
//
// Non-negotiable exclude matches hard-filter the seed (score = 0)
// before any ranking — we never push an action that violates a
// user's deal-breaker.
// ============================================================

import type { ActionSeed } from "./seed-extractor";
import type { ActionCategory, ActionIntensity } from "@/lib/db/action-hub";
import type {
  FlowActivityTag,
  FlowSocialTag,
  FlowEnvironmentTag,
  NonNegotiablesResult,
} from "./guided-exercises";
import { matchNonNegotiable, nonNegBoostWeight } from "./non-negotiable-rules";

export interface FlowPatterns {
  dominantActivity: FlowActivityTag | null;
  dominantSocial: FlowSocialTag | null;
  dominantEnvironment: FlowEnvironmentTag | null;
}

/** Which flow dimension matched a given item, if any. */
export interface MatchedFlowDimension {
  activity?: FlowActivityTag;
  social?: FlowSocialTag;
  environment?: FlowEnvironmentTag;
}

export interface RankerInput {
  seeds: ActionSeed[];
  /** User's 12-type archetype (e.g. 'R-enhancement') */
  archetype?: string | null;
  /** User's top RIASEC dimension */
  primaryRiasec?: string | null;
  /** Schwartz higher-order value polarity: 'explore' | 'anchor' */
  valuePolarity?: "explore" | "anchor" | null;
  /** Whether user has provided real conditions (Panel 3 data available) */
  hasRealConditions: boolean;
  /** Flow-exercise multi-dimension patterns (null if not completed) */
  flowPatterns?: FlowPatterns | null;
  /** User's 3 non-negotiables in priority order (null if not completed) */
  nonNegotiables?: NonNegotiablesResult["selected"] | null;
  /** Max items to return */
  maxItems?: number;
}

export interface RankedAction {
  title: string;
  description: string;
  category: ActionCategory;
  intensity: ActionIntensity;
  sourceDimension: string;
  estimatedMinutes: number;
  priority: number; // 0-100 integer score
  matchedNonNegotiable: string | null;
  matchedFlowDimension: MatchedFlowDimension | null;
}

/**
 * Rank seeds into a prioritized action list.
 */
export function rankSeeds(input: RankerInput): RankedAction[] {
  const {
    seeds,
    archetype,
    valuePolarity,
    hasRealConditions,
    flowPatterns,
    nonNegotiables,
    maxItems = 20,
  } = input;

  if (!seeds.length) return [];

  const hasFlow =
    !!flowPatterns &&
    (flowPatterns.dominantActivity !== null ||
      flowPatterns.dominantSocial !== null ||
      flowPatterns.dominantEnvironment !== null);
  const hasNonNeg = !!nonNegotiables && nonNegotiables.length === 3;

  // Track category counts for diversity bonus
  const categoryCounts = new Map<string, number>();

  const scored = seeds
    .map((seed) => {
      // ── Non-negotiable match (can hard-filter) ──
      const seedText = `${seed.title} ${seed.description}`;
      const nonNegMatch = hasNonNeg
        ? matchNonNegotiable(seedText, nonNegotiables)
        : null;

      // Hard filter: exclude matches zero the seed entirely
      if (nonNegMatch?.kind === "exclude") {
        return null;
      }

      // 1. Base weight (from extractor, 0-1)
      const rawWeight = Math.min(1, Math.max(0, seed.rawWeight));

      // 2. Archetype boost (0-1): boost items that match the user's archetype style
      const archetypeBoost = computeArchetypeBoost(
        seed,
        archetype,
        valuePolarity,
      );

      // 3. Diversity bonus: penalize repeated categories
      const catCount = categoryCounts.get(seed.category) ?? 0;
      const diversityBonus =
        catCount === 0 ? 1.0 : Math.max(0, 1.0 - catCount * 0.25);
      categoryCounts.set(seed.category, catCount + 1);

      // 4. Urgency bonus: boost if real conditions available (action-oriented items more urgent)
      let urgencyBonus = 0.5;
      if (
        hasRealConditions &&
        (seed.category === "apply" || seed.category === "network")
      ) {
        urgencyBonus = 1.0;
      } else if (!hasRealConditions && seed.category === "explore") {
        urgencyBonus = 0.9;
      }

      // 5. Flow multi-dimension boost + matched-tag capture
      const flowResult = computeFlowBoost(seed.category, flowPatterns ?? null);

      // 6. Non-negotiable soft boost
      const nonNegBoost =
        nonNegMatch?.kind === "boost"
          ? nonNegBoostWeight(nonNegMatch.priorityRank)
          : 0.5;

      // Weight split: fold in exercise-derived signals when present.
      let finalScore: number;
      if (hasFlow && hasNonNeg) {
        finalScore =
          rawWeight * 0.45 +
          archetypeBoost * 0.15 +
          diversityBonus * 0.1 +
          urgencyBonus * 0.1 +
          flowResult.boost * 0.12 +
          nonNegBoost * 0.08;
      } else if (hasFlow) {
        finalScore =
          rawWeight * 0.45 +
          archetypeBoost * 0.18 +
          diversityBonus * 0.12 +
          urgencyBonus * 0.12 +
          flowResult.boost * 0.13;
      } else if (hasNonNeg) {
        finalScore =
          rawWeight * 0.48 +
          archetypeBoost * 0.18 +
          diversityBonus * 0.13 +
          urgencyBonus * 0.13 +
          nonNegBoost * 0.08;
      } else {
        finalScore =
          rawWeight * 0.5 +
          archetypeBoost * 0.2 +
          diversityBonus * 0.15 +
          urgencyBonus * 0.15;
      }

      return {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        intensity: seed.intensity,
        sourceDimension: seed.sourceDimension,
        estimatedMinutes: seed.estimatedMinutes,
        priority: Math.round(finalScore * 100),
        matchedNonNegotiable:
          nonNegMatch?.kind === "boost" ? nonNegMatch.id : null,
        matchedFlowDimension:
          flowResult.matched && Object.keys(flowResult.matched).length > 0
            ? flowResult.matched
            : null,
      } satisfies RankedAction;
    })
    .filter((item): item is RankedAction => item !== null);

  // Sort by priority DESC
  scored.sort((a, b) => b.priority - a.priority);

  // Deduplicate similar titles (fuzzy)
  const seen = new Set<string>();
  const deduped = scored.filter((item) => {
    const key = normalizeForDedup(item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, maxItems);
}

// ── Archetype Boost Logic ─────────────────────────────────

/**
 * Boost actions that align with the user's archetype style.
 *
 * Explore archetypes → boost exploration, creative, networking
 * Anchor archetypes → boost learning, applying, reflecting
 */
function computeArchetypeBoost(
  seed: ActionSeed,
  archetype?: string | null,
  valuePolarity?: "explore" | "anchor" | null,
): number {
  if (!archetype && !valuePolarity) return 0.5; // Neutral

  const polarity =
    valuePolarity ?? (archetype?.includes("explore") ? "explore" : "anchor");

  if (polarity === "explore") {
    if (
      seed.category === "explore" ||
      seed.category === "create" ||
      seed.category === "network"
    )
      return 0.9;
    if (seed.category === "learn") return 0.6;
    return 0.4;
  }

  if (polarity === "anchor") {
    if (
      seed.category === "learn" ||
      seed.category === "apply" ||
      seed.category === "reflect"
    )
      return 0.9;
    if (seed.category === "network") return 0.6;
    return 0.4;
  }

  return 0.5;
}

// ── Flow Multi-dimension Boost ────────────────────────────
//
// Three dominant tags from Flow Moments map into category
// preferences. The boost is the max match across dimensions,
// and we capture which specific dimensions matched for UI chips.

const ACTIVITY_TO_CATEGORY: Record<FlowActivityTag, ActionCategory> = {
  creating: "create",
  analyzing: "learn",
  teaching: "network",
  organizing: "apply",
  fixing: "learn",
  performing: "create",
  connecting: "network",
  exploring: "explore",
};

const SOCIAL_TO_CATEGORY_BOOST: Record<
  FlowSocialTag,
  Partial<Record<ActionCategory, number>>
> = {
  alone: { learn: 0.95, reflect: 0.95, create: 0.8 },
  with_people: { network: 0.95, apply: 0.8, create: 0.7 },
  mixed: {},
};

const ENV_TO_CATEGORY_BOOST: Record<
  FlowEnvironmentTag,
  Partial<Record<ActionCategory, number>>
> = {
  quiet: { learn: 0.95, reflect: 0.9, create: 0.8 },
  lively: { network: 0.95, apply: 0.8 },
  outdoor: { explore: 0.95, reflect: 0.7 },
  online: { learn: 0.85, network: 0.8, apply: 0.75 },
};

function computeFlowBoost(
  category: ActionCategory,
  patterns: FlowPatterns | null,
): { boost: number; matched: MatchedFlowDimension } {
  if (!patterns) return { boost: 0.5, matched: {} };

  const matches: number[] = [];
  const matched: MatchedFlowDimension = {};

  // Activity dimension
  if (patterns.dominantActivity) {
    const mapped = ACTIVITY_TO_CATEGORY[patterns.dominantActivity];
    if (mapped === category) {
      matches.push(0.95);
      matched.activity = patterns.dominantActivity;
    } else {
      matches.push(0.4);
    }
  }

  // Social dimension
  if (patterns.dominantSocial) {
    const boost = SOCIAL_TO_CATEGORY_BOOST[patterns.dominantSocial][category];
    if (boost !== undefined) {
      matches.push(boost);
      if (boost >= 0.7) matched.social = patterns.dominantSocial;
    }
  }

  // Environment dimension
  if (patterns.dominantEnvironment) {
    const boost = ENV_TO_CATEGORY_BOOST[patterns.dominantEnvironment][category];
    if (boost !== undefined) {
      matches.push(boost);
      if (boost >= 0.7) matched.environment = patterns.dominantEnvironment;
    }
  }

  if (matches.length === 0) return { boost: 0.5, matched };

  // Take the max match — any strong alignment drives the boost
  const boost = Math.max(...matches);
  return { boost, matched };
}

// ── Dedup Helper ──────────────────────────────────────────

function normalizeForDedup(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "")
    .slice(0, 30);
}
