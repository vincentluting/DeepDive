// ============================================================
// Deep Dive — Memory System Types
// Structured memory entries for AI coaching persistence
// ============================================================

export type MemoryCategory =
  | 'personality'
  | 'values'
  | 'behavior'
  | 'career'
  | 'constraint'
  | 'motivation'
  | 'blindspot'
  | 'strength'
  | 'coaching_insight';

export type MemorySource = 'questionnaire' | 'report' | 'profile' | 'coaching' | 'manual';

export interface UserMemory {
  id: string;
  userId: string;
  category: MemoryCategory;
  keyword: string;
  insight: string;
  source: MemorySource;
  confidence: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Input shape for creating new memory entries (before DB assignment of id/timestamps) */
export interface MemoryEntry {
  category: MemoryCategory;
  keyword: string;
  insight: string;
  source: MemorySource;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** Lucide icon name for each category (rendered by memory-panel) */
export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, { zh: string; en: string; icon: string }> = {
  personality:      { zh: '性格特质', en: 'Personality',    icon: 'Fingerprint' },
  values:           { zh: '价值观',   en: 'Values',         icon: 'Compass' },
  behavior:         { zh: '行为模式', en: 'Behavior',       icon: 'Activity' },
  career:           { zh: '职业倾向', en: 'Career',         icon: 'Navigation' },
  constraint:       { zh: '现实约束', en: 'Constraints',    icon: 'Anchor' },
  motivation:       { zh: '动力来源', en: 'Motivation',     icon: 'Flame' },
  blindspot:        { zh: '盲点',     en: 'Blind Spots',    icon: 'Eye' },
  strength:         { zh: '核心优势', en: 'Strengths',      icon: 'Sparkles' },
  coaching_insight: { zh: '教练洞察', en: 'Coaching',       icon: 'MessageCircle' },
};

/**
 * Brand-aligned color accents for memory categories.
 * Uses primary blue at varying opacities + one warm accent,
 * instead of rainbow Tailwind colors, to match Deep Dive's
 * restrained ocean color palette.
 */
export const MEMORY_CATEGORY_COLORS: Record<MemoryCategory, string> = {
  personality:      'bg-primary/8 text-primary border-primary/15',
  values:           'bg-primary/8 text-primary border-primary/15',
  behavior:         'bg-primary/8 text-primary border-primary/15',
  career:           'bg-primary/8 text-primary border-primary/15',
  constraint:       'bg-muted text-muted-foreground border-border',
  motivation:       'bg-primary/8 text-primary border-primary/15',
  blindspot:        'bg-muted text-muted-foreground border-border',
  strength:         'bg-primary/8 text-primary border-primary/15',
  coaching_insight: 'bg-primary/8 text-primary border-primary/15',
};
