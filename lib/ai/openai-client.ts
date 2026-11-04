// OpenAI-compatible client initialization and configuration for Deep Dive

import { LLMError, parseRetryAfterMs } from "./llm-error";

const __DEV__ = process.env.NODE_ENV === "development";

type Message = { role: "system" | "user" | "assistant"; content: string };

type CompletionParams = {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  response_format?:
    | { type: "json_object" }
    | { type: "text" }
    | {
        type: "json_schema";
        json_schema: {
          name: string;
          schema: Record<string, unknown>;
          strict: boolean;
        };
      };
};

type CompletionResponse = {
  choices: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
    };
  };
};

/** Per-request timeout for OpenAI API calls (ms).
 * Set to 90s to support failover scenarios where complex Anthropic prompts
 * (e.g. career-match-narrative) are routed to OpenAI as backup. */
const OPENAI_TIMEOUT_MS = 90_000;

class OpenAICompatibleClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.openai.com/v1",
  ) {}

  chat = {
    completions: {
      create: async (params: CompletionParams): Promise<CompletionResponse> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

        let response: Response;
        try {
          response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(params),
            signal: controller.signal,
          });
        } catch (err) {
          clearTimeout(timer);
          // Handle both DOMException (browser) and plain AbortError (Node.js)
          if (
            err instanceof DOMException ||
            (err as Error)?.name === "AbortError"
          ) {
            throw LLMError.timeout("openai", "request");
          }
          throw LLMError.networkError("openai", err);
        }

        // Keep timer active through body reading — only clear after response.json()
        if (!response.ok) {
          clearTimeout(timer);
          let detail = "";
          try {
            const body = await response.json();
            detail = body?.error?.message || "";
          } catch {
            // Response body may not be JSON
          }
          const retryAfterMs = parseRetryAfterMs(
            response.headers.get("retry-after"),
          );
          console.error(
            `[openai] API error ${response.status}:`,
            detail.slice(0, 200),
            retryAfterMs ? `(retry-after: ${retryAfterMs}ms)` : "",
          );
          throw LLMError.fromResponse(
            "openai",
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
            throw LLMError.timeout("openai", "body_read");
          }
          throw LLMError.networkError("openai", err);
        }
      },
    },
  };
}

let _client: OpenAICompatibleClient | null = null;
let _cachedKey: string | null = null;

export function getOpenAIClient(): OpenAICompatibleClient {
  // Groq mode: use Groq's OpenAI-compatible API (free for E2E testing)
  const useGroq =
    process.env.E2E_USE_GROQ === "true" && !!process.env.GROQ_API_KEY;

  if (useGroq) {
    const groqKey = process.env.GROQ_API_KEY!;
    if (!_client || groqKey !== _cachedKey) {
      _client = new OpenAICompatibleClient(
        groqKey,
        "https://api.groq.com/openai/v1",
      );
      _cachedKey = groqKey;
    }
    return _client;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Re-create client if API key changed (e.g. rotation, Vercel redeploy)
  if (!_client || apiKey !== _cachedKey) {
    _client = new OpenAICompatibleClient(apiKey);
    _cachedKey = apiKey;
  }

  return _client;
}

/**
 * LLM_CONFIG is now only used for OpenAI-routed tasks (career-pathway,
 * resume-parse, memory-extract, coaching-summary).
 * Narrative tasks (career-match-narrative, profile-narrative, integration,
 * coaching) are routed to Anthropic Claude via model-router.ts.
 */
export const LLM_CONFIG = {
  model: "gpt-4o-mini" as const,
  temperature: 0.4,
  maxTokens: {
    sectionA: 800,
    sectionB: 2000,
    sectionC: 1000,
    sectionD: 1000,
    sectionE: 800,
    integration: 2000,
    profile: 1500,
    coaching: 1000,
  },
} as const;

export type LLMSectionKey = keyof typeof LLM_CONFIG.maxTokens;
