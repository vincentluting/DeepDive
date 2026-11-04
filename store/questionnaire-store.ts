// ============================================================
// Zustand Store: Questionnaire v2.0 State Management
// Module A/B/C structure (v3.0: 86 questions), auto-save to localStorage + API
//
// Pure functions, types, constants → lib/questionnaire/store-utils.ts
// This file contains only the Zustand store definition.
// ============================================================

import { create } from "zustand";
import type { AnswerValue } from "@/lib/types";
import { TOTAL_QUESTIONS } from "@/lib/questionnaire";
import {
  createComputedHelpers,
  type ZoneProgressItem,
} from "./questionnaire-computed";
export type { ZoneProgressItem } from "./questionnaire-computed";
import { csrfFetch } from "@/lib/auth/csrf-client";

// Re-export everything from store-utils for backward compatibility
export {
  type ModuleCode,
  type TextTheme,
  type ModulePhaseInfo,
  type QuestionInfo,
  type QuestionnaireSessionV2,
  MODULES,
  MODULE_RANGES,
  TOTAL_QUESTIONS,
  MODULE_DEPTH_COLORS,
  getModuleRanges,
  getTotalQuestions,
  getModuleList,
  getQuestionInfo,
  getModuleForIndex,
  isModuleTransition,
  isChapterTransition,
  isBreathingMoment,
  isMicroInsightTrigger,
  createInitialZoneTimeline,
  getZoneIdForModule,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearApiSaveTimer,
  immediateApiSave,
  createSessionInDb,
  debouncedApiSave,
} from "@/lib/questionnaire/store-utils";

// Import for internal use
import {
  type ModuleCode,
  type QuestionnaireSessionV2,
  type QuestionInfo,
  getModuleForIndex,
  createInitialZoneTimeline,
  getZoneIdForModule,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearApiSaveTimer,
  immediateApiSave,
  createSessionInDb,
  debouncedApiSave,
} from "@/lib/questionnaire/store-utils";

// ============================================================
// Store interface
// ============================================================

interface QuestionnaireStoreV2 {
  session: QuestionnaireSessionV2 | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  sessionDbConfirmed: boolean;
  tabConflict: boolean;

  // Actions
  startSession: (language: "en" | "zh", includeRIASEC?: boolean) => void;
  submitAnswer: (answer: {
    questionIndex: number;
    moduleCode: ModuleCode;
    itemId: number;
    value: AnswerValue;
    responseTimeMs: number;
    timestamp: number;
  }) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  completeSession: () => void;
  dismissTabConflict: () => void;
  markBonusInsightTriggered: (type: string) => void;
  setPacePreference: (pref: "auto" | "manual") => void;
  resetSession: () => void;
  restoreSession: () => boolean;
  restoreFromDbSession: (dbSession: {
    id: string;
    language: string;
    answersJson: Array<{
      questionIndex: number;
      moduleCode: string;
      itemId: number;
      value: AnswerValue;
      responseTimeMs: number;
      timestamp: number;
    }>;
    currentQuestionIndex: number;
    startedAt: number;
    explorationProgressJson?: Record<string, unknown>;
  }) => void;

  // Computed helpers
  currentQuestionInfo: () => QuestionInfo | null;
  currentModule: () => ModuleCode;
  progress: () => number;
  visualProgress: () => number;
  moduleProgress: () => { module: ModuleCode; current: number; total: number };
  isLastQuestion: () => boolean;
  isFirstQuestion: () => boolean;
  isModuleTransition: () => boolean;
  isChapterTransition: () => boolean;
  isBreathingMoment: () => boolean;
  microInsightTrigger: () => string | null;
  estimatedTimeRemaining: () => number;
  buildScoringInput: () => {
    answers: import("@/lib/scoring/index").QuestionnaireAnswers;
    metadata: import("@/lib/scoring/index").SessionMetadataV3;
  } | null;
  zoneProgress: () => ZoneProgressItem[];
}

// ============================================================
// Visibility change listener — flush save on tab hide/close
// ============================================================

