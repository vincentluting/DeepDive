// ============================================================
// Tests for Non-Negotiable Rules
// ============================================================

import { describe, it, expect } from "vitest";
import { matchNonNegotiable, nonNegBoostWeight } from "../non-negotiable-rules";
import { NON_NEGOTIABLE_OPTIONS } from "../guided-exercises";
import type { NonNegotiablesResult } from "../guided-exercises";

const ALL_IDS = NON_NEGOTIABLE_OPTIONS.map((o) => o.id);

function selected(
  a: string,
  b: string,
  c: string,
): NonNegotiablesResult["selected"] {
  return [a, b, c];
}

describe("matchNonNegotiable", () => {
  it("returns null when selection is missing", () => {
    expect(matchNonNegotiable("apply for remote jobs", null)).toBeNull();
    expect(matchNonNegotiable("apply for remote jobs", undefined)).toBeNull();
  });

  it("returns null when selection has wrong length", () => {
    expect(
      matchNonNegotiable("apply for remote jobs", [
        "remote_work",
        "psych_safety",
      ] as unknown as NonNegotiablesResult["selected"]),
    ).toBeNull();
  });

  it("matches a boost keyword on the user's #1 non-negotiable", () => {
    const sel = selected("remote_work", "psych_safety", "learning_budget");
    const match = matchNonNegotiable(
      "Apply for remote-friendly product roles",
      sel,
    );
    expect(match).not.toBeNull();
    expect(match!.id).toBe("remote_work");
    expect(match!.kind).toBe("boost");
    expect(match!.priorityRank).toBe(0);
  });

  it("prefers excludes over boosts regardless of priority order", () => {
    // User picks remote_work as #3, but the seed is onsite → exclude wins
    const sel = selected("learning_budget", "psych_safety", "remote_work");
    const match = matchNonNegotiable(
      "Attend onsite product networking meetup downtown",
      sel,
    );
    expect(match).not.toBeNull();
    expect(match!.id).toBe("remote_work");
    expect(match!.kind).toBe("exclude");
    expect(match!.priorityRank).toBe(2);
  });

  it("matches Chinese keywords", () => {
    const sel = selected("learning_budget", "meaningful_work", "psych_safety");
    const match = matchNonNegotiable("申请一门在线课程培训", sel);
    expect(match?.id).toBe("learning_budget");
    expect(match?.kind).toBe("boost");
  });

  it("returns null when no rule matches", () => {
    const sel = selected("visa_sponsorship", "equity_upside", "specific_city");
    const match = matchNonNegotiable("Read a book about coffee brewing", sel);
    expect(match).toBeNull();
  });

  it("picks the highest-priority match when multiple rules fire", () => {
    const sel = selected("psych_safety", "team_diversity", "meaningful_work");
    // This seed resonates with both psych_safety (trust) AND team_diversity (diverse)
    const match = matchNonNegotiable(
      "Join a diverse team with psychological safety and trust",
      sel,
    );
    expect(match?.id).toBe("psych_safety");
    expect(match?.priorityRank).toBe(0);
  });

  it("every non-negotiable ID has a valid rule entry", () => {
    // Catches typos — every option.id must be handled by the rule map
    // (matchNonNegotiable silently skips unknown IDs, so this guard is important).
    const sel = selected(ALL_IDS[0], ALL_IDS[1], ALL_IDS[2]);
    expect(() => matchNonNegotiable("any text", sel)).not.toThrow();
    expect(ALL_IDS).toHaveLength(18);
  });
});

describe("nonNegBoostWeight", () => {
  it("rank 0 gets the strongest pull", () => {
    expect(nonNegBoostWeight(0)).toBe(1.0);
  });

  it("weights decrease with rank", () => {
    expect(nonNegBoostWeight(0)).toBeGreaterThan(nonNegBoostWeight(1));
    expect(nonNegBoostWeight(1)).toBeGreaterThan(nonNegBoostWeight(2));
  });

  it("returns a positive weight for all valid ranks", () => {
    expect(nonNegBoostWeight(0)).toBeGreaterThan(0);
    expect(nonNegBoostWeight(1)).toBeGreaterThan(0);
    expect(nonNegBoostWeight(2)).toBeGreaterThan(0);
  });
});
