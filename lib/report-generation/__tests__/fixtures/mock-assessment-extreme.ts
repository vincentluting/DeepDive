// ============================================================
// Mock Assessment — Extreme Profile
// Very high I, very low S, pronounced Big Five extremes,
// strong value tensions, SJT inconsistencies.
// ============================================================

import type { AssessmentResult } from "@/lib/types";

/**
 * Build an extreme AssessmentResult to test edge cases.
 * Very high Investigative (I=95), very low Social (S=15).
 * Extreme Big Five: very high Openness, very low Agreeableness.
 * Boundary archetype (isBoundary = true).
 */
export function buildExtremeAssessment(): AssessmentResult {
  return {
    id: "assessment-extreme-001",
    sessionId: "session-extreme-001",
    timestamp: "2026-02-20T12:00:00.000Z",
    questionnaireVersion: "2.0",

    bigFive: {
      domains: {
        openness: 4.6,
        conscientiousness: 2.2,
        extraversion: 1.8,
        agreeableness: 2.0,
        neuroticism: 4.2,
      },
      facets: {
        // Openness facets — very high
        O1_Imagination: 4.8,
        O2_Artistic_Interests: 4.5,
        O3_Emotionality: 4.7,
        O4_Adventurousness: 4.9,
        O5_Intellect: 4.6,
        O6_Liberalism: 4.3,
        // Conscientiousness facets — very low
        "C1_Self-Efficacy": 2.5,
        C2_Orderliness: 1.8,
        C3_Dutifulness: 2.3,
        "C4_Achievement-Striving": 2.6,
        "C5_Self-Discipline": 1.9,
        C6_Cautiousness: 2.1,
        // Extraversion facets — very low
        E1_Friendliness: 2.0,
        E2_Gregariousness: 1.5,
        E3_Assertiveness: 2.2,
        E4_Activity_Level: 1.8,
        "E5_Excitement-Seeking": 2.5,
        E6_Cheerfulness: 1.6,
        // Agreeableness facets — very low
        A1_Trust: 1.8,
        A2_Morality: 2.3,
        A3_Altruism: 2.0,
        A4_Cooperation: 1.9,
        A5_Modesty: 2.1,
        A6_Sympathy: 2.0,
        // Neuroticism facets — very high
        N1_Anxiety: 4.5,
        N2_Anger: 4.0,
        N3_Depression: 4.3,
        "N4_Self-Consciousness": 4.4,
        N5_Immoderation: 3.8,
        N6_Vulnerability: 4.2,
      },
      domainsNormalized: {
        openness: 92,
        conscientiousness: 22,
        extraversion: 18,
        agreeableness: 20,
        neuroticism: 85,
      },
    },

    schwartz: {
      raw: {
        achievement: 2.0,
        power: 1.5,
        stimulation: 5.5,
        "self-direction": 5.8,
        hedonism: 4.5,
        benevolence: 2.5,
        universalism: 3.0,
        conformity: 1.2,
        tradition: 1.0,
        security: 1.8,
      },
      centered: {
        achievement: -0.87,
        power: -1.37,
        stimulation: 2.63,
        "self-direction": 2.93,
        hedonism: 1.63,
        benevolence: -0.37,
        universalism: 0.13,
        conformity: -1.67,
        tradition: -1.87,
        security: -1.07,
      },
      ranking: [
        "self-direction",
        "stimulation",
        "hedonism",
        "universalism",
        "benevolence",
        "achievement",
        "security",
        "power",
        "conformity",
        "tradition",
      ],
      top3: ["self-direction", "stimulation", "hedonism"],
    },

    tensions: {
      scenarios: [
        {
          scenarioId: 1,
          domain: "extraversion",
          wouldScore: 1,
          shouldScore: 4,
          gap: 3,
          isConsistent: false,
        },
        {
          scenarioId: 2,
          domain: "agreeableness",
          wouldScore: 2,
          shouldScore: 5,
          gap: 3,
          isConsistent: false,
        },
        {
          scenarioId: 3,
          domain: "conscientiousness",
          wouldScore: 2,
          shouldScore: 4,
          gap: 2,
          isConsistent: false,
        },
        {
          scenarioId: 4,
          domain: "openness",
          wouldScore: 5,
          shouldScore: 5,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 5,
          domain: "neuroticism",
          wouldScore: 4,
          shouldScore: 1,
          gap: -3,
          isConsistent: false,
        },
        {
          scenarioId: 6,
          domain: "extraversion",
          domainSecondary: "agreeableness",
          wouldScore: 1,
          shouldScore: 3,
          gap: 2,
          isConsistent: false,
        },
      ],
      overallConsistency: 0.33,
      notableTensions: ["extraversion", "agreeableness", "neuroticism"],
    },

    riasecNormalized: {
      R: 20,
      I: 95,
      A: 80,
      S: 15,
      E: 10,
      C: 25,
    },

    archetype: {
      primary: "I",
      orientation: "enhancement",
      code: "I-enhancement",
      label_zh: "战略家",
      label_en: "Tactician",
      tagline_zh: "信息就是弹药，知识就是权力",
      tagline_en: "Turning information into strategic advantage",
      confidence: 0.52,
      confidenceLevel: "medium",
      isBoundary: true,
      derivedFrom: {
        primary: { dimension: "I", score: 95 },
        secondary: { dimension: "A", score: 80 },
        tertiary: { dimension: "R", score: 25 },
        gap12: 15,
        gap23: 55,
        relation: "adjacent",
      },
    },

    cognitiveStyleCode: {
      code: "INTP",
      displayMode: "normal",
      dimensions: {
        EI: { score: 20, label: "I", isNearMidpoint: false },
        SN: { score: 85, label: "N", isNearMidpoint: false },
        TF: { score: 35, label: "T", isNearMidpoint: false },
        JP: { score: 70, label: "P", isNearMidpoint: false },
      },
      confidence: 0.82,
    },

    meta: {
      totalQuestions: 147,
      answeredQuestions: 147,
      totalTimeMs: 900000,
      rushCount: 3,
      moduleTimes: {
        sjt: 120000,
        pvq: 180000,
        ipip: 600000,
      },
    },
  };
}

