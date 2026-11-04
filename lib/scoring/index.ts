// ============================================================
// Scoring Engine — Pipeline Orchestration (v3.0)
// ============================================================
// v3.0: Three scoring modules (IPIP-60 + TwIVI + SJT), 86 items total.
//
// RIASEC is inherited from Quick Dive (not re-measured).
// Archetype (12-type) is computed inside the v3.0 pipeline using RIASEC + Schwartz value orientation.
// ============================================================

import type {
  RIASECDimension,
  BigFiveDimension,
  CognitiveStyleCode,
} from "../types";
import { buildArchetype, deriveValueOrientation } from "./riasec-utils";
import type { AssessmentResultV3 } from "../types/assessment";
import { scoreIPIP60 } from "./score-ipip60";
import { scoreDDVQ21 } from "./score-ddvq21";
import { scoreSJTGaps } from "./score-sjt";
import type { SJTAnswer } from "./score-sjt";
import { RUSH_THRESHOLD_MS } from "./constants";
import { mapBigFiveToCollabStyle } from "./layer3-derive";

// ============================================================
// Input Types
// ============================================================

/**
 * @deprecated v2.0 pipeline — use runScoringPipelineV3() for all new code.
 * Retained for Ultra Deep Dive future use and backward compatibility.
 */
export interface QuestionnaireAnswers {
  /** Module A: SJT answers (6 scenarios) */
  sjt: SJTAnswer[];
  /** Module B: values answers — item_id (1-21) → rating (1-6) */
  pvq: Record<number, number>;
  /** Module C: IPIP answers — item_id → rating (1-5) */
  ipip: Record<number, number>;
}

// ============================================================
// Cognitive Style Derivation from Big Five
// ============================================================

/**
 * Derive approximate cognitive style code from Big Five domain scores.
 * Letter mapping based on McCrae & Costa (1989):
 *   E/I: Extraversion (high E → 'E', low → 'I')
 *   S/N: Openness (high O → 'N', low → 'S')
 *   T/F: Agreeableness (high A → 'F', low → 'T')
 *   J/P: Conscientiousness (high C → 'J', low → 'P')
 *
 * `score` is normalized to 0-100 with midpoint 50; higher score = stronger
 * preference toward the LEFT pole letter (E for EI, S for SN, T for TF,
 * J for JP). This matches the convention the UI consumes
 * (`components/profile-panels/cognitive-style-breakdown.tsx`).
 *
 * EI/JP use forward normalization because their LEFT pole letter (E, J)
 * sits at the high end of the source domain. SN/TF use reverse
 * normalization because their LEFT pole letter (S, T) sits at the LOW end
 * — high openness yields 'N' (right pole), high agreeableness yields 'F'.
 */
export function deriveCognitiveStyleFromBigFive(
  domains: Record<BigFiveDimension, number>,
): CognitiveStyleCode {
  const midpoint = 3.0; // raw 1-5 scale midpoint

  const forward = (raw: number) =>
    Math.max(0, Math.min(100, ((raw - 1) / 4) * 100));
  const reverse = (raw: number) =>
    Math.max(0, Math.min(100, ((5 - raw) / 4) * 100));
  const isNear = (raw: number) => Math.abs(raw - midpoint) < 0.5;

  const axes = {
    EI: {
      score: forward(domains.extraversion),
      label: domains.extraversion >= midpoint ? "E" : "I",
      isNearMidpoint: isNear(domains.extraversion),
    },
    SN: {
      score: reverse(domains.openness),
      label: domains.openness >= midpoint ? "N" : "S",
      isNearMidpoint: isNear(domains.openness),
    },
    TF: {
      score: reverse(domains.agreeableness),
      label: domains.agreeableness >= midpoint ? "F" : "T",
      isNearMidpoint: isNear(domains.agreeableness),
    },
    JP: {
      score: forward(domains.conscientiousness),
      label: domains.conscientiousness >= midpoint ? "J" : "P",
      isNearMidpoint: isNear(domains.conscientiousness),
    },
  };

  const nearMidpointDimensions = (
    Object.entries(axes) as Array<
      [keyof typeof axes, (typeof axes)[keyof typeof axes]]
    >
  )
    .filter(([, info]) => info.isNearMidpoint)
    .map(([axis, info]) => ({
      axis: axis as "EI" | "SN" | "TF" | "JP",
      score: info.score,
    }));

  const displayMode =
    nearMidpointDimensions.length >= 2
      ? ("balanced" as const)
      : ("normal" as const);
  const code =
    displayMode === "balanced"
      ? null
      : `${axes.EI.label}${axes.SN.label}${axes.TF.label}${axes.JP.label}`;

  // Confidence: lower when near midpoints
  const clearAxes = 4 - nearMidpointDimensions.length;
  const confidence = clearAxes / 4;

  return {
    code,
    displayMode,
    ...(displayMode === "balanced" ? { nearMidpointDimensions } : {}),
    dimensions: {
      EI: {
        score: axes.EI.score,
        label: axes.EI.label,
        isNearMidpoint: axes.EI.isNearMidpoint,
      },
      SN: {
        score: axes.SN.score,
        label: axes.SN.label,
        isNearMidpoint: axes.SN.isNearMidpoint,
      },
      TF: {
        score: axes.TF.score,
        label: axes.TF.label,
        isNearMidpoint: axes.TF.isNearMidpoint,
      },
      JP: {
        score: axes.JP.score,
        label: axes.JP.label,
        isNearMidpoint: axes.JP.isNearMidpoint,
      },
    },
    confidence,
  };
}

