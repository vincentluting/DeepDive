// ============================================================
// Achievement System — Type Definitions
//
// Rarity tiers: common → uncommon → rare → epic
// Events: trigger keys fired by API routes / state transitions
// Hidden achievements: not visible until unlocked (surprise & delight)
// ============================================================

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic'

export type AchievementEvent =
  | 'quick_dive_complete'
  | 'deep_dive_complete'
  | 'profile_generated'
  | 'report_generated'
  | 'coaching_completed'
  | 'action_item_completed'
  | 'depth_updated'
  | 'profile_dimension_viewed'
  | 'career_direction_saved'
  | 'locale_switched_report'
  | 'report_regenerated'

export interface AchievementDefinition {
  key: string
  nameEn: string
  nameZh: string
  descriptionEn: string
  descriptionZh: string
  rarity: AchievementRarity
  hidden: boolean
  event: AchievementEvent
  condition?: (metadata: Record<string, unknown>) => boolean
}

export interface UserAchievementRecord {
  id: string
  userId: string
  achievementKey: string
  unlockedAt: string
  metadata: Record<string, unknown>
}
