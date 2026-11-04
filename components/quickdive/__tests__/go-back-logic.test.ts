// ============================================================
// Tests for Quick Dive go-back (score undo) logic
//
// Validates that going back correctly reverses score contributions
// for both RIASEC and Values (TwIVI) sections.
// ============================================================

import { describe, it, expect } from "vitest";
import { QUESTIONS, type RiasecKey } from "../quickdive-data";
import { QUICK_TWIVI_ITEMS } from "@/lib/assessment/twivi-quick";

// ── Helpers ─────────────────────────────────────────────────

type Scores = Record<RiasecKey, number>;

const ZERO_SCORES: Scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

/** Simulate recordAnswer: add value to the question's RIASEC key */
function recordAnswer(scores: Scores, qIndex: number, value: number): Scores {
  const key = QUESTIONS[qIndex].riasec;
  return { ...scores, [key]: scores[key] + value };
}

/** Simulate goBack: undo the answer at prevIndex */
function undoAnswer(
  scores: Scores,
  prevIndex: number,
  prevValue: number,
): Scores {
  const key = QUESTIONS[prevIndex].riasec;
  return { ...scores, [key]: scores[key] - prevValue };
}

// ── RIASEC go-back tests ────────────────────────────────────

describe("RIASEC go-back score undo", () => {
  it("should restore scores to zero after recording and undoing one answer", () => {
    const value = 3;
    let scores = recordAnswer({ ...ZERO_SCORES }, 0, value);

    // Scores should have the value
    const key = QUESTIONS[0].riasec;
    expect(scores[key]).toBe(value);

    // Undo
    scores = undoAnswer(scores, 0, value);
    expect(scores).toEqual(ZERO_SCORES);
  });

  it("should correctly undo the last of multiple answers", () => {
    let scores = { ...ZERO_SCORES };
    const answers: number[] = [];

    // Record 5 answers
    for (let i = 0; i < 5; i++) {
      const value = (i % 4) + 1; // 1, 2, 3, 4, 1
      scores = recordAnswer(scores, i, value);
      answers.push(value);
    }

    // Snapshot scores before last answer
    const scoresBeforeLast = recordAnswer({ ...ZERO_SCORES }, 0, answers[0]);
    for (let i = 1; i < 4; i++) {
      Object.assign(
        scoresBeforeLast,
        recordAnswer(scoresBeforeLast, i, answers[i]),
      );
    }

    // Undo last answer (index 4)
    scores = undoAnswer(scores, 4, answers[4]);

    // The dimension that question 4 belongs to should have the right value
    const q4Key = QUESTIONS[4].riasec;
    // Calculate expected: sum of all answers for q4Key's dimension, minus the last one
    let expected = 0;
    for (let i = 0; i < 4; i++) {
      if (QUESTIONS[i].riasec === q4Key) expected += answers[i];
    }
    expect(scores[q4Key]).toBe(expected);
  });

  it("should handle multiple sequential go-backs", () => {
    let scores = { ...ZERO_SCORES };
    const answers = [4, 2, 3];

    // Record 3 answers
    for (let i = 0; i < 3; i++) {
      scores = recordAnswer(scores, i, answers[i]);
    }

    // Undo all 3 in reverse order
    scores = undoAnswer(scores, 2, answers[2]);
    scores = undoAnswer(scores, 1, answers[1]);
    scores = undoAnswer(scores, 0, answers[0]);

    expect(scores).toEqual(ZERO_SCORES);
  });

  it("should not go negative when undoing a 0-value answer", () => {
    let scores = { ...ZERO_SCORES };
    scores = recordAnswer(scores, 0, 0);
    scores = undoAnswer(scores, 0, 0);

    expect(scores).toEqual(ZERO_SCORES);
  });

  it("should preserve other dimensions when undoing", () => {
    let scores = { ...ZERO_SCORES };

    // Record answers for different dimensions
    scores = recordAnswer(scores, 0, 4);
    scores = recordAnswer(scores, 1, 3);

    const q0Key = QUESTIONS[0].riasec;
    const q1Key = QUESTIONS[1].riasec;

    // Undo only the second answer
    scores = undoAnswer(scores, 1, 3);

    // First dimension should be untouched
    expect(scores[q0Key]).toBe(4);
    // Second dimension should be back to 0 (if different from first)
    if (q0Key !== q1Key) {
      expect(scores[q1Key]).toBe(0);
    }
  });
});

// ── Values go-back tests ────────────────────────────────────

describe("Values (TwIVI) go-back answer undo", () => {
  it("should remove the answer for the previous question", () => {
    const answers: Record<number, number> = {};

    // Record 3 value answers
    for (let i = 0; i < 3; i++) {
      const item = QUICK_TWIVI_ITEMS[i];
      answers[item.id] = i + 3; // values 3, 4, 5
    }

    expect(Object.keys(answers)).toHaveLength(3);

    // Undo last (index 2)
    const prevItem = QUICK_TWIVI_ITEMS[2];
    delete answers[prevItem.id];

    expect(Object.keys(answers)).toHaveLength(2);
    expect(answers[prevItem.id]).toBeUndefined();
  });

  it("should preserve earlier answers when undoing later ones", () => {
    const answers: Record<number, number> = {};

    // Record 3 answers
    for (let i = 0; i < 3; i++) {
      answers[QUICK_TWIVI_ITEMS[i].id] = 6 - i; // 6, 5, 4
    }

    // Undo index 2
    delete answers[QUICK_TWIVI_ITEMS[2].id];

    // Earlier answers should be intact
    expect(answers[QUICK_TWIVI_ITEMS[0].id]).toBe(6);
    expect(answers[QUICK_TWIVI_ITEMS[1].id]).toBe(5);
  });
});

// ── Item response tracking ──────────────────────────────────

describe("itemResponses tracking", () => {
  it("should clear the response at the go-back index", () => {
    const responses: (number | undefined)[] = [];

    // Record 3 responses
    responses[0] = 4;
    responses[1] = 2;
    responses[2] = 3;

    // Go back from index 3 to index 2
    responses[2] = undefined;

    expect(responses[0]).toBe(4);
    expect(responses[1]).toBe(2);
    expect(responses[2]).toBeUndefined();
  });
});

// ── QUESTIONS data integrity for go-back ────────────────────

describe("QUESTIONS data integrity", () => {
  it("every question should have a valid RIASEC key", () => {
    const validKeys: RiasecKey[] = ["R", "I", "A", "S", "E", "C"];
    for (const q of QUESTIONS) {
      expect(validKeys).toContain(q.riasec);
    }
  });

  it("should have exactly 30 questions", () => {
    expect(QUESTIONS).toHaveLength(30);
  });

  it("should have 5 questions per RIASEC dimension", () => {
    const counts: Record<string, number> = {};
    for (const q of QUESTIONS) {
      counts[q.riasec] = (counts[q.riasec] || 0) + 1;
    }
    for (const key of ["R", "I", "A", "S", "E", "C"]) {
      expect(counts[key]).toBe(5);
    }
  });
});

describe("QUICK_TWIVI_ITEMS data integrity", () => {
  it("should have exactly 8 items", () => {
    expect(QUICK_TWIVI_ITEMS).toHaveLength(8);
  });

  it("every item should have a unique id", () => {
    const ids = QUICK_TWIVI_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
