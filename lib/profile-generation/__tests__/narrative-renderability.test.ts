import { describe, expect, it } from "vitest";
import {
  hasCompleteNarratives,
  hasRenderableNarratives,
} from "../narrative-renderability";

const completeNarratives = {
  identitySummary: "Identity summary",
  archetypeNarrative: "Archetype narrative",
  bigFiveNarrative: "Big Five narrative",
  valueNarrative: "Value narrative",
  sjtTensionNarrative: "SJT tension narrative",
  crossDimensionNarrative: "Cross dimension narrative",
  growthMapInsight: "Growth map insight",
  meaningCompassNarrative: "Meaning compass narrative",
};

describe("narrative completeness", () => {
  it("requires every current identity narrative field", () => {
    expect(hasCompleteNarratives(completeNarratives)).toBe(true);
  });

  it("treats meaningCompassNarrative as optional (lazy-generated)", () => {
    // meaningCompassNarrative is generated lazily when the user actually
    // scrolls Ch3 into view; its absence must not block the profile page.
    expect(
      hasCompleteNarratives({
        ...completeNarratives,
        meaningCompassNarrative: "",
      }),
    ).toBe(true);
    expect(
      hasCompleteNarratives({
        ...completeNarratives,
        meaningCompassNarrative: undefined,
      }),
    ).toBe(true);
  });

  it("rejects partial narrative payloads", () => {
    expect(
      hasCompleteNarratives({
        ...completeNarratives,
        sjtTensionNarrative: "",
      }),
    ).toBe(false);
    expect(
      hasCompleteNarratives({
        identitySummary: "Only one old ready signal",
      }),
    ).toBe(false);
  });

  it("keeps the legacy export strict as well", () => {
    expect(hasRenderableNarratives(completeNarratives)).toBe(true);
    expect(
      hasRenderableNarratives({
        ...completeNarratives,
        growthMapInsight: "   ",
      }),
    ).toBe(false);
  });
});
