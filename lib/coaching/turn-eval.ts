// ============================================================
// Coaching turn evaluation — deterministic quality signals
//
// This is the first layer of the quality loop. It is intentionally cheap and
// local: useful for dashboards, sampling, and regression tests. A future LLM
// judge can use the same shape.
// ============================================================

import type { CoachingTurnState } from "./turn-state";

export interface CoachingTurnEvalResult {
  depthScore: number;
  transitionScore: number;
  evidenceGroundingScore: number;
  prematureAdviceFlag: boolean;
  genericSummaryFlag: boolean;
  oneQuestionCompliance: boolean;
  reasons: string[];
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(5, score));
}

function stripMarkers(text: string): string {
  return text
    .replace(/<<QUICK_REPLIES>>[\s\S]*?<<\/QUICK_REPLIES>>/g, "")
    .replace(/<<CRISIS_ALERT>>|<<ANXIETY_ESCALATION>>/g, "")
    .trim();
}

function questionCount(text: string): number {
  return (text.match(/[?？]/g) ?? []).length;
}

function hasBridge(text: string): boolean {
  return /so the next useful place|that makes the next question|before we move|the bridge|what connects|这就把|所以这里真正值得|在往下走之前|这中间的连接|承接|接住/i.test(
    text,
  );
}

function hasEvidenceAnchor(text: string, state: CoachingTurnState): boolean {
  const quote = state.evidenceQuote;
  if (quote) {
    const quoteStart = quote.slice(0, 18);
    if (quoteStart.length >= 6 && text.includes(quoteStart)) return true;
    const fragments = quote
      .split(/[，,。.!！?？；;\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 4);
    if (fragments.some((fragment) => text.includes(fragment))) return true;
  }
  return state.knownFacts.some((fact) => {
    const anchor = fact.slice(0, 12);
    return anchor.length >= 6 && text.includes(anchor);
  });
}

function hasPrematureAdvice(text: string, state: CoachingTurnState): boolean {
  if (state.currentPhase === "action") return false;
  return /\byou should\b|\btry\b|\bconsider\b|\bnext step\b|你应该|你可以试试|建议你|下一步/i.test(
    text,
  );
}

function looksGeneric(text: string): boolean {
  return /i understand|that sounds|it makes sense|我理解|听起来|这很正常|这是一个很好的/i.test(
    text.slice(0, 160),
  );
}

export function evaluateCoachingTurn(params: {
  userMessage: string | null;
  assistantMessage: string;
  turnState: CoachingTurnState;
}): CoachingTurnEvalResult {
  const assistant = stripMarkers(params.assistantMessage);
  const reasons: string[] = [];
  const anchored = hasEvidenceAnchor(assistant, params.turnState);
  const bridge = hasBridge(assistant);
  const questions = questionCount(assistant);
  const prematureAdviceFlag = hasPrematureAdvice(assistant, params.turnState);
  const genericSummaryFlag = looksGeneric(assistant) && !anchored;
  const oneQuestionCompliance = questions <= 1;

  if (!anchored) reasons.push("missing-user-evidence-anchor");
  if (!bridge) reasons.push("missing-transition-bridge");
  if (prematureAdviceFlag) reasons.push("premature-advice");
  if (genericSummaryFlag) reasons.push("generic-summary-opening");
  if (!oneQuestionCompliance) reasons.push("too-many-questions");

  const depthScore = clampScore(
    3 +
      (params.turnState.unconfirmedHypotheses.length > 0 ? 1 : 0) +
      (assistant.length > 180 ? 1 : 0) -
      (genericSummaryFlag ? 2 : 0) -
      (prematureAdviceFlag ? 1 : 0),
  );
  const transitionScore = clampScore(bridge ? 5 : anchored ? 3 : 2);
  const evidenceGroundingScore = clampScore(
    anchored ? 5 : params.turnState.evidenceQuote ? 2 : 3,
  );

  return {
    depthScore,
    transitionScore,
    evidenceGroundingScore,
    prematureAdviceFlag,
    genericSummaryFlag,
    oneQuestionCompliance,
    reasons,
  };
}
