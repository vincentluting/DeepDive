// ============================================================
// Embeddings — standalone vector embedding client for semantic memory.
//
// Deliberately NOT routed through model-router.ts: embeddings are a different
// API class than chat completions (no temperature / max_tokens / fallback
// chain), and model-router.ts is a frozen file. This module owns its own
// OpenAI call, timeout, and error handling. It is designed to FAIL SOFT —
// callers (memory write, semantic retrieval) catch and degrade gracefully
// (NULL embedding column / keyword-only retrieval) when it throws.
// ============================================================

import { LLMError, parseRetryAfterMs } from "./llm-error";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536; // matches UserMemory.embedding vector(1536)
const EMBEDDING_TIMEOUT_MS = 30_000;
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

export const EMBEDDING_MODEL_ID = EMBEDDING_MODEL;
export const EMBEDDING_DIMENSIONS = EMBEDDING_DIMS;

/** Whether embeddings can be generated (OpenAI key present). Groq has no
 *  embeddings endpoint, so this is OpenAI-only regardless of E2E_USE_GROQ. */
export function isEmbeddingAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

type EmbeddingResponse = {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage?: { prompt_tokens: number; total_tokens: number };
};

/**
 * Embed a batch of texts. Returns vectors in the SAME order as the input.
 * Throws LLMError on failure — callers must decide whether to degrade.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: "float",
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException || (err as Error)?.name === "AbortError") {
      throw LLMError.timeout("openai", "request");
    }
    throw LLMError.networkError("openai", err);
  }

  if (!response.ok) {
    clearTimeout(timer);
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || "";
    } catch {
      /* body may not be JSON */
    }
    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
    console.error(
      `[embeddings] OpenAI error ${response.status}:`,
      detail.slice(0, 200),
    );
    throw LLMError.fromResponse(
      "openai",
      response.status,
      detail,
      retryAfterMs,
    );
  }

  let data: EmbeddingResponse;
  try {
    data = await response.json();
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException || (err as Error)?.name === "AbortError") {
      throw LLMError.timeout("openai", "body_read");
    }
    throw LLMError.networkError("openai", err);
  }

  // API returns results in input order, but re-sort by index defensively.
  return [...data.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Embed a single text. Throws LLMError on failure. */
export async function getEmbedding(text: string): Promise<number[]> {
  const [embedding] = await getEmbeddingsBatch([text]);
  if (!embedding) throw new Error("embedding generation returned no vector");
  return embedding;
}

/** Format a number[] as a pgvector literal "[0.1,0.2,...]" for SQL binding. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
