import { describe, it, expect } from "vitest";
import {
  detectAiAnxietySignal,
  extractAnxietyEscalation,
  AI_ANXIETY_ESCALATION_KEYWORDS,
} from "@/lib/coaching/anxiety-detection";

const AI_ANXIETY_ESCALATION_KEYWORDS_EN = AI_ANXIETY_ESCALATION_KEYWORDS.en;
const AI_ANXIETY_ESCALATION_KEYWORDS_ZH = AI_ANXIETY_ESCALATION_KEYWORDS.zh;

describe("anxiety-detection", () => {
  describe("detectAiAnxietySignal", () => {
    it("returns false for empty / neutral input", () => {
      expect(detectAiAnxietySignal("")).toBe(false);
      expect(detectAiAnxietySignal("hello")).toBe(false);
      expect(detectAiAnxietySignal("我想换工作")).toBe(false);
    });

    it("matches every English keyword (case-insensitive)", () => {
      for (const k of AI_ANXIETY_ESCALATION_KEYWORDS_EN) {
        expect(detectAiAnxietySignal(`I feel ${k} lately`)).toBe(true);
        expect(detectAiAnxietySignal(`I FEEL ${k.toUpperCase()} LATELY`)).toBe(
          true,
        );
      }
    });

    it("matches every Chinese keyword (exact substring)", () => {
      for (const k of AI_ANXIETY_ESCALATION_KEYWORDS_ZH) {
        expect(detectAiAnxietySignal(`最近${k}的感觉`)).toBe(true);
      }
    });

    it("matches representative real-world phrases (en)", () => {
      expect(detectAiAnxietySignal("AI is smarter than me, why bother")).toBe(
        true,
      );
      expect(detectAiAnxietySignal("My career is over with all this AI")).toBe(
        true,
      );
      expect(detectAiAnxietySignal("I'm being replaced by AI")).toBe(true);
    });

    it("matches representative real-world phrases (zh)", () => {
      expect(detectAiAnxietySignal("我感觉我废了，AI 全能做了")).toBe(true);
      expect(detectAiAnxietySignal("再努力也没用，AI 进化太快")).toBe(true);
      expect(detectAiAnxietySignal("现在的环境，未来没我位置")).toBe(true);
    });

    it("does NOT fire on positive AI mentions", () => {
      expect(detectAiAnxietySignal("AI helped me get a promotion")).toBe(false);
      expect(detectAiAnxietySignal("我学了 AI 之后效率翻倍")).toBe(false);
    });

    it("does NOT cross-fire with self-harm vocabulary (red-card domain)", () => {
      // These are crisis (red) keywords — anxiety detector must stay quiet
      // so the caller can pick the higher-tier crisis path explicitly.
      expect(detectAiAnxietySignal("I want to end my life")).toBe(false);
      expect(detectAiAnxietySignal("我不想活了")).toBe(false);
    });

    it("fires on AI-anxiety phrasing even when self-harm is also present (caller picks priority)", () => {
      // The detector is keyword-only and deliberately overlaps; the chat
      // surface does the "crisis trumps anxiety" precedence check.
      expect(
        detectAiAnxietySignal("AI is smarter than me, I want to die"),
      ).toBe(true);
      expect(detectAiAnxietySignal("我废了，活不下去了")).toBe(true);
    });
  });

  describe("extractAnxietyEscalation", () => {
    it("returns clean text + false when no marker present", () => {
      const result = extractAnxietyEscalation(
        "Here's what I'd say about that.",
      );
      expect(result.isAnxietyEscalation).toBe(false);
      expect(result.clean).toBe("Here's what I'd say about that.");
    });

    it("strips trailing marker and reports true", () => {
      const result = extractAnxietyEscalation(
        "Let's slow down.\n\n<<ANXIETY_ESCALATION>>",
      );
      expect(result.isAnxietyEscalation).toBe(true);
      expect(result.clean).toBe("Let's slow down.");
    });

    it("strips marker even with trailing whitespace / newlines", () => {
      const result = extractAnxietyEscalation(
        "Body text.\n<<ANXIETY_ESCALATION>>   \n\n",
      );
      expect(result.isAnxietyEscalation).toBe(true);
      expect(result.clean).toBe("Body text.");
    });

    it("does NOT strip marker that appears mid-message (must be terminal)", () => {
      const result = extractAnxietyEscalation(
        "Hmm <<ANXIETY_ESCALATION>> not at the end.",
      );
      expect(result.isAnxietyEscalation).toBe(false);
      expect(result.clean).toBe("Hmm <<ANXIETY_ESCALATION>> not at the end.");
    });

    it("does NOT strip the crisis marker — separation of concerns", () => {
      const result = extractAnxietyEscalation(
        "Please reach out for help.\n<<CRISIS_ALERT>>",
      );
      expect(result.isAnxietyEscalation).toBe(false);
      expect(result.clean).toBe("Please reach out for help.\n<<CRISIS_ALERT>>");
    });

    it("handles empty string", () => {
      const result = extractAnxietyEscalation("");
      expect(result.isAnxietyEscalation).toBe(false);
      expect(result.clean).toBe("");
    });

    it("handles marker as the only content", () => {
      const result = extractAnxietyEscalation("<<ANXIETY_ESCALATION>>");
      expect(result.isAnxietyEscalation).toBe(true);
      expect(result.clean).toBe("");
    });
  });
});
