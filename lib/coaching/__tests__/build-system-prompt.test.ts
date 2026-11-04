import { describe, it, expect } from "vitest";
import { buildCoachingSystemPrompt } from "@/lib/coaching/build-system-prompt";
import type { BuildCoachingPromptParams } from "@/lib/coaching/build-system-prompt";
import type { CoachingTurnUnderstandingV2 } from "@/lib/coaching/turn-understanding";
import type { UserMemory } from "@/lib/types/memory";
import { createInitialCoachingSessionState } from "@/lib/coaching/conversation-router";

// ── Helpers ──────────────────────────────────────────────────
function baseParams(
  overrides: Partial<BuildCoachingPromptParams> = {},
): BuildCoachingPromptParams {
  return {
    locale: "en",
    round: 1,
    maxRounds: 10,
    reportSummary: null,
    memories: null,
    answers: null,
    turnUnderstanding: {
      primaryIntent: "Understand my next career step",
      coreQuestion: "What should I focus on next?",
      importantFacts: [],
      constraints: [],
      desiredHelp: "analyze",
      ambiguities: [],
      confidence: 0.8,
    },
    coachingSessionState: {
      ...createInitialCoachingSessionState(),
      currentFocus: "What should I focus on next?",
      mode: "explore",
    },
    ...overrides,
  };
}

const localeLockFragments = {
  en: "never mirror the user's language",
  zh: "绝对不要跟随用户语言",
  nl: "spiegel nooit de taal van de gebruiker",
  de: "spiegle niemals die Sprache des Benutzers",
  fr: "ne reprenez jamais la langue de l'utilisateur",
  es: "nunca imites el idioma del usuario",
  pt: "nunca espelhe a língua do utilizador",
  it: "non rispecchiare mai la lingua dell'utente",
  ru: "никогда не зеркальте язык пользователя",
  ja: "ユーザーの言語をそのままなぞってはいけません",
  ko: "사용자의 언어를 그대로 따라 하지 마세요",
} as const;

// ── Tests ────────────────────────────────────────────────────

