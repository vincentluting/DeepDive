// ============================================================
// Tests for the Goleman leadership-style algorithm — a pure, norm-referenced
// derivation that surfaces in the user's profile. Asserts structural
// invariants (valid range, primary = argmax, secondary within-8 rule) rather
// than hard-coding the norm table, so the test stays robust to norm tuning
// while still catching shape/ordering regressions.
// ============================================================

import { describe, it, expect } from "vitest";
import { computeLeadershipStyle } from "../leadership-style";

const FULL = {
  openness: 60,
  conscientiousness: 55,
  extraversion: 65,
  agreeableness: 50,
  neuroticism: 40,
};

const STYLES = [
  "visionary",
  "coaching",
  "affiliative",
  "democratic",
  "pacesetting",
  "commanding",
] as const;

describe("computeLeadershipStyle", () => {
  it("returns undefined when any Big Five domain is missing", () => {
    for (const domain of Object.keys(FULL)) {
      const partial = { ...FULL } as Record<string, number>;
      delete partial[domain];
      expect(computeLeadershipStyle(partial)).toBeUndefined();
    }
  });

  it("produces all six styles, each clamped to 0-100", () => {
    const result = computeLeadershipStyle(FULL)!;
    expect(result).toBeDefined();
    for (const style of STYLES) {
      const v = result.scores[style];
      expect(typeof v).toBe("number");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("primary is the highest-scoring style", () => {
    const result = computeLeadershipStyle(FULL)!;
    const maxScore = Math.max(...STYLES.map((s) => result.scores[s]));
    expect(result.scores[result.primary]).toBe(maxScore);
  });

  it("secondary, when present, scores within 8 of primary and differs from it", () => {
    const result = computeLeadershipStyle(FULL)!;
    if (result.secondary) {
      expect(result.secondary).not.toBe(result.primary);
      const gap =
        result.scores[result.primary] - result.scores[result.secondary];
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(8);
    }
  });

  it("is deterministic for identical input", () => {
    expect(computeLeadershipStyle(FULL)).toEqual(computeLeadershipStyle(FULL));
  });

  it("handles boundary domain values (0 and 100) without throwing or going out of range", () => {
    const lo = computeLeadershipStyle({
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    })!;
    const hi = computeLeadershipStyle({
      openness: 100,
      conscientiousness: 100,
      extraversion: 100,
      agreeableness: 100,
      neuroticism: 100,
    })!;
    for (const r of [lo, hi]) {
      for (const s of STYLES) {
        expect(r.scores[s]).toBeGreaterThanOrEqual(0);
        expect(r.scores[s]).toBeLessThanOrEqual(100);
      }
    }
  });
});
