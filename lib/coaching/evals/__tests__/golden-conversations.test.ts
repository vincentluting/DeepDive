import { describe, expect, it } from "vitest";
import {
  GOLDEN_CONVERSATION_CATEGORIES,
  goldenConversations,
} from "../golden-conversations";

describe("golden coaching conversations", () => {
  it("covers the required eight Chinese coaching scenarios", () => {
    expect(goldenConversations.length).toBeGreaterThanOrEqual(8);
    expect(new Set(goldenConversations.map((item) => item.category))).toEqual(
      new Set(GOLDEN_CONVERSATION_CATEGORIES),
    );
    expect(goldenConversations.every((item) => item.locale === "zh")).toBe(
      true,
    );
  });

  it("includes the minimum rubric fields for each scenario", () => {
    for (const scenario of goldenConversations) {
      expect(scenario.userInput.length).toBeGreaterThan(0);
      expect(scenario.mustAnswerActualQuestion.length).toBeGreaterThan(0);
      expect(scenario.mustCiteEvidence.length).toBeGreaterThan(0);
      expect(scenario.forbiddenAbstractPhrases.length).toBeGreaterThan(0);
      expect(scenario.expectedRubric.mustDo.length).toBeGreaterThan(0);
      expect(scenario.expectedRubric.mustNotDo.length).toBeGreaterThan(0);
      expect(scenario.expectedRubric.passCriteria.length).toBeGreaterThan(0);
    }
  });
});
