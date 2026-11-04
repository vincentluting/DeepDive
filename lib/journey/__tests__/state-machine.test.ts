// ============================================================
// Tests for the Journey State Machine — the single source of truth
// for feature gating. This pure FSM gates quickDive → coaching, so a
// regression here silently locks or unlocks features for real users.
//
// Coverage: transition validity, ordering (hasReached), the three
// derived-value functions, adminSkipTo, and — most importantly — the
// documented invariant that deriveUnlocked.coaching always agrees with
// deriveCoachAccess. That invariant is load-bearing: docs and several
// call sites assume the two never disagree.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  JOURNEY_STATES,
  type JourneyState,
  transition,
  hasReached,
  deriveUserLevel,
  deriveCoachAccess,
  deriveUnlocked,
  adminSkipTo,
} from "../state-machine";

describe("JOURNEY_STATES", () => {
  it("is ordered, unique, and progression-shaped", () => {
    expect(JOURNEY_STATES[0]).toBe("not_started");
    expect(JOURNEY_STATES[JOURNEY_STATES.length - 1]).toBe("coaching_unlocked");
    expect(new Set(JOURNEY_STATES).size).toBe(JOURNEY_STATES.length);
  });
});

describe("transition", () => {
  it("advances along the happy path one step at a time", () => {
    expect(transition("not_started", "COMPLETE_QUICK_DIVE")).toBe(
      "quick_dive_complete",
    );
    expect(transition("quick_dive_complete", "COMPLETE_DEEP_DIVE")).toBe(
      "deep_dive_complete",
    );
    expect(transition("deep_dive_complete", "GENERATE_PROFILE")).toBe(
      "profile_generated",
    );
    expect(transition("profile_generated", "GENERATE_REPORT")).toBe(
      "report_generated",
    );
  });

  it("returns null for events that don't apply to the current state", () => {
    // can't deep-dive before quick-dive
    expect(transition("not_started", "COMPLETE_DEEP_DIVE")).toBeNull();
    // can't generate a report before a profile
    expect(transition("deep_dive_complete", "GENERATE_REPORT")).toBeNull();
    // can't re-run quick dive once past it
    expect(transition("quick_dive_complete", "COMPLETE_QUICK_DIVE")).toBeNull();
  });

  it("lets ADMIN_SKIP jump straight to coaching_unlocked from any non-terminal state", () => {
    for (const state of JOURNEY_STATES) {
      const result = transition(state, "ADMIN_SKIP");
      if (state === "coaching_unlocked") {
        // terminal — no ADMIN_SKIP entry, so null
        expect(result).toBeNull();
      } else {
        expect(result).toBe("coaching_unlocked");
      }
    }
  });

  it("treats coaching_unlocked as terminal", () => {
    expect(transition("coaching_unlocked", "GENERATE_REPORT")).toBeNull();
    expect(transition("coaching_unlocked", "COMPLETE_QUICK_DIVE")).toBeNull();
  });
});

describe("hasReached", () => {
  it("is reflexive — a state has reached itself", () => {
    for (const s of JOURNEY_STATES) {
      expect(hasReached(s, s)).toBe(true);
    }
  });

  it("respects progression order", () => {
    expect(hasReached("profile_generated", "quick_dive_complete")).toBe(true);
    expect(hasReached("quick_dive_complete", "profile_generated")).toBe(false);
    expect(hasReached("not_started", "quick_dive_complete")).toBe(false);
    expect(hasReached("coaching_unlocked", "report_generated")).toBe(true);
  });
});

describe("deriveUserLevel", () => {
  it("maps states to levels per the documented buckets", () => {
    expect(deriveUserLevel("not_started")).toBe(0);
    expect(deriveUserLevel("quick_dive_complete")).toBe(1);
    // deep_dive_complete is still level 1 until a profile exists
    expect(deriveUserLevel("deep_dive_complete")).toBe(1);
    expect(deriveUserLevel("profile_generated")).toBe(2);
    expect(deriveUserLevel("report_generated")).toBe(2);
    expect(deriveUserLevel("coaching_unlocked")).toBe(2);
  });

  it("only reaches level 3 with power-user data AND at least profile_generated", () => {
    expect(deriveUserLevel("profile_generated", true)).toBe(3);
    expect(deriveUserLevel("coaching_unlocked", true)).toBe(3);
    // power-user data alone does not lift a level-0/1 user to 3
    expect(deriveUserLevel("not_started", true)).toBe(0);
    expect(deriveUserLevel("quick_dive_complete", true)).toBe(1);
  });
});

describe("deriveCoachAccess", () => {
  it("locks coaching before quick dive", () => {
    expect(deriveCoachAccess("not_started")).toEqual({
      level: 0,
      maxRounds: 0,
    });
  });

  it("grants limited (3-round) access after quick dive, unlimited after deep dive", () => {
    expect(deriveCoachAccess("quick_dive_complete")).toEqual({
      level: 1,
      maxRounds: 3,
    });
    expect(deriveCoachAccess("deep_dive_complete")).toEqual({
      level: 2,
      maxRounds: null,
    });
    expect(deriveCoachAccess("report_generated")).toEqual({
      level: 2,
      maxRounds: null,
    });
  });
});

describe("deriveUnlocked", () => {
  it("unlocks features at the right milestones", () => {
    expect(deriveUnlocked("not_started")).toMatchObject({
      quickDive: true,
      deepDive: false,
      profile: false,
      report: false,
      coaching: false,
    });
    expect(deriveUnlocked("quick_dive_complete")).toMatchObject({
      deepDive: true,
      coaching: true, // limited coaching opens at quick_dive_complete
      profile: false,
      report: false,
    });
    expect(deriveUnlocked("report_generated")).toMatchObject({
      profile: true,
      report: true,
      coaching: true,
    });
  });

  it("INVARIANT: deriveUnlocked.coaching always agrees with deriveCoachAccess", () => {
    // This is the load-bearing single-source-of-truth invariant called out
    // in the state-machine docstring. If someone changes one gate without
    // the other, real users get coaching access that the UI hides (or vice
    // versa). Assert it holds for every state.
    for (const state of JOURNEY_STATES) {
      expect(deriveUnlocked(state).coaching).toBe(
        deriveCoachAccess(state).level > 0,
      );
    }
  });

  it("quickDive is unconditionally unlocked in every state", () => {
    for (const state of JOURNEY_STATES) {
      expect(deriveUnlocked(state).quickDive).toBe(true);
    }
  });
});

describe("adminSkipTo", () => {
  it("jumps forward to any later state", () => {
    expect(adminSkipTo("not_started", "report_generated")).toBe(
      "report_generated",
    );
    expect(adminSkipTo("quick_dive_complete", "coaching_unlocked")).toBe(
      "coaching_unlocked",
    );
  });

  it("refuses to skip to the same or an earlier state", () => {
    expect(adminSkipTo("report_generated", "report_generated")).toBeNull();
    expect(adminSkipTo("report_generated", "not_started")).toBeNull();
    expect(adminSkipTo("coaching_unlocked", "profile_generated")).toBeNull();
  });

  it("never produces a state outside the known set", () => {
    for (const from of JOURNEY_STATES) {
      for (const to of JOURNEY_STATES) {
        const result = adminSkipTo(from, to);
        if (result !== null) {
          expect(JOURNEY_STATES).toContain(result as JourneyState);
        }
      }
    }
  });
});
