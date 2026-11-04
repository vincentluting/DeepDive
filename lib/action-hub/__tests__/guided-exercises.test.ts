// ============================================================
// Tests for the guided-exercise pure logic (Action Hub): the validators that
// gate user input for Non-Negotiables / Flow Moments / Energy Log, and the
// analyzers that derive the patterns shown back to the user + fed to coaching.
// Edge cases (empty/single-entry energy log, sub-2/3 pattern threshold) are the
// real risk here — they decide whether a user sees a signal or silence.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  NON_NEGOTIABLE_OPTIONS,
  validateNonNegotiables,
  validateFlowMoments,
  analyzeFlowPatterns,
  validateEnergyEntry,
  analyzeEnergyPatterns,
  type FlowMomentEntry,
  type EnergyLogEntry,
} from "../guided-exercises";

const validIds = NON_NEGOTIABLE_OPTIONS.slice(0, 3).map((o) => o.id);

const flow = (over: Partial<FlowMomentEntry> = {}): FlowMomentEntry => ({
  description: "building a thing",
  activity: "creating",
  social: "alone",
  environment: "quiet",
  ...over,
});

const energy = (over: Partial<EnergyLogEntry> = {}): EnergyLogEntry => ({
  day: 1,
  energizer: "deep work",
  drain: "status meeting",
  overallEnergy: 3,
  date: "2026-06-28",
  ...over,
});

describe("validateNonNegotiables", () => {
  it("accepts exactly 3 distinct valid ids", () => {
    expect(validateNonNegotiables(validIds)).toBeNull();
  });
  it("rejects wrong count, invalid option, and duplicates", () => {
    expect(validateNonNegotiables(validIds.slice(0, 2))).toBe(
      "mustSelectExactly3",
    );
    expect(validateNonNegotiables([validIds[0], validIds[1], "nope"])).toBe(
      "invalidOption",
    );
    expect(
      validateNonNegotiables([validIds[0], validIds[0], validIds[1]]),
    ).toBe("noDuplicates");
  });
});

describe("validateFlowMoments", () => {
  it("accepts 3 well-formed moments", () => {
    expect(validateFlowMoments([flow(), flow(), flow()])).toBeNull();
  });
  it("rejects wrong count, blank description, and bad tags", () => {
    expect(validateFlowMoments([flow(), flow()])).toBe("mustRecall3");
    expect(
      validateFlowMoments([flow({ description: " a " }), flow(), flow()]),
    ).toBe("descriptionRequired");
    expect(
      validateFlowMoments([
        flow({ activity: "x" as FlowMomentEntry["activity"] }),
        flow(),
        flow(),
      ]),
    ).toBe("invalidActivity");
  });
});

describe("analyzeFlowPatterns", () => {
  it("surfaces a dominant tag only when it appears in 2+ of 3 moments", () => {
    const r = analyzeFlowPatterns([
      flow({ activity: "creating", social: "alone" }),
      flow({ activity: "creating", social: "with_people" }),
      flow({ activity: "analyzing", social: "mixed" }),
    ]);
    expect(r.dominantActivity).toBe("creating"); // 2/3
    expect(r.dominantSocial).toBeNull(); // all 3 different → noise, not a pattern
  });
});

describe("validateEnergyEntry", () => {
  it("accepts a well-formed entry", () => {
    expect(validateEnergyEntry(energy())).toBeNull();
  });
  it("rejects out-of-range day, short text, and bad rating", () => {
    expect(validateEnergyEntry(energy({ day: 8 }))).toBe("invalidDay");
    expect(validateEnergyEntry(energy({ energizer: "a" }))).toBe(
      "energizerRequired",
    );
    expect(validateEnergyEntry(energy({ drain: " " }))).toBe("drainRequired");
    expect(
      validateEnergyEntry(
        energy({ overallEnergy: 6 as EnergyLogEntry["overallEnergy"] }),
      ),
    ).toBe("invalidRating");
  });
});

describe("analyzeEnergyPatterns", () => {
  it("returns neutral defaults for an empty log", () => {
    expect(analyzeEnergyPatterns([])).toEqual({
      avgEnergy: 0,
      energizerKeywords: [],
      drainKeywords: [],
      trend: "stable",
    });
  });

  it("handles a single entry without NaN leaking into the trend", () => {
    const r = analyzeEnergyPatterns([energy({ overallEnergy: 4 })]);
    expect(r.avgEnergy).toBe(4);
    expect(r.trend).toBe("stable"); // second-half avg is 0/0 → must not surface as NaN
  });

  it("extracts only keywords seen 2+ times and rounds avg energy", () => {
    const r = analyzeEnergyPatterns([
      energy({ day: 1, energizer: "coding flow", overallEnergy: 2 }),
      energy({ day: 2, energizer: "coding sprint", overallEnergy: 3 }),
      energy({ day: 3, energizer: "one-off", overallEnergy: 4 }),
    ]);
    expect(r.energizerKeywords).toContain("coding"); // appears 2x
    expect(r.energizerKeywords).not.toContain("flow"); // 1x only
    expect(r.avgEnergy).toBe(3); // (2+3+4)/3 = 3.0
  });

  it("detects a rising and a falling trend", () => {
    const rising = analyzeEnergyPatterns([
      energy({ day: 1, overallEnergy: 1 }),
      energy({ day: 2, overallEnergy: 2 }),
      energy({ day: 3, overallEnergy: 5 }),
      energy({ day: 4, overallEnergy: 5 }),
    ]);
    expect(rising.trend).toBe("rising");
    const falling = analyzeEnergyPatterns([
      energy({ day: 1, overallEnergy: 5 }),
      energy({ day: 2, overallEnergy: 5 }),
      energy({ day: 3, overallEnergy: 1 }),
      energy({ day: 4, overallEnergy: 1 }),
    ]);
    expect(falling.trend).toBe("falling");
  });
});
