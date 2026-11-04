// ============================================================
// Tests for Priority Ranker
// ============================================================

import { describe, it, expect } from "vitest";
import { rankSeeds } from "../priority-ranker";
import type { ActionSeed } from "../seed-extractor";

// ── Helpers ────────────────────────────────────────────────

function makeSeed(overrides: Partial<ActionSeed> = {}): ActionSeed {
  return {
    title: "Test action",
    description: "Test description",
    category: "explore",
    intensity: "passive",
    sourceDimension: "test",
    estimatedMinutes: 15,
    rawWeight: 0.5,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────

describe("rankSeeds", () => {
  it("returns empty array for empty seeds", () => {
    const result = rankSeeds({
      seeds: [],
      hasRealConditions: false,
    });
    expect(result).toEqual([]);
  });

  it("sorts by priority descending", () => {
    const seeds: ActionSeed[] = [
      makeSeed({ title: "Low", rawWeight: 0.2 }),
      makeSeed({ title: "High", rawWeight: 0.9 }),
      makeSeed({ title: "Medium", rawWeight: 0.5 }),
    ];

    const result = rankSeeds({ seeds, hasRealConditions: false });
    expect(result[0].title).toBe("High");
    expect(result[result.length - 1].title).toBe("Low");
    // All priorities should be descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority);
    }
  });

  it("boosts explore/create/network for explore-polarity archetypes", () => {
    const exploreSeed = makeSeed({
      title: "Explore",
      category: "explore",
      rawWeight: 0.5,
    });
    const learnSeed = makeSeed({
      title: "Learn",
      category: "learn",
      rawWeight: 0.5,
    });

    const result = rankSeeds({
      seeds: [learnSeed, exploreSeed],
      archetype: "R-explore",
      valuePolarity: "explore",
      hasRealConditions: false,
    });

    const exploreItem = result.find((r) => r.title === "Explore")!;
    const learnItem = result.find((r) => r.title === "Learn")!;
    expect(exploreItem.priority).toBeGreaterThan(learnItem.priority);
  });

  it("boosts learn/apply/reflect for anchor-polarity archetypes", () => {
    const learnSeed = makeSeed({
      title: "Learn",
      category: "learn",
      rawWeight: 0.5,
    });
    const exploreSeed = makeSeed({
      title: "Explore",
      category: "explore",
      rawWeight: 0.5,
    });

    const result = rankSeeds({
      seeds: [exploreSeed, learnSeed],
      valuePolarity: "anchor",
      hasRealConditions: false,
    });

    const learnItem = result.find((r) => r.title === "Learn")!;
    const exploreItem = result.find((r) => r.title === "Explore")!;
    expect(learnItem.priority).toBeGreaterThan(exploreItem.priority);
  });

  it("deduplicates similar titles", () => {
    const seeds: ActionSeed[] = [
      makeSeed({ title: "Research companies in your area", rawWeight: 0.8 }),
      makeSeed({ title: "Research companies in your area", rawWeight: 0.6 }),
    ];

    const result = rankSeeds({ seeds, hasRealConditions: false });
    expect(result.length).toBe(1);
  });

  it("respects maxItems limit", () => {
    const seeds = Array.from({ length: 30 }, (_, i) =>
      makeSeed({ title: `Action ${i}`, rawWeight: 0.5 + i * 0.01 }),
    );

    const result = rankSeeds({ seeds, hasRealConditions: false, maxItems: 5 });
    expect(result.length).toBe(5);
  });

  it("returns priority as 0-100 integer", () => {
    const seeds = [makeSeed({ rawWeight: 0.7 })];
    const result = rankSeeds({ seeds, hasRealConditions: false });
    expect(result[0].priority).toBeGreaterThanOrEqual(0);
    expect(result[0].priority).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result[0].priority)).toBe(true);
  });
});

// ── Exercise data integration ──────────────────────────────

describe("rankSeeds — flow + non-negotiables", () => {
  it("hard-filters seeds that conflict with a non-negotiable", () => {
    const seeds: ActionSeed[] = [
      makeSeed({
        title: "Attend onsite networking event",
        description: "In-person only, downtown office",
        rawWeight: 0.9,
        category: "network",
      }),
      makeSeed({
        title: "Apply for remote product roles",
        description: "Work from home friendly",
        rawWeight: 0.6,
        category: "apply",
      }),
    ];
    const result = rankSeeds({
      seeds,
      hasRealConditions: false,
      nonNegotiables: ["remote_work", "psych_safety", "learning_budget"],
    });
    // Onsite event must be filtered out
    expect(result.find((r) => r.title.includes("onsite"))).toBeUndefined();
    expect(result.find((r) => r.title.includes("remote"))).toBeDefined();
  });

  it("records matchedNonNegotiable on boosted seeds", () => {
    const seeds: ActionSeed[] = [
      makeSeed({
        title: "Apply for remote product roles",
        description: "Remote-friendly companies",
        rawWeight: 0.6,
        category: "apply",
      }),
    ];
    const result = rankSeeds({
      seeds,
      hasRealConditions: false,
      nonNegotiables: ["remote_work", "psych_safety", "learning_budget"],
    });
    expect(result[0].matchedNonNegotiable).toBe("remote_work");
  });

  it("records matchedFlowDimension when dominant activity aligns", () => {
    const seeds: ActionSeed[] = [
      makeSeed({
        title: "Build a portfolio project",
        description: "Design and ship a small project",
        rawWeight: 0.5,
        category: "create",
      }),
    ];
    const result = rankSeeds({
      seeds,
      hasRealConditions: false,
      flowPatterns: {
        dominantActivity: "creating", // → category 'create'
        dominantSocial: "alone",
        dominantEnvironment: "quiet",
      },
    });
    expect(result[0].matchedFlowDimension?.activity).toBe("creating");
  });

  it("leaves matched* null when exercises are absent (lite tier)", () => {
    const seeds: ActionSeed[] = [
      makeSeed({ title: "Generic action", rawWeight: 0.5 }),
    ];
    const result = rankSeeds({ seeds, hasRealConditions: false });
    expect(result[0].matchedNonNegotiable ?? null).toBeNull();
    expect(result[0].matchedFlowDimension ?? null).toBeNull();
  });

  it("boosts a seed that matches the user #1 non-negotiable over one that does not", () => {
    const matching = makeSeed({
      title: "Apply for roles with learning budget",
      description: "Courses and conferences covered",
      rawWeight: 0.5,
      category: "apply",
    });
    const plain = makeSeed({
      title: "Apply for generic roles",
      description: "Regular application process",
      rawWeight: 0.5,
      category: "apply",
    });
    const result = rankSeeds({
      seeds: [plain, matching],
      hasRealConditions: false,
      nonNegotiables: ["learning_budget", "psych_safety", "remote_work"],
    });
    const matchingResult = result.find((r) =>
      r.title.includes("learning budget"),
    )!;
    const plainResult = result.find((r) => r.title.includes("generic"))!;
    expect(matchingResult.priority).toBeGreaterThan(plainResult.priority);
  });
});
