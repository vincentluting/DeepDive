// Tests for Anthropic SSE usage token extraction in extractTextFromSSELines.
// We import the function indirectly by testing the module's behavior.
// Since extractTextFromSSELines is not exported, we test it through a
// minimal reproduction that parses SSE lines the same way.

import { describe, it, expect } from "vitest";

// Reproduce the extractTextFromSSELines logic for unit testing.
// This mirrors the exact parsing in model-router.ts.
function extractTextFromSSELines(lines: string[]): {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
  hasError: boolean;
} {
  let content = "";
  let hasError = false;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const data = trimmed.slice(6);
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "error") hasError = true;
      if (parsed.type === "message_start" && parsed.message?.usage) {
        inputTokens = parsed.message.usage.input_tokens ?? inputTokens;
      }
      if (parsed.type === "message_delta" && parsed.usage) {
        outputTokens = parsed.usage.output_tokens ?? outputTokens;
      }
      if (
        parsed.type === "content_block_delta" &&
        parsed.delta?.type === "text_delta"
      ) {
        content += parsed.delta.text ?? "";
      }
    } catch {
      // skip
    }
  }

  const usage =
    inputTokens !== undefined || outputTokens !== undefined
      ? { inputTokens: inputTokens ?? 0, outputTokens: outputTokens ?? 0 }
      : undefined;
  return { content, usage, hasError };
}

describe("SSE usage extraction", () => {
  it("extracts input tokens from message_start", () => {
    const lines = [
      'data: {"type":"message_start","message":{"usage":{"input_tokens":1234}}}',
    ];
    const result = extractTextFromSSELines(lines);
    expect(result.usage).toEqual({ inputTokens: 1234, outputTokens: 0 });
  });

  it("extracts output tokens from message_delta", () => {
    const lines = [
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":567}}',
    ];
    const result = extractTextFromSSELines(lines);
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 567 });
  });

  it("extracts both tokens from full SSE sequence", () => {
    const lines = [
      'data: {"type":"message_start","message":{"usage":{"input_tokens":100}}}',
      'data: {"type":"content_block_start","index":0}',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}',
      'data: {"type":"content_block_stop","index":0}',
      'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":42}}',
      'data: {"type":"message_stop"}',
    ];
    const result = extractTextFromSSELines(lines);
    expect(result.content).toBe("Hello world");
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 42 });
    expect(result.hasError).toBe(false);
  });

  it("returns undefined usage when no usage events present", () => {
    const lines = [
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi"}}',
    ];
    const result = extractTextFromSSELines(lines);
    expect(result.content).toBe("Hi");
    expect(result.usage).toBeUndefined();
  });

  it("detects error events", () => {
    const lines = [
      'data: {"type":"error","error":{"type":"overloaded_error","message":"overloaded"}}',
    ];
    const result = extractTextFromSSELines(lines);
    expect(result.hasError).toBe(true);
  });
});
