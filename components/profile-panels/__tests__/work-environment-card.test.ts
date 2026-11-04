/**
 * Tests for deriveEnvironmentPreferences — table-driven algorithm behind
 * the "工作环境 / Work Environment" card in DimensionExplorer.
 *
 * Configuration lives in WORK_ENV_DIMENSIONS table inside
 * derive-environment-preferences.ts. Adding/changing a dimension means
 * updating one row + the matching test below.
 */

import { describe, expect, test } from "vitest";
import type { PersonalProfileData } from "@/lib/types";
import { scoreIPIP60 } from "@/lib/scoring/score-ipip60";
import {
  computeWorkEnvSignal,
  deriveEnvironmentPreferences,
  hasRequiredWorkEnvFacets,
  REQUIRED_WENV_FACETS,
} from "../derive-environment-preferences";

// ── helpers ──────────────────────────────────────────────────────

const ALL_NEUTRAL_FACETS: Record<string, number> = REQUIRED_WENV_FACETS.reduce(
  (acc, k) => ({ ...acc, [k]: 3 }),
  {} as Record<string, number>,
);

const NEUTRAL_SCHWARTZ: Record<string, number> = {
  achievement: 3,
  power: 3,
  universalism: 3,
  benevolence: 3,
  stimulation: 3,
  security: 3,
  "self-direction": 3,
  conformity: 3,
};

function mockProfile(
  facetOverrides: Record<string, number> = {},
  schwartzOverrides: Record<string, number> = {},
): PersonalProfileData {
  return {
    algoSnapshot: {
      bigFiveFacets: { ...ALL_NEUTRAL_FACETS, ...facetOverrides },
    },
    schwartzAnchors: {
      scores: { ...NEUTRAL_SCHWARTZ, ...schwartzOverrides },
    },
  } as unknown as PersonalProfileData;
}

// ── 维度 1 — Social ↔ Solo (E1 + E2 + N4 reversed) ──────────────

describe("[social] 维度1: 独立专注 ↔ 社交充能", () => {
  test("内向用户 (低 E1+E2) 即使高 A4 也偏左", () => {
    // A4_Cooperation 不在公式里, 不应影响结果
    const dims = deriveEnvironmentPreferences(
      mockProfile({
        E1_Friendliness: 1.5,
        E2_Gregariousness: 1.5,
        A4_Cooperation: 5,
      }),
    );
    expect(dims![0].position).toBeLessThan(30);
  });

  test("外向用户 (高 E1+E2) 偏右", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ E1_Friendliness: 5, E2_Gregariousness: 5 }),
    );
    expect(dims![0].position).toBeGreaterThan(70);
  });

  test("中性 E1+E2+N4 居中", () => {
    const dims = deriveEnvironmentPreferences(mockProfile());
    expect(dims![0].position).toBeGreaterThanOrEqual(40);
    expect(dims![0].position).toBeLessThanOrEqual(60);
  });

  test("高 N4 (社交焦虑) 把 social 拉向独立专注", () => {
    // E1+E2 中性偏低, N4=5 → reverse 后贡献 0 → 拉低社交分数
    const dims = deriveEnvironmentPreferences(
      mockProfile({
        E1_Friendliness: 2,
        E2_Gregariousness: 2,
        "N4_Self-Consciousness": 5,
      }),
    );
    expect(dims![0].position).toBeLessThan(30);
  });

  test("低 N4 (社交无焦虑) + 中性 E1+E2 不会强行右移", () => {
    // 中性 E1+E2=3 + 低 N4=1 (reverse=100) → raw=(50+50+100)/3=66 → social=66
    // 在中右区间, 但不应过度偏右
    const dims = deriveEnvironmentPreferences(
      mockProfile({ "N4_Self-Consciousness": 1 }),
    );
    expect(dims![0].position).toBeGreaterThan(50);
    expect(dims![0].position).toBeLessThan(80);
  });
});

