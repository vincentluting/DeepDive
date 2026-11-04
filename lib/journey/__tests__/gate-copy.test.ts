// ============================================================
// Tests for resolveGateCopy — config + dict → display data
// ============================================================

import { describe, it, expect } from "vitest";
import enJourneyGate from "@/lib/i18n/dictionaries/en/journeyGate.json";
import zhJourneyGate from "@/lib/i18n/dictionaries/zh/journeyGate.json";
import { resolveGateCopy } from "../gate-copy";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

function dictFromNamespace(namespace: typeof enJourneyGate): Dictionary {
  // Cast through unknown — we only exercise the journeyGate slice.
  return namespace as unknown as Dictionary;
}

describe("resolveGateCopy", () => {
  it("renders the action_hub gate in English", () => {
    const copy = resolveGateCopy({
      feature: "action_hub",
      dict: dictFromNamespace(enJourneyGate),
      currentState: "profile_generated",
    });
    expect(copy.title).toMatch(/Generate your Career Report/);
    expect(copy.body.length).toBeGreaterThan(20);
    expect(copy.eyebrow).toMatch(/Step \d+ of 5/);
    expect(copy.primaryCtaLabel).toBeTruthy();
    expect(copy.stepLabels.report).toBeTruthy();
  });

  it("renders the same gate in Chinese", () => {
    const copy = resolveGateCopy({
      feature: "action_hub",
      dict: dictFromNamespace(zhJourneyGate),
      currentState: "profile_generated",
    });
    expect(copy.title).toMatch(/职业报告/);
    expect(copy.eyebrow).toMatch(/第 \d+ 步/);
  });

  it("interpolates {{availableOn}} for time gates", () => {
    const copy = resolveGateCopy({
      feature: "post_assessment_too_early",
      dict: dictFromNamespace(enJourneyGate),
      currentState: "report_generated",
      context: { availableOn: "May 28, 2026" },
    });
    expect(copy.title).toContain("May 28, 2026");
    expect(copy.meta).toContain("May 28, 2026");
  });

  it("replaces missing interpolation tokens with empty string (no crash)", () => {
    const copy = resolveGateCopy({
      feature: "post_assessment_too_early",
      dict: dictFromNamespace(enJourneyGate),
      currentState: "report_generated",
      // No context.availableOn
    });
    // Title contains "Check back on " followed by empty (no crash, no {{}})
    expect(copy.title).not.toContain("{{");
  });

  it("throws clearly when journeyGate namespace is missing", () => {
    const bogus = {} as unknown as Dictionary;
    expect(() =>
      resolveGateCopy({
        feature: "action_hub",
        dict: bogus,
        currentState: "profile_generated",
      }),
    ).toThrow(/journeyGate dictionary missing/);
  });

  it("eyebrow uses the configured step index for the blocked step", () => {
    // action_hub blocks at step "report" which is position 4 of 5
    const copy = resolveGateCopy({
      feature: "action_hub",
      dict: dictFromNamespace(enJourneyGate),
      currentState: "profile_generated",
    });
    expect(copy.eyebrow).toBe("Step 4 of 5");
  });

  it("exposes localized step status labels for aria descriptions", () => {
    const en = resolveGateCopy({
      feature: "action_hub",
      dict: dictFromNamespace(enJourneyGate),
      currentState: "profile_generated",
    });
    expect(en.stepStatusLabels).toEqual({
      done: "done",
      blocked: "current step",
      pending: "pending",
    });
    expect(en.stepAriaLabelTemplate).toContain("{{n}}");
    expect(en.stepAriaLabelTemplate).toContain("{{status}}");

    const zh = resolveGateCopy({
      feature: "action_hub",
      dict: dictFromNamespace(zhJourneyGate),
      currentState: "profile_generated",
    });
    expect(zh.stepStatusLabels.done).toBe("已完成");
    expect(zh.stepStatusLabels.blocked).toBe("当前步骤");
  });
});
