// Structured output layer for LLM calls.
// Provides callLLMStructured<T>() — a typed wrapper around callLLM that:
// 1. Passes native schema hints to providers (OpenAI json_schema, Anthropic tool_use, Gemini responseSchema)
// 2. Validates the response with Zod
// 3. On validation failure, retries once with the error fed back to the LLM
//
// Usage:
//   import { callLLMStructured } from '@/lib/ai/structured-output'
//   const result = await callLLMStructured('resume-parse', messages, ResumeDataSchema)

import type { ZodType } from "zod/v4";
import { callLLM, type CallLLMOptions, type LLMTask } from "./model-router";

const __DEV__ = process.env.NODE_ENV === "development";

type Message = { role: "system" | "user" | "assistant"; content: string };

export type StructuredOutputOptions = CallLLMOptions;

type StructuredFailureKind = "extraction" | "validation";

interface StructuredParseFailure {
  kind: StructuredFailureKind;
  summary: string;
}

type StructuredParseResult<T> =
  | { success: true; data: T }
  | { success: false; failure: StructuredParseFailure };

export class StructuredOutputError extends Error {
  readonly task: LLMTask;
  readonly attempts: number;
  readonly kind: StructuredFailureKind;

  constructor(input: {
    task: LLMTask;
    attempts: number;
    failure: StructuredParseFailure;
  }) {
    const label =
      input.failure.kind === "validation"
        ? "Schema validation failed"
        : "JSON extraction failed";
    super(
      `[structured-output] ${label} after retry for task "${input.task}": ${input.failure.summary}`,
    );
    this.name = "StructuredOutputError";
    this.task = input.task;
    this.attempts = input.attempts;
    this.kind = input.failure.kind;
  }
}

/**
 * Call an LLM and validate the response against a Zod schema.
 *
 * Flow:
 * 1. Call callLLM with responseFormat: "json" + schema metadata
 * 2. Extract JSON from response (handles markdown fences)
 * 3. Validate with Zod schema
 * 4. On validation failure: retry once with error feedback to LLM
 * 5. On second failure: throw (caller's fallback logic takes over)
 */
export async function callLLMStructured<T>(
  task: LLMTask,
  messages: Message[],
  schema: ZodType<T>,
  options?: StructuredOutputOptions,
): Promise<T> {
  // Call with JSON response format (no native schema enforcement
  // to avoid Anthropic tool_use truncation and Gemini responseSchema incompatibilities).
  // Validation is done post-hoc with Zod.
  const raw = await callLLM(task, messages, {
    ...options,
    responseFormat: "json",
  });

  if (__DEV__)
    console.log(
      `[structured-output] ${task} raw (${raw.length} chars):`,
      raw.slice(0, 300),
    );
  const result = parseStructuredOutput(task, raw, schema);
  if (result.success) return result.data;

  // Validation retry: feed the error back to the LLM
  observeStructuredRetry(task, result.failure);
  const correctionMessages: Message[] = [
    ...messages,
    { role: "assistant", content: raw },
    {
      role: "user",
      content: buildCorrectionPrompt(result.failure),
    },
  ];

  const retryRaw = await callLLM(task, correctionMessages, {
    ...options,
    responseFormat: "json",
  });

  const retryResult = parseStructuredOutput(task, retryRaw, schema);
  if (retryResult.success) return retryResult.data;

  // Both attempts failed — throw with details
  throw new StructuredOutputError({
    task,
    attempts: 2,
    failure: retryResult.failure,
  });
}

/**
 * Extract JSON from an LLM response that may be wrapped in markdown fences
 * or have text before/after the JSON object.
 *
 * Strategy (in order):
 * 1. Direct JSON.parse
 * 2. Strip ```json ... ``` fences, then parse
 * 3. Scan for balanced JSON object/array candidates, then parse
 * 4. If the response looks truncated, attempt conservative closure repair
 */
export function extractJSON(raw: string): unknown {
  const text = raw.trim();

  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // 2. Strip markdown code fences
  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    return extractJSONFromText(fenceMatch[1].trim());
  }

  return extractJSONFromText(text);
}

