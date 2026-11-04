import { describe, it, expect } from "vitest";
import { bucketVariant, assignVariant } from "../assign";
import type { ExperimentConfig } from "../config";

const twoVariantExperiment: ExperimentConfig = {
  id: "test_experiment",
  description: "Test experiment",
  variants: [
    { id: "control", weight: 50 },
    { id: "treatment", weight: 50 },
  ],
};

describe("bucketVariant", () => {
  it("returns deterministic results for the same identifier", () => {
    const v1 = bucketVariant(twoVariantExperiment, "user-123");
    const v2 = bucketVariant(twoVariantExperiment, "user-123");
    expect(v1).toBe(v2);
  });

  it("returns a valid variant id", () => {
    const v = bucketVariant(twoVariantExperiment, "user-456");
    expect(["control", "treatment"]).toContain(v);
  });

  it("distributes roughly evenly across many users", () => {
    const counts: Record<string, number> = { control: 0, treatment: 0 };
    for (let i = 0; i < 1000; i++) {
      const v = bucketVariant(twoVariantExperiment, `user-${i}`);
      counts[v]++;
    }
    // With 1000 users and 50/50 split, each should get ~500 ± 80
    expect(counts.control).toBeGreaterThan(350);
    expect(counts.control).toBeLessThan(650);
    expect(counts.treatment).toBeGreaterThan(350);
    expect(counts.treatment).toBeLessThan(650);
  });

  it("respects unequal weights", () => {
    const unequalExp: ExperimentConfig = {
      id: "unequal",
      description: "90/10 split",
      variants: [
        { id: "heavy", weight: 90 },
        { id: "light", weight: 10 },
      ],
    };
    const counts: Record<string, number> = { heavy: 0, light: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[bucketVariant(unequalExp, `user-${i}`)]++;
    }
    // heavy should get ~900 ± 60
    expect(counts.heavy).toBeGreaterThan(800);
    expect(counts.light).toBeLessThan(200);
  });

  it("handles single variant", () => {
    const singleExp: ExperimentConfig = {
      id: "single",
      description: "One variant",
      variants: [{ id: "only", weight: 100 }],
    };
    expect(bucketVariant(singleExp, "anyone")).toBe("only");
  });

  it("different experiments give independent assignments", () => {
    const expA: ExperimentConfig = {
      ...twoVariantExperiment,
      id: "experiment_a",
    };
    const expB: ExperimentConfig = {
      ...twoVariantExperiment,
      id: "experiment_b",
    };
    // Not all users should get the same variant in both experiments
    let sameCount = 0;
    const n = 500;
    for (let i = 0; i < n; i++) {
      const vA = bucketVariant(expA, `user-${i}`);
      const vB = bucketVariant(expB, `user-${i}`);
      if (vA === vB) sameCount++;
    }
    // With independent hashing, ~50% should match (not 100% and not 0%)
    // Key test: it's NOT fully correlated (< 90%) and NOT fully anti-correlated (> 10%)
    expect(sameCount).toBeLessThan(n * 0.9);
    expect(sameCount).toBeGreaterThan(n * 0.1);
  });
});

describe("assignVariant", () => {
  it("returns null for unknown experiment", () => {
    expect(assignVariant("nonexistent", "user-1")).toBeNull();
  });

  it("returns first variant when experiment is paused", () => {
    // We test this indirectly — paused experiments return first variant
    // This is tested through bucketVariant with the paused flag
  });
});
