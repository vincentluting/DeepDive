// ============================================================
// Immersive Explore「第零局」2.0 — Type Definitions
// ============================================================
// Ch.1-6: Mini-IP 1:1 精确映射 (30 RIASEC questions, 5-point)
// Ch.7:   TwIVI 价值观 (8 Schwartz value items, 6-point)
// ============================================================

// ── 多语言文本 ──────────────────────────────────────────────
// zh/en 为必填（原有内容），其他语言可选，pickText 回退到 en
export interface BilingualText {
  zh: string;
  en: string;
  nl?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  it?: string;
  ru?: string;
  ja?: string;
  ko?: string;
}

export type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C";

// 7 个章节: Ch.1-6 每章 5 题 (RIASEC), Ch.7 共 8 题 (TwIVI)
export type ChapterKey =
  | "mechanical"
  | "laboratory"
  | "theater"
  | "waiting"
  | "negotiation"
  | "archive"
  | "values";

// 镜面反馈：Ch.1-6 用 score1-5, Ch.7 额外用 score6
export interface MirrorFeedback {
  score1: BilingualText; // 5pt: 完全不想 / 6pt: 完全不像我
  score2: BilingualText; // 5pt: 不太想   / 6pt: 不像我
  score3: BilingualText; // 5pt: 无所谓   / 6pt: 有一点像我
  score4: BilingualText; // 5pt: 比较想   / 6pt: 比较像我
  score5: BilingualText; // 5pt: 非常想   / 6pt: 像我
  score6?: BilingualText; // 6pt only: 非常像我 (Ch.7 TwIVI)
}

export interface ImmersiveQuestion {
  id: number; // 1-38
  riasec?: RiasecKey; // Ch.1-6: RIASEC key; Ch.7: undefined (values, not interests)
  miniIpCode: string; // Mini-IP "R3" / TwIVI "TW3"
  miniIpItem: string; // Mini-IP original text / TwIVI original text
  chapter: ChapterKey;
  chapterIndex: number; // 1-7
  questionInChapter: number; // Ch.1-6: 1-5; Ch.7: 1-8
  isClimax: boolean;
  scene: BilingualText;
  taskDescription: BilingualText;
  mirrorFeedback: MirrorFeedback;
  /** Likert scale max (5 for RIASEC, 6 for TwIVI). Defaults to 5 when omitted. */
  scaleMax?: number;
  /** TwIVI item ID (3,4,8,9,13,14,18,19) for value scoring bridge. Ch.7 only. */
  twiviItemId?: number;
  /**
   * Optional companion presence beat. When set, the matching character's portrait
   * appears in the question page corner with this short reaction line. Pure UI layer —
   * does NOT affect scoring or answer flow (paper research equivalence is preserved).
   */
  companionBeat?: {
    characterId: string;
    reaction: BilingualText;
  };
}

export interface ImmersiveCharacter {
  id: string;
  name: BilingualText; // 中文站显示中文名，英文站显示英文名
  description: BilingualText; // 一句话性格描述
  riasec: RiasecKey; // 对应的隐性类型（不对用户展示）
  // 该角色在38题中的"示范评分"（用于结果页彩蛋）
  demoScores: number[]; // 38个分值，对应Q1-Q38
  /** Editorial portrait at /public/immersive/characters/{id}.webp — used in characters intro & question page hint */
  portraitUrl?: string;
}

export interface ChapterConfig {
  key: ChapterKey;
  index: number; // 1-7
  riasec?: RiasecKey; // Ch.7 has no RIASEC association
  title: BilingualText; // 章节名，如「机械室」/ "The Machine Room"
  entryNarrative: BilingualText; // 进入章节的叙事段落
  transitionNarrative: BilingualText; // 离开章节的过场
  // 大任务描述（显示在进度圈旁）
  missionBrief: BilingualText;
  // 五个子任务标签（对应进度圈的五段）
  subTasks: BilingualText[];
  // 视觉主题
  accentColor: string;
  bgGradient: string;
  /** Subtle CSS background pattern for chapter environmental personality (opacity ≤ 0.06) */
  decorCSS?: string;
  /** Cinematic environment painting at /public/immersive/scenes/{key}.webp — hero in transitions, ambient backdrop in question page */
  sceneImageUrl?: string;
}
