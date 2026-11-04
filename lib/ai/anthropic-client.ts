// Anthropic Messages API client for Deep Dive
// Mirrors openai-client.ts patterns: singleton, timeout, error handling.

import { validateKeyFormat } from "./health-check";
import { LLMError, parseRetryAfterMs } from "./llm-error";

const __DEV__ = process.env.NODE_ENV === "development";

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AnthropicSystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export type AnthropicCompletionParams = {
  model: string;
  system?: string | AnthropicSystemBlock[];
  messages: AnthropicMessage[];
  temperature?: number;
  max_tokens: number;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  tool_choice?:
    | { type: "tool"; name: string }
    | { type: "auto" }
    | { type: "any" };
};

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    };

export type AnthropicCompletionResponse = {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

/** Per-request timeout for Anthropic API calls (ms).
 * Set to 100s to give Claude Sonnet enough time for large prompts.
 * Profile narrative v2 generates ~6000 tokens of structured JSON which needs 60-90s.
 * The API route maxDuration (60s for profile, 100s for report) is the hard cap. */
const ANTHROPIC_TIMEOUT_MS = 100_000;

const ANTHROPIC_API_VERSION = "2023-06-01";

class AnthropicClient {
  constructor(private readonly apiKey: string) {}

  async createMessage(
    params: AnthropicCompletionParams,
  ): Promise<AnthropicCompletionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
          // Enable prompt caching for non-streaming calls.
          // Streaming (model-router.ts) sends this implicitly via cache_control blocks.
          "anthropic-beta": "prompt-caching-2024-07-31",
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (
        err instanceof DOMException ||
        (err as Error)?.name === "AbortError"
      ) {
        throw LLMError.timeout("anthropic", "request");
      }
      throw LLMError.networkError("anthropic", err);
    }

    if (!response.ok) {
      clearTimeout(timer);
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.error?.message || "";
      } catch {
        // Response body may not be JSON
      }
      // Anthropic returns retry-after on 429 / 529 to suggest precise wait time.
      const retryAfterMs = parseRetryAfterMs(
        response.headers.get("retry-after"),
      );
      console.error(
        `[anthropic] API error ${response.status}:`,
        detail.slice(0, 200),
        retryAfterMs ? `(retry-after: ${retryAfterMs}ms)` : "",
      );
      throw LLMError.fromResponse(
        "anthropic",
        response.status,
        detail,
        retryAfterMs,
      );
    }

    try {
      const data = await response.json();
      clearTimeout(timer);
      return data;
    } catch (err) {
      clearTimeout(timer);
      if (
        err instanceof DOMException ||
        (err as Error)?.name === "AbortError"
      ) {
        throw LLMError.timeout("anthropic", "body_read");
      }
      throw LLMError.networkError("anthropic", err);
    }
  }
}

let _client: AnthropicClient | null = null;
let _cachedKey: string | null = null;

export function getAnthropicClient(): AnthropicClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Re-create client if API key changed (e.g. rotation, Vercel redeploy)
  if (!_client || apiKey !== _cachedKey) {
    _client = new AnthropicClient(apiKey);
    _cachedKey = apiKey;
  }

  return _client;
}

/**
 * Check whether Anthropic is available — the key must be present AND format-valid.
 *
 * Format validation (sk-ant- prefix + length ≥ 20) catches three silent failures
 * that pure truthy checking would let through:
 *   - Empty string `""` from shell `export ANTHROPIC_API_KEY=""` masking .env.local
 *     (dotenv default = no-override). length 0 → fails length check.
 *   - Wrong-provider key (sk-… OpenAI key pasted into Anthropic env var). Wrong prefix.
 *   - Truncated copy-paste (`sk-ant-`). Too short.
 *
 * Returning false here means model-router picks a fallback immediately without
 * burning a 401 round-trip. The previous truthy-only implementation would let
 * an empty string through unless dotenv had loaded a real value over it.
 *
 * Used by the model router for graceful fallback to OpenAI.
 */
export function isAnthropicAvailable(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return false;
  return validateKeyFormat("anthropic", key).valid;
}