// ============================================================
// v3.0 Input Types
// ============================================================

export interface QuestionnaireAnswersV3 {
  /** Module A: SJT answers (6 scenarios) */
  sjt: SJTAnswer[];
  /** Module B: TwIVI answers — item_id (1-21) → rating (1-6) */
  values: Record<number, number>;
  /** @deprecated Use `values` instead. Kept for backward compatibility with PVQ-21 payloads. */
  pvq?: Record<number, number>;
  /** Module C: IPIP-60 answers — item_id → rating (1-5), 60 items */
  ipip60: Record<number, number>;
}

export interface SessionMetadataV3 {
  sessionId: string;
  totalTimeMs: number;
  moduleTimes: {
    sjt: number;
    ddvq: number; // TwIVI module time
    ipip60: number; // IPIP-60 module time
  };
  /** Per-item response times for rush detection */
  itemResponseTimes?: {
    sjt?: Record<number, number>;
    ddvq?: Record<number, number>; // TwIVI item response times
    ipip60?: Record<number, number>; // IPIP-60 item response times
  };
}

// ============================================================
// v3.0 Pipeline Entry Point
// ============================================================

/**
 * Run the v3.0 scoring pipeline.
 *
 * Modules: IPIP-60 + TwIVI + SJT (86 items total).
 * Archetype is computed internally from RIASEC + Schwartz higher-order values.
 *
 * @param answers - All 86 answers grouped by module (`values` for TwIVI, `pvq` accepted for backward compat)
 * @param previousRiasec - RIASEC scores from Quick Dive (0-100)
 * @param metadata - Session timing metadata
 * @returns Complete AssessmentResultV3
 */