function extractJSONFromText(text: string): unknown {
  // 3. Find balanced JSON candidates, respecting strings and nested values.
  // This skips prose snippets such as "Use {placeholder}" before the real JSON.
  const candidates = findBalancedJSONCandidates(text);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next balanced candidate.
    }
  }

  const start = findFirstJSONStart(text);
  if (start === -1) {
    throw new Error(
      `[extractJSON] No JSON object or array found in response (${text.length} chars)`,
    );
  }

  try {
    // 4. Attempt truncated JSON repair (maxTokens cutoff).
    return JSON.parse(repairTruncatedJSON(text.slice(start)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[extractJSON] Failed to parse JSON candidate (${text.length} chars): ${message}`,
      { cause: err },
    );
  }
}

function findFirstJSONStart(text: string): number {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  if (firstBrace === -1) return firstBracket;
  if (firstBracket === -1) return firstBrace;
  return Math.min(firstBrace, firstBracket);
}

function findBalancedJSONCandidates(text: string): string[] {
  const candidates: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "{" && ch !== "[") continue;
    const candidate = readBalancedJSONCandidate(text, i);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

function readBalancedJSONCandidate(
  text: string,
  start: number,
): string | null {
  const first = text[start];
  const stack = [first === "{" ? "}" : "]"];
  let inString = false;
  let escaped = false;

  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      stack.push("}");
    } else if (ch === "[") {
      stack.push("]");
    } else if (ch === "}" || ch === "]") {
      if (ch !== stack[stack.length - 1]) return null;
      stack.pop();
      if (stack.length === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

/**
 * Attempt to repair JSON truncated by maxTokens cutoff.
 * Closes unclosed strings, arrays, and objects.
 */
function repairTruncatedJSON(text: string): string {
  // Remove trailing incomplete key-value pair or comma
  let repaired = text
    .replace(/,\s*"[^"]*$/, "") // trailing incomplete key
    .replace(/:\s*"[^"]*$/, ': ""') // trailing incomplete string value
    .replace(/,\s*$/, ""); // trailing comma

  // Close unclosed strings
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) repaired += '"';

  // Close unclosed brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
      inString = !inString;
    }
    if (!inString) {
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }
  }

  repaired += "]".repeat(Math.max(0, openBrackets));
  repaired += "}".repeat(Math.max(0, openBraces));

  return repaired;
}

/** Format Zod errors into a concise string for LLM correction prompts. */
function formatZodError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => {
      const path =
        issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}

function parseStructuredOutput<T>(
  _task: LLMTask,
  raw: string,
  schema: ZodType<T>,
): StructuredParseResult<T> {
  let parsed: unknown;
  try {
    parsed = extractJSON(raw);
  } catch (err) {
    return {
      success: false,
      failure: {
        kind: "extraction",
        summary: err instanceof Error ? err.message : String(err),
      },
    };
  }

  const result = schema.safeParse(parsed);
  if (result.success) return { success: true, data: result.data };

  return {
    success: false,
    failure: {
      kind: "validation",
      summary: formatZodError(result.error),
    },
  };
}

function buildCorrectionPrompt(failure: StructuredParseFailure): string {
  const problem =
    failure.kind === "validation"
      ? "had validation errors"
      : "could not be parsed as JSON";
  return `Your JSON response ${problem}:\n${failure.summary}\n\nPlease return only valid JSON that matches the requested schema. Do not include markdown fences or explanatory text.`;
}

function observeStructuredRetry(
  task: LLMTask,
  failure: StructuredParseFailure,
): void {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.LLM_JSON_OBSERVABILITY !== "true"
  ) {
    return;
  }

  console.warn(
    JSON.stringify({
      level: "warn",
      event: "llm_json_retry",
      task,
      kind: failure.kind,
      summary: failure.summary.slice(0, 300),
      ts: new Date().toISOString(),
    }),
  );
}
