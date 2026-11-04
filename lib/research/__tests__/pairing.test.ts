// ============================================================
// Canonical timepoint selection & pairing — unit tests
//
// These tests LOCK the thesis-wide canonical rule:
//   T0 = FIRST 'pre', T1 = LATEST 'post_immediate', T2 = LATEST 'post_1week'
//   Exactly one row per user per timepoint; multi-record users flagged.
// If these fail after a refactor, thesis statistics are at risk.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  selectCanonicalTimepoints,
  pairScores,
  type AssessmentRow,
} from "@/lib/research/pairing";

function row(
  userId: string,
  type: AssessmentRow["assessmentType"],
  scc: number | null,
  createdAt: string,
): AssessmentRow {
  return {
    userId,
    assessmentType: type,
    sccTotalScore: scc,
    cdseTotalScore: null,
    createdAt,
  };
}

describe("selectCanonicalTimepoints — canonical rule", () => {
  it("user with 2 pre + 3 post rows yields exactly one row per timepoint", () => {
    const rows: AssessmentRow[] = [
      row("u1", "pre", 10, "2026-01-01T00:00:00Z"), // first pre → canonical T0
      row("u1", "pre", 99, "2026-01-05T00:00:00Z"), // retaken pre → ignored
      row("u1", "post_immediate", 20, "2026-01-10T00:00:00Z"),
      row("u1", "post_immediate", 25, "2026-01-12T00:00:00Z"), // latest → canonical T1
      row("u1", "post_1week", 30, "2026-01-19T00:00:00Z"), // only one → canonical T2
    ];

    const { byUser, multiRecordUsers } = selectCanonicalTimepoints(rows);
    const tp = byUser.get("u1")!;

    expect(tp.t0?.sccTotalScore).toBe(10); // earliest pre, NOT the retake
    expect(tp.t1?.sccTotalScore).toBe(25); // latest post_immediate
    expect(tp.t2?.sccTotalScore).toBe(30);

    // Multi-record flags: 2× pre and 2× post_immediate
    expect(multiRecordUsers).toEqual([
      { userId: "u1", assessmentType: "post_immediate", count: 2 },
      { userId: "u1", assessmentType: "pre", count: 2 },
    ]);
  });

  it("input order does not affect canonical selection", () => {
    const ordered: AssessmentRow[] = [
      row("u1", "pre", 10, "2026-01-01T00:00:00Z"),
      row("u1", "pre", 99, "2026-01-05T00:00:00Z"),
    ];
    const reversed = [...ordered].reverse();

    const a = selectCanonicalTimepoints(ordered).byUser.get("u1")!;
    const b = selectCanonicalTimepoints(reversed).byUser.get("u1")!;
    expect(a.t0?.sccTotalScore).toBe(10);
    expect(b.t0?.sccTotalScore).toBe(10);
  });

  it("single-record users produce no multi-record flags", () => {
    const rows = [
      row("u1", "pre", 10, "2026-01-01T00:00:00Z"),
      row("u2", "pre", 12, "2026-01-02T00:00:00Z"),
      row("u2", "post_immediate", 15, "2026-01-03T00:00:00Z"),
    ];
    const { multiRecordUsers } = selectCanonicalTimepoints(rows);
    expect(multiRecordUsers).toEqual([]);
  });

  it("rows with empty userId are skipped", () => {
    const rows = [row("", "pre", 10, "2026-01-01T00:00:00Z")];
    const { byUser } = selectCanonicalTimepoints(rows);
    expect(byUser.size).toBe(0);
  });
});

describe("pairScores — paired sets are per-window and never pooled", () => {
  it("emits one t0t1 pair and one t0t2 pair per user, independently", () => {
    const rows = [
      row("u1", "pre", 10, "2026-01-01T00:00:00Z"),
      row("u1", "post_immediate", 20, "2026-01-10T00:00:00Z"),
      row("u1", "post_1week", 30, "2026-01-17T00:00:00Z"),
      row("u2", "pre", 11, "2026-01-02T00:00:00Z"),
      row("u2", "post_immediate", 21, "2026-01-11T00:00:00Z"),
      // u2 has no T2
    ];
    const { byUser } = selectCanonicalTimepoints(rows);
    const { t0t1, t0t2 } = pairScores(byUser, "scc");

    expect(t0t1).toHaveLength(2);
    expect(t0t2).toHaveLength(1);
    expect(t0t1.find((p) => p.userId === "u1")).toEqual({
      userId: "u1",
      pre: 10,
      post: 20,
    });
    expect(t0t2[0]).toEqual({ userId: "u1", pre: 10, post: 30 });
  });

  it("a multi-record user still contributes exactly ONE pair per window (no Cartesian product)", () => {
    // The original bug: 2 pre × 3 post rows produced 6 rows for one user.
    const rows = [
      row("u1", "pre", 10, "2026-01-01T00:00:00Z"),
      row("u1", "pre", 12, "2026-01-04T00:00:00Z"),
      row("u1", "post_immediate", 20, "2026-01-10T00:00:00Z"),
      row("u1", "post_immediate", 22, "2026-01-11T00:00:00Z"),
      row("u1", "post_1week", 30, "2026-01-18T00:00:00Z"),
    ];
    const { byUser } = selectCanonicalTimepoints(rows);
    const { t0t1, t0t2 } = pairScores(byUser, "scc");

    expect(t0t1).toHaveLength(1);
    expect(t0t2).toHaveLength(1);
    expect(t0t1[0]).toEqual({ userId: "u1", pre: 10, post: 22 });
    expect(t0t2[0]).toEqual({ userId: "u1", pre: 10, post: 30 });
  });

  it("pairs with a null score on either end are dropped", () => {
    const rows = [
      row("u1", "pre", null, "2026-01-01T00:00:00Z"),
      row("u1", "post_immediate", 20, "2026-01-10T00:00:00Z"),
      row("u2", "pre", 10, "2026-01-01T00:00:00Z"),
      row("u2", "post_immediate", null, "2026-01-10T00:00:00Z"),
    ];
    const { byUser } = selectCanonicalTimepoints(rows);
    const { t0t1 } = pairScores(byUser, "scc");
    expect(t0t1).toHaveLength(0);
  });

  it("users without a pre record produce no pairs at all", () => {
    const rows = [row("u1", "post_immediate", 20, "2026-01-10T00:00:00Z")];
    const { byUser } = selectCanonicalTimepoints(rows);
    const { t0t1, t0t2 } = pairScores(byUser, "scc");
    expect(t0t1).toHaveLength(0);
    expect(t0t2).toHaveLength(0);
  });
});
