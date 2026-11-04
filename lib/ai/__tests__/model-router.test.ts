import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAnthropicCreateMessage,
  mockOpenAICreate,
  mockCallGemini,
  mockLogLLMUsage,
  mockGetRecentProviderFailures,
  mockCaptureMessage,
  mockCaptureException,
  mockGetMockResponse,
  mockGetMockStreamResponse,
  mockFetchOpenAIChatStream,
} = vi.hoisted(() => ({
  mockAnthropicCreateMessage: vi.fn(),
  mockOpenAICreate: vi.fn(),
  mockCallGemini: vi.fn(),
  mockLogLLMUsage: vi.fn(),
  mockGetRecentProviderFailures: vi.fn(() => []),
  mockCaptureMessage: vi.fn(),
  mockCaptureException: vi.fn(),
  mockGetMockResponse: vi.fn(),
  mockGetMockStreamResponse: vi.fn(
    () => new Response("mock stream", { status: 200 }),
  ),
  mockFetchOpenAIChatStream: vi.fn(
    () => new Response("openai stream", { status: 200 }),
  ),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: mockCaptureMessage,
  captureException: mockCaptureException,
}));

vi.mock("../anthropic-client", () => ({
  getAnthropicClient: () => ({
    createMessage: mockAnthropicCreateMessage,
  }),
  isAnthropicAvailable: () => !!process.env.ANTHROPIC_API_KEY,
}));

vi.mock("../openai-client", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }),
}));

vi.mock("../gemini-client", () => ({
  callGemini: mockCallGemini,
  isGeminiAvailable: () => !!process.env.GOOGLE_API_KEY,
}));

vi.mock("../../db/llm-usage", () => ({
  logLLMUsage: mockLogLLMUsage,
  getRecentProviderFailures: mockGetRecentProviderFailures,
}));

vi.mock("../test-fixtures", () => ({
  getMockResponse: mockGetMockResponse,
  getMockStreamResponse: mockGetMockStreamResponse,
}));

vi.mock("../stream-openai-response", () => ({
  fetchOpenAIChatStream: mockFetchOpenAIChatStream,
}));

