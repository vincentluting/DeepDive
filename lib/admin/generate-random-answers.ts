// ============================================================
// Admin Auto-Fill — Random Answer Generators
//
// Quick Dive: Likert 1-4 generator + server-side result
//                computation (mirrors client computeResult).
// Deep Dive v3.0: SJT + TwIVI + IPIP-60 generators
//                 + v3.0 metadata keys.
// ============================================================

import type {
  QuickDiveQuestionData,
  RiasecKey,
} from "@/components/quickdive/quickdive-data";
import {
  findLabel,
  CAREERS,
  DRAIN,
} from "@/components/quickdive/quickdive-data";
import type { SJTAnswer } from "@/lib/scoring/score-sjt";
import type {
  QuestionnaireAnswersV3,
  SessionMetadataV3,
} from "@/lib/scoring/index";
import { IPIP_60_ITEM_IDS } from "@/lib/questionnaire/module-c-ipip-neo60";
import {
  normalizeRiasecScores as _normalizeRiasecScores,
  buildArchetype as _buildArchetype,
} from "@/lib/scoring/riasec-utils";
import {
  QUICK_TWIVI_ITEMS,
  computeQuickValueOrientation,
} from "@/lib/assessment/twivi-quick";

// ── Helpers ─────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Quick Dive: Likert Answer Generator ──────────────────

type RiasecScores = Record<RiasecKey, number>;

/**
 * Generate random Likert answers (1-4) for Quick Dive questions.
 * Returns accumulated RIASEC scores (same value used for both
 * weighted and raw since QE has no weighting layer).
 */
export function generateQuickDiveAnswers(questions: QuickDiveQuestionData[]): {
  scores: RiasecScores;
  rawScores: RiasecScores;
} {
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const rawScores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const q of questions) {
    const value = randomInt(0, 4) as 0 | 1 | 2 | 3 | 4;
    const key = q.riasec;
    scores[key] += value;
    rawScores[key] += value;
  }

  return { scores, rawScores };
}

// ── Quick Dive: Server-Side Result Computation ───────────

/**
 * Compute Quick Dive result on the server.
 * Mirrors the client-side computeResult() in quick-dive-shell.tsx.
 */
