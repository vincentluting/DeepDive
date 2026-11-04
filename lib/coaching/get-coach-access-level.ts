// ============================================================
// Coach Access Level — Gate logic derived from journey state
//
// Three states (derived from journeyState via deriveCoachAccess):
//   Level 0: No Quick Dive completed → coaching locked
//   Level 1: Quick Dive done, no Deep Dive → coaching limited (3 rounds)
//   Level 2: Deep Dive completed → coaching fully unlocked
//
// completedRounds reflects DB-persisted rounds across the user's OTHER sessions.
// The current session (currentSessionId) is excluded so the caller can add the
// live `round` without double-counting; prior sessions (completed or abandoned)
// still count, so the trial can't be reset by abandoning a session.
// ============================================================

import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import { getTotalCoachingRoundsForUser } from "@/lib/db/coaching";
import { getJourneyState } from "@/lib/db/journey";
import { deriveCoachAccess } from "@/lib/journey/state-machine";

/** Maximum coaching rounds allowed for State 1 (Quick Dive only) users */
export const COACH_STATE1_MAX_ROUNDS = 3;

export type CoachAccessLevel = {
  level: 0 | 1 | 2;
  /** Maximum rounds allowed. null = unlimited. 0 = completely blocked. */
  maxRounds: number | null;
  /** Total user turns persisted in DB across all completed coaching sessions */
  completedRounds: number;
  /** Primary RIASEC dimension from the user's latest Quick Dive (e.g. "R", "I") */
  primaryRiasecType: string | null;
};

/**
 * Determine a user's coaching access level from journey state (single source of truth)
 * + supplementary data (completedRounds, primaryRiasecType).
 */
export async function getCoachAccessLevel(
  userId: string,
  currentSessionId?: string,
): Promise<CoachAccessLevel> {
  const [journeyState, quickDive, completedRounds] = await Promise.all([
    getJourneyState(userId),
    getLatestQuickDiveByUserId(userId),
    getTotalCoachingRoundsForUser(userId, currentSessionId),
  ]);

  const { level, maxRounds } = deriveCoachAccess(journeyState);

  // Derive primary RIASEC dimension from Quick Dive score map
  let primaryRiasecType: string | null = null;
  if (quickDive?.scoresJson) {
    const entries = Object.entries(quickDive.scoresJson);
    if (entries.length > 0) {
      const [topDimension] = entries.reduce((best, curr) =>
        curr[1] >= best[1] ? curr : best,
      );
      primaryRiasecType = topDimension;
    }
  }

  return { level, maxRounds, completedRounds, primaryRiasecType };
}
