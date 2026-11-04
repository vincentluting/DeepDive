// ============================================================
// Tests: buildReportHeader() — Pure Algorithm
// ============================================================

import { describe, it, expect } from "vitest";
import { buildReportHeader } from "../header";
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import {
  buildExtremeAssessment,
  buildMinimalAssessment,
} from "./fixtures/mock-assessment-extreme";

describe("buildReportHeader", () => {
  describe("basic structure", () => {
    it("returns all required fields", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header).toHaveProperty("archetypeCode");
      expect(header).toHaveProperty("archetype");
      expect(header).toHaveProperty("cognitiveStyleCode");
      expect(header).toHaveProperty("cognitiveStyleDisplayMode");
      expect(header).toHaveProperty("crossCulturalType_zh");
      expect(header).toHaveProperty("crossCulturalType_en");
      expect(header).toHaveProperty("collabMapping");
      expect(header).toHaveProperty("displayString_zh");
      expect(header).toHaveProperty("displayString_en");
      expect(header).toHaveProperty("fluidityNote_zh");
      expect(header).toHaveProperty("fluidityNote_en");
      expect(header).toHaveProperty("isBoundary");
    });

    it("archetype object has all required sub-fields", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.archetype).toHaveProperty("code");
      expect(header.archetype).toHaveProperty("orientation");
      expect(header.archetype).toHaveProperty("label_zh");
      expect(header.archetype).toHaveProperty("label_en");
      expect(header.archetype).toHaveProperty("tagline_zh");
      expect(header.archetype).toHaveProperty("tagline_en");
    });

    it("collabMapping has required sub-fields", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.collabMapping).toHaveProperty("cssGradient");
      expect(header.collabMapping).toHaveProperty("primary");
      expect(header.collabMapping).toHaveProperty("secondary");
      expect(typeof header.collabMapping.cssGradient).toBe("string");
      expect(header.collabMapping.cssGradient.length).toBeGreaterThan(0);
    });
  });

  describe("archetype code derivation", () => {
    it("derives archetypeCode from archetype.code", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.archetypeCode).toBe("I-enhancement");
    });

    it("looks up label from ARCHETYPE_MAP", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      // I-enhancement maps to '战略家' / 'Tactician'
      expect(header.archetype.label_zh).toBe("战略家");
      expect(header.archetype.label_en).toBe("Tactician");
    });

    it("looks up tagline from ARCHETYPE_MAP", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.archetype.tagline_zh).toContain("弹药");
      expect(header.archetype.tagline_en).toContain("strategic");
    });

    it("includes orientation in archetype header", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.archetype.orientation).toBe("enhancement");
      expect(header.archetype.code).toBe("I-enhancement");
    });
  });

  describe("cognitive style handling", () => {
    it("includes cognitive style code in display string when present", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.cognitiveStyleCode).toBe("INFJ");
      expect(header.displayString_zh).toContain("INFJ");
      expect(header.displayString_en).toContain("INFJ");
      expect(header.displayString_zh).toContain("·");
      expect(header.cognitiveStyleDisplayMode).toBe("normal");
    });

    it("omits cognitive style from display string when not present", () => {
      const assessment = buildMinimalAssessment();
      const header = buildReportHeader(assessment);

      expect(header.cognitiveStyleCode).toBeNull();
      expect(header.displayString_zh).not.toContain("·");
      expect(header.displayString_en).not.toContain("·");
      expect(header.cognitiveStyleDisplayMode).toBe("balanced");
    });
  });

  describe("cross-cultural (always null in v2.0)", () => {
    it("returns null for both locales", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.crossCulturalType_zh).toBeNull();
      expect(header.crossCulturalType_en).toBeNull();
    });
  });

  describe("fluidity notes", () => {
    it("returns stable note when isBoundary is false", () => {
      const assessment = buildBalancedAssessment();
      expect(assessment.archetype.isBoundary).toBe(false);
      const header = buildReportHeader(assessment);

      expect(header.isBoundary).toBe(false);
      expect(header.fluidityNote_zh).toContain("此刻的你");
      expect(header.fluidityNote_zh).not.toContain("分差很小");
      expect(header.fluidityNote_en).toContain("snapshot");
      expect(header.fluidityNote_en).not.toContain("close");
    });

    it("returns boundary note when isBoundary is true", () => {
      const assessment = buildExtremeAssessment();
      expect(assessment.archetype.isBoundary).toBe(true);
      const header = buildReportHeader(assessment);

      expect(header.isBoundary).toBe(true);
      expect(header.fluidityNote_zh).toContain("分差很小");
      expect(header.fluidityNote_zh).toContain("流动性");
      expect(header.fluidityNote_en).toContain("close");
      expect(header.fluidityNote_en).toContain("fluid");
    });
  });

  describe("Collaboration Style mapping derivation", () => {
    it("uses assessment.collabMapping when available", () => {
      const assessment = buildBalancedAssessment();
      assessment.collabMapping = {
        primary: "I",
        secondary: "S",
        scores: { D: 20, I: 35, S: 30, C: 15 },
        cssGradient: "linear-gradient(135deg, #FFD700, #4CAF50)",
        derivedFrom: "big_five_mapping",
        approximationNote_zh: "测试",
        approximationNote_en: "Test",
        confidence: 0.6,
      };

      const header = buildReportHeader(assessment);
      expect(header.collabMapping.primary).toBe("I");
      expect(header.collabMapping.secondary).toBe("S");
      expect(header.collabMapping.cssGradient).toContain("#FFD700");
    });

    it("falls back to mapBigFiveToCollabStyle when collabMapping is absent", () => {
      const assessment = buildMinimalAssessment();
      // No collabMapping set
      const header = buildReportHeader(assessment);

      expect(header.collabMapping.primary).toBeTruthy();
      expect(typeof header.collabMapping.cssGradient).toBe("string");
    });
  });

  describe("display string construction", () => {
    it("combines archetype label and cognitive style code with separator", () => {
      const assessment = buildBalancedAssessment();
      const header = buildReportHeader(assessment);

      expect(header.displayString_zh).toBe("战略家 · INFJ");
      expect(header.displayString_en).toBe("Tactician · INFJ");
    });

    it("shows only archetype label when no cognitive style code", () => {
      const assessment = buildMinimalAssessment();
      const header = buildReportHeader(assessment);

      expect(header.displayString_zh).toBe("主心骨");
      expect(header.displayString_en).toBe("Backbone");
      // Note: minimal assessment uses 12-type archetype → ARCHETYPE_MAP lookup
    });
  });
});
