import { describe, expect, it } from "vitest";
import {
  ROLE_PLAY_SCENARIO_IDS,
  RolePlayFeedbackSchema,
  buildRolePlaySystemPrompt,
  rolePlayScenarios,
} from "../role-play";

describe("role-play scenarios", () => {
  it("defines the required first seven scenario simulations", () => {
    expect(rolePlayScenarios).toHaveLength(7);
    expect(new Set(rolePlayScenarios.map((scenario) => scenario.id))).toEqual(
      new Set(ROLE_PLAY_SCENARIO_IDS),
    );

    for (const scenario of rolePlayScenarios) {
      expect(scenario.setting.length).toBeGreaterThan(0);
      expect(scenario.userGoal.length).toBeGreaterThan(0);
      expect(scenario.aiRole.length).toBeGreaterThan(0);
      expect(scenario.rounds.min).toBeGreaterThanOrEqual(2);
      expect(scenario.rounds.max).toBeLessThanOrEqual(4);
    }
  });

  it("builds a simulation prompt with role boundaries and feedback dimensions", () => {
    const prompt = buildRolePlaySystemPrompt({
      scenarioId: "offer_negotiation",
      locale: "zh",
    });

    expect(prompt).toContain("offer 谈判");
    expect(prompt).toContain("2-4 轮");
    expect(prompt).toContain("表达清晰度");
    expect(prompt).toContain("价值观一致性");
    expect(prompt).toContain("回避点");
    expect(prompt).toContain("下一次练习建议");
  });

  it("validates role-play feedback reports", () => {
    const parsed = RolePlayFeedbackSchema.parse({
      expressionClarity: 4,
      valuesAlignment: 3,
      avoidancePoints: ["没有明确说出底线薪资"],
      nextPracticeSuggestion: "下一次练习把诉求压缩成三句话。",
    });

    expect(parsed.expressionClarity).toBe(4);
  });
});
