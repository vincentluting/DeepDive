// ============================================================
// Coach OS governance constants
// ============================================================

export const COACHING_GOVERNANCE = {
  promptVersion: "coach-os-prompt-v1-2026-06-10",
  evalVersion: "coach-eval-v2-2026-06-10",
  judgeVersion: "coach-judge-v1-2026-06-10",
  boundaries:
    "AI career coaching support; not therapy, not diagnosis, not a substitute for licensed professional care.",
  escalation:
    "Sensitive turns use a yellow-card support path; crisis or self-harm language triggers crisis escalation resources.",
  dataUse:
    "User coaching content is used to provide and improve the product experience; it is not used to train base models.",
  humanReview:
    "Low-quality or judge-failed turns enter a review pool for periodic human quality review.",
} as const;

export function buildCoachingGovernanceState(): {
  promptVersion: string;
  evalVersion: string;
  judgeVersion: string;
} {
  return {
    promptVersion: COACHING_GOVERNANCE.promptVersion,
    evalVersion: COACHING_GOVERNANCE.evalVersion,
    judgeVersion: COACHING_GOVERNANCE.judgeVersion,
  };
}
