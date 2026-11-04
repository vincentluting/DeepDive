// ============================================================
// Tests for the Kramlinger social-style 2×2 (Extraversion × Agreeableness →
// analytical / driver / amiable / expressive), shown in the user's profile.
// Uses extreme domain values (which sit unambiguously above/below the
// population median) to pin each quadrant without depending on exact norms.
// ============================================================

import { describe, it, expect } from "vitest";
import { computeSocialStyle } from "../social-style";

describe("computeSocialStyle", () => {
  it("returns undefined when extraversion or agreeableness is missing", () => {
    expect(computeSocialStyle({ agreeableness: 50 })).toBeUndefined();
    expect(computeSocialStyle({ extraversion: 50 })).toBeUndefined();
    expect(computeSocialStyle({})).toBeUndefined();
  });

  it("maps the four quadrants from extreme domain inputs", () => {
    // low E (ask) + low A (task) → analytical
    expect(
      computeSocialStyle({ extraversion: 0, agreeableness: 0 })?.style,
    ).toBe("analytical");
    // high E (tell) + low A (task) → driver
    expect(
      computeSocialStyle({ extraversion: 100, agreeableness: 0 })?.style,
    ).toBe("driver");
    // low E (ask) + high A (people) → amiable
    expect(
      computeSocialStyle({ extraversion: 0, agreeableness: 100 })?.style,
    ).toBe("amiable");
    // high E (tell) + high A (people) → expressive
    expect(
      computeSocialStyle({ extraversion: 100, agreeableness: 100 })?.style,
    ).toBe("expressive");
  });

  it("returns rounded percentile scores and a matching bilingual comm tip", () => {
    const r = computeSocialStyle({ extraversion: 100, agreeableness: 100 })!;
    expect(Number.isInteger(r.extraversionScore)).toBe(true);
    expect(Number.isInteger(r.agreeablenessScore)).toBe(true);
    expect(r.extraversionScore).toBeGreaterThanOrEqual(0);
    expect(r.extraversionScore).toBeLessThanOrEqual(100);
    expect(r.commTip.en.length).toBeGreaterThan(0);
    expect(r.commTip.zh.length).toBeGreaterThan(0);
  });

  it("is deterministic for identical input", () => {
    const a = computeSocialStyle({ extraversion: 60, agreeableness: 40 });
    const b = computeSocialStyle({ extraversion: 60, agreeableness: 40 });
    expect(a).toEqual(b);
  });
});
