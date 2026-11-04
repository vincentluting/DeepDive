import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
vi.mock("@/lib/access/check-access", () => ({
  canAccessFeature: vi.fn(),
}));

vi.mock("@/lib/coaching/get-coach-access-level", () => ({
  getCoachAccessLevel: vi.fn(),
}));

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: vi.fn().mockResolvedValue(
    JSON.stringify({
      requestType: "unclear",
      userActualQuestion: "User intent is unclear.",
      directAnswerNeeded: false,
      concreteObjects: [],
      emotionalSignals: [],
      hiddenAssumptions: [],
      likelyTension: null,
      evidenceNeeded: [],
      nextBestMove: "Ask one precise clarifying question.",
      riskLevel: "normal",
    }),
  ),
  streamLLM: vi.fn(),
}));

vi.mock("@/lib/coaching/build-system-prompt", () => ({
  buildCoachingSystemPrompt: vi.fn().mockReturnValue("system prompt"),
  buildCoachingSystemPromptParts: vi
    .fn()
    .mockReturnValue(["system prompt cached", "system prompt volatile"]),
}));

vi.mock("@/lib/coaching/llm-judge", () => ({
  evaluateCoachingTurnWithLLMJudge: vi.fn().mockResolvedValue(null),
  shouldRunLLMJudge: vi.fn().mockReturnValue(false),
  didLLMJudgePass: vi.fn((judge) => {
    if (!judge) return true;
    return (
      judge.answered_user_actual_question &&
      judge.specificity_score >= 3 &&
      judge.evidence_grounding_score >= 3 &&
      judge.transition_score >= 3 &&
      judge.coaching_depth_score >= 3 &&
      !judge.premature_advice &&
      !judge.abstract_language_flag &&
      !judge.missed_emotion_flag
    );
  }),
  buildLLMJudgeRewriteReasons: vi
    .fn()
    .mockReturnValue(["llm-judge-missed-user-question"]),
}));

vi.mock("@/lib/coaching/parse-report-context", () => ({
  parseReportContext: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/ai/prompt-sanitization", () => ({
  sanitizeField: vi.fn((v: string) => v),
}));

vi.mock("@/lib/db/memory", () => ({
  getUserMemories: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/coaching-themes", () => ({
  getActiveThemes: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/coaching/extract-themes", () => ({
  buildThemeContextSection: vi.fn(() => ""),
}));

vi.mock("@/lib/db/coaching-turn-eval", () => ({
  saveCoachingTurnEval: vi.fn(),
}));

vi.mock("@/lib/db/coaching-review-pool", () => ({
  enqueueCoachingReviewCandidate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/coaching-hypotheses", () => ({
  getOpenCoachingHypotheses: vi.fn().mockResolvedValue([]),
  toPromptHypothesis: vi.fn((row) => ({
    id: row.id,
    hypothesis: row.hypothesis,
    evidence: row.evidenceJson,
    counterEvidence: row.counterEvidenceJson,
    confidence: row.confidence,
    status: row.status,
    lastValidatedAt: row.lastValidatedAt,
  })),
}));

vi.mock("@/lib/db/action-hub", () => ({
  createCoachingActionForActivePlan: vi.fn().mockResolvedValue({
    created: true,
    itemId: "coaching-action-1",
    planId: "plan-1",
  }),
}));

