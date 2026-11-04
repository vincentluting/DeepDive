// ============================================================
// Guided Exercises — Career Planning Exercise Definitions
//
// Pure content + logic — no DB, no LLM calls.
// Exercises are structured career planning activities that
// guide users from confusion to clarity.
//
// v1: Non-Negotiables (3 deal-breakers from 18 options)
// v2: Flow Moments (recall 3 flow experiences, tag patterns)
// v3: Energy Log (7-day challenge, 1 energizer + 1 drain per day)
// ============================================================

// ── Non-Negotiables Exercise ─────────────────────────────────
//
// Professional career counseling framework:
// - Values tell you WHERE to go (Schwartz covers this)
// - Non-Negotiables tell you WHEN TO WALK AWAY (this exercise)
//
// Users select from 18 options across 5 dimensions,
// then force-rank their top 3.
// The "giving up" process IS the exercise's core value.

export type NonNegotiableDimension =
  | 'financial'
  | 'location'
  | 'time'
  | 'culture'
  | 'growth';

export interface NonNegotiableOption {
  id: string;
  dimension: NonNegotiableDimension;
  /** Icon hint for UI (lucide icon name) */
  icon: string;
}

/**
 * 18 non-negotiable options across 5 dimensions.
 * Labels come from i18n: `actionHub.exercises.nonNegotiables.options.{id}`
 */
export const NON_NEGOTIABLE_OPTIONS: NonNegotiableOption[] = [
  // 💰 Financial (4 options)
  { id: 'min_salary',        dimension: 'financial', icon: 'Banknote' },
  { id: 'equity_upside',     dimension: 'financial', icon: 'TrendingUp' },
  { id: 'benefits_package',  dimension: 'financial', icon: 'Shield' },
  { id: 'pay_transparency',  dimension: 'financial', icon: 'Eye' },

  // 📍 Location & Format (4 options)
  { id: 'remote_work',       dimension: 'location', icon: 'Laptop' },
  { id: 'short_commute',     dimension: 'location', icon: 'Navigation' },
  { id: 'specific_city',     dimension: 'location', icon: 'MapPin' },
  { id: 'visa_sponsorship',  dimension: 'location', icon: 'Stamp' },

  // ⏰ Time & Rhythm (3 options)
  { id: 'work_life_balance', dimension: 'time', icon: 'Scale' },
  { id: 'flexible_hours',    dimension: 'time', icon: 'Clock' },
  { id: 'no_overtime',       dimension: 'time', icon: 'CalendarOff' },

  // 🏢 Culture & Environment (4 options)
  { id: 'flat_hierarchy',    dimension: 'culture', icon: 'Network' },
  { id: 'team_diversity',    dimension: 'culture', icon: 'Globe' },
  { id: 'psych_safety',      dimension: 'culture', icon: 'Heart' },
  { id: 'small_team',        dimension: 'culture', icon: 'Users' },

  // 🎯 Growth & Purpose (3 options)
  { id: 'learning_budget',   dimension: 'culture', icon: 'GraduationCap' },
  { id: 'career_path',       dimension: 'growth', icon: 'Milestone' },
  { id: 'meaningful_work',   dimension: 'growth', icon: 'Sparkles' },
];

/** User's completed non-negotiables selection */
export interface NonNegotiablesResult {
  /** Exactly 3 option IDs, in priority order (index 0 = highest priority) */
  selected: [string, string, string];
  /** ISO timestamp */
  completedAt: string;
}

/**
 * Validate a non-negotiables selection.
 * Returns null if valid, error key if invalid.
 */
export function validateNonNegotiables(
  selected: string[],
): string | null {
  if (selected.length !== 3) return 'mustSelectExactly3';
  const validIds = new Set(NON_NEGOTIABLE_OPTIONS.map(o => o.id));
  if (selected.some(id => !validIds.has(id))) return 'invalidOption';
  if (new Set(selected).size !== 3) return 'noDuplicates';
  return null;
}


// ── Flow Moments Exercise ─────────────────────────────────
//
// Csikszentmihalyi's Flow: the state where you lose track of time.
// Users recall 3 moments, tag each with activity type + social setting + environment.
// Cross-analysis of 3 moments reveals talent signals.

export type FlowActivityTag =
  | 'creating'    // designing, writing, building
  | 'analyzing'   // researching, solving puzzles, debugging
  | 'teaching'    // explaining, mentoring, presenting
  | 'organizing'  // planning, structuring, managing
  | 'fixing'      // repairing, troubleshooting, optimizing
  | 'performing'  // presenting, competing, improvising
  | 'connecting'  // networking, mediating, collaborating
  | 'exploring';  // discovering, traveling, experimenting

export type FlowSocialTag = 'alone' | 'with_people' | 'mixed';
export type FlowEnvironmentTag = 'quiet' | 'lively' | 'outdoor' | 'online';

export interface FlowMomentEntry {
  /** Free text: "What were you doing?" (max 120 chars) */
  description: string;
  activity: FlowActivityTag;
  social: FlowSocialTag;
  environment: FlowEnvironmentTag;
}

export interface FlowMomentsResult {
  moments: [FlowMomentEntry, FlowMomentEntry, FlowMomentEntry];
  completedAt: string;
}

