import { describe, it, expect } from "vitest";
import { LLMError, parseRetryAfterMs } from "../llm-error";

describe("LLMError", () => {
  describe("fromResponse", () => {
    it("marks 429 as retryable with code=rate_limit", () => {
      const err = LLMError.fromResponse("openai", 429, "rate limit hit");
      expect(err).toBeInstanceOf(LLMError);
      expect(err.status).toBe(429);
      expect(err.provider).toBe("openai");
      expect(err.retryable).toBe(true);
      expect(err.code).toBe("rate_limit");
      expect(err.isRateLimit).toBe(true);
      expect(err.isAuth).toBe(false);
      expect(err.isOverloaded).toBe(false);
      expect(err.detail).toBe("rate limit hit");
      expect(err.message).toContain("429");
      expect(err.message).toContain("rate limited");
    });

    it("marks 500 as retryable with code=server", () => {
      const err = LLMError.fromResponse("anthropic", 500);
      expect(err.retryable).toBe(true);
      expect(err.code).toBe("server");
      expect(err.message).toContain("server error");
    });

    it("marks 502 as retryable with code=server", () => {
      const err = LLMError.fromResponse("gemini", 502);
      expect(err.retryable).toBe(true);
      expect(err.code).toBe("server");
    });

    it("marks 529 as retryable with code=overloaded", () => {
      const err = LLMError.fromResponse("anthropic", 529);
      expect(err.retryable).toBe(true);
      expect(err.code).toBe("overloaded");
      expect(err.isOverloaded).toBe(true);
      expect(err.isAuth).toBe(false);
      expect(err.message).toContain("overloaded");
    });

    it("marks 401 as not retryable with code=auth", () => {
      const err = LLMError.fromResponse("openai", 401);
      expect(err.retryable).toBe(false);
      expect(err.code).toBe("auth");
      expect(err.isAuth).toBe(true);
      expect(err.isOverloaded).toBe(false);
      expect(err.message).toContain("invalid API key");
    });

    it("marks 403 as not retryable with code=auth", () => {
      const err = LLMError.fromResponse("gemini", 403);
      expect(err.retryable).toBe(false);
      expect(err.code).toBe("auth");
      expect(err.isAuth).toBe(true);
      expect(err.message).toContain("invalid API key");
    });

    it("marks 400 as not retryable with code=bad_request", () => {
      const err = LLMError.fromResponse("anthropic", 400, "invalid request");
      expect(err.retryable).toBe(false);
      expect(err.code).toBe("bad_request");
      expect(err.detail).toBe("invalid request");
    });

    it("carries retryAfterMs when provided", () => {
      const err = LLMError.fromResponse(
        "anthropic",
        429,
        "rate limited",
        12_500,
      );
      expect(err.retryAfterMs).toBe(12_500);
    });
  });

  describe("timeout", () => {
    it("creates retryable request timeout with code=timeout", () => {
      const err = LLMError.timeout("openai", "request");
      expect(err.retryable).toBe(true);
      expect(err.status).toBe(0);
      expect(err.code).toBe("timeout");
      expect(err.message).toContain("request timed out");
    });

    it("creates retryable body_read timeout with code=timeout", () => {
      const err = LLMError.timeout("anthropic", "body_read");
      expect(err.retryable).toBe(true);
      expect(err.code).toBe("timeout");
      expect(err.message).toContain("response body read timed out");
    });
  });

  describe("instanceof", () => {
    it("is an Error", () => {
      const err = LLMError.fromResponse("openai", 500);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("LLMError");
    });
  });
});

describe("parseRetryAfterMs", () => {
  it("parses delta-seconds (integer)", () => {
    expect(parseRetryAfterMs("30")).toBe(30_000);
    expect(parseRetryAfterMs("0")).toBe(0);
    expect(parseRetryAfterMs("120")).toBe(120_000);
  });

  it("parses delta-seconds (float)", () => {
    expect(parseRetryAfterMs("1.5")).toBe(1_500);
  });

  it("parses HTTP-date", () => {
    const future = new Date(Date.now() + 5_000).toUTCString();
    const result = parseRetryAfterMs(future);
    expect(result).toBeDefined();
    // Allow some clock-drift slack
    expect(result!).toBeGreaterThan(3_000);
    expect(result!).toBeLessThan(7_000);
  });

  it("returns undefined for null/empty/garbage", () => {
    expect(parseRetryAfterMs(null)).toBeUndefined();
    expect(parseRetryAfterMs(undefined)).toBeUndefined();
    expect(parseRetryAfterMs("")).toBeUndefined();
    expect(parseRetryAfterMs("not-a-date")).toBeUndefined();
  });

  it("clamps past HTTP-dates to 0", () => {
    const past = new Date(Date.now() - 60_000).toUTCString();
    expect(parseRetryAfterMs(past)).toBe(0);
  });
});