vi.mock("@/lib/db/profiles", () => ({
  getProfile: vi.fn().mockResolvedValue(null),
  getExercises: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db/conditions", () => ({
  getRealConditionsByUserId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionForUser: vi.fn().mockResolvedValue(null),
  saveCoachingTurnAudit: vi.fn().mockResolvedValue(undefined),
  saveCoachingSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/resume-match", () => ({
  getLatestActiveResumeMatchForUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/constants/industries", () => ({
  INDUSTRY_MAP: {},
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    RATE_LIMITED: "RATE_LIMITED",
  },
  createErrorResponse: vi.fn((code: string, msg: string, status: number) => {
    return new Response(JSON.stringify({ error: code, message: msg }), {
      status,
    });
  }),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { getCoachAccessLevel } from "@/lib/coaching/get-coach-access-level";
import { callLLM, streamLLM } from "@/lib/ai/model-router";
import { buildCoachingSystemPromptParts } from "@/lib/coaching/build-system-prompt";
import {
  evaluateCoachingTurnWithLLMJudge,
  shouldRunLLMJudge,
} from "@/lib/coaching/llm-judge";
import { enqueueCoachingReviewCandidate } from "@/lib/db/coaching-review-pool";
import { createCoachingActionForActivePlan } from "@/lib/db/action-hub";
import { getUserMemories } from "@/lib/db/memory";
import { getOpenCoachingHypotheses } from "@/lib/db/coaching-hypotheses";
import { getActiveThemes } from "@/lib/db/coaching-themes";
import { getProfile, getExercises } from "@/lib/db/profiles";
import { parseBody } from "@/lib/validation/parse-body";
import { saveCoachingSession, saveCoachingTurnAudit } from "@/lib/db/coaching";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/coaching-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

function allowGuard(user: { id: string; cohort?: string; email?: string }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

const validData = {
  sessionId: "session-1",
  reportId: null,
  messages: [],
  answers: null,
  reportSummary: null,
  round: 1,
  maxRounds: 5,
  locale: "en",
  ageConfirmed: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/coaching-chat", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  // ── Auth gates ──

  it("returns 401 when guard blocks (unauthenticated)", async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when user lacks aiCoaching entitlement", async () => {
    allowGuard({ id: "user-1" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.reason).toBe("invite_required");
  });

  it("returns error when parseBody fails", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  // ── Coach access level gates ──

  it("returns 403 quickdive_required when access level is 0", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 0,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.reason).toBe("quickdive_required");
  });

  it("returns 403 rounds_exhausted when State 1 rounds used up", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, round: 5 },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 1,
      maxRounds: 5,
      completedRounds: 3, // 3 + 5 = 8 > maxRounds=5
      primaryRiasecType: "A",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.reason).toBe("rounds_exhausted");
  });

  it("returns 503 when getCoachAccessLevel throws", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(503);
  });

  // ── Happy path (streaming) ──

  it("calls streamLLM for State 2 user with valid request", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });

    // Mock streamLLM to return a basic Response
    const mockStreamResponse = new Response("streaming...", { status: 200 });
    (streamLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockStreamResponse,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Coaching-V2-Variant")).toBe("v2");

    // Full Deep Dive first round prioritizes trust-building quality over fastest TTFB
    expect(streamLLM).toHaveBeenCalledWith(
      "coaching",
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("persists clean assistant text without UI markers", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [{ role: "user", content: "Give me an action plan" }],
        round: 2,
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (streamLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        'Start here.<<ACTION_DRAFT>>{"title":"Plan","actions":[{"title":"Call","category":"network"}]}<</ACTION_DRAFT>><<QUICK_REPLIES>>["Continue"]<</QUICK_REPLIES>>',
        { status: 200 },
      ),
    );

    const res = await handler(makeRequest());
    await res.text();

    expect(saveCoachingSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "session-1",
        messagesJson: JSON.stringify([
          { role: "user", content: "Give me an action plan" },
          { role: "assistant", content: "Start here." },
        ]),
      }),
    );
    expect(saveCoachingTurnAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        turnNumber: 1,
        mode: "act",
        hasActionDraft: true,
      }),
    );
  });

  it("State 1 user gets X-Remaining-Rounds header", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, round: 2 },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 1,
      maxRounds: 5,
      completedRounds: 0, // 0 + 2 = 2 <= 5, still OK
      primaryRiasecType: "S",
    });

    // Mock streamLLM — return a response with headers we can check
    const mockStreamResponse = new Response("streaming...", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
    (streamLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockStreamResponse,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    // The route adds X-Remaining-Rounds header to the response
    expect(res.headers.get("X-Remaining-Rounds")).toBe("3"); // 5 - 0 - 2 = 3
  });

  it("rewrites a concrete user turn when the first coach response is too abstract", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content:
              "我觉得这个AI聊天不是很能理解我，回复都很抽象虚化，这是怎么回事？",
          },
        ],
        round: 2,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });

    (streamLLM as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        new Response(
          "这里有一个模式和张力，我们可以继续探索你的内在方向。你想从哪里开始？",
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          "这是因为 AI聊天 之前没有先回答你问的“怎么回事”，而是把回复滑向了抽象的探索话术。",
          { status: 200 },
        ),
      );

    const res = await handler(makeRequest());
    const text = await res.text();

    expect(res.headers.get("X-Coaching-Quality-Rewrite")).toBe("1");
    expect(streamLLM).toHaveBeenCalledTimes(2);
    expect(text).toContain("AI聊天");
    expect(text).toContain("怎么回事");
  });

  it("injects structured V2 turn understanding into the prompt before streaming", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content: "我到底该不该接这个offer？我怕选错方向。",
          },
        ],
        round: 2,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({
        requestType: "career_decision",
        userActualQuestion: "我到底该不该接这个offer？",
        directAnswerNeeded: true,
        concreteObjects: ["offer", "选错方向"],
        emotionalSignals: ["anxious"],
        hiddenAssumptions: ["接错offer会让职业方向变差"],
        likelyTension: "现实机会和长期方向之间的拉扯",
        evidenceNeeded: ["offer的职责", "用户当前现实约束"],
        nextBestMove:
          "先回答该不该接需要看哪些关键条件，再问offer里最担心的一点",
        riskLevel: "normal",
      }),
    );
    (streamLLM as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(
        new Response("原因是 offer 这件事要先拆成现实约束和长期方向。", {
          status: 200,
        }),
      ),
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    expect(buildCoachingSystemPromptParts).toHaveBeenCalledWith(
      expect.objectContaining({
        coachingTurnUnderstandingV2: expect.objectContaining({
          requestType: "career_decision",
          userActualQuestion: "我到底该不该接这个offer？",
          directAnswerNeeded: true,
          concreteObjects: ["offer", "选错方向"],
        }),
      }),
    );
  });

  it("injects at most three relevant long-term hypotheses into the prompt", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content: "这个 offer 会不会让我选错方向？",
          },
        ],
        round: 2,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (getOpenCoachingHypotheses as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "h1",
        hypothesis: "用户在现实选择前会先担心选错方向",
        evidenceJson: ["offer"],
        counterEvidenceJson: [],
        confidence: 0.8,
        status: "active",
        lastValidatedAt: null,
      },
      {
        id: "h2",
        hypothesis: "用户害怕 AI 替代职业价值",
        evidenceJson: ["AI"],
        counterEvidenceJson: [],
        confidence: 0.7,
        status: "active",
        lastValidatedAt: null,
      },
      {
        id: "h3",
        hypothesis: "用户已确认自主性是长期模式",
        evidenceJson: ["自主"],
        counterEvidenceJson: [],
        confidence: 0.9,
        status: "confirmed",
        lastValidatedAt: "2026-06-01T00:00:00Z",
      },
      {
        id: "h4",
        hypothesis: "用户主要受城市约束影响",
        evidenceJson: ["城市"],
        counterEvidenceJson: [],
        confidence: 0.6,
        status: "active",
        lastValidatedAt: null,
      },
    ]);
    (streamLLM as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response("原因是 offer 需要和方向拆开看。")),
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    const call = (
      buildCoachingSystemPromptParts as ReturnType<typeof vi.fn>
    ).mock.calls.at(-1)?.[0];
    expect(call.coachingHypotheses).toHaveLength(3);
    expect(call.coachingHypotheses[0].id).toBe("h1");
  });

  it("passes a unified evidence packet assembled from current turn and stored context", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content: "这个 offer 会不会让我选错方向？",
          },
        ],
        reportSummary: {
          careerMatch: {
            directions: [
              {
                title_zh: "产品策略",
                fit_reason: "能结合分析和影响力",
              },
            ],
          },
          integration: {
            coreInsight: "用户需要把长期身份和现实机会拆开判断。",
          },
        },
        actionHubContext: {
          totalItems: 2,
          completedItems: 0,
          inProgressItems: 1,
          topPendingActions: ["约一位行业前辈聊 20 分钟"],
        },
        round: 2,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "m1",
        userId: "user-1",
        category: "career",
        keyword: "自主性",
        insight: "用户在职业选择里非常看重自主空间。",
        source: "coaching",
        confidence: 0.86,
        isActive: true,
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-01T00:00:00Z",
      },
    ]);
    (getActiveThemes as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "t1",
        userId: "user-1",
        theme: "反复担心选错方向",
        context: "offer 决策时出现",
        sentiment: "conflicted",
        mentionCount: 3,
        firstMentionedAt: "2026-06-01T00:00:00Z",
        lastMentionedAt: "2026-06-01T00:00:00Z",
        resolved: false,
      },
    ]);
    (getOpenCoachingHypotheses as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "h1",
        hypothesis: "用户在现实选择前会先担心选错方向",
        evidenceJson: ["offer"],
        counterEvidenceJson: [],
        confidence: 0.8,
        status: "active",
        lastValidatedAt: null,
      },
    ]);
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      archetype: { label_en: "Strategist", tagline_en: "maps before moves" },
      cognitiveStyleCode: "INTJ",
      narrativeSnapshots: {
        identitySummary: "用户倾向先看清系统再行动。",
        archetypeNarrative: "用户会先建模，再决定是否投入。",
      },
      algoSnapshot: {},
    });
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue({
      nonNegotiables: {
        selected: ["自主空间", "成长速度", "稳定现金流"],
        completedAt: "2026-06-01T00:00:00Z",
      },
    });
    (streamLLM as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response("原因是 offer 需要和方向拆开看。")),
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    const call = (
      buildCoachingSystemPromptParts as ReturnType<typeof vi.fn>
    ).mock.calls.at(-1)?.[0];
    expect(call.coachingEvidencePacket.currentTurnEvidence[0]).toMatchObject({
      text: "这个 offer 会不会让我选错方向？",
      source: "current_turn",
    });
    expect(
      call.coachingEvidencePacket.confirmedUserPatterns.length,
    ).toBeGreaterThan(0);
    expect(call.coachingEvidencePacket.openHypotheses[0]).toMatchObject({
      text: "用户在现实选择前会先担心选错方向",
      source: "coaching_hypothesis",
    });
    expect(
      call.coachingEvidencePacket.actionHubSignals.some(
        (item: { text: string }) =>
          item.text.includes("约一位行业前辈聊 20 分钟"),
      ),
    ).toBe(true);
    const totalItems = Object.values(call.coachingEvidencePacket).reduce(
      (sum: number, items) => sum + (items as unknown[]).length,
      0,
    );
    // 14 = raised evidence packet cap (see context-retriever.ts); more signals
    // now reach the coach through the real route instead of truncating at 8.
    expect(totalItems).toBeLessThanOrEqual(14);
  });

  it("uses the LLM judge as a second quality layer and rewrites failed turns", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content: "我问的是这个 offer 到底该不该接，你怎么看？",
          },
        ],
        round: 2,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (shouldRunLLMJudge as ReturnType<typeof vi.fn>).mockReturnValueOnce(true);
    (
      evaluateCoachingTurnWithLLMJudge as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      answered_user_actual_question: false,
      specificity_score: 2,
      evidence_grounding_score: 2,
      transition_score: 3,
      coaching_depth_score: 3,
      premature_advice: false,
      abstract_language_flag: true,
      missed_emotion_flag: false,
      recommended_fix: "先直接回答 offer 该不该接需要看什么判断条件。",
    });
    (streamLLM as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(
        new Response(
          "这个 offer 的确牵动职业判断。这就把问题连到你的长期方向。你最担心哪一点？",
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          "我会先这样看：这个 offer 该不该接，不能只看头衔，要看职责、现金流和它会不会把你推离长期方向。",
          { status: 200 },
        ),
      );

    const res = await handler(makeRequest());
    const text = await res.text();

    expect(evaluateCoachingTurnWithLLMJudge).toHaveBeenCalled();
    expect(enqueueCoachingReviewCandidate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "llm-judge-missed-user-question",
        userMessage: "我问的是这个 offer 到底该不该接，你怎么看？",
      }),
    );
    expect(streamLLM).toHaveBeenCalledTimes(2);
    expect(res.headers.get("X-Coaching-Quality-Rewrite")).toBe("1");
    expect(res.headers.get("X-Coaching-LLM-Judge")).toBe("fail");
    expect(text).toContain("该不该接");
  });

  it("creates a seven-day Action Hub follow-up on the final coaching round", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        ...validData,
        messages: [
          {
            role: "user",
            content: "那我这周就先写一条开口消息试试。",
          },
        ],
        round: 5,
        maxRounds: 5,
        locale: "zh",
      },
    });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 0,
      primaryRiasecType: "AI",
    });
    (streamLLM as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(
        new Response("可以，这个行动足够小，也能验证开口这一步。", {
          status: 200,
        }),
      ),
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    expect(createCoachingActionForActivePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        estimatedMinutes: 20,
      }),
    );
  });
});
