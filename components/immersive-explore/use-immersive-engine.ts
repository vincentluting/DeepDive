"use client";

// ============================================================
// Immersive Explore Engine v2.0
// ============================================================
// State-machine based questionnaire engine using useReducer.
// All timer logic delegated to useImmersiveTimers.
// External API is 100% backward-compatible with v1.0.
// ============================================================

import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useEffect,
  useState,
} from "react";
import { hapticSuccess } from "@/lib/haptic";
import type { Locale } from "@/lib/i18n/config";
import {
  IMMERSIVE_QUESTIONS,
  GENERATING_STEPS,
  computeImmersiveScores,
  getRankedDimensions,
  extractTwiviAnswers,
  DIMENSION_IMMERSIVE,
  CHARACTERS,
  CHAPTERS,
  pickText,
  pickMirrorText,
  type RiasecKey,
} from "./data";
import { computeQuickValueOrientation } from "@/lib/assessment/twivi-quick";
import { getClientId } from "@/lib/auth/client-id";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { buildArchetype } from "@/lib/scoring/riasec-utils";
import type { RIASECDimension } from "@/lib/types";
import { findLabel } from "@/components/quickdive/quickdive-data";
import {
  immersiveReducer,
  useImmersiveTimers,
  INITIAL_STATE,
  getInitialPhase,
  markIntroSeen,
} from "./immersive-state";

// Re-export types so existing imports from this file keep working
export type { ImmersivePhase, ImmersiveResult } from "./immersive-state";
import type { ImmersivePhase, ImmersiveResult } from "./immersive-state";
import type { AvatarGender } from "@/components/quickdive/archetype-avatar-asset";

