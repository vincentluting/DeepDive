import { describe, expect, it } from "vitest";
import { buildCoachingTurnUnderstanding } from "../turn-understanding";

describe("buildCoachingTurnUnderstanding", () => {
  it("detects a concrete Chinese why-question about coach quality", () => {
    const state = buildCoachingTurnUnderstanding([
      {
        role: "user",
        content:
          "我觉得这个AI聊天不是很能理解我，回复都很抽象虚化，这是怎么回事？",
      },
    ]);

    expect(state.requestType).toBe("feedback_about_coach");
    expect(state.needsDirectAnswer).toBe(true);
    expect(state.concreteReferences).toEqual(
      expect.arrayContaining(["AI聊天", "回复", "抽象", "虚化"]),
    );
    expect(state.responseObligation).toContain("product feedback");
  });

  it("detects pushback / 'you didn't understand me' and requires a direct answer", () => {
    const zh = buildCoachingTurnUnderstanding([
      { role: "user", content: "不是这样的，你没理解我。" },
    ]);
    expect(zh.requestType).toBe("pushes_back");
    expect(zh.needsDirectAnswer).toBe(true);

    const en = buildCoachingTurnUnderstanding([
      { role: "user", content: "That's not it, you missed my point." },
    ]);
    expect(en.requestType).toBe("pushes_back");
    expect(en.needsDirectAnswer).toBe(true);

    // 'office' / 'offboarding' must NOT trip pushback (bare 'off' over-matched).
    const office = buildCoachingTurnUnderstanding([
      { role: "user", content: "I work in an office downtown, by the way." },
    ]);
    expect(office.requestType).not.toBe("pushes_back");
  });

  it("asks for clarification when no concrete object is available", () => {
    const state = buildCoachingTurnUnderstanding([
      { role: "user", content: "我也说不清，就是有点怪。" },
    ]);

    expect(state.clarifyIfMissing).toBeTruthy();
    expect(state.needsDirectAnswer).toBe(false);
  });
});
