// ============================================================
// Test: Cross-tab BroadcastChannel sync in questionnaire-store
// Verifies tabConflict state management and broadcastCrossTab.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock BroadcastChannel before importing the store (jsdom doesn't have it)
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
  constructor(name: string) {
    this.name = name;
  }
}

vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

// Mock csrfFetch (store imports it)
vi.mock("@/lib/auth/csrf-client", () => ({
  csrfFetch: vi.fn(),
}));

// Mock questionnaire store-utils
vi.mock("@/lib/questionnaire/store-utils", () => ({
  TOTAL_QUESTIONS: 86,
  getModuleForIndex: vi.fn().mockReturnValue({ moduleCode: "A", phase: 1 }),
  createInitialZoneTimeline: vi.fn().mockReturnValue([]),
  getZoneIdForModule: vi.fn().mockReturnValue("zone-a"),
  saveToLocalStorage: vi.fn(),
  loadFromLocalStorage: vi.fn().mockReturnValue(null),
  clearApiSaveTimer: vi.fn(),
  immediateApiSave: vi.fn(),
  createSessionInDb: vi.fn(),
  debouncedApiSave: vi.fn(),
  MODULES: [],
  MODULE_RANGES: {},
  MODULE_DEPTH_COLORS: {},
  getModuleRanges: vi.fn(),
  getTotalQuestions: vi.fn().mockReturnValue(86),
  getModuleList: vi.fn().mockReturnValue([]),
  getQuestionInfo: vi.fn(),
  isModuleTransition: vi.fn().mockReturnValue(false),
  isChapterTransition: vi.fn().mockReturnValue(false),
  isBreathingMoment: vi.fn().mockReturnValue(false),
  isMicroInsightTrigger: vi.fn().mockReturnValue(false),
}));

// Mock questionnaire-computed
vi.mock("@/store/questionnaire-computed", () => ({
  createComputedHelpers: vi.fn().mockReturnValue({
    progress: 0,
    currentModule: null,
    zoneProgress: [],
  }),
}));

// Mock questionnaire module
vi.mock("@/lib/questionnaire", () => ({
  TOTAL_QUESTIONS: 86,
}));

import {
  useQuestionnaireStore,
  broadcastCrossTab,
} from "../questionnaire-store";

describe("Cross-tab synchronization", () => {
  beforeEach(() => {
    // Reset store state
    useQuestionnaireStore.setState({
      tabConflict: false,
      session: null,
      saveStatus: "idle",
    });
    vi.clearAllMocks();
  });

  describe("tabConflict state", () => {
    it("tabConflict is initially false", () => {
      expect(useQuestionnaireStore.getState().tabConflict).toBe(false);
    });

    it("tabConflict can be set to true", () => {
      useQuestionnaireStore.setState({ tabConflict: true });
      expect(useQuestionnaireStore.getState().tabConflict).toBe(true);
    });

    it("dismissTabConflict sets tabConflict back to false", () => {
      useQuestionnaireStore.setState({ tabConflict: true });
      expect(useQuestionnaireStore.getState().tabConflict).toBe(true);

      useQuestionnaireStore.getState().dismissTabConflict();
      expect(useQuestionnaireStore.getState().tabConflict).toBe(false);
    });
  });

  describe("broadcastCrossTab", () => {
    it("broadcastCrossTab function exists and is callable", () => {
      expect(typeof broadcastCrossTab).toBe("function");
    });

    it("broadcastCrossTab does not throw when called", () => {
      expect(() =>
        broadcastCrossTab({
          type: "answer-submitted",
          sessionId: "test-session",
          questionIndex: 5,
        }),
      ).not.toThrow();
    });

    it("broadcastCrossTab handles session-completed message type", () => {
      expect(() =>
        broadcastCrossTab({
          type: "session-completed",
          sessionId: "test-session",
        }),
      ).not.toThrow();
    });

    it("broadcastCrossTab handles session-reset message type", () => {
      expect(() =>
        broadcastCrossTab({
          type: "session-reset",
          sessionId: "test-session",
        }),
      ).not.toThrow();
    });
  });
});
