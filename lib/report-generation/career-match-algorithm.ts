// ============================================================
// Career Match Algorithm Layer — Report Generation Wrapper
//
// Thin wrapper around the unified career exploration engine.
// Adds report-specific concerns:
//   - Maps engine output → CandidateDirection format
//   - Generates structured MatchInsights for LLM prompts
//   - Applies reality constraint filtering
//
// The actual scoring is done by lib/career-matching/engine.ts.
// ============================================================

import type {
  AssessmentInput,
  ProfileAlgorithmOutput,
  RealConditions,
  RIASECDimension,
  BigFiveDimension,
} from "../types";
import {
  type CareerDirectionTemplate,
  filterByIndustry,
  filterBySeniority,
} from "../types/report";
import {
  getGroupBigFive,
  getGroupValues,
} from "../content/soc-group-annotations";
import type {
  MatchScore,
  MatchInsight,
  MatchSignal,
  CareerMatchAlgorithmOutput,
  CandidateDirection,
} from "./types";
import { explore, type UserProfile } from "../career-matching";
import { getCareerPool } from "../career-matching/career-pool";
import {
  MAX_PER_RIASEC_GROUP,
  riasecPairKey,
  selectWithQuota,
} from "./diversity-quota";

/** Number of primary directions with deep LLM narratives (3+2 architecture, see docs/reference/career-recommendations-quantity-research.md) */
const PRIMARY_DIRECTIONS_COUNT = 3;

/** Number of exploratory directions with algorithm-only text */
const EXPLORATORY_DIRECTIONS_COUNT = 2;

/** Number of top ideal directions to return (before filtering) */
const TOP_IDEAL_DIRECTIONS_COUNT = 8;

/** Number of AI-era opportunity directions to return */
const AI_ERA_DIRECTIONS_COUNT = 3;

// ── Profile Adapter ──────────────────────────────────────────

/**
 * Build a UserProfile for the exploration engine from assessment + algorithm data.
 */
function buildUserProfile(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  realConditions: RealConditions | null,
): UserProfile {
  return {
    riasec: assessment.riasecNormalized,
    bigFive: algo.bigFiveDomains,
    schwartz: {
      top3: algo.schwartz.top3 as string[],
      centered: algo.schwartz.centered as Record<string, number>,
    },
    // collab is available if the profile has been generated
    // (it's derived from Big Five facets during profile generation)
    industry: realConditions
      ? {
          currentIndustry: realConditions.currentIndustry,
          interestedIndustries: realConditions.interestedIndustries,
        }
      : undefined,
  };
}

// ── Dimension labels for insight text ────────────────────────

const RIASEC_LABELS: Record<RIASECDimension, { en: string; zh: string }> = {
  R: { en: "Realistic (hands-on building)", zh: "现实型（动手构建）" },
  I: { en: "Investigative (analytical thinking)", zh: "研究型（分析思考）" },
  A: { en: "Artistic (creative expression)", zh: "艺术型（创意表达）" },
  S: { en: "Social (helping others)", zh: "社会型（助人连接）" },
  E: { en: "Enterprising (leading & persuading)", zh: "企业型（引领说服）" },
  C: {
    en: "Conventional (organizing & structuring)",
    zh: "常规型（组织结构）",
  },
};

const BIG_FIVE_LABELS: Record<BigFiveDimension, { en: string; zh: string }> = {
  openness: { en: "Openness", zh: "开放性" },
  conscientiousness: { en: "Conscientiousness", zh: "尽责性" },
  extraversion: { en: "Extraversion", zh: "外向性" },
  agreeableness: { en: "Agreeableness", zh: "宜人性" },
  neuroticism: { en: "Neuroticism", zh: "神经质" },
};

/**
 * Generate structured match insights for a candidate direction.
 * Explains WHY the scores are what they are, so LLM only writes prose.
 */
