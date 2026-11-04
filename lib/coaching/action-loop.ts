// ============================================================
// Coaching action loop — turn insight into a seven-day Action Hub item
// ============================================================

import type {
  ActionCategory,
  ActionIntensity,
} from "@/lib/db/action-hub";
import type { CoachingTurnUnderstandingV2 } from "./turn-understanding";

export interface SevenDayCoachingAction {
  title: string;
  description: string;
  category: ActionCategory;
  intensity: ActionIntensity;
  estimatedMinutes: number;
  dueDate: string;
}

export interface BuildSevenDayCoachingActionParams {
  locale: string;
  latestUserMessage: string | null;
  understandingV2: CoachingTurnUnderstandingV2;
  now?: Date;
}

const ACTION_LOOP_COPY = {
  fallbackObject: {
    zh: "这次卡住的事",
    en: "this stuck point",
  },
  actionReview: {
    title: {
      zh: (object: string) => `把“${object}”缩小到一次开口`,
      en: (object: string) => `Shrink "${object}" into one opening move`,
    },
    description: {
      zh: "写一条第一条消息草稿，不发送也可以；目标是看清开口这一步真正卡在哪里。",
      en: "Draft the first message without needing to send it; the goal is to see what makes the opening move hard.",
    },
  },
  decision: {
    title: {
      zh: (object: string) => `列出“${object}”的 3 个判断条件`,
      en: (object: string) => `List three decision criteria for "${object}"`,
    },
    description: {
      zh: "用 20 分钟写下：现实约束、长期方向、最怕的代价各是什么。",
      en: "Spend 20 minutes writing the practical constraint, long-term direction, and feared cost.",
    },
  },
  defaultAction: {
    title: {
      zh: (_object: string) => "做一个 20 分钟现实验证",
      en: (_object: string) => "Run one 20-minute reality check",
    },
    description: {
      zh: (object: string) =>
        `围绕“${object}”写下一个可以在 7 天内验证的小问题，并找一个现实证据。`,
      en: (object: string) =>
        `Write one small question about "${object}" that can be tested within seven days, then find one real-world clue.`,
    },
  },
} as const;

function addDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy.toISOString().slice(0, 10);
}

function firstConcreteObject(
  understanding: CoachingTurnUnderstandingV2,
  fallback: string,
): string {
  return understanding.concreteObjects[0] ?? fallback;
}

function pickLocale<T>(locale: string, copy: { zh: T; en: T }): T {
  return locale === "zh" ? copy.zh : copy.en;
}

export function buildSevenDayCoachingAction(
  params: BuildSevenDayCoachingActionParams,
): SevenDayCoachingAction {
  const dueDate = addDays(params.now ?? new Date(), 7);
  const object = firstConcreteObject(
    params.understandingV2,
    pickLocale(params.locale, ACTION_LOOP_COPY.fallbackObject),
  );

  if (params.understandingV2.requestType === "action_review") {
    const copy = ACTION_LOOP_COPY.actionReview;
    return {
      title: pickLocale(params.locale, copy.title)(object),
      description: pickLocale(params.locale, copy.description),
      category: "reflect",
      intensity: "active",
      estimatedMinutes: 20,
      dueDate,
    };
  }

  if (
    params.understandingV2.requestType === "career_decision" ||
    params.understandingV2.requestType === "jd_offer_analysis"
  ) {
    const copy = ACTION_LOOP_COPY.decision;
    return {
      title: pickLocale(params.locale, copy.title)(object),
      description: pickLocale(params.locale, copy.description),
      category: "reflect",
      intensity: "active",
      estimatedMinutes: 20,
      dueDate,
    };
  }

  const copy = ACTION_LOOP_COPY.defaultAction;
  return {
    title: pickLocale(params.locale, copy.title)(object),
    description: pickLocale(params.locale, copy.description)(object),
    category: "reflect",
    intensity: "active",
    estimatedMinutes: 20,
    dueDate,
  };
}
