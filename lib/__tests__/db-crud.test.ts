import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  RealConditions,
  CareerReport,
  PersonalProfileData,
  AssessmentResult,
} from "../types";

// Mock the db connection module (used by all lib/db/ domain modules)
const mockSql = vi.fn();
vi.mock("../db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

// Mock crypto.randomUUID
vi.mock("crypto", () => ({
  randomUUID: () => "test-uuid-1234",
}));

// Import after mocking
const { saveRealConditions, getRealConditions } =
  await import("../db/conditions");
const { saveReport, getReport, getReportByAssessment } =
  await import("../db/reports");
const { saveProfile, getProfile } = await import("../db/profiles");
const {
  saveAssessmentResult,
  getAssessmentResult,
  getAssessmentResultBySession,
} = await import("../db/assessments");

function makeRealConditions(): RealConditions {
  return {
    education: { level: "bachelor", field: "Computer Science" },
    experienceYears: 3,
    pastIndustries: ["tech"],
    currentCity: "Shanghai",
    targetCities: ["Amsterdam", "remote"],
    visaStatus: "work_visa",
    workRestrictions: {
      canWorkFullTime: true,
      sponsorshipRequired: false,
      occupationRestricted: false,
    },
    workLanguages: [
      { language: "Chinese", proficiency: "native" },
      { language: "English", proficiency: "fluent" },
    ],
    locationFlexibility: "open",
    familyConstraints: {
      hasPartner: false,
      partnerWorkRestriction: false,
      hasDependents: false,
    },
    economicConstraints: { canRelocate: true, willingToRetrain: true },
    salaryRange: { min: 50000, max: 80000, currency: "EUR" },
    workType: "fulltime",
    officeMode: "hybrid",
    interestedIndustries: ["tech", "design"],
    openToCareerChange: "open",
    culturalIdentity: {
      externalExpectationPressure: "none",
    },
  };
}

function makeReport(): CareerReport {
  return {
    id: "report-001",
    assessmentId: "assessment-001",
    locale: "zh",
    header: {
      archetype: {
        code: "A-transcendence",
        orientation: "transcendence" as const,
        label_zh: "追梦人",
        label_en: "Dreamweaver",
        tagline_zh: "我的作品要让你不想醒来",
        tagline_en: "Creating dreams that touch the soul",
      },
      cognitiveStyleCode: "ENFJ",
      cognitiveStyleDisplayMode: "normal",
      crossCulturalType_zh: "桥梁型",
      crossCulturalType_en: "Bridge",
      collabMapping: {
        cssGradient: "linear-gradient()",
        primary: "I",
        secondary: "D",
      },
      displayString_zh: "叙事者 · ENFJ · 桥梁型",
      displayString_en: "The Narrator · ENFJ · Bridge",
      fluidityNote_zh: "这是此刻的你",
      fluidityNote_en: "This is a snapshot",
      isBoundary: false,
    },
    careerMatch: { directions: [], summary: "test summary" },
    careerPathway: {
      realConditionsProvided: false,
      jobDirections: [],
      jobSearchStrategy: {
        positioning: "",
        resumeHighlights: [],
        networkingTips: [],
        constraintStrategies: [],
      },
      actionPlan: {
        intensity: "accelerated",
        thrustNote: "",
        week1: { theme: "", tasks: [] },
        weeksPreview: [],
      },
      subscriptionBridge: {
        cta_zh: "",
        cta_en: "",
        trialDays: 7,
        valueProps: [],
      },
      followUpSchedule: { emailCollected: false, triggers: [] },
    },
    integration: {
      coreInsight: "test",
      transitions: { profileToPathway: "" },
      letterToUser: "test letter",
    },
    meta: {
      generatedAt: Date.now(),
      version: "6.0",
      llmModel: "llama-3.3-70b",
      generationTimeMs: 12000,
      llmCalls: 4,
      realConditionsProvided: false,
    },
  };
}

function makeProfile(): PersonalProfileData {
  return {
    id: "profile-001",
    assessmentId: "assessment-001",
    userId: "user-001",
    archetype: {
      primary: "A",
      orientation: "transcendence",
      code: "A-transcendence",
      label_zh: "追梦人",
      label_en: "Dreamweaver",
      tagline_zh: "我的作品要让你不想醒来",
      tagline_en: "Creating dreams that touch the soul",
      isBoundary: false,
      confidence: 0.82,
      confidenceLevel: "high" as const,
      derivedFrom: {
        primary: { dimension: "A", score: 80 },
        secondary: { dimension: "S", score: 70 },
        tertiary: { dimension: "I", score: 45 },
        gap12: 10,
        gap23: 25,
        relation: "adjacent",
      },
    },
    cognitiveStyleCode: "ENFJ",
    cognitiveStyleDisplayMode: "normal" as const,
    collabMapping: {
      primary: "I" as const,
      secondary: "D" as const,
      scores: { D: 30, I: 40, S: 20, C: 10 },
      cssGradient: "",
      derivedFrom: "big_five_mapping" as const,
      approximationNote_zh: "",
      approximationNote_en: "",
      confidence: 0.7,
    },
    schwartzAnchors: {
      ranking: ["hedonism", "universalism", "autonomy"] as any,
      top3: ["hedonism", "universalism", "autonomy"] as any,
      scores: {} as any,
      conflictPair: null,
      conflictStatus: null,
      confidence: 0.75,
    },
    crossCultural: { type: "bridge", label_zh: "桥梁型" },
    confidenceMap: { riasec: 0.82, bigFive: 0.75 },
    version: "6.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  mockSql.mockReset();
});

describe("Real Conditions CRUD", () => {
  it("saveRealConditions should insert a row and return id", async () => {
    mockSql.mockResolvedValue([]);
    const conditions = makeRealConditions();
    const id = await saveRealConditions("session-1", "user-1", conditions);
    expect(id).toBe("test-uuid-1234");
    // 2 calls: ensureSessionExists + INSERT
    expect(mockSql).toHaveBeenCalledTimes(2);
  });

  it("saveRealConditions should accept null userId", async () => {
    mockSql.mockResolvedValue([]);
    const conditions = makeRealConditions();
    const id = await saveRealConditions("session-1", null, conditions);
    expect(id).toBe("test-uuid-1234");
    // 2 calls: ensureSessionExists + INSERT
    expect(mockSql).toHaveBeenCalledTimes(2);
  });

  it("getRealConditions should return conditions when found", async () => {
    const conditions = makeRealConditions();
    mockSql.mockResolvedValue([{ conditionsJson: conditions }]);
    const result = await getRealConditions("session-1");
    expect(result).toEqual(conditions);
    expect(result?.education.level).toBe("bachelor");
    expect(result?.currentCity).toBe("Shanghai");
  });

  it("getRealConditions should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const result = await getRealConditions("nonexistent-session");
    expect(result).toBeNull();
  });
});

