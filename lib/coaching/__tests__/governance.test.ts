import { describe, expect, it } from "vitest";
import {
  COACHING_GOVERNANCE,
  buildCoachingGovernanceState,
} from "../governance";

describe("coaching governance", () => {
  it("defines the minimum AI coaching governance commitments", () => {
    expect(COACHING_GOVERNANCE.boundaries).toContain("not therapy");
    expect(COACHING_GOVERNANCE.dataUse).toContain("not used to train");
    expect(COACHING_GOVERNANCE.escalation).toContain("crisis");
    expect(COACHING_GOVERNANCE.humanReview).toContain("review pool");
  });

  it("exposes prompt, judge, and eval versions for telemetry", () => {
    expect(buildCoachingGovernanceState()).toEqual(
      expect.objectContaining({
        promptVersion: expect.stringMatching(/^coach-os-/),
        evalVersion: expect.stringMatching(/^coach-eval-/),
        judgeVersion: expect.stringMatching(/^coach-judge-/),
      }),
    );
  });
});
