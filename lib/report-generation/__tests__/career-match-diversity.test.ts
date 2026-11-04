// ============================================================
// Tests: computeCareerMatchAlgorithm — diversity quota integration
//
// Uses a dedicated mock pool where several near-identical careers
// (same RIASEC family, perfect interest fit) would dominate every
// recommendation slot without the quota — the "every MBA gets
// AI Product Manager" convergence scenario.
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { computeCareerMatchAlgorithm } from "../career-match-algorithm";
import { riasecPairKey } from "../diversity-quota";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import type { CareerDirectionTemplate } from "@/lib/types/report";
import type { RIASECDimension } from "@/lib/types";

// The user vector of the balanced assessment fixture, captured at module
// scope so the mock factory below can build careers around it.
const assessment = buildBalancedAssessment();
const userVec = assessment.riasecNormalized as Record<RIASECDimension, number>;

/** Rotate the user's RIASEC vector by `shift` dims — same magnitude profile,
 *  different direction → lower cosine similarity and a different pair key. */
function rotatedVec(shift: number): Record<RIASECDimension, number> {
  const dims: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];
  const out = {} as Record<RIASECDimension, number>;
  dims.forEach((d, i) => {
    out[d] = userVec[dims[(i + shift) % dims.length]];
  });
  return out;
}

const baseCareer = (
  id: string,
  idealRIASEC: Record<RIASECDimension, number>,
  extra: Partial<CareerDirectionTemplate> = {},
): CareerDirectionTemplate => ({
  id,
  title_zh: `职业 ${id}`,
  title_en: `Career ${id}`,
  subtitle_zh: `描述 ${id}`,
  idealRIASEC,
  alignedValues: ["achievement", "self-direction"],
  idealBigFive: {
    openness: { min: 0, max: 100 },
    conscientiousness: { min: 0, max: 100 },
  },
  industries: ["technology"],
  crossCulturalFit: ["bridge"] as CareerDirectionTemplate["crossCulturalFit"],
  seniorityRange: { minYears: 0, maxYears: 20 },
  tags: ["test"],
  annotationSource: "expert-heuristic" as const,
  annotationConfidence: "expert-estimated" as const,
  lastReviewedAt: "2026-01-01",
  ...extra,
});

// 5 clones with PERFECT interest fit (ideal == user vector) — without the
// quota these fill all five main slots. Then one career per rotated family
// as diverse runners-up, plus dedicated AI-era families.
const CLONE_IDS = ["clone-1", "clone-2", "clone-3", "clone-4", "clone-5"];
const DIVERSITY_POOL: CareerDirectionTemplate[] = [
  ...CLONE_IDS.map((id) => baseCareer(id, { ...userVec })),
  baseCareer("alt-1", rotatedVec(1)),
  baseCareer("alt-2", rotatedVec(2)),
  baseCareer("alt-3", rotatedVec(3)),
  baseCareer("alt-4", rotatedVec(4)),
  baseCareer("alt-5", rotatedVec(5)),
  // AI-era pool: 4 sharing the clone family + 2 from another family
  baseCareer("ai-clone-1", { ...userVec }, { aiEraCategory: "ai-native" }),
  baseCareer("ai-clone-2", { ...userVec }, { aiEraCategory: "ai-native" }),
  baseCareer("ai-clone-3", { ...userVec }, { aiEraCategory: "augmented" }),
  baseCareer("ai-clone-4", { ...userVec }, { aiEraCategory: "augmented" }),
  baseCareer("ai-alt-1", rotatedVec(2), { aiEraCategory: "ai-native" }),
  baseCareer("ai-alt-2", rotatedVec(3), { aiEraCategory: "augmented" }),
];

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => DIVERSITY_POOL,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));

async function runMatch() {
  const algo = computeProfileAlgorithm(assessment);
  return computeCareerMatchAlgorithm(assessment, algo, null);
}

const familyOf = (pool: CareerDirectionTemplate[], id: string): string => {
  const career = pool.find((c) => c.id === id);
  if (!career) throw new Error(`career not in pool: ${id}`);
  return riasecPairKey(career.idealRIASEC);
};

