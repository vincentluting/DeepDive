// ============================================================
// Research pairing — canonical T0/T1/T2 selection & pairing logic
//
// CANONICAL TIMEPOINT RULE (thesis-wide, decided 2026-06-10):
//   T0 (pre)            → FIRST completed record (earliest createdAt).
//                          Baseline must predate any intervention exposure;
//                          a re-taken pre-test is contaminated.
//   T1 (post_immediate) → LATEST record (most recent createdAt).
//   T2 (post_1week)     → LATEST record (most recent createdAt).
//   Exactly ONE row per user per timepoint. Users with >1 row of the
//   same type are flagged via `multiRecordUsers` for admin review —
//   they are NOT dropped, but their canonical row follows the rule above.
//
// Every thesis statistic (paired t-test, Cohen's d, SCC deltas, export)
// MUST consume these functions instead of joining PrePostAssessment
// directly. See docs/architecture/admin-metrics.md.
// ============================================================

export type AssessmentTimepointType = "pre" | "post_immediate" | "post_1week";

export interface AssessmentRow {
  userId: string;
  assessmentType: AssessmentTimepointType;
  sccTotalScore: number | null;
  cdseTotalScore: number | null;
  createdAt: string; // ISO timestamp
}

export interface CanonicalTimepoints {
  t0: AssessmentRow | null;
  t1: AssessmentRow | null;
  t2: AssessmentRow | null;
}

export interface MultiRecordUser {
  userId: string;
  assessmentType: AssessmentTimepointType;
  count: number;
}

export interface PairedScores {
  userId: string;
  pre: number;
  post: number;
}

export interface PairedSccData {
  /** T0 → T1 (post_immediate) pairs, one row per user. */
  t0t1: PairedScores[];
  /** T0 → T2 (post_1week) pairs, one row per user. */
  t0t2: PairedScores[];
  /** Users holding >1 record of the same assessment type (data-quality flag). */
  multiRecordUsers: MultiRecordUser[];
}

function timeOf(row: AssessmentRow): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Reduce raw PrePostAssessment rows to exactly one canonical row per user
 * per timepoint (T0 = first, T1/T2 = latest), and flag multi-record users.
 */
export function selectCanonicalTimepoints(rows: AssessmentRow[]): {
  byUser: Map<string, CanonicalTimepoints>;
  multiRecordUsers: MultiRecordUser[];
} {
  const byUser = new Map<string, CanonicalTimepoints>();
  const counts = new Map<string, number>(); // `${userId}|${type}` → count

  for (const row of rows) {
    if (!row.userId) continue;

    const key = `${row.userId}|${row.assessmentType}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);

    let entry = byUser.get(row.userId);
    if (!entry) {
      entry = { t0: null, t1: null, t2: null };
      byUser.set(row.userId, entry);
    }

    if (row.assessmentType === "pre") {
      // T0: keep the EARLIEST record
      if (!entry.t0 || timeOf(row) < timeOf(entry.t0)) entry.t0 = row;
    } else if (row.assessmentType === "post_immediate") {
      // T1: keep the LATEST record
      if (!entry.t1 || timeOf(row) > timeOf(entry.t1)) entry.t1 = row;
    } else if (row.assessmentType === "post_1week") {
      // T2: keep the LATEST record
      if (!entry.t2 || timeOf(row) > timeOf(entry.t2)) entry.t2 = row;
    }
  }

  const multiRecordUsers: MultiRecordUser[] = [];
  for (const [key, count] of counts) {
    if (count > 1) {
      const sep = key.indexOf("|");
      multiRecordUsers.push({
        userId: key.slice(0, sep),
        assessmentType: key.slice(sep + 1) as AssessmentTimepointType,
        count,
      });
    }
  }
  multiRecordUsers.sort(
    (a, b) =>
      a.userId.localeCompare(b.userId) ||
      a.assessmentType.localeCompare(b.assessmentType),
  );

  return { byUser, multiRecordUsers };
}

/**
 * Build paired (pre, post) score arrays from canonical timepoints.
 * A pair is emitted only when BOTH ends have a non-null score —
 * paired statistics cannot impute missing values.
 */
export function pairScores(
  byUser: Map<string, CanonicalTimepoints>,
  metric: "scc" | "cdse" = "scc",
): { t0t1: PairedScores[]; t0t2: PairedScores[] } {
  const scoreOf = (row: AssessmentRow | null): number | null => {
    if (!row) return null;
    return metric === "scc" ? row.sccTotalScore : row.cdseTotalScore;
  };

  const t0t1: PairedScores[] = [];
  const t0t2: PairedScores[] = [];

  for (const [userId, tp] of byUser) {
    const pre = scoreOf(tp.t0);
    if (pre == null) continue;

    const post1 = scoreOf(tp.t1);
    if (post1 != null) t0t1.push({ userId, pre, post: post1 });

    const post2 = scoreOf(tp.t2);
    if (post2 != null) t0t2.push({ userId, pre, post: post2 });
  }

  return { t0t1, t0t2 };
}
