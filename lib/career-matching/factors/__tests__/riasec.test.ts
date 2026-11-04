// ============================================================
// Tests for the RIASEC interest-fit factor
//
// The foundational career-matching factor: cosine similarity between a
// user's RIASEC vector and a career's ideal vector, always available.
// A regression here mis-scores EVERY career match (Quick + Deep Dive),
// so the math contract is locked down here.
// ============================================================

import { describe, it, expect } from "vitest";

import { cosineSimilarity, toRiasecVector, scoreRiasec } from "../riasec";
import type { RiasecVector } from "../../types";

const vec = (R = 0, I = 0, A = 0, S = 0, E = 0, C = 0): RiasecVector => ({
  R,
  I,
  A,
  S,
  E,
  C,
});

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    const v = vec(3, 1, 4, 1, 5, 9);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 10);
  });

  it("is 1 for parallel (scaled) vectors — direction, not magnitude", () => {
    const a = vec(1, 2, 3, 0, 0, 0);
    const b = vec(2, 4, 6, 0, 0, 0);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
  });

  it("is 0 for orthogonal vectors", () => {
    const a = vec(1, 0, 0, 0, 0, 0); // R only
    const b = vec(0, 1, 0, 0, 0, 0); // I only
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("returns 0 when either vector is all-zero (denominator guard)", () => {
    expect(cosineSimilarity(vec(), vec(1, 1, 1, 1, 1, 1))).toBe(0);
    expect(cosineSimilarity(vec(1, 2, 3), vec())).toBe(0);
    expect(cosineSimilarity(vec(), vec())).toBe(0);
  });

  it("computes a known intermediate similarity", () => {
    // a=(1,1,0,0,0,0), b=(1,0,0,0,0,0) -> dot=1, |a|=√2, |b|=1 -> 1/√2
    const s = cosineSimilarity(vec(1, 1, 0, 0, 0, 0), vec(1, 0, 0, 0, 0, 0));
    expect(s).toBeCloseTo(1 / Math.SQRT2, 10);
  });

  it("is symmetric", () => {
    const a = vec(2, 5, 1, 3, 0, 4);
    const b = vec(1, 0, 4, 2, 6, 1);
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });
});

describe("toRiasecVector", () => {
  it("builds a vector from an entries array", () => {
    expect(
      toRiasecVector([
        ["R", 10],
        ["I", 20],
        ["C", 30],
      ]),
    ).toEqual(vec(10, 20, 0, 0, 0, 30));
  });

  it("builds a vector from a record", () => {
    expect(toRiasecVector({ R: 1, I: 2, A: 3, S: 4, E: 5, C: 6 })).toEqual(
      vec(1, 2, 3, 4, 5, 6),
    );
  });

  it("defaults missing keys to 0 (record form)", () => {
    expect(toRiasecVector({ R: 7 })).toEqual(vec(7, 0, 0, 0, 0, 0));
  });

  it("ignores unknown keys (array form)", () => {
    expect(
      toRiasecVector([
        ["R", 5],
        ["X", 99],
        ["Z", 42],
      ]),
    ).toEqual(vec(5, 0, 0, 0, 0, 0));
  });

  it("returns an all-zero vector for empty input", () => {
    expect(toRiasecVector([])).toEqual(vec());
    expect(toRiasecVector({})).toEqual(vec());
  });
});

describe("scoreRiasec", () => {
  it("returns 100 and available for a perfect match", () => {
    const v = vec(3, 1, 4, 1, 5, 9);
    expect(scoreRiasec(v, v)).toEqual({ score: 100, available: true });
  });

  it("returns 0 for orthogonal interest profiles", () => {
    expect(scoreRiasec(vec(1, 0, 0, 0, 0, 0), vec(0, 1, 0, 0, 0, 0))).toEqual({
      score: 0,
      available: true,
    });
  });

  it("rounds cosine*100 to an integer", () => {
    // 1/√2 * 100 = 70.71 -> 71
    const r = scoreRiasec(vec(1, 1, 0, 0, 0, 0), vec(1, 0, 0, 0, 0, 0));
    expect(r.score).toBe(71);
    expect(Number.isInteger(r.score)).toBe(true);
  });

  it("is always marked available (foundational factor)", () => {
    expect(scoreRiasec(vec(), vec()).available).toBe(true);
  });
});
