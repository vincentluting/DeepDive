// ============================================================
// Journey State Machine — Pure TypeScript FSM
//
// Defines the user exploration journey as a finite state machine.
// States are linear: each step unlocks the next.
// ADMIN_SKIP can jump to any later state.
//
// This is the ONLY place that defines valid states and transitions.
// DB enforces via CHECK constraint; this module enforces in app layer.
// ============================================================

/** All possible journey states, in progression order */
export const JOURNEY_STATES = [
  "not_started",
  "quick_dive_complete",
  "deep_dive_complete",
  "profile_generated",
  "report_generated",
  "coaching_unlocked",
] as const;

export type JourneyState = (typeof JOURNEY_STATES)[number];

/** Events that trigger state transitions */
export type JourneyEvent =
  | "COMPLETE_QUICK_DIVE"
  | "COMPLETE_DEEP_DIVE"
  | "GENERATE_PROFILE"
  | "GENERATE_REPORT"
  | "ADMIN_SKIP";

/** Valid transitions: { fromState: { event: toState } } */
const TRANSITIONS: Record<
  JourneyState,
  Partial<Record<JourneyEvent, JourneyState>>
> = {
  not_started: {
    COMPLETE_QUICK_DIVE: "quick_dive_complete",
    ADMIN_SKIP: "coaching_unlocked",
  },
  quick_dive_complete: {
    COMPLETE_DEEP_DIVE: "deep_dive_complete",
    ADMIN_SKIP: "coaching_unlocked",
  },
  deep_dive_complete: {
    GENERATE_PROFILE: "profile_generated",
    ADMIN_SKIP: "coaching_unlocked",
  },
  profile_generated: {
    GENERATE_REPORT: "report_generated",
    ADMIN_SKIP: "coaching_unlocked",
  },
  report_generated: {
    ADMIN_SKIP: "coaching_unlocked",
  },
  coaching_unlocked: {
    // Terminal state — no further transitions (except ADMIN_SKIP to self)
  },
};

/**
 * Pure transition function.
 * Returns the next state, or null if the transition is invalid.
 */
export function transition(
  currentState: JourneyState,
  event: JourneyEvent,
): JourneyState | null {
  return TRANSITIONS[currentState]?.[event] ?? null;
}

/**
 * Check if a user has reached at least the given state.
 * Useful for unlock checks: `hasReached(state, 'profile_generated')`
 */
export function hasReached(
  currentState: JourneyState,
  requiredState: JourneyState,
): boolean {
  const currentIndex = JOURNEY_STATES.indexOf(currentState);
  const requiredIndex = JOURNEY_STATES.indexOf(requiredState);
  return currentIndex >= requiredIndex;
}

// ── Derived values ─────────────────────────────────────
// All unlock/access decisions derive from journeyState alone.
// These pure functions are the SINGLE SOURCE OF TRUTH for feature gating.

/**
 * Derive userLevel from journey state.
 * 0=new, 1=quickDiveOnly, 2=profileOrReport, 3=coaching+
 *
 * Note: Level 3 (power user) requires additional data (multiple reports + insights)
 * that lives outside the state machine. Pass `hasPowerUserData` for that check.
 */
export function deriveUserLevel(
  state: JourneyState,
  hasPowerUserData = false,
): 0 | 1 | 2 | 3 {
  if (!hasReached(state, "quick_dive_complete")) return 0;
  if (!hasReached(state, "profile_generated")) return 1;
  if (hasPowerUserData) return 3;
  return 2;
}

/**
 * Derive coach access level from journey state.
 * 0=locked, 1=limited (3 rounds), 2=unlimited
 */
export function deriveCoachAccess(state: JourneyState): {
  level: 0 | 1 | 2;
  maxRounds: number | null;
} {
  if (!hasReached(state, "quick_dive_complete")) {
    return { level: 0, maxRounds: 0 };
  }
  if (!hasReached(state, "deep_dive_complete")) {
    return { level: 1, maxRounds: 3 };
  }
  return { level: 2, maxRounds: null };
}

/**
 * Derive feature unlock map from journey state.
 * Used by /api/journey and any component that needs granular unlock checks.
 */
export function deriveUnlocked(state: JourneyState): {
  quickDive: boolean;
  deepDive: boolean;
  profile: boolean;
  report: boolean;
  coaching: boolean;
} {
  return {
    quickDive: true,
    deepDive: hasReached(state, "quick_dive_complete"),
    profile: hasReached(state, "profile_generated"),
    report: hasReached(state, "report_generated"),
    // Aligned with deriveCoachAccess() and docs/product/user-journeys.md:78-85:
    // coaching is available (limited 3 rounds) from quick_dive_complete and
    // unlimited from deep_dive_complete — NOT gated on report_generated.
    // Single source of truth: `(deriveCoachAccess(s).level > 0) === deriveUnlocked(s).coaching`.
    coaching: deriveCoachAccess(state).level > 0,
  };
}

/**
 * Admin skip: jump to a target state from any earlier state.
 * Returns null if target is not ahead of current.
 */
export function adminSkipTo(
  currentState: JourneyState,
  targetState: JourneyState,
): JourneyState | null {
  const currentIndex = JOURNEY_STATES.indexOf(currentState);
  const targetIndex = JOURNEY_STATES.indexOf(targetState);
  if (targetIndex <= currentIndex) return null;
  return targetState;
}
