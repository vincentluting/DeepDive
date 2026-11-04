// ============================================================
// Mock Assessment — Balanced Profile
// Moderate scores across all dimensions, realistic data.
// ============================================================

import type { AssessmentResult } from "@/lib/types";

/**
 * Build a balanced AssessmentResult with moderate scores.
 * RIASEC around 50-60, Big Five around 50-65, centered Schwartz near 0.
 */
export function buildBalancedAssessment(): AssessmentResult {
  return {
    id: "assessment-balanced-001",
    sessionId: "session-balanced-001",
    timestamp: "2026-02-20T10:00:00.000Z",
    questionnaireVersion: "2.0",

    bigFive: {
      domains: {
        openness: 3.4,
        conscientiousness: 3.2,
        extraversion: 3.0,
        agreeableness: 3.5,
        neuroticism: 2.8,
      },
      facets: {
        // Openness facets (O1-O6)
        O1_Imagination: 3.5,
        O2_Artistic_Interests: 3.3,
        O3_Emotionality: 3.6,
        O4_Adventurousness: 3.2,
        O5_Intellect: 3.4,
        O6_Liberalism: 3.0,
        // Conscientiousness facets (C1-C6)
        "C1_Self-Efficacy": 3.4,
        C2_Orderliness: 3.0,
        C3_Dutifulness: 3.3,
        "C4_Achievement-Striving": 3.5,
        "C5_Self-Discipline": 3.1,
        C6_Cautiousness: 2.8,
        // Extraversion facets (E1-E6)
        E1_Friendliness: 3.2,
        E2_Gregariousness: 2.8,
        E3_Assertiveness: 3.0,
        E4_Activity_Level: 3.1,
        "E5_Excitement-Seeking": 3.3,
        E6_Cheerfulness: 3.0,
        // Agreeableness facets (A1-A6)
        A1_Trust: 3.5,
        A2_Morality: 3.6,
        A3_Altruism: 3.4,
        A4_Cooperation: 3.5,
        A5_Modesty: 3.3,
        A6_Sympathy: 3.7,
        // Neuroticism facets (N1-N6)
        N1_Anxiety: 2.9,
        N2_Anger: 2.6,
        N3_Depression: 2.7,
        "N4_Self-Consciousness": 3.0,
        N5_Immoderation: 2.8,
        N6_Vulnerability: 2.8,
      },
      domainsNormalized: {
        openness: 60,
        conscientiousness: 55,
        extraversion: 50,
        agreeableness: 62,
        neuroticism: 45,
      },
    },

    schwartz: {
      raw: {
        achievement: 4.2,
        power: 3.5,
        stimulation: 3.8,
        "self-direction": 4.5,
        hedonism: 4.0,
        benevolence: 4.3,
        universalism: 4.1,
        conformity: 3.4,
        tradition: 3.2,
        security: 3.9,
      },
      centered: {
        achievement: 0.28,
        power: -0.42,
        stimulation: -0.12,
        "self-direction": 0.58,
        hedonism: 0.08,
        benevolence: 0.38,
        universalism: 0.18,
        conformity: -0.52,
        tradition: -0.72,
        security: -0.02,
      },
      ranking: [
        "self-direction",
        "benevolence",
        "achievement",
        "universalism",
        "hedonism",
        "security",
        "stimulation",
        "power",
        "conformity",
        "tradition",
      ],
      top3: ["self-direction", "benevolence", "achievement"],
    },

    tensions: {
      scenarios: [
        {
          scenarioId: 1,
          domain: "extraversion",
          wouldScore: 3,
          shouldScore: 4,
          gap: 1,
          isConsistent: true,
        },
        {
          scenarioId: 2,
          domain: "agreeableness",
          wouldScore: 4,
          shouldScore: 4,
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
          wouldScore: 4,
          shouldScore: 4,
          gap: 0,
          isConsistent: true,
        },
        {
          scenarioId: 5,
          domain: "neuroticism",
          wouldScore: 2,
          shouldScore: 2,
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
      overallConsistency: 0.85,
      notableTensions: [],
    },

    riasecNormalized: {
      R: 45,
      I: 60,
      A: 55,
      S: 50,
      E: 48,
      C: 42,
    },

    archetype: {
      primary: "I",
      orientation: "enhancement",
      code: "I-enhancement",
      label_zh: "战略家",
      label_en: "Tactician",
      tagline_zh: "信息就是弹药，知识就是权力",
      tagline_en: "Turning information into strategic advantage",
      confidence: 0.55,
      confidenceLevel: "medium",
      isBoundary: false,
      derivedFrom: {
        primary: { dimension: "I", score: 60 },
        secondary: { dimension: "A", score: 55 },
        tertiary: { dimension: "S", score: 50 },
        gap12: 5,
        gap23: 5,
        relation: "adjacent",
      },
    },

    cognitiveStyleCode: {
      code: "INFJ",
      displayMode: "normal",
      dimensions: {
        EI: { score: 40, label: "I", isNearMidpoint: false },
        SN: { score: 60, label: "N", isNearMidpoint: false },
        TF: { score: 55, label: "F", isNearMidpoint: true },
        JP: { score: 45, label: "J", isNearMidpoint: false },
      },
      confidence: 0.65,
    },

    meta: {
      totalQuestions: 147,
      answeredQuestions: 147,
      totalTimeMs: 1200000,
      rushCount: 0,
      moduleTimes: {
        sjt: 180000,
        pvq: 240000,
        ipip: 780000,
      },
    },
  };
}

/**
 * Build a minimal RealConditions for testing.
 */
export function buildBalancedRealConditions() {
  return {
    education: {
      level: "master" as const,
      field: "Computer Science",
    },
    experienceYears: 5,
    pastIndustries: ["tech", "consulting"],
    currentCountry: "US",
    currentCity: "San Francisco",
    targetCountry: "US",
    targetCities: ["San Francisco", "New York", "remote"],
    visaStatus: "work_visa" as const,
    visaType: "H1B",
    workRestrictions: {
      canWorkFullTime: true,
      sponsorshipRequired: true,
      occupationRestricted: false,
    },
    workLanguages: [
      { language: "English", proficiency: "fluent" as const },
      { language: "Chinese", proficiency: "native" as const },
    ],
    locationFlexibility: "stay-local" as const,
    familyConstraints: {
      hasPartner: false,
      partnerWorkRestriction: false,
      hasDependents: false,
    },
    economicConstraints: {
      salaryFloor: "important" as const,
      canRelocate: true,
      willingToRetrain: true,
    },
    salaryRange: {
      min: 100000,
      max: 160000,
      currency: "USD",
    },
    workType: "fulltime" as const,
    officeMode: "hybrid" as const,
    interestedIndustries: ["tech", "saas"],
    openToCareerChange: "open" as const,
    industryBackground: "Software engineering background",
    culturalIdentity: {
      externalExpectationPressure: "medium" as const,
    },
  };
}
