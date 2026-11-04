// Integration test for the model-router + provider-health hand-off.
//
// We mock everything around the router (provider clients + LLM usage logging)
// AND we mock @/lib/db/connection.sql so provider-health reads controllable
// aggregate rows. The test then calls callLLM and inspects which provider
// client actually received the request — proving health-aware reordering
// flows all the way through.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks so the vi.mock() factories can reference them ──

const {
  mockAnthropicCreateMessage,
  mockOpenAICreate,
  mockCallGemini,
  mockLogLLMUsage,
  mockCaptureMessage,
  mockCaptureException,
  mockGetMockResponse,
  mockGetMockStreamResponse,
  mockFetchOpenAIChatStream,
  sqlMock,
} = vi.hoisted(() => ({
  mockAnthropicCreateMessage: vi.fn(),
  mockOpenAICreate: vi.fn(),
  mockCallGemini: vi.fn(),
  mockLogLLMUsage: vi.fn(),
  mockCaptureMessage: vi.fn(),
  mockCaptureException: vi.fn(),
  mockGetMockResponse: vi.fn(),
  mockGetMockStreamResponse: vi.fn(
    () => new Response("mock stream", { status: 200 }),
  ),
  mockFetchOpenAIChatStream: vi.fn(
    () => new Response("openai stream", { status: 200 }),
  ),
  sqlMock: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: mockCaptureMessage,
  captureException: mockCaptureException,
}));

vi.mock("../anthropic-client", () => ({
  getAnthropicClient: () => ({ createMessage: mockAnthropicCreateMessage }),
  isAnthropicAvailable: () => !!process.env.ANTHROPIC_API_KEY,
}));

vi.mock("../openai-client", () => ({
  getOpenAIClient: () => ({
    chat: { completions: { create: mockOpenAICreate } },
  }),
}));

vi.mock("../gemini-client", () => ({
  callGemini: mockCallGemini,
  isGeminiAvailable: () => !!process.env.GOOGLE_API_KEY,
}));