/** All valid tag options for UI rendering */
export const FLOW_ACTIVITY_TAGS: FlowActivityTag[] = [
  'creating', 'analyzing', 'teaching', 'organizing',
  'fixing', 'performing', 'connecting', 'exploring',
];

export const FLOW_SOCIAL_TAGS: FlowSocialTag[] = ['alone', 'with_people', 'mixed'];
export const FLOW_ENVIRONMENT_TAGS: FlowEnvironmentTag[] = ['quiet', 'lively', 'outdoor', 'online'];

/**
 * Validate a flow moments submission.
 * Returns null if valid, error key if invalid.
 */
export function validateFlowMoments(
  moments: FlowMomentEntry[],
): string | null {
  if (moments.length !== 3) return 'mustRecall3';
  for (const m of moments) {
    if (!m.description || m.description.trim().length < 3) return 'descriptionRequired';
    if (!FLOW_ACTIVITY_TAGS.includes(m.activity)) return 'invalidActivity';
    if (!FLOW_SOCIAL_TAGS.includes(m.social)) return 'invalidSocial';
    if (!FLOW_ENVIRONMENT_TAGS.includes(m.environment)) return 'invalidEnvironment';
  }
  return null;
}

/**
 * Analyze patterns across 3 flow moments.
 * Returns the dominant tags — useful for coaching and profile enrichment.
 */
export function analyzeFlowPatterns(moments: FlowMomentEntry[]): {
  dominantActivity: FlowActivityTag | null;
  dominantSocial: FlowSocialTag | null;
  dominantEnvironment: FlowEnvironmentTag | null;
} {
  const activityCounts = new Map<FlowActivityTag, number>();
  const socialCounts = new Map<FlowSocialTag, number>();
  const envCounts = new Map<FlowEnvironmentTag, number>();

  for (const m of moments) {
    activityCounts.set(m.activity, (activityCounts.get(m.activity) ?? 0) + 1);
    socialCounts.set(m.social, (socialCounts.get(m.social) ?? 0) + 1);
    envCounts.set(m.environment, (envCounts.get(m.environment) ?? 0) + 1);
  }

  const topOf = <T>(map: Map<T, number>): T | null => {
    let best: T | null = null;
    let max = 0;
    for (const [key, count] of map) {
      if (count > max) { max = count; best = key; }
    }
    // Only return if appears in 2+ of 3 moments (pattern, not noise)
    return max >= 2 ? best : null;
  };

  return {
    dominantActivity: topOf(activityCounts),
    dominantSocial: topOf(socialCounts),
    dominantEnvironment: topOf(envCounts),
  };
}


// ── Energy Log Exercise ───────────────────────────────────
//
// 7-day challenge: each day log 1 energizer + 1 drain.
// After 7 days, algorithm generates an energy map.
// Cross-validates with Career Drain data from report.

export type EnergyRating = 1 | 2 | 3 | 4 | 5;

export interface EnergyLogEntry {
  day: number; // 1-7
  energizer: string; // free text, max 80 chars
  drain: string;     // free text, max 80 chars
  overallEnergy: EnergyRating;
  date: string; // ISO date string
}

export interface EnergyLogResult {
  entries: EnergyLogEntry[];
  completedAt: string | null; // null = in progress
  startedAt: string;
}

/**
 * Validate a single energy log entry.
 */
export function validateEnergyEntry(entry: EnergyLogEntry): string | null {
  if (entry.day < 1 || entry.day > 7) return 'invalidDay';
  if (!entry.energizer || entry.energizer.trim().length < 2) return 'energizerRequired';
  if (!entry.drain || entry.drain.trim().length < 2) return 'drainRequired';
  if (entry.overallEnergy < 1 || entry.overallEnergy > 5) return 'invalidRating';
  return null;
}

/**
 * Analyze 7 days of energy data.
 * Returns word frequency patterns for energizers and drains.
 */
export function analyzeEnergyPatterns(entries: EnergyLogEntry[]): {
  avgEnergy: number;
  energizerKeywords: string[];
  drainKeywords: string[];
  trend: 'rising' | 'falling' | 'stable';
} {
  if (entries.length === 0) {
    return { avgEnergy: 0, energizerKeywords: [], drainKeywords: [], trend: 'stable' };
  }

  const avg = entries.reduce((sum, e) => sum + e.overallEnergy, 0) / entries.length;

  // Simple keyword extraction: split, filter short words, count frequency
  const extractKeywords = (texts: string[]): string[] => {
    const wordCounts = new Map<string, number>();
    for (const text of texts) {
      const words = text.toLowerCase().split(/[\s,;.!?]+/).filter(w => w.length > 2);
      for (const w of words) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
    }
    return [...wordCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  };

  // Trend: compare first half vs second half average energy
  const sorted = [...entries].sort((a, b) => a.day - b.day);
  const mid = Math.ceil(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid).reduce((s, e) => s + e.overallEnergy, 0) / mid;
  const secondHalf = sorted.slice(mid).reduce((s, e) => s + e.overallEnergy, 0) / (sorted.length - mid);
  const diff = secondHalf - firstHalf;
  const trend = diff > 0.5 ? 'rising' : diff < -0.5 ? 'falling' : 'stable';

  return {
    avgEnergy: Math.round(avg * 10) / 10,
    energizerKeywords: extractKeywords(entries.map(e => e.energizer)),
    drainKeywords: extractKeywords(entries.map(e => e.drain)),
    trend,
  };
}