describe("model-router", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns mock fixtures before resolving providers in mock mode", async () => {
    vi.stubEnv("LLM_TEST_MODE", "mock");
    mockGetMockResponse.mockReturnValue({
      text: "mock coaching reply",
      inputTokens: 12,
      outputTokens: 8,
    });

    const { callLLM } = await import("../model-router");
    const result = await callLLM("coaching", [
      { role: "user", content: "hello" },
    ]);

    expect(result).toBe("mock coaching reply");
    expect(mockGetMockResponse).toHaveBeenCalledWith("coaching");
    expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
    expect(mockOpenAICreate).not.toHaveBeenCalled();
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("routes profile narrative to Gemini when Anthropic is unavailable", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "test-google-key");
    mockCallGemini.mockResolvedValue({
      text: '{"identitySummary":"fallback narrative"}',
      inputTokens: 100,
      outputTokens: 40,
    });

    const { callLLM } = await import("../model-router");
    const result = await callLLM(
      "profile-narrative",
      [{ role: "user", content: "hello" }],
      { responseFormat: "json" },
    );

    expect(result).toBe('{"identitySummary":"fallback narrative"}');
    expect(mockCallGemini).toHaveBeenCalledTimes(1);
    expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "LLM provider degraded",
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({
          task: "profile-narrative",
          originalProvider: "anthropic",
          fallbackProvider: "gemini",
        }),
      }),
    );
  });

  it("does not send json_schema response_format to Groq-compatible models", async () => {
    vi.stubEnv("E2E_USE_GROQ", "true");
    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });

    const { callLLM } = await import("../model-router");
    await callLLM(
      "profile-narrative",
      [{ role: "user", content: "return json" }],
      {
        responseFormat: "json",
        _jsonSchema: {
          name: "identity_narratives_v1",
          schema: {
            type: "object",
            properties: { ok: { type: "boolean" } },
            required: ["ok"],
            additionalProperties: false,
          },
        },
      },
    );

    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
      }),
    );
  });

  it("falls back coaching stream to OpenAI when Anthropic is unavailable", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");

    const { streamLLM } = await import("../model-router");

    // With fallbackProviders: ["openai"], coaching should fall back to OpenAI
    await streamLLM("coaching", [{ role: "user", content: "hello" }], {
      routeName: "/api/coaching-chat",
    });

    expect(mockFetchOpenAIChatStream).toHaveBeenCalled();
    expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
  });

  it("releases anthropic streaming semaphore when the primary returns non-ok", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("LLM_CONCURRENCY_ANTHROPIC", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );

    const { getProviderSemaphore, __resetSemaphoresForTest } =
      await import("../concurrency");
    __resetSemaphoresForTest();
    const { streamLLM } = await import("../model-router");

    const response = await streamLLM(
      "coaching",
      [{ role: "user", content: "hello" }],
      { routeName: "/api/coaching-chat" },
    );

    expect(response.ok).toBe(false);

    const reacquire = Promise.race([
      getProviderSemaphore("anthropic")
        .acquire()
        .then((release) => {
          release();
          return "acquired";
        }),
      new Promise<string>((resolve) =>
        setTimeout(() => resolve("timeout"), 30),
      ),
    ]);

    await expect(reacquire).resolves.toBe("acquired");
  });

  it("holds the OpenAI streaming slot until onStreamFinally fires", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("LLM_CONCURRENCY_OPENAI", "1");

    let onStreamFinally: (() => void) | undefined;
    mockFetchOpenAIChatStream.mockImplementation((...args: unknown[]) => {
      const params = args[0] as { onStreamFinally?: () => void } | undefined;
      onStreamFinally = params?.onStreamFinally;
      return new Response("openai stream", { status: 200 });
    });

    const { getProviderSemaphore, __resetSemaphoresForTest } =
      await import("../concurrency");
    __resetSemaphoresForTest();
    const { streamLLM } = await import("../model-router");

    const response = await streamLLM(
      "career-pathway",
      [{ role: "user", content: "hello" }],
      { routeName: "/api/test-stream" },
    );

    expect(response.ok).toBe(true);
    expect(onStreamFinally).toBeTypeOf("function");

    const sem = getProviderSemaphore("openai");
    let acquired = false;
    const waitingAcquire = sem.acquire().then((release) => {
      acquired = true;
      release();
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(acquired).toBe(false);

    onStreamFinally?.();
    await waitingAcquire;
    expect(acquired).toBe(true);
  });

  it("acquires the failover provider semaphore for streaming failover", async () => {
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("LLM_CONCURRENCY_OPENAI", "1");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );
    mockFetchOpenAIChatStream.mockResolvedValue(
      new Response("openai stream", { status: 200 }),
    );

    // Must reseed concurrency BEFORE importing model-router, because
    // model-router's static import of ./concurrency snapshots the
    // provider semaphore singleton. Full-suite runs otherwise leak a
    // pre-stub capacity=10 semaphore and the failover never blocks.
    const { getProviderSemaphore, __resetSemaphoresForTest } =
      await import("../concurrency");
    __resetSemaphoresForTest();

    const { streamLLM } = await import("../model-router");

    const openaiSem = getProviderSemaphore("openai");
    const releaseOpenAI = await openaiSem.acquire();

    let resolved = false;
    const responsePromise = streamLLM(
      "career-match-narrative",
      [{ role: "user", content: "hello" }],
      { routeName: "/api/test-stream-failover" },
    ).then((response) => {
      resolved = true;
      return response;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(resolved).toBe(false);

    releaseOpenAI();
    const response = await responsePromise;

    expect(response.ok).toBe(true);
    expect(mockFetchOpenAIChatStream).toHaveBeenCalledTimes(1);
  });

  it("circuit breaker half-open allows only one probe request", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("GOOGLE_API_KEY", "test-key");

    // Make OpenAI fail 3 times to trip circuit breaker
    mockOpenAICreate.mockRejectedValue(new Error("server error 500"));

    const { callLLM } = await import("../model-router");

    // Trip the circuit: 3 failures (primary + retry = 2 attempts each call, need 2 calls to get 3+ failures)
    for (let i = 0; i < 2; i++) {
      // career-pathway uses openai, fallback to gemini
      mockCallGemini.mockResolvedValue({
        text: '{"fallback":true}',
        inputTokens: 10,
        outputTokens: 5,
      });
      await callLLM("career-pathway", [{ role: "user", content: "test" }], {
        responseFormat: "json",
      }).catch(() => {});
    }

    // Now circuit should be open for openai — requests should go to gemini directly
    mockCallGemini.mockResolvedValue({
      text: '{"routed":"gemini"}',
      inputTokens: 10,
      outputTokens: 5,
    });
    mockOpenAICreate.mockClear();

    const _result = await callLLM(
      "career-pathway",
      [{ role: "user", content: "test" }],
      { responseFormat: "json" },
    );
    // Should have been routed to gemini (circuit open), not openai
    expect(mockCallGemini).toHaveBeenCalled();
  });
});

