// ============================================================
// E2E Test Fixtures — Fixed answers for the core user journey test
//
// These fixtures provide deterministic test data for:
// - Quick Dive (30 RIASEC items)
// - Deep Dive Module A: SJT (6 scenarios)
// - Deep Dive Module B: TwIVI (20 value items)
// - Deep Dive Module C: IPIP-60 (60 personality items)
// ============================================================

/** Quick Dive: 30 RIASEC items, 5-point Likert scale (1-5) */
export const QUICKDIVE_ANSWERS: number[] = [
  // R  I  A  S  E  C  (repeated 5 times for 5 items per dimension)
  4,
  3,
  5,
  2,
  3,
  2, // items 1-6
  3,
  4,
  4,
  3,
  2,
  3, // items 7-12
  2,
  5,
  3,
  4,
  3,
  2, // items 13-18
  3,
  3,
  5,
  3,
  4,
  2, // items 19-24
  4,
  4,
  4,
  2,
  3,
  3, // items 25-30
];

/** RIASEC normalized scores derived from QUICKDIVE_ANSWERS */
export const RIASEC_SCORES: Record<string, number> = {
  R: 0.64, // (4+3+2+3+4)/25 = 0.64
  I: 0.76, // (3+4+5+3+4)/25 = 0.76
  A: 0.84, // (5+4+3+5+4)/25 = 0.84
  S: 0.56, // (2+3+4+3+2)/25 = 0.56
  E: 0.6, // (3+2+3+4+3)/25 = 0.60
  C: 0.48, // (2+3+2+2+3)/25 = 0.48
};

/** SJT: 6 scenario-based judgment test answers */
export const SJT_ANSWERS = [
  { scenarioId: 1, wouldChoice: "A" as const, shouldChoice: "B" as const },
  { scenarioId: 2, wouldChoice: "C" as const, shouldChoice: "A" as const },
  { scenarioId: 3, wouldChoice: "B" as const, shouldChoice: "B" as const },
  { scenarioId: 4, wouldChoice: "A" as const, shouldChoice: "C" as const },
  { scenarioId: 5, wouldChoice: "D" as const, shouldChoice: "A" as const },
  { scenarioId: 6, wouldChoice: "B" as const, shouldChoice: "B" as const },
];

/** TwIVI: 20 value items, 6-point Likert scale (1-6) */
export const DDVQ21_ANSWERS: Record<string, number> = {
  "1": 5,
  "2": 3,
  "3": 6,
  "4": 4,
  "5": 3,
  "6": 5,
  "7": 2,
  "8": 5,
  "9": 3,
  "10": 4,
  "11": 5,
  "12": 6,
  "13": 4,
  "14": 3,
  "15": 5,
  "16": 2,
  "17": 3,
  "18": 5,
  "19": 6,
  "20": 3,
};

/**
 * IPIP-NEO-60 (Maples-Keller et al., 2019): 60 personality items, 5-point Likert (1-5)
 * Sequential IDs 1-60 by domain: N(1-12), E(13-24), O(25-36), A(37-48), C(49-60)
 */
export const IPIP60_ANSWERS: Record<string, number> = {
  // Neuroticism (items 1-12)
  "1": 3,
  "2": 3,
  "3": 2,
  "4": 2,
  "5": 3,
  "6": 2,
  "7": 4,
  "8": 3,
  "9": 4,
  "10": 4,
  "11": 4,
  "12": 4,
  // Extraversion (items 13-24)
  "13": 4,
  "14": 4,
  "15": 3,
  "16": 2,
  "17": 5,
  "18": 4,
  "19": 3,
  "20": 3,
  "21": 4,
  "22": 4,
  "23": 4,
  "24": 4,
  // Openness (items 25-36)
  "25": 4,
  "26": 3,
  "27": 4,
  "28": 2,
  "29": 3,
  "30": 3,
  "31": 2,
  "32": 2,
  "33": 2,
  "34": 2,
  "35": 3,
  "36": 3,
  // Agreeableness (items 37-48)
  "37": 4,
  "38": 4,
  "39": 2,
  "40": 2,
  "41": 4,
  "42": 4,
  "43": 2,
  "44": 2,
  "45": 2,
  "46": 3,
  "47": 4,
  "48": 4,
  // Conscientiousness (items 49-60)
  "49": 4,
  "50": 4,
  "51": 4,
  "52": 2,
  "53": 4,
  "54": 2,
  "55": 4,
  "56": 4,
  "57": 4,
  "58": 2,
  "59": 2,
  "60": 2,
};

/** Build questionnaire answers array for session/save API */
export function buildDeepDiveAnswers() {
  const answers: Array<{
    questionId: string;
    value: unknown;
    responseTimeMs: number;
    timestamp: number;
  }> = [];
  const now = Date.now();

  // Module A: SJT (6 scenarios)
  SJT_ANSWERS.forEach((sjt, i) => {
    answers.push({
      questionId: `sjt-${sjt.scenarioId}`,
      value: { wouldChoice: sjt.wouldChoice, shouldChoice: sjt.shouldChoice },
      responseTimeMs: 3000 + i * 500,
      timestamp: now + i * 1000,
    });
  });

  // Module B: TwIVI (20 value items)
  Object.entries(DDVQ21_ANSWERS).forEach(([id, val], i) => {
    answers.push({
      questionId: `ddvq-${id}`,
      value: val,
      responseTimeMs: 2000 + i * 200,
      timestamp: now + 10000 + i * 500,
    });
  });

  // Module C: IPIP-60 (60 personality items)
  Object.entries(IPIP60_ANSWERS).forEach(([id, val], i) => {
    answers.push({
      questionId: `ipip-${id}`,
      value: val,
      responseTimeMs: 1500 + i * 100,
      timestamp: now + 30000 + i * 300,
    });
  });

  return answers;
}

/** Quick Dive result data for save API (matches quickdiveSaveSchema.resultData) */
export const QUICKDIVE_RESULT_DATA = {
  sortedScores: [
    ["A", 0.84],
    ["I", 0.76],
    ["R", 0.64],
    ["E", 0.6],
    ["S", 0.56],
    ["C", 0.48],
  ] as [string, number][],
  topCareers: [
    { name: "UX Designer", pct: 0.92 },
    { name: "Creative Director", pct: 0.88 },
  ],
  fitCareers: [
    { name: "Data Scientist", pct: 0.85 },
    { name: "Product Manager", pct: 0.8 },
  ],
  drainCareers: [{ name: "Accountant", pct: 0.35 }],
  confidenceTier: "HC" as const,
  labelData: {
    code: "AI",
    label_zh: "创意分析师",
    label_en: "The Creative Analyst",
    tagline_zh: "用创意照亮数据",
    tagline_en: "Illuminating data with creativity",
    colorHex: "#5d639e",
  },
};
