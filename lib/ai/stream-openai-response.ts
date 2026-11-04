/**
 * Stream an OpenAI chat completion response as plain text chunks.
 * Parses the Server-Sent Events format and extracts delta.content tokens.
 *
 * Shared by coaching-chat route and model-router streaming failover.
 *
 * ## Timeout protection
 *
 * Two layers guard against hanging streams (OpenAI returns 200 OK but stops
 * sending data mid-stream):
 *
 * 1. **Inactivity timeout** (`streamOpenAIResponse`) — if no new chunk arrives
 *    for 15 seconds the stream is aborted with a `StreamTimeoutError`. The
 *    timer resets on every successful chunk.
 *
 * 2. **Overall timeout** (`fetchOpenAIChatStream`) — a hard 90-second wall-clock
 *    cap from the moment the stream starts being consumed. This catches
 *    pathologically slow but technically alive streams.
 */

import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

export interface StreamOptions {
  /** Called when the stream encounters an error during pull(). */
  onStreamError?: (err: unknown) => void;
  /** Called exactly once when the stream closes, errors, or is cancelled. */
  onStreamFinally?: () => void;
  /** Called when the stream completes with token usage data (from stream_options). */
  onComplete?: (usage: { inputTokens: number; outputTokens: number }) => void;
}

// ── High-level helper: fetch OpenAI streaming chat & return Response ──

export interface OpenAIChatStreamParams {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  /** Route name used in error logs, e.g. '/api/coaching-chat' */
  routeName: string;
  onStreamError?: (err: unknown) => void;
  onStreamFinally?: () => void;
  /** Called when the stream completes with token usage data (requires stream_options). */
  onComplete?: (usage: { inputTokens: number; outputTokens: number }) => void;
}

/** Inactivity timeout: abort if no data chunk received for this duration. */
const STREAM_INACTIVITY_TIMEOUT_MS = 15_000;

/** Overall stream timeout: abort if the entire stream takes longer than this. */
const OVERALL_STREAM_TIMEOUT_MS = 90_000;

/**
 * Calls OpenAI chat completions with streaming enabled and returns a
 * streaming `Response`. If any error occurs (missing key, upstream error),
 * an appropriate error Response is returned instead.
 *
 * The returned stream is protected by a 90-second overall wall-clock timeout.
 * Combined with the per-chunk inactivity timeout inside `streamOpenAIResponse`,
 * this ensures the client is never left waiting indefinitely.
 */
