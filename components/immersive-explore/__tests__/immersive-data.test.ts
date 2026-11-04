// ============================================================
// Immersive Explore — Data Integrity Tests
// ============================================================
// Validates: 30-question completeness, BilingualText structure,
// RIASEC mapping, character demoScores, scoring functions.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  IMMERSIVE_QUESTIONS,
  CHAPTERS,
  CHARACTERS,
  GENERATING_STEPS,
  DIMENSION_IMMERSIVE,
  computeImmersiveScores,
  getRankedDimensions,
  pickText,
  pickMirrorText,
  type RiasecKey,
  type BilingualText,
} from "../data";

// ── Helpers ─────────────────────────────────────────────────

function isBilingualText(obj: unknown): obj is BilingualText {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "zh" in obj &&
    "en" in obj &&
    typeof (obj as BilingualText).zh === "string" &&
    typeof (obj as BilingualText).en === "string"
  );
}

// ── 38 题完整性 (30 RIASEC + 8 TwIVI) ────────────────────────

describe("IMMERSIVE_QUESTIONS completeness", () => {
  it("has exactly 38 questions", () => {
    expect(IMMERSIVE_QUESTIONS).toHaveLength(38);
  });

  it("has sequential IDs 1-38", () => {
    const ids = IMMERSIVE_QUESTIONS.map((q) => q.id);
    expect(ids).toEqual(Array.from({ length: 38 }, (_, i) => i + 1));
  });

  it("has 7 chapters: 6 × 5 RIASEC + 1 × 8 TwIVI", () => {
    const chapterCounts: Record<string, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) {
      chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1;
    }
    expect(Object.keys(chapterCounts)).toHaveLength(7);
    // Ch.1-6: 5 questions each
    for (const ch of [
      "mechanical",
      "laboratory",
      "theater",
      "waiting",
      "negotiation",
      "archive",
    ]) {
      expect(chapterCounts[ch]).toBe(5);
    }
    // Ch.7: 8 questions
    expect(chapterCounts["values"]).toBe(8);
  });

  it("has correct questionInChapter within each chapter", () => {
    const byChapter = new Map<string, number[]>();
    for (const q of IMMERSIVE_QUESTIONS) {
      if (!byChapter.has(q.chapter)) byChapter.set(q.chapter, []);
      byChapter.get(q.chapter)!.push(q.questionInChapter);
    }
    // Ch.1-6: 1-5
    for (const ch of [
      "mechanical",
      "laboratory",
      "theater",
      "waiting",
      "negotiation",
      "archive",
    ]) {
      expect(byChapter.get(ch)!.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    }
    // Ch.7: 1-8
    expect(byChapter.get("values")!.sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("has one climax question per chapter", () => {
    const climaxes = IMMERSIVE_QUESTIONS.filter((q) => q.isClimax);
    expect(climaxes).toHaveLength(7);
  });
});

// ── RIASEC 映射 ─────────────────────────────────────────────

describe("RIASEC mapping", () => {
  it("has exactly 5 questions per RIASEC dimension (Ch.1-6 only)", () => {
    const counts: Record<string, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) {
      if (!q.riasec) continue;
      counts[q.riasec] = (counts[q.riasec] || 0) + 1;
    }
    for (const key of ["R", "I", "A", "S", "E", "C"]) {
      expect(counts[key]).toBe(5);
    }
  });

  it("each RIASEC chapter maps to one dimension", () => {
    const chapterRiasec = new Map<string, Set<string>>();
    for (const q of IMMERSIVE_QUESTIONS) {
      if (!q.riasec) continue;
      if (!chapterRiasec.has(q.chapter))
        chapterRiasec.set(q.chapter, new Set());
      chapterRiasec.get(q.chapter)!.add(q.riasec);
    }
    for (const [, dims] of chapterRiasec) {
      expect(dims.size).toBe(1);
    }
  });
});

// ── BilingualText 结构完整性 ────────────────────────────────

describe("BilingualText structure", () => {
  it("all question scenes are BilingualText", () => {
    for (const q of IMMERSIVE_QUESTIONS) {
      expect(isBilingualText(q.scene)).toBe(true);
    }
  });

  it("all question taskDescriptions are BilingualText", () => {
    for (const q of IMMERSIVE_QUESTIONS) {
      expect(isBilingualText(q.taskDescription)).toBe(true);
    }
  });

  it("all mirrorFeedback scores are BilingualText", () => {
    for (const q of IMMERSIVE_QUESTIONS) {
      for (const key of [
        "score1",
        "score2",
        "score3",
        "score4",
        "score5",
      ] as const) {
        expect(isBilingualText(q.mirrorFeedback[key])).toBe(true);
      }
    }
  });

  it("all zh fields are non-empty", () => {
    for (const q of IMMERSIVE_QUESTIONS) {
      expect(q.scene.zh.length).toBeGreaterThan(0);
      expect(q.taskDescription.zh.length).toBeGreaterThan(0);
      for (const key of [
        "score1",
        "score2",
        "score3",
        "score4",
        "score5",
      ] as const) {
        expect(q.mirrorFeedback[key].zh.length).toBeGreaterThan(0);
      }
    }
  });

  it("chapter config fields are BilingualText", () => {
    for (const ch of Object.values(CHAPTERS)) {
      expect(isBilingualText(ch.title)).toBe(true);
      expect(isBilingualText(ch.entryNarrative)).toBe(true);
      expect(isBilingualText(ch.transitionNarrative)).toBe(true);
      expect(isBilingualText(ch.missionBrief)).toBe(true);
      expect(Array.isArray(ch.subTasks)).toBe(true);
      for (const st of ch.subTasks) {
        expect(isBilingualText(st)).toBe(true);
      }
    }
  });

  it("character descriptions are BilingualText", () => {
    for (const char of CHARACTERS) {
      expect(isBilingualText(char.description)).toBe(true);
    }
  });

  it("GENERATING_STEPS are BilingualText[]", () => {
    expect(GENERATING_STEPS.length).toBeGreaterThan(0);
    for (const step of GENERATING_STEPS) {
      expect(isBilingualText(step)).toBe(true);
    }
  });

  it("DIMENSION_IMMERSIVE narratives are BilingualText", () => {
    for (const key of ["R", "I", "A", "S", "E", "C"] as RiasecKey[]) {
      expect(isBilingualText(DIMENSION_IMMERSIVE[key].high)).toBe(true);
      expect(isBilingualText(DIMENSION_IMMERSIVE[key].mid)).toBe(true);
    }
  });
});

// ── Characters ──────────────────────────────────────────────

describe("CHARACTERS", () => {
  it("has correct number of characters", () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(3);
  });

  it("each character has demoScores of length 38", () => {
    for (const char of CHARACTERS) {
      expect(char.demoScores).toHaveLength(38);
    }
  });

  it("all demoScores are within 1-6 range", () => {
    for (const char of CHARACTERS) {
      for (const score of char.demoScores) {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(6);
      }
    }
  });
});

// ── pickText / pickMirrorText ───────────────────────────────

describe("pickText and pickMirrorText", () => {
  it("pickText returns zh for locale zh", () => {
    const obj: BilingualText = { zh: "中文", en: "English" };
    expect(pickText(obj, "zh")).toBe("中文");
  });

  it("pickText returns en for locale en", () => {
    const obj: BilingualText = { zh: "中文", en: "English" };
    expect(pickText(obj, "en")).toBe("English");
  });

  it("pickMirrorText selects correct score and locale", () => {
    const q = IMMERSIVE_QUESTIONS[0];
    const zhText = pickMirrorText(q.mirrorFeedback, 3, "zh");
    const enText = pickMirrorText(q.mirrorFeedback, 3, "en");
    expect(zhText).toBe(q.mirrorFeedback.score3.zh);
    expect(enText).toBe(q.mirrorFeedback.score3.en);
  });
});

// ── Scoring ─────────────────────────────────────────────────

describe("scoring functions", () => {
  it("computeImmersiveScores returns all 6 RIASEC dimensions", () => {
    // All answers = 3 (neutral)
    const answers: Record<number, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) answers[q.id] = 3;
    const scores = computeImmersiveScores(answers);
    expect(Object.keys(scores).sort()).toEqual(["A", "C", "E", "I", "R", "S"]);
  });

  it("all-3 answers produce equal scores (15 per dimension)", () => {
    const answers: Record<number, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) answers[q.id] = 3;
    const scores = computeImmersiveScores(answers);
    for (const key of ["R", "I", "A", "S", "E", "C"]) {
      expect(scores[key as RiasecKey]).toBe(15); // 5 questions × 3
    }
  });

  it("max-R answers produce R as top dimension", () => {
    const answers: Record<number, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) {
      answers[q.id] = q.riasec === "R" ? 5 : 1; // Ch.7 (no riasec) gets 1
    }
    const scores = computeImmersiveScores(answers);
    const ranked = getRankedDimensions(scores);
    expect(ranked[0]).toBe("R");
    expect(scores.R).toBe(25); // 5 × 5
  });

  it("getRankedDimensions returns sorted keys", () => {
    const scores: Record<RiasecKey, number> = {
      R: 20,
      I: 15,
      A: 10,
      S: 25,
      E: 5,
      C: 18,
    };
    const ranked = getRankedDimensions(scores);
    expect(ranked).toEqual(["S", "R", "C", "I", "A", "E"]);
  });
});
