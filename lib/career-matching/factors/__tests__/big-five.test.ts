// ============================================================
// Tests for the Big Five personality-fit factor
//
// Range matching: each annotated dimension scores 100 inside the ideal
// range, else 100 - distance*2 (floored at 0), averaged. Falls back to
// SOC-group annotations when the career has no own ranges. A regression
// here corrupts Deep Dive personality fit. getGroupBigFive lives in the
// frozen lib/content, so it's mocked to keep this test hermetic.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { BigFiveVector } from "../../types";

vi.mock("@/lib/content/soc-group-annotations", () => ({
  getGroupBigFive: vi.fn(() => null),
}));

import { getGroupBigFive } from "@/lib/content/soc-group-annotations";
import { scoreBigFive } from "../big-five";

const mockedGroup = vi.mocked(getGroupBigFive);

const bf = (
  openness = 50,
  conscientiousness = 50,
  extraversion = 50,
  agreeableness = 50,
  neuroticism = 50,
): BigFiveVector => ({
  openness,
  conscientiousness,
  extraversion,
  agreeableness,
  neuroticism,
});

beforeEach(() => {
  mockedGroup.mockReset();
  mockedGroup.mockReturnValue(null);
});

describe("scoreBigFive — missing user data", () => {
  it("returns the neutral 50 / not-available sentinel when userBigFive is undefined", () => {
    expect(
      scoreBigFive(undefined, { openness: { min: 60, max: 80 } }, "c1"),
    ).toEqual({ score: 50, available: false });
  });
});

describe("scoreBigFive — own annotations (hasOwn)", () => {
  it("scores 100 when every dimension is inside its ideal range", () => {
    const r = scoreBigFive(
      bf(70, 50),
      {
        openness: { min: 60, max: 80 },
        conscientiousness: { min: 40, max: 60 },
      },
      "c1",
    );
    expect(r).toEqual({ score: 100, available: true, fallback: false });
    expect(mockedGroup).not.toHaveBeenCalled();
  });

  it("penalizes distance above the max by 2x", () => {
    // openness 90 vs max 80 -> distance 10 -> 100 - 20 = 80
    const r = scoreBigFive(bf(90), { openness: { min: 60, max: 80 } }, "c1");
    expect(r.score).toBe(80);
    expect(r.available).toBe(true);
  });

  it("penalizes distance below the min by 2x", () => {
    // openness 50 vs min 60 -> distance 10 -> 80
    expect(
      scoreBigFive(bf(50), { openness: { min: 60, max: 80 } }, "c1").score,
    ).toBe(80);
  });

  it("floors a far-outside dimension at 0 (never negative)", () => {
    // openness 0 vs min 60 -> distance 60 -> 100 - 120 -> clamp 0
    expect(
      scoreBigFive(bf(0), { openness: { min: 60, max: 80 } }, "c1").score,
    ).toBe(0);
  });

  it("averages across annotated dimensions", () => {
    // openness 70 (in -> 100), conscientiousness 70 vs max 60 -> dist 10 -> 80
    // avg (100 + 80) / 2 = 90
    const r = scoreBigFive(
      bf(70, 70),
      {
        openness: { min: 60, max: 80 },
        conscientiousness: { min: 40, max: 60 },
      },
      "c1",
    );
    expect(r.score).toBe(90);
  });
});

describe("scoreBigFive — SOC-group fallback", () => {
  it("returns the 60 / fallback sentinel when no own and no group annotation", () => {
    mockedGroup.mockReturnValue(null);
    const r = scoreBigFive(bf(), {}, "c-unknown");
    expect(r).toEqual({ score: 60, available: true, fallback: true });
  });

  it("uses group ranges when the career has no own annotation", () => {
    // group says openness in [60,80]; user 90 -> dist 10 -> 80; fallback flagged
    mockedGroup.mockReturnValue({ openness: { min: 60, max: 80 } });
    const r = scoreBigFive(bf(90), {}, "c-grouped");
    expect(mockedGroup).toHaveBeenCalledWith("c-grouped");
    expect(r.score).toBe(80);
    expect(r.fallback).toBe(true);
    expect(r.available).toBe(true);
  });
});
