// ============================================================
// Tests: normalizeProfile — data boundary defense
// ============================================================

import { describe, it, expect } from "vitest";
import { normalizeProfile } from "../normalize-profile";

describe("normalizeProfile", () => {
  it("fills defaults for null/undefined input", () => {
    const result = normalizeProfile(null);
    expect(result.id).toBe("");
    expect(result.assessmentId).toBe("");
    expect(result.archetype.primary).toBe("S");
    expect(result.archetype.orientation).toBe("enhancement");
    expect(result.collabMapping.primary).toBe("S");
    expect(result.schwartzAnchors.ranking).toEqual([]);
    expect(result.version).toBe("1.0");
  });

  it("preserves existing fields unchanged", () => {
    const input = {
      id: "p-123",
      assessmentId: "a-456",
      archetype: {
        primary: "I",
        orientation: "enhancement",
        code: "I-enhancement",
        label_zh: "战略家",
        label_en: "Tactician",
        tagline_zh: "",
        tagline_en: "",
        isBoundary: false,
        confidence: 0.8,
        confidenceLevel: "high",
        derivedFrom: {
          primary: { dimension: "I", score: 70 },
          secondary: { dimension: "A", score: 55 },
          tertiary: { dimension: "S", score: 40 },
          gap12: 15,
          gap23: 15,
          relation: "adjacent",
        },
      },
      version: "3.0",
    };
    const result = normalizeProfile(input);
    expect(result.id).toBe("p-123");
    expect(result.archetype.primary).toBe("I");
    expect(result.archetype.confidence).toBe(0.8);
    expect(result.version).toBe("3.0");
  });

  it("handles legacy discMapping key by falling back to it for collabMapping", () => {
    const input = {
      id: "legacy-profile",
      discMapping: {
        primary: "D",
        secondary: null,
        scores: { D: 60, I: 20, S: 10, C: 10 },
        cssGradient: "linear-gradient(red, blue)",
        derivedFrom: "big_five_mapping",
        approximationNote_zh: "",
        approximationNote_en: "",
        confidence: 0.7,
      },
    };
    const result = normalizeProfile(input);
    expect(result.collabMapping.primary).toBe("D");
    expect(result.collabMapping.scores.D).toBe(60);
  });

  it("fills default collabMapping when neither collabMapping nor discMapping exist", () => {
    const result = normalizeProfile({ id: "no-collab" });
    expect(result.collabMapping.primary).toBe("S");
    expect(result.collabMapping.confidence).toBe(0);
  });

  it("fills safe defaults for schwartzAnchors", () => {
    const result = normalizeProfile({});
    expect(result.schwartzAnchors.ranking).toEqual([]);
    expect(result.schwartzAnchors.top3).toEqual([]);
    expect(result.schwartzAnchors.conflictPair).toBeNull();
  });

  it("lazily migrates legacy confidence aliases to canonical keys", () => {
    const result = normalizeProfile({
      confidenceMap: {
        riasec: 0.8,
        bigFive: 0.7,
        disc: 0.6,
        schwartz: 0.85,
        crossCultural: 0,
      },
    });

    expect(result.confidenceMap).toEqual({
      riasec: 0.8,
      bigFive: 0.7,
      collab: 0.6,
      values: 0.85,
      crossCultural: 0,
    });
    expect(result.confidenceMap.disc).toBeUndefined();
    expect(result.confidenceMap.schwartz).toBeUndefined();
  });

  it("preserves canonical confidence keys over legacy aliases", () => {
    const result = normalizeProfile({
      confidenceMap: {
        collab: 0.72,
        values: 0.9,
        disc: 0.2,
        schwartz: 0.3,
      },
    });

    expect(result.confidenceMap.collab).toBe(0.72);
    expect(result.confidenceMap.values).toBe(0.9);
    expect(result.confidenceMap.disc).toBeUndefined();
    expect(result.confidenceMap.schwartz).toBeUndefined();
  });

  it("preserves shadowInsights when present", () => {
    const shadowData = {
      shadows: [{ domain: "extraversion", score: 30 }],
      overallPattern_zh: "安静深度",
      overallPattern_en: "Quiet depth",
    };
    const result = normalizeProfile({ shadowInsights: shadowData });
    expect(result.shadowInsights).toEqual(shadowData);
  });

  it("leaves shadowInsights undefined when not present", () => {
    const result = normalizeProfile({});
    expect(result.shadowInsights).toBeUndefined();
  });

  // ============================================================
  // Lazy migration: cognitiveStyleDimensions score 1-5 → 0-100
  // ============================================================
  describe("cognitiveStyleDimensions lazy migration", () => {
    it("rewrites legacy 1-5 scores using EI/JP forward and SN/TF reverse", () => {
      // Legacy raw means: extraversion=2.5, openness=4, agreeableness=4, conscientiousness=3.5
      const legacy = {
        cognitiveStyleDimensions: {
          EI: { score: 2.5, label: "I", isNearMidpoint: true },
          SN: { score: 4, label: "N", isNearMidpoint: false },
          TF: { score: 4, label: "F", isNearMidpoint: false },
          JP: { score: 3.5, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(legacy);
      // EI: forward → ((2.5-1)/4)*100 = 37.5 (toward right pole I, label-consistent)
      expect(result.cognitiveStyleDimensions!.EI.score).toBe(37.5);
      // SN: reverse → ((5-4)/4)*100 = 25 (low S preference, hint switches to right=N matching label)
      expect(result.cognitiveStyleDimensions!.SN.score).toBe(25);
      // TF: reverse → ((5-4)/4)*100 = 25
      expect(result.cognitiveStyleDimensions!.TF.score).toBe(25);
      // JP: forward → ((3.5-1)/4)*100 = 62.5 (left pole J, hint = J description)
      expect(result.cognitiveStyleDimensions!.JP.score).toBe(62.5);
    });

    it("preserves label and isNearMidpoint metadata across migration", () => {
      const legacy = {
        cognitiveStyleDimensions: {
          EI: { score: 2.92, label: "I", isNearMidpoint: true },
          SN: { score: 4.08, label: "N", isNearMidpoint: false },
          TF: { score: 3.92, label: "F", isNearMidpoint: false },
          JP: { score: 3.5, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(legacy);
      expect(result.cognitiveStyleDimensions!.EI.label).toBe("I");
      expect(result.cognitiveStyleDimensions!.EI.isNearMidpoint).toBe(true);
      expect(result.cognitiveStyleDimensions!.JP.label).toBe("J");
      expect(result.cognitiveStyleDimensions!.JP.isNearMidpoint).toBe(false);
    });

    it("passes through new 0-100 records unchanged (max(score) > 5)", () => {
      const modern = {
        cognitiveStyleDimensions: {
          EI: { score: 40, label: "I", isNearMidpoint: false },
          SN: { score: 60, label: "N", isNearMidpoint: false },
          TF: { score: 55, label: "F", isNearMidpoint: true },
          JP: { score: 45, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(modern);
      expect(result.cognitiveStyleDimensions).toEqual(
        modern.cognitiveStyleDimensions,
      );
    });

    it("leaves cognitiveStyleDimensions undefined when source is missing", () => {
      const result = normalizeProfile({});
      expect(result.cognitiveStyleDimensions).toBeUndefined();
    });

    it("respects cognitiveStyleSchemaVersion=2 and skips migration even when scores look legacy", () => {
      // Authoritative marker: a record explicitly tagged version=2 must
      // pass through untouched, even if its scores happen to fall in the
      // legacy [1, 5] heuristic band (e.g. an extreme post-fix profile
      // whose normalized values landed there).
      const tagged = {
        cognitiveStyleSchemaVersion: 2,
        cognitiveStyleDimensions: {
          EI: { score: 2, label: "I", isNearMidpoint: true },
          SN: { score: 3, label: "N", isNearMidpoint: true },
          TF: { score: 4, label: "F", isNearMidpoint: false },
          JP: { score: 5, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(tagged);
      expect(result.cognitiveStyleDimensions).toEqual(
        tagged.cognitiveStyleDimensions,
      );
      expect(result.cognitiveStyleSchemaVersion).toBe(2);
    });

    it("treats records without schema version but with [1,5] scores as legacy", () => {
      // Records written between bug landing and schema-version introduction
      // — fallback heuristic must still catch them.
      const legacyHeuristic = {
        cognitiveStyleDimensions: {
          EI: { score: 2.5, label: "I", isNearMidpoint: true },
          SN: { score: 4, label: "N", isNearMidpoint: false },
          TF: { score: 4, label: "F", isNearMidpoint: false },
          JP: { score: 3.5, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(legacyHeuristic);
      // forward(2.5) = 37.5 — different from the original 2.5
      expect(result.cognitiveStyleDimensions!.EI.score).toBe(37.5);
    });

    it("does NOT mistake an extreme INFP (all-zero normalized scores) for legacy", () => {
      // Reproduce the codex cross-review finding: raw E=1, O=5, A=5, C=1
      // produces normalized 0/0/0/0 under the new EI/JP-forward + SN/TF-reverse
      // formulas. The naive `score <= 5` legacy check would re-migrate this
      // valid record, flipping SN/TF back to 100 and re-introducing the
      // original label-vs-hint contradiction (label='N' but hint says 'S').
      const extremeInfp = {
        cognitiveStyleDimensions: {
          EI: { score: 0, label: "I", isNearMidpoint: false },
          SN: { score: 0, label: "N", isNearMidpoint: false },
          TF: { score: 0, label: "F", isNearMidpoint: false },
          JP: { score: 0, label: "P", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(extremeInfp);
      // Pass through untouched — `0 < 1` falls outside the legacy [1, 5] band.
      expect(result.cognitiveStyleDimensions).toEqual(
        extremeInfp.cognitiveStyleDimensions,
      );
    });

    it("clamps out-of-range legacy values to [0, 100] after normalization", () => {
      // Legacy data at the raw scale boundaries (1 and 5).
      const boundary = {
        cognitiveStyleDimensions: {
          EI: { score: 1, label: "I", isNearMidpoint: false },
          SN: { score: 5, label: "S", isNearMidpoint: false },
          TF: { score: 1, label: "T", isNearMidpoint: false },
          JP: { score: 5, label: "J", isNearMidpoint: false },
        },
      };
      const result = normalizeProfile(boundary);
      // forward(1) → 0, forward(5) → 100
      expect(result.cognitiveStyleDimensions!.EI.score).toBe(0);
      expect(result.cognitiveStyleDimensions!.JP.score).toBe(100);
      // reverse(5) → 0, reverse(1) → 100
      expect(result.cognitiveStyleDimensions!.SN.score).toBe(0);
      expect(result.cognitiveStyleDimensions!.TF.score).toBe(100);
    });
  });
});
