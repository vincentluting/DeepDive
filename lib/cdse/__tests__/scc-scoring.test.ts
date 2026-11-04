import { describe, it, expect } from "vitest";
import { computeSCCTotalScore, SCC_QUESTIONS } from "../scc-questions";
import type { SCCResponses } from "../scc-questions";

// ============================================================
// SCC (Self-Concept Clarity Scale) — Campbell et al. (1996)
//
// 12-item scale, 5-point Likert (1 = Strongly Disagree, 5 = Strongly Agree)
// Reverse-scored items: 1,2,3,4,5,7,8,9,10,12  (10 items)
// Forward-scored items: 6,11                    (2 items)
// Formula: reverse = 6 - raw; total = sum of all processed scores
// Range: 12–60. Higher = greater self-concept clarity.
// ============================================================

describe("SCC_QUESTIONS — item definitions", () => {
  it("should have exactly 12 items", () => {
    expect(SCC_QUESTIONS).toHaveLength(12);
  });

  it("items 1,2,3,4,5,7,8,9,10,12 should be reverse-scored", () => {
    const reversedIds = [
      "scc1",
      "scc2",
      "scc3",
      "scc4",
      "scc5",
      "scc7",
      "scc8",
      "scc9",
      "scc10",
      "scc12",
    ];
    for (const id of reversedIds) {
      const q = SCC_QUESTIONS.find((q) => q.id === id);
      expect(q, `${id} not found`).toBeDefined();
      expect(q!.isReversed, `${id} should be reverse-scored`).toBe(true);
    }
  });

  it("items 6 and 11 should be forward-scored", () => {
    const forwardIds = ["scc6", "scc11"];
    for (const id of forwardIds) {
      const q = SCC_QUESTIONS.find((q) => q.id === id);
      expect(q, `${id} not found`).toBeDefined();
      expect(q!.isReversed, `${id} should NOT be reverse-scored`).toBe(false);
    }
  });

  it('scc11 should be the "In general, I have a clear sense" item (positive clarity)', () => {
    const q = SCC_QUESTIONS.find((q) => q.id === "scc11");
    expect(q?.text_en).toContain("clear sense of who I am");
    expect(q?.isReversed).toBe(false);
  });

  it('scc12 should be the "hard to make up my mind" item (Campbell #12)', () => {
    const q = SCC_QUESTIONS.find((q) => q.id === "scc12");
    expect(q?.text_en).toContain("hard for me to make up my mind");
    expect(q?.isReversed).toBe(true);
  });

  it("IDs should be scc1 through scc12 in order", () => {
    const ids = SCC_QUESTIONS.map((q) => q.id);
    expect(ids).toEqual([
      "scc1",
      "scc2",
      "scc3",
      "scc4",
      "scc5",
      "scc6",
      "scc7",
      "scc8",
      "scc9",
      "scc10",
      "scc11",
      "scc12",
    ]);
  });
});

describe("computeSCCTotalScore — scoring logic", () => {
  it("all items = 3 (midpoint): total should be 36", () => {
    // Reverse-scored items: 6 - 3 = 3
    // Forward-scored items: 3
    // Total: 12 × 3 = 36
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 3;
    }
    expect(computeSCCTotalScore(responses)).toBe(36);
  });

  it("items 6 and 11 = 5, all others = 1: total should be 60 (maximum clarity)", () => {
    // Forward items (6, 11): 5 each → contribution = 5+5 = 10
    // Reverse items (1,2,3,4,5,7,8,9,10,12): raw=1, reversed = 6-1 = 5 each → 10 × 5 = 50
    // Total: 50 + 10 = 60
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 1;
    }
    responses["scc6"] = 5;
    responses["scc11"] = 5;
    expect(computeSCCTotalScore(responses)).toBe(60);
  });

  it("all items = 1: total should be near minimum", () => {
    // Reverse items: 6-1=5 (10 items) → 50
    // Forward items (6, 11): 1 each → 2
    // Total: 50 + 2 = 52
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 1;
    }
    expect(computeSCCTotalScore(responses)).toBe(52);
  });

  it("all items = 5: total should be near minimum (high agreement with confusion items)", () => {
    // Reverse items: 6-5=1 (10 items) → 10
    // Forward items (6, 11): 5 each → 10
    // Total: 10 + 10 = 20
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 5;
    }
    expect(computeSCCTotalScore(responses)).toBe(20);
  });

  it("should return 12 (minimum possible score) when forward=1 and all reversed=5", () => {
    // Forward items (scc6, scc11): raw=1 → 1 each → 2
    // Reverse items: raw=5 → 6-5=1 each (10 items) → 10
    // Total: 2 + 10 = 12
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 5; // max reverse = min score
    }
    responses["scc6"] = 1; // forward, minimum
    responses["scc11"] = 1; // forward, minimum
    expect(computeSCCTotalScore(responses)).toBe(12);
  });

  it("should return 60 (maximum possible score) when all agree with clarity", () => {
    // Maximum: forward items = 5, reverse items = 1 (reversed → 5)
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = q.isReversed ? 1 : 5;
    }
    expect(computeSCCTotalScore(responses)).toBe(60);
  });

  it("applies reverse formula correctly: reversed item raw=2 → score 4", () => {
    // Set one specific reversed item (scc1) to 2, everything else to maximize
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = q.isReversed ? 1 : 5; // baseline max
    }
    responses["scc1"] = 2; // reversed: 6-2=4 instead of 6-1=5
    const baseline = computeSCCTotalScore({ ...responses, scc1: 1 });
    const result = computeSCCTotalScore(responses);
    expect(baseline - result).toBe(1); // scc1=2 gives 4 vs scc1=1 gives 5 → 1 less
  });

  it("returns 0 for empty responses", () => {
    expect(computeSCCTotalScore({})).toBe(0);
  });

  it("skips out-of-range values", () => {
    const responses: SCCResponses = {};
    for (const q of SCC_QUESTIONS) {
      responses[q.id] = 3;
    }
    responses["scc1"] = 0; // out of range
    responses["scc2"] = 6; // out of range
    // scc1 and scc2 skipped; remaining 10 items × 3
    // Remaining reversed items (3,4,5,7,8,9,10,12): 6-3=3 (8 items)
    // Remaining forward items (6,11): 3 (2 items)
    // Total: 10 × 3 = 30
    expect(computeSCCTotalScore(responses)).toBe(30);
  });
});