/**
 * Build an assessment with no optional fields (no cognitiveStyleCode, no collabMapping/collabMapping).
 */
export function buildMinimalAssessment(): AssessmentResult {
  return {
    id: "assessment-minimal-001",
    sessionId: "session-minimal-001",
    timestamp: "2026-02-20T14:00:00.000Z",
    questionnaireVersion: "2.0",

    bigFive: {
      domains: {
        openness: 3.0,
        conscientiousness: 3.0,
        extraversion: 3.0,
        agreeableness: 3.0,
        neuroticism: 3.0,
      },
      facets: {
        O1_Imagination: 3.0,
        O2_Artistic_Interests: 3.0,
        O3_Emotionality: 3.0,
        O4_Adventurousness: 3.0,
        O5_Intellect: 3.0,
        O6_Liberalism: 3.0,
        "C1_Self-Efficacy": 3.0,
        C2_Orderliness: 3.0,
        C3_Dutifulness: 3.0,
        "C4_Achievement-Striving": 3.0,
        "C5_Self-Discipline": 3.0,
        C6_Cautiousness: 3.0,
        E1_Friendliness: 3.0,
        E2_Gregariousness: 3.0,
        E3_Assertiveness: 3.0,
        E4_Activity_Level: 3.0,
        "E5_Excitement-Seeking": 3.0,
        E6_Cheerfulness: 3.0,
        A1_Trust: 3.0,
        A2_Morality: 3.0,
        A3_Altruism: 3.0,
        A4_Cooperation: 3.0,
        A5_Modesty: 3.0,
        A6_Sympathy: 3.0,
        N1_Anxiety: 3.0,
        N2_Anger: 3.0,
        N3_Depression: 3.0,
        "N4_Self-Consciousness": 3.0,
        N5_Immoderation: 3.0,
        N6_Vulnerability: 3.0,
      },
      domainsNormalized: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
    },

    schwartz: {
      raw: {
        achievement: 3.5,
        power: 3.5,
        stimulation: 3.5,
        "self-direction": 3.5,
        hedonism: 3.5,
        benevolence: 3.5,
        universalism: 3.5,
        conformity: 3.5,
        tradition: 3.5,
        security: 3.5,
      },
      centered: {
        achievement: 0,
        power: 0,
        stimulation: 0,
        "self-direction": 0,
        hedonism: 0,
        benevolence: 0,
        universalism: 0,
        conformity: 0,
        tradition: 0,
        security: 0,
      },
      ranking: [
        "self-direction",
        "achievement",
        "benevolence",
        "universalism",
        "hedonism",
        "stimulation",
        "security",
        "power",
        "conformity",
        "tradition",
      ],
      top3: ["self-direction", "achievement", "benevolence"],
    },

    tensions: {
      scenarios: [
        {
          scenarioId: 1,
          domain: "extraversion",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 2,
          domain: "agreeableness",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 3,
          domain: "conscientiousness",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 4,
          domain: "openness",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 5,
          domain: "neuroticism",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 6,
          domain: "extraversion",
          wouldScore: 3,
          shouldScore: 3,
          gap: 0,
          isConsistent: true,
        },
      ],
      overallConsistency: 1.0,
      notableTensions: [],
    },

    riasecNormalized: { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 },

    archetype: {
      primary: "R",
      orientation: "transcendence",
      code: "R-transcendence",
      label_zh: "主心骨",
      label_en: "Backbone",
      tagline_zh: "离了我就塌的那个人",
      tagline_en: "The one everything stands on",
      confidence: 0.35,
      confidenceLevel: "low",
      isBoundary: true,
      derivedFrom: {
        primary: { dimension: "R", score: 50 },
        secondary: { dimension: "I", score: 50 },
        tertiary: { dimension: "A", score: 50 },
        gap12: 0,
        gap23: 0,
        relation: "adjacent",
      },
    },

    // No cognitiveStyleCode — tests the optional field path
    // No collabMapping — tests the fallback Collaboration Style derivation

    meta: {
      totalQuestions: 147,
      answeredQuestions: 147,
      totalTimeMs: 600000,
      rushCount: 0,
      moduleTimes: { sjt: 100000, pvq: 200000, ipip: 300000 },
    },
  };
}
