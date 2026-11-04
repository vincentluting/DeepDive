import { describe, it, expect } from "vitest";
import {
  buildTriggerContext,
  isAiAnxietyTrigger,
  isReportSectionId,
  sectionLabel,
  type CoachingEntryContext,
} from "@/lib/coaching/types";

describe("coaching/types — CoachingEntryContext helpers", () => {
  describe("isReportSectionId", () => {
    it("accepts all 6 canonical section ids", () => {
      for (const id of [
        "career-anchor",
        "drain",
        "letter",
        "methodology",
        "realistic",
        "ai-era",
      ]) {
        expect(isReportSectionId(id)).toBe(true);
      }
    });

    it("rejects unknown strings and non-strings", () => {
      expect(isReportSectionId("bogus")).toBe(false);
      expect(isReportSectionId("")).toBe(false);
      expect(isReportSectionId(null)).toBe(false);
      expect(isReportSectionId(undefined)).toBe(false);
      expect(isReportSectionId(42)).toBe(false);
    });
  });

  describe("sectionLabel", () => {
    it("returns Chinese label for zh locale", () => {
      expect(sectionLabel("career-anchor", "zh")).toBe("职业锚");
      expect(sectionLabel("drain", "zh")).toBe("职业排水");
    });

    it("falls back to English label for non-zh locales", () => {
      expect(sectionLabel("career-anchor", "en")).toBe("Career Anchor");
      expect(sectionLabel("letter", "fr")).toBe("Letter to You");
    });

    it("returns AI era anxiety label in both locales", () => {
      expect(sectionLabel("ai-era", "zh")).toBe("AI 时代焦虑");
      expect(sectionLabel("ai-era", "en")).toBe("AI Era Anxiety");
      expect(sectionLabel("ai-era", "ja")).toBe("AI Era Anxiety");
    });
  });

  describe("buildTriggerContext", () => {
    it("returns null when no enteredFrom is set", () => {
      expect(buildTriggerContext({}, "en")).toBeNull();
      expect(buildTriggerContext({ focusConcept: "X" }, "en")).toBeNull();
    });

    it("builds a readable English string for section only", () => {
      const ctx: CoachingEntryContext = { enteredFrom: "career-anchor" };
      expect(buildTriggerContext(ctx, "en")).toBe(
        "From the Career Anchor chapter",
      );
    });

    it("includes focus concept when present (English)", () => {
      const ctx: CoachingEntryContext = {
        enteredFrom: "career-anchor",
        focusConcept: "bridge-maker archetype",
      };
      expect(buildTriggerContext(ctx, "en")).toContain("Career Anchor");
      expect(buildTriggerContext(ctx, "en")).toContain(
        "bridge-maker archetype",
      );
    });

    it("builds a Chinese trigger string for zh locale", () => {
      const ctx: CoachingEntryContext = {
        enteredFrom: "drain",
        focusConcept: "大厂产品经理方向",
      };
      const result = buildTriggerContext(ctx, "zh");
      expect(result).toContain("职业排水");
      expect(result).toContain("大厂产品经理方向");
    });

    it("caps output at 200 characters (matches Zod schema limit)", () => {
      const ctx: CoachingEntryContext = {
        enteredFrom: "career-anchor",
        focusConcept: "x".repeat(500),
      };
      const result = buildTriggerContext(ctx, "en");
      expect(result).not.toBeNull();
      expect(result!.length).toBeLessThanOrEqual(200);
    });

    it("emits AI Era Anxiety marker for ai-era section in both locales", () => {
      const en = buildTriggerContext({ enteredFrom: "ai-era" }, "en");
      const zh = buildTriggerContext({ enteredFrom: "ai-era" }, "zh");
      expect(en).toContain("AI Era Anxiety");
      expect(zh).toContain("AI 时代焦虑");
    });
  });

  describe("isAiAnxietyTrigger", () => {
    it("returns false for null/undefined/empty inputs", () => {
      expect(isAiAnxietyTrigger(null)).toBe(false);
      expect(isAiAnxietyTrigger(undefined)).toBe(false);
      expect(isAiAnxietyTrigger("")).toBe(false);
      expect(isAiAnxietyTrigger({})).toBe(false);
    });

    it("detects English marker in trigger context strings", () => {
      expect(isAiAnxietyTrigger("From the AI Era Anxiety chapter")).toBe(true);
      expect(isAiAnxietyTrigger("From the Career Anchor chapter")).toBe(false);
    });

    it("detects Chinese marker in trigger context strings", () => {
      expect(isAiAnxietyTrigger("来自「AI 时代焦虑」章节")).toBe(true);
      expect(isAiAnxietyTrigger("来自「职业锚」章节")).toBe(false);
    });

    it("detects entry context by enteredFrom or userIntent", () => {
      expect(isAiAnxietyTrigger({ enteredFrom: "ai-era" })).toBe(true);
      expect(isAiAnxietyTrigger({ userIntent: "ai_anxiety" })).toBe(true);
      expect(
        isAiAnxietyTrigger({
          enteredFrom: "career-anchor",
          userIntent: "explore",
        }),
      ).toBe(false);
    });

    it("composes with buildTriggerContext output", () => {
      const trigger = buildTriggerContext({ enteredFrom: "ai-era" }, "en");
      expect(isAiAnxietyTrigger(trigger)).toBe(true);
    });
  });
});
