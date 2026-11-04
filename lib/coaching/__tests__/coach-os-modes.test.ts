import { describe, expect, it } from "vitest";
import {
  COACH_OS_MODE_IDS,
  buildCoachOSModeTrigger,
  coachOSModes,
} from "../coach-os-modes";

describe("Coach OS modes", () => {
  it("covers the required productized coaching entry points", () => {
    expect(coachOSModes).toHaveLength(7);
    expect(new Set(coachOSModes.map((mode) => mode.id))).toEqual(
      new Set(COACH_OS_MODE_IDS),
    );
    expect(
      coachOSModes.every(
        (mode) => mode.labelKey && mode.promptMode && mode.evalRubric,
      ),
    ).toBe(true);
  });

  it("builds a mode-specific trigger context for the coach prompt", () => {
    const trigger = buildCoachOSModeTrigger("role_play", "zh");

    expect(trigger).toContain("Coach OS");
    expect(trigger).toContain("role_play");
    expect(trigger).toContain("练一次对话");
  });
});
