// ============================================================
// Tests for the exploration depth calculator — the pure logic behind
// the "depth gauge" UX (how deep a user has dived, 0–3000m, and which
// named zone they're in). A regression here mislabels every user's
// progress meter, so the math + zone boundaries are worth pinning down.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  DEPTH_WEIGHTS,
  MAX_DEPTH,
  DEPTH_ZONES,
  calculateDepth,
  getDepthZone,
  getCompletedModulesList,
  type UserExplorationProgress,
} from "../depth-calculator";

const T = new Date("2026-06-27T00:00:00Z");

describe("DEPTH_WEIGHTS / MAX_DEPTH invariant", () => {
  it("module weights sum exactly to MAX_DEPTH", () => {
    // If this drifts, completionPercent can never reach 100% (or exceeds it),
    // silently breaking the progress meter for fully-completed users.
    const sum = Object.values(DEPTH_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(MAX_DEPTH);
  });
});

describe("getDepthZone", () => {
  it("returns the deepest zone whose minDepth is ≤ depth", () => {
    expect(getDepthZone(0).id).toBe("surface");
    expect(getDepthZone(399).id).toBe("surface");
    expect(getDepthZone(400).id).toBe("shallows");
    expect(getDepthZone(1249).id).toBe("shallows");
    expect(getDepthZone(1250).id).toBe("openwater");
    expect(getDepthZone(1999).id).toBe("openwater");
    expect(getDepthZone(2000).id).toBe("depths");
    expect(getDepthZone(2499).id).toBe("depths");
    expect(getDepthZone(2500).id).toBe("abyss");
    expect(getDepthZone(3000).id).toBe("abyss");
  });

  it("clamps below-zero depth to the first (surface) zone", () => {
    expect(getDepthZone(-100).id).toBe("surface");
  });

  it("every zone boundary maps back to that zone", () => {
    for (const zone of DEPTH_ZONES) {
      expect(getDepthZone(zone.minDepth).id).toBe(zone.id);
    }
  });
});

describe("calculateDepth", () => {
  it("is zero / surface / 0% with no completed modules", () => {
    const r = calculateDepth({});
    expect(r).toEqual({
      depthM: 0,
      zone: expect.objectContaining({ id: "surface" }),
      completionPercent: 0,
    });
  });

  it("reaches full depth / abyss / 100% with every module complete", () => {
    const all: Record<string, Date> = {};
    for (const key of Object.keys(DEPTH_WEIGHTS)) all[key] = T;
    const r = calculateDepth(all);
    expect(r.depthM).toBe(MAX_DEPTH);
    expect(r.zone.id).toBe("abyss");
    expect(r.completionPercent).toBe(100);
  });

  it("sums only completed modules and floors the percentage", () => {
    // quickDive (400) + deepDive (850) = 1250m → openwater, floor(1250/3000*100)=41
    const r = calculateDepth({ quickDive: T, deepDive: T });
    expect(r.depthM).toBe(1250);
    expect(r.zone.id).toBe("openwater");
    expect(r.completionPercent).toBe(41);
  });

  it("treats null timestamps as not-completed", () => {
    const r = calculateDepth({ quickDive: T, deepDive: null });
    expect(r.depthM).toBe(DEPTH_WEIGHTS.quickDive);
  });

  it("ignores keys that aren't real depth modules", () => {
    const r = calculateDepth({
      quickDive: T,
      somethingElse: T,
    } as Record<string, Date | null>);
    expect(r.depthM).toBe(DEPTH_WEIGHTS.quickDive);
  });
});

describe("getCompletedModulesList", () => {
  it("returns only keys with a non-null timestamp", () => {
    const progress: UserExplorationProgress = {
      userId: "u1",
      modules: { quickDive: T, deepDive: null, profile: T },
      depthM: 650,
      updatedAt: T,
    };
    const list = getCompletedModulesList(progress);
    expect(list.sort()).toEqual(["profile", "quickDive"]);
  });

  it("returns an empty list when nothing is complete", () => {
    expect(
      getCompletedModulesList({
        userId: "u1",
        modules: { quickDive: null },
        depthM: 0,
        updatedAt: T,
      }),
    ).toEqual([]);
  });
});
