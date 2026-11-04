import { describe, it, expect } from "vitest";
import {
  coachingChatSchema,
  scoreSchema,
  loginSchema,
  registerSchema,
  reportNpsSchema,
  adminBootstrapSchema,
  memoryUpdateSchema,
  memoryDeleteSchema,
  analyticsEventSchema,
  generateReportSchema,
  generateProfileSchema,
  sessionCreateSchema,
  sessionSaveSchema,
  realityConditionsSchema,
  coachingSummarySchema,
  reportReactionSchema,
  coachingFeedbackSchema,
  quickdiveSaveSchema,
  adminAnalyticsCleanupSchema,
  userDataDeleteSchema,
  memoryGenerateSchema,
  memoryCreateSchema,
  prePostAssessmentSchema,
} from "@/lib/validation/api-schemas";

// ── Tests ────────────────────────────────────────────────────

describe("coachingChatSchema", () => {
  it("accepts minimal valid input with defaults", () => {
    const result = coachingChatSchema.safeParse({ sessionId: "session-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toEqual([]);
      expect(result.data.round).toBe(1);
      expect(result.data.maxRounds).toBe(10);
      expect(result.data.locale).toBe("en");
    }
  });

  it("accepts full input", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: [{ role: "user", content: "hello" }],
      round: 3,
      maxRounds: 10,
      locale: "zh",
      behaviorInsight: "some insight",
      reportSummary: "{}",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid message role", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: [{ role: "system", content: "nope" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts correction messages and correction signals", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: [
        {
          role: "user",
          content: "You missed my point",
          kind: "correction",
        },
      ],
      correctionSignal: "missed_point",
    });
    expect(result.success).toBe(true);
  });
});

describe("scoreSchema", () => {
  it("requires sessionId and SJT/PVQ/IPIP fields", () => {
    const result = scoreSchema.safeParse({ sessionId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid v2.0 score input", () => {
    // Bug-log #006: schema is now strict — supply the canonical full payload.
    const pvq = Object.fromEntries(
      Array.from({ length: 21 }, (_, i) => [String(i + 1), 4]),
    );
    const ipip = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [String(i + 1), 3]),
    );
    const result = scoreSchema.safeParse({
      sessionId: "s1",
      sjt: [
        { scenarioId: 1, wouldChoice: "A", shouldChoice: "B" },
        { scenarioId: 2, wouldChoice: "A", shouldChoice: "B" },
        { scenarioId: 3, wouldChoice: "A", shouldChoice: "B" },
        { scenarioId: 4, wouldChoice: "A", shouldChoice: "B" },
        { scenarioId: 5, wouldChoice: "A", shouldChoice: "B" },
        { scenarioId: 6, wouldChoice: "A", shouldChoice: "B" },
      ],
      pvq,
      ipip,
      riasecNormalized: { R: 50, I: 60, A: 40, S: 30, E: 70, C: 20 },
      archetype: { primary: "E", polarity: "explore", code: "E-explore" },
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a" }).success).toBe(false);
  });

  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "pass" }).success,
    ).toBe(true);
  });
});

describe("registerSchema", () => {
  it("requires password >= 8 chars", () => {
    const result = registerSchema.safeParse({
      name: "Jo",
      email: "a@b.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Jo",
      email: "a@b.com",
      password: "longpassword",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "longpassword",
    });
    expect(result.success).toBe(false);
  });
});

describe("reportNpsSchema", () => {
  it("rejects score outside 1-10", () => {
    expect(
      reportNpsSchema.safeParse({ reportId: "r1", score: 0 }).success,
    ).toBe(false);
    expect(
      reportNpsSchema.safeParse({ reportId: "r1", score: -1 }).success,
    ).toBe(false);
    expect(
      reportNpsSchema.safeParse({ reportId: "r1", score: 11 }).success,
    ).toBe(false);
  });

  it("accepts valid NPS", () => {
    expect(
      reportNpsSchema.safeParse({ reportId: "r1", score: 8 }).success,
    ).toBe(true);
  });
});

describe("adminBootstrapSchema", () => {
  it("requires email", () => {
    expect(adminBootstrapSchema.safeParse({}).success).toBe(false);
  });

  it("accepts email", () => {
    expect(
      adminBootstrapSchema.safeParse({ email: "admin@co.com" }).success,
    ).toBe(true);
  });
});

