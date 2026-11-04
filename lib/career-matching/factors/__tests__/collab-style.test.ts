// ============================================================
// Tests for the Collaboration-style fit factor
//
// Derives an ideal D/I/S/C weight vector from a career's RIASEC profile,
// then cosine-compares it to the user's normalized collab scores.
// Pure math, no external deps.
// ============================================================

import { describe, it, expect } from "vitest";

import type { CollabInput, RiasecVector } from "../../types";
import { scoreCollabStyle } from "../collab-style";

const riasec = (R = 0, I = 0, A = 0, S = 0, E = 0, C = 0): RiasecVector => ({
  R,
  I,
  A,
  S,
  E,
  C,
});

const collab = (D: number, I: number, S: number, C: number): CollabInput => ({
  scores: { D, I, S, C },
});

describe("scoreCollabStyle", () => {
  it("returns the 50 / not-available sentinel when collab is undefined", () => {
    expect(scoreCollabStyle(undefined, riasec(0, 0, 0, 0, 5, 0))).toEqual({
      score: 50,
      available: false,
    });
  });

  it("scores 100 when the user profile is parallel to the career ideal", () => {
    // Pure-E career -> ideal weights {D:0.5, I:0.3, S:0.1, C:0.1}
    // User scores proportional to that -> cosine 1 -> 100
    const r = scoreCollabStyle(
      collab(50, 30, 10, 10),
      riasec(0, 0, 0, 0, 8, 0),
    );
    expect(r).toEqual({ score: 100, available: true });
  });

  it("scores low when the user is near-orthogonal to the career ideal", () => {
    // Pure-C user vs pure-E career ideal {D:.5,I:.3,S:.1,C:.1}
    // cosine = 0.1 / 0.6 = 0.167 -> 17
    const r = scoreCollabStyle(collab(0, 0, 0, 100), riasec(0, 0, 0, 0, 8, 0));
    expect(r.score).toBe(17);
  });

  it("returns 0 when the career has an all-zero RIASEC vector (no direction)", () => {
    // totalRiasec 0 -> ideal weights all 0 -> denom 0 -> similarity 0
    expect(scoreCollabStyle(collab(40, 30, 20, 10), riasec()).score).toBe(0);
  });

  it("always produces an integer score in [0, 100]", () => {
    const r = scoreCollabStyle(
      collab(37, 61, 12, 88),
      riasec(3, 1, 4, 1, 5, 9),
    );
    expect(Number.isInteger(r.score)).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.available).toBe(true);
  });
});
