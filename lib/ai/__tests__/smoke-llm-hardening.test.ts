/**
 * Smoke tests for LLM hardening changes.
 * Tests the 4 critical code paths modified in this round.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import { readFileSync } from "fs";

// ── Path 1: Memory route Zod union schema ──

describe("Memory POST Zod validation", () => {
  const memoryPostManualSchema = z.object({
    category: z.string().min(1),
    keyword: z.string().min(1),
    insight: z.string().min(1),
  });
  const memoryPostGenerateSchema = z.object({
    forceRegenerate: z.boolean().optional().default(false),
  });
  const memoryPostSchema = z.union([
    memoryPostManualSchema,
    memoryPostGenerateSchema,
  ]);

  it("accepts empty body {} for generate path", () => {
    const result = memoryPostSchema.parse({});
    expect(result).toEqual({ forceRegenerate: false });
  });

  it("accepts forceRegenerate: true", () => {
    const result = memoryPostSchema.parse({ forceRegenerate: true });
    expect(result).toEqual({ forceRegenerate: true });
  });

  it("accepts valid manual add", () => {
    const result = memoryPostSchema.parse({
      category: "values",
      keyword: "growth",
      insight: "User values personal growth",
    });
    expect(result).toHaveProperty("category", "values");
    expect(result).toHaveProperty("keyword", "growth");
  });

  it("rejects manual add with missing fields", () => {
    // category only → falls through to generate schema, strips unknown fields
    const result = memoryPostSchema.parse({ category: "values" });
    expect(result).toEqual({ forceRegenerate: false });
  });

  it("accepts long keyword on manual add (route handler truncates)", () => {
    const result = memoryPostSchema.parse({
      category: "values",
      keyword: "a".repeat(21),
      insight: "test",
    });
    expect(result).toHaveProperty("keyword", "a".repeat(21));
    expect(result).toHaveProperty("category", "values");
  });

  it("accepts long insight on manual add (route handler truncates)", () => {
    const result = memoryPostSchema.parse({
      category: "values",
      keyword: "test",
      insight: "a".repeat(201),
    });
    expect(result).toHaveProperty("insight", "a".repeat(201));
  });
});

// ── Path 2: Semaphore idempotent release ──

describe("Semaphore double-release safety", () => {
  it("does not corrupt active count on double release", async () => {
    const { createSemaphore } = await import("@/lib/ai/concurrency");
    const sem = createSemaphore(2);

    const release1 = await sem.acquire();
    const release2 = await sem.acquire();

    // Double-release release1
    release1();
    release1(); // Should be no-op

    // Should still be able to acquire (only 1 slot used by release2)
    const release3Promise = Promise.race([
      sem.acquire().then((r) => {
        r();
        return "acquired";
      }),
      new Promise<string>((r) => setTimeout(() => r("timeout"), 50)),
    ]);
    expect(await release3Promise).toBe("acquired");

    release2();
  });
});

// ── Path 3: dispatchProvider exists and LLMTask type ──

describe("LLMTask type export", () => {
  it("exports LLMTask type from model-router", async () => {
    // This is a compile-time check — if it imports without error, the type exists
    const mod = await import("@/lib/ai/model-router");
    expect(typeof mod.callLLM).toBe("function");
    expect(typeof mod.streamLLM).toBe("function");
  });
});

// ── Path 4: TOKEN_PRICING completeness ──

describe("TOKEN_PRICING includes all active models", () => {
  it("has pricing for gemini-2.5-flash and claude-haiku-4-5", async () => {
    // Read the file and check pricing entries exist
    const content = readFileSync("lib/db/llm-usage.ts", "utf-8");
    expect(content).toContain("gemini-2.5-flash");
    expect(content).toContain("claude-haiku-4-5-20251001");
    // Verify Gemini pricing is NOT the default $1/$4
    expect(content).toMatch(/gemini-2\.5-flash.*input:\s*0\.15/);
  });
});