describe("memoryUpdateSchema / memoryDeleteSchema", () => {
  it("requires id for update", () => {
    expect(memoryUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("accepts update with keyword", () => {
    expect(
      memoryUpdateSchema.safeParse({ id: "m1", keyword: "new" }).success,
    ).toBe(true);
  });

  it("requires id for delete", () => {
    expect(memoryDeleteSchema.safeParse({}).success).toBe(false);
  });

  it("accepts delete with id", () => {
    expect(memoryDeleteSchema.safeParse({ id: "m1" }).success).toBe(true);
  });
});

describe("analyticsEventSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(analyticsEventSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid funnel event", () => {
    const result = analyticsEventSchema.safeParse({
      event: "registered",
      metadata: { path: "/home" },
      clientId: "c1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid event name", () => {
    const result = analyticsEventSchema.safeParse({
      event: "page_view",
      metadata: { path: "/home" },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Additional schema coverage — edge cases & uncovered schemas
// ============================================================

describe("generateReportSchema", () => {
  it("accepts valid data with defaults", () => {
    const result = generateReportSchema.safeParse({ assessmentId: "a-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
    }
  });

  it("rejects empty assessmentId", () => {
    expect(generateReportSchema.safeParse({ assessmentId: "" }).success).toBe(
      false,
    );
  });

  it("rejects missing assessmentId", () => {
    expect(generateReportSchema.safeParse({}).success).toBe(false);
  });

  it("accepts zh locale", () => {
    const result = generateReportSchema.safeParse({
      assessmentId: "a-1",
      locale: "zh",
    });
    expect(result.success).toBe(true);
  });
});

describe("generateProfileSchema", () => {
  it("accepts valid assessmentId", () => {
    expect(
      generateProfileSchema.safeParse({ assessmentId: "a-1" }).success,
    ).toBe(true);
  });

  it("rejects empty assessmentId", () => {
    expect(generateProfileSchema.safeParse({ assessmentId: "" }).success).toBe(
      false,
    );
  });

  it("accepts optional userId", () => {
    const result = generateProfileSchema.safeParse({
      assessmentId: "a-1",
      userId: "u-1",
    });
    expect(result.success).toBe(true);
  });
});

describe("sessionCreateSchema", () => {
  it("accepts valid session with language", () => {
    expect(
      sessionCreateSchema.safeParse({ sessionId: "s-1", language: "en" })
        .success,
    ).toBe(true);
  });

  it("accepts optional tier values", () => {
    expect(
      sessionCreateSchema.safeParse({
        sessionId: "s-1",
        language: "zh",
        tier: "quick",
      }).success,
    ).toBe(true);
    expect(
      sessionCreateSchema.safeParse({
        sessionId: "s-1",
        language: "en",
        tier: "deep",
      }).success,
    ).toBe(true);
    expect(
      sessionCreateSchema.safeParse({
        sessionId: "s-1",
        language: "en",
        tier: "ultra",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid tier", () => {
    expect(
      sessionCreateSchema.safeParse({
        sessionId: "s-1",
        language: "en",
        tier: "mega",
      }).success,
    ).toBe(false);
  });

  it("rejects missing language", () => {
    expect(sessionCreateSchema.safeParse({ sessionId: "s-1" }).success).toBe(
      false,
    );
  });
});

describe("sessionSaveSchema", () => {
  it("accepts valid save with answers", () => {
    const result = sessionSaveSchema.safeParse({
      sessionId: "s-1",
      answers: [
        {
          questionId: "q1",
          value: 4,
          responseTimeMs: 1200,
          timestamp: Date.now(),
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty sessionId", () => {
    expect(
      sessionSaveSchema.safeParse({
        sessionId: "",
        answers: [
          { questionId: "q1", value: 4, responseTimeMs: 1200, timestamp: 0 },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts optional currentModule and currentPhase", () => {
    const result = sessionSaveSchema.safeParse({
      sessionId: "s-1",
      answers: [],
      currentModule: "ipip",
      currentPhase: 2,
      currentQuestionIndex: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an answers array over the count limit (#110)", () => {
    const oversized = Array.from({ length: 501 }, (_, i) => ({
      questionId: `q${i}`,
      value: 4,
      responseTimeMs: 1200,
      timestamp: 0,
    }));
    expect(
      sessionSaveSchema.safeParse({ sessionId: "s-1", answers: oversized })
        .success,
    ).toBe(false);
  });
});

describe("realityConditionsSchema", () => {
  it("accepts valid conditions with minimal fields", () => {
    const result = realityConditionsSchema.safeParse({
      sessionId: "s-1",
      userId: null,
      conditions: { education: { level: "bachelor" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid education level", () => {
    expect(
      realityConditionsSchema.safeParse({
        sessionId: "s-1",
        userId: null,
        conditions: { education: { level: "kindergarten" } },
      }).success,
    ).toBe(false);
  });

  it("accepts all valid education levels", () => {
    for (const level of ["high_school", "bachelor", "master", "phd", "other"]) {
      expect(
        realityConditionsSchema.safeParse({
          sessionId: "s-1",
          userId: null,
          conditions: { education: { level } },
        }).success,
      ).toBe(true);
    }
  });
});

describe("coachingSummarySchema", () => {
  it("requires at least 1 message", () => {
    expect(
      coachingSummarySchema.safeParse({
        sessionId: "session-1",
        messages: [],
      }).success,
    ).toBe(false);
  });

  it("accepts valid summary", () => {
    expect(
      coachingSummarySchema.safeParse({
        sessionId: "session-1",
        messages: [{ role: "user", content: "hello" }],
      }).success,
    ).toBe(true);
  });

  it("allows null/undefined reportId", () => {
    expect(
      coachingSummarySchema.safeParse({
        sessionId: "session-1",
        reportId: null,
        messages: [{ role: "user", content: "hi" }],
      }).success,
    ).toBe(true);
    expect(
      coachingSummarySchema.safeParse({
        sessionId: "session-1",
        messages: [{ role: "user", content: "hi" }],
      }).success,
    ).toBe(true);
  });
});

describe("reportReactionSchema", () => {
  it("accepts all valid reaction types", () => {
    for (const reaction of ["surprised", "skeptical", "resonates"]) {
      expect(
        reportReactionSchema.safeParse({ reportId: "r-1", reaction }).success,
      ).toBe(true);
    }
  });

  it("rejects invalid reaction", () => {
    expect(
      reportReactionSchema.safeParse({ reportId: "r-1", reaction: "angry" })
        .success,
    ).toBe(false);
  });

  it("rejects empty reportId", () => {
    expect(
      reportReactionSchema.safeParse({ reportId: "", reaction: "surprised" })
        .success,
    ).toBe(false);
  });
});

describe("coachingFeedbackSchema", () => {
  it("accepts all valid ratings", () => {
    for (const rating of ["okay", "helpful", "very_helpful"]) {
      expect(
        coachingFeedbackSchema.safeParse({ sessionId: "s-1", rating }).success,
      ).toBe(true);
    }
  });

  it("rejects invalid rating", () => {
    expect(
      coachingFeedbackSchema.safeParse({ sessionId: "s-1", rating: "terrible" })
        .success,
    ).toBe(false);
  });

  it("accepts optional highlight", () => {
    const result = coachingFeedbackSchema.safeParse({
      sessionId: "s-1",
      rating: "helpful",
      highlight: "Great insight!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts diagnostic feedback reasons", () => {
    const result = coachingFeedbackSchema.safeParse({
      sessionId: "s-1",
      rating: "helpful",
      reasons: ["understood_me", "helpful_next_step", "natural_conversation"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown feedback reasons", () => {
    const result = coachingFeedbackSchema.safeParse({
      sessionId: "s-1",
      rating: "okay",
      reasons: ["something_else"],
    });
    expect(result.success).toBe(false);
  });
});

describe("quickdiveSaveSchema", () => {
  it("accepts minimal valid data", () => {
    expect(
      quickdiveSaveSchema.safeParse({
        scores: { R: 80, I: 60 },
        code: "RI",
      }).success,
    ).toBe(true);
  });

  it("rejects empty code", () => {
    expect(
      quickdiveSaveSchema.safeParse({
        scores: { R: 80 },
        code: "",
      }).success,
    ).toBe(false);
  });

  it("defaults exploreMode to classic", () => {
    const result = quickdiveSaveSchema.safeParse({
      scores: { R: 80 },
      code: "RI",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exploreMode).toBe("classic");
    }
  });

  it("accepts classic exploreMode", () => {
    const result = quickdiveSaveSchema.safeParse({
      scores: { R: 80 },
      code: "RI",
      exploreMode: "classic",
    });
    expect(result.success).toBe(true);
  });

  it("accepts immersive result data with computed fields and labelData", () => {
    const result = quickdiveSaveSchema.safeParse({
      scores: { R: 22, I: 14, A: 19, S: 10, E: 8, C: 11 },
      code: "R-enhancement",
      label: "Architect",
      locale: "en",
      exploreMode: "immersive",
      resultData: {
        sortedScores: [["R", 22]],
        topCareers: [],
        fitCareers: [],
        drainCareers: [],
        confidenceTier: "MC",
        labelData: {
          code: "R-enhancement",
          label_zh: "工程专家",
          label_en: "Architect",
          tagline_zh: "用系统把想法落地",
          tagline_en: "Turning ideas into working systems",
          colorHex: "#5A8A9A",
        },
        computedRiasec: {
          riasecNormalized: { R: 88, I: 56, A: 76, S: 40, E: 32, C: 44 },
          archetype: { code: "R-enhancement" },
          rawScoreMax: 25,
          computedAt: "2026-05-09T00:00:00.000Z",
        },
        computedValues: {
          orientation: "enhancement",
          confidence: 0.7,
          isBoundary: false,
          scores: {},
          rawAnswers: {},
        },
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("adminAnalyticsCleanupSchema", () => {
  it("accepts action with optional retentionDays", () => {
    expect(
      adminAnalyticsCleanupSchema.safeParse({ action: "cleanup" }).success,
    ).toBe(true);
    expect(
      adminAnalyticsCleanupSchema.safeParse({
        action: "cleanup",
        retentionDays: 30,
      }).success,
    ).toBe(true);
  });

  it("rejects empty action", () => {
    expect(adminAnalyticsCleanupSchema.safeParse({ action: "" }).success).toBe(
      false,
    );
  });
});

describe("userDataDeleteSchema", () => {
  it("accepts valid password", () => {
    expect(
      userDataDeleteSchema.safeParse({ password: "mypassword" }).success,
    ).toBe(true);
  });

  it("accepts empty password (OAuth-only users have no password)", () => {
    expect(userDataDeleteSchema.safeParse({ password: "" }).success).toBe(true);
  });

  it("accepts missing password (OAuth-only users)", () => {
    expect(userDataDeleteSchema.safeParse({}).success).toBe(true);
  });
});

describe("memoryGenerateSchema", () => {
  it("defaults forceRegenerate to false", () => {
    const result = memoryGenerateSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.forceRegenerate).toBe(false);
    }
  });

  it("accepts forceRegenerate true", () => {
    expect(
      memoryGenerateSchema.safeParse({ forceRegenerate: true }).success,
    ).toBe(true);
  });
});

describe("memoryCreateSchema", () => {
  it("accepts valid memory creation", () => {
    expect(
      memoryCreateSchema.safeParse({
        category: "personality",
        keyword: "introvert",
        insight: "Prefers quiet environments",
      }).success,
    ).toBe(true);
  });

  it("rejects keyword longer than 20 chars", () => {
    expect(
      memoryCreateSchema.safeParse({
        category: "personality",
        keyword: "a".repeat(21),
        insight: "test",
      }).success,
    ).toBe(false);
  });

  it("rejects insight longer than 200 chars", () => {
    expect(
      memoryCreateSchema.safeParse({
        category: "personality",
        keyword: "test",
        insight: "x".repeat(201),
      }).success,
    ).toBe(false);
  });

  it("rejects empty required fields", () => {
    expect(
      memoryCreateSchema.safeParse({ category: "", keyword: "k", insight: "i" })
        .success,
    ).toBe(false);
    expect(
      memoryCreateSchema.safeParse({ category: "c", keyword: "", insight: "i" })
        .success,
    ).toBe(false);
    expect(
      memoryCreateSchema.safeParse({ category: "c", keyword: "k", insight: "" })
        .success,
    ).toBe(false);
  });
});

describe("scoreSchema — edge cases", () => {
  const minValidSjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: "A",
    shouldChoice: "B",
  }));
  // Bug-log #006: canonical TwIVI-20 / PVQ-21 / IPIP-60 fixtures so the
  // strict schema accepts the test payloads. Existing tests previously sent
  // partial `{}` or `{"1":1}` which the strict refines now (correctly) reject.
  const canonicalTwIVI = Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [String(i + 1), 3]),
  );
  const canonicalPVQ21 = Object.fromEntries(
    Array.from({ length: 21 }, (_, i) => [String(i + 1), 3]),
  );
  const canonicalIPIP60 = Object.fromEntries(
    Array.from({ length: 60 }, (_, i) => [String(i + 1), 3]),
  );

  it("rejects fewer than 6 SJT items", () => {
    expect(
      scoreSchema.safeParse({
        sessionId: "s-1",
        sjt: minValidSjt.slice(0, 5),
        pvq: {},
        ipip: {},
        riasecNormalized: {},
        archetype: { primary: "R", polarity: "anchor", code: "R-anchor" },
      }).success,
    ).toBe(false);
  });

  it("applies default metadata when not provided", () => {
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      pvq: canonicalPVQ21,
      ipip: canonicalIPIP60,
      riasecNormalized: {},
      archetype: { primary: "R", polarity: "anchor", code: "R-anchor" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({
        totalTimeMs: 0,
        moduleTimes: { sjt: 0 },
      });
      expect(result.data.locale).toBe("en");
    }
  });

  it("preserves extra fields via passthrough", () => {
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      pvq: canonicalPVQ21,
      ipip: canonicalIPIP60,
      riasecNormalized: {},
      archetype: { primary: "R", polarity: "anchor", code: "R-anchor" },
      extraData: "kept",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extraData).toBe("kept");
    }
  });

  // ── Bug-log #006: strict TwIVI / IPIP-60 / SJT validation regressions ──

  it("rejects SJT with duplicate scenarioIds (bug-log #006)", () => {
    const dupSjt = Array.from({ length: 6 }, () => ({
      scenarioId: 1, // all 6 records share scenarioId 1 → attacker payload
      wouldChoice: "A",
      shouldChoice: "B",
    }));
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: dupSjt,
      values: canonicalTwIVI,
      ipip: canonicalIPIP60,
      riasecNormalized: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects partial values (TwIVI must be exactly 20) (bug-log #006)", () => {
    const partialValues = { "1": 3, "2": 3 };
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      values: partialValues,
      ipip: canonicalIPIP60,
      riasecNormalized: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects values with non-canonical keys (e.g. 'foo':1) (bug-log #006)", () => {
    const bogusValues: Record<string, number> = { ...canonicalTwIVI };
    delete bogusValues["20"];
    bogusValues.foo = 3;
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      values: bogusValues,
      ipip: canonicalIPIP60,
      riasecNormalized: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects partial ipip (IPIP-60 must be exactly 60) (bug-log #006)", () => {
    const partialIpip = { "1": 3, "2": 3, "3": 3 };
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      values: canonicalTwIVI,
      ipip: partialIpip,
      riasecNormalized: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects payload missing both values and pvq (bug-log #006)", () => {
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      // neither values nor pvq present
      ipip: canonicalIPIP60,
      riasecNormalized: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts canonical v3.0 payload (TwIVI-20 + IPIP-60 + 6 unique SJT) (bug-log #006)", () => {
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      values: canonicalTwIVI,
      ipip: canonicalIPIP60,
      riasecNormalized: { R: 50, I: 60, A: 40, S: 30, E: 70, C: 20 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts canonical v2.0 payload (PVQ-21 back-compat) (bug-log #006)", () => {
    const result = scoreSchema.safeParse({
      sessionId: "s-1",
      sjt: minValidSjt,
      pvq: canonicalPVQ21,
      ipip: canonicalIPIP60,
      riasecNormalized: { R: 50, I: 60, A: 40, S: 30, E: 70, C: 20 },
    });
    expect(result.success).toBe(true);
  });
});

describe("prePostAssessmentSchema — attention check (T1)", () => {
  const canonicalScc = Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [`scc${i + 1}`, 3]),
  );
  // Bug-log #007: CDC-5 is now required at all timepoints; pre-existing tests
  // must include the full 5-item canonical payload.
  const canonicalCdc = {
    cdc1: 3,
    cdc2: 3,
    cdc3: 3,
    cdc4: 3,
    cdc5: 3,
  };

  it("accepts T1 payload with attn_check_1 in canonical 1–5 range", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: canonicalScc,
      cdcResponses: canonicalCdc,
      experienceFeedback: { attn_check_1: 4 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceFeedback?.attn_check_1).toBe(4);
    }
  });

  it("accepts T1 payload without attn_check_1 (optional field)", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: canonicalScc,
      cdcResponses: canonicalCdc,
      experienceFeedback: { trust_ai_competence: 5 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects attn_check_1 out of 1–5 range", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: canonicalScc,
      cdcResponses: canonicalCdc,
      experienceFeedback: { attn_check_1: 7 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer attn_check_1", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: canonicalScc,
      cdcResponses: canonicalCdc,
      experienceFeedback: { attn_check_1: 3.5 },
    });
    expect(result.success).toBe(false);
  });

  it("preserves attn_check_1 alongside all T1 instruments (round-trip)", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: canonicalScc,
      cdcResponses: canonicalCdc,
      experienceFeedback: {
        trust_willing_to_disclose: 5,
        trust_felt_understood: 4,
        constraints_actionable: 4,
        attn_check_1: 4,
        ux1: 3,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceFeedback?.attn_check_1).toBe(4);
      expect(result.data.experienceFeedback?.ux1).toBe(3);
    }
  });
});
