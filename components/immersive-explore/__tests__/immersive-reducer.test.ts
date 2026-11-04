import { describe, it, expect } from "vitest";
import { immersiveReducer } from "../immersive-state/reducer";
import {
  INITIAL_STATE,
  type ImmersiveState,
  type ImmersiveResult,
} from "../immersive-state/types";
import { IMMERSIVE_QUESTIONS } from "../data";

// ── Helper ───────────────────────────────────────────────────

function stateWith(overrides: Partial<ImmersiveState>): ImmersiveState {
  return { ...INITIAL_STATE, ...overrides };
}

const MOCK_RESULT: ImmersiveResult = {
  scores: { R: 15, I: 20, A: 10, S: 18, E: 12, C: 8 },
  ranked: ["I", "S", "R", "E", "A", "C"],
  primaryDimension: "I",
  secondaryDimension: "S",
  primaryNarrative: "Test narrative primary",
  secondaryNarrative: "Test narrative secondary",
  characterPaths: [],
  archetype: {
    primary: "I",
    orientation: "transcendence",
    code: "I-transcendence",
    label_zh: "测试",
    label_en: "Test",
    tagline_zh: "测试",
    tagline_en: "Test",
    confidence: 0.8,
    confidenceLevel: "high",
    isBoundary: false,
    derivedFrom: {
      primary: { dimension: "I", score: 20 },
      secondary: { dimension: "S", score: 18 },
      tertiary: { dimension: "R", score: 15 },
      gap12: 2,
      gap23: 3,
      relation: "adjacent",
    },
  },
};

// Index where chapter transitions occur (the LAST question of each chapter)
const LAST_INDEX_OF_CHAPTER = (() => {
  const indices: number[] = [];
  for (let i = 0; i < IMMERSIVE_QUESTIONS.length - 1; i++) {
    if (IMMERSIVE_QUESTIONS[i].chapter !== IMMERSIVE_QUESTIONS[i + 1].chapter) {
      indices.push(i);
    }
  }
  return indices;
})();
const FIRST_CHAPTER_BOUNDARY = LAST_INDEX_OF_CHAPTER[0]; // 4 (Q5, last of mechanical)

// ── Tests ────────────────────────────────────────────────────

