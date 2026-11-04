import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod/v4";
import { extractJSON } from "../structured-output";

// Mock callLLM to capture what callLLMStructured sends
const mockCallLLM = vi.fn();
vi.mock("../model-router", () => ({
  callLLM: (...args: unknown[]) => mockCallLLM(...args),
}));

import { callLLMStructured } from "../structured-output";

describe("extractJSON", () => {
  it("parses clean JSON object", () => {
    expect(extractJSON('{"name":"test"}')).toEqual({ name: "test" });
  });

  it("parses clean JSON array", () => {
    expect(extractJSON('[{"a":1}]')).toEqual([{ a: 1 }]);
  });

  it("strips ```json fences", () => {
    expect(extractJSON('```json\n{"key":"val"}\n```')).toEqual({ key: "val" });
  });

  it("strips ``` fences without language tag", () => {
    expect(extractJSON('```\n{"key":"val"}\n```')).toEqual({ key: "val" });
  });

  it("extracts JSON from text-before-json response", () => {
    expect(extractJSON('Here:\n{"a":1}\nEnd.')).toEqual({ a: 1 });
  });

  it("skips non-JSON braces before the real JSON", () => {
    expect(extractJSON('Use {placeholder}, then return {"a":1}')).toEqual({
      a: 1,
    });
  });

  it("handles braces inside JSON strings", () => {
    expect(extractJSON('Result: {"text":"keep {this} literal","ok":true}')).toEqual({
      text: "keep {this} literal",
      ok: true,
    });
  });

  it("extracts array from text-before-array response", () => {
    expect(extractJSON('The list:\n[{"k":"v"}]')).toEqual([{ k: "v" }]);
  });

  it("throws on empty input", () => {
    expect(() => extractJSON("")).toThrow();
  });

  it("throws on non-JSON text", () => {
    expect(() => extractJSON("plain text")).toThrow();
  });
});

describe("callLLMStructured", () => {
  const TestSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes responseFormat json to callLLM options", async () => {
    mockCallLLM.mockResolvedValueOnce('{"name":"test","value":42}');
    await callLLMStructured("resume-parse", [], TestSchema);

    expect(mockCallLLM).toHaveBeenCalledTimes(1);
    const opts = mockCallLLM.mock.calls[0][2];
    expect(opts.responseFormat).toBe("json");
  });

  it("returns validated data on success", async () => {
    mockCallLLM.mockResolvedValueOnce('{"name":"hello","value":7}');
    const result = await callLLMStructured("resume-parse", [], TestSchema);
    expect(result).toEqual({ name: "hello", value: 7 });
  });

  it("retries with error feedback on validation failure", async () => {
    // First call: invalid (missing required field)
    mockCallLLM.mockResolvedValueOnce('{"name":"","value":42}');
    // Second call (correction): valid
    mockCallLLM.mockResolvedValueOnce('{"name":"fixed","value":42}');

    const result = await callLLMStructured("resume-parse", [], TestSchema);
    expect(result).toEqual({ name: "fixed", value: 42 });
    expect(mockCallLLM).toHaveBeenCalledTimes(2);

    // The retry message should contain the validation error
    const retryMessages = mockCallLLM.mock.calls[1][1];
    const lastMsg = retryMessages[retryMessages.length - 1];
    expect(lastMsg.role).toBe("user");
    expect(lastMsg.content).toContain("validation errors");
  });

  it("retries with correction prompt on JSON extraction failure", async () => {
    mockCallLLM.mockResolvedValueOnce("plain text");
    mockCallLLM.mockResolvedValueOnce('{"name":"fixed","value":42}');

    const result = await callLLMStructured("resume-parse", [], TestSchema);
    expect(result).toEqual({ name: "fixed", value: 42 });

    const retryMessages = mockCallLLM.mock.calls[1][1];
    const lastMsg = retryMessages[retryMessages.length - 1];
    expect(lastMsg.content).toContain("could not be parsed as JSON");
  });

  it("throws after retry also fails validation", async () => {
    mockCallLLM.mockResolvedValue('{"bad":"data"}');
    await expect(
      callLLMStructured("resume-parse", [], TestSchema),
    ).rejects.toThrow("Schema validation failed after retry");
  });

  it("handles fenced JSON from LLM", async () => {
    mockCallLLM.mockResolvedValueOnce(
      '```json\n{"name":"fenced","value":1}\n```',
    );
    const result = await callLLMStructured("resume-parse", [], TestSchema);
    expect(result).toEqual({ name: "fenced", value: 1 });
  });
});

describe("output-schemas", () => {
  it("all schemas are valid Zod types", async () => {
    const schemas = await import("../output-schemas");
    const names = [
      "CareerMatchNarrativeSchema",
      "IdentityNarrativesCallASchema",
      "IdentityNarrativesCallBSchema",
      "Panel3LLMOutputSchema",
      "IntegrationLLMOutputSchema",
      "ResumeDataSchema",
      "MemoryExtractSchema",
      "CoachingSummarySchema",
    ];
    for (const name of names) {
      const schema = (schemas as Record<string, unknown>)[name];
      expect(schema).toBeDefined();
      expect(typeof (schema as z.ZodType).safeParse).toBe("function");
    }
  });
});
