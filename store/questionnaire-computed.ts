// ============================================================
// Questionnaire Store — Computed Helpers (read-only derivations)
// Extracted from questionnaire-store.ts for maintainability.
// These are factory functions that return Zustand store methods.
// ============================================================

import type {
  ModuleCode,
  QuestionnaireSessionV2,
} from "@/lib/questionnaire/store-utils";
import type { SJTAnswer } from "@/lib/scoring/score-sjt";
import type {
  QuestionnaireAnswers,
  SessionMetadataV3,
} from "@/lib/scoring/index";
import {
  TOTAL_QUESTIONS,
  getZonesForTier,
  type OceanZone,
} from "@/lib/questionnaire";
import {
  MODULE_RANGES,
  getQuestionInfo,
  getModuleForIndex,
  isModuleTransition as isModuleTransitionFn,
  isChapterTransition as isChapterTransitionFn,
  isBreathingMoment as isBreathingMomentFn,
  isMicroInsightTrigger as isMicroInsightTriggerFn,
} from "@/lib/questionnaire/store-utils";

import type { QuestionInfo } from "@/lib/questionnaire/store-utils";

// Type for the Zustand get() accessor
type GetState = () => {
  session: QuestionnaireSessionV2 | null;
  progress: () => number;
};

// Re-export types used by the store interface
export type { OceanZone };

export type ZoneProgressItem = OceanZone & {
  status: "completed" | "active" | "locked";
  progress: number;
  questionsAnswered: number;
  questionsTotal: number;
  startedAt: number | null;
  completedAt: number | null;
  timeSpentMs: number;
  discoveries: string[];
};

/**
 * Creates all computed helper methods for the questionnaire store.
 * Pure derivations from session state — no mutations.
 */
