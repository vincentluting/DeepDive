// ============================================================
// Immersive Engine — Pure Reducer
// ============================================================
// All state transitions are explicit and synchronous.
// No side effects, no async calls, no timer logic.
//
// RECORD_ANSWER auto-advances: there is no separate "dismiss mirror"
// step — mirror feedback is rendered as a non-blocking toast by the
// host shell, while state moves straight to the next question
// (or chapter transition, or avatar-gender if this was the last item).
// ============================================================

import { IMMERSIVE_QUESTIONS } from "../data";
import {
  INITIAL_STATE,
  type ImmersiveState,
  type ImmersiveAction,
} from "./types";

const TOTAL_QUESTIONS = IMMERSIVE_QUESTIONS.length; // 38 (30 RIASEC + 8 TwIVI)

export function immersiveReducer(
  state: ImmersiveState,
  action: ImmersiveAction,
): ImmersiveState {
  switch (action.type) {
    // ── Phase override (intro sequence + characters) ───────────
    case "SET_PHASE":
      return { ...state, phase: action.phase };

    // ── Answer recording + auto-advance ────────────────────────
    case "RECORD_ANSWER": {
      const nextAnswers = {
        ...state.answers,
        [action.questionId]: action.score,
      };
      const currentIdx = state.currentQuestionIndex;
      const nextIdx = currentIdx + 1;

      // Last question → avatar-gender picker (formerly BEGIN_GENERATION)
      if (nextIdx >= TOTAL_QUESTIONS) {
        return {
          ...state,
          answers: nextAnswers,
          phase: "avatar-gender",
        };
      }

      const currentQ = IMMERSIVE_QUESTIONS[currentIdx];
      const nextQ = IMMERSIVE_QUESTIONS[nextIdx];

      // Chapter boundary → start chapter transition (index advances on complete)
      if (nextQ.chapter !== currentQ.chapter) {
        return {
          ...state,
          answers: nextAnswers,
          phase: "chapter-transition",
          pendingChapterTransition: {
            fromChapterKey: currentQ.chapter,
            toChapterKey: nextQ.chapter,
          },
        };
      }

      // Same chapter → advance immediately
      return {
        ...state,
        answers: nextAnswers,
        currentQuestionIndex: nextIdx,
      };
    }

    case "COMPLETE_CHAPTER_TRANSITION": {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex >= TOTAL_QUESTIONS) return state; // safety guard
      return {
        ...state,
        phase: "playing",
        currentQuestionIndex: nextIndex,
        pendingChapterTransition: null,
      };
    }

    case "GO_TO_PREVIOUS_QUESTION": {
      const canReturnFromGender = state.phase === "avatar-gender";
      const canReturnFromQuestion =
        state.phase === "playing" && state.currentQuestionIndex > 0;
      if (!canReturnFromGender && !canReturnFromQuestion) return state;

      const targetIndex = canReturnFromGender
        ? TOTAL_QUESTIONS - 1
        : state.currentQuestionIndex - 1;
      const targetQuestion = IMMERSIVE_QUESTIONS[targetIndex];
      if (!targetQuestion) return state;

      const nextAnswers = { ...state.answers };
      delete nextAnswers[targetQuestion.id];

      return {
        ...state,
        phase: "playing",
        currentQuestionIndex: targetIndex,
        answers: nextAnswers,
        pendingChapterTransition: null,
        genStep: 0,
        avatarGender: canReturnFromGender ? null : state.avatarGender,
      };
    }

    case "SUBMIT_AVATAR_GENDER":
      return {
        ...state,
        avatarGender: action.avatarGender,
        phase: "generating",
        genStep: 0,
      };

    case "GEN_STEP":
      return { ...state, genStep: action.step };

    // ── Result → Revelation (mirror moment) ────────────────────
    case "SET_RESULT":
      return {
        ...state,
        phase: "revelation",
        result: action.result,
        savedReportId: action.savedReportId,
      };

    // ── Revelation complete → Result page ────────────────────
    case "COMPLETE_REVELATION":
      return { ...state, phase: "result" };

    // ── Restore saved session from localStorage ────────────────
    // Skip past already-answered questions to prevent stuck state
    // (user answered but closed browser before advancing)
    case "RESTORE_SESSION": {
      let idx = action.currentQuestionIndex;
      while (
        idx < TOTAL_QUESTIONS &&
        action.answers[IMMERSIVE_QUESTIONS[idx].id] !== undefined
      ) {
        idx++;
      }
      if (idx >= TOTAL_QUESTIONS) {
        // All questions answered on a previous session — route through the
        // avatar picker so the user can choose / confirm avatar gender before save.
        return {
          ...state,
          phase: "avatar-gender",
          currentQuestionIndex: TOTAL_QUESTIONS - 1,
          answers: action.answers,
        };
      }
      return {
        ...state,
        phase: action.phase,
        currentQuestionIndex: idx,
        answers: action.answers,
      };
    }

    // ── Reset (redive) ─────────────────────────────────────────
    // User already completed once → skip intro, start at characters
    case "RESET":
      return { ...INITIAL_STATE, phase: "characters" };

    default:
      return state;
  }
}