export async function fetchOpenAIChatStream(
  params: OpenAIChatStreamParams,
): Promise<Response> {
  const {
    messages,
    model = "gpt-4o-mini",
    temperature = 0.8,
    max_tokens = 1000,
    routeName,
    onStreamError,
    onStreamFinally,
    onComplete,
  } = params;

  // Groq mode: route through Groq's OpenAI-compatible streaming API
  const useGroq =
    process.env.E2E_USE_GROQ === "true" && !!process.env.GROQ_API_KEY;
  const apiKey = useGroq
    ? process.env.GROQ_API_KEY!
    : process.env.OPENAI_API_KEY;
  const baseUrl = useGroq
    ? "https://api.groq.com/openai/v1"
    : "https://api.openai.com/v1";

  if (!apiKey) {
    logApiError(routeName, ApiErrorCode.AI_NOT_CONFIGURED, {
      message: "OPENAI_API_KEY is not configured",
    });
    return createErrorResponse(
      ApiErrorCode.AI_NOT_CONFIGURED,
      "API key not configured. The OPENAI_API_KEY environment variable must be set.",
      503,
    );
  }

  const connController = new AbortController();
  const connTimeout = setTimeout(() => connController.abort(), 30_000);
  let openaiResponse: Response;
  try {
    openaiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Groq cannot serve OpenAI model ids — use the configured Groq model.
        model: useGroq
          ? process.env.GROQ_MODEL || "openai/gpt-oss-120b"
          : model,
        messages,
        temperature,
        max_tokens,
        stream: true,
        // Request token usage in the final streaming chunk (empty choices + usage object).
        // Supported by OpenAI since mid-2024; Groq also supports this parameter.
        stream_options: { include_usage: true },
      }),
      signal: connController.signal,
    });
  } catch (connErr) {
    clearTimeout(connTimeout);
    logApiError(routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: `OpenAI connection error: ${connErr}`,
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      "Could not connect to AI service. Please try again.",
      502,
    );
  }
  clearTimeout(connTimeout);

  if (!openaiResponse.ok) {
    const errorBody = await openaiResponse.text().catch(() => "");
    const status = openaiResponse.status;

    if (status === 401) {
      logApiError(routeName, ApiErrorCode.AI_KEY_INVALID, {
        message: `OpenAI API 401: ${errorBody}`,
      });
      return createErrorResponse(
        ApiErrorCode.AI_KEY_INVALID,
        "Invalid API key. Please check the OPENAI_API_KEY configuration.",
        502,
      );
    }
    if (status === 429) {
      logApiError(routeName, ApiErrorCode.AI_RATE_LIMITED, {
        message: `OpenAI API 429: ${errorBody}`,
      });
      return createErrorResponse(
        ApiErrorCode.AI_RATE_LIMITED,
        "AI service rate limit reached. Please wait a moment and try again.",
        429,
      );
    }

    logApiError(routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: `OpenAI API ${status}: ${errorBody}`,
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      `AI service error (${status}). Please try again.`,
      502,
    );
  }

  if (!openaiResponse.body) {
    logApiError(routeName, ApiErrorCode.AI_SERVICE_ERROR, {
      message: "No response body from OpenAI",
    });
    return createErrorResponse(
      ApiErrorCode.AI_SERVICE_ERROR,
      "No response from AI service.",
      502,
    );
  }

  const rawStream = streamOpenAIResponse(openaiResponse, {
    onStreamError,
    onStreamFinally,
    onComplete,
  });
  const stream = withOverallTimeout(
    rawStream,
    OVERALL_STREAM_TIMEOUT_MS,
    onStreamError,
  );
  return makeStreamingResponse(stream);
}

/**
 * Converts a raw OpenAI SSE response into a `ReadableStream<Uint8Array>` of
 * plain-text content tokens.
 *
 * **Inactivity timeout:** Each call to the underlying reader is raced against
 * a 15-second timer. If no data arrives within that window the stream is
 * aborted with a `StreamTimeoutError` and `options.onStreamError` is called.
 * The timer resets automatically on every successful chunk.
 */
