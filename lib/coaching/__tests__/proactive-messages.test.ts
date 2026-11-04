// ============================================================
// Tests for proactive coach messages — pure, 0-LLM templates fired at journey
// milestones. The high-value invariant: every template must carry all 11 site
// locales, since the type only forces en/zh and a missing locale would render
// a fallback (or blank) coach message to e.g. Japanese/Korean users.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  generateProactiveMessage,
  getAvailableTriggers,
  type MessageTrigger,
} from "../proactive-messages";

// The 11 supported site locales.
const LOCALES = [
  "en",
  "zh",
  "nl",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ru",
  "ja",
  "ko",
];

const EXPECTED_TRIGGERS: MessageTrigger[] = [
  "welcome",
  "quick_dive_complete",
  "deep_dive_complete",
  "report_generated",
  "report_viewed",
  "return_nudge",
  "profile_generated",
  "action_plan_created",
];

describe("getAvailableTriggers", () => {
  it("exposes exactly the expected trigger set", () => {
    expect(getAvailableTriggers().sort()).toEqual(
      [...EXPECTED_TRIGGERS].sort(),
    );
  });
});

describe("generateProactiveMessage", () => {
  it("builds params for every known trigger with the right shape", () => {
    for (const trigger of EXPECTED_TRIGGERS) {
      const msg = generateProactiveMessage("user-1", trigger);
      expect(msg).not.toBeNull();
      expect(msg!.userId).toBe("user-1");
      expect(msg!.trigger).toBe(trigger);
      expect(msg!.type).toBeTruthy();
      // actionUrl is either a non-empty string or explicitly null (never undefined)
      expect(
        msg!.actionUrl === null || typeof msg!.actionUrl === "string",
      ).toBe(true);
    }
  });

  it("returns null for an unknown trigger", () => {
    expect(
      generateProactiveMessage("user-1", "not_a_trigger" as MessageTrigger),
    ).toBeNull();
  });

  it("INVARIANT: every message carries all 11 locales, non-empty", () => {
    for (const trigger of EXPECTED_TRIGGERS) {
      const content = generateProactiveMessage("u", trigger)!.content as Record<
        string,
        string
      >;
      for (const loc of LOCALES) {
        expect(
          content[loc],
          `${trigger} is missing/empty locale "${loc}"`,
        ).toBeTruthy();
      }
    }
  });
});
