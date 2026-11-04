// ============================================================
// Tests for the Adaptability / change-readiness factor (v3)
//
// User signal = Schwartz stimulation - security (mapped to 0-100).
// Career signal = continuous aiExposureScore (preferred) OR discrete
// aiEraCategory. Score = 100 - |userAdaptability - idealCenter|,
// floored at 15. Pure math, no external deps.
// ============================================================

import { describe, it, expect } from "vitest";

import type { SchwartzInput } from "../../types";
import { scoreAdaptability } from "../adaptability";

const sch = (centered: Record<string, number>): SchwartzInput => ({
  top3: [],
  centered,
});

describe("scoreAdaptability — data availability", () => {
  it("returns the 50 / not-available sentinel when schwartz is undefined", () => {
    expect(scoreAdaptability(undefined, "stable", 0.5)).toEqual({
      score: 50,
      available: false,
    });
  });

  it("returns the 60 / fallback sentinel when the career has no AI signal", () => {
    expect(scoreAdaptability(sch({ stimulation: 1 }), undefined, null)).toEqual(
      {
        score: 60,
        available: true,
        fallback: true,
      },
    );
  });
});

describe("scoreAdaptability — continuous aiExposureScore path", () => {
  it("scores near-perfect when user change-readiness matches exposure demand", () => {
    // stim 2, sec 0 -> userAdapt (2-0)*20+50 = 90 ; exposure 1.0 -> ideal 85
    // distance 5 -> score 95
    expect(
      scoreAdaptability(sch({ stimulation: 2, security: 0 }), undefined, 1.0)
        .score,
    ).toBe(95);
  });

  it("maps exposure 0 to a low ideal center (25)", () => {
    // neutral user (50) vs ideal 25 -> distance 25 -> 75
    expect(
      scoreAdaptability(sch({ stimulation: 0, security: 0 }), undefined, 0)
        .score,
    ).toBe(75);
  });

  it("takes exposure precedence over the discrete category", () => {
    // exposure 1.0 -> ideal 85 (NOT stable's 30); user 50 -> distance 35 -> 65
    expect(
      scoreAdaptability(sch({ stimulation: 0, security: 0 }), "stable", 1.0)
        .score,
    ).toBe(65);
  });

  it("floors the score at 15 for a maximal mismatch", () => {
    // stim 0, sec 3 -> (0-3)*20+50 = -10 -> clamp 0 ; exposure 1 -> ideal 85
    // distance 85 -> 100-85 = 15
    expect(
      scoreAdaptability(sch({ stimulation: 0, security: 3 }), undefined, 1.0)
        .score,
    ).toBe(15);
  });
});

describe("scoreAdaptability — discrete aiEraCategory fallback", () => {
  it("uses the per-category ideal centers", () => {
    const neutral = sch({ stimulation: 0, security: 0 }); // userAdapt 50
    expect(scoreAdaptability(neutral, "stable").score).toBe(80); // ideal 30, dist 20
    expect(scoreAdaptability(neutral, "augmented").score).toBe(95); // ideal 45, dist 5
    expect(scoreAdaptability(neutral, "transformed").score).toBe(85); // ideal 65, dist 15
    expect(scoreAdaptability(neutral, "ai-native").score).toBe(70); // ideal 80, dist 30
  });

  it("is always available (not a fallback) once an AI signal is present", () => {
    const r = scoreAdaptability(sch({ stimulation: 1 }), "augmented");
    expect(r.available).toBe(true);
    expect(r.fallback).toBeUndefined();
  });
});
