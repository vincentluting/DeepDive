// ============================================================
// Tests: Tier-Aware Ranking — Job Zone band penalty
// Verifies that careers outside the user's target Job Zone band
// get a post-scoring penalty and sink in the ranking, while
// staying in `allScored` for the "cross-tier exploration" UI section.
// ============================================================

import { describe, it, expect, vi } from "vitest";
import type { CareerDirectionTemplate } from "@/lib/types/report";
import { computeTierPenalty } from "../engine";

// ── Pool: same RIASEC/factors, only jobZone differs ──────────
// Identical user-fit so the only ranking factor is tierPenalty.

const BASE_CAREER: Omit<
  CareerDirectionTemplate,
  "id" | "title_zh" | "title_en" | "jobZone"
> = {
  subtitle_zh: "测试",
  idealRIASEC: { R: 50, I: 60, A: 40, S: 50, E: 45, C: 55 },
  alignedValues: ["achievement", "self-direction"],
  idealBigFive: { openness: { min: 40, max: 80 } },
  industries: ["tech"],
  crossCulturalFit: ["bridge"] as CareerDirectionTemplate["crossCulturalFit"],
  seniorityRange: { minYears: 0, maxYears: 20 },
  tags: ["test"],
  annotationSource: "expert-heuristic" as const,
  annotationConfidence: "expert-estimated" as const,
  lastReviewedAt: "2026-01-01",
};

const TIER_2 = {
  ...BASE_CAREER,
  id: "tier-2",
  title_zh: "服务员",
  title_en: "Waiter",
  jobZone: 2,
};
const TIER_3 = {
  ...BASE_CAREER,
  id: "tier-3",
  title_zh: "导游",
  title_en: "Tour Guide",
  jobZone: 3,
};
const TIER_4 = {
  ...BASE_CAREER,
  id: "tier-4",
  title_zh: "产品经理",
  title_en: "Product Manager",
  jobZone: 4,
};
const TIER_5 = {
  ...BASE_CAREER,
  id: "tier-5",
  title_zh: "外科医生",
  title_en: "Surgeon",
  jobZone: 5,
};
const TIER_NULL = {
  ...BASE_CAREER,
  id: "tier-null",
  title_zh: "未分类",
  title_en: "Unclassified",
  jobZone: null,
};

// Pad to reach the minimum pool size used by engine internals.
const FILLER: CareerDirectionTemplate[] = Array.from(
  { length: 16 },
  (_, i) => ({
    ...BASE_CAREER,
    id: `filler-${i + 1}`,
    title_zh: `填充${i + 1}`,
    title_en: `Filler ${i + 1}`,
    jobZone: 4, // neutral — in-band for default target tier
  }),
);

const POOL: CareerDirectionTemplate[] = [
  TIER_2,
  TIER_3,
  TIER_4,
  TIER_5,
  TIER_NULL,
  ...FILLER,
];

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => POOL,
  ensureCareerPoolLoaded: async () => {},
}));

import { explore } from "../engine";
import type { UserProfile } from "../types";

const BALANCED_PROFILE: UserProfile = {
  riasec: { R: 50, I: 60, A: 40, S: 50, E: 45, C: 55 },
  bigFive: {
    openness: 60,
    conscientiousness: 55,
    extraversion: 50,
    agreeableness: 55,
    neuroticism: 45,
  },
  schwartz: {
    top3: ["self-direction", "achievement", "benevolence"],
    centered: {
      "self-direction": 1.2,
      achievement: 0.8,
      benevolence: 0.5,
      stimulation: 0.3,
      hedonism: 0.1,
      universalism: -0.1,
      conformity: -0.3,
      tradition: -0.5,
      security: -0.8,
      power: -1.2,
    },
  },
};

// ── Pure unit tests for computeTierPenalty ───────────────────