// ── 维度 2 — Structure ↔ Flexible (C2 + C3) ─────────────────────

describe("[structure] 维度2: 清晰架构 ↔ 弹性自由", () => {
  test("高 C2+C3 偏左 (清晰架构)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ C2_Orderliness: 5, C3_Dutifulness: 5 }),
    );
    expect(dims![1].position).toBeLessThan(30);
  });

  test("低 C2+C3 偏右 (弹性自由)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ C2_Orderliness: 1, C3_Dutifulness: 1 }),
    );
    expect(dims![1].position).toBeGreaterThan(70);
  });
});

// ── 维度 3 — Pace + Schwartz (O4 + E5 + stimulation/security) ───

describe("[pace] 维度3: 动态变化 ↔ 稳定节奏", () => {
  test("稳定型 (低 O4+E5) 偏右", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ O4_Adventurousness: 1, "E5_Excitement-Seeking": 1 }),
    );
    expect(dims![2].position).toBeGreaterThan(70);
  });

  test("动态型 (高 O4+E5) 偏左", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ O4_Adventurousness: 5, "E5_Excitement-Seeking": 5 }),
    );
    expect(dims![2].position).toBeLessThan(30);
  });

  test("中性 O4+E5 居中", () => {
    const dims = deriveEnvironmentPreferences(mockProfile());
    expect(dims![2].position).toBeGreaterThanOrEqual(40);
    expect(dims![2].position).toBeLessThanOrEqual(60);
  });

  test("Schwartz blend: 高 stimulation 把 pace 拉向动态", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({}, { stimulation: 6, security: 1 }),
    );
    expect(dims![2].position).toBeLessThan(50);
  });

  test("anti-regression: 旧错误命名 E5_ExcitementSeeking 不会被读取", () => {
    const facets = { ...ALL_NEUTRAL_FACETS };
    delete facets["E5_Excitement-Seeking"];
    facets["E5_ExcitementSeeking"] = 5;
    expect(hasRequiredWorkEnvFacets(facets)).toBe(false);
    const profile = {
      algoSnapshot: { bigFiveFacets: facets },
      schwartzAnchors: { scores: NEUTRAL_SCHWARTZ },
    } as unknown as PersonalProfileData;
    expect(deriveEnvironmentPreferences(profile)).toBeNull();
  });
});

// ── 维度 4 — Autonomy (E3 + C5 + Schwartz self-direction) ───────

describe("[autonomy] 维度4: 自主决策 ↔ 团队协同", () => {
  test("高 E3+C5 偏左 (自主决策)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ E3_Assertiveness: 5, "C5_Self-Discipline": 5 }),
    );
    expect(dims![3].position).toBeLessThan(30);
  });

  test("低 E3+C5 偏右 (团队协同)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({ E3_Assertiveness: 1, "C5_Self-Discipline": 1 }),
    );
    expect(dims![3].position).toBeGreaterThan(70);
  });

  test("Schwartz blend: 高 self-direction 把 autonomy 拉向自主", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({}, { "self-direction": 6, conformity: 1 }),
    );
    expect(dims![3].position).toBeLessThan(50);
  });

  test("Schwartz blend: 高 conformity 把 autonomy 拉向团队协同", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile({}, { "self-direction": 1, conformity: 6 }),
    );
    expect(dims![3].position).toBeGreaterThan(50);
  });
});

// ── 维度 5 — Motivation (Schwartz dominant + A3 anchor) ─────────

