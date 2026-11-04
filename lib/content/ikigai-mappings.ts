// Ikigai content mappings — bilingual labels for RIASEC aptitudes, Schwartz value
// circles, and Collaboration-Style strengths. Used by the Meaning Compass chapter
// to surface the cross-framework "ikigai zone" (themes appearing in >=2 circles).
//
// Kept in lib/content/ to avoid i18n lint false positives on Chinese in component files.

import type { RIASECDimension, SchwartzValue, CollabStyle } from "../types";
import type { IkigaiItem } from "../types/platform";

/**
 * Cross-framework theme keys.
 *
 * The same theme can be sourced from a Schwartz value (love/need circle),
 * a RIASEC dimension (goodAt circle), or a Collaboration Style (goodAt circle).
 * When the same themeKey shows up in >=2 circles → that's the user's "ikigai zone."
 *
 * NOTE: This is not a measurement claim. We're using validated dimensions as
 * proxies for projection-style themes. Surface honestly in UI.
 */
export type MeaningTheme =
  | "creative_autonomy"
  | "helping_others"
  | "achievement_influence"
  | "truth_seeking"
  | "order_stability"
  | "tangible_making"
  | "novelty_thrill"
  | "joy_pleasure";

/** Map RIASEC top dimensions to "what you're naturally drawn to" (goodAt circle) */
export const RIASEC_APTITUDE: Record<
  RIASECDimension,
  { themeKey: MeaningTheme; en: string; zh: string }
> = {
  R: {
    themeKey: "tangible_making",
    en: "Building & making tangible things",
    zh: "构建和创造实物",
  },
  I: {
    themeKey: "truth_seeking",
    en: "Analyzing & solving complex problems",
    zh: "分析和解决复杂问题",
  },
  A: {
    themeKey: "creative_autonomy",
    en: "Creating & expressing original ideas",
    zh: "创作和表达原创想法",
  },
  S: {
    themeKey: "helping_others",
    en: "Helping & developing people",
    zh: "帮助和培养他人",
  },
  E: {
    themeKey: "achievement_influence",
    en: "Leading & driving initiatives",
    zh: "引领和推动项目",
  },
  C: {
    themeKey: "order_stability",
    en: "Organizing & optimizing systems",
    zh: "组织和优化系统",
  },
};

/**
 * Map Schwartz values to Ikigai circle ('love' or 'need') + theme key.
 *
 * Theme assignments:
 * - self-direction → creative_autonomy (overlaps with RIASEC A, Collab D)
 * - stimulation → novelty_thrill (no direct RIASEC match — exploratory drive)
 * - hedonism → joy_pleasure (no direct RIASEC match — felt-meaning)
 * - achievement → achievement_influence (overlaps with RIASEC E, Collab D)
 * - power → achievement_influence (same theme as achievement — both agency)
 * - benevolence → helping_others (overlaps with RIASEC S, Collab I)
 * - universalism → truth_seeking (overlaps with RIASEC I — shared "for all" + "examining")
 * - conformity → order_stability (overlaps with RIASEC C, Collab S)
 * - tradition → order_stability (same theme — preserving the given)
 * - security → order_stability (same theme — stability)
 *
 * IMPORTANT: keys here MUST match SchwartzValue type ('self-direction' with hyphen,
 * not 'self_direction' with underscore).
 */
export const VALUE_TO_IKIGAI: Record<
  SchwartzValue,
  { circle: "love" | "need"; themeKey: MeaningTheme; en: string; zh: string }
> = {
  "self-direction": {
    circle: "love",
    themeKey: "creative_autonomy",
    en: "Autonomy & creative freedom",
    zh: "自主与创造自由",
  },
  stimulation: {
    circle: "love",
    themeKey: "novelty_thrill",
    en: "Novelty & exciting challenges",
    zh: "新鲜感与刺激性挑战",
  },
  hedonism: {
    circle: "love",
    themeKey: "joy_pleasure",
    en: "Enjoyment & meaningful pleasure",
    zh: "享受与有意义的愉悦",
  },
  achievement: {
    circle: "love",
    themeKey: "achievement_influence",
    en: "Mastery & personal excellence",
    zh: "精进与卓越",
  },
  power: {
    circle: "love",
    themeKey: "achievement_influence",
    en: "Influence & impact",
    zh: "影响力与掌控",
  },
  benevolence: {
    circle: "need",
    themeKey: "helping_others",
    en: "Helping those close to you",
    zh: "帮助身边的人",
  },
  universalism: {
    circle: "need",
    themeKey: "truth_seeking",
    en: "Justice & care for all",
    zh: "公正与对所有人的关怀",
  },
  conformity: {
    circle: "need",
    themeKey: "order_stability",
    en: "Social harmony & shared norms",
    zh: "社会和谐与共识",
  },
  tradition: {
    circle: "need",
    themeKey: "order_stability",
    en: "Preserving cultural wisdom",
    zh: "传承文化智慧",
  },
  security: {
    circle: "need",
    themeKey: "order_stability",
    en: "Stability & safety for all",
    zh: "稳定与安全",
  },
};

/**
 * Map Collaboration Style (Big Five-derived) to "natural strengths" labels.
 * Used for the goodAt Ikigai circle alongside RIASEC aptitudes.
 *
 * Style brand names (from dimensions.ts):
 *   D = Leading/引领型
 *   I = Inspiring/激发型
 *   S = Anchoring/稳健型
 *   C = Refining/精研型
 */
export const COLLAB_STRENGTH: Record<
  CollabStyle,
  { themeKey: MeaningTheme; en: string; zh: string }
> = {
  D: {
    themeKey: "achievement_influence",
    en: "Driving decisions forward",
    zh: "推动决策落地",
  },
  I: {
    themeKey: "helping_others",
    en: "Energizing & inspiring others",
    zh: "激发与鼓舞他人",
  },
  S: {
    themeKey: "order_stability",
    en: "Anchoring teams steadily",
    zh: "稳定锚定团队",
  },
  C: {
    themeKey: "truth_seeking",
    en: "Refining details with rigor",
    zh: "严谨打磨细节",
  },
};

/**
 * Merge IkigaiItems that share the same themeKey across frameworks.
 *
 * Returns a NEW array; does not mutate input. Two items with the same themeKey
 * are merged: their `circles` and `sources` arrays are union'd. Each themeKey
 * appears exactly once in the output, carrying the union of all circles it
 * participated in across input items.
 *
 * Items in the result with circles.length >= 2 are the "ikigai zone" — themes
 * that simultaneously matter to the user (love/need) AND tap their natural
 * strengths (goodAt). These are the strongest signals for meaning narrative.
 *
 * Label preference when merging: keeps the first item's label_en/label_zh
 * (callers should pass items in priority order: Schwartz first, then RIASEC,
 * then Collab — so meaning-loaded labels win over capability-loaded labels).
 */
export function mergeIkigaiByTheme(items: IkigaiItem[]): IkigaiItem[] {
  const byTheme = new Map<string, IkigaiItem>();
  for (const item of items) {
    const existing = byTheme.get(item.themeKey);
    if (existing) {
      for (const c of item.circles) {
        if (!existing.circles.includes(c)) existing.circles.push(c);
      }
      for (const s of item.sources) {
        if (!existing.sources.includes(s)) existing.sources.push(s);
      }
    } else {
      byTheme.set(item.themeKey, {
        ...item,
        circles: [...item.circles],
        sources: [...item.sources],
      });
    }
  }
  return Array.from(byTheme.values());
}