describe("computeTierPenalty", () => {
  const band = { min: 4, max: 5 };

  it("returns 0 when career is in-band", () => {
    expect(computeTierPenalty(4, band)).toBe(0);
    expect(computeTierPenalty(5, band)).toBe(0);
  });

  it("returns -10 for 1 tier off", () => {
    expect(computeTierPenalty(3, band)).toBe(-10);
  });

  it("returns -20 for 2 tiers off", () => {
    expect(computeTierPenalty(2, band)).toBe(-20);
  });

  it("returns -30 for ≥3 tiers off", () => {
    expect(computeTierPenalty(1, band)).toBe(-30);
  });

  it("returns 0 when jobZone is null/undefined (no penalty for legacy data)", () => {
    expect(computeTierPenalty(null, band)).toBe(0);
    expect(computeTierPenalty(undefined, band)).toBe(0);
  });

  it("returns 0 when targetTier is null (caller opted out)", () => {
    expect(computeTierPenalty(2, null)).toBe(0);
  });

  it("works for inverse band (user is blue-collar, white-collar penalized)", () => {
    const blueCollarBand = { min: 2, max: 3 };
    expect(computeTierPenalty(2, blueCollarBand)).toBe(0);
    expect(computeTierPenalty(3, blueCollarBand)).toBe(0);
    expect(computeTierPenalty(4, blueCollarBand)).toBe(-10);
    expect(computeTierPenalty(5, blueCollarBand)).toBe(-20);
  });
});

// ── Integration: explore() with tier-aware ranking ───────────

describe("explore() — tier-aware ranking", () => {
  it("default targetTier {min:4, max:5} puts tier 4/5 above tier 2/3", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const t2 = result.allScored.find((c) => c.id === "tier-2")!;
    const t3 = result.allScored.find((c) => c.id === "tier-3")!;
    const t4 = result.allScored.find((c) => c.id === "tier-4")!;
    const t5 = result.allScored.find((c) => c.id === "tier-5")!;

    expect(t4.totalScore).toBeGreaterThan(t3.totalScore);
    expect(t4.totalScore).toBeGreaterThan(t2.totalScore);
    expect(t5.totalScore).toBeGreaterThan(t3.totalScore);
    expect(t5.totalScore).toBeGreaterThan(t2.totalScore);
  });

  it("low-tier careers stay in allScored (not removed) for exploration section", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    expect(result.allScored.find((c) => c.id === "tier-2")).toBeDefined();
    expect(result.allScored.find((c) => c.id === "tier-3")).toBeDefined();
  });

  it("annotates inTargetTier + tierGap on ScoredCareer", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const t2 = result.allScored.find((c) => c.id === "tier-2")!;
    const t4 = result.allScored.find((c) => c.id === "tier-4")!;
    const t5 = result.allScored.find((c) => c.id === "tier-5")!;
    const tNull = result.allScored.find((c) => c.id === "tier-null")!;

    expect(t4.inTargetTier).toBe(true);
    expect(t4.tierGap).toBe(0);
    expect(t5.inTargetTier).toBe(true);
    expect(t5.tierGap).toBe(0);
    expect(t2.inTargetTier).toBe(false);
    expect(t2.tierGap).toBe(2);
    // null jobZone counts as "in-band" (don't punish legacy data)
    expect(tNull.inTargetTier).toBe(true);
  });

  it("targetTier: null disables tier-aware ranking entirely", async () => {
    const result = await explore(BALANCED_PROFILE, {
      count: 20,
      targetTier: null,
    });

    const t2 = result.allScored.find((c) => c.id === "tier-2")!;
    const t4 = result.allScored.find((c) => c.id === "tier-4")!;

    // Identical factor scores → identical totals when tier penalty disabled
    expect(t2.totalScore).toBe(t4.totalScore);
  });

  it("custom targetTier {min:2, max:3} inverts the ranking", async () => {
    const result = await explore(BALANCED_PROFILE, {
      count: 20,
      targetTier: { min: 2, max: 3 },
    });

    const t2 = result.allScored.find((c) => c.id === "tier-2")!;
    const t3 = result.allScored.find((c) => c.id === "tier-3")!;
    const t4 = result.allScored.find((c) => c.id === "tier-4")!;
    const t5 = result.allScored.find((c) => c.id === "tier-5")!;

    expect(t2.totalScore).toBeGreaterThan(t4.totalScore);
    expect(t2.totalScore).toBeGreaterThan(t5.totalScore);
    expect(t3.totalScore).toBeGreaterThan(t4.totalScore);
    expect(t3.totalScore).toBeGreaterThan(t5.totalScore);
  });

  it("null jobZone receives no penalty even when targetTier is set", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const tNull = result.allScored.find((c) => c.id === "tier-null")!;
    const t4 = result.allScored.find((c) => c.id === "tier-4")!;

    // Both should have identical totals (no tier signal → no penalty)
    expect(tNull.totalScore).toBe(t4.totalScore);
  });

  it("score is clamped to [0, 100]", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });
    for (const c of result.allScored) {
      expect(c.totalScore).toBeGreaterThanOrEqual(0);
      expect(c.totalScore).toBeLessThanOrEqual(100);
    }
  });
});
