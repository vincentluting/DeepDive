// ============================================================
// Immersive Engine — State & Action Types
// ============================================================

import type { ChapterKey, RiasecKey, ImmersiveCharacter } from "../data";
import type { AvatarGender } from "@/components/quickdive/archetype-avatar-asset";
import type { Archetype } from "@/lib/types";

// ── Phase ────────────────────────────────────────────────────

export type ImmersivePhase =
  | "envelope" // 黑色信封动画
  | "invitation" // 邀请函展示
  | "rules" // 游戏规则说明
  | "characters" // 六位同行者介绍
  | "playing" // 答题阶段
  | "chapter-transition" // 章节过渡
  | "avatar-gender" // avatar style selection
  | "generating" // 生成结果
  | "revelation" // 镜子揭晓（悬念闭环）
  | "result"; // 结果页

// ── Result ───────────────────────────────────────────────────

export interface ImmersiveResult {
  scores: Record<RiasecKey, number>;
  ranked: RiasecKey[];
  primaryDimension: RiasecKey;
  secondaryDimension: RiasecKey;
  primaryNarrative: string;
  secondaryNarrative: string;
  characterPaths: {
    character: ImmersiveCharacter;
    scores: Record<RiasecKey, number>;
  }[];
  /** 12-type archetype derived from RIASEC + TwIVI value orientation.
   *  Identical pipeline to Quick Dive so the result page renders identically. */
  archetype: Archetype;
}

// ── State ────────────────────────────────────────────────────

export interface ImmersiveState {
  phase: ImmersivePhase;
  currentQuestionIndex: number; // 0-37 (38 questions total)
  answers: Record<number, number>; // questionId → score (1-5 RIASEC, 1-6 TwIVI)
  pendingChapterTransition: {
    fromChapterKey: ChapterKey;
    toChapterKey: ChapterKey;
  } | null;
  result: ImmersiveResult | null;
  genStep: number; // 0-5
  savedReportId: string | null;
  /** Avatar gender. null = skipped or not yet picked. */
  avatarGender: AvatarGender | null;
}

export const INITIAL_STATE: ImmersiveState = {
  phase: "envelope",
  currentQuestionIndex: 0,
  answers: {},
  pendingChapterTransition: null,
  result: null,
  genStep: 0,
  savedReportId: null,
  avatarGender: null,
};

// ── Session-storage intro skip ───────────────────────────────
// First visit  → full intro (envelope → invitation → rules → characters)
// Same-session → skip straight to "rules"
// Redive       → RESET action returns phase "characters"

const INTRO_SEEN_KEY = "immersive-intro-seen";

export function getInitialPhase(): ImmersivePhase {
  if (typeof window === "undefined") return "envelope";
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) ? "rules" : "envelope";
  } catch {
    return "envelope";
  }
}

export function markIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* SSR / private-mode — non-critical */
  }
}

// ── Actions ──────────────────────────────────────────────────

export type ImmersiveAction =
  // Phase override (intro 组件直接调用 setPhase，保持向后兼容)
  | { type: "SET_PHASE"; phase: ImmersivePhase }

  // 答题 — atomically advances to the next question (or chapter transition,
  // or avatar-gender picker if this was the last question). Mirror feedback
  // is shown by the host shell as a non-blocking toast, not a state field.
  | { type: "RECORD_ANSWER"; questionId: number; score: number }

  // 题目推进（保留供 chapter-transition 完成回调使用）
  | { type: "COMPLETE_CHAPTER_TRANSITION" }
  | { type: "GO_TO_PREVIOUS_QUESTION" }

  // Avatar style selection
  | { type: "SUBMIT_AVATAR_GENDER"; avatarGender: AvatarGender | null }

  // 生成动画
  | { type: "GEN_STEP"; step: number }

  // 结果
  | {
      type: "SET_RESULT";
      result: ImmersiveResult;
      savedReportId: string | null;
    }

  // 镜子揭晓完成 → 进入结果页
  | { type: "COMPLETE_REVELATION" }

  // 恢复保存的会话
  | {
      type: "RESTORE_SESSION";
      phase: ImmersivePhase;
      currentQuestionIndex: number;
      answers: Record<number, number>;
    }

  // 重置
  | { type: "RESET" };
