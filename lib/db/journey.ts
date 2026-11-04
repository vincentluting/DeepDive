// ============================================================
// Journey DB — Atomic state transitions with audit log
//
// Single source of truth for "where is this user in the journey".
// Uses WHERE clause on current state to prevent race conditions.
// ============================================================

import { sql } from './connection';
import {
  type JourneyState,
  type JourneyEvent,
  transition,
  adminSkipTo,
} from '../journey/state-machine';

// ── Read ─────

/**
 * Get a user's current journey state.
 * Returns 'not_started' if no row exists (new user).
 */
export async function getJourneyState(userId: string): Promise<JourneyState> {
  const rows = await sql`
    SELECT "journeyState" FROM "User" WHERE "id" = ${userId}
  `;
  if (rows.length === 0) return 'not_started';
  return (rows[0].journeyState as JourneyState) || 'not_started';
}

// ── Transition ─────

interface TransitionResult {
  success: boolean;
  previousState: JourneyState;
  newState: JourneyState;
  error?: string;
}

/**
 * Atomically transition a user's journey state.
 * Uses WHERE clause on current state to prevent race conditions.
 * Logs every transition for audit trail.
 */
export async function transitionJourney(
  userId: string,
  event: JourneyEvent,
  triggeredBy: 'system' | 'admin' | 'user' = 'system',
  metadata?: Record<string, unknown>,
): Promise<TransitionResult> {
  const currentState = await getJourneyState(userId);
  const nextState = transition(currentState, event);

  if (!nextState) {
    return {
      success: false,
      previousState: currentState,
      newState: currentState,
      error: `Invalid transition: ${currentState} + ${event}`,
    };
  }

  // Atomic update — only succeeds if state hasn't changed since we read it
  const updated = await sql`
    UPDATE "User"
    SET "journeyState" = ${nextState}, "updatedAt" = NOW()
    WHERE "id" = ${userId} AND "journeyState" = ${currentState}
    RETURNING "journeyState"
  `;

  if (updated.length === 0) {
    // Race condition: another process already transitioned
    const freshState = await getJourneyState(userId);
    return {
      success: false,
      previousState: currentState,
      newState: freshState,
      error: `Race condition: state was ${currentState}, now ${freshState}`,
    };
  }

  // Log the transition
  await logTransition(userId, currentState, nextState, event, triggeredBy, metadata);

  return {
    success: true,
    previousState: currentState,
    newState: nextState,
  };
}

/**
 * Roll back journey state after a Deep Dive reset.
 *
 * Deep reset deletes downstream Deep Dive artifacts, so the only valid
 * post-reset states are:
 * - quick_dive_complete: user still has any Quick/Immersive result
 * - not_started: no Quick/Immersive result remains
 */
export async function rollbackJourneyAfterDeepReset(
  userId: string,
): Promise<TransitionResult> {
  const currentState = await getJourneyState(userId);

  const [completionRows, quickDiveRows] = await Promise.all([
    sql`
      SELECT 1
      FROM "AssessmentCompletion"
      WHERE "userId" = ${userId}
        AND "assessmentType" IN ('quick_dive', 'immersive_dive')
      LIMIT 1
    `,
    sql`
      SELECT 1
      FROM "QuickDiveResult"
      WHERE "userId" = ${userId}
      LIMIT 1
    `,
  ]);

  const targetState: JourneyState =
    completionRows.length > 0 || quickDiveRows.length > 0
      ? 'quick_dive_complete'
      : 'not_started';

  if (currentState === targetState) {
    return {
      success: true,
      previousState: currentState,
      newState: targetState,
    };
  }

  await sql`
    UPDATE "User"
    SET "journeyState" = ${targetState}, "updatedAt" = NOW()
    WHERE "id" = ${userId}
  `;

  await logTransition(
    userId,
    currentState,
    targetState,
    'SYSTEM_ROLLBACK_DEEP_RESET',
    'system',
  );

  return {
    success: true,
    previousState: currentState,
    newState: targetState,
  };
}

/**
 * Admin skip — jump to a specific state, bypassing normal progression.
 */
export async function adminSkipJourney(
  userId: string,
  targetState: JourneyState,
  metadata?: Record<string, unknown>,
): Promise<TransitionResult> {
  const currentState = await getJourneyState(userId);
  const nextState = adminSkipTo(currentState, targetState);

  if (!nextState) {
    return {
      success: false,
      previousState: currentState,
      newState: currentState,
      error: `Cannot skip: ${currentState} → ${targetState} (target must be ahead)`,
    };
  }

  const updated = await sql`
    UPDATE "User"
    SET "journeyState" = ${nextState}, "updatedAt" = NOW()
    WHERE "id" = ${userId} AND "journeyState" = ${currentState}
    RETURNING "journeyState"
  `;

  if (updated.length === 0) {
    const freshState = await getJourneyState(userId);
    return {
      success: false,
      previousState: currentState,
      newState: freshState,
      error: `Race condition during admin skip`,
    };
  }

  await logTransition(userId, currentState, nextState, 'ADMIN_SKIP', 'admin', metadata);

  return {
    success: true,
    previousState: currentState,
    newState: nextState,
  };
}

// ── Audit Log ─────

async function logTransition(
  userId: string,
  fromState: JourneyState,
  toState: JourneyState,
  event: JourneyEvent | 'SYSTEM_ROLLBACK_DEEP_RESET',
  triggeredBy: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO "JourneyTransitionLog" ("userId", "fromState", "toState", "event", "triggeredBy", "metadata")
      VALUES (${userId}, ${fromState}, ${toState}, ${event}, ${triggeredBy}, ${JSON.stringify(metadata ?? {})})
    `;
  } catch {
    // Log failure should never block the transition
    console.error(`[journey] Failed to log transition: ${fromState} → ${toState} for ${userId}`);
  }
}