describe("Career Report CRUD", () => {
  it("saveReport should insert and return the report id", async () => {
    mockSql.mockResolvedValue([{ id: "report-001" }]);
    const report = makeReport();
    const id = await saveReport(report);
    expect(id).toBe("report-001");
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("saveReport should use generated id when report has no id", async () => {
    mockSql.mockResolvedValue([{ id: "test-uuid-1234" }]);
    const report = makeReport();
    report.id = "";
    const id = await saveReport(report);
    expect(id).toBe("test-uuid-1234");
  });

  it("saveReport should return null on conflict (dedup)", async () => {
    mockSql.mockResolvedValue([]);
    const report = makeReport();
    const id = await saveReport(report);
    expect(id).toBeNull();
  });

  it("getReport should return report when found", async () => {
    const report = makeReport();
    mockSql.mockResolvedValue([{ reportJson: report }]);
    const result = await getReport("report-001");
    expect(result).toEqual(report);
    expect(result?.header.cognitiveStyleCode).toBe("ENFJ");
    expect(result?.meta.version).toBe("6.0");
  });

  it("getReport should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const result = await getReport("nonexistent");
    expect(result).toBeNull();
  });

  it("getReportByAssessment should return latest report for assessment", async () => {
    const report = makeReport();
    mockSql.mockResolvedValue([{ reportJson: report }]);
    const result = await getReportByAssessment("assessment-001");
    expect(result).toEqual(report);
    expect(result?.assessmentId).toBe("assessment-001");
  });

  it("getReportByAssessment should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const result = await getReportByAssessment("nonexistent");
    expect(result).toBeNull();
  });
});

