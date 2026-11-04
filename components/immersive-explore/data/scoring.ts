// ============================================================
// Immersive Explore — Scoring & Ranking
// ============================================================

import type { RiasecKey, ImmersiveQuestion } from "./types";
import { CHAPTER1_QUESTIONS } from "./chapter1-mechanical";
import { CHAPTER2_QUESTIONS } from "./chapter2-laboratory";
import { CHAPTER3_QUESTIONS } from "./chapter3-theater";
import { CHAPTER4_QUESTIONS } from "./chapter4-waiting-room";
import { CHAPTER5_QUESTIONS } from "./chapter5-negotiation";
import { CHAPTER6_QUESTIONS } from "./chapter6-archive";

const RIASEC_QUESTIONS = [
  ...CHAPTER1_QUESTIONS,
  ...CHAPTER2_QUESTIONS,
  ...CHAPTER3_QUESTIONS,
  ...CHAPTER4_QUESTIONS,
  ...CHAPTER5_QUESTIONS,
  ...CHAPTER6_QUESTIONS,
];

// 每道题最大分值为5，每个维度5题，最高25分
// Ch.7 (values) questions are excluded — they have no riasec dimension
export function computeImmersiveScores(
  answers: Record<number, number>, // questionId -> score (1-5)
): Record<RiasecKey, number> {
  const scores: Record<RiasecKey, number> = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };
  for (const question of RIASEC_QUESTIONS) {
    if (!question.riasec) continue;
    const answer = answers[question.id] ?? 0;
    scores[question.riasec] += answer;
  }
  return scores;
}

export function getRankedDimensions(
  scores: Record<RiasecKey, number>,
): RiasecKey[] {
  return (Object.entries(scores) as [RiasecKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

/**
 * Extract TwIVI answers from immersive answers for value orientation scoring.
 * Maps immersive question IDs (31-38) → TwIVI item IDs (3,4,8,9,13,14,18,19).
 */
export function extractTwiviAnswers(
  answers: Record<number, number>,
  questions: ImmersiveQuestion[],
): Record<number, number> {
  const twiviAnswers: Record<number, number> = {};
  for (const q of questions) {
    if (q.twiviItemId != null && answers[q.id] != null) {
      twiviAnswers[q.twiviItemId] = answers[q.id];
    }
  }
  return twiviAnswers;
}