describe("buildCoachingSystemPrompt", () => {
  it("returns English prompt when locale is en", () => {
    const prompt = buildCoachingSystemPrompt(baseParams());
    expect(prompt).toContain("You are not a generic AI coach");
    expect(prompt).toContain("Use English");
  });

  // Regression for 2026-05-12 codex audit bug #5: profileContext was added
  // so parseReportContext can inject identitySummary + archetypeNarrative
  // into the coach's "you" section. Pre-fix, buildCoachingSystemPrompt
  // called parseReportContext(reportSummary) and dropped profileData.
  it("injects identitySummary from profileContext into the prompt", () => {
    const identityLine =
      "Your sentence pattern is to read the room twice before committing.";
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        // Minimal report so parseReportContext doesn't early-return.
        reportSummary: { header: { archetypeLabel: "Scientist" } },
        profileContext: {
          archetype: { label_en: "Scientist", tagline_en: "" },
          cognitiveStyleCode: "INTP",
          narrativeSnapshots: {
            identitySummary: identityLine,
            archetypeNarrative:
              "You build maps before you build buildings, and you defend the maps even when others want to start digging.",
          },
        },
      }),
    );
    expect(prompt).toContain(identityLine);
  });

  it("falls back gracefully when profileContext is null (no narrative leak)", () => {
    // Without profileContext, the prompt still builds and does NOT contain
    // a stray identitySummary marker that would indicate a hard-coded leak.
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        reportSummary: { header: { archetypeLabel: "Scientist" } },
        profileContext: null,
      }),
    );
    expect(prompt).not.toContain("identitySummary");
    // And the prompt is still a real coach prompt — not an empty string.
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("returns Chinese prompt when locale is zh", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ locale: "zh" }));
    expect(prompt).toContain("你不是一个通用的AI教练");
    expect(prompt).toContain("使用中文");
  });

  it("includes the response bridge contract in Chinese prompts", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ locale: "zh" }));
    expect(prompt).toContain("教练回应合约");
    expect(prompt).toContain("过渡桥句");
    expect(prompt).toContain("总结用户的话 → 所以下一步");
  });

  it("injects per-turn coaching state into the volatile prompt block", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        round: 3,
        coachingTurnState: {
          currentPhase: "pattern_surfacing",
          knownFacts: ["User is deciding whether to leave a job."],
          emotionalSignals: ["stuck"],
          coreConcern: "career transition uncertainty",
          confirmedPatterns: [],
          unconfirmedHypotheses: ["The user may need the hidden tension named before action planning."],
          lastCoachQuestion: "What feels hardest about staying?",
          userAnsweredLastQuestion: true,
          nextBestMove: "Reflect one pattern using the user's own words, then ask what it connects to.",
          evidenceQuote: "I feel stuck and I don't know whether to leave.",
        },
      }),
    );
    expect(prompt).toContain("Coaching Turn State");
    expect(prompt).toContain("currentPhase: pattern_surfacing");
    expect(prompt).toContain("evidenceQuote: I feel stuck");
  });

  it("injects V2 live understanding and requires direct answer before coaching questions", () => {
    const understanding: CoachingTurnUnderstandingV2 = {
      requestType: "why_question",
      userActualQuestion: "这是怎么回事？",
      directAnswerNeeded: true,
      concreteObjects: ["AI聊天", "抽象虚化"],
      emotionalSignals: ["frustrated"],
      hiddenAssumptions: ["AI教练应该先解释失败原因"],
      likelyTension: "用户需要具体诊断，而不是继续被抽象共情",
      evidenceNeeded: ["哪一条回复让用户觉得抽象"],
      nextBestMove: "先回答原因，再问一个具体例子",
      riskLevel: "normal",
    };

    const prompt = buildCoachingSystemPrompt(
      baseParams({
        locale: "zh",
        coachingTurnUnderstandingV2: understanding,
      }),
    );

    expect(prompt).toContain("本轮用户真实问题解析 V2");
    expect(prompt).toContain("requestType: why_question");
    expect(prompt).toContain("userActualQuestion: 这是怎么回事？");
    expect(prompt).toContain("directAnswerNeeded: true");
    expect(prompt).toContain("第一段必须先回答 userActualQuestion");
    expect(prompt).toContain("最多一个问题");
  });

  it("injects long-term hypotheses with active hypotheses framed as tentative", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        locale: "zh",
        coachingHypotheses: [
          {
            id: "h1",
            hypothesis: "用户在现实选择前会先担心选错方向",
            evidence: ["我到底该不该接这个offer？"],
            counterEvidence: [],
            confidence: 0.78,
            status: "active",
            lastValidatedAt: null,
          },
          {
            id: "h2",
            hypothesis: "用户已经确认自主性是长期职业模式",
            evidence: ["我不能接受被微管理"],
            counterEvidence: [],
            confidence: 0.9,
            status: "confirmed",
            lastValidatedAt: "2026-06-01T00:00:00Z",
          },
        ],
      }),
    );

    expect(prompt).toContain("长期教练假设记忆");
    expect(prompt).toContain("试探性理解（不能当作事实）");
    expect(prompt).toContain("已确认模式");
  });

  it("injects the unified evidence packet into the volatile prompt", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        locale: "zh",
        coachingEvidencePacket: {
          currentTurnEvidence: [
            {
              text: "这个 offer 会不会让我选错方向？",
              source: "current_turn",
              reason: "latest user message anchors this turn",
            },
          ],
          relevantReportSignals: [],
          confirmedUserPatterns: [],
          openHypotheses: [],
          actionHubSignals: [
            {
              text: "pending: 约一位行业前辈聊 20 分钟",
              source: "action_hub",
              reason: "active or pending action item",
            },
          ],
          realityConstraints: [],
        },
      }),
    );

    expect(prompt).toContain("可用证据包");
    expect(prompt).toContain("source=current_turn");
    expect(prompt).toContain("source=action_hub");
  });

  it("tells the coach to prioritize Action Hub review when actions exist", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        locale: "zh",
        actionHubContext: {
          totalItems: 2,
          completedItems: 0,
          inProgressItems: 1,
          topPendingActions: ["给 mentor 发第一条消息"],
        },
      }),
    );

    expect(prompt).toContain("优先复盘");
    expect(prompt).toContain("做了吗");
    expect(prompt).toContain("阻力是什么");
    expect(prompt).toContain("调整行动");
  });

  for (const [locale, fragment] of Object.entries(localeLockFragments)) {
    it(`locks output language for ${locale} in the main coaching prompt`, () => {
      const prompt = buildCoachingSystemPrompt(baseParams({ locale }));
      expect(prompt).toContain(fragment);
    });

    it(`locks output language for ${locale} in the state 1 coaching prompt`, () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({ locale, coachState: 1 }),
      );
      expect(prompt).toContain(fragment);
    });
  }

  // ── Task 4.1: First conversation scenarios ──

  it("includes direct-entry greeting instruction on round 1 without triggerContext", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ round: 1 }));
    expect(prompt).toContain("first conversation");
    expect(prompt).toContain("Greet them warmly");
    expect(prompt).toContain("short report recap");
  });

  it("includes panel-specific instruction on round 1 with triggerContext", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        round: 1,
        triggerContext: "User came from the career directions panel",
      }),
    );
    expect(prompt).toContain("specific report panel");
    expect(prompt).toContain("career directions panel");
    expect(prompt).not.toContain("first conversation");
  });

  it("warns about missing reality conditions on round 1", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        round: 1,
        hasRealityConditions: false,
      }),
    );
    expect(prompt).toContain("has not provided their real-world conditions");
    expect(prompt).toContain("Do NOT ask about these in the first round");
  });

  it("does not warn about reality conditions when they are provided", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        round: 1,
        hasRealityConditions: true,
      }),
    );
    expect(prompt).not.toContain(
      "has not provided their real-world conditions",
    );
  });

  it("does not include first-round instruction on later rounds", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ round: 3 }));
    expect(prompt).not.toContain("first conversation");
    expect(prompt).not.toContain("specific report panel");
  });

  // ── Task 4.1: Reality conditions inquiry in rounds 2-3 ──

  it("asks for missing reality conditions only when they change the answer", () => {
    const prompt2 = buildCoachingSystemPrompt(
      baseParams({ round: 2, hasRealityConditions: false }),
    );
    expect(prompt2).toContain(
      "Ask about a missing real-world condition only when it would materially change the answer",
    );

    const prompt3 = buildCoachingSystemPrompt(
      baseParams({ round: 3, hasRealityConditions: false }),
    );
    expect(prompt3).toContain(
      "Ask about a missing real-world condition only when it would materially change the answer",
    );
  });

  it("does not suggest asking about reality conditions if already provided", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ round: 2, hasRealityConditions: true }),
    );
    expect(prompt).not.toContain("real-world situation");
  });

  // ── Adaptive Conversation V2 (State 2) ──

  it("includes adaptive turn understanding in State 2 prompt", () => {
    const prompt = buildCoachingSystemPrompt(baseParams());
    expect(prompt).toContain("Current Turn Understanding and Routing");
    expect(prompt).toContain("HIGHEST PRIORITY");
    expect(prompt).not.toContain("CORE OPERATING PRINCIPLE");
  });

  it("routes exploration without forcing a phase sequence", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ round: 1, maxRounds: 10 }),
    );
    expect(prompt).toContain("Current mode: explore");
    expect(prompt).toContain("Offer one useful observation");
  });

  it("routes decision requests to an immediate provisional recommendation", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        round: 2,
        coachingSessionState: {
          ...createInitialCoachingSessionState(),
          mode: "decide",
          currentFocus: "Which offer should I choose?",
        },
        turnUnderstanding: {
          primaryIntent: "Choose between two offers",
          coreQuestion: "Which offer should I choose?",
          importantFacts: [],
          constraints: ["financial"],
          desiredHelp: "recommend",
          ambiguities: [],
          confidence: 0.9,
        },
      }),
    );
    expect(prompt).toContain("Current mode: decide");
    expect(prompt).toContain("Give a provisional recommendation now");
  });

  it("routes action requests to a confirmable action draft", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        coachingSessionState: {
          ...createInitialCoachingSessionState(),
          mode: "act",
          currentFocus: "Build a plan",
        },
        turnUnderstanding: {
          primaryIntent: "Build a plan",
          coreQuestion: "Build a plan",
          importantFacts: [],
          constraints: [],
          desiredHelp: "plan",
          ambiguities: [],
          confidence: 0.9,
        },
      }),
    );
    expect(prompt).toContain("Current mode: act");
    expect(prompt).toContain("<<ACTION_DRAFT>>");
  });

  it("keeps the legacy Socratic protocol behind the rollback switch", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ conversationV2Enabled: false }),
    );
    expect(prompt).toContain("Socratic Protocol");
    expect(prompt).toContain("CORE OPERATING PRINCIPLE");
  });

  // ── Task 4.3: Report data in context ──

  it("includes report roles when reportSummary has top_roles", () => {
    const summary = {
      ideal_fit_summary: {
        top_roles: [{ role_title: "Designer" }, { role_title: "Strategist" }],
      },
    };
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: summary }),
    );
    expect(prompt).toContain("Designer");
    expect(prompt).toContain("Strategist");
  });

  it("includes archetype when present in reportSummary", () => {
    const summary = {
      archetype_synthesis: {
        primary_archetype: "The Visionary",
        description: "sees the future",
      },
    };
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: summary }),
    );
    expect(prompt).toContain("The Visionary");
    expect(prompt).toContain("sees the future");
  });

  it("handles string reportSummary (JSON)", () => {
    const summary = JSON.stringify({
      career_tensions: { tensions: [{ tension: "creativity vs stability" }] },
    });
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: summary }),
    );
    expect(prompt).toContain("creativity vs stability");
  });

  it("handles malformed JSON reportSummary gracefully", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: "{{bad json" }),
    );
    // Should not throw, just produce prompt without report data
    expect(prompt).toContain("You are not a generic AI coach");
  });

  it("includes core insight when present in report", () => {
    const summary = {
      integration: { coreInsight: "You are a creative bridge-builder" },
    };
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: summary }),
    );
    expect(prompt).toContain("You are a creative bridge-builder");
  });

  it("includes reality conditions status in prompt", () => {
    const withRC = buildCoachingSystemPrompt(
      baseParams({ hasRealityConditions: true }),
    );
    expect(withRC).toContain("has provided reality conditions");

    const withoutRC = buildCoachingSystemPrompt(
      baseParams({ hasRealityConditions: false }),
    );
    expect(withoutRC).toContain("has NOT provided reality conditions");
  });

  it("detects reality conditions from report data", () => {
    const summary = {
      meta: { realConditionsProvided: true },
    };
    const prompt = buildCoachingSystemPrompt(
      baseParams({ reportSummary: summary }),
    );
    expect(prompt).toContain("has provided reality conditions");
  });

  it("includes behavior insight when provided", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ behaviorInsight: "Tends to overthink decisions" }),
    );
    expect(prompt).toContain("Tends to overthink decisions");
    expect(prompt).toContain("Decision Style");
  });

  it("includes memory section when memories are provided", () => {
    const memories: UserMemory[] = [
      {
        id: "m1",
        userId: "u1",
        category: "strength",
        keyword: "Analytical",
        insight: "Strong analytical thinking",
        confidence: 0.9,
        source: "questionnaire",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "m2",
        userId: "u1",
        category: "blindspot",
        keyword: "Impatience",
        insight: "Tends to rush",
        confidence: 0.8,
        source: "questionnaire",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      },
    ];
    const prompt = buildCoachingSystemPrompt(baseParams({ memories }));
    expect(prompt).toContain("Analytical");
    expect(prompt).toContain("Strong analytical thinking");
    expect(prompt).toContain("⚠️"); // blindspot warning
    expect(prompt).toContain("User Memory Profile");
  });

  it("skips memory section when memories array is empty", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ memories: [] }));
    expect(prompt).not.toContain("User Memory Profile");
  });

  // ── Task 4.1: Section-specific context in triggerContext ──

  it("includes career match summary when triggerContext references career directions", () => {
    const summary = {
      careerMatch: {
        directions: [
          {
            title_en: "UX Research",
            fit_reason: "Aligns with investigative nature",
          },
          {
            title_en: "Product Strategy",
            fit_reason: "Leverages systems thinking",
          },
        ],
      },
    };
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        reportSummary: summary,
        triggerContext: "User came from the career directions panel",
      }),
    );
    expect(prompt).toContain("UX Research");
    expect(prompt).toContain("Key findings from that panel");
  });

  // ── Chinese locale variants ──

  it("includes Chinese first-round instruction with triggerContext", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({
        locale: "zh",
        round: 1,
        triggerContext: "用户从报告的职业方向板块点进来",
      }),
    );
    expect(prompt).toContain("特定板块");
    expect(prompt).toContain("职业方向板块");
  });

  it("includes Chinese adaptive routing for zh locale", () => {
    const prompt = buildCoachingSystemPrompt(baseParams({ locale: "zh" }));
    expect(prompt).toContain("当前轮次理解与路由");
    expect(prompt).toContain("最高优先级");
  });

  it("includes Chinese mode behavior instead of phase hints", () => {
    const prompt = buildCoachingSystemPrompt(
      baseParams({ locale: "zh", round: 7, maxRounds: 10 }),
    );
    expect(prompt).toContain("当前模式：explore");
    expect(prompt).not.toContain("阶段提示");
  });

  // ── State 1: Quick Dive only coaching prompt ──

  describe("State 1 (Quick Dive only)", () => {
    const state1Params = (overrides: Partial<BuildCoachingPromptParams> = {}) =>
      baseParams({
        coachState: 1,
        primaryRiasecType: "I",
        maxRounds: 3,
        ...overrides,
      });

    it("returns State 1 prompt when coachState is 1", () => {
      const prompt = buildCoachingSystemPrompt(state1Params());
      expect(prompt).toContain("career exploration coach");
      expect(prompt).not.toContain("You are not a generic AI coach");
    });

    it("does NOT inject Socratic Protocol into State 1 prompt", () => {
      // Quick Dive users should receive the specialized 3-round wow prompt,
      // never the Phase-driven Socratic guidance (which assumes Deep Dive depth).
      const prompt = buildCoachingSystemPrompt(state1Params());
      expect(prompt).not.toContain("Socratic Protocol");
      expect(prompt).not.toContain("苏格拉底式协议");
      expect(prompt).not.toContain("CORE OPERATING PRINCIPLE");
    });

    it("returns State 2 (default) prompt when coachState is 2", () => {
      const prompt = buildCoachingSystemPrompt(baseParams({ coachState: 2 }));
      expect(prompt).toContain("You are not a generic AI coach");
    });

    it("returns State 2 prompt when coachState is undefined (backward compat)", () => {
      const prompt = buildCoachingSystemPrompt(baseParams());
      expect(prompt).toContain("You are not a generic AI coach");
    });

    it("includes RIASEC R strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "R", round: 1 }),
      );
      expect(prompt).toContain("Practical-Action type (R)");
      expect(prompt).toContain("tangible results");
    });

    it("includes RIASEC I strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "I", round: 1 }),
      );
      expect(prompt).toContain("Investigative-Thinking type (I)");
      expect(prompt).toContain('driven by "why"');
    });

    it("includes RIASEC A strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "A", round: 1 }),
      );
      expect(prompt).toContain("Aesthetic-Creative type (A)");
      expect(prompt).toContain('sensitive to "form"');
    });

    it("includes RIASEC S strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "S", round: 1 }),
      );
      expect(prompt).toContain("People-Oriented type (S)");
      expect(prompt).toContain("say no");
    });

    it("includes RIASEC E strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "E", round: 1 }),
      );
      expect(prompt).toContain("Impact-Driven type (E)");
      expect(prompt).toContain("influence");
    });

    it("includes RIASEC C strategy in round 1", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "C", round: 1 }),
      );
      expect(prompt).toContain("Order-Building type (C)");
      expect(prompt).toContain("reliable systems");
    });

    it("includes round 1 Mirror instruction", () => {
      const prompt = buildCoachingSystemPrompt(state1Params({ round: 1 }));
      expect(prompt).toContain("The Mirror");
      expect(prompt).toContain("pain point");
    });

    it("includes round 2 Reframe instruction", () => {
      const prompt = buildCoachingSystemPrompt(state1Params({ round: 2 }));
      expect(prompt).toContain("The Reframe");
      expect(prompt).toContain("micro-reframe");
      // Round 2 should not have the Mirror *instruction* section, though the overview mentions it
      expect(prompt).not.toContain("Round 1 Instruction");
    });

    it("includes round 3 Transformation instruction", () => {
      const prompt = buildCoachingSystemPrompt(state1Params({ round: 3 }));
      expect(prompt).toContain("The Transformation");
      expect(prompt).toContain("tip of your iceberg");
      expect(prompt).toContain("Deep Dive");
    });

    it("never includes psychology jargon rule", () => {
      const prompt = buildCoachingSystemPrompt(state1Params({ round: 1 }));
      expect(prompt).toContain("NEVER use psychology jargon");
    });

    it("keeps responses concise rule", () => {
      const prompt = buildCoachingSystemPrompt(state1Params({ round: 1 }));
      expect(prompt).toContain("3-5 sentences");
    });

    it("does not include report summary section (no Deep Dive data)", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({
          reportSummary: {
            ideal_fit_summary: { top_roles: [{ role_title: "Designer" }] },
          },
        }),
      );
      expect(prompt).not.toContain("Recommended directions");
      expect(prompt).not.toContain("Designer");
    });

    it("falls back to I strategy when primaryRiasecType is null", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: null, round: 1 }),
      );
      expect(prompt).toContain("Investigative-Thinking type (I)");
    });

    // Chinese locale tests for State 1
    it("returns Chinese State 1 prompt", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ locale: "zh", round: 1 }),
      );
      expect(prompt).toContain("职业探索教练");
      expect(prompt).toContain("镜子");
    });

    it("includes Chinese RIASEC R strategy", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ locale: "zh", primaryRiasecType: "R", round: 1 }),
      );
      expect(prompt).toContain("务实行动型（R）");
    });

    it("includes Chinese round 2 Reframe", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ locale: "zh", round: 2 }),
      );
      expect(prompt).toContain("重构");
      expect(prompt).toContain("微型重构");
    });

    it("includes Chinese round 3 Transformation with Deep Dive guidance", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ locale: "zh", round: 3 }),
      );
      expect(prompt).toContain("转化");
      expect(prompt).toContain("冰山一角");
      expect(prompt).toContain("Deep Dive");
    });

    it("handles case-insensitive RIASEC type", () => {
      const prompt = buildCoachingSystemPrompt(
        state1Params({ primaryRiasecType: "a", round: 1 }),
      );
      expect(prompt).toContain("Aesthetic-Creative type (A)");
    });
  });

  // ── AI Era Anxiety reframing protocol — conditional load ──
  describe("AI Era Anxiety reframing protocol", () => {
    const ANXIETY_MARKER = "AI ERA ANXIETY REFRAMING PROTOCOL";

    it("injects the protocol when triggerContext contains the English marker", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          round: 1,
          triggerContext: "From the AI Era Anxiety chapter",
        }),
      );
      expect(prompt).toContain(ANXIETY_MARKER);
      expect(prompt).toContain("Stage 1 — NAMING");
      expect(prompt).toContain("Stage 4 — ACTION");
    });

    it("injects the protocol when triggerContext contains the Chinese marker", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          locale: "zh",
          round: 1,
          triggerContext: "来自「AI 时代焦虑」章节",
        }),
      );
      expect(prompt).toContain(ANXIETY_MARKER);
    });

    it("does NOT inject the protocol for other section triggers (token budget guard)", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          round: 1,
          triggerContext: "From the Career Anchor chapter",
        }),
      );
      expect(prompt).not.toContain(ANXIETY_MARKER);
    });

    it("does NOT inject the protocol on direct entry (no triggerContext)", () => {
      const prompt = buildCoachingSystemPrompt(baseParams({ round: 1 }));
      expect(prompt).not.toContain(ANXIETY_MARKER);
    });

    it("only emits on round 1 — later rounds reuse the cached prefix", () => {
      const round1 = buildCoachingSystemPrompt(
        baseParams({
          round: 1,
          triggerContext: "From the AI Era Anxiety chapter",
        }),
      );
      const round5 = buildCoachingSystemPrompt(
        baseParams({
          round: 5,
          triggerContext: "From the AI Era Anxiety chapter",
        }),
      );
      expect(round1).toContain(ANXIETY_MARKER);
      // Round 5 still has the system prompt header but the
      // first-round-instruction (where AI_ANXIETY is appended) is gated by
      // round === 1 in buildCoachingSystemPromptParts, so it should be absent.
      expect(round5).not.toContain(ANXIETY_MARKER);
    });

    it("includes core safety guards (no diagnosis, no therapy modality names)", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          round: 1,
          triggerContext: "From the AI Era Anxiety chapter",
        }),
      );
      expect(prompt).toContain("Diagnose anxiety as a clinical condition");
      expect(prompt).toContain("CBT / ACT");
      expect(prompt).toContain("Predict the future of AI");
    });

    it("includes CARE Ease-of-Exit instruction", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          round: 1,
          triggerContext: "From the AI Era Anxiety chapter",
        }),
      );
      expect(prompt).toContain("CARE EASE-OF-EXIT");
      expect(prompt).toContain("round 7");
    });
  });

  // ── Phase B audit fix: RealConditions injection ───────────────────
  describe("realConditionsContext injection (2026-05-18 audit fix)", () => {
    const fullRCBlock = [
      "## User's Stated Real-World Constraints (DO NOT re-ask, ground every suggestion in these)",
      "- Visa status: work_visa (Highly Skilled Migrant)",
      "- Requires employer visa sponsorship: Yes",
      "- Current city: Amsterdam",
      "- Has partner/family to consider: Yes",
      "",
      "_How to use this block: ground every suggestion in these constraints._",
    ].join("\n");

    it("emits the realConditionsContext block verbatim into the system prompt", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          hasRealityConditions: true,
          realConditionsContext: fullRCBlock,
        }),
      );
      expect(prompt).toContain("DO NOT re-ask");
      expect(prompt).toContain("work_visa");
      expect(prompt).toContain("Amsterdam");
      expect(prompt).toContain("ground every suggestion");
    });

    it("does NOT inject the block when realConditionsContext is null", () => {
      const prompt = buildCoachingSystemPrompt(
        baseParams({
          hasRealityConditions: false,
          realConditionsContext: null,
        }),
      );
      expect(prompt).not.toContain("DO NOT re-ask");
      expect(prompt).not.toContain("work_visa");
    });
  });
});
