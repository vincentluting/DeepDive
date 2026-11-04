// ============================================================
// Milestone Builder — Three-phase milestone auto-organization
//
// Pure function — no DB, no LLM calls.
// Takes ranked actions and distributes them into 3 milestones:
//   Phase 1 (This Week, 0-7 days)  — easy/medium quick wins
//   Phase 2 (This Month, 8-30 days) — medium actions
//   Phase 3 (This Quarter, 31-90 days) — hard/medium stretch goals
// ============================================================

import type { RankedAction } from './priority-ranker';

// ── Types ──────────────────────────────────────────────────

export interface MilestonePlan {
  phase: 1 | 2 | 3;
  title_en: string;
  title_zh: string;
  title_nl: string;
  description_en: string;
  description_zh: string;
  description_nl: string;
  targetDay: number; // 7, 30, 90
  actionIndices: number[]; // indices into the ranked actions array
}

// ── Phase definitions ──────────────────────────────────────

const PHASE_DEFS = [
  {
    phase: 1 as const,
    title_en: 'Complete your first steps',
    title_zh: '\u8FC8\u51FA\u7B2C\u4E00\u6B65',
    title_nl: 'Zet je eerste stappen',
    description_en: 'Quick wins to build momentum this week',
    description_zh: '\u672C\u5468\u5FEB\u901F\u884C\u52A8\uFF0C\u5EFA\u7ACB\u52A8\u529B',
    description_nl: 'Snelle acties om deze week momentum op te bouwen',
    targetDay: 7,
    maxActions: 3,
  },
  {
    phase: 2 as const,
    title_en: 'Build momentum this month',
    title_zh: '\u672C\u6708\u5EFA\u7ACB\u8282\u594F',
    title_nl: 'Bouw deze maand momentum op',
    description_en: 'Steady progress through meaningful actions',
    description_zh: '\u901A\u8FC7\u6709\u610F\u4E49\u7684\u884C\u52A8\u7A33\u6B65\u524D\u8FDB',
    description_nl: 'Gestaag vooruit door betekenisvolle acties',
    targetDay: 30,
    maxActions: 4,
  },
  {
    phase: 3 as const,
    title_en: 'Achieve your quarterly goal',
    title_zh: '\u8FBE\u6210\u5B63\u5EA6\u76EE\u6807',
    title_nl: 'Haal je kwartaaldoel',
    description_en: 'Stretch goals for deeper exploration',
    description_zh: '\u6DF1\u5165\u63A2\u7D22\u7684\u8FDB\u9636\u76EE\u6807',
    description_nl: 'Uitdagende doelen voor diepere verkenning',
    targetDay: 90,
    maxActions: 3,
  },
] as const;

// ── Intensity classification ───────────────────────────────

function isEasyOrMedium(action: RankedAction): boolean {
  return action.intensity === 'passive' || action.intensity === 'active';
}

function isHardOrMedium(action: RankedAction): boolean {
  return action.intensity === 'social' || action.intensity === 'creative' || action.intensity === 'active';
}

// ── Main function ──────────────────────────────────────────

/**
 * Build 3-phase milestones from ranked actions.
 *
 * Phase 1: top easy/medium actions (quick wins)
 * Phase 2: next medium actions
 * Phase 3: remaining hard/medium actions
 */
export function buildMilestones(
  rankedActions: RankedAction[],
  _locale: string,
): MilestonePlan[] {
  if (rankedActions.length === 0) return [];

  const assigned = new Set<number>();
  const milestones: MilestonePlan[] = [];

  // Phase 1: easy/medium, up to 3
  const phase1Indices: number[] = [];
  for (let i = 0; i < rankedActions.length && phase1Indices.length < PHASE_DEFS[0].maxActions; i++) {
    if (isEasyOrMedium(rankedActions[i])) {
      phase1Indices.push(i);
      assigned.add(i);
    }
  }

  // Phase 2: medium (active intensity preferred), up to 4
  const phase2Indices: number[] = [];
  for (let i = 0; i < rankedActions.length && phase2Indices.length < PHASE_DEFS[1].maxActions; i++) {
    if (!assigned.has(i) && rankedActions[i].intensity === 'active') {
      phase2Indices.push(i);
      assigned.add(i);
    }
  }
  // Fill remaining phase 2 slots with any unassigned
  for (let i = 0; i < rankedActions.length && phase2Indices.length < PHASE_DEFS[1].maxActions; i++) {
    if (!assigned.has(i)) {
      phase2Indices.push(i);
      assigned.add(i);
    }
  }

  // Phase 3: hard/medium from remaining, up to 3
  const phase3Indices: number[] = [];
  for (let i = 0; i < rankedActions.length && phase3Indices.length < PHASE_DEFS[2].maxActions; i++) {
    if (!assigned.has(i) && isHardOrMedium(rankedActions[i])) {
      phase3Indices.push(i);
      assigned.add(i);
    }
  }

  const phaseIndices = [phase1Indices, phase2Indices, phase3Indices];

  for (let p = 0; p < PHASE_DEFS.length; p++) {
    const indices = phaseIndices[p];
    if (indices.length === 0) continue;

    const def = PHASE_DEFS[p];
    milestones.push({
      phase: def.phase,
      title_en: def.title_en,
      title_zh: def.title_zh,
      title_nl: def.title_nl,
      description_en: def.description_en,
      description_zh: def.description_zh,
      description_nl: def.description_nl,
      targetDay: def.targetDay,
      actionIndices: indices,
    });
  }

  return milestones;
}
