// ============================================================
// Tests for the Industry-preference fit factor
//
// Direct match -> 100, same-sector match -> 70, no overlap -> 30,
// no preference / empty career tags -> neutral sentinels. Uses the
// real INDUSTRY_MAP (technology/ai_ml share sector 'technology';
// finance is a different sector).
// ============================================================

import { describe, it, expect } from "vitest";

import type { IndustryInput } from "../../types";
import { scoreIndustry } from "../industry";

const input = (interestedIndustries: string[]): IndustryInput => ({
  interestedIndustries,
});

describe("scoreIndustry — no usable preference", () => {
  it("returns 50 / not-available when input is undefined", () => {
    expect(scoreIndustry(undefined, ["technology"])).toEqual({
      score: 50,
      available: false,
    });
  });

  it("returns 50 / not-available for empty interestedIndustries", () => {
    expect(scoreIndustry(input([]), ["technology"])).toEqual({
      score: 50,
      available: false,
    });
  });

  it("returns 50 / not-available for the 'recommend_for_me' opt-out", () => {
    expect(scoreIndustry(input(["recommend_for_me"]), ["technology"])).toEqual({
      score: 50,
      available: false,
    });
  });
});

describe("scoreIndustry — matching", () => {
  it("returns 50 / available when the career has no industry tags", () => {
    expect(scoreIndustry(input(["technology"]), [])).toEqual({
      score: 50,
      available: true,
    });
  });

  it("returns 100 on a direct industry match", () => {
    expect(
      scoreIndustry(input(["technology"]), ["technology", "finance"]),
    ).toEqual({ score: 100, available: true });
  });

  it("returns 70 on a same-sector match (technology: ai_ml)", () => {
    // user wants 'technology'; career tagged 'ai_ml' — different id, same
    // 'technology' sector -> partial credit
    expect(scoreIndustry(input(["technology"]), ["ai_ml"])).toEqual({
      score: 70,
      available: true,
    });
  });

  it("returns 30 when there is no sector overlap (technology vs finance)", () => {
    expect(scoreIndustry(input(["technology"]), ["finance"])).toEqual({
      score: 30,
      available: true,
    });
  });
});
