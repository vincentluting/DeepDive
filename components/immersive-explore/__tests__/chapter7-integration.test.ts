// ============================================================
// Chapter 7 (Zero Room) — Integration Tests
// ============================================================
// Validates: TwIVI data integrity, scoring pipeline, value
// orientation computation, mixed scale handling, Ch.6→Ch.7
// transition, revelation content structure.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  IMMERSIVE_QUESTIONS,
  CHAPTERS,
  CHARACTERS,
  computeImmersiveScores,
  getRankedDimensions,
  extractTwiviAnswers,
  pickMirrorText,
  type RiasecKey,
} from "../data";
import { CHAPTER7_QUESTIONS } from "../data/chapter7-values";
import { computeQuickValueOrientation } from "@/lib/assessment/twivi-quick";
import {
  REVELATION_ACT1,
  REVELATION_ACT2,
  REVELATION_ACT3,
  REVELATION_LEDGER,
  REVELATION_FINALE,
} from "../data/ui-chrome";
import { immersiveReducer } from "../immersive-state/reducer";
import { INITIAL_STATE } from "../immersive-state/types";

// ── Ch.7 Data Integrity ─────────────────────────────────────

describe("Chapter 7 (values) data integrity", () => {
  it("has exactly 8 questions", () => {
    expect(CHAPTER7_QUESTIONS).toHaveLength(8);
  });

  it("all questions belong to 'values' chapter", () => {
    for (const q of CHAPTER7_QUESTIONS) {
      expect(q.chapter).toBe("values");
      expect(q.chapterIndex).toBe(7);
    }
  });

  it("questions have sequential IDs 31-38", () => {
    const ids = CHAPTER7_QUESTIONS.map((q) => q.id);
    expect(ids).toEqual([31, 32, 33, 34, 35, 36, 37, 38]);
  });

  it("questionInChapter ranges from 1-8", () => {
    const nums = CHAPTER7_QUESTIONS.map((q) => q.questionInChapter).sort(
      (a, b) => a - b,
    );
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("all questions have scaleMax=6", () => {
    for (const q of CHAPTER7_QUESTIONS) {
      expect(q.scaleMax).toBe(6);
    }
  });

  it("all questions have twiviItemId set", () => {
    const ids = CHAPTER7_QUESTIONS.map((q) => q.twiviItemId);
    expect(ids).toEqual([3, 13, 4, 14, 8, 18, 9, 19]);
  });

  it("no question has riasec set (values are orthogonal to RIASEC)", () => {
    for (const q of CHAPTER7_QUESTIONS) {
      expect(q.riasec).toBeUndefined();
    }
  });

  it("all questions have score6 in mirrorFeedback", () => {
    for (const q of CHAPTER7_QUESTIONS) {
      expect(q.mirrorFeedback.score6).toBeDefined();
      expect(q.mirrorFeedback.score6!.zh.length).toBeGreaterThan(0);
      expect(q.mirrorFeedback.score6!.en.length).toBeGreaterThan(0);
    }
  });

  it("has exactly one climax question", () => {
    const climaxes = CHAPTER7_QUESTIONS.filter((q) => q.isClimax);
    expect(climaxes).toHaveLength(1);
  });

  it("taskDescription preserves verbatim TwIVI text", () => {
    // Q31 = TwIVI item 3 (Benevolence)
    const q31 = CHAPTER7_QUESTIONS[0];
    expect(q31.taskDescription.en).toContain("help the people around them");
    expect(q31.taskDescription.zh).toContain("帮助周围的人");

    // Q38 = TwIVI item 19 (Power)
    const q38 = CHAPTER7_QUESTIONS[7];
    expect(q38.taskDescription.en).toContain(
      "be in charge and tell others what to do",
    );
    expect(q38.taskDescription.zh).toContain("掌控局面");
  });
});

// ── Values Chapter Config ───────────────────────────────────

describe("values chapter config", () => {
  it("exists in CHAPTERS", () => {
    expect(CHAPTERS.values).toBeDefined();
  });

  it("has index 7", () => {
    expect(CHAPTERS.values.index).toBe(7);
  });

  it("has no riasec dimension", () => {
    expect(CHAPTERS.values.riasec).toBeUndefined();
  });

  it("has 8 subTasks", () => {
    expect(CHAPTERS.values.subTasks).toHaveLength(8);
  });

  it("has entry narrative mentioning eight mirrors", () => {
    expect(CHAPTERS.values.entryNarrative.en).toContain("eight");
    expect(CHAPTERS.values.entryNarrative.zh).toContain("八面镜子");
  });

  it("archive chapter transition leads to Zero Room", () => {
    expect(CHAPTERS.archive.transitionNarrative.en).toContain("corridor");
    expect(CHAPTERS.archive.transitionNarrative.en).toContain("door");
    expect(CHAPTERS.archive.transitionNarrative.zh).toContain("走廊没有结束");
  });
});

// ── TwIVI Scoring Pipeline ──────────────────────────────────

describe("TwIVI scoring pipeline", () => {
  // Simulate answering all 38 questions
  const allAnswers: Record<number, number> = {};
  // Ch.1-6: all neutral (3)
  for (let i = 1; i <= 30; i++) allAnswers[i] = 3;
  // Ch.7: Transcendence high, Enhancement low
  allAnswers[31] = 6; // Benevolence (item 3)
  allAnswers[32] = 6; // Benevolence (item 13)
  allAnswers[33] = 5; // Universalism (item 4)
  allAnswers[34] = 5; // Universalism (item 14)
  allAnswers[35] = 2; // Achievement (item 8)
  allAnswers[36] = 2; // Achievement (item 18)
  allAnswers[37] = 1; // Power (item 9)
  allAnswers[38] = 1; // Power (item 19)

  it("extractTwiviAnswers maps immersive IDs to TwIVI item IDs", () => {
    const twiviAnswers = extractTwiviAnswers(allAnswers, IMMERSIVE_QUESTIONS);
    expect(twiviAnswers).toEqual({
      3: 6, // Q31 → TwIVI item 3
      13: 6, // Q32 → TwIVI item 13
      4: 5, // Q33 → TwIVI item 4
      14: 5, // Q34 → TwIVI item 14
      8: 2, // Q35 → TwIVI item 8
      18: 2, // Q36 → TwIVI item 18
      9: 1, // Q37 → TwIVI item 9
      19: 1, // Q38 → TwIVI item 19
    });
  });

  it("computeQuickValueOrientation returns transcendence for high-transcendence answers", () => {
    const twiviAnswers = extractTwiviAnswers(allAnswers, IMMERSIVE_QUESTIONS);
    const result = computeQuickValueOrientation(twiviAnswers);
    expect(result.orientation).toBe("transcendence");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.scores.transcendence).toBeGreaterThan(
      result.scores.enhancement,
    );
  });

  it("computeQuickValueOrientation returns enhancement for high-enhancement answers", () => {
    const enhancementAnswers = { ...allAnswers };
    // Flip: Enhancement high, Transcendence low
    enhancementAnswers[31] = 1;
    enhancementAnswers[32] = 1;
    enhancementAnswers[33] = 2;
    enhancementAnswers[34] = 2;
    enhancementAnswers[35] = 6;
    enhancementAnswers[36] = 6;
    enhancementAnswers[37] = 5;
    enhancementAnswers[38] = 5;

    const twiviAnswers = extractTwiviAnswers(
      enhancementAnswers,
      IMMERSIVE_QUESTIONS,
    );
    const result = computeQuickValueOrientation(twiviAnswers);
    expect(result.orientation).toBe("enhancement");
    expect(result.scores.enhancement).toBeGreaterThan(
      result.scores.transcendence,
    );
  });

  it("RIASEC scores are unaffected by Ch.7 answers", () => {
    // All answers = 3
    const neutralAnswers: Record<number, number> = {};
    for (let i = 1; i <= 38; i++) neutralAnswers[i] = 3;

    const scores = computeImmersiveScores(neutralAnswers);
    // Ch.1-6: 5 questions × 3 = 15 per dimension
    for (const key of ["R", "I", "A", "S", "E", "C"]) {
      expect(scores[key as RiasecKey]).toBe(15);
    }
  });

  it("Ch.7 answers with extreme values don't affect RIASEC scores", () => {
    const answers: Record<number, number> = {};
    for (let i = 1; i <= 30; i++) answers[i] = 3;
    // Ch.7: max values (6)
    for (let i = 31; i <= 38; i++) answers[i] = 6;

    const scores = computeImmersiveScores(answers);
    // RIASEC still 15 each
    for (const key of ["R", "I", "A", "S", "E", "C"]) {
      expect(scores[key as RiasecKey]).toBe(15);
    }
  });
});

// ── Mixed Scale (5pt + 6pt) ─────────────────────────────────

describe("mixed scale handling", () => {
  it("Ch.1-6 questions have scaleMax undefined (defaults to 5)", () => {
    const riasecQuestions = IMMERSIVE_QUESTIONS.filter(
      (q) => q.chapter !== "values",
    );
    for (const q of riasecQuestions) {
      expect(q.scaleMax).toBeUndefined();
    }
  });

  it("Ch.7 questions have scaleMax=6", () => {
    const valuesQuestions = IMMERSIVE_QUESTIONS.filter(
      (q) => q.chapter === "values",
    );
    for (const q of valuesQuestions) {
      expect(q.scaleMax).toBe(6);
    }
  });

  it("pickMirrorText handles score 6 for Ch.7 questions", () => {
    const q = CHAPTER7_QUESTIONS[0];
    const text = pickMirrorText(q.mirrorFeedback, 6, "en");
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(pickMirrorText(q.mirrorFeedback, 5, "en"));
  });

  it("pickMirrorText falls back to score5 when score6 is absent", () => {
    // Ch.1-6 questions don't have score6
    const q = IMMERSIVE_QUESTIONS[0]; // Q1 from Ch.1
    const text6 = pickMirrorText(q.mirrorFeedback, 6, "en");
    const text5 = pickMirrorText(q.mirrorFeedback, 5, "en");
    // Should fall back to score5
    expect(text6).toBe(text5);
  });
});

// ── Reducer: Ch.6→Ch.7 Transition ───────────────────────────

describe("Ch.6→Ch.7 transition in reducer", () => {
  it("RECORD_ANSWER auto-advances within Ch.7 (index 30→31)", () => {
    const s = {
      ...INITIAL_STATE,
      phase: "playing" as const,
      currentQuestionIndex: 30,
    };
    const next = immersiveReducer(s, {
      type: "RECORD_ANSWER",
      questionId: IMMERSIVE_QUESTIONS[30].id,
      score: 4,
    });
    expect(next.currentQuestionIndex).toBe(31);
    expect(next.phase).toBe("playing");
  });

  it("RECORD_ANSWER triggers chapter-transition at Ch.6→Ch.7 boundary (index 29→30)", () => {
    const q30 = IMMERSIVE_QUESTIONS[29];
    const q31 = IMMERSIVE_QUESTIONS[30];
    expect(q30.chapter).toBe("archive");
    expect(q31.chapter).toBe("values");

    const s = {
      ...INITIAL_STATE,
      phase: "playing" as const,
      currentQuestionIndex: 29,
    };
    const next = immersiveReducer(s, {
      type: "RECORD_ANSWER",
      questionId: q30.id,
      score: 3,
    });
    expect(next.phase).toBe("chapter-transition");
    expect(next.pendingChapterTransition).toEqual({
      fromChapterKey: "archive",
      toChapterKey: "values",
    });
  });

  it("answering Q38 (index 37) routes to avatar-gender", () => {
    expect(IMMERSIVE_QUESTIONS[37].id).toBe(38);
    expect(IMMERSIVE_QUESTIONS[37].chapter).toBe("values");
    expect(IMMERSIVE_QUESTIONS[38]).toBeUndefined();

    const s = {
      ...INITIAL_STATE,
      phase: "playing" as const,
      currentQuestionIndex: 37,
    };
    const next = immersiveReducer(s, {
      type: "RECORD_ANSWER",
      questionId: 38,
      score: 5,
    });
    expect(next.phase).toBe("avatar-gender");
  });
});

// ── Character demoScores Compatibility ──────────────────────

describe("character demoScores for Ch.7", () => {
  it("all characters have 38 demoScores", () => {
    for (const char of CHARACTERS) {
      expect(char.demoScores).toHaveLength(38);
    }
  });

  it("Ch.7 demoScores (indices 30-37) are within 1-6 range", () => {
    for (const char of CHARACTERS) {
      const ch7Scores = char.demoScores.slice(30, 38);
      for (const score of ch7Scores) {
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(6);
      }
    }
  });

  it("Leila (S-type) has high Transcendence scores", () => {
    const leila = CHARACTERS.find((c) => c.id === "leila")!;
    // Ch.7 indices 30-33 = Benevolence + Universalism (Transcendence)
    const transcendenceScores = leila.demoScores.slice(30, 34);
    const mean =
      transcendenceScores.reduce((a, b) => a + b, 0) /
      transcendenceScores.length;
    expect(mean).toBeGreaterThanOrEqual(4); // Should be high for S-type
  });

  it("Adrian (E-type) has high Enhancement scores", () => {
    const adrian = CHARACTERS.find((c) => c.id === "adrian")!;
    // Ch.7 indices 34-37 = Achievement + Power (Enhancement)
    const enhancementScores = adrian.demoScores.slice(34, 38);
    const mean =
      enhancementScores.reduce((a, b) => a + b, 0) / enhancementScores.length;
    expect(mean).toBeGreaterThanOrEqual(4); // Should be high for E-type
  });
});

// ── Revelation Content Structure ────────────────────────────

describe("revelation content (new 5-beat twist)", () => {
  it("ACT1 has 3 paragraphs (silence + crack + collapse)", () => {
    expect(REVELATION_ACT1.paragraphs).toHaveLength(3);
  });

  it("ACT2 has 4 paragraphs (twist + echo + first + notes)", () => {
    expect(REVELATION_ACT2.paragraphs).toHaveLength(4);
  });

  it("ACT3 has 1 paragraph (companion reveal)", () => {
    expect(REVELATION_ACT3.paragraphs).toHaveLength(1);
  });

  it("ACT1 contains the key twist question", () => {
    const act1Zh = REVELATION_ACT1.paragraphs[0].zh;
    expect(act1Zh).toContain("从哪里来的");
  });

  it("ACT1 reveals companions are real people", () => {
    const crack = REVELATION_ACT1.paragraphs[1].zh;
    expect(crack).toContain("他们是真人");
    expect(crack).toContain("Marcus");
  });

  it("ACT2 contains the companion-building twist", () => {
    const twist = REVELATION_ACT2.paragraphs[0].zh;
    expect(twist).toContain("八面镜子");
    expect(twist).toContain("在构建你");
  });

  it("ACT2 reveals she is the first participant", () => {
    const reveal = REVELATION_ACT2.paragraphs[2].zh;
    expect(reveal).toContain("我是第一个");
    expect(reveal).toContain("第一个完成第零局的人");
  });

  it("Ledger zh has companion addendum", () => {
    const ledger = REVELATION_LEDGER.zh;
    expect(ledger.noteLines).toContain("同伴编号：No. 7");
    expect(ledger.noteLines).toContain("状态：已激活");
  });

  it("Ledger en has companion addendum", () => {
    const ledger = REVELATION_LEDGER.en;
    expect(ledger.noteLines).toContain("Companion No.: 7");
    expect(ledger.noteLines).toContain("Status: Activated");
  });

  it("Finale references the new companion narrative", () => {
    expect(REVELATION_FINALE.zh.mergeText).toContain("零号封印完成。");
    expect(REVELATION_FINALE.en.mergeText).toContain("Zero seal complete.");
  });
});

// ── End-to-End Scoring Pipeline ─────────────────────────────

describe("full 38-question scoring pipeline", () => {
  it("produces valid archetype with real value orientation", () => {
    // Simulate R-dominant + Transcendence
    const answers: Record<number, number> = {};
    for (const q of IMMERSIVE_QUESTIONS) {
      if (q.riasec === "R") answers[q.id] = 5;
      else if (q.riasec) answers[q.id] = 2;
      else if (q.twiviItemId) {
        // Transcendence items (3,13,4,14) high, Enhancement (8,18,9,19) low
        const transcendenceItems = [3, 13, 4, 14];
        answers[q.id] = transcendenceItems.includes(q.twiviItemId) ? 6 : 1;
      }
    }

    // RIASEC scoring
    const scores = computeImmersiveScores(answers);
    const ranked = getRankedDimensions(scores);
    expect(ranked[0]).toBe("R");
    expect(scores.R).toBe(25);

    // TwIVI scoring
    const twiviAnswers = extractTwiviAnswers(answers, IMMERSIVE_QUESTIONS);
    const valueResult = computeQuickValueOrientation(twiviAnswers);
    expect(valueResult.orientation).toBe("transcendence");

    // Together: R + Transcendence → should produce R-transcendence archetype
    expect(ranked[0]).toBe("R");
    expect(valueResult.orientation).toBe("transcendence");
  });

  it("boundary case: all neutral answers produce valid result", () => {
    const answers: Record<number, number> = {};
    for (let i = 1; i <= 30; i++) answers[i] = 3;
    for (let i = 31; i <= 38; i++) answers[i] = 3; // Midpoint on 6-point scale

    const scores = computeImmersiveScores(answers);
    expect(Object.values(scores).every((v) => v === 15)).toBe(true);

    const twiviAnswers = extractTwiviAnswers(answers, IMMERSIVE_QUESTIONS);
    const valueResult = computeQuickValueOrientation(twiviAnswers);
    // All 3s on a 6pt scale → both poles equal → isBoundary should be true
    expect(valueResult.isBoundary).toBe(true);
  });
});