function streamOpenAIResponse(
  openaiResponse: Response,
  options?: StreamOptions,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  if (!openaiResponse.body) {
    throw new Error("OpenAI response has no body");
  }
  const reader = openaiResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let finalized = false;
  // Track token usage from the final chunk (stream_options: { include_usage: true })
  let pendingUsage: { inputTokens: number; outputTokens: number } | null = null;

  function finish() {
    if (!finalized) {
      finalized = true;
      if (pendingUsage) {
        options?.onComplete?.(pendingUsage);
      }
      options?.onStreamFinally?.();
    }
  }

  function clearInactivityTimer() {
    if (inactivityTimer !== null) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  /**
   * Race `reader.read()` against the inactivity timeout.
   * Rejects with a `StreamTimeoutError` if no data arrives within the window.
   */
  function readWithTimeout(): Promise<ReadableStreamReadResult<Uint8Array>> {
    return new Promise((resolve, reject) => {
      let settled = false;

      inactivityTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          const err = new Error(
            `Stream inactivity timeout: no data received for ${STREAM_INACTIVITY_TIMEOUT_MS / 1000} seconds. ` +
              "The connection may have been lost. Please try again.",
          );
          err.name = "StreamTimeoutError";
          reader.cancel().catch(() => {});
          reject(err);
        }
      }, STREAM_INACTIVITY_TIMEOUT_MS);

      reader.read().then(
        (result) => {
          if (!settled) {
            settled = true;
            clearInactivityTimer();
            resolve(result);
          }
        },
        (err) => {
          if (!settled) {
            settled = true;
            clearInactivityTimer();
            reject(err);
          }
        },
      );
    });
  }

  return new ReadableStream({
    async pull(controller) {
      try {
        // Keep reading until at least one content token is enqueued (or the
        // stream ends). Returning from pull() without enqueuing stalls the
        // ReadableStream — reasoning models (e.g. gpt-oss on Groq) emit many
        // reasoning-only chunks that carry no `delta.content`.
        let enqueued = false;
        while (!enqueued) {
          const { done, value } = await readWithTimeout();
          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              const lines = buffer.split("\n");
              for (const line of lines) {
                if (
                  line.startsWith("data: ") &&
                  line.slice(6).trim() !== "[DONE]"
                ) {
                  try {
                    const parsed = JSON.parse(line.slice(6));
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(encoder.encode(content));
                    }
                  } catch {
                    /* skip unparseable chunks */
                  }
                }
              }
            }
            finish();
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              // Capture usage from any chunk that carries it — OpenAI may send
              // usage alongside a non-empty choices array (e.g., choices with
              // empty delta), so check unconditionally rather than only when
              // choices is empty.
              if (parsed.usage) {
                pendingUsage = {
                  inputTokens: parsed.usage.prompt_tokens ?? 0,
                  outputTokens: parsed.usage.completion_tokens ?? 0,
                };
              }
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
                enqueued = true;
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      } catch (err) {
        clearInactivityTimer();
        options?.onStreamError?.(err);
        finish();
        controller.error(err);
      }
    },
    cancel() {
      clearInactivityTimer();
      reader.cancel();
      finish();
    },
  });
}

/**
 * Wraps a `ReadableStream` with an overall wall-clock timeout.
 *
 * A background timer fires after `timeoutMs` milliseconds and cancels the
 * source stream. The next (or in-flight) `pull()` then surfaces a
 * `StreamTimeoutError` to the consumer so the frontend can prompt the user
 * to retry.
 *
 * The timer is cleaned up automatically when the stream closes or is
 * cancelled by the consumer.
 */
function withOverallTimeout(
  source: ReadableStream<Uint8Array>,
  timeoutMs: number,
  onError?: (err: unknown) => void,
): ReadableStream<Uint8Array> {
  const sourceReader = source.getReader();
  let overallTimer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  function clearOverallTimer() {
    if (overallTimer !== null) {
      clearTimeout(overallTimer);
      overallTimer = null;
    }
  }

  function buildTimeoutError(): Error {
    const err = new Error(
      `Stream timeout: total response time exceeded ${timeoutMs / 1000} seconds. ` +
        "The AI service may be overloaded. Please try again.",
    );
    err.name = "StreamTimeoutError";
    return err;
  }

  return new ReadableStream({
    start() {
      overallTimer = setTimeout(() => {
        timedOut = true;
        overallTimer = null;
        // Cancel the source stream so any pending read() resolves immediately
        sourceReader.cancel().catch(() => {});
      }, timeoutMs);
    },

    async pull(controller) {
      // If the timer already fired before pull() was called
      if (timedOut) {
        clearOverallTimer();
        const err = buildTimeoutError();
        onError?.(err);
        controller.error(err);
        return;
      }

      try {
        const { done, value } = await sourceReader.read();

        // Check if the timer fired while we were awaiting
        if (timedOut) {
          clearOverallTimer();
          const err = buildTimeoutError();
          onError?.(err);
          controller.error(err);
          return;
        }

        if (done) {
          clearOverallTimer();
          controller.close();
          return;
        }

        controller.enqueue(value);
      } catch (err) {
        clearOverallTimer();
        if (timedOut) {
          const timeoutErr = buildTimeoutError();
          onError?.(timeoutErr);
          controller.error(timeoutErr);
        } else {
          controller.error(err);
        }
      }
    },

    cancel() {
      clearOverallTimer();
      sourceReader.cancel().catch(() => {});
    },
  });
}

function makeStreamingResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
