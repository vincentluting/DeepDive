// ============================================================
// getEffectiveAssessment — ownership gate regression tests
//
// Prior to 2026-05-13, getEffectiveAssessment accepted a userId
// parameter but used it ONLY to merge in the caller's QuickDive
// RIASEC — not to verify ownership. A logged-in attacker could
// pass a victim's assessmentId with their own userId and get the
// victim's bigFive/schwartz/sessionId merged with their own QD,
// silently. The annotation at lib/db/assessments.ts:148-152 had
// warned about this since 2026-04-22 but no caller had been
// retrofitted.
//
// This file pins the fix: when userId is provided, ownership
// must be enforced before any data is returned. Forbidden and
// not-found collapse into a single null return so the response
// shape doesn't leak existence.
// ============================================================

import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn();
const getLatestQuickDiveMock = vi.fn();
const getCanonicalRiasecMock = vi.fn();
const buildArchetypeMock = vi.fn();

vi.mock("../connection", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));
vi.mock("../platform", () => ({
  getLatestQuickDiveByUserId: (...args: unknown[]) =>
    getLatestQuickDiveMock(...args),
}));
vi.mock("../riasec-canonical", () => ({
  getCanonicalRiasec: (...args: unknown[]) => getCanonicalRiasecMock(...args),
}));
vi.mock("@/lib/scoring/riasec-utils", () => ({
  buildArchetype: (...args: unknown[]) => buildArchetypeMock(...args),
}));

import { getEffectiveAssessment } from "../assessments";

const VICTIM_USER = "victim-user-id";
const ATTACKER_USER = "attacker-user-id";
const VICTIM_ASSESSMENT = "victim-assessment-id";
const VICTIM_SESSION = "victim-session-id";

const victimAssessmentJson = {
  id: VICTIM_ASSESSMENT,
  sessionId: VICTIM_SESSION,
  bigFive: { openness: 0.5 },
  schwartz: { raw: {} },
  riasecNormalized: { R: 0.3, I: 0.6, A: 0.4, S: 0.5, E: 0.2, C: 0.4 },
  archetype: { code: "I-Healer", orientation: "enhancement" },
};

beforeEach(() => {
  sqlMock.mockReset();
  getLatestQuickDiveMock.mockReset();
  getCanonicalRiasecMock.mockReset();
  buildArchetypeMock.mockReset();
});

describe("getEffectiveAssessment — ownership gate", () => {
  it("returns null when an attacker passes a victim's assessmentId with their own userId", async () => {
    // verifyAssessmentOwnership: getAssessmentOwner returns victim, then
    // since victim.userId is set, the function compares against attacker
    // and returns "forbidden". Only one SQL call needed (no session fallback).
    sqlMock.mockResolvedValueOnce([
      { userId: VICTIM_USER, sessionId: VICTIM_SESSION },
    ]);

    const result = await getEffectiveAssessment(
      VICTIM_ASSESSMENT,
      ATTACKER_USER,
    );

    expect(result).toBeNull();
    // Critically: no second sql call to fetch the resultJson. Even if the
    // ownership check is bypassed, the data lookup never runs.
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("returns the assessment when userId matches the owner", async () => {
    // First sql call: getAssessmentOwner — victim owns the row
    sqlMock.mockResolvedValueOnce([
      { userId: VICTIM_USER, sessionId: VICTIM_SESSION },
    ]);
    // Second sql call: getAssessmentResult — returns the JSON
    sqlMock.mockResolvedValueOnce([
      { resultJson: victimAssessmentJson, version: "3.0" },
    ]);
    // No newer QD → return assessment unchanged
    getLatestQuickDiveMock.mockResolvedValueOnce(null);

    const result = await getEffectiveAssessment(VICTIM_ASSESSMENT, VICTIM_USER);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(VICTIM_ASSESSMENT);
    expect(result?.sessionId).toBe(VICTIM_SESSION);
  });

  it("returns null when assessment doesn't exist (not-found is indistinguishable from forbidden)", async () => {
    sqlMock.mockResolvedValueOnce([]); // getAssessmentOwner → null

    const result = await getEffectiveAssessment(
      "nonexistent-id",
      ATTACKER_USER,
    );

    expect(result).toBeNull();
  });

  it("legacy: ownership falls through to QuestionnaireSession when AssessmentResult.userId is null", async () => {
    // getAssessmentOwner: row exists, but userId is null (pre-backfill data)
    sqlMock.mockResolvedValueOnce([
      { userId: null, sessionId: VICTIM_SESSION },
    ]);
    // Session fallback: session.userId matches the caller → owner
    sqlMock.mockResolvedValueOnce([{ userId: VICTIM_USER }]);
    // getAssessmentResult
    sqlMock.mockResolvedValueOnce([
      { resultJson: victimAssessmentJson, version: "3.0" },
    ]);
    getLatestQuickDiveMock.mockResolvedValueOnce(null);

    const result = await getEffectiveAssessment(VICTIM_ASSESSMENT, VICTIM_USER);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(VICTIM_ASSESSMENT);
  });

  it("legacy: rejects when both AssessmentResult.userId and session.userId are null (truly anonymous)", async () => {
    sqlMock.mockResolvedValueOnce([
      { userId: null, sessionId: VICTIM_SESSION },
    ]);
    sqlMock.mockResolvedValueOnce([{ userId: null }]); // session also anonymous

    const result = await getEffectiveAssessment(
      VICTIM_ASSESSMENT,
      ATTACKER_USER,
    );

    expect(result).toBeNull();
  });

  it("anonymous flow: userId omitted skips ownership check and returns raw assessment", async () => {
    // No ownership query — go straight to getAssessmentResult
    sqlMock.mockResolvedValueOnce([
      { resultJson: victimAssessmentJson, version: "3.0" },
    ]);

    const result = await getEffectiveAssessment(VICTIM_ASSESSMENT);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(VICTIM_ASSESSMENT);
    // Anonymous path: only the data lookup runs, no ownership query.
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});
