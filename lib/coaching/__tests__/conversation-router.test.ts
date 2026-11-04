import { describe, expect, it } from "vitest";

import {
  analyzeCoachingTurn,
  buildAdaptiveTurnInstruction,
  createInitialCoachingSessionState,
} from "@/lib/coaching/conversation-router";
import { COACHING_GOLDEN_CASES } from "@/lib/coaching/eval-cases";

describe("analyzeCoachingTurn", () => {
  it("ships exactly 100 bilingual golden routing cases", () => {
    expect(COACHING_GOLDEN_CASES).toHaveLength(100);
    expect(
      COACHING_GOLDEN_CASES.filter((item) => item.locale === "en"),
    ).toHaveLength(50);
    expect(
      COACHING_GOLDEN_CASES.filter((item) => item.locale === "zh"),
    ).toHaveLength(50);
  });

  for (const testCase of COACHING_GOLDEN_CASES) {
    it(`${testCase.id}: routes the user's current need`, () => {
      const result = analyzeCoachingTurn({
        messages: [{ role: "user", content: testCase.input }],
      });
      expect(result.state.mode).toBe(testCase.expectedMode);
      expect(result.understanding.desiredHelp).toBe(testCase.expectedHelp);
      expect(result.understanding.coreQuestion).toContain(
        testCase.coreIncludes,
      );
    });
  }

  it("prioritizes the latest explicit request over the previous topic", () => {
    const result = analyzeCoachingTurn({
      messages: [
        { role: "user", content: "I want to understand my creative identity." },
        { role: "assistant", content: "What part feels uncertain?" },
        {
          role: "user",
          content: "Actually, be direct: should I accept the offer?",
        },
      ],
      previousState: {
        ...createInitialCoachingSessionState(),
        currentFocus: "creative identity",
      },
    });
    expect(result.state.mode).toBe("decide");
    expect(result.understanding.coreQuestion).toContain("accept the offer");
  });

  it("marks correction turns for explicit repair", () => {
    const result = analyzeCoachingTurn({
      messages: [
        { role: "user", content: "Should I take the promotion?" },
        { role: "assistant", content: "What does success mean to you?" },
        {
          role: "user",
          content: "You missed my point. I need a recommendation.",
        },
      ],
      previousState: {
        ...createInitialCoachingSessionState(),
        currentFocus: "Should I take the promotion?",
      },
      correctionSignal: "missed_point",
    });
    expect(result.needsRepair).toBe(true);
    expect(result.state.correctionCount).toBe(1);
    expect(result.state.mode).toBe("decide");
  });

  it("keeps the real question when a correction chip is used", () => {
    const result = analyzeCoachingTurn({
      messages: [
        { role: "user", content: "Should I take the promotion?" },
        { role: "assistant", content: "What does success mean to you?" },
        {
          role: "user",
          content: "You missed my point",
          kind: "correction",
        },
      ],
      previousState: {
        ...createInitialCoachingSessionState(),
        mode: "decide",
        currentFocus: "Should I take the promotion?",
      },
      correctionSignal: "missed_point",
    });

    expect(result.understanding.coreQuestion).toBe(
      "Should I take the promotion?",
    );
    expect(result.understanding.importantFacts).toEqual([]);
    expect(result.state.mode).toBe("decide");
  });

  it("requires clarification when the request is too ambiguous", () => {
    const result = analyzeCoachingTurn({
      messages: [{ role: "user", content: "怎么办" }],
    });
    expect(result.understanding.confidence).toBeLessThan(0.62);
    expect(result.understanding.ambiguities).not.toHaveLength(0);
  });

  it("does not persist the generated greeting as the user's goal", () => {
    const greeting = analyzeCoachingTurn({ messages: [] });
    expect(greeting.state.userGoal).toBeNull();
    expect(greeting.state.currentFocus).toBeNull();

    const firstUserTurn = analyzeCoachingTurn({
      messages: [
        {
          role: "user",
          content: "Help me decide whether to accept the offer.",
        },
      ],
      previousState: greeting.state,
    });
    expect(firstUserTurn.state.userGoal).toContain("accept the offer");
  });
});

describe("buildAdaptiveTurnInstruction", () => {
  it("requires a provisional recommendation in decide mode", () => {
    const analysis = analyzeCoachingTurn({
      messages: [{ role: "user", content: "Which offer should I take?" }],
    });
    const prompt = buildAdaptiveTurnInstruction({
      locale: "en",
      understanding: analysis.understanding,
      state: analysis.state,
      needsRepair: false,
      hasRealityConditions: true,
    });
    expect(prompt).toContain("Give a provisional recommendation now");
    expect(prompt).toContain("HIGHEST PRIORITY");
  });

  it("requires the action draft marker in act mode", () => {
    const analysis = analyzeCoachingTurn({
      messages: [
        { role: "user", content: "Build me a seven-day action plan." },
      ],
    });
    const prompt = buildAdaptiveTurnInstruction({
      locale: "en",
      understanding: analysis.understanding,
      state: analysis.state,
      needsRepair: false,
      hasRealityConditions: false,
    });
    expect(prompt).toContain("<<ACTION_DRAFT>>");
    expect(prompt).toContain("user must confirm");
  });

  it("asks the user to clarify (not assert) when repairing a low-confidence miss", () => {
    const analysis = analyzeCoachingTurn({
      messages: [{ role: "user", content: "Which offer should I take?" }],
    });
    const prompt = buildAdaptiveTurnInstruction({
      locale: "en",
      understanding: { ...analysis.understanding, confidence: 0.4 },
      state: { ...analysis.state, previousFocus: "salary" },
      needsRepair: true,
      hasRealityConditions: false,
    });
    // Low-confidence miss → ask, don't assert another guess.
    expect(prompt).toContain("Rather than keep guessing");
    expect(prompt).not.toContain("what you actually care about is");
  });

  it("asserts the corrected focus when repairing a high-confidence miss", () => {
    const analysis = analyzeCoachingTurn({
      messages: [{ role: "user", content: "Which offer should I take?" }],
    });
    const prompt = buildAdaptiveTurnInstruction({
      locale: "en",
      understanding: { ...analysis.understanding, confidence: 0.8 },
      state: { ...analysis.state, previousFocus: "work-life balance" },
      needsRepair: true,
      hasRealityConditions: false,
    });
    // High-confidence miss keeps the direct "return to your real point" form.
    expect(prompt).toContain("what you actually care about is");
    expect(prompt).not.toContain("Rather than keep guessing");
  });
});
