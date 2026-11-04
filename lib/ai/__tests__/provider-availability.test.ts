// ============================================================
// Provider Availability — format-aware truthy check
//
// Covers the silent failure modes that pure `!!process.env.X` would miss:
//   - empty string (shell mask masking .env.local — 2026-05-24 incident)
//   - invalid format / wrong-provider key paste
//   - truncated key
//
// Reference: scripts/check-env.ts shell-override detection +
//            instrumentation.ts startup classifier.
// ============================================================

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAnthropicAvailable } from "../anthropic-client";
import { isGeminiAvailable } from "../gemini-client";

describe("isAnthropicAvailable", () => {
  const ENV_NAME = "ANTHROPIC_API_KEY";
  let originalValue: string | undefined;
  let originalHadKey: boolean;

  beforeEach(() => {
    originalHadKey = Object.prototype.hasOwnProperty.call(
      process.env,
      ENV_NAME,
    );
    originalValue = process.env[ENV_NAME];
  });

  afterEach(() => {
    if (originalHadKey) {
      process.env[ENV_NAME] = originalValue ?? "";
    } else {
      delete process.env[ENV_NAME];
    }
  });

  it("returns false when ANTHROPIC_API_KEY is unset", () => {
    delete process.env[ENV_NAME];
    expect(isAnthropicAvailable()).toBe(false);
  });

  it("returns false when ANTHROPIC_API_KEY is empty string (shell mask scenario)", () => {
    process.env[ENV_NAME] = "";
    expect(isAnthropicAvailable()).toBe(false);
  });

  it("returns false when key is too short (truncated paste)", () => {
    process.env[ENV_NAME] = "sk-ant-";
    expect(isAnthropicAvailable()).toBe(false);
  });

  it("returns false when key lacks sk-ant- prefix (wrong provider paste)", () => {
    // Realistic mistake: pasting an OpenAI sk-... key into ANTHROPIC_API_KEY.
    process.env[ENV_NAME] = "sk-proj-abcdef0123456789abcdef0123";
    expect(isAnthropicAvailable()).toBe(false);
  });

  it("returns true for a well-formed sk-ant- key of sufficient length", () => {
    process.env[ENV_NAME] = "sk-ant-api03-" + "a".repeat(80);
    expect(isAnthropicAvailable()).toBe(true);
  });
});

describe("isGeminiAvailable", () => {
  const ENV_NAME = "GOOGLE_API_KEY";
  let originalValue: string | undefined;
  let originalHadKey: boolean;

  beforeEach(() => {
    originalHadKey = Object.prototype.hasOwnProperty.call(
      process.env,
      ENV_NAME,
    );
    originalValue = process.env[ENV_NAME];
  });

  afterEach(() => {
    if (originalHadKey) {
      process.env[ENV_NAME] = originalValue ?? "";
    } else {
      delete process.env[ENV_NAME];
    }
  });

  it("returns false when GOOGLE_API_KEY is unset", () => {
    delete process.env[ENV_NAME];
    expect(isGeminiAvailable()).toBe(false);
  });

  it("returns false when GOOGLE_API_KEY is empty string", () => {
    process.env[ENV_NAME] = "";
    expect(isGeminiAvailable()).toBe(false);
  });

  it("returns false when key is too short", () => {
    process.env[ENV_NAME] = "AIza";
    expect(isGeminiAvailable()).toBe(false);
  });

  it("returns false when key lacks AIza prefix (wrong provider paste)", () => {
    process.env[ENV_NAME] = "sk-ant-api03-abcdef0123456789";
    expect(isGeminiAvailable()).toBe(false);
  });

  it("returns true for a well-formed AIza key of sufficient length", () => {
    process.env[ENV_NAME] = "AIza" + "B".repeat(35);
    expect(isGeminiAvailable()).toBe(true);
  });
});