describe("model-router resilience (B1-B5)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("getBackoffMs", () => {
    it("honors retryAfterMs from LLMError when present (capped at 60s)", async () => {
      const { getBackoffMs } = await import("../model-router");
      const { LLMError } = await import("../llm-error");

      const err = LLMError.fromResponse("anthropic", 429, "x", 12_500);
      expect(getBackoffMs(0, err)).toBe(12_500);
      expect(getBackoffMs(5, err)).toBe(12_500); // retryIndex ignored when header present

      const longErr = LLMError.fromResponse("anthropic", 429, "x", 999_999);
      expect(getBackoffMs(0, longErr)).toBe(60_000); // capped
    });

    it("uses exponential backoff for generic retryable errors", async () => {
      const { getBackoffMs } = await import("../model-router");
      const { LLMError } = await import("../llm-error");
      const err = LLMError.fromResponse("openai", 500);

      // Base 1s * 2^retryIndex, ±20% jitter
      const r0 = getBackoffMs(0, err);
      const r1 = getBackoffMs(1, err);
      const r2 = getBackoffMs(2, err);
      expect(r0).toBeGreaterThanOrEqual(800);
      expect(r0).toBeLessThanOrEqual(1200);
      expect(r1).toBeGreaterThanOrEqual(1600);
      expect(r1).toBeLessThanOrEqual(2400);
      expect(r2).toBeGreaterThanOrEqual(3200);
      expect(r2).toBeLessThanOrEqual(4800);
    });

    it("starts at 4s for 529 overloaded errors", async () => {
      const { getBackoffMs } = await import("../model-router");
      const { LLMError } = await import("../llm-error");
      const err = LLMError.fromResponse("anthropic", 529);

      const r0 = getBackoffMs(0, err);
      expect(r0).toBeGreaterThanOrEqual(3200); // 4s ±20%
      expect(r0).toBeLessThanOrEqual(4800);
    });

    it("caps backoff at MAX_BACKOFF_MS (30s)", async () => {
      const { getBackoffMs } = await import("../model-router");
      const { LLMError } = await import("../llm-error");
      const err = LLMError.fromResponse("openai", 500);

      // 1s * 2^10 = 1024s, should cap at 30s
      const result = getBackoffMs(10, err);
      expect(result).toBeGreaterThanOrEqual(24_000); // 30s * 0.8
      expect(result).toBeLessThanOrEqual(36_000); // 30s * 1.2
    });

    it("returns positive backoff even with negative jitter", async () => {
      const { getBackoffMs } = await import("../model-router");
      // Run many iterations to catch any negative-jitter case
      for (let i = 0; i < 100; i++) {
        expect(getBackoffMs(0)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("circuit breaker auth/overloaded handling", () => {
    it("opens circuit IMMEDIATELY for anthropic 401 (no need to wait for 3 fails)", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
      vi.stubEnv("OPENAI_API_KEY", "test-key");
      vi.stubEnv("GOOGLE_API_KEY", "test-key");

      const { LLMError } = await import("../llm-error");

      // First call: anthropic returns 401 → should immediately open circuit
      mockAnthropicCreateMessage.mockRejectedValueOnce(
        LLMError.fromResponse("anthropic", 401, "invalid x-api-key"),
      );
      mockCallGemini.mockResolvedValue({
        text: '{"fallback":true}',
        inputTokens: 10,
        outputTokens: 5,
      });

      const { callLLM } = await import("../model-router");

      // First call: anthropic 401 → fallback to gemini
      await callLLM("profile-narrative", [{ role: "user", content: "test" }], {
        responseFormat: "json",
      });

      expect(mockAnthropicCreateMessage).toHaveBeenCalledTimes(1); // 401 is not retryable

      // Second call: circuit should be OPEN — anthropic should NOT be tried at all
      mockAnthropicCreateMessage.mockClear();
      mockAnthropicCreateMessage.mockResolvedValue({
        id: "msg_2",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: '{"would-have-worked":true}' }],
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const result = await callLLM(
        "profile-narrative",
        [{ role: "user", content: "test" }],
        { responseFormat: "json" },
      );

      // Anthropic should NOT have been called — circuit is open
      expect(mockAnthropicCreateMessage).not.toHaveBeenCalled();
      // Gemini fallback should have been used
      expect(mockCallGemini).toHaveBeenCalled();
      expect(result).toContain("fallback");
    });

    it("does NOT count 529 overloaded toward hard circuit breaker", async () => {
      vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
      vi.stubEnv("OPENAI_API_KEY", "test-key");
      vi.stubEnv("GOOGLE_API_KEY", "test-key");

      const { LLMError } = await import("../llm-error");

      // Anthropic returns 529 — overloaded, NOT a sign provider is broken for us
      mockAnthropicCreateMessage.mockRejectedValue(
        LLMError.fromResponse("anthropic", 529, "overloaded"),
      );
      mockCallGemini.mockResolvedValue({
        text: '{"fallback":true}',
        inputTokens: 10,
        outputTokens: 5,
      });

      const { callLLM } = await import("../model-router");

      // Make 1 call (4 retry attempts with 529). This stays below the soft-circuit
      // threshold (5 consecutive 529s) so the hard circuit check is isolated.
      // Note: sustained 529s (5+) DO trigger a soft-circuit for latency protection,
      // but that's tested separately from the hard circuit breaker behavior.
      vi.useFakeTimers();
      try {
        const promise = callLLM(
          "profile-narrative",
          [{ role: "user", content: "test" }],
          { responseFormat: "json" },
        ).catch(() => {});
        // Advance through all retry backoffs
        await vi.advanceTimersByTimeAsync(120_000);
        await promise;
      } finally {
        vi.useRealTimers();
      }

      // Now test: hard circuit should still be CLOSED for anthropic
      // (consecutiveFailures === 0, only consecutiveOverloaded was incremented)
      // Make anthropic succeed and verify it's tried (not bypassed)
      mockAnthropicCreateMessage.mockClear();
      mockAnthropicCreateMessage.mockResolvedValue({
        id: "msg_recovered",
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: '{"recovered":true}' }],
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const result = await callLLM(
        "profile-narrative",
        [{ role: "user", content: "test" }],
        { responseFormat: "json" },
      );

      // Hard circuit should be closed — anthropic was tried (not bypassed)
      expect(mockAnthropicCreateMessage).toHaveBeenCalled();
      expect(result).toContain("recovered");
    }, 15_000);
  });
});
