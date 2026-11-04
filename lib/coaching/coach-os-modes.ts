// ============================================================
// Coach OS modes — productized entry points for AI coaching
// ============================================================

export const COACH_OS_MODE_IDS = [
  "understand_report",
  "real_choice",
  "stuck_pattern",
  "jd_offer",
  "role_play",
  "action_review",
  "ai_anxiety",
] as const;

export type CoachOSModeId = (typeof COACH_OS_MODE_IDS)[number];

export interface CoachOSMode {
  id: CoachOSModeId;
  labelKey: string;
  promptMode: string;
  evalRubric: string;
  intent: {
    zh: string;
    en: string;
  };
}

export const coachOSModes: CoachOSMode[] = [
  {
    id: "understand_report",
    labelKey: "coachOsUnderstandReport",
    promptMode: "report_explanation",
    evalRubric: "must cite report evidence and answer pushback directly",
    intent: {
      zh: "我想理解报告",
      en: "I want to understand my report",
    },
  },
  {
    id: "real_choice",
    labelKey: "coachOsRealChoice",
    promptMode: "career_decision",
    evalRubric: "must identify decision criteria, reality constraints, and one next question",
    intent: {
      zh: "我有一个现实选择",
      en: "I have a real choice",
    },
  },
  {
    id: "stuck_pattern",
    labelKey: "coachOsStuckPattern",
    promptMode: "pattern_diagnosis",
    evalRubric: "must form a testable hypothesis and avoid generic self-discovery language",
    intent: {
      zh: "我想看懂自己反复卡住的模式",
      en: "I want to understand my recurring stuck pattern",
    },
  },
  {
    id: "jd_offer",
    labelKey: "coachOsJdOffer",
    promptMode: "jd_offer_analysis",
    evalRubric: "must analyze concrete JD or offer details before coaching questions",
    intent: {
      zh: "我想分析 JD / offer",
      en: "I want to analyze a JD / offer",
    },
  },
  {
    id: "role_play",
    labelKey: "coachOsRolePlay",
    promptMode: "role_play",
    evalRubric: "must run a 2-4 round simulation and produce feedback dimensions",
    intent: {
      zh: "我想练一次对话",
      en: "I want to practice a conversation",
    },
  },
  {
    id: "action_review",
    labelKey: "coachOsActionReview",
    promptMode: "action_review",
    evalRubric: "must review completion, resistance, pattern, and adjusted action",
    intent: {
      zh: "我想复盘上次行动",
      en: "I want to review my last action",
    },
  },
  {
    id: "ai_anxiety",
    labelKey: "coachOsAiAnxiety",
    promptMode: "ai_anxiety_reframing",
    evalRubric: "must name the concrete AI anxiety picture and avoid reassurance-first replies",
    intent: {
      zh: "我对 AI / 未来职业焦虑",
      en: "I'm anxious about AI / future careers",
    },
  },
];

const AI_ANXIETY_MARKER = {
  zh: "; AI 时代焦虑",
  en: "; AI Era Anxiety",
} as const;

export function buildCoachOSModeTrigger(
  modeId: CoachOSModeId,
  locale: string,
): string {
  const mode = coachOSModes.find((item) => item.id === modeId);
  if (!mode) {
    throw new Error(`Unknown Coach OS mode: ${modeId}`);
  }
  const intent = locale === "zh" ? mode.intent.zh : mode.intent.en;
  const anxietyMarker =
    mode.id === "ai_anxiety"
      ? locale === "zh"
        ? AI_ANXIETY_MARKER.zh
        : AI_ANXIETY_MARKER.en
      : "";
  return `Coach OS mode=${mode.id}; promptMode=${mode.promptMode}; userIntent="${intent}"${anxietyMarker}; evalRubric="${mode.evalRubric}"`;
}