export function useImmersiveEngine(locale: Locale) {
  // ── Core state machine ─────────────────────────────────────
  // Lazy initializer: first visit → "envelope", same-session return → "rules"
  const [state, dispatch] = useReducer(immersiveReducer, undefined, () => ({
    ...INITIAL_STATE,
    phase: getInitialPhase(),
  }));

  // ── Timing refs (not in reducer — non-serializable) ────────
  const sessionStartTime = useRef<number>(0);
  const questionShownAt = useRef<number>(0);
  const questionTimings = useRef<
    Array<{
      questionIndex: number;
      durationMs: number;
    }>
  >([]);

  const savePromiseRef = useRef<Promise<string | null>>(Promise.resolve(null));
  // Granular tracking refs
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const milestonesReported = useRef<Set<number>>(new Set());

  // ── Derived values ─────────────────────────────────────────
  const totalQuestions = IMMERSIVE_QUESTIONS.length; // 30
  const currentQuestion = IMMERSIVE_QUESTIONS[state.currentQuestionIndex];
  const genSteps = useMemo(
    () => GENERATING_STEPS.map((s) => pickText(s, locale)),
    [locale],
  );

  // ── Timer orchestration ────────────────────────────────────
  useImmersiveTimers(state, dispatch);

  // ── localStorage persistence ────────────────────────────────
  const IMM_PROGRESS_KEY = "deep-dive-immersive-progress";

  // Restore in-progress session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(IMM_PROGRESS_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        answers: Record<number, number>;
        currentQuestionIndex: number;
        timestamp: string;
      };
      if (
        data.currentQuestionIndex > 0 &&
        data.currentQuestionIndex < totalQuestions
      ) {
        dispatch({
          type: "RESTORE_SESSION",
          phase: "playing",
          currentQuestionIndex: data.currentQuestionIndex,
          answers: data.answers,
        });
        markIntroSeen();
      }
    } catch {
      /* ignore corrupt data */
    }
    // Effect intentionally runs once on mount
  }, []);

  // Save progress after each answer. Includes avatar-gender so the final
  // question's answer is persisted before the user reaches the seal ceremony
  // — otherwise a refresh between Q38 and avatar-pick would replay Q38.
  useEffect(() => {
    if (
      state.phase !== "playing" &&
      state.phase !== "chapter-transition" &&
      state.phase !== "avatar-gender"
    )
      return;
    const answered = Object.keys(state.answers).length;
    if (answered === 0) return;
    try {
      localStorage.setItem(
        IMM_PROGRESS_KEY,
        JSON.stringify({
          answers: state.answers,
          currentQuestionIndex: state.currentQuestionIndex,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch {
      /* non-critical */
    }
  }, [state.answers, state.currentQuestionIndex, state.phase]);

  // Clear progress on completion or reset
  useEffect(() => {
    if (state.phase === "result" || state.phase === "envelope") {
      try {
        localStorage.removeItem(IMM_PROGRESS_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [state.phase]);

  // ── Analytics context (once on mount) ──────────────────────
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  // ── Session start time (when first entering playing phase) ─
  useEffect(() => {
    if (state.phase === "playing" && sessionStartTime.current === 0) {
      sessionStartTime.current = Date.now();
      questionShownAt.current = Date.now();
      markIntroSeen(); // Same-session returns will skip to "rules" phase
    }
  }, [state.phase]);

  // ── Question shown time (when question index advances) ─────
  useEffect(() => {
    if (state.phase === "playing") {
      questionShownAt.current = Date.now();
    }
  }, [state.currentQuestionIndex, state.phase]);

  // ── Track analytics events ─────────────────────────────────
  const trackEvent = useCallback(
    (event: string, metadata?: Record<string, unknown>) => {
      try {
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, clientId: getClientId(), metadata }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* non-critical */
      }
    },
    [],
  );

  // ── Mirror toast (non-blocking reflection; sticks until next answer or dismiss) ──
  const [mirrorToast, setMirrorToast] = useState<{
    id: number;
    text: string;
    accentColor: string;
  } | null>(null);

  // Guard against double-submitting the SAME question during AnimatePresence
  // exit animation (legitimate fast answers on the *next* question must still
  // go through — only the same questionId is locked).
  const lastSubmittedQuestionIdRef = useRef<number | null>(null);

  // Clear the lock whenever we land on a different question (incl. after
  // GO_TO_PREVIOUS_QUESTION), so the user can re-answer a question they backed
  // into.
  useEffect(() => {
    lastSubmittedQuestionIdRef.current = null;
  }, [state.currentQuestionIndex]);

  // ── Answer recording — atomically advance + queue toast ─────
  const recordAnswer = useCallback(
    (questionId: number, score: number) => {
      if (lastSubmittedQuestionIdRef.current === questionId) return;
      lastSubmittedQuestionIdRef.current = questionId;
      const now = Date.now();

      // Mark Quick Dive as active so login/register knows to wait for save
      try {
        sessionStorage.setItem("quickdive-active", "1");
      } catch {
        /* ignore */
      }
      // Per-item timing (ref-based, outside reducer)
      const durationMs = now - questionShownAt.current;
      questionTimings.current.push({
        questionIndex: state.currentQuestionIndex,
        durationMs,
      });

      // Granular tracking: question_answered
      sendAnalyticsSafely("/api/analytics/event", {
        event: "question_answered",
        clientId: getClientId(),
        metadata: {
          questionIndex: state.currentQuestionIndex,
          timeOnQuestionMs: durationMs,
          moduleId: currentQuestion?.riasec
            ? `IMM-CH${currentQuestion.chapter}`
            : "IMM-VALUES",
          questionId: String(questionId),
          exploreMode: "immersive" as const,
          sessionId: sessionIdRef.current,
        },
      });

      // Granular tracking: progress_milestone
      const newProgress =
        ((state.currentQuestionIndex + 1) / totalQuestions) * 100;
      const milestones = [25, 50, 75] as const;
      for (const m of milestones) {
        if (!milestonesReported.current.has(m) && newProgress >= m) {
          milestonesReported.current.add(m);
          sendAnalyticsSafely("/api/analytics/event", {
            event: "progress_milestone",
            clientId: getClientId(),
            metadata: {
              percentComplete: m,
              sessionId: sessionIdRef.current,
              timeElapsedMs: now - sessionStartTime.current,
              exploreMode: "immersive" as const,
            },
          });
          break;
        }
      }

      // Queue the mirror reflection as a non-blocking toast (host shell renders it)
      if (currentQuestion) {
        const text = pickMirrorText(
          currentQuestion.mirrorFeedback,
          score as 1 | 2 | 3 | 4 | 5 | 6,
          locale,
        );
        if (text) {
          setMirrorToast({
            id: now,
            text,
            accentColor: CHAPTERS[currentQuestion.chapter].accentColor,
          });
        }
      }

      // Reducer handles auto-advance (same chapter, chapter boundary, or last item)
      dispatch({ type: "RECORD_ANSWER", questionId, score });
    },
    [state.currentQuestionIndex, currentQuestion, locale, totalQuestions],
  );

  // ── Chapter transition completion (no closure dependency) ──
  const completeChapterTransition = useCallback(() => {
    dispatch({ type: "COMPLETE_CHAPTER_TRANSITION" });
  }, []);

  const dismissMirrorToast = useCallback(() => {
    setMirrorToast(null);
  }, []);

  const goToPreviousQuestion = useCallback(() => {
    const targetIndex =
      state.phase === "avatar-gender"
        ? totalQuestions - 1
        : state.currentQuestionIndex - 1;
    if (targetIndex < 0) return;

    dispatch({ type: "GO_TO_PREVIOUS_QUESTION" });
    questionShownAt.current = Date.now();
    questionTimings.current = questionTimings.current.filter(
      (timing) => timing.questionIndex < targetIndex,
    );
  }, [state.currentQuestionIndex, state.phase, totalQuestions]);

  // ── Revelation completion → result page ────────────────────
  const completeRevelation = useCallback(() => {
    dispatch({ type: "COMPLETE_REVELATION" });
  }, []);

  // ── Avatar gender submission (drives avatar-gender → generating)
  const submitAvatarGender = useCallback(
    (avatarGender: AvatarGender | null) => {
      dispatch({ type: "SUBMIT_AVATAR_GENDER", avatarGender });
    },
    [],
  );

  // ── Phase override (backward-compatible with intro component)
  const setPhase = useCallback((phase: ImmersivePhase) => {
    dispatch({ type: "SET_PHASE", phase });
  }, []);

  // ── Result computation (triggered when genStep >= 5) ───────
  const computeResult = useCallback(() => {
    // Answer completeness guard — all 30 questions must be answered
    const answeredCount = Object.keys(state.answers).length;
    if (answeredCount < totalQuestions) return;

    const scores = computeImmersiveScores(state.answers);
    const ranked = getRankedDimensions(scores);
    const primaryDimension = ranked[0];
    const secondaryDimension = ranked[1];

    const primaryScore = scores[primaryDimension];
    const primaryNarrative =
      primaryScore >= 17
        ? pickText(DIMENSION_IMMERSIVE[primaryDimension].high, locale)
        : pickText(DIMENSION_IMMERSIVE[primaryDimension].mid, locale);

    const secondaryScore = scores[secondaryDimension];
    const secondaryNarrative =
      secondaryScore >= 17
        ? pickText(DIMENSION_IMMERSIVE[secondaryDimension].high, locale)
        : pickText(DIMENSION_IMMERSIVE[secondaryDimension].mid, locale);

    // 同行者路径彩蛋
    const characterPaths = CHARACTERS.map((character) => {
      const charScores: Record<RiasecKey, number> = {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      };
      IMMERSIVE_QUESTIONS.forEach((q, idx) => {
        if (!q.riasec) return;
        charScores[q.riasec] += character.demoScores[idx] || 3;
      });
      return { character, scores: charScores };
    });

    // 12-type archetype — computed BEFORE immersiveResult so it can flow
    // through state into the shared result page (parity with Quick Dive).
    // RIASEC: 5 items × 1-5 scale = max 25 per dimension (Ch.1-6 only)
    const maxPerDimension = 25;
    const immersiveNormalized = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [
        k,
        Math.round((v / maxPerDimension) * 100),
      ]),
    ) as Record<RIASECDimension, number>;
    // TwIVI value orientation from Ch.7 (8 items, 6-point scale)
    const twiviAnswers = extractTwiviAnswers(
      state.answers,
      IMMERSIVE_QUESTIONS,
    );
    const valueResult = computeQuickValueOrientation(twiviAnswers);
    const archetype = buildArchetype(
      immersiveNormalized,
      valueResult.orientation,
    );
    const code = archetype.code;
    const labelData = findLabel(code) ??
      findLabel(archetype.primary) ?? {
        code,
        label_zh: archetype.label_zh,
        label_en: archetype.label_en,
        tagline_zh: archetype.tagline_zh,
        tagline_en: archetype.tagline_en,
        colorHex: "#5A8A9A",
      };
    const localeLabel = (labelData as unknown as Record<string, unknown>)[
      `label_${locale}`
    ];
    const localizedArchetypeLabel =
      typeof localeLabel === "string"
        ? localeLabel
        : locale === "zh"
          ? labelData.label_zh
          : labelData.label_en;

    const immersiveResult: ImmersiveResult = {
      scores,
      ranked,
      primaryDimension,
      secondaryDimension,
      primaryNarrative,
      secondaryNarrative,
      characterPaths,
      archetype,
    };

    hapticSuccess();

    const completedAt = Date.now();
    const totalDurationMs = completedAt - sessionStartTime.current;
    const timings = questionTimings.current;
    const durations = timings.map((t) => t.durationMs);
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const mid = Math.floor(sortedDurations.length / 2);
    const medianItemDurationMs =
      sortedDurations.length === 0
        ? 0
        : sortedDurations.length % 2 !== 0
          ? sortedDurations[mid]
          : Math.round((sortedDurations[mid - 1] + sortedDurations[mid]) / 2);

    analytics
      .track("immersive_explore_completed", {
        archetypeCode: code,
        language: locale,
        timeMs: totalDurationMs,
      })
      .catch(() => {});
    analytics
      .track("quickdive_completed", {
        exploreMode: "immersive",
        archetypeCode: code,
        language: locale,
        timeMs: totalDurationMs,
      })
      .catch(() => {});

    // Save to API, then dispatch SET_RESULT
    try {
      savePromiseRef.current = csrfFetch("/api/quickdive/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores,
          code,
          label: localizedArchetypeLabel,
          locale,
          exploreMode: "immersive",
          anonymousId: getClientId() || undefined,
          avatarGender: state.avatarGender ?? undefined,
          resultData: {
            sortedScores: ranked.map((k) => [k, scores[k]]),
            topCareers: [],
            fitCareers: [],
            drainCareers: [],
            confidenceTier: "MC",
            labelData,
            // Canonical RIASEC + Archetype — computed once here, downstream only reads
            computedRiasec: {
              riasecNormalized: immersiveNormalized,
              archetype,
              rawScoreMax: maxPerDimension,
              computedAt: new Date(completedAt).toISOString(),
            },
            // Value orientation from Ch.7 TwIVI (8 items, 6-point)
            computedValues: {
              orientation: valueResult.orientation,
              confidence: valueResult.confidence,
              isBoundary: valueResult.isBoundary,
              scores: valueResult.scores,
              rawAnswers: twiviAnswers,
              valueSource: "twivi-quick-immersive",
            },
          },
          timing: {
            sessionStartedAt: new Date(sessionStartTime.current).toISOString(),
            sessionCompletedAt: new Date(completedAt).toISOString(),
            totalDurationMs,
            perItemDurationMs: durations,
            medianItemDurationMs,
            fastResponseCount: timings.filter((t) => t.durationMs < 1000)
              .length,
          },
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            if (json.id) {
              try {
                localStorage.setItem("deep-dive-last-immersive-id", json.id);
                // Keep the legacy shared key for backward compatibility with
                // in-flight anonymous claim flows on older screens.
                localStorage.setItem("deep-dive-last-quickdive-id", json.id);
              } catch {
                /* ignore */
              }
              dispatch({
                type: "SET_RESULT",
                result: immersiveResult,
                savedReportId: json.id,
              });
              return json.id as string;
            }
          }
          dispatch({
            type: "SET_RESULT",
            result: immersiveResult,
            savedReportId: null,
          });
          return null;
        })
        .catch(() => {
          dispatch({
            type: "SET_RESULT",
            result: immersiveResult,
            savedReportId: null,
          });
          return null;
        });
    } catch {
      dispatch({
        type: "SET_RESULT",
        result: immersiveResult,
        savedReportId: null,
      });
    }
  }, [state.answers, state.avatarGender, locale]);

  // ── Trigger result computation after generation completes ──
  useEffect(() => {
    if (state.phase !== "generating" || state.genStep < 5) return;
    const timer = setTimeout(() => computeResult(), 200);
    return () => clearTimeout(timer);
  }, [state.phase, state.genStep, computeResult]);

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    sessionStartTime.current = 0;
    questionShownAt.current = 0;
    questionTimings.current = [];
    sessionIdRef.current = crypto.randomUUID();
    milestonesReported.current = new Set();
  }, []);

  return {
    // state
    phase: state.phase,
    setPhase,
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    mirrorToast,
    pendingChapterTransition: state.pendingChapterTransition,
    result: state.result,
    genStep: state.genStep,
    genSteps,
    savedReportId: state.savedReportId,
    totalQuestions,
    avatarGender: state.avatarGender,
    // actions
    recordAnswer,
    dismissMirrorToast,
    goToPreviousQuestion,
    completeChapterTransition,
    completeRevelation,
    submitAvatarGender,
    handleReset,
    trackEvent,
    waitForSave: async () => savePromiseRef.current,
  };
}
