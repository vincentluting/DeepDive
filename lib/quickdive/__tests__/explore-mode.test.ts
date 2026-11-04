import { describe, expect, it } from "vitest";

import {
  getQuickDiveModeAliases,
  isImmersiveExploreMode,
  normalizeQuickDiveExploreMode,
} from "../explore-mode";

describe("quickdive explore-mode helpers", () => {
  it("treats historical narrative as immersive", () => {
    expect(isImmersiveExploreMode("immersive")).toBe(true);
    expect(isImmersiveExploreMode("narrative")).toBe(true);
    expect(isImmersiveExploreMode("classic")).toBe(false);
  });

  it("normalizes legacy narrative to immersive", () => {
    expect(normalizeQuickDiveExploreMode("immersive")).toBe("immersive");
    expect(normalizeQuickDiveExploreMode("narrative")).toBe("immersive");
    expect(normalizeQuickDiveExploreMode("classic")).toBe("classic");
    expect(normalizeQuickDiveExploreMode(undefined)).toBe("classic");
  });

  it("returns immersive aliases including legacy narrative", () => {
    expect(getQuickDiveModeAliases("immersive")).toEqual([
      "immersive",
      "narrative",
    ]);
    expect(getQuickDiveModeAliases("narrative")).toEqual(["narrative"]);
    expect(getQuickDiveModeAliases("all")).toEqual([
      "classic",
      "immersive",
      "narrative",
    ]);
  });
});
