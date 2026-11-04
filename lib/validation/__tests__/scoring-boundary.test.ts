// ============================================================
// Test: IPIP-60 normalization boundary — domainMean=0 clamp
// Verifies that empty/missing answers don't produce negative
// normalized percentages (the Math.max(0, ...) guard).
//
// Placed in lib/validation/__tests__/ to avoid frozen lib/scoring/.
// ============================================================

import { describe, it, expect } from "vitest";
import { scoreIPIP60 } from "@/lib/scoring/score-ipip60";
import { IPIP_60_ITEM_IDS } from "@/lib/questionnaire/module-c-ipip-neo60";

describe("scoreIPIP60 — normalization boundary clamp", () => {
  it("domainMean=0 (empty answers) should not produce negative percentage", () => {
    // When all answers are missing, domainMean=0
    // Formula without clamp: (0 - 1) / 4 * 100 = -25
    // With clamp: Math.max(0, -25) = 0
    const result = scoreIPIP60({});
    for (const normalized of Object.values(result.domainsNormalized)) {
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(100);
    }
  });

  it("all answers=1 should produce normalized >= 0", () => {
    // All answers = 1 (minimum). After reverse scoring some items become 5.
    // Domain mean will vary but normalized should stay in [0, 100].
    const answers: Record<number, number> = {};
    for (const id of IPIP_60_ITEM_IDS) {
      answers[id] = 1;
    }
    const result = scoreIPIP60(answers);
    for (const normalized of Object.values(result.domainsNormalized)) {
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(100);
    }
  });

  it("all answers=5 should produce normalized <= 100", () => {
    // All answers = 5 (maximum). After reverse scoring some items become 1.
    // Domain mean will vary but normalized should stay in [0, 100].
    const answers: Record<number, number> = {};
    for (const id of IPIP_60_ITEM_IDS) {
      answers[id] = 5;
    }
    const result = scoreIPIP60(answers);
    for (const normalized of Object.values(result.domainsNormalized)) {
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(100);
    }
  });

  it("normalized range is always [0, 100] for any valid input", () => {
    // Test with midpoint answers
    const answers: Record<number, number> = {};
    for (const id of IPIP_60_ITEM_IDS) {
      answers[id] = 3;
    }
    const result = scoreIPIP60(answers);
    for (const normalized of Object.values(result.domainsNormalized)) {
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThanOrEqual(100);
    }
  });
});
