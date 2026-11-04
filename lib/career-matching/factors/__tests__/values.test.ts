// ============================================================
// Tests for the Schwartz values-alignment factor (v2)
//
// Maps career value labels -> Schwartz types, scores each against the
// user's centered profile (centered*20+50, clamped), adds a circumplex
// adjacency bonus for low-direct near-misses, averages, floors at 15.
// getGroupValues (frozen lib/content) is mocked to stay hermetic.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { SchwartzInput } from "../../types";

vi.mock("@/lib/content/soc-group-annotations", () => ({
  getGroupValues: vi.fn(() => null),
}));

import { getGroupValues } from "@/lib/content/soc-group-annotations";
import { scoreValues } from "../values";

const mockedGroup = vi.mocked(getGroupValues);

const sch = (centered: Record<string, number>): SchwartzInput => ({
  top3: [],
  centered,
});

beforeEach(() => {
  mockedGroup.mockReset();
  mockedGroup.mockReturnValue(null);
});

describe("scoreValues — missing user data", () => {
  it("returns the 50 / not-available sentinel when schwartz is undefined", () => {
    expect(scoreValues(undefined, ["achievement"], "c1")).toEqual({
      score: 50,
      available: false,
    });
  });
});

describe("scoreValues — direct centered scoring", () => {
  it("maps centered +2 to a high fit (90)", () => {
    const r = scoreValues(sch({ achievement: 2 }), ["achievement"], "c1");
    expect(r).toEqual({ score: 90, available: true, fallback: false });
  });

  it("maps centered 0 to the neutral midpoint (50)", () => {
    expect(
      scoreValues(sch({ achievement: 0 }), ["achievement"], "c1").score,
    ).toBe(50);
  });

  it("clamps a very high centered score at 100", () => {
    expect(
      scoreValues(sch({ achievement: 5 }), ["achievement"], "c1").score,
    ).toBe(100);
  });

  it("floors the final score at 15 for a strongly-misaligned value", () => {
    // achievement -2 -> direct 10; neighbors power/hedonism absent -> no bonus
    // -> total 10 -> floored to 15
    expect(
      scoreValues(sch({ achievement: -2 }), ["achievement"], "c1").score,
    ).toBe(15);
  });

  it("averages per-value scores", () => {
    // achievement +2 -> 90 ; security 0 -> 50 ; avg 70
    const r = scoreValues(
      sch({ achievement: 2, security: 0 }),
      ["achievement", "security"],
      "c1",
    );
    expect(r.score).toBe(70);
  });
});

describe("scoreValues — career label -> Schwartz mapping", () => {
  it("maps 'growth' to self-direction", () => {
    const r = scoreValues(sch({ "self-direction": 2 }), ["growth"], "c1");
    expect(r.score).toBe(90);
  });

  it("maps 'meaning' to universalism", () => {
    expect(scoreValues(sch({ universalism: 2 }), ["meaning"], "c1").score).toBe(
      90,
    );
  });
});

describe("scoreValues — circumplex adjacency bonus", () => {
  it("gives partial credit from a positive adjacent value when direct is low", () => {
    // power -2 -> direct 10 (<50) -> neighbor achievement +2 -> bonus 12
    // total min(100, 10+12) = 22
    const r = scoreValues(sch({ power: -2, achievement: 2 }), ["power"], "c1");
    expect(r.score).toBe(22);
  });

  it("does not apply an adjacency bonus when direct score is already >= 50", () => {
    // power +1 -> direct 70 (>=50) -> no neighbor check even if achievement high
    const r = scoreValues(sch({ power: 1, achievement: 2 }), ["power"], "c1");
    expect(r.score).toBe(70);
  });
});

describe("scoreValues — SOC-group fallback", () => {
  it("returns the 50 / fallback sentinel when no own and no group values", () => {
    mockedGroup.mockReturnValue(null);
    expect(scoreValues(sch({ achievement: 2 }), [], "c-unknown")).toEqual({
      score: 50,
      available: true,
      fallback: true,
    });
  });

  it("uses group values when the career has no own annotation", () => {
    mockedGroup.mockReturnValue(["achievement"]);
    const r = scoreValues(sch({ achievement: 2 }), [], "c-grouped");
    expect(mockedGroup).toHaveBeenCalledWith("c-grouped");
    expect(r.score).toBe(90);
    expect(r.fallback).toBe(true);
  });
});