function generateInsights(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  direction: CareerDirectionTemplate,
  _score: MatchScore,
): MatchInsight {
  const signals: MatchSignal[] = [];

  // ── RIASEC insight: find the strongest aligned dimension ──
  const dims: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];
  const riasecPairs = dims.map((d) => ({
    dim: d,
    user: assessment.riasecNormalized[d],
    ideal: direction.idealRIASEC[d],
  }));
  const topIdealDims = [...riasecPairs]
    .sort((a, b) => b.ideal - a.ideal)
    .slice(0, 2);

  for (const { dim, user, ideal } of topIdealDims) {
    const diff = Math.abs(user - ideal);
    const label = RIASEC_LABELS[dim];
    if (diff <= 20 && ideal >= 40) {
      signals.push({
        factor: "riasec",
        dimension: dim,
        userScore: user,
        signal: diff <= 10 ? "strong_match" : "moderate_match",
        detail_en: `Your ${label.en} score (${user}) closely matches this direction's need (${ideal})`,
        detail_zh: `你的${label.zh}得分（${user}）与该方向需求（${ideal}）高度吻合`,
      });
    } else if (user < ideal - 20 && ideal >= 50) {
      signals.push({
        factor: "riasec",
        dimension: dim,
        userScore: user,
        signal: "growth_edge",
        detail_en: `This direction values ${label.en} (${ideal}) more than your current profile shows (${user})`,
        detail_zh: `该方向重视${label.zh}（${ideal}），高于你当前水平（${user}）`,
      });
    }
  }

  // ── Value insight ──
  const effectiveValues =
    direction.alignedValues.length > 0
      ? direction.alignedValues
      : (getGroupValues(direction.id) ?? []);
  const userTop3 = algo.schwartz.top3 as string[];
  const matchedValues = userTop3.filter((v) => effectiveValues.includes(v));
  const unmatchedDirectionValues = effectiveValues.filter(
    (v) => !userTop3.includes(v),
  );

  if (matchedValues.length >= 2) {
    signals.push({
      factor: "value",
      dimension: matchedValues.join("+"),
      signal: "strong_match",
      detail_en: `${matchedValues.length} of your top 3 values (${matchedValues.join(", ")}) align with this direction`,
      detail_zh: `你的核心价值观中有${matchedValues.length}项（${matchedValues.join("、")}）与该方向契合`,
    });
  } else if (matchedValues.length === 1) {
    signals.push({
      factor: "value",
      dimension: matchedValues[0],
      signal: "moderate_match",
      detail_en: `Your value anchor "${matchedValues[0]}" aligns with this direction`,
      detail_zh: `你的价值锚"${matchedValues[0]}"与该方向契合`,
    });
  } else if (unmatchedDirectionValues.length > 0) {
    signals.push({
      factor: "value",
      dimension: unmatchedDirectionValues[0],
      signal: "growth_edge",
      detail_en: `This direction emphasizes "${unmatchedDirectionValues[0]}" which isn't in your top 3 values`,
      detail_zh: `该方向强调"${unmatchedDirectionValues[0]}"，但这不在你的前三价值观中`,
    });
  }

  // ── Personality (Big Five) insight ──
  const hasOwnBigFive = Object.keys(direction.idealBigFive).length > 0;
  const effectiveBigFive = hasOwnBigFive
    ? direction.idealBigFive
    : (getGroupBigFive(direction.id) ?? {});
  const bigFiveDims = Object.keys(effectiveBigFive) as BigFiveDimension[];

  for (const dim of bigFiveDims) {
    const range = effectiveBigFive[dim];
    if (!range) continue;
    const userScore = algo.bigFiveDomains[dim];
    const label = BIG_FIVE_LABELS[dim];

    if (userScore >= range.min && userScore <= range.max) {
      signals.push({
        factor: "personality",
        dimension: dim,
        userScore,
        idealRange: range,
        signal: "strong_match",
        detail_en: `Your ${label.en} (${userScore}) falls within the ideal range [${range.min}-${range.max}]`,
        detail_zh: `你的${label.zh}（${userScore}）在理想区间 [${range.min}-${range.max}] 内`,
      });
    } else {
      const distance =
        userScore < range.min ? range.min - userScore : userScore - range.max;
      signals.push({
        factor: "personality",
        dimension: dim,
        userScore,
        idealRange: range,
        signal: distance <= 10 ? "moderate_match" : "growth_edge",
        detail_en:
          userScore < range.min
            ? `Your ${label.en} (${userScore}) is below the typical range [${range.min}-${range.max}] for this field`
            : `Your ${label.en} (${userScore}) is above the typical range [${range.min}-${range.max}] for this field`,
        detail_zh:
          userScore < range.min
            ? `你的${label.zh}（${userScore}）低于该领域典型区间 [${range.min}-${range.max}]`
            : `你的${label.zh}（${userScore}）高于该领域典型区间 [${range.min}-${range.max}]`,
      });
    }
  }

  // ── Sort into strengths vs gaps ──
  const strengths = signals
    .filter((s) => s.signal === "strong_match" || s.signal === "moderate_match")
    .sort(
      (a, b) =>
        (a.signal === "strong_match" ? -1 : 1) -
        (b.signal === "strong_match" ? -1 : 1),
    )
    .slice(0, 3);

  const gaps = signals.filter((s) => s.signal === "growth_edge").slice(0, 2);

  return { strengths, gaps };
}