export function computeQuickDiveResult(
  scores: RiasecScores,
  rawScores: RiasecScores,
  locale: string,
): {
  code: string;
  label: string;
  resultData: Record<string, unknown>;
} {
  const isZh = locale === "zh";

  // Sort by weighted scores for code determination
  const weightedSorted = (Object.entries(scores) as [string, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const [first, second, third] = weightedSorted.map((s) => s[0]);
  const lowest = weightedSorted[weightedSorted.length - 1][0];
  const secondLowest = weightedSorted[weightedSorted.length - 2]?.[0] || lowest;
  // 12-type archetype from RIASEC + random TwIVI value orientation
  const riasecNormalized = _normalizeRiasecScores(scores);
  const randomValueAnswers = generateRandomQuickTwIVIAnswers();
  const valueResult = computeQuickValueOrientation(randomValueAnswers);
  const archetype = _buildArchetype(
    riasecNormalized,
    valueResult.orientation,
    valueResult.scores,
  );
  const code = archetype.code;
  const labelData = findLabel(code)!;

  // Sort raw scores for display
  const sorted = (Object.entries(rawScores) as [string, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  // Career/drain lookups
  const getCareers = (key: string, idx: number) => {
    const list = CAREERS[key] || [];
    const item = list[idx];
    return item ? (isZh ? item.zh : item.en) : null;
  };
  const getDrains = (key: string, idx: number) => {
    const list = DRAIN[key] || [];
    const item = list[idx];
    return item ? (isZh ? item.zh : item.en) : null;
  };

  const top = [
    getCareers(first, 0),
    getCareers(first, 1),
    getCareers(second, 0),
  ].filter(Boolean) as string[];
  const fit = [
    getCareers(second, 1),
    getCareers(third, 0),
    getCareers(third, 1),
  ].filter(Boolean) as string[];
  const drain = [
    getDrains(lowest, 0),
    getDrains(lowest, 1),
    getDrains(secondLowest, 0),
  ].filter(Boolean) as string[];

  // Confidence tier
  const topScore = weightedSorted[0][1];
  const secondScore = weightedSorted[1][1];
  const scoreDiff = topScore - secondScore;

  let confidenceTier: "HC" | "MC" | "LC";
  if (scoreDiff >= 15 && topScore > 10) {
    confidenceTier = "HC";
  } else if (scoreDiff >= 8) {
    confidenceTier = "MC";
  } else {
    confidenceTier = "LC";
  }

  const topCareers = top.map((c, i) => ({ name: c, pct: [94, 87, 81][i] }));
  const fitCareers = fit.map((c, i) => ({ name: c, pct: [71, 64, 58][i] }));
  const drainCareers = drain.map((c, i) => ({ name: c, pct: [12, 16, 9][i] }));

  return {
    code,
    label: isZh ? labelData.label_zh : labelData.label_en,
    resultData: {
      sortedScores: sorted,
      topCareers,
      fitCareers,
      drainCareers,
      confidenceTier,
      labelData: {
        code: code,
        label_zh: labelData.label_zh,
        label_en: labelData.label_en,
        tagline_zh: labelData.tagline_zh,
        tagline_en: labelData.tagline_en,
        colorHex: labelData.colorHex,
      },
    },
  };
}

// ============================================================
// Deep Dive v3.0 — Random Answer Generators
// ============================================================

const SJT_CHOICES = ["A", "B", "C", "D"] as const;

/**
 * Generate random SJT answers for 6 scenarios.
 * Each scenario has a would + should choice (A-D).
 */
export function generateRandomSJTAnswers(): SJTAnswer[] {
  return Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: SJT_CHOICES[randomInt(0, 3)],
    shouldChoice: SJT_CHOICES[randomInt(0, 3)],
  }));
}

/** Re-export from shared utility — normalize raw RIASEC scores to 0-100 scale. */
export const normalizeRiasecScores = _normalizeRiasecScores;

/** Re-export from shared utility — build 12-type archetype from RIASEC scores. */
export const buildArchetype = _buildArchetype;

/**
 * Generate random TwIVI Quick answers (8 items, 1-6 Likert scale).
 * Used by admin auto-fill to produce realistic value orientation data.
 */
export function generateRandomQuickTwIVIAnswers(): Record<number, number> {
  const answers: Record<number, number> = {};
  for (const item of QUICK_TWIVI_ITEMS) {
    answers[item.id] = randomInt(1, 6);
  }
  return answers;
}

/**
 * Generate random TwIVI answers.
 * 20 items, each rated 1-6 Likert scale.
 */
export function generateRandomDDVQAnswers(): Record<number, number> {
  const ddvq: Record<number, number> = {};
  for (let i = 1; i <= 20; i++) {
    ddvq[i] = randomInt(1, 6);
  }
  return ddvq;
}

/**
 * Generate random IPIP-60 answers.
 * 60 items from the IPIP-60 item ID set, each rated 1-5 Likert scale.
 */
export function generateRandomIPIP60Answers(): Record<number, number> {
  const ipip60: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) {
    ipip60[id] = randomInt(1, 5);
  }
  return ipip60;
}

/**
 * Bundle all v3.0 answers into the pipeline input shape.
 * v3.0: 6 SJT + 20 TwIVI + 60 IPIP-60 = 86 items.
 */
export function generateDeepDiveAnswersV3(): QuestionnaireAnswersV3 {
  return {
    sjt: generateRandomSJTAnswers(),
    values: generateRandomDDVQAnswers(),
    ipip60: generateRandomIPIP60Answers(),
  };
}

/**
 * Generate fake v3.0 session metadata for auto-fill.
 */
export function generateSessionMetadataV3(
  sessionId: string,
): SessionMetadataV3 {
  return {
    sessionId,
    totalTimeMs: randomInt(300_000, 1_200_000), // 5-20 minutes
    moduleTimes: {
      sjt: randomInt(120_000, 300_000), // 2-5 minutes
      ddvq: randomInt(60_000, 150_000), // 1-2.5 minutes
      ipip60: randomInt(180_000, 600_000), // 3-10 minutes
    },
  };
}