export function runScoringPipelineV3(
  answers: QuestionnaireAnswersV3,
  previousRiasec: Record<RIASECDimension, number>,
  metadata: SessionMetadataV3,
): AssessmentResultV3 {
  // Resolve values input: prefer `values`, fall back to deprecated `pvq`
  const valuesData = answers.values ?? answers.pvq;
  if (!valuesData || Object.keys(valuesData).length === 0) {
    throw new Error(
      "QuestionnaireAnswersV3 requires `values` (or deprecated `pvq`) field with TwIVI answers",
    );
  }

  // Run all three scoring modules (independent)
  const bigFive = scoreIPIP60(answers.ipip60);
  const schwartz = scoreDDVQ21(valuesData);
  const tensions = scoreSJTGaps(answers.sjt);

  // Derive value orientation from Schwartz RAW scores (Achievement+Power vs Benevolence+Universalism).
  // Uses raw means (not ipsatively centered) to maintain measurement invariance with Quick Dive,
  // which also uses raw means of the same 4 value types. Centering introduces MRAT bias from
  // 6 unrelated values (conformity, tradition, security, etc.) that can flip the binary orientation.
  // Ipsative centering remains in use for the full Schwartz profile (ranking, top3, higherOrder).
  // Hedonism excluded: ambiguous placement in Schwartz model, near-zero RIASEC discriminating power (Sagiv 2002).
  const enhancementScore =
    ((schwartz.raw.achievement ?? 0) + (schwartz.raw.power ?? 0)) / 2;
  const transcendenceScore =
    ((schwartz.raw.benevolence ?? 0) + (schwartz.raw.universalism ?? 0)) / 2;
  const valueResult = deriveValueOrientation(
    enhancementScore,
    transcendenceScore,
  );

  // Compute 12-type Archetype from RIASEC primary + value orientation
  const archetypeResult = buildArchetype(
    previousRiasec,
    valueResult.orientation,
    valueResult.scores,
  );

  // Count rush responses
  const rushCount = countRushResponsesV3(metadata.itemResponseTimes);

  // Count answered questions
  const answeredQuestions =
    answers.sjt.length +
    Object.keys(valuesData).length +
    Object.keys(answers.ipip60).length;

  // Derive cognitive style from Big Five (standard-level)
  const cognitiveStyleCode = deriveCognitiveStyleFromBigFive(bigFive.domains);

  // Derive Collaboration Style from Big Five (standard-level)
  const collabStyleResult = mapBigFiveToCollabStyle(
    bigFive.domains,
    bigFive.facets,
  );

  return {
    id: crypto.randomUUID(),
    sessionId: metadata.sessionId,
    timestamp: new Date().toISOString(),
    questionnaireVersion: "3.0",

    // Module C: IPIP-60 (standard level)
    bigFive: {
      domains: bigFive.domains,
      facets: bigFive.facets,
      domainsNormalized: bigFive.domainsNormalized,
      precision: bigFive.precision,
    },

    // Module B: TwIVI
    schwartz: {
      raw: schwartz.raw,
      centered: schwartz.centered,
      higherOrder: schwartz.higherOrder,
      ranking: schwartz.ranking,
      top3: schwartz.top3,
    },

    // Module A: SJT
    tensions: {
      scenarios: tensions.scenarios,
      overallConsistency: tensions.overallConsistency,
      notableTensions: tensions.notableTensions,
    },

    // RIASEC inherited from Quick Dive; archetype from RIASEC score distribution
    riasecNormalized: previousRiasec,
    archetype: archetypeResult,

    // Optional derivations
    cognitiveStyleCode,
    collabMapping: collabStyleResult,

    // Quality metadata
    meta: {
      totalQuestions: 86,
      answeredQuestions,
      totalTimeMs: metadata.totalTimeMs,
      rushCount,
      moduleTimes: metadata.moduleTimes,
    },
  };
}

// ============================================================
// v3.0 Rush Detection
// ============================================================

function countRushResponsesV3(
  itemResponseTimes?: SessionMetadataV3["itemResponseTimes"],
): number {
  if (!itemResponseTimes) return 0;

  let count = 0;

  if (itemResponseTimes.sjt) {
    for (const ms of Object.values(itemResponseTimes.sjt)) {
      if (ms > 0 && ms < RUSH_THRESHOLD_MS.sjt) count++;
    }
  }

  if (itemResponseTimes.ddvq) {
    for (const ms of Object.values(itemResponseTimes.ddvq)) {
      if (ms > 0 && ms < RUSH_THRESHOLD_MS.pvq) count++;
    }
  }

  if (itemResponseTimes.ipip60) {
    for (const ms of Object.values(itemResponseTimes.ipip60)) {
      if (ms > 0 && ms < RUSH_THRESHOLD_MS.ipip) count++;
    }
  }

  return count;
}

// ═══════════════════════════════════════════════════════════════
// Re-exports
// ═══════════════════════════════════════════════════════════════

export { scoreIPIP60 } from "./score-ipip60";
export { scoreDDVQ21 } from "./score-ddvq21";
export { scoreSJTGaps } from "./score-sjt";
export { mapBigFiveToCollabStyle } from "./layer3-derive";
export type { SJTAnswer } from "./score-sjt";
export type { IPIP60Result } from "./score-ipip60";
export type { DDVQ21Result } from "./score-ddvq21";
export type { SJTResult } from "./score-sjt";