describe("[motivation] 维度5: 使命驱动 ↔ 成就驱动", () => {
  test("高 universalism+benevolence 偏左 (使命驱动)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile(
        {},
        { universalism: 6, benevolence: 6, achievement: 1, power: 1 },
      ),
    );
    expect(dims![4].position).toBeLessThan(35);
  });

  test("高 achievement+power 偏右 (成就驱动)", () => {
    const dims = deriveEnvironmentPreferences(
      mockProfile(
        {},
        { universalism: 1, benevolence: 1, achievement: 6, power: 6 },
      ),
    );
    expect(dims![4].position).toBeGreaterThan(60);
  });

  test("高 A3 + 中性 Schwartz 偏左但弱化 (Schwartz 占 50%)", () => {
    const dims = deriveEnvironmentPreferences(mockProfile({ A3_Altruism: 5 }));
    // facet 把 position 拉到 0, Schwartz 中性 sNorm=50, w=0.5 → 0*0.5+50*0.5 = 25
    expect(dims![4].position).toBeLessThan(40);
    expect(dims![4].position).toBeGreaterThan(15);
  });

  test("Schwartz 等权 (50%): 高 A3 (左极) + 满 achievement (右极) 互相抵消到中性 ~50", () => {
    // facet primary = norm(A3=5)=100 → invertForLeftPole → facetPos=0
    // schwartz left=(1+1)/2=1, right=(6+6)/2=6, sNorm=(6-1+5)/10*100=100
    // position = 0*0.5 + 100*0.5 = 50 → 完美中性
    const dims = deriveEnvironmentPreferences(
      mockProfile(
        { A3_Altruism: 5 },
        { universalism: 1, benevolence: 1, achievement: 6, power: 6 },
      ),
    );
    expect(dims![4].position).toBe(50);
  });

  test("缺失 Schwartz scores 时退化为纯 facet 信号 (向左极偏)", () => {
    // A3=5 → facetPos=0; schwartz 缺失 → blend 跳过 → position=0 → clamp to 5
    const profile = {
      algoSnapshot: {
        bigFiveFacets: { ...ALL_NEUTRAL_FACETS, A3_Altruism: 5 },
      },
      schwartzAnchors: undefined,
    } as unknown as PersonalProfileData;
    const dims = deriveEnvironmentPreferences(profile);
    expect(dims![4].position).toBeLessThan(15);
  });

  test("部分 Schwartz keys 缺失时 missing 退化为 3 (中性)", () => {
    // 只给 universalism, 其它缺失 (treated as 3)
    // A3 中性 → facetPos=50
    // left=(universalism=6 + benevolence=3)/2=4.5
    // right=(achievement=3 + power=3)/2=3
    // sNorm=(3-4.5+5)/10*100=35; position=50*0.5+35*0.5=42.5 → 43
    const dims = deriveEnvironmentPreferences(
      mockProfile({}, { universalism: 6 }),
    );
    expect(dims![4].position).toBeLessThan(50);
    expect(dims![4].position).toBeGreaterThan(35);
  });
});

// ── 守卫 ────────────────────────────────────────────────────────

describe("hasRequiredWorkEnvFacets 守卫", () => {
  test("undefined 返回 false", () => {
    expect(hasRequiredWorkEnvFacets(undefined)).toBe(false);
  });

  test("空对象返回 false", () => {
    expect(hasRequiredWorkEnvFacets({})).toBe(false);
  });

  test("缺少任一必需 facet 返回 false", () => {
    const facets = { ...ALL_NEUTRAL_FACETS };
    delete facets["E1_Friendliness"];
    expect(hasRequiredWorkEnvFacets(facets)).toBe(false);
  });

  test("缺少 N4 返回 false (新增依赖)", () => {
    const facets = { ...ALL_NEUTRAL_FACETS };
    delete facets["N4_Self-Consciousness"];
    expect(hasRequiredWorkEnvFacets(facets)).toBe(false);
  });

  test("缺少 C5 返回 false (新增依赖)", () => {
    const facets = { ...ALL_NEUTRAL_FACETS };
    delete facets["C5_Self-Discipline"];
    expect(hasRequiredWorkEnvFacets(facets)).toBe(false);
  });

  test("全部必需 facet 都存在返回 true", () => {
    expect(hasRequiredWorkEnvFacets(ALL_NEUTRAL_FACETS)).toBe(true);
  });

  test("缺必需 facet 时 deriveEnvironmentPreferences 返回 null", () => {
    const facets = { ...ALL_NEUTRAL_FACETS };
    delete facets["E1_Friendliness"];
    const profile = {
      algoSnapshot: { bigFiveFacets: facets },
      schwartzAnchors: { scores: NEUTRAL_SCHWARTZ },
    } as unknown as PersonalProfileData;
    expect(deriveEnvironmentPreferences(profile)).toBeNull();
  });
});