describe("computeCareerMatchAlgorithm — diversity quota", () => {
  it("caps same-RIASEC-family careers at 2 across the 5 main slots", async () => {
    const output = await runMatch();
    const mainIds = [...output.candidates, ...output.exploratoryCandidates].map(
      (c) => c.direction.id,
    );

    const familyCounts = new Map<string, number>();
    for (const id of mainIds) {
      const family = familyOf(DIVERSITY_POOL, id);
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    }
    for (const [family, count] of familyCounts) {
      expect(
        count,
        `family ${family} exceeded quota in ${mainIds}`,
      ).toBeLessThanOrEqual(2);
    }
  });

  it("still fills exactly 3 primary + 2 exploratory slots", async () => {
    const output = await runMatch();
    expect(output.candidates).toHaveLength(3);
    expect(output.exploratoryCandidates).toHaveLength(2);

    const ids = [...output.candidates, ...output.exploratoryCandidates].map(
      (c) => c.direction.id,
    );
    expect(new Set(ids).size).toBe(5);
  });

  it("keeps exactly 2 members of the dominant family in the main slots", async () => {
    const output = await runMatch();
    const mainIds = [...output.candidates, ...output.exploratoryCandidates].map(
      (c) => c.direction.id,
    );
    // The dominant family (perfect interest fit, 9 pool members) gets its
    // full quota of 2 — the cap only blocks the 3rd+ member, it never
    // suppresses a family below its entitlement.
    const cloneFamily = riasecPairKey(userVec);
    const dominantCount = mainIds.filter(
      (id) => familyOf(DIVERSITY_POOL, id) === cloneFamily,
    ).length;
    expect(dominantCount).toBe(2);
  });

  it("caps same-family careers within the AI-era section independently", async () => {
    const output = await runMatch();
    expect(output.aiEraCandidates.length).toBeGreaterThan(0);
    expect(output.aiEraCandidates.length).toBeLessThanOrEqual(3);

    const familyCounts = new Map<string, number>();
    for (const c of output.aiEraCandidates) {
      const family = familyOf(DIVERSITY_POOL, c.direction.id);
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    }
    for (const [family, count] of familyCounts) {
      expect(
        count,
        `AI-era family ${family} exceeded quota`,
      ).toBeLessThanOrEqual(2);
    }
    // Independent budget: the AI-era section may still show the clone family
    // even though the main slots already used its main-slot quota.
    const aiIds = output.aiEraCandidates.map((c) => c.direction.id);
    expect(aiIds.some((id) => id.startsWith("ai-clone"))).toBe(true);
  });

  it("candidates remain sorted by total score descending", async () => {
    const output = await runMatch();
    const scores = [
      ...output.candidates.map((c) => c.score.total),
      ...output.exploratoryCandidates.map((c) => c.score.total),
    ];
    // Within each list the rank order must hold
    const primaryScores = output.candidates.map((c) => c.score.total);
    for (let i = 1; i < primaryScores.length; i++) {
      expect(primaryScores[i]).toBeLessThanOrEqual(primaryScores[i - 1]);
    }
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true);
  });
});

describe("computeCareerMatchAlgorithm — quota back-fill contract", () => {
  it("fills all 5 slots even when every candidate shares one family", async () => {
    // Local pool override: only 6 same-family clones exist.
    vi.doMock("@/lib/career-matching/career-pool", () => ({
      getCareerPool: () =>
        CLONE_IDS.concat("clone-6").map((id) => baseCareer(id, { ...userVec })),
      ensureCareerPoolLoaded: async () => {},
      refreshCacheFromDb: async () => {},
      invalidateCareerPoolCache: () => {},
    }));
    vi.resetModules();
    const { computeCareerMatchAlgorithm: compute } =
      await import("../career-match-algorithm");
    const algo = computeProfileAlgorithm(assessment);
    const output = await compute(assessment, algo, null);

    expect(output.candidates).toHaveLength(3);
    expect(output.exploratoryCandidates).toHaveLength(2);
    vi.doUnmock("@/lib/career-matching/career-pool");
    vi.resetModules();
  });
});
