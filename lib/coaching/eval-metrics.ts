// ============================================================
// Coaching eval metrics — dashboard-ready quality rates
// ============================================================

export interface CoachingQualityMetricRow {
  depthScore: number;
  transitionScore: number;
  evidenceGroundingScore: number;
  prematureAdviceFlag: boolean;
  genericSummaryFlag: boolean;
  oneQuestionCompliance: boolean;
  reasonsJson: unknown;
  stateJson: unknown;
}

export interface CoachingQualityMetrics {
  totalTurns: number;
  too_superficial_rate: number;
  abstract_reply_rate: number;
  disjointed_rate: number;
  missed_user_question_rate: number;
  rewrite_rate: number;
  eval_pass_rate: number;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function hasReason(reasons: string[], pattern: RegExp): boolean {
  return reasons.some((reason) => pattern.test(reason));
}

function rate(count: number, total: number): number {
  return total === 0 ? 0 : count / total;
}

function rowPasses(row: CoachingQualityMetricRow, reasons: string[]): boolean {
  const state = asRecord(row.stateJson);
  return (
    row.depthScore >= 3 &&
    row.transitionScore >= 3 &&
    row.evidenceGroundingScore >= 3 &&
    !row.prematureAdviceFlag &&
    !row.genericSummaryFlag &&
    row.oneQuestionCompliance &&
    state.llmJudgeStatus !== "fail" &&
    !hasReason(
      reasons,
      /did-not-answer|missed-user-question|too-abstract|premature|missing-transition/i,
    )
  );
}

export function computeCoachingQualityMetrics(
  rows: CoachingQualityMetricRow[],
): CoachingQualityMetrics {
  const total = rows.length;
  let tooSuperficial = 0;
  let abstractReply = 0;
  let disjointed = 0;
  let missedQuestion = 0;
  let rewrite = 0;
  let pass = 0;

  for (const row of rows) {
    const reasons = asStringArray(row.reasonsJson);
    const state = asRecord(row.stateJson);

    if (
      row.depthScore <= 2 ||
      hasReason(reasons, /too_superficial|low-coaching-depth/i)
    ) {
      tooSuperficial += 1;
    }
    if (
      row.genericSummaryFlag ||
      hasReason(reasons, /too-abstract|abstract-language/i)
    ) {
      abstractReply += 1;
    }
    if (
      row.transitionScore <= 2 ||
      hasReason(reasons, /missing-transition|low-transition|disjointed/i)
    ) {
      disjointed += 1;
    }
    if (hasReason(reasons, /did-not-answer|missed-user-question/i)) {
      missedQuestion += 1;
    }
    if (
      state.qualityRewrite === "1" ||
      state.qualityRewrite === "failed"
    ) {
      rewrite += 1;
    }
    if (rowPasses(row, reasons)) {
      pass += 1;
    }
  }

  return {
    totalTurns: total,
    too_superficial_rate: rate(tooSuperficial, total),
    abstract_reply_rate: rate(abstractReply, total),
    disjointed_rate: rate(disjointed, total),
    missed_user_question_rate: rate(missedQuestion, total),
    rewrite_rate: rate(rewrite, total),
    eval_pass_rate: rate(pass, total),
  };
}
