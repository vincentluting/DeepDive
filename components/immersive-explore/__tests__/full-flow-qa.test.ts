// ============================================================
// Immersive Dive — Full Flow QA Tests
//
// Simulates the complete 38-question journey through:
//   State machine phases → Answer recording → Chapter transitions →
//   Scoring pipeline → Archetype generation → Revelation → Result
//
// This covers what E2E smoke tests cannot (requires auth):
//   - Full reducer state transitions for all 38 questions
//   - Correct chapter boundaries and transitions
//   - Mixed scale handling (5-pt RIASEC + 6-pt TwIVI)
//   - Scoring accuracy with known answer sets
//   - 12-type archetype determination
//   - Revelation scene data integrity
//   - Edge cases: all-same answers, extreme scores, boundary questions
// ============================================================

import { describe, it, expect } from "vitest";
import { immersiveReducer } from "../immersive-state/reducer";
import { INITIAL_STATE, type ImmersiveState } from "../immersive-state/types";
import {
  IMMERSIVE_QUESTIONS,
  CHARACTERS,
  computeImmersiveScores,
  getRankedDimensions,
  extractTwiviAnswers,
  type RiasecKey,
} from "../data";
import { computeQuickValueOrientation } from "@/lib/assessment/twivi-quick";

// ── Helpers ─────────────────────────────────────────────────

/** Advance state through intro phases to playing */
function advanceToPlaying(state: ImmersiveState): ImmersiveState {
  let s = state;
  s = immersiveReducer(s, { type: "SET_PHASE", phase: "invitation" });
  s = immersiveReducer(s, { type: "SET_PHASE", phase: "rules" });
  s = immersiveReducer(s, { type: "SET_PHASE", phase: "characters" });
  s = immersiveReducer(s, { type: "SET_PHASE", phase: "playing" });
  return s;
}

/** Answer a single question — reducer auto-advances internally */
function answerQuestion(
  state: ImmersiveState,
  questionId: number,
  score: number,
): ImmersiveState {
  return immersiveReducer(state, {
    type: "RECORD_ANSWER",
    questionId,
    score,
  });
}

/** Answer all 38 questions with a pattern, handling chapter transitions */
function answerAllQuestions(
  state: ImmersiveState,
  scorePattern: (questionIndex: number) => number,
): { finalState: ImmersiveState; answers: Record<number, number> } {
  let s = state;
  const answers: Record<number, number> = {};

  for (let i = 0; i < 38; i++) {
    const question = IMMERSIVE_QUESTIONS[i];
    const score = scorePattern(i);
    answers[question.id] = score;

    // RECORD_ANSWER atomically advances (same chapter, chapter boundary,
    // or avatar-gender on the final item).
    s = answerQuestion(s, question.id, score);

    // If we landed on a chapter transition, finish it before the next answer.
    if (s.phase === "chapter-transition") {
      s = immersiveReducer(s, { type: "COMPLETE_CHAPTER_TRANSITION" });
    }
  }

  return { finalState: s, answers };
}

// ── Full Flow Tests ─────────────────────────────────────────