// ── Main Entry Point ─────────────────────────────────────────

/**
 * Compute career match algorithm output for report generation.
 *
 * Uses the unified exploration engine for scoring, then adds
 * report-specific formatting (CandidateDirection, MatchInsight).
 */
export async function computeCareerMatchAlgorithm(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  realConditions: RealConditions | null,
  options?: {
    /** User's target O*NET Job Zone band. Defaults to {min:4, max:5}
     *  (white-collar). Pass `null` to disable tier-aware ranking
     *  (e.g. for thesis analysis on an un-penalized pool). */
    targetTier?: { min: number; max: number } | null;
  },
): Promise<CareerMatchAlgorithmOutput> {
  // Build user profile for the unified engine (includes industry preferences if available)
  const profile = buildUserProfile(assessment, algo, realConditions);

  // Score all careers using the unified engine (full precision)
  // explore() internally awaits ensureCareerPoolLoaded() — no cold-start risk
  const explorationResult = await explore(profile, {
    count: TOP_IDEAL_DIRECTIONS_COUNT,
    // Pass targetTier through — `undefined` keeps engine default (4-5);
    // `null` opts out entirely.
    ...(options?.targetTier !== undefined
      ? { targetTier: options.targetTier }
      : {}),
  });

  // Build a lookup for career templates (needed for CandidateDirection metadata + insights)
  const directionLookup = new Map(getCareerPool().map((d) => [d.id, d]));

  // Map ScoredCareer → CandidateDirection
  const mapToCandidate = (
    scored: typeof explorationResult.allScored,
  ): CandidateDirection[] =>
    scored.map((s) => {
      const template = directionLookup.get(s.id);
      return {
        direction: {
          id: s.id,
          title_zh: s.title_zh,
          title_en: s.title_en,
          subtitle_zh: template?.subtitle_zh ?? "",
          alignedValues: template?.alignedValues ?? [],
          industries: template?.industries ?? [],
          crossCulturalFit: template?.crossCulturalFit ?? [],
          aiEraCategory: template?.aiEraCategory,
          aiExposureScore: s.aiExposureScore ?? template?.aiExposureScore,
          aiImpactLabel: s.aiImpactLabel ?? template?.aiImpactLabel,
          annotationSource: template?.annotationSource ?? "ai-assisted",
          annotationConfidence:
            template?.annotationConfidence ?? "expert-estimated",
          lastReviewedAt: template?.lastReviewedAt ?? "",
          marketOutlook: s.marketOutlook,
          resilienceLevel: s.resilienceLevel,
          jobZone: s.jobZone ?? null,
        },
        score: {
          total: s.totalScore,
          breakdown: {
            interestFit: s.factors.interestFit.score,
            valueFit: s.factors.valueFit.score,
            personalityFit: s.factors.personalityFit.score,
            adaptabilityFit: s.factors.adaptabilityFit.score,
            collabFit: s.factors.collabFit.available
              ? s.factors.collabFit.score
              : undefined,
            industryFit: s.factors.industryFit.available
              ? s.factors.industryFit.score
              : undefined,
          },
        },
        inTargetTier: s.inTargetTier,
        tierGap: s.tierGap,
      };
    });

  // Ideal candidates: top N from unfiltered pool
  const allCandidates = mapToCandidate(explorationResult.allScored);
  const idealCandidates = allCandidates.slice(0, TOP_IDEAL_DIRECTIONS_COUNT);

  // Apply reality constraint filtering for final candidates
  let filteredCandidates = allCandidates;
  if (realConditions) {
    let filteredPool = [...getCareerPool()];
    if (
      realConditions.interestedIndustries.length > 0 &&
      !realConditions.interestedIndustries.includes("recommend_for_me")
    ) {
      const industryFiltered = filterByIndustry(
        filteredPool,
        realConditions.interestedIndustries,
      );
      if (industryFiltered.length >= 10) filteredPool = industryFiltered;
    }
    const seniorityFiltered = filterBySeniority(
      filteredPool,
      realConditions.experienceYears,
    );
    if (seniorityFiltered.length >= 10) filteredPool = seniorityFiltered;

    const filteredIds = new Set(filteredPool.map((d) => d.id));
    filteredCandidates = allCandidates.filter((c) =>
      filteredIds.has(c.direction.id),
    );
  }

  // 3+2 architecture: 3 primary (deep LLM narratives) + 2 exploratory (algorithm-only)
  //
  // Tier-aware split (added 2026-05-18):
  //   - Primary 3 are drawn first from `inTargetTier: true` candidates so the
  //     user's main recommendations match their professional level. If
  //     fewer than 3 in-band candidates exist (rare), fall back to overall
  //     top-ranked candidates.
  //   - Exploratory 2 are drawn first from `inTargetTier: false` candidates,
  //     giving the user explicit cross-tier exploration ("you could try X
  //     even though it's a different professional level"). Falls back to
  //     overall top-ranked candidates if there are no cross-tier options.
  //
  // When `targetTier === null` (caller opted out) every candidate is treated
  // as in-band → behavior degrades gracefully to the pre-2026-05 logic.
  const inTier = filteredCandidates.filter((c) => c.inTargetTier !== false);
  const crossTier = filteredCandidates.filter((c) => c.inTargetTier === false);

  // Diversity quota: cap same-RIASEC-family careers across the 5 main slots
  // so converging score profiles can't fill every slot with near-identical
  // roles. Falls back to pure rank order whenever the quota can't be met.
  const quotaKeyOf = (c: CandidateDirection): string => {
    const template = directionLookup.get(c.direction.id);
    // Unknown template → its own group, never capped.
    return template
      ? riasecPairKey(template.idealRIASEC)
      : `solo:${c.direction.id}`;
  };
  const quotaIdOf = (c: CandidateDirection): string => c.direction.id;
  const mainSlotGroupCounts = new Map<string, number>();

  const primaryCandidates = selectWithQuota([inTier, filteredCandidates], {
    count: PRIMARY_DIRECTIONS_COUNT,
    keyOf: quotaKeyOf,
    idOf: quotaIdOf,
    maxPerGroup: MAX_PER_RIASEC_GROUP,
    groupCounts: mainSlotGroupCounts,
  });

  const primaryIds = new Set(primaryCandidates.map((c) => c.direction.id));
  const exploratoryCandidates = selectWithQuota(
    [crossTier, filteredCandidates],
    {
      count: EXPLORATORY_DIRECTIONS_COUNT,
      keyOf: quotaKeyOf,
      idOf: quotaIdOf,
      maxPerGroup: MAX_PER_RIASEC_GROUP,
      groupCounts: mainSlotGroupCounts,
      excludeIds: primaryIds,
    },
  );

  // Generate structured insights for all top candidates
  const addInsights = (
    candidates: CandidateDirection[],
  ): CandidateDirection[] =>
    candidates.map((c) => {
      const template = directionLookup.get(c.direction.id);
      if (!template) return c;
      return {
        ...c,
        insights: generateInsights(assessment, algo, template, c.score),
      };
    });

  // AI-era candidates: top matches from ai-native + augmented pool (excluding duplicates from primary+exploratory)
  const allTopIds = new Set(
    [...primaryCandidates, ...exploratoryCandidates].map((c) => c.direction.id),
  );
  const aiEraEligible = allCandidates.filter((c) => {
    const cat = c.direction.aiEraCategory;
    return (
      (cat === "ai-native" || cat === "augmented") &&
      !allTopIds.has(c.direction.id)
    );
  });
  // Independent group counter: this section renders as its own UI block, and
  // sharing the main-slot budget would block AI-era roles whose RIASEC family
  // already filled its main-slot quota — defeating the section's purpose.
  const aiEraCandidates = selectWithQuota([aiEraEligible], {
    count: AI_ERA_DIRECTIONS_COUNT,
    keyOf: quotaKeyOf,
    idOf: quotaIdOf,
    maxPerGroup: MAX_PER_RIASEC_GROUP,
    groupCounts: new Map<string, number>(),
  });

  return {
    candidates: addInsights(primaryCandidates),
    exploratoryCandidates: addInsights(exploratoryCandidates),
    idealCandidates: addInsights(idealCandidates),
    aiEraCandidates: addInsights(aiEraCandidates),
  };
}
