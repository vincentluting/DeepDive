// ============================================================
// Test: submitAnswer preserves first-response time on revision
// Verifies that reconsider-flow rewrites keep firstResponseTimeMs and
// increment revisionCount, so research analysis can use first-reaction signal.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/auth/csrf-client", () => ({
  csrfFetch: vi.fn(),
}));

vi.mock("@/lib/questionnaire/store-utils", () => ({
  TOTAL_QUESTIONS: 86,
  getModuleForIndex: vi.fn().mockReturnValue("A"),
  createInitialZoneTimeline: vi.fn().mockReturnValue({}),
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

vi.mock("@/store/questionnaire-computed", () => ({
  createComputedHelpers: vi.fn().mockReturnValue({
    progress: 0,
    currentModule: null,
    zoneProgress: [],
  }),
}));

vi.mock("@/lib/questionnaire", () => ({
  TOTAL_QUESTIONS: 86,
}));

import { useQuestionnaireStore } from "../questionnaire-store";

function seedSession() {
  useQuestionnaireStore.setState({
    tabConflict: false,
    session: {
      id: "test-session",
      language: "en",
      includeRIASEC: false,
      answers: [],
      startedAt: Date.now(),
      currentQuestionIndex: 0,
      moduleStartTimes: { A: Date.now(), B: null, C: null },
      triggeredBonusInsights: new Set(),
      pacePreference: "auto",
      zoneTimeline: {},
      // biome-ignore lint/suspicious/noExplicitAny: minimal session for unit test
    } as any,
    saveStatus: "idle",
  });
}

describe("submitAnswer — reconsider-flow preservation", () => {
  beforeEach(() => {
    seedSession();
    vi.clearAllMocks();
  });

  it("first submission stores responseTimeMs without first/revision metadata", () => {
    useQuestionnaireStore.getState().submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
      responseTimeMs: 4200,
      timestamp: 1000,
    });

    const answers = useQuestionnaireStore.getState().session!.answers;
    expect(answers).toHaveLength(1);
    expect(answers[0].questionIndex).toBe(5);
    expect(answers[0].responseTimeMs).toBe(4200);
    // First write should not set revision metadata — only on overwrite.
    expect(answers[0].firstResponseTimeMs).toBeUndefined();
    expect(answers[0].revisionCount).toBeUndefined();
  });

  it("second submission to same index preserves first-response time and increments revisionCount", () => {
    const submitAnswer = useQuestionnaireStore.getState().submitAnswer;

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
      responseTimeMs: 4200,
      timestamp: 1000,
    });

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      // user changed their mind on the would-choice
      value: { type: "sjt", wouldChoice: "C", shouldChoice: "B" },
      responseTimeMs: 1800,
      timestamp: 2000,
    });

    const answers = useQuestionnaireStore.getState().session!.answers;
    expect(answers).toHaveLength(1); // still one entry per question
    expect(answers[0].responseTimeMs).toBe(1800); // latest reaction
    expect(answers[0].firstResponseTimeMs).toBe(4200); // first reaction preserved
    expect(answers[0].revisionCount).toBe(1);
    expect(answers[0].value).toMatchObject({
      wouldChoice: "C",
      shouldChoice: "B",
    });
  });

  it("third submission keeps first-response time and stacks revisionCount", () => {
    const submitAnswer = useQuestionnaireStore.getState().submitAnswer;

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
      responseTimeMs: 4200,
      timestamp: 1000,
    });
    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "B", shouldChoice: "B" },
      responseTimeMs: 2000,
      timestamp: 2000,
    });
    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "C", shouldChoice: "B" },
      responseTimeMs: 900,
      timestamp: 3000,
    });

    const answers = useQuestionnaireStore.getState().session!.answers;
    expect(answers[0].firstResponseTimeMs).toBe(4200);
    expect(answers[0].revisionCount).toBe(2);
    expect(answers[0].responseTimeMs).toBe(900);
  });

  it("does not touch metadata on unrelated questionIndex submissions", () => {
    const submitAnswer = useQuestionnaireStore.getState().submitAnswer;

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
      responseTimeMs: 4200,
      timestamp: 1000,
    });
    submitAnswer({
      questionIndex: 6,
      moduleCode: "B",
      itemId: 1,
      value: { type: "ddvq", rating: 5 },
      responseTimeMs: 2500,
      timestamp: 2000,
    });

    const answers = useQuestionnaireStore.getState().session!.answers;
    expect(answers).toHaveLength(2);
    expect(answers[0].revisionCount).toBeUndefined();
    expect(answers[1].revisionCount).toBeUndefined();
  });

  it("blocks submission when tabConflict is true (revision logic still respects guard)", () => {
    const submitAnswer = useQuestionnaireStore.getState().submitAnswer;

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
      responseTimeMs: 4200,
      timestamp: 1000,
    });

    useQuestionnaireStore.setState({ tabConflict: true });

    submitAnswer({
      questionIndex: 5,
      moduleCode: "A",
      itemId: 6,
      value: { type: "sjt", wouldChoice: "C", shouldChoice: "B" },
      responseTimeMs: 999,
      timestamp: 2000,
    });

    const answers = useQuestionnaireStore.getState().session!.answers;
    expect(answers[0].responseTimeMs).toBe(4200); // unchanged
    expect(answers[0].revisionCount).toBeUndefined();
  });
});
