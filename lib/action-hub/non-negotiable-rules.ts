// ============================================================
// Non-Negotiable Rules — keyword maps for 18 deal-breakers
//
// Pure data + pure functions, zero DB / LLM.
//
// Each non-negotiable ID maps to:
//   - `boost`: seeds whose text resonates with this deal-breaker
//     get a positive ranking boost (and a matched-tag attribution).
//   - `exclude`: seeds whose text directly conflicts with this
//     deal-breaker get filtered out (priority → 0).
//
// Conflict checks are cheap regex on title + description. We bias
// toward inclusion (most rules have empty `exclude`) — false-negative
// boosts are fine; false-positive deletions starve the plan.
// ============================================================

import type { NonNegotiablesResult } from "./guided-exercises";

interface RulePair {
  /** Keywords that signal alignment — bilingual (en + zh) */
  boost: RegExp[];
  /** Keywords that signal direct conflict — keep narrow */
  exclude: RegExp[];
}

/**
 * 18 non-negotiables × {boost, exclude} keyword regex.
 * Whitespace-tolerant, case-insensitive, multilingual (en/zh).
 */
const RULES: Record<string, RulePair> = {
  // ── Financial ────────────────────────────────────────────
  min_salary: {
    boost: [/\bsalary\b|\bcompensation\b|\bnegotiate pay\b|薪资|薪水|工资/i],
    exclude: [],
  },
  equity_upside: {
    boost: [/\bequity\b|\bstock options?\b|\bRSU\b|startup equity|股权|期权/i],
    exclude: [],
  },
  benefits_package: {
    boost: [
      /\bbenefits\b|\binsurance\b|\b401k\b|\bretirement\b|福利|保险|退休/i,
    ],
    exclude: [],
  },
  pay_transparency: {
    boost: [/transparen|\bfair pay\b|pay equity|薪酬透明|公平/i],
    exclude: [],
  },

  // ── Location & Format ────────────────────────────────────
  remote_work: {
    boost: [
      /\bremote\b|\bWFH\b|\bwork[- ]from[- ]home\b|distributed team|远程|在家|异地/i,
    ],
    exclude: [
      /\bonsite\b|\bon[- ]site\b|in[- ]person only|office[- ]only|本地办公|现场办公/i,
    ],
  },
  short_commute: {
    boost: [/nearby|local office|short commute|附近|通勤/i],
    exclude: [],
  },
  specific_city: {
    boost: [/relocat|\bmove to\b|搬到|定居/i],
    exclude: [],
  },
  visa_sponsorship: {
    boost: [/\bvisa\b|sponsorship|\bH-?1B\b|work permit|签证|工签/i],
    exclude: [],
  },

  // ── Time & Rhythm ────────────────────────────────────────
  work_life_balance: {
    boost: [/work[- ]life balance|\bwellness\b|sustainable pace|平衡|界限/i],
    exclude: [/\b996\b|always[- ]on|grind culture|hustle culture|加班文化/i],
  },
  flexible_hours: {
    boost: [/\bflexible hours?\b|\basync\b|anytime|灵活时间|异步/i],
    exclude: [],
  },
  no_overtime: {
    boost: [/strict hours|no overtime|准点下班/i],
    exclude: [/overtime|weekend work|after[- ]hours|加班|周末加班/i],
  },

  // ── Culture & Environment ────────────────────────────────
  flat_hierarchy: {
    boost: [/\bflat\b|horizontal|self[- ]organized|no manager|扁平|无管理/i],
    exclude: [/strict hierarchy|corporate ladder|层级森严|官僚/i],
  },
  team_diversity: {
    boost: [
      /\bdivers|\binclusiv|multicultural|international team|多元|包容|国际/i,
    ],
    exclude: [],
  },
  psych_safety: {
    boost: [
      /\bpsychological safety\b|supportive team|safe to fail|trust culture|心理安全|信任氛围/i,
    ],
    exclude: [],
  },
  small_team: {
    boost: [
      /\bsmall team\b|\bstartup\b|intimate team|tight[- ]knit|小团队|创业团队/i,
    ],
    exclude: [/\benterprise\b|Fortune 500|big[- ]corp|大型企业|大公司/i],
  },

  // ── Growth & Purpose ─────────────────────────────────────
  learning_budget: {
    boost: [
      /learning budget|training budget|course|conference|workshop|education stipend|学习预算|培训|课程/i,
    ],
    exclude: [],
  },
  career_path: {
    boost: [
      /career path|promotion|growth ladder|advance|level[- ]up|职业发展|晋升通道/i,
    ],
    exclude: [],
  },
  meaningful_work: {
    boost: [
      /\bmeaningful\b|\bimpact\b|mission[- ]driven|purpose|values[- ]aligned|意义|使命|价值/i,
    ],
    exclude: [],
  },
};

export interface NonNegotiableMatch {
  /** ID of the matched non-negotiable (matches NON_NEGOTIABLE_OPTIONS.id) */
  id: string;
  /** 'boost' = soft alignment, 'exclude' = hard conflict (filter out) */
  kind: "boost" | "exclude";
  /** Priority rank from the user's selection (0 = highest, 2 = lowest) */
  priorityRank: number;
}

/**
 * Match a seed (title + description) against the user's 3 non-negotiables.
 * Returns the strongest match, preferring excludes over boosts so callers
 * can hard-filter conflicting seeds before counting boosts.
 */
export function matchNonNegotiable(
  seedText: string,
  selected: NonNegotiablesResult["selected"] | null | undefined,
): NonNegotiableMatch | null {
  if (!selected || selected.length !== 3) return null;
  const text = seedText.toLowerCase();

  // Excludes win first — even a low-priority exclude trumps a high-priority boost.
  for (let rank = 0; rank < 3; rank++) {
    const id = selected[rank];
    const rule = RULES[id];
    if (!rule) continue;
    if (rule.exclude.some((re) => re.test(text))) {
      return { id, kind: "exclude", priorityRank: rank };
    }
  }

  // Then check boosts (highest-priority non-neg wins on ties).
  for (let rank = 0; rank < 3; rank++) {
    const id = selected[rank];
    const rule = RULES[id];
    if (!rule) continue;
    if (rule.boost.some((re) => re.test(text))) {
      return { id, kind: "boost", priorityRank: rank };
    }
  }

  return null;
}

/**
 * Convert a priority rank (0..2) into a boost weight.
 * Rank 0 (the user's #1 deal-breaker) gets the strongest pull.
 */
export function nonNegBoostWeight(priorityRank: number): number {
  // 0 → 1.0, 1 → 0.85, 2 → 0.7
  return 1.0 - priorityRank * 0.15;
}