describe("immersiveReducer", () => {
  describe("SET_PHASE", () => {
    it("transitions between intro phases", () => {
      let s = INITIAL_STATE;
      expect(s.phase).toBe("envelope");

      s = immersiveReducer(s, { type: "SET_PHASE", phase: "invitation" });
      expect(s.phase).toBe("invitation");

      s = immersiveReducer(s, { type: "SET_PHASE", phase: "rules" });
      expect(s.phase).toBe("rules");

      s = immersiveReducer(s, { type: "SET_PHASE", phase: "characters" });
      expect(s.phase).toBe("characters");

      s = immersiveReducer(s, { type: "SET_PHASE", phase: "playing" });
      expect(s.phase).toBe("playing");
    });
  });

  describe("RECORD_ANSWER (auto-advance)", () => {
    it("records answer and advances index when next question is same chapter", () => {
      const s = stateWith({ phase: "playing", currentQuestionIndex: 0 });
      const next = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[0].id,
        score: 4,
      });

      expect(next.answers[IMMERSIVE_QUESTIONS[0].id]).toBe(4);
      expect(next.currentQuestionIndex).toBe(1);
      expect(next.phase).toBe("playing");
      expect(next.pendingChapterTransition).toBeNull();
    });

    it("triggers chapter-transition when next question crosses chapter boundary", () => {
      const s = stateWith({
        phase: "playing",
        currentQuestionIndex: FIRST_CHAPTER_BOUNDARY,
      });
      const lastQuestionInChapter = IMMERSIVE_QUESTIONS[FIRST_CHAPTER_BOUNDARY];
      const nextQuestion = IMMERSIVE_QUESTIONS[FIRST_CHAPTER_BOUNDARY + 1];

      const next = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: lastQuestionInChapter.id,
        score: 3,
      });

      expect(next.answers[lastQuestionInChapter.id]).toBe(3);
      expect(next.phase).toBe("chapter-transition");
      // Index does not advance until COMPLETE_CHAPTER_TRANSITION fires
      expect(next.currentQuestionIndex).toBe(FIRST_CHAPTER_BOUNDARY);
      expect(next.pendingChapterTransition).toEqual({
        fromChapterKey: lastQuestionInChapter.chapter,
        toChapterKey: nextQuestion.chapter,
      });
    });

    it("routes the user to avatar-gender after answering the final question", () => {
      const lastIdx = IMMERSIVE_QUESTIONS.length - 1;
      const s = stateWith({ phase: "playing", currentQuestionIndex: lastIdx });
      const next = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[lastIdx].id,
        score: 5,
      });

      expect(next.phase).toBe("avatar-gender");
      expect(next.answers[IMMERSIVE_QUESTIONS[lastIdx].id]).toBe(5);
    });

    it("preserves previous answers when adding new one", () => {
      const s = stateWith({
        phase: "playing",
        currentQuestionIndex: 1,
        answers: { [IMMERSIVE_QUESTIONS[0].id]: 3 },
      });
      const next = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[1].id,
        score: 5,
      });

      expect(next.answers[IMMERSIVE_QUESTIONS[0].id]).toBe(3);
      expect(next.answers[IMMERSIVE_QUESTIONS[1].id]).toBe(5);
    });

    it("does not mutate original state", () => {
      const original = stateWith({ phase: "playing" });
      const originalAnswers = original.answers;

      immersiveReducer(original, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[0].id,
        score: 3,
      });

      expect(original.answers).toBe(originalAnswers);
      expect(original.answers).toEqual({});
    });
  });

  describe("COMPLETE_CHAPTER_TRANSITION", () => {
    it("advances question, clears pending, returns to playing", () => {
      const s = stateWith({
        phase: "chapter-transition",
        currentQuestionIndex: FIRST_CHAPTER_BOUNDARY,
        pendingChapterTransition: {
          fromChapterKey: IMMERSIVE_QUESTIONS[FIRST_CHAPTER_BOUNDARY].chapter,
          toChapterKey: IMMERSIVE_QUESTIONS[FIRST_CHAPTER_BOUNDARY + 1].chapter,
        },
      });
      const next = immersiveReducer(s, { type: "COMPLETE_CHAPTER_TRANSITION" });

      expect(next.phase).toBe("playing");
      expect(next.currentQuestionIndex).toBe(FIRST_CHAPTER_BOUNDARY + 1);
      expect(next.pendingChapterTransition).toBeNull();
    });

    it("does not advance past last question (safety guard)", () => {
      const s = stateWith({
        phase: "chapter-transition",
        currentQuestionIndex: IMMERSIVE_QUESTIONS.length - 1,
        pendingChapterTransition: {
          fromChapterKey: "archive",
          toChapterKey: "values",
        },
      });
      const next = immersiveReducer(s, { type: "COMPLETE_CHAPTER_TRANSITION" });
      expect(next.currentQuestionIndex).toBe(IMMERSIVE_QUESTIONS.length - 1);
    });
  });

  describe("GO_TO_PREVIOUS_QUESTION", () => {
    it("returns to the previous question and clears its previous answer", () => {
      const q1 = IMMERSIVE_QUESTIONS[0].id;
      const q2 = IMMERSIVE_QUESTIONS[1].id;
      const s = stateWith({
        phase: "playing",
        currentQuestionIndex: 2,
        answers: { [q1]: 3, [q2]: 4 },
      });
      const next = immersiveReducer(s, { type: "GO_TO_PREVIOUS_QUESTION" });

      expect(next.phase).toBe("playing");
      expect(next.currentQuestionIndex).toBe(1);
      expect(next.answers[q1]).toBe(3);
      expect(next.answers[q2]).toBeUndefined();
      expect(next.pendingChapterTransition).toBeNull();
    });

    it("does nothing on the first question", () => {
      const s = stateWith({ phase: "playing", currentQuestionIndex: 0 });
      const next = immersiveReducer(s, { type: "GO_TO_PREVIOUS_QUESTION" });
      expect(next).toBe(s);
    });

    it("returns from avatar picker to the final question for revision", () => {
      const lastIdx = IMMERSIVE_QUESTIONS.length - 1;
      const lastId = IMMERSIVE_QUESTIONS[lastIdx].id;
      const answers: Record<number, number> = {};
      for (const q of IMMERSIVE_QUESTIONS) answers[q.id] = 3;

      const s = stateWith({
        phase: "avatar-gender",
        currentQuestionIndex: lastIdx,
        answers,
        avatarGender: "female",
        genStep: 4,
      });
      const next = immersiveReducer(s, { type: "GO_TO_PREVIOUS_QUESTION" });

      expect(next.phase).toBe("playing");
      expect(next.currentQuestionIndex).toBe(lastIdx);
      expect(next.answers[lastId]).toBeUndefined();
      expect(next.avatarGender).toBeNull();
      expect(next.genStep).toBe(0);
    });
  });

  describe("SUBMIT_AVATAR_GENDER", () => {
    it("stores selected avatar gender, transitions to generating, resets genStep", () => {
      const s = stateWith({ phase: "avatar-gender", genStep: 3 });
      const next = immersiveReducer(s, {
        type: "SUBMIT_AVATAR_GENDER",
        avatarGender: "female",
      });

      expect(next.avatarGender).toBe("female");
      expect(next.phase).toBe("generating");
      expect(next.genStep).toBe(0);
    });

    it("accepts null when user skips avatar gender", () => {
      const s = stateWith({ phase: "avatar-gender" });
      const next = immersiveReducer(s, {
        type: "SUBMIT_AVATAR_GENDER",
        avatarGender: null,
      });

      expect(next.avatarGender).toBeNull();
      expect(next.phase).toBe("generating");
      expect(next.genStep).toBe(0);
    });
  });

  describe("GEN_STEP", () => {
    it("updates generation step", () => {
      const s = stateWith({ phase: "generating", genStep: 0 });
      let next = immersiveReducer(s, { type: "GEN_STEP", step: 1 });
      expect(next.genStep).toBe(1);

      next = immersiveReducer(next, { type: "GEN_STEP", step: 5 });
      expect(next.genStep).toBe(5);
    });
  });

  describe("SET_RESULT", () => {
    it("sets result, phase to revelation, and savedReportId", () => {
      const s = stateWith({ phase: "generating", genStep: 5 });
      const next = immersiveReducer(s, {
        type: "SET_RESULT",
        result: MOCK_RESULT,
        savedReportId: "report-abc-123",
      });

      expect(next.phase).toBe("revelation");
      expect(next.result).toBe(MOCK_RESULT);
      expect(next.savedReportId).toBe("report-abc-123");
    });

    it("handles null savedReportId", () => {
      const s = stateWith({ phase: "generating" });
      const next = immersiveReducer(s, {
        type: "SET_RESULT",
        result: MOCK_RESULT,
        savedReportId: null,
      });

      expect(next.phase).toBe("revelation");
      expect(next.result).toBe(MOCK_RESULT);
      expect(next.savedReportId).toBeNull();
    });
  });

  describe("COMPLETE_REVELATION", () => {
    it("transitions from revelation to result", () => {
      const s = stateWith({ phase: "revelation", result: MOCK_RESULT });
      const next = immersiveReducer(s, { type: "COMPLETE_REVELATION" });
      expect(next.phase).toBe("result");
    });
  });

  describe("RESET", () => {
    it("resets state and skips intro (redive starts at characters)", () => {
      const s = stateWith({
        phase: "result",
        currentQuestionIndex: 29,
        answers: { 1: 3, 2: 5, 3: 4 },
        result: MOCK_RESULT,
        genStep: 5,
        savedReportId: "report-123",
        pendingChapterTransition: {
          fromChapterKey: "mechanical",
          toChapterKey: "laboratory",
        },
      });
      const next = immersiveReducer(s, { type: "RESET" });

      expect(next).toEqual({ ...INITIAL_STATE, phase: "characters" });
      expect(next.currentQuestionIndex).toBe(0);
      expect(next.answers).toEqual({});
      expect(next.result).toBeNull();
    });
  });

  describe("full questionnaire flow (auto-advance)", () => {
    it("walks through chapter 1 with auto-advance, then crosses to chapter 2", () => {
      let s = stateWith({ phase: "playing", currentQuestionIndex: 0 });

      // Q1-Q4 within chapter 1 (auto-advance, same chapter)
      for (let i = 0; i < 4; i++) {
        s = immersiveReducer(s, {
          type: "RECORD_ANSWER",
          questionId: IMMERSIVE_QUESTIONS[i].id,
          score: (i % 5) + 1,
        });
        expect(s.currentQuestionIndex).toBe(i + 1);
        expect(s.phase).toBe("playing");
      }

      // Q5 (last in chapter 1) — RECORD_ANSWER puts us into chapter-transition
      s = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[4].id,
        score: 3,
      });
      expect(s.phase).toBe("chapter-transition");
      expect(s.currentQuestionIndex).toBe(4); // unchanged until completion
      expect(s.pendingChapterTransition?.fromChapterKey).toBe("mechanical");
      expect(s.pendingChapterTransition?.toChapterKey).toBe("laboratory");

      s = immersiveReducer(s, { type: "COMPLETE_CHAPTER_TRANSITION" });
      expect(s.phase).toBe("playing");
      expect(s.currentQuestionIndex).toBe(5); // first Q of chapter 2
    });

    it("answering the final question routes to avatar-gender → generating → revelation", () => {
      const total = IMMERSIVE_QUESTIONS.length;
      const lastIdx = total - 1;
      const answers: Record<number, number> = {};
      for (let i = 0; i < lastIdx; i++) {
        answers[IMMERSIVE_QUESTIONS[i].id] = 3;
      }

      let s = stateWith({
        phase: "playing",
        currentQuestionIndex: lastIdx,
        answers,
      });

      s = immersiveReducer(s, {
        type: "RECORD_ANSWER",
        questionId: IMMERSIVE_QUESTIONS[lastIdx].id,
        score: 5,
      });
      expect(s.phase).toBe("avatar-gender");

      s = immersiveReducer(s, {
        type: "SUBMIT_AVATAR_GENDER",
        avatarGender: "female",
      });
      expect(s.phase).toBe("generating");
      expect(s.avatarGender).toBe("female");
      expect(s.genStep).toBe(0);

      for (let step = 1; step <= 5; step++) {
        s = immersiveReducer(s, { type: "GEN_STEP", step });
      }
      expect(s.genStep).toBe(5);

      s = immersiveReducer(s, {
        type: "SET_RESULT",
        result: MOCK_RESULT,
        savedReportId: "final-report",
      });
      expect(s.phase).toBe("revelation");
      expect(s.result).toBe(MOCK_RESULT);
      expect(s.answers[IMMERSIVE_QUESTIONS[lastIdx].id]).toBe(5);
      expect(s.avatarGender).toBe("female");
    });

    it("RESTORE_SESSION with all answers routes to avatar picker, not generating", () => {
      const total = IMMERSIVE_QUESTIONS.length;
      const answers: Record<number, number> = {};
      for (const q of IMMERSIVE_QUESTIONS) answers[q.id] = 3;

      const next = immersiveReducer(INITIAL_STATE, {
        type: "RESTORE_SESSION",
        phase: "playing",
        currentQuestionIndex: 0,
        answers,
      });

      expect(next.phase).toBe("avatar-gender");
      expect(next.currentQuestionIndex).toBe(total - 1);
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged for unknown action type", () => {
      const s = INITIAL_STATE;
      // @ts-expect-error — testing unknown action
      const next = immersiveReducer(s, { type: "NONEXISTENT" });
      expect(next).toBe(s);
    });
  });
});
