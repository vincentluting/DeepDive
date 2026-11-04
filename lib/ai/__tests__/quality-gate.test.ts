// Quality gate unit tests — covers all 6 verdicts + runWithQualityGate
// retry loop. Mocks logLLMQualityCheck so we don't hit the DB.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../db/llm-usage", () => ({
  logLLMQualityCheck: vi.fn(),
}));

import { checkQuality, runWithQualityGate } from "../quality-gate";
import { logLLMQualityCheck } from "../../db/llm-usage";

describe("checkQuality — static verdict", () => {
  it("pass: simple string output meeting minLength", () => {
    const o = checkQuality("a".repeat(500), { minLength: 300 });
    expect(o.result).toBe("pass");
  });

  it("fail-length: short string output", () => {
    const o = checkQuality("a".repeat(100), { minLength: 300 });
    expect(o.result).toBe("fail-length");
  });

  it("fail-field: JSON missing required field", () => {
    const o = checkQuality(
      { narrative: "ok" },
      { requiredFields: ["narrative", "keywords"] },
    );
    expect(o.result).toBe("fail-field");
    expect(o.detail).toContain("keywords");
  });

  it("fail-field: empty string treated as missing", () => {
    const o = checkQuality(
      { narrative: "   " },
      { requiredFields: ["narrative"] },
    );
    expect(o.result).toBe("fail-field");
  });

  it("fail-count: array length mismatch", () => {
    const o = checkQuality(
      { directions: [{ id: 1 }, { id: 2 }] },
      { expectedItemCounts: { directions: 3 } },
    );
    expect(o.result).toBe("fail-count");
    expect(o.detail).toContain("directions.length=2");
  });

  it("fail-count: missing array field", () => {
    const o = checkQuality(
      { foo: "bar" },
      { expectedItemCounts: { weeks: 4 } },
    );
    expect(o.result).toBe("fail-count");
  });

  it("fail-length: per-field minLengthFields", () => {
    const o = checkQuality(
      { coreInsight: "a".repeat(150), letterToUser: "short" },
      { minLengthFields: { coreInsight: 200, letterToUser: 50 } },
    );
    expect(o.result).toBe("fail-length");
    expect(o.detail).toContain("coreInsight");
  });

  it("pass: per-field minLengths satisfied", () => {
    const o = checkQuality(
      { coreInsight: "a".repeat(300), letterToUser: "b".repeat(60) },
      { minLengthFields: { coreInsight: 200, letterToUser: 50 } },
    );
    expect(o.result).toBe("pass");
  });

  it("fail-language: Chinese leaking into English output", () => {
    // Long text with significant Chinese content. Mirrors the "spontaneous
    // language drift" pitfall — LLM was supposed to write English but emitted
    // a chunk of Chinese.
    const text =
      "This is the start of an English narrative section that should be long enough to trigger detection. 你的职业方向告诉我们一些独特的故事关于真实的自己。我们将一起探索这些深层的可能性。";
    const o = checkQuality(text, {
      enforceLocale: "en",
      minLength: 40,
    });
    expect(o.result).toBe("fail-language");
  });

  it("pass: locale-matched English output", () => {
    const o = checkQuality(
      "A perfectly clean English narrative section that runs well past the minimum forty character threshold required for language detection to even consider running.",
      { enforceLocale: "en", minLength: 40 },
    );
    expect(o.result).toBe("pass");
  });

  it("fail-repetition: paragraphs with high bigram overlap", () => {
    const para =
      "the quick brown fox jumped over the lazy dog every morning at sunrise";
    const o = checkQuality(`${para}\n\n${para}`, {
      repetitionThreshold: 0.3,
    });
    expect(o.result).toBe("fail-repetition");
  });

  it("pass: distinct paragraphs", () => {
    const p1 =
      "the quick brown fox jumped over the lazy dog every morning at sunrise";
    const p2 =
      "an entirely different sentence with novel words and ideas about ocean waves rolling on distant shores";
    const o = checkQuality(`${p1}\n\n${p2}`, {
      repetitionThreshold: 0.3,
    });
    expect(o.result).toBe("pass");
  });

  it("not-checked-equivalent: empty config returns pass", () => {
    const o = checkQuality({ anything: "goes" }, {});
    expect(o.result).toBe("pass");
  });
});

describe("runWithQualityGate — retry + logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pass on first attempt", async () => {
    const call = vi.fn().mockResolvedValue("a".repeat(500));
    const r = await runWithQualityGate({
      taskName: "test-task",
      call,
      config: { minLength: 300 },
      qualityWindowStart: Date.now(),
    });
    expect(r.outcome.result).toBe("pass");
    expect(call).toHaveBeenCalledTimes(1);
    expect(logLLMQualityCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        taskName: "test-task",
        qualityCheckResult: "pass",
      }),
    );
  });

  it("retries when first attempt fails length", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce("short")
      .mockResolvedValueOnce("a".repeat(500));
    const r = await runWithQualityGate({
      taskName: "test-task",
      call,
      config: { minLength: 300 },
      qualityWindowStart: Date.now(),
      maxRetries: 1,
    });
    expect(r.outcome.result).toBe("pass");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("stops at maxRetries even if still failing", async () => {
    const call = vi.fn().mockResolvedValue("short");
    const r = await runWithQualityGate({
      taskName: "test-task",
      call,
      config: { minLength: 300 },
      qualityWindowStart: Date.now(),
      maxRetries: 2,
    });
    expect(r.outcome.result).toBe("fail-length");
    expect(call).toHaveBeenCalledTimes(3); // first + 2 retries
    expect(logLLMQualityCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        qualityCheckResult: "fail-length",
      }),
    );
  });

  it("threads userId to logLLMQualityCheck", async () => {
    const call = vi.fn().mockResolvedValue("a".repeat(500));
    await runWithQualityGate({
      taskName: "test-task",
      call,
      config: { minLength: 300 },
      qualityWindowStart: Date.now(),
      userId: "user-123",
    });
    expect(logLLMQualityCheck).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-123" }),
    );
  });

  it("returns the LAST value even when all gates fail (Phase 2: caller decides fallback)", async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce("first-short")
      .mockResolvedValueOnce("second-short-still");
    const r = await runWithQualityGate({
      taskName: "test-task",
      call,
      config: { minLength: 300 },
      qualityWindowStart: Date.now(),
      maxRetries: 1,
    });
    expect(r.outcome.result).toBe("fail-length");
    expect(r.value).toBe("second-short-still");
  });
});