// ── computeWorkEnvSignal 动态信号公式 ────────────────────────────

describe("computeWorkEnvSignal 动态 signal", () => {
  test("null 输入返回最低 default 25", () => {
    expect(computeWorkEnvSignal(null)).toBe(25);
  });

  test("空数组返回 25", () => {
    expect(computeWorkEnvSignal([])).toBe(25);
  });

  test("全维度居中 (pos=50) 信号 = 25 (clamp 下限)", () => {
    const dims = [
      { key: "social", position: 50, strength: "slight" as const },
      { key: "structure", position: 50, strength: "slight" as const },
    ];
    expect(computeWorkEnvSignal(dims)).toBe(25);
  });

  test("最强维度偏极程度 30 → 信号 60 (promote 到 spotlight)", () => {
    const dims = [
      { key: "social", position: 80, strength: "strong" as const },
      { key: "structure", position: 50, strength: "slight" as const },
    ];
    // max abs = 30 → 30*2 = 60
    expect(computeWorkEnvSignal(dims)).toBe(60);
  });

  test("最强维度偏极程度 45 (clamp 极值) → 信号 90 (实际上限)", () => {
    const dims = [{ key: "social", position: 95, strength: "strong" as const }];
    // max abs = 45 → 45*2 = 90
    expect(computeWorkEnvSignal(dims)).toBe(90);
  });

  test("信号永远不超过 95 (理论上限)", () => {
    // 即使有人塞进非法 position 值, 防御性 clamp
    const dims = [
      { key: "social", position: 0, strength: "strong" as const },
      { key: "structure", position: 100, strength: "strong" as const },
    ];
    expect(computeWorkEnvSignal(dims)).toBeLessThanOrEqual(95);
  });
});

// ── 端到端: 防止 IPIP-60 命名约定漂移 ────────────────────────────

describe("end-to-end: scoreIPIP60 输出与 REQUIRED_WENV_FACETS 对齐", () => {
  test("scoreIPIP60 输出包含所有 REQUIRED_WENV_FACETS keys", () => {
    const responses: Record<number, number> = {};
    for (let i = 1; i <= 60; i += 1) {
      responses[i] = 3;
    }
    const result = scoreIPIP60(responses);
    for (const key of REQUIRED_WENV_FACETS) {
      expect(result.facets[key]).toBeDefined();
    }
  });

  test("用 scoreIPIP60 中性答案构造的 profile 能 derive 出 5 条维度", () => {
    const responses: Record<number, number> = {};
    for (let i = 1; i <= 60; i += 1) {
      responses[i] = 3;
    }
    const result = scoreIPIP60(responses);
    const profile = {
      algoSnapshot: { bigFiveFacets: result.facets },
      schwartzAnchors: { scores: NEUTRAL_SCHWARTZ },
    } as unknown as PersonalProfileData;
    const dims = deriveEnvironmentPreferences(profile);
    expect(dims).not.toBeNull();
    expect(dims).toHaveLength(5);
    expect(dims!.map((d) => d.key)).toEqual([
      "social",
      "structure",
      "pace",
      "autonomy",
      "motivation",
    ]);
  });

  test("REQUIRED_WENV_FACETS 包含表驱动新增的 N4 + C5", () => {
    expect(REQUIRED_WENV_FACETS).toContain("N4_Self-Consciousness");
    expect(REQUIRED_WENV_FACETS).toContain("C5_Self-Discipline");
    // O5_Intellect 已从维度4 移除
    expect(REQUIRED_WENV_FACETS).not.toContain("O5_Intellect");
  });
});
