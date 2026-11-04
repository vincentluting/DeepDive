import { describe, expect, it } from "vitest";
import { classifyError, formatErrorMessage, isTransientError } from "../errors";
import { nextBackoffSeconds } from "@/lib/db/pipeline";

describe("isTransientError", () => {
  it("treats network/timeout errors as transient", () => {
    expect(isTransientError(new Error("request timed out after 90s"))).toBe(
      true,
    );
    expect(isTransientError(new Error("fetch failed"))).toBe(true);
    expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
    expect(isTransientError(new Error("socket hang up"))).toBe(true);
  });

  it("treats 429/5xx/529 as transient", () => {
    expect(isTransientError(new Error("API error: 429 rate limit"))).toBe(true);
    expect(isTransientError(new Error("API error: 500 internal"))).toBe(true);
    expect(isTransientError(new Error("API error: 529 overloaded"))).toBe(true);
    expect(
      isTransientError(new Error("API error: 503 service unavailable")),
    ).toBe(true);
  });

  it("treats 4xx auth/validation errors as non-transient", () => {
    // After the validation/permanent split these still return `false` from
    // the legacy wrapper — but classifyError distinguishes them. See the
    // classifyError describe block below.
    expect(isTransientError(new Error("API error: 401 invalid api key"))).toBe(
      false,
    );
    expect(isTransientError(new Error("API error: 403 forbidden"))).toBe(false);
    expect(isTransientError(new Error("assessment not found"))).toBe(false);
    expect(isTransientError(new Error("missing required field: userId"))).toBe(
      false,
    );
    expect(isTransientError(new Error("validation failed"))).toBe(false);
  });

  it("treats narrative validation failures as non-transient (was previously default→true)", () => {
    // Regression guard for the 2026-05 stuck-user case (assessment 377de626):
    // these were being treated as transient and burned all 5 retries.
    expect(
      isTransientError(
        new Error(
          "narratives step: incomplete narrative payload for assessment X",
        ),
      ),
    ).toBe(false);
    expect(
      isTransientError(
        new Error(
          "narratives step: all LLM providers returned null for assessment X",
        ),
      ),
    ).toBe(false);
  });

  it("defaults unknown errors to transient (safe to retry)", () => {
    expect(isTransientError(new Error("weird error"))).toBe(true);
    expect(isTransientError("string error")).toBe(true);
    expect(isTransientError({ weird: "object" })).toBe(true);
  });
});

describe("classifyError", () => {
  it("classifies network/timeout/5xx as transient", () => {
    expect(classifyError(new Error("fetch failed"))).toBe("transient");
    expect(classifyError(new Error("API error: 500 internal"))).toBe(
      "transient",
    );
    expect(classifyError(new Error("API error: 529 overloaded"))).toBe(
      "transient",
    );
    expect(classifyError(new Error("rate limit"))).toBe("transient");
  });

  it("classifies narrative schema gates as validation (not transient, not permanent)", () => {
    expect(
      classifyError(
        new Error("narratives step: incomplete narrative payload for X"),
      ),
    ).toBe("validation");
    expect(
      classifyError(
        new Error("narratives step: all LLM providers returned null for X"),
      ),
    ).toBe("validation");
    expect(classifyError(new Error("profile X missing algoSnapshot"))).toBe(
      "validation",
    );
  });

  it("classifies auth / 4xx / missing-required as permanent", () => {
    expect(classifyError(new Error("API error: 401 invalid api key"))).toBe(
      "permanent",
    );
    expect(classifyError(new Error("missing required field: userId"))).toBe(
      "permanent",
    );
    expect(classifyError(new Error("assessment 123 not found"))).toBe(
      "permanent",
    );
    expect(classifyError(new Error("validation failed"))).toBe("permanent");
  });

  it("permanent wins over validation when both match", () => {
    // "validation" pattern in PERMANENT_PATTERNS dominates.
    // "missing required" wins permanent even though it sounds like validation.
    expect(
      classifyError(new Error("validation: incomplete narrative payload")),
    ).toBe("permanent");
  });

  it("defaults unknown errors to transient", () => {
    expect(classifyError(new Error("something inexplicable"))).toBe(
      "transient",
    );
    expect(classifyError("plain string")).toBe("transient");
    expect(classifyError({ weird: "object" })).toBe("transient");
  });
});

describe("nextBackoffSeconds", () => {
  it("returns 0 on first attempt (no prior failures)", () => {
    expect(nextBackoffSeconds(0)).toBe(0);
  });

  it("doubles each retry up to the cap", () => {
    // retry#1=60, retry#2=120, retry#3=240, retry#4=480, retry#5=960
    expect(nextBackoffSeconds(1)).toBe(60);
    expect(nextBackoffSeconds(2)).toBe(120);
    expect(nextBackoffSeconds(3)).toBe(240);
    expect(nextBackoffSeconds(4)).toBe(480);
    expect(nextBackoffSeconds(5)).toBe(960);
  });

  it("caps at 1800s (30 min)", () => {
    expect(nextBackoffSeconds(10)).toBe(1800);
    expect(nextBackoffSeconds(99)).toBe(1800);
  });

  // Regression test for 2026-04-22 second cross-review finding:
  // Previously the function received the retry DELTA (0 or 1) instead of
  // the accumulated retryCount, so backoff collapsed to a constant 60s.
  // The SQL path now computes the same value from "retryCount" + delta,
  // so this function models the expected SQL output.
  it("scales exponentially with accumulated retryCount, not delta", () => {
    expect(nextBackoffSeconds(2)).toBeGreaterThan(nextBackoffSeconds(1));
    expect(nextBackoffSeconds(3)).toBeGreaterThan(nextBackoffSeconds(2));
    expect(nextBackoffSeconds(2) / nextBackoffSeconds(1)).toBe(2);
    expect(nextBackoffSeconds(3) / nextBackoffSeconds(2)).toBe(2);
  });
});

describe("formatErrorMessage", () => {
  it("truncates long error messages", () => {
    const long = "x".repeat(1000);
    expect(formatErrorMessage(new Error(long))).toHaveLength(500);
  });

  it("handles non-error values", () => {
    expect(formatErrorMessage("plain string")).toBe("plain string");
    expect(formatErrorMessage({ a: 1 })).toBe('{"a":1}');
    expect(formatErrorMessage(undefined)).toBe("Unknown error");
  });
});
