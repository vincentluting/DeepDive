// ============================================================
// Immersive Explore「第零局」2.0 — Master Index
// ============================================================
// 38 题数据汇总: 30 RIASEC (Ch.1-6) + 8 TwIVI (Ch.7)
// ============================================================

// ── 类型导出 ─────────────────────────────────────────────────
export type {
  BilingualText,
  RiasecKey,
  ChapterKey,
  MirrorFeedback,
  ImmersiveQuestion,
  ImmersiveCharacter,
  ChapterConfig,
} from "./types";

// ── 配置导出 ─────────────────────────────────────────────────
export { CHAPTERS } from "./chapters-config";
export { CHARACTERS } from "./characters";

// ── 各章题目导出 ─────────────────────────────────────────────
export { CHAPTER1_QUESTIONS } from "./chapter1-mechanical";
export { CHAPTER2_QUESTIONS } from "./chapter2-laboratory";
export { CHAPTER3_QUESTIONS } from "./chapter3-theater";
export { CHAPTER4_QUESTIONS } from "./chapter4-waiting-room";
export { CHAPTER5_QUESTIONS } from "./chapter5-negotiation";
export { CHAPTER6_QUESTIONS } from "./chapter6-archive";
export { CHAPTER7_QUESTIONS } from "./chapter7-values";

// ── 汇总 38 题 ──────────────────────────────────────────────
import { CHAPTER1_QUESTIONS } from "./chapter1-mechanical";
import { CHAPTER2_QUESTIONS } from "./chapter2-laboratory";
import { CHAPTER3_QUESTIONS } from "./chapter3-theater";
import { CHAPTER4_QUESTIONS } from "./chapter4-waiting-room";
import { CHAPTER5_QUESTIONS } from "./chapter5-negotiation";
import { CHAPTER6_QUESTIONS } from "./chapter6-archive";
import { CHAPTER7_QUESTIONS } from "./chapter7-values";

import type { BilingualText, MirrorFeedback, ImmersiveQuestion } from "./types";

export const IMMERSIVE_QUESTIONS: ImmersiveQuestion[] = [
  ...CHAPTER1_QUESTIONS, // Q1-Q5   机械室 (R)
  ...CHAPTER2_QUESTIONS, // Q6-Q10  研究空间 (I)
  ...CHAPTER3_QUESTIONS, // Q11-Q15 剧场 (A)
  ...CHAPTER4_QUESTIONS, // Q16-Q20 等候室 (S)
  ...CHAPTER5_QUESTIONS, // Q21-Q25 谈判层 (E)
  ...CHAPTER6_QUESTIONS, // Q26-Q30 档案室 (C)
  ...CHAPTER7_QUESTIONS, // Q31-Q38 零号房间 (TwIVI Values)
];

// ── 38 题映射速查表 ─────────────────────────────────────────
// Q1-Q5:   R (mechanical)  — R3, R2, R5, R1*, R4
// Q6-Q10:  I (laboratory)  — I2, I3, I4, I1*, I5
// Q11-Q15: A (theater)     — A1, A2, A3, A4*, A5
// Q16-Q20: S (waiting)     — S1, S2, S3, S4*, S5
// Q21-Q25: E (negotiation) — E1, E2, E3, E4*, E5
// Q26-Q30: C (archive)     — C1, C2, C3, C4*, C5
// Q31-Q38: values (零室)   — TW3, TW13, TW4, TW14*, TW8, TW18, TW9, TW19
// * = isClimax

// ── 双语工具函数 ────────────────────────────────────────────
// 与 lib/content/ 系列保持一致的 locale 选择模式

/**
 * 从 BilingualText 对象中取出当前 locale 的文本。
 * 非 en/zh locale fallback 到 en。
 */
export function pickText(obj: BilingualText, locale: string): string {
  if (locale === "zh") return obj.zh;
  const val = (obj as unknown as Record<string, string | undefined>)[locale];
  if (val) return val;
  return obj.en;
}

/**
 * 从 MirrorFeedback 中按分值取出当前 locale 的反馈文本。
 * Supports 6-point scale (Ch.7 TwIVI). Falls back to score5 if score6 is absent.
 */
export function pickMirrorText(
  mf: MirrorFeedback,
  score: 1 | 2 | 3 | 4 | 5 | 6,
  locale: string,
): string {
  // Range guard — clamp to valid 1-6 range
  const s = Math.max(1, Math.min(6, score)) as 1 | 2 | 3 | 4 | 5 | 6;
  if (s === 6) {
    return mf.score6
      ? pickText(mf.score6, locale)
      : pickText(mf.score5, locale);
  }
  const key = `score${s}` as keyof MirrorFeedback;
  return pickText(mf[key] as BilingualText, locale);
}

// ── 评分 & 排名导出 ──────────────────────────────────────────
export {
  computeImmersiveScores,
  getRankedDimensions,
  extractTwiviAnswers,
} from "./scoring";

// ── UI 内容导出 ──────────────────────────────────────────────
export {
  DIMENSION_IMMERSIVE,
  GENERATING_STEPS,
  CHAPTER_COMPLETION_MESSAGES,
  INVITATION,
  RULES,
  toBilingualLocale,
  resolveLocale,
} from "./ui-chrome";
export {
  REVELATION_ACT1,
  REVELATION_ACT2,
  REVELATION_ACT3,
  REVELATION_LEDGER,
  REVELATION_FINALE,
} from "./ui-chrome";
export type {
  InvitationContent,
  RulesContent,
  RevelationSegment,
} from "./ui-chrome";

// ── 设计令牌导出 ──────────────────────────────────────────────
export {
  C,
  T,
  GRADIENTS,
  getLikertButtonStyle,
  getCtaStyle,
} from "./immersive-tokens";
export type { LikertButtonStyle } from "./immersive-tokens";
