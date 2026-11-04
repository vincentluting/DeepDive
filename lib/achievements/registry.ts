// ============================================================
// Achievement Registry — All 18 achievement definitions
//
// Design philosophy: "Insight is the reward"
// - Milestones mark genuine self-discovery moments
// - Hidden achievements create surprise & delight
// - No streaks, no leaderboards, no punishment
// - Aligned with Self-Determination Theory (autonomy, competence, relatedness)
//
// Reference: Scott Nicholson's RECIPE framework for meaningful gamification
// ============================================================

import type { AchievementDefinition } from '@/lib/types/achievement'

export const ACHIEVEMENT_REGISTRY: AchievementDefinition[] = [
  // ── Main Journey (Common/Uncommon) ─────────────────────────

  {
    key: 'first_dive',
    nameEn: 'First Dive',
    nameZh: '初次启航',
    descriptionEn: 'Completed your first Quick Dive assessment',
    descriptionZh: '完成了第一次快速探索',
    rarity: 'common',
    hidden: false,
    event: 'quick_dive_complete',
  },
  {
    key: 'deep_diver',
    nameEn: 'Deep Diver',
    nameZh: '深海潜水员',
    descriptionEn: 'Completed the full 86-question Deep Dive',
    descriptionZh: '完成了 86 题深度评估',
    rarity: 'uncommon',
    hidden: false,
    event: 'deep_dive_complete',
  },
  {
    key: 'self_portrait',
    nameEn: 'Self Portrait',
    nameZh: '认识自己',
    descriptionEn: 'Generated your personal profile for the first time',
    descriptionZh: '首次生成了个人档案',
    rarity: 'common',
    hidden: false,
    event: 'profile_generated',
  },
  {
    key: 'blueprint',
    nameEn: 'Blueprint',
    nameZh: '职业蓝图',
    descriptionEn: 'Generated your first career report',
    descriptionZh: '首次生成了职业报告',
    rarity: 'uncommon',
    hidden: false,
    event: 'report_generated',
  },
  {
    key: 'first_words',
    nameEn: 'First Words',
    nameZh: '对话开启',
    descriptionEn: 'Completed your first coaching conversation',
    descriptionZh: '完成了第一次教练对话',
    rarity: 'common',
    hidden: false,
    event: 'coaching_completed',
  },

  // ── Exploration (Uncommon) ─────────────────────────────────

  {
    key: 'speed_diver',
    nameEn: 'Speed Diver',
    nameZh: '速潜者',
    descriptionEn: 'Completed Quick Dive in under 5 minutes',
    descriptionZh: 'Quick Dive 用时不到 5 分钟',
    rarity: 'uncommon',
    hidden: true,
    event: 'quick_dive_complete',
    condition: (meta) => typeof meta.durationMs === 'number' && meta.durationMs < 5 * 60 * 1000,
  },
  {
    key: 'immersive_explorer',
    nameEn: 'Immersive Explorer',
    nameZh: '沉浸体验',
    descriptionEn: 'Completed the immersive exploration path',
    descriptionZh: '完成了沉浸式探索支线',
    rarity: 'uncommon',
    hidden: false,
    event: 'quick_dive_complete',
    condition: (meta) => meta.exploreMode === 'immersive',
  },
  {
    key: 'reality_check',
    nameEn: 'Reality Check',
    nameZh: '面对现实',
    descriptionEn: 'Completed your reality conditions assessment',
    descriptionZh: '完成了现实条件评估',
    rarity: 'uncommon',
    hidden: false,
    event: 'depth_updated',
    condition: (meta) => meta.module === 'realityCheck',
  },
  {
    key: 'action_starter',
    nameEn: 'Action Starter',
    nameZh: '行动派',
    descriptionEn: 'Completed your first action item',
    descriptionZh: '在 Action Hub 完成了第一个任务',
    rarity: 'uncommon',
    hidden: false,
    event: 'action_item_completed',
    condition: (meta) => meta.isFirst === true,
  },

  // ── Deep Engagement (Rare) ─────────────────────────────────

  {
    key: 'shadow_self',
    nameEn: 'Shadow Self',
    nameZh: '阴影面',
    descriptionEn: 'Explored your shadow dimensions in your profile',
    descriptionZh: '在档案中探索了阴影面板块',
    rarity: 'rare',
    hidden: true,
    event: 'profile_dimension_viewed',
    condition: (meta) => meta.dimension === 'shadow',
  },
  {
    key: 'deep_talk',
    nameEn: 'Deep Talk',
    nameZh: '深度对话',
    descriptionEn: 'Reached the maximum 10 rounds in a coaching session',
    descriptionZh: '教练对话达到了 10 轮',
    rarity: 'rare',
    hidden: false,
    event: 'coaching_completed',
    condition: (meta) => typeof meta.rounds === 'number' && meta.rounds >= 10,
  },
  {
    key: 'memory_echo',
    nameEn: 'Memory Echo',
    nameZh: '记忆共鸣',
    descriptionEn: 'The coach referenced memories you confirmed 3+ times',
    descriptionZh: '教练引用的记忆被你确认了 3 次以上',
    rarity: 'rare',
    hidden: true,
    event: 'coaching_completed',
    condition: (meta) => typeof meta.reinforcedCount === 'number' && meta.reinforcedCount >= 3,
  },
  {
    key: 'full_spectrum',
    nameEn: 'Full Spectrum',
    nameZh: '全维度',
    descriptionEn: 'Explored all 10 dimension cards in your profile',
    descriptionZh: '查看了档案中的全部 10 个维度卡片',
    rarity: 'rare',
    hidden: false,
    event: 'profile_dimension_viewed',
    condition: (meta) => typeof meta.totalViewed === 'number' && meta.totalViewed >= 10,
  },
  {
    key: 'direction_sense',
    nameEn: 'Direction Sense',
    nameZh: '方向感',
    descriptionEn: 'Saved 3+ career directions from your report',
    descriptionZh: '在报告中保存了 3 个以上的职业方向',
    rarity: 'uncommon',
    hidden: true,
    event: 'career_direction_saved',
    condition: (meta) => typeof meta.totalSaved === 'number' && meta.totalSaved >= 3,
  },
  {
    key: 'dual_lens',
    nameEn: 'Dual Lens',
    nameZh: '跨文化视角',
    descriptionEn: 'Viewed your report in a different language',
    descriptionZh: '切换语言后重新查看了报告',
    rarity: 'rare',
    hidden: true,
    event: 'locale_switched_report',
  },
  {
    key: 'returnee',
    nameEn: 'Returnee',
    nameZh: '回归者',
    descriptionEn: 'Regenerated your report after profile changes',
    descriptionZh: '档案变更后重新生成了报告',
    rarity: 'rare',
    hidden: true,
    event: 'report_regenerated',
  },

  // ── Epic (Completion) ──────────────────────────────────────

  {
    key: 'luminous_deep',
    nameEn: 'Luminous Deep',
    nameZh: '深渊之光',
    descriptionEn: 'Reached 2500m exploration depth',
    descriptionZh: '探索深度达到了 2500m',
    rarity: 'epic',
    hidden: false,
    event: 'depth_updated',
    condition: (meta) => typeof meta.depthM === 'number' && meta.depthM >= 2500,
  },
  {
    key: 'full_journey',
    nameEn: 'Full Journey',
    nameZh: '全旅程',
    descriptionEn: 'Unlocked coaching and completed an action plan',
    descriptionZh: '解锁教练并完成了行动计划',
    rarity: 'epic',
    hidden: false,
    event: 'action_item_completed',
    condition: (meta) => meta.hasCoaching === true && meta.planCompleted === true,
  },
]

/** Lookup: event → matching achievement definitions */
export function getAchievementsForEvent(event: string): AchievementDefinition[] {
  return ACHIEVEMENT_REGISTRY.filter((a) => a.event === event)
}

/** Lookup: key → definition */
export function getAchievementByKey(key: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_REGISTRY.find((a) => a.key === key)
}
