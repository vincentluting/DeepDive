import { describe, expect, it } from "vitest";
import {
  buildFacetPairs,
  getFacetLabel,
} from "@/lib/profile-generation/facet-display";

describe("buildFacetPairs", () => {
  it("assigns domains by facet-key prefix and centers on the domain mean", () => {
    const facets = {
      E1_Friendliness: 4,
      E2_Gregariousness: 2, // extraversion mean = 3
      O5_Intellect: 5,
      O1_Imagination: 3, // openness mean = 4
    };
    const pairs = buildFacetPairs(facets);
    const e1 = pairs.find((p) => p.facet === "E1_Friendliness")!;
    const e2 = pairs.find((p) => p.facet === "E2_Gregariousness")!;
    const o5 = pairs.find((p) => p.facet === "O5_Intellect")!;

    expect(e1.domain).toBe("extraversion");
    expect(o5.domain).toBe("openness");
    expect(e1.deviationFromMean).toBeCloseTo(1); // 4 - 3
    expect(e2.deviationFromMean).toBeCloseTo(-1); // 2 - 3
    expect(o5.deviationFromMean).toBeCloseTo(1); // 5 - 4
  });

  it("returns one pair per facet", () => {
    const facets = { N1_Anxiety: 3, A1_Trust: 4, C2_Orderliness: 5 };
    expect(buildFacetPairs(facets)).toHaveLength(3);
  });
});

describe("getFacetLabel", () => {
  it("returns the english label for a known facet", () => {
    expect(getFacetLabel("E3_Assertiveness", "en")).toBe("Assertiveness");
  });

  it("localizes the label without leaking english", () => {
    const zh = getFacetLabel("E3_Assertiveness", "zh");
    expect(zh).toBeTruthy();
    expect(zh).not.toBe("Assertiveness");
  });

  it("falls back to a humanized key for unknown facets", () => {
    expect(getFacetLabel("Z9_Unknown", "en")).toBe("Unknown");
  });
});