describe("Personal Profile CRUD", () => {
  it("saveProfile should upsert and return profile id", async () => {
    // Single atomic INSERT ... ON CONFLICT DO UPDATE ... RETURNING "id"
    mockSql.mockResolvedValueOnce([{ id: "profile-001" }]);
    const profile = makeProfile();
    const id = await saveProfile(profile);
    expect(id).toBe("profile-001");
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("saveProfile should return existing id on conflict", async () => {
    // ON CONFLICT returns existing row id
    mockSql.mockResolvedValueOnce([{ id: "existing-id" }]);
    const profile = makeProfile();
    const id = await saveProfile(profile);
    expect(id).toBe("existing-id");
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("saveProfile should use generated id when profile has no id", async () => {
    mockSql.mockResolvedValueOnce([{ id: "test-uuid-1234" }]);
    const profile = makeProfile();
    profile.id = "";
    const id = await saveProfile(profile);
    expect(id).toBe("test-uuid-1234");
  });

  it("getProfile should return profile when found", async () => {
    const profile = makeProfile();
    mockSql.mockResolvedValue([{ profileJson: profile }]);
    const result = await getProfile("user-001");
    expect(result).toEqual(profile);
    expect(result?.archetype.label_zh).toBe("追梦人");
    expect(result?.cognitiveStyleCode).toBe("ENFJ");
  });

  it("getProfile should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const result = await getProfile("nonexistent-user");
    expect(result).toBeNull();
  });
});

// ============================================================
// Assessment Result CRUD (v2.0)
// ============================================================

function makeAssessmentResult(): AssessmentResult {
  return {
    id: "assessment-001",
    sessionId: "session-001",
    timestamp: new Date().toISOString(),
    questionnaireVersion: "2.0",
    bigFive: {
      domains: {
        openness: 3.8,
        conscientiousness: 3.2,
        extraversion: 3.6,
        agreeableness: 3.5,
        neuroticism: 2.4,
      },
      facets: {
        imagination: 4.0,
        artistic_interests: 3.8,
        emotionality: 3.5,
        adventurousness: 3.9,
        intellect: 3.7,
        liberalism: 3.6,
      },
      domainsNormalized: {
        openness: 75,
        conscientiousness: 55,
        extraversion: 65,
        agreeableness: 63,
        neuroticism: 35,
      },
    },
    schwartz: {
      raw: {
        achievement: 4.0,
        power: 2.5,
        stimulation: 3.8,
        autonomy: 4.2,
        hedonism: 4.5,
        benevolence: 3.5,
        universalism: 4.0,
        conformity: 2.0,
        tradition: 2.2,
        security: 2.8,
      } as any,
      centered: {
        achievement: 0.5,
        power: -1.0,
        stimulation: 0.3,
        autonomy: 0.7,
        hedonism: 1.0,
        benevolence: 0.0,
        universalism: 0.5,
        conformity: -1.5,
        tradition: -1.3,
        security: -0.7,
      } as any,
      ranking: [
        "hedonism",
        "autonomy",
        "achievement",
        "universalism",
        "stimulation",
        "benevolence",
        "security",
        "power",
        "tradition",
        "conformity",
      ] as any,
      top3: ["hedonism", "autonomy", "achievement"] as any,
    },
    tensions: {
      scenarios: [
        {
          scenarioId: 1,
          shouldDomain: "achievement",
          wouldDomain: "hedonism",
          gap: 0.2,
          tensionLabel: "mild",
        },
      ] as any,
      overallConsistency: 0.83,
      notableTensions: [],
    },
    riasecNormalized: { R: 30, I: 45, A: 80, S: 70, E: 50, C: 35 },
    archetype: {
      primary: "A",
      orientation: "transcendence",
      code: "A-transcendence",
      label_zh: "追梦人",
      label_en: "Dreamweaver",
      tagline_zh: "我的作品要让你不想醒来",
      tagline_en: "Creating dreams that touch the soul",
      isBoundary: false,
      confidence: 0.82,
      confidenceLevel: "high" as const,
      derivedFrom: {
        primary: { dimension: "A", score: 80 },
        secondary: { dimension: "S", score: 70 },
        tertiary: { dimension: "I", score: 45 },
        gap12: 10,
        gap23: 25,
        relation: "adjacent",
      },
    },
    cognitiveStyleCode: {
      code: "ENFP",
      displayMode: "normal" as const,
      dimensions: {
        EI: { score: 65, label: "E", isNearMidpoint: false },
        SN: { score: 75, label: "N", isNearMidpoint: false },
        TF: { score: 70, label: "F", isNearMidpoint: false },
        JP: { score: 45, label: "P", isNearMidpoint: true },
      },
      confidence: 0.72,
    },
    meta: {
      totalQuestions: 147,
      answeredQuestions: 147,
      totalTimeMs: 1800000,
      rushCount: 0,
      moduleTimes: { sjt: 300000, pvq: 400000, ipip: 1100000 },
    },
  };
}

describe("Assessment Result CRUD", () => {
  it("saveAssessmentResult should insert and return the assessment id", async () => {
    mockSql.mockResolvedValue([]);
    const result = makeAssessmentResult();
    const id = await saveAssessmentResult(result);
    expect(id).toBe("assessment-001");
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("saveAssessmentResult should use generated id when result has no id", async () => {
    mockSql.mockResolvedValue([]);
    const result = makeAssessmentResult();
    result.id = "";
    const id = await saveAssessmentResult(result);
    expect(id).toBe("test-uuid-1234");
  });

  it("getAssessmentResult should return result when found", async () => {
    const result = makeAssessmentResult();
    mockSql.mockResolvedValue([{ resultJson: result, version: "2.0" }]);
    const fetched = await getAssessmentResult("assessment-001");
    expect(fetched).toEqual(result);
    expect(fetched?.archetype.label_zh).toBe("追梦人");
    expect(fetched?.cognitiveStyleCode?.code).toBe("ENFP");
  });

  it("getAssessmentResult should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const fetched = await getAssessmentResult("nonexistent");
    expect(fetched).toBeNull();
  });

  it("getAssessmentResultBySession should return latest result for session", async () => {
    const result = makeAssessmentResult();
    mockSql.mockResolvedValue([{ resultJson: result, version: "2.0" }]);
    const fetched = await getAssessmentResultBySession("session-001");
    expect(fetched).toEqual(result);
    expect(fetched?.sessionId).toBe("session-001");
  });

  it("getAssessmentResultBySession should return null when not found", async () => {
    mockSql.mockResolvedValue([]);
    const fetched = await getAssessmentResultBySession("nonexistent-session");
    expect(fetched).toBeNull();
  });
});