export function createComputedHelpers(get: GetState) {
  return {
    currentQuestionInfo: (): QuestionInfo | null => {
      const session = get().session;
      if (!session) return null;
      return getQuestionInfo(session.currentQuestionIndex);
    },

    currentModule: (): ModuleCode => {
      const session = get().session;
      if (!session) return "A";
      return getModuleForIndex(session.currentQuestionIndex);
    },

    progress: (): number => {
      const session = get().session;
      if (!session) return 0;
      return ((session.currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;
    },

    visualProgress: (): number => {
      const actual = get().progress() / 100;
      const ENDOWED_OFFSET = 0.12;
      const curved = 1 - Math.pow(1 - actual, 1.6);
      const visual = ENDOWED_OFFSET + curved * (1 - ENDOWED_OFFSET);
      return Math.round(visual * 100);
    },

    moduleProgress: (): {
      module: ModuleCode;
      current: number;
      total: number;
    } => {
      const session = get().session;
      if (!session) return { module: "A" as ModuleCode, current: 0, total: 6 };
      const mod = getModuleForIndex(session.currentQuestionIndex);
      const range = MODULE_RANGES[mod];
      const current = session.currentQuestionIndex - range.start + 1;
      const total = range.end - range.start + 1;
      return { module: mod, current, total };
    },

    isLastQuestion: (): boolean => {
      const session = get().session;
      if (!session) return false;
      return session.currentQuestionIndex === TOTAL_QUESTIONS - 1;
    },

    isFirstQuestion: (): boolean => {
      const session = get().session;
      if (!session) return true;
      return session.currentQuestionIndex === 0;
    },

    isModuleTransition: (): boolean => {
      const session = get().session;
      if (!session) return false;
      return isModuleTransitionFn(session.currentQuestionIndex);
    },

    isChapterTransition: (): boolean => {
      const session = get().session;
      if (!session) return false;
      return isChapterTransitionFn(session.currentQuestionIndex);
    },

    isBreathingMoment: (): boolean => {
      const session = get().session;
      if (!session) return false;
      return isBreathingMomentFn(session.currentQuestionIndex);
    },

    microInsightTrigger: (): string | null => {
      const session = get().session;
      if (!session) return null;
      return isMicroInsightTriggerFn(
        session.currentQuestionIndex,
        session.answers,
        session.triggeredBonusInsights || new Set(),
      );
    },

    estimatedTimeRemaining: (): number => {
      const session = get().session;
      if (!session) return 0;
      const idx = session.currentQuestionIndex;
      // Calculate remaining seconds per module (A=0-5, B=6-25, C=26-85)
      const AVG_SEC = { A: 40, B: 15, C: 11 };
      let totalSeconds = 0;
      const ranges = [
        { mod: "A" as const, start: 0, end: 5 },
        { mod: "B" as const, start: 6, end: 25 },
        { mod: "C" as const, start: 26, end: 85 },
      ];
      for (const r of ranges) {
        if (idx > r.end) continue; // module already completed
        const effectiveStart = Math.max(idx, r.start);
        const remaining = r.end - effectiveStart + 1;
        totalSeconds += remaining * AVG_SEC[r.mod];
      }
      return Math.ceil(totalSeconds / 60);
    },

    buildScoringInput: (): {
      answers: QuestionnaireAnswers;
      metadata: SessionMetadataV3;
    } | null => {
      const session = get().session;
      if (!session) return null;

      const sjt: SJTAnswer[] = [];
      const pvq: Record<number, number> = {};
      const ipip: Record<number, number> = {};

      const now = Date.now();
      const moduleTimes = {
        sjt: session.moduleStartTimes.B
          ? session.moduleStartTimes.B -
            (session.moduleStartTimes.A || session.startedAt)
          : 0,
        ddvq: session.moduleStartTimes.C
          ? session.moduleStartTimes.C - (session.moduleStartTimes.B || now)
          : 0,
        ipip60: session.completedAt
          ? session.completedAt - (session.moduleStartTimes.C || now)
          : 0,
      };

      let _rushCount = 0;
      const itemResponseTimes: {
        sjt: Record<number, number>;
        ddvq: Record<number, number>;
        ipip60: Record<number, number>;
      } = {
        sjt: {},
        ddvq: {},
        ipip60: {},
      };

      for (const answer of session.answers) {
        if (answer.value.type === "sjt") {
          sjt.push({
            scenarioId: answer.itemId,
            wouldChoice: answer.value.wouldChoice,
            shouldChoice: answer.value.shouldChoice,
          });
          itemResponseTimes.sjt[answer.itemId] = answer.responseTimeMs;
        } else if (answer.value.type === "pvq") {
          pvq[answer.itemId] = answer.value.rating;
          itemResponseTimes.ddvq[answer.itemId] = answer.responseTimeMs;
          if (answer.responseTimeMs < 1500) _rushCount++;
        } else if (answer.value.type === "ipip") {
          ipip[answer.itemId] = answer.value.rating;
          itemResponseTimes.ipip60[answer.itemId] = answer.responseTimeMs;
          if (answer.responseTimeMs < 1000) _rushCount++;
        }
      }

      return {
        answers: { sjt, pvq, ipip },
        metadata: {
          sessionId: session.id,
          totalTimeMs: session.totalTimeMs || Date.now() - session.startedAt,
          moduleTimes,
          itemResponseTimes,
        },
      };
    },

    zoneProgress: (): ZoneProgressItem[] => {
      const session = get().session;
      if (!session) return [];
      const zones = getZonesForTier("deep");
      const moduleOrder: ModuleCode[] = ["A", "B", "C"];
      const currentMod = getModuleForIndex(session.currentQuestionIndex);
      const currentModIdx = moduleOrder.indexOf(currentMod);

      return zones.map((zone) => {
        const modCode = zone.moduleCode as ModuleCode;
        const range = MODULE_RANGES[modCode];
        if (!range)
          return {
            ...zone,
            status: "locked" as const,
            progress: 0,
            questionsAnswered: 0,
            questionsTotal: 0,
            startedAt: null,
            completedAt: null,
            timeSpentMs: 0,
            discoveries: [],
          };

        const modIdx = moduleOrder.indexOf(modCode);
        const answered = session.answers.filter(
          (a) => a.moduleCode === modCode,
        ).length;
        const total = range.end - range.start + 1;
        const progress = answered / total;

        let status: "completed" | "active" | "locked";
        if (answered >= total) status = "completed";
        else if (modIdx === currentModIdx) status = "active";
        else if (modIdx < currentModIdx) status = "completed";
        else status = "locked";

        const timeline = session.zoneTimeline?.[zone.id];

        return {
          ...zone,
          status,
          progress,
          questionsAnswered: answered,
          questionsTotal: total,
          startedAt: timeline?.startedAt ?? null,
          completedAt: timeline?.completedAt ?? null,
          timeSpentMs: timeline?.timeSpentMs ?? 0,
          discoveries: timeline?.discoveries ?? [],
        };
      });
    },
  };
}