let _visibilityListenerAttached = false;
let _beforeUnloadListenerAttached = false;

function ensureVisibilityListener() {
  if (typeof document === "undefined") return;
  if (_visibilityListenerAttached) return;
  _visibilityListenerAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    const session = useQuestionnaireStore.getState().session;
    if (session && !session.completedAt) {
      immediateApiSave(session);
    }
  });
}

function ensureBeforeUnloadListener() {
  if (typeof window === "undefined") return;
  if (_beforeUnloadListenerAttached) return;
  _beforeUnloadListenerAttached = true;
  window.addEventListener("beforeunload", () => {
    const session = useQuestionnaireStore.getState().session;
    if (!session || session.completedAt || !session.id) return;
    clearApiSaveTimer();
    const payload = JSON.stringify({
      sessionId: session.id,
      answers: session.answers,
      currentModule: getModuleForIndex(session.currentQuestionIndex),
      currentQuestionIndex: session.currentQuestionIndex,
      language: session.language,
      explorationProgress: session.zoneTimeline,
    });
    try {
      navigator.sendBeacon("/api/session/save-beacon", payload);
    } catch {
      immediateApiSave(session);
    }
  });
}

// ============================================================
// Store
// ============================================================

export const useQuestionnaireStore = create<QuestionnaireStoreV2>(
  (set, get) => ({
    session: null,
    saveStatus: "idle" as const,
    sessionDbConfirmed: false,
    tabConflict: false,

    startSession: (language, _includeRIASEC = false) => {
      const session: QuestionnaireSessionV2 = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        language,
        includeRIASEC: false,
        answers: [],
        startedAt: Date.now(),
        currentQuestionIndex: 0,
        moduleStartTimes: { A: Date.now(), B: null, C: null },
        triggeredBonusInsights: new Set(),
        pacePreference: "auto",
        zoneTimeline: createInitialZoneTimeline(),
      };
      set({ session, sessionDbConfirmed: false });
      saveToLocalStorage(session);
      createSessionInDb(session, () => set({ sessionDbConfirmed: true }));
      ensureVisibilityListener();
      ensureBeforeUnloadListener();
    },

    submitAnswer: (answer) => {
      set((state) => {
        if (!state.session) return state;
        // Block submissions when another tab is active on the same session
        if (state.tabConflict) return state;
        const existing = state.session.answers.findIndex(
          (a) => a.questionIndex === answer.questionIndex,
        );
        const newAnswers = [...state.session.answers];
        if (existing >= 0) {
          // Preserve first-response time so research analysis keeps the first-reaction signal,
          // and track how many times the user has revised this item.
          const prev = newAnswers[existing];
          newAnswers[existing] = {
            ...answer,
            firstResponseTimeMs:
              prev.firstResponseTimeMs ?? prev.responseTimeMs,
            revisionCount: (prev.revisionCount ?? 0) + 1,
          };
        } else {
          newAnswers.push(answer);
        }
        const updated = { ...state.session, answers: newAnswers };
        saveToLocalStorage(updated);
        debouncedApiSave(updated, (status) => set({ saveStatus: status }));
        broadcastCrossTab({
          type: "answer-submitted",
          sessionId: updated.id,
          questionIndex: answer.questionIndex,
        });
        return { session: updated };
      });
    },

    goToNext: () => {
      set((state) => {
        if (!state.session) return state;
        const nextIndex = state.session.currentQuestionIndex + 1;
        if (nextIndex >= TOTAL_QUESTIONS) return state;

        const currentModule = getModuleForIndex(
          state.session.currentQuestionIndex,
        );
        const nextModule = getModuleForIndex(nextIndex);

        const moduleStartTimes = { ...state.session.moduleStartTimes };
        if (moduleStartTimes[nextModule] === null) {
          moduleStartTimes[nextModule] = Date.now();
        }

        const zoneTimeline = { ...state.session.zoneTimeline };
        if (currentModule !== nextModule) {
          const currentZoneId = getZoneIdForModule(currentModule);
          const nextZoneId = getZoneIdForModule(nextModule);
          const now = Date.now();

          if (currentZoneId && zoneTimeline[currentZoneId]) {
            const entry = { ...zoneTimeline[currentZoneId] };
            entry.completedAt = now;
            if (entry.startedAt) {
              entry.timeSpentMs = now - entry.startedAt;
            }
            zoneTimeline[currentZoneId] = entry;
          }

          if (nextZoneId && zoneTimeline[nextZoneId]) {
            zoneTimeline[nextZoneId] = {
              ...zoneTimeline[nextZoneId],
              startedAt: now,
            };
          }
        }

        const updated = {
          ...state.session,
          currentQuestionIndex: nextIndex,
          moduleStartTimes,
          zoneTimeline,
        };
        saveToLocalStorage(updated);
        return { session: updated };
      });
    },

    goToPrevious: () => {
      set((state) => {
        if (!state.session) return state;
        const prevIndex = Math.max(0, state.session.currentQuestionIndex - 1);
        const updated = { ...state.session, currentQuestionIndex: prevIndex };
        saveToLocalStorage(updated);
        return { session: updated };
      });
    },

    completeSession: () => {
      clearApiSaveTimer();

      const currentSession = get().session;
      if (!currentSession) return;

      const now = Date.now();
      const zoneTimeline = { ...currentSession.zoneTimeline };
      const finalModule = getModuleForIndex(
        currentSession.currentQuestionIndex,
      );
      const finalZoneId = getZoneIdForModule(finalModule);
      if (finalZoneId && zoneTimeline[finalZoneId]) {
        const entry = { ...zoneTimeline[finalZoneId] };
        entry.completedAt = now;
        if (entry.startedAt) {
          entry.timeSpentMs = now - entry.startedAt;
        }
        zoneTimeline[finalZoneId] = entry;
      }

      const updated = {
        ...currentSession,
        completedAt: now,
        totalTimeMs: now - currentSession.startedAt,
        zoneTimeline,
      };

      // Update store state synchronously
      set({ session: updated });

      // Save to API first, clear localStorage only on confirmed save.
      // If save fails, localStorage retains the session as a recovery point.
      immediateApiSave(updated).then((ok) => {
        if (ok) saveToLocalStorage(null);
      });

      broadcastCrossTab({
        type: "session-completed",
        sessionId: updated.id,
      });
    },

    dismissTabConflict: () => set({ tabConflict: false }),

    markBonusInsightTriggered: (type: string) => {
      const session = get().session;
      if (!session) return;
      const newSet = new Set(session.triggeredBonusInsights || []);
      newSet.add(type);

      const currentModule = getModuleForIndex(session.currentQuestionIndex);
      const zoneId = getZoneIdForModule(currentModule);
      const zoneTimeline = { ...session.zoneTimeline };
      if (zoneId && zoneTimeline[zoneId]) {
        const entry = { ...zoneTimeline[zoneId] };
        if (!entry.discoveries.includes(type)) {
          entry.discoveries = [...entry.discoveries, type];
        }
        zoneTimeline[zoneId] = entry;
      }

      set({
        session: { ...session, triggeredBonusInsights: newSet, zoneTimeline },
      });
    },

    setPacePreference: (pref: "auto" | "manual") => {
      set((state) => {
        if (!state.session) return state;
        const updated = { ...state.session, pacePreference: pref };
        saveToLocalStorage(updated);
        return { session: updated };
      });
    },

    resetSession: () => {
      const prev = get().session;
      set({
        session: null,
        saveStatus: "idle",
        sessionDbConfirmed: false,
        tabConflict: false,
      });
      saveToLocalStorage(null);
      if (prev) {
        broadcastCrossTab({ type: "session-reset", sessionId: prev.id });
      }
    },

    restoreSession: () => {
      const saved = loadFromLocalStorage();
      if (saved) {
        if (saved.completedAt) {
          saveToLocalStorage(null);
          return false;
        }
        const ageMs = Date.now() - saved.startedAt;
        if (ageMs > 48 * 60 * 60 * 1000) {
          saveToLocalStorage(null);
          return false;
        }
        set({ session: saved, sessionDbConfirmed: false });
        createSessionInDb(saved, () => set({ sessionDbConfirmed: true }));
        ensureVisibilityListener();
        ensureBeforeUnloadListener();

        if (saved.id) {
          csrfFetch(`/api/session/status?id=${encodeURIComponent(saved.id)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (
                data?.status === "completed" ||
                data?.status === "abandoned"
              ) {
                saveToLocalStorage(null);
                const current = useQuestionnaireStore.getState().session;
                if (current?.id === saved.id) {
                  // Start a fresh session instead of leaving the store in a null state
                  // (prevents stuck loading spinner when user revisits after session completion)
                  useQuestionnaireStore.getState().startSession(saved.language);
                }
              }
            })
            .catch(() => {
              /* best-effort */
            });
        }
        return true;
      }
      return false;
    },

    restoreFromDbSession: (dbSession) => {
      // Restore zone timeline from DB if available, otherwise create fresh
      const dbZoneTimeline = dbSession.explorationProgressJson?.zoneTimeline as
        | Record<string, unknown>
        | undefined;
      const hasValidTimeline =
        dbZoneTimeline && Object.keys(dbZoneTimeline).length > 0;
      const zoneTimeline = hasValidTimeline
        ? (dbZoneTimeline as QuestionnaireSessionV2["zoneTimeline"])
        : createInitialZoneTimeline();

      const session: QuestionnaireSessionV2 = {
        id: dbSession.id,
        language: dbSession.language as "en" | "zh",
        includeRIASEC: false,
        answers: dbSession.answersJson.map((a) => ({
          ...a,
          moduleCode: a.moduleCode as ModuleCode,
        })),
        startedAt: dbSession.startedAt,
        currentQuestionIndex: dbSession.currentQuestionIndex,
        moduleStartTimes: { A: dbSession.startedAt, B: null, C: null },
        triggeredBonusInsights: new Set(),
        pacePreference: "auto",
        zoneTimeline,
      };
      set({ session, sessionDbConfirmed: true });
      saveToLocalStorage(session);
      ensureVisibilityListener();
      ensureBeforeUnloadListener();
    },

    // ── Computed helpers (extracted to questionnaire-computed.ts) ──
    ...createComputedHelpers(get),
  }),
);

// ============================================================
// Cross-tab synchronization via BroadcastChannel
// Prevents data conflicts when users have multiple tabs open.
// When another tab submits an answer or completes the session,
// this tab sets a tabConflict flag so the UI can warn the user.
// ============================================================

type CrossTabMessage =
  | { type: "answer-submitted"; sessionId: string; questionIndex: number }
  | { type: "session-completed"; sessionId: string }
  | { type: "session-reset"; sessionId: string };

let _crossTabChannel: BroadcastChannel | null = null;

function getCrossTabChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!_crossTabChannel) {
    _crossTabChannel = new BroadcastChannel("questionnaire-sync");
    _crossTabChannel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
      const msg = event.data;
      const currentSession = useQuestionnaireStore.getState().session;
      if (!currentSession || currentSession.completedAt) return;

      // Only react if the message is about the same session
      if (msg.sessionId !== currentSession.id) return;

      switch (msg.type) {
        case "answer-submitted":
        case "session-completed":
          useQuestionnaireStore.setState({ tabConflict: true });
          break;
        case "session-reset":
          // Other tab reset — clear our session too
          useQuestionnaireStore.setState({
            session: null,
            saveStatus: "idle",
            sessionDbConfirmed: false,
            tabConflict: false,
          });
          break;
      }
    };
  }
  return _crossTabChannel;
}

export function broadcastCrossTab(msg: CrossTabMessage): void {
  try {
    getCrossTabChannel()?.postMessage(msg);
  } catch {
    // BroadcastChannel can throw if closed; silently ignore
  }
}

// Initialize the listener on module load (client-side only)
if (typeof window !== "undefined") {
  getCrossTabChannel();
}
