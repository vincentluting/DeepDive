// ============================================================
// useQuestionnaireFlow v2.0 — Navigation, micro-insight,
// module transition, and chapter transition orchestration
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuestionnaireStore } from "@/store/questionnaire-store";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { getClientId } from "@/lib/auth/client-id";
import type { AnswerValue } from "@/lib/types";

// ============================================================
// Auto-advance configuration
// ============================================================

export const AUTO_ADVANCE_DELAY_MS = 150;

// ============================================================
// Hook
// ============================================================

export function useQuestionnaireFlow() {
  const params = useParams();
  const urlLocale = (params?.locale as "en" | "zh") || "en";

  const {
    session,
    submitAnswer,
    goToNext,
    goToPrevious,
    currentQuestionInfo,
    currentModule,
    progress,
    visualProgress,
    moduleProgress,
    isLastQuestion,
    isFirstQuestion,
    isModuleTransition,
    isChapterTransition,
    isBreathingMoment,
    microInsightTrigger,
    estimatedTimeRemaining,
    completeSession,
    restoreSession,
    startSession,
    buildScoringInput,
    saveStatus,
    markBonusInsightTriggered,
  } = useQuestionnaireStore();

  const [showModuleTransition, setShowModuleTransition] = useState(false);
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [showMicroInsight, setShowMicroInsight] = useState(false);
  const [microInsightType, setMicroInsightType] = useState<string | null>(null);
  const [showBreathingMoment, setShowBreathingMoment] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<AnswerValue | undefined>(
    undefined,
  );
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);
  const answerStartTime = useRef(Date.now());
  const milestonesReported = useRef<Set<number>>(new Set());
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const breathingMomentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const handleNextRef = useRef<() => void>(() => {});
  const bypassBeforeUnloadRef = useRef(false);

  const questionInfo = currentQuestionInfo();
  const language = urlLocale;

  // Attempt session restore from localStorage on mount, then DB fallback
  useEffect(() => {
    if (!session) {
      const restored = restoreSession();
      if (restored) {
        // Check if the restored session has existing answers (returning user)
        const restoredSession = useQuestionnaireStore.getState().session;
        if (restoredSession && restoredSession.answers.length > 0) {
          setWasRestored(true);
        }
      } else {
        // No localStorage session — check DB for unfinished session
        fetch("/api/session/resume")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.session) {
              const store = useQuestionnaireStore.getState();
              // Only restore if store still has no session (avoid race condition)
              if (!store.session) {
                store.restoreFromDbSession(data.session);
                setWasRestored(true);
              }
            } else {
              // No DB session either — start fresh
              const store = useQuestionnaireStore.getState();
              if (!store.session) {
                startSession(urlLocale);
              }
            }
          })
          .catch(() => {
            // DB check failed — start fresh
            const store = useQuestionnaireStore.getState();
            if (!store.session) {
              startSession(urlLocale);
            }
          });
      }
    }
  }, []);

  // Safety net: if session is still null after 5s (e.g. stale session was
  // restored then nullified by status check), force-start a new one.
  useEffect(() => {
    const timer = setTimeout(() => {
      const store = useQuestionnaireStore.getState();
      if (!store.session) {
        startSession(urlLocale);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Exit protection — bypass when user explicitly chooses Save & Exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassBeforeUnloadRef.current) return;
      if (session && !session.completedAt && session.answers.length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  // Auto-dismiss breathing moment after 2 seconds
  useEffect(() => {
    if (showBreathingMoment) {
      breathingMomentTimerRef.current = setTimeout(() => {
        setShowBreathingMoment(false);
        breathingMomentTimerRef.current = null;
      }, 2000);
      return () => {
        if (breathingMomentTimerRef.current) {
          clearTimeout(breathingMomentTimerRef.current);
          breathingMomentTimerRef.current = null;
        }
      };
    }
  }, [showBreathingMoment]);

  // Get saved answer for current question
  const savedAnswer = questionInfo
    ? session?.answers.find((a) => a.questionIndex === questionInfo.index)
    : undefined;

  const currentValue = pendingAnswer ?? savedAnswer?.value;

  // Cancel any in-progress auto-advance timer
  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setIsAutoAdvancing(false);
  }, []);

  const handleAnswerChange = useCallback(
    (value: AnswerValue) => {
      // Dismiss breathing moment immediately on any interaction
      if (showBreathingMoment) {
        setShowBreathingMoment(false);
        if (breathingMomentTimerRef.current) {
          clearTimeout(breathingMomentTimerRef.current);
          breathingMomentTimerRef.current = null;
        }
      }

      setPendingAnswer(value);
      cancelAutoAdvance();

      // Auto-advance for PVQ and IPIP after selection (not SJT — it has its own flow)
      if (
        questionInfo &&
        (value.type === "pvq" || value.type === "ipip") &&
        !isLastQuestion()
      ) {
        setIsAutoAdvancing(true);
        autoAdvanceTimerRef.current = setTimeout(() => {
          autoAdvanceTimerRef.current = null;
          setIsAutoAdvancing(false);
          handleNextRef.current();
        }, AUTO_ADVANCE_DELAY_MS);
      }
    },
    [questionInfo, isLastQuestion, cancelAutoAdvance, showBreathingMoment],
  );

  const handleNext = useCallback(() => {
    if (!questionInfo || !session) return;

    // Cancel any pending auto-advance to prevent double-advance race condition
    cancelAutoAdvance();

    // Save the answer
    if (pendingAnswer !== undefined) {
      const responseTimeMs = Date.now() - answerStartTime.current;
      submitAnswer({
        questionIndex: questionInfo.index,
        moduleCode: questionInfo.module,
        itemId: questionInfo.itemId,
        value: pendingAnswer,
        responseTimeMs,
        timestamp: Date.now(),
      });

      // Granular tracking: question_answered
      sendAnalyticsSafely("/api/analytics/event", {
        event: "question_answered",
        clientId: getClientId(),
        metadata: {
          questionIndex: questionInfo.index,
          timeOnQuestionMs: responseTimeMs,
          moduleId: questionInfo.module,
          questionId: String(questionInfo.itemId),
          sessionId: session.id,
        },
      });

      // Granular tracking: progress_milestone
      const currentProgress = progress();
      const milestones = [25, 50, 75] as const;
      for (const m of milestones) {
        if (!milestonesReported.current.has(m) && currentProgress >= m) {
          milestonesReported.current.add(m);
          sendAnalyticsSafely("/api/analytics/event", {
            event: "progress_milestone",
            clientId: getClientId(),
            metadata: {
              percentComplete: m,
              sessionId: session.id,
              timeElapsedMs: Date.now() - (session.startedAt || Date.now()),
            },
          });
          break;
        }
      }
    }

    // Check if this is the last question
    if (isLastQuestion()) {
      completeSession();
      return "complete" as const;
    }

    // Check for micro-insight trigger
    const insightType = microInsightTrigger();
    if (insightType) {
      setMicroInsightType(insightType);
      setShowMicroInsight(true);
      return "micro-insight" as const;
    }

    // Check for module transition (A→B, B→C) — user-dismissed
    if (isModuleTransition()) {
      setShowModuleTransition(true);
      return "module-transition" as const;
    }

    // Check for chapter transition within Module C (user-dismissed)
    if (isChapterTransition()) {
      setShowChapterTransition(true);
      return "chapter-transition" as const;
    }

    // Check for breathing moment (Module C, every 8 items, excluding chapter boundaries)
    const bmTriggered = isBreathingMoment();

    goToNext();
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();

    if (bmTriggered) {
      setShowBreathingMoment(true);
      return "breathing-moment" as const;
    }
    return "next" as const;
  }, [
    questionInfo,
    session,
    pendingAnswer,
    submitAnswer,
    goToNext,
    isLastQuestion,
    isModuleTransition,
    isChapterTransition,
    isBreathingMoment,
    microInsightTrigger,
    cancelAutoAdvance,
    completeSession,
  ]);

  handleNextRef.current = handleNext;

  // Clean up auto-advance timer on unmount or question change
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [questionInfo?.index]);

  const handleMicroInsightContinue = useCallback(() => {
    // If this was a bonus insight, mark it as triggered so it won't fire again
    if (microInsightType?.startsWith("bonus")) {
      markBonusInsightTriggered(microInsightType);
    }

    setShowMicroInsight(false);
    setMicroInsightType(null);

    // After micro-insight, check if there's also a module transition — user-dismissed
    if (isModuleTransition()) {
      setShowModuleTransition(true);
      return;
    }

    // Check for chapter transition (user-dismissed)
    if (isChapterTransition()) {
      setShowChapterTransition(true);
      return;
    }

    goToNext();
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();
  }, [
    goToNext,
    isModuleTransition,
    isChapterTransition,
    microInsightType,
    markBonusInsightTriggered,
  ]);

  // User-triggered module transition continuation (A→B, B→C)
  const handleModuleTransitionContinue = useCallback(() => {
    setShowModuleTransition(false);
    goToNext();
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();
  }, [goToNext]);

  // User-triggered chapter transition continuation
  const handleChapterTransitionContinue = useCallback(() => {
    setShowChapterTransition(false);
    goToNext();
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();
  }, [goToNext]);

  // User-triggered "reconsider last answer" — dismisses any blocking overlay
  // (module/chapter transition or post-answer micro-insight) without advancing,
  // so the user lands back on the question they just answered with their prior
  // selection preserved. Resets the per-question timer so a revised submission
  // measures fresh reaction time while submitAnswer preserves firstResponseTimeMs.
  const handleReconsider = useCallback(() => {
    setShowModuleTransition(false);
    setShowChapterTransition(false);
    setShowMicroInsight(false);
    setMicroInsightType(null);
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();
  }, []);

  // Allow navigation without beforeunload prompt (used by Save & Exit)
  const allowNavigation = useCallback(() => {
    bypassBeforeUnloadRef.current = true;
  }, []);

  const handlePrevious = useCallback(() => {
    cancelAutoAdvance();
    goToPrevious();
    setPendingAnswer(undefined);
    answerStartTime.current = Date.now();
  }, [goToPrevious, cancelAutoAdvance]);

  // Answer completeness check
  function isAnswerComplete(value: AnswerValue | undefined): boolean {
    if (!value) return false;
    if (value.type === "sjt") {
      return !!value.wouldChoice && !!value.shouldChoice;
    }
    if (value.type === "pvq") {
      return value.rating >= 1 && value.rating <= 6;
    }
    if (value.type === "ipip") {
      return value.rating >= 1 && value.rating <= 5;
    }
    return false;
  }

  return {
    // State
    session,
    questionInfo,
    language,
    urlLocale,
    currentValue,
    showModuleTransition,
    showChapterTransition,
    showMicroInsight,
    microInsightType,
    showBreathingMoment,
    setShowBreathingMoment,
    isAutoAdvancing,
    saveStatus,
    wasRestored,

    // Computed
    hasAnswer: isAnswerComplete(currentValue),
    progress,
    visualProgress,
    moduleProgress,
    currentModule,
    estimatedTimeRemaining,
    isFirstQuestion,
    isLastQuestion,

    // Handlers
    handleAnswerChange,
    handleNext,
    handlePrevious,
    handleMicroInsightContinue,
    handleModuleTransitionContinue,
    handleChapterTransitionContinue,
    handleReconsider,
    allowNavigation,
    buildScoringInput,
    submitAnswer,
    goToNext,
  };
}
