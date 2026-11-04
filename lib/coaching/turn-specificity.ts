// ============================================================
// Coaching turn specificity gate
//
// Detects replies that sound polished but fail the user's actual turn:
// too abstract, missing concrete anchors, or dodging a direct question.
// ============================================================

import type { CoachingTurnState } from "./turn-state";
import type { CoachingTurnUnderstanding } from "./turn-understanding";

export interface CoachingSpecificityEvalResult {
  pass: boolean;
  specificityScore: number;
  answeredUserRequest: boolean;
  concreteAnchorPresent: boolean;
  tooAbstractFlag: boolean;
  reasons: string[];
}

const ABSTRACT_TERMS = [
  "pattern",
  "tension",
  "explore",
  "journey",
  "inner",
  "clarity",
  "possibility",
  "framework",
  "\u6a21\u5f0f",
  "\u5f20\u529b",
  "\u63a2\u7d22",
  "\u65c5\u7a0b",
  "\u5185\u5728",
  "\u6e05\u6670",
  "\u53ef\u80fd\u6027",
  "\u6846\u67b6",
  "\u89c9\u5bdf",
  "\u8fde\u63a5",
  "\u65b9\u5411",
];

function stripMarkers(text: string): string {
  return text
    .replace(/<<QUICK_REPLIES>>[\s\S]*?<<\/QUICK_REPLIES>>/g, "")
    .replace(/<<CRISIS_ALERT>>|<<ANXIETY_ESCALATION>>/g, "")
    .trim();
}

function includesAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function countTerms(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(escaped.toLowerCase(), "g"));
    return count + (matches?.length ?? 0);
  }, 0);
}

function hasEvidenceFromState(text: string, state: CoachingTurnState): boolean {
  if (state.evidenceQuote) {
    const fragments = state.evidenceQuote
      .split(/[，,。.!！?？；;\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 3);
    if (fragments.some((fragment) => text.includes(fragment))) return true;
  }
  return state.knownFacts.some((fact) => {
    const anchor = fact.slice(0, 10);
    return anchor.length >= 5 && text.includes(anchor);
  });
}

function answerCuePresent(text: string): boolean {
  return /because|this is because|the reason|what's happening|this is happening|my read|i think|the issue is|\u56e0\u4e3a|\u539f\u56e0|\u95ee\u9898\u5728\u4e8e|\u6211\u7684\u5224\u65ad|\u6211\u4f1a\u5148\u8fd9\u6837\u770b|\u4e0d\u662f.*\u800c\u662f|\u8fd9\u8bf4\u660e/i.test(
    text,
  );
}

export function evaluateCoachingSpecificity(params: {
  assistantMessage: string;
  turnState: CoachingTurnState;
  understanding: CoachingTurnUnderstanding;
}): CoachingSpecificityEvalResult {
  const assistant = stripMarkers(params.assistantMessage);
  const reasons: string[] = [];
  const concreteAnchorPresent =
    includesAny(assistant, params.understanding.concreteReferences) ||
    hasEvidenceFromState(assistant, params.turnState);

  const abstractCount = countTerms(assistant, ABSTRACT_TERMS);
  const sentenceCount = Math.max(
    1,
    (assistant.match(/[。.!！？?]/g) ?? []).length,
  );
  const tooAbstractFlag =
    abstractCount >= 4 && !concreteAnchorPresent && assistant.length > 120;

  const answeredUserRequest =
    !params.understanding.needsDirectAnswer ||
    answerCuePresent(assistant) ||
    params.understanding.requestType === "pastes_jd";

  if (!concreteAnchorPresent) reasons.push("missing-concrete-anchor");
  if (tooAbstractFlag) reasons.push("too-abstract");
  if (!answeredUserRequest) reasons.push("did-not-answer-user-request");
  if (
    params.understanding.clarifyIfMissing &&
    assistant.length > 180 &&
    (assistant.match(/[?？]/g) ?? []).length === 0
  ) {
    reasons.push("interpreted-without-clear-object");
  }

  const specificityScore = Math.max(
    1,
    Math.min(
      5,
      3 +
        (concreteAnchorPresent ? 1 : -1) +
        (answeredUserRequest ? 1 : -1) -
        (tooAbstractFlag ? 1 : 0) -
        Math.max(0, Math.ceil(abstractCount / sentenceCount) - 2),
    ),
  );

  const pass =
    specificityScore >= 3 &&
    concreteAnchorPresent &&
    answeredUserRequest &&
    !tooAbstractFlag;

  return {
    pass,
    specificityScore,
    answeredUserRequest,
    concreteAnchorPresent,
    tooAbstractFlag,
    reasons,
  };
}

export function buildCoachingQualityRewriteInstruction(params: {
  locale: string;
  reasons: string[];
  understanding: CoachingTurnUnderstanding;
}): string {
  const reasons = params.reasons.join(", ") || "quality-gate-failed";
  const refs =
    params.understanding.concreteReferences.length > 0
      ? params.understanding.concreteReferences.join(" | ")
      : params.locale === "zh"
        ? "\u7528\u6237\u539f\u8bdd\u91cc\u7684\u5177\u4f53\u5bf9\u8c61"
        : "the concrete object in the user's words";

  if (params.locale === "zh") {
    return `## 质量闸门：请重写上一版回复
上一版回复没有达到教练质量要求，失败原因：${reasons}

重写要求：
- 不要提到“质量闸门”或“重写”
- 第一段必须直接回应用户真实问题：${params.understanding.specificAsk ?? params.understanding.responseObligation}
- 必须显式锚定至少一个具体对象：${refs}
- 不要只说“模式、张力、探索、方向、内在”等抽象词；每个抽象判断都要接到用户原话或具体事实
- 如果用户在质疑 AI 教练质量，先诊断为什么会抽象/虚化，再说明会怎样具体接住
- 最多一个问题，问题必须建立在前面的具体回应之后`;
  }

  return `## Quality Gate: rewrite the previous draft
The previous draft failed coaching quality checks: ${reasons}

Rewrite requirements:
- Do not mention the quality gate or the rewrite
- First paragraph must directly answer the user's live question: ${params.understanding.specificAsk ?? params.understanding.responseObligation}
- Explicitly anchor in at least one concrete object: ${refs}
- Do not rely on abstract words like pattern, tension, exploration, direction, or inner; attach every abstract read to user evidence
- If the user is critiquing coach quality, diagnose why the reply felt abstract, then state what changes concretely
- Ask at most one question, and only after the concrete answer`;
}
