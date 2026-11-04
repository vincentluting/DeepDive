// Google Gemini API client for Deep Dive
// Uses the Gemini REST API directly (no SDK dependency).
// Currently used for: career-match-narrative (structured narrative, JSON output).

import { validateKeyFormat } from "./health-check";
import { LLMError, parseRetryAfterMs } from "./llm-error";

const __DEV__ = process.env.NODE_ENV === "development";

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
  };
};

const GEMINI_TIMEOUT_MS = 90_000;
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiCallParams = {
  model: string;
  systemInstruction?: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature: number;
  maxTokens: number;
  wantJson: boolean;
  responseSchema?: Record<string, unknown>;
};

export async function callGemini(params: GeminiCallParams): Promise<{
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
}> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  // Separate system messages from conversation
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  if (params.systemInstruction) {
    systemParts.unshift(params.systemInstruction);
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: params.temperature,
      maxOutputTokens: params.maxTokens,
      ...(params.wantJson ? { responseMimeType: "application/json" } : {}),
      ...(params.responseSchema
        ? { responseSchema: params.responseSchema }
        : {}),
    },
  };

  if (systemParts.length > 0) {
    body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }

  const url = `${GEMINI_API_BASE}/${params.model}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException || (err as Error)?.name === "AbortError") {
      throw LLMError.timeout("gemini", "request");
    }
    throw LLMError.networkError("gemini", err);
  }

  if (!response.ok) {
    clearTimeout(timer);
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || "";
    } catch {
      // Response body may not be JSON
    }
    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    console.error(
      `[gemini] API error ${response.status}:`,
      detail.slice(0, 200),
      retryAfterMs ? `(retry-after: ${retryAfterMs}ms)` : "",
    );
    throw LLMError.fromResponse(
      "gemini",
      response.status,
      detail,
      retryAfterMs,
    );
  }

  let data: GeminiResponse;
  try {
    data = await response.json();
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException || (err as Error)?.name === "AbortError") {
      throw LLMError.timeout("gemini", "body_read");
    }
    throw LLMError.networkError("gemini", err);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty Gemini response");
  }

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount,
    outputTokens: data.usageMetadata?.candidatesTokenCount,
    cacheReadTokens: data.usageMetadata?.cachedContentTokenCount,
  };
}

/**
 * Check whether Gemini is available — the key must be present AND format-valid
 * (AIza prefix). Mirrors `isAnthropicAvailable` rationale: empty-string shell
 * masks, wrong-provider key pastes, and truncated keys are all rejected before
 * the model router commits to calling Gemini.
 */
export function isGeminiAvailable(): boolean {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return false;
  return validateKeyFormat("gemini", key).valid;
}