vi.mock("../../db/llm-usage", () => ({
  logLLMUsage: mockLogLLMUsage,
  getRecentProviderFailures: vi.fn(async () => []),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

vi.mock("../test-fixtures", () => ({
  getMockResponse: mockGetMockResponse,
  getMockStreamResponse: mockGetMockStreamResponse,
}));

vi.mock("../stream-openai-response", () => ({
  fetchOpenAIChatStream: mockFetchOpenAIChatStream,
}));

// ── Helpers ────────────────────────────────────────────────

function armSqlRows(
  rows: Array<{
    provider: string;
    total: number;
    ok: number;
    degraded: number;
  }>,
) {
  sqlMock.mockReset();
  sqlMock.mockResolvedValue(rows);
}

function goodAnthropicResponse(text = "anthropic-says-hi") {
  mockAnthropicCreateMessage.mockResolvedValue({
    content: [{ type: "text", text }],
    usage: { input_tokens: 10, output_tokens: 5 },
  });
}
function goodOpenAIResponse(text = "openai-says-hi") {
  mockOpenAICreate.mockResolvedValue({
    choices: [{ message: { content: text } }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  });
}
function goodGeminiResponse(text = "gemini-says-hi") {
  mockCallGemini.mockResolvedValue({
    text,
    inputTokens: 10,
    outputTokens: 5,
  });
}

// ── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  // All three provider keys present so availability is never the reason
  // a provider is skipped — isolates the health-routing decision.
  vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic");
  vi.stubEnv("OPENAI_API_KEY", "test-openai");
  vi.stubEnv("GOOGLE_API_KEY", "test-gemini");
  // Hermetic: pin every import-time env that model-router.ts or
  // provider-health.ts reads at module load. Without this, an outer
  // shell with e.g. E2E_USE_GROQ=true would reroute every task to
  // Groq, or LLM_HEALTH_UNHEALTHY_THRESHOLD=0.5 would silently change
  // the demotion boundary. The two Anthropic models must be CLEARLY
  // distinct so the Haiku-regression assertion can't pass accidentally
  // via a shared prefix.
  vi.stubEnv("LLM_HEALTH_ROUTING_DISABLED", "");
  vi.stubEnv("LLM_HEALTH_WINDOW_MIN", "10");
  vi.stubEnv("LLM_HEALTH_MIN_CALLS", "3");
  vi.stubEnv("LLM_HEALTH_UNHEALTHY_THRESHOLD", "0.8");
  vi.stubEnv("LLM_HEALTH_DEGRADED_THRESHOLD", "0.95");
  vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-test");
  vi.stubEnv("ANTHROPIC_HAIKU_MODEL", "claude-haiku-test");
  vi.stubEnv("OPENAI_MODEL", "gpt-test");
  vi.stubEnv("GEMINI_MODEL", "gemini-test");
  vi.stubEnv("E2E_USE_GROQ", "");
  vi.stubEnv("GROQ_API_KEY", "");
  vi.stubEnv("LLM_TEST_MODE", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("health-aware routing end-to-end", () => {
  it("demotes gemini when success rate is below threshold, routing career-match-narrative to anthropic", async () => {
    // career-match-narrative is declared as { provider: 'gemini', fallbacks: [anthropic, openai] }.
    // With gemini at 10% success rate over the window, selectHealthiest should
    // demote it. Anthropic (100%) should receive the call.
    armSqlRows([
      { provider: "gemini", total: 10, ok: 1, degraded: 0 },
      { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
      { provider: "openai", total: 10, ok: 10, degraded: 0 },
    ]);
    goodAnthropicResponse("health-demoted-to-anthropic");
    goodGeminiResponse("should-not-be-called");
    goodOpenAIResponse("should-not-be-called");

    const { callLLM } = await import("../model-router");
    const result = await callLLM("career-match-narrative", [
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("health-demoted-to-anthropic");
    expect(mockAnthropicCreateMessage).toHaveBeenCalledTimes(1);
    expect(mockCallGemini).not.toHaveBeenCalled();
    expect(mockOpenAICreate).not.toHaveBeenCalled();

    // logLLMUsage should still mark provider=gemini (declared primary)
    // and effective/logged provider=anthropic → degraded=true. Check the
    // first success log (ignore circuit-seed attempts which may produce
    // other calls).
    const successLog = mockLogLLMUsage.mock.calls.find(
      (c: unknown[]) => (c[0] as { success: boolean }).success === true,
    );
    expect(successLog).toBeDefined();
    const payload = successLog![0] as {
      provider: string;
      degraded: boolean;
    };
    expect(payload.provider).toBe("anthropic");
    expect(payload.degraded).toBe(true);
  });

  it("stays on the original primary when nothing is unhealthy", async () => {
    armSqlRows([
      { provider: "gemini", total: 10, ok: 10, degraded: 0 },
      { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
    ]);
    goodGeminiResponse("gemini-was-fine");

    const { callLLM } = await import("../model-router");
    const result = await callLLM("career-match-narrative", [
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("gemini-was-fine");
    expect(mockCallGemini).toHaveBeenCalledTimes(1);
    expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
  });

  it("falls back silently to static behavior when sql throws", async () => {
    sqlMock.mockReset();
    sqlMock.mockRejectedValue(new Error("ECONNREFUSED"));
    goodGeminiResponse("gemini-primary-unchanged");

    const { callLLM } = await import("../model-router");
    const result = await callLLM("career-match-narrative", [
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("gemini-primary-unchanged");
    expect(mockCallGemini).toHaveBeenCalledTimes(1);
  });

  it("respects the kill switch — no DB query, static routing preserved", async () => {
    vi.stubEnv("LLM_HEALTH_ROUTING_DISABLED", "1");
    // Even if DB "would" say gemini is unhealthy, the kill switch short-
    // circuits the whole path before any aggregate query runs.
    armSqlRows([{ provider: "gemini", total: 10, ok: 1, degraded: 0 }]);
    goodGeminiResponse("gemini-still-primary-with-kill-switch");

    const { callLLM } = await import("../model-router");
    const result = await callLLM("career-match-narrative", [
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("gemini-still-primary-with-kill-switch");
    expect(sqlMock).not.toHaveBeenCalled();
    expect(mockCallGemini).toHaveBeenCalledTimes(1);
    expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
  });

  it("preserves task-specific model when failover re-enters the declared primary (coaching-first)", async () => {
    // coaching-first: provider=anthropic, model=HAIKU_MODEL, fallbacks=[openai].
    // Demote anthropic → health picks openai. If openai fails, the failover
    // should retry anthropic — BUT with HAIKU_MODEL (the task's config), not
    // the default ANTHROPIC_MODEL. This is the regression codex flagged
    // during commit 3 review.
    armSqlRows([
      { provider: "anthropic", total: 10, ok: 1, degraded: 0 }, // unhealthy
      { provider: "openai", total: 10, ok: 10, degraded: 0 }, // healthy
    ]);
    // OpenAI fails → trigger failover back to anthropic
    mockOpenAICreate.mockRejectedValue(new Error("openai down"));
    goodAnthropicResponse("haiku-rescued-the-call");

    const { callLLM } = await import("../model-router");
    const result = await callLLM("coaching-first", [
      { role: "user", content: "hi" },
    ]);

    expect(result).toBe("haiku-rescued-the-call");
    // Anthropic received the failover call — inspect the model arg.
    expect(mockAnthropicCreateMessage).toHaveBeenCalled();
    const callArgs = mockAnthropicCreateMessage.mock.calls[0];
    const anthropicPayload = callArgs[0] as { model?: string };
    // Should be the Haiku model configured on coaching-first. We stub
    // Haiku = "claude-haiku-test" and Sonnet = "claude-sonnet-test"
    // so this assertion cannot pass accidentally via shared prefix.
    expect(anthropicPayload.model).toBe("claude-haiku-test");
    expect(anthropicPayload.model).not.toBe("claude-sonnet-test");
  });
});
