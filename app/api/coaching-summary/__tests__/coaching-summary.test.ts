import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
    DB_CONSTRAINT_FAILED: "DB_CONSTRAINT_FAILED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: vi.fn(),
}));

vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionForUser: vi.fn().mockResolvedValue(null),
  saveCoachingSession: vi.fn(),
  markCoachingSessionSaved: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getUserProfileInsights: vi.fn(),
  updateUserProfileInsights: vi.fn(),
}));

vi.mock("@/lib/db/memory", () => ({
  getUserMemories: vi.fn(),
  saveMemories: vi.fn(),
  reinforceMemoryConfidence: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: vi.fn(),
}));

vi.mock("@/lib/db/user-context", () => ({
  recomputeUserContext: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/coaching/extract-themes", () => ({
  extractAndSaveThemes: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/achievements/engine", () => ({
  checkAchievements: vi.fn().mockResolvedValue([]),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { getCurrentUser } from "@/lib/auth";
import { callLLM } from "@/lib/ai/model-router";
import {
  saveCoachingSession,
  markCoachingSessionSaved,
} from "@/lib/db/coaching";
import {
  getUserProfileInsights,
  updateUserProfileInsights,
} from "@/lib/db/profiles";
import {
  getUserMemories,
  saveMemories,
  reinforceMemoryConfidence,
} from "@/lib/db/memory";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/coaching-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

function allowGuard(user: { id: string } | null = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Blocked", { status }),
  });
}

const mockMessages = [
  { role: "user", content: "I feel stuck in my career" },
  { role: "assistant", content: "Tell me more about that feeling" },
  { role: "user", content: "I want more autonomy" },
];

const mockLLMResponse = JSON.stringify({
  coachingInsights: [
    { insight: "Desires more career autonomy", discoveredAt: "2026-03-23" },
  ],
  tensionUpdates: [{ tension: "stability vs growth", newStatus: "exploring" }],
  memories: [
    {
      category: "coaching_insight",
      keyword: "Career Shift",
      insight: "Actively considering a career transition",
      confidence: 0.8,
    },
  ],
  reinforcedKeywords: ["High Autonomy"],
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/coaching-summary", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 400 when validation fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("finalizes the stable session id supplied by the client", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "stable-session-id", messages: mockMessages, locale: "en" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (callLLM as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("skip extraction"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.sessionId).toBe("stable-session-id");
    expect(saveCoachingSession).toHaveBeenCalledTimes(1);
  });

  it("extracts insights and memories for authenticated user (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "session-1", messages: mockMessages, locale: "en" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", keyword: "High Autonomy", confidence: 0.8 },
    ]);
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(mockLLMResponse);
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: { coachingInsights: [], keyTensions: [] },
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (markCoachingSessionSaved as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (reinforceMemoryConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.insights.coachingInsights).toHaveLength(1);
    expect(json.memories).toHaveLength(1);
    expect(json.memories[0].keyword).toBe("Career Shift");

    expect(callLLM).toHaveBeenCalledWith(
      "coaching-summary",
      expect.any(Array),
      expect.objectContaining({ responseFormat: "json" }),
    );
    expect(saveMemories).toHaveBeenCalledTimes(1);
    expect(reinforceMemoryConfidence).toHaveBeenCalledWith(
      "m1",
      expect.any(Number),
    );
  });

  it("uses Dutch extraction instructions for nl coaching summaries", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "session-1", messages: mockMessages, locale: "nl" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify({
        coachingInsights: [
          {
            insight:
              "De gebruiker zoekt meer autonomie in werk en wil ruimte voor eigen keuzes",
            discoveredAt: "2026-03-23",
          },
        ],
        tensionUpdates: [],
        memories: [
          {
            category: "coaching_insight",
            keyword: "Autonomie in werk",
            insight:
              "Hij zoekt meer autonomie in werk en voelt zich beter met duidelijke ruimte voor eigen keuzes",
            confidence: 0.8,
          },
        ],
        reinforcedKeywords: [],
      }),
    );
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: { coachingInsights: [], keyTensions: [] },
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (markCoachingSessionSaved as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const messages = (callLLM as ReturnType<typeof vi.fn>).mock.calls[0][1] as
      | Array<{ role: string; content: string }>
      | undefined;
    const systemMsg = messages?.find((m) => m.role === "system");
    expect(systemMsg?.content).toContain("Dutch");
    expect(systemMsg?.content).toContain(
      "Every user-visible JSON string MUST be written entirely in Dutch",
    );
    expect(systemMsg?.content).not.toContain("2-6 word English tag");
  });

  it("returns success with null insights when LLM extraction fails", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "session-1", messages: mockMessages, locale: "en" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (callLLM as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("LLM timeout"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.insights).toBeNull();
    expect(json.insightExtractionFailed).toBe(true);
    expect(json.memories).toEqual([]);
  });

  it("returns 500 when DB save of coaching session fails", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "session-1", messages: mockMessages, locale: "zh" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB constraint"),
    );

    const res = await handler(makeRequest());
    // Session save failure is now fatal — client should know
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 500 on unexpected top-level error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unexpected"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });

  it("reinforces memory confidence with boost factor", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "session-1", messages: mockMessages, locale: "en" },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", keyword: "High Autonomy", confidence: 0.8 },
    ]);
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify({
        coachingInsights: [],
        tensionUpdates: [],
        memories: [],
        reinforcedKeywords: ["High Autonomy"],
      }),
    );
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: {},
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (markCoachingSessionSaved as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (reinforceMemoryConfidence as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    // 0.8 * 1.15 ≈ 0.92
    const call = (reinforceMemoryConfidence as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[0]).toBe("m1");
    expect(call[1]).toBeCloseTo(0.92, 5);
  });
});