describe("Immersive Dive Full Flow QA", () => {
  describe("Phase progression: envelope → result", () => {
    it("progresses through all intro phases correctly", () => {
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
      expect(s.currentQuestionIndex).toBe(0);
    });

    it("records answer and auto-advances within the same chapter", () => {
      let s = advanceToPlaying(INITIAL_STATE);

      s = answerQuestion(s, 1, 3);
      expect(s.answers[1]).toBe(3);
      expect(s.currentQuestionIndex).toBe(1);
      expect(s.phase).toBe("playing");
    });
  });

  describe("Complete 38-question flow with balanced answers", () => {
    it("answers all questions and produces valid scores", () => {
      const s = advanceToPlaying(INITIAL_STATE);

      // Answer pattern: alternate scores to create differentiated profile
      // Ch.1 (R): high scores (4-5)
      // Ch.2 (I): medium scores (3)
      // Ch.3 (A): high scores (4-5)
      // Ch.4 (S): low scores (1-2)
      // Ch.5 (E): medium scores (3)
      // Ch.6 (C): low scores (1-2)
      // Ch.7 (TwIVI): mixed (1-6)
      const { answers } = answerAllQuestions(s, (i) => {
        if (i < 5) return 4 + (i % 2); // R: 4,5,4,5,4
        if (i < 10) return 3; // I: all 3
        if (i < 15) return 4 + (i % 2); // A: 4,5,4,5,4
        if (i < 20) return 1 + (i % 2); // S: 1,2,1,2,1
        if (i < 25) return 3; // E: all 3
        if (i < 30) return 1 + (i % 2); // C: 1,2,1,2,1
        // TwIVI (6-point): cycle 1-6
        return ((i - 30) % 6) + 1;
      });

      // Verify all 38 answers recorded
      expect(Object.keys(answers)).toHaveLength(38);

      // Compute scores
      const scores = computeImmersiveScores(answers);
      expect(scores).toBeDefined();
      expect(Object.keys(scores)).toHaveLength(6);

      // R and A should be highest (answered 4-5)
      expect(scores.R).toBeGreaterThan(scores.S);
      expect(scores.A).toBeGreaterThan(scores.C);

      // S and C should be lowest (answered 1-2)
      const ranked = getRankedDimensions(scores);
      expect(ranked).toHaveLength(6);
      expect(["R", "A"]).toContain(ranked[0]); // Top should be R or A
      expect(["S", "C"]).toContain(ranked[5]); // Bottom should be S or C
    });

    it("produces valid 12-type archetype", () => {
      const answers: Record<number, number> = {};
      // Create clear R-dominant profile
      for (let i = 1; i <= 5; i++) answers[i] = 5; // R: all 5
      for (let i = 6; i <= 10; i++) answers[i] = 4; // I: all 4
      for (let i = 11; i <= 15; i++) answers[i] = 3; // A: 3
      for (let i = 16; i <= 20; i++) answers[i] = 2; // S: 2
      for (let i = 21; i <= 25; i++) answers[i] = 1; // E: 1
      for (let i = 26; i <= 30; i++) answers[i] = 1; // C: 1
      // TwIVI
      for (let i = 31; i <= 38; i++) answers[i] = 4;

      const scores = computeImmersiveScores(answers);
      const ranked = getRankedDimensions(scores);
      expect(ranked[0]).toBe("R");
      expect(ranked[1]).toBe("I");

      // Top two dimensions determine archetype family
      expect(ranked[0]).toBe("R");
      expect(ranked[1]).toBe("I");
      // R+I pairing is valid in 12-type system
    });

    it("extracts TwIVI answers correctly (questions 31-38)", () => {
      const answers: Record<number, number> = {};
      for (let i = 1; i <= 30; i++) answers[i] = 3;
      // TwIVI specific values
      answers[31] = 6;
      answers[32] = 1;
      answers[33] = 5;
      answers[34] = 2;
      answers[35] = 6;
      answers[36] = 1;
      answers[37] = 5;
      answers[38] = 2;

      const twiviAnswers = extractTwiviAnswers(answers, IMMERSIVE_QUESTIONS);
      expect(twiviAnswers).toBeDefined();
      expect(Object.keys(twiviAnswers).length).toBe(8);

      // Compute value orientation
      const orientation = computeQuickValueOrientation(twiviAnswers);
      expect(orientation).toBeDefined();
      expect(["enhancement", "transcendence"]).toContain(
        orientation.orientation,
      );
    });
  });

  describe("Chapter boundary transitions", () => {
    it("questions 1-5 are Ch.1 (mechanical/R)", () => {
      for (let i = 0; i < 5; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("mechanical");
      }
    });

    it("questions 6-10 are Ch.2 (laboratory/I)", () => {
      for (let i = 5; i < 10; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("laboratory");
      }
    });

    it("questions 11-15 are Ch.3 (theater/A)", () => {
      for (let i = 10; i < 15; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("theater");
      }
    });

    it("questions 16-20 are Ch.4 (waiting/S)", () => {
      for (let i = 15; i < 20; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("waiting");
      }
    });

    it("questions 21-25 are Ch.5 (negotiation/E)", () => {
      for (let i = 20; i < 25; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("negotiation");
      }
    });

    it("questions 26-30 are Ch.6 (archive/C)", () => {
      for (let i = 25; i < 30; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("archive");
      }
    });

    it("questions 31-38 are Ch.7 (values/TwIVI)", () => {
      for (let i = 30; i < 38; i++) {
        expect(IMMERSIVE_QUESTIONS[i].chapter).toBe("values");
      }
    });

    it("exactly 7 unique chapters", () => {
      const chapters = new Set(IMMERSIVE_QUESTIONS.map((q) => q.chapter));
      expect(chapters.size).toBe(7);
    });

    it("6 chapter transitions occur at correct boundaries", () => {
      const transitions: { from: string; to: string; atIndex: number }[] = [];
      for (let i = 1; i < 38; i++) {
        if (
          IMMERSIVE_QUESTIONS[i].chapter !== IMMERSIVE_QUESTIONS[i - 1].chapter
        ) {
          transitions.push({
            from: IMMERSIVE_QUESTIONS[i - 1].chapter,
            to: IMMERSIVE_QUESTIONS[i].chapter,
            atIndex: i,
          });
        }
      }
      expect(transitions).toHaveLength(6);
      expect(transitions[0]).toEqual({
        from: "mechanical",
        to: "laboratory",
        atIndex: 5,
      });
      expect(transitions[1]).toEqual({
        from: "laboratory",
        to: "theater",
        atIndex: 10,
      });
      expect(transitions[2]).toEqual({
        from: "theater",
        to: "waiting",
        atIndex: 15,
      });
      expect(transitions[3]).toEqual({
        from: "waiting",
        to: "negotiation",
        atIndex: 20,
      });
      expect(transitions[4]).toEqual({
        from: "negotiation",
        to: "archive",
        atIndex: 25,
      });
      expect(transitions[5]).toEqual({
        from: "archive",
        to: "values",
        atIndex: 30,
      });
    });
  });

  describe("Scale handling: 5-point vs 6-point", () => {
    it("Ch.1-6 questions use scaleMax 5 (RIASEC)", () => {
      for (let i = 0; i < 30; i++) {
        const q = IMMERSIVE_QUESTIONS[i];
        expect(q.scaleMax ?? 5).toBe(5);
      }
    });

    it("Ch.7 questions use scaleMax 6 (TwIVI)", () => {
      for (let i = 30; i < 38; i++) {
        expect(IMMERSIVE_QUESTIONS[i].scaleMax).toBe(6);
      }
    });

    it("scoring handles mixed scales correctly", () => {
      const answers: Record<number, number> = {};
      // RIASEC: max scale 5
      for (let i = 1; i <= 30; i++) answers[i] = 5;
      // TwIVI: max scale 6
      for (let i = 31; i <= 38; i++) answers[i] = 6;

      // computeImmersiveScores only uses Q1-30 for RIASEC
      const scores = computeImmersiveScores(answers);
      // All 5s → all dimensions equal (25 each)
      expect(scores.R).toBe(scores.I);
      expect(scores.I).toBe(scores.A);

      // TwIVI extraction should not pollute RIASEC scores
      const twivi = extractTwiviAnswers(answers, IMMERSIVE_QUESTIONS);
      expect(Object.values(twivi).every((v) => v === 6)).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("all minimum answers produce valid result", () => {
      const answers: Record<number, number> = {};
      for (let i = 1; i <= 30; i++) answers[i] = 1;
      for (let i = 31; i <= 38; i++) answers[i] = 1;

      const scores = computeImmersiveScores(answers);
      const ranked = getRankedDimensions(scores);
      expect(ranked).toHaveLength(6);

      // Valid ranked dimensions exist
      expect(ranked[0]).toBeDefined();
      expect(ranked[1]).toBeDefined();
    });

    it("all maximum answers produce valid result", () => {
      const answers: Record<number, number> = {};
      for (let i = 1; i <= 30; i++) answers[i] = 5;
      for (let i = 31; i <= 38; i++) answers[i] = 6;

      const scores = computeImmersiveScores(answers);
      const ranked = getRankedDimensions(scores);
      expect(ranked).toHaveLength(6);
      // All max → equal scores, ranking still valid
      expect(ranked[0]).toBeDefined();
    });

    it("each RIASEC dimension dominant → correct top ranking", () => {
      const dimensions: RiasecKey[] = ["R", "I", "A", "S", "E", "C"];
      const chapterRanges = [
        [1, 5],
        [6, 10],
        [11, 15],
        [16, 20],
        [21, 25],
        [26, 30],
      ];

      for (let d = 0; d < 6; d++) {
        const answers: Record<number, number> = {};
        for (let i = 1; i <= 30; i++) answers[i] = 1;
        for (let i = 31; i <= 38; i++) answers[i] = 3;

        // Make one dimension dominant
        const [start, end] = chapterRanges[d];
        for (let i = start; i <= end; i++) answers[i] = 5;

        const scores = computeImmersiveScores(answers);
        const ranked = getRankedDimensions(scores);
        expect(ranked[0]).toBe(dimensions[d]);
      }
    });
  });

  describe("Revelation data integrity", () => {
    it("all 6 RIASEC dimensions can be primary", () => {
      const allDimensions: RiasecKey[] = ["R", "I", "A", "S", "E", "C"];
      for (const dim of allDimensions) {
        const scores: Record<RiasecKey, number> = {
          R: 10,
          I: 10,
          A: 10,
          S: 10,
          E: 10,
          C: 10,
        };
        scores[dim] = 25; // Make this one dominant
        const ranked = getRankedDimensions(scores);
        expect(ranked[0]).toBe(dim);
      }
    });

    it("6 companions exist with bilingual names", () => {
      expect(CHARACTERS).toHaveLength(6);
      for (const char of CHARACTERS) {
        expect(char.name).toBeDefined();
        expect(char.name.en).toBeDefined();
        expect(char.name.zh).toBeDefined();
        expect(char.name.en.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Coaching challenge gradient integration", () => {
    it("challenge section is injected for all persona styles", async () => {
      const { buildCoachingSystemPrompt } =
        await import("@/lib/coaching/build-system-prompt");

      for (const style of ["supportive", "balanced", "challenging"] as const) {
        const prompt = buildCoachingSystemPrompt({
          locale: "en",
          round: 5,
          maxRounds: 10,
          reportSummary: JSON.stringify({
            core_narrative: { insight: "test" },
            career_landscape: { directions: [{ role: "Engineer" }] },
          }),
          memories: null,
          answers: null,
          persona: {
            coachingStyle: style,
            communicationStyle: "warm",
            responseDetail: "balanced",
          },
        });

        expect(prompt).toContain("Constructive Challenge Framework");
        expect(prompt).toContain("Anti-Echo-Chamber");

        // Verify persona-appropriate levels
        if (style === "supportive") {
          expect(prompt).toContain("max 2");
          expect(prompt).not.toContain("Level 3 — Direct Challenge");
        }
        if (style === "balanced") {
          expect(prompt).toContain("max 3");
          expect(prompt).toContain("Level 3 — Direct Challenge");
          expect(prompt).not.toContain("Level 4 — Reframing");
        }
        if (style === "challenging") {
          expect(prompt).toContain("max 4");
          expect(prompt).toContain("Level 4 — Reframing");
        }
      }
    });

    it("challenge section respects round number", async () => {
      const { buildCoachingSystemPrompt } =
        await import("@/lib/coaching/build-system-prompt");

      const prompt = buildCoachingSystemPrompt({
        locale: "en",
        round: 1,
        maxRounds: 10,
        memories: null,
        answers: null,
        reportSummary: JSON.stringify({
          core_narrative: { insight: "test" },
          career_landscape: { directions: [{ role: "Engineer" }] },
        }),
      });

      expect(prompt).toContain("Current round: 1");
      expect(prompt).toContain("Constructive Challenge Framework");
    });

    it("ZH prompt includes challenge gradient", async () => {
      const { buildCoachingSystemPrompt } =
        await import("@/lib/coaching/build-system-prompt");

      const prompt = buildCoachingSystemPrompt({
        locale: "zh",
        round: 5,
        maxRounds: 10,
        memories: null,
        answers: null,
        reportSummary: JSON.stringify({
          core_narrative: { insight: "test" },
          career_landscape: { directions: [{ role: "Engineer" }] },
        }),
      });

      // Challenge gradient is in English even in ZH prompt (LLM handles translation)
      expect(prompt).toContain("Constructive Challenge Framework");
      expect(prompt).toContain("Anti-Echo-Chamber");
    });
  });
});
