import { describe, expect, it } from "vitest";

import { resolveCoachingV2Rollout } from "../v2-rollout";

describe("resolveCoachingV2Rollout", () => {
  it("supports explicit legacy and shadow modes", () => {
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        enabledSetting: "false",
      }).variant,
    ).toBe("legacy");
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        enabledSetting: "shadow",
      }).variant,
    ).toBe("shadow");
  });

  it("supports 0, 10, 50, and 100 percent staged rollout", () => {
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        rolloutPercentSetting: "0",
      }).promptEnabled,
    ).toBe(false);
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        rolloutPercentSetting: "100",
      }).promptEnabled,
    ).toBe(true);

    for (const percent of ["10", "50"]) {
      const first = resolveCoachingV2Rollout({
        sessionId: "stable-session",
        rolloutPercentSetting: percent,
      });
      const second = resolveCoachingV2Rollout({
        sessionId: "stable-session",
        rolloutPercentSetting: percent,
      });
      expect(second).toEqual(first);
      expect(first.rolloutPercent).toBe(Number(percent));
    }
  });

  it("clamps invalid rollout percentages", () => {
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        rolloutPercentSetting: "-10",
      }).rolloutPercent,
    ).toBe(0);
    expect(
      resolveCoachingV2Rollout({
        sessionId: "session-1",
        rolloutPercentSetting: "150",
      }).rolloutPercent,
    ).toBe(100);
  });
});
