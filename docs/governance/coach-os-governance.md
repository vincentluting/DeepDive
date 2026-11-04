# Coach OS Governance

Last updated: 2026-06-10

## Scope

Coach OS is an AI career identity coaching system. It helps users understand their assessment/report evidence, form tentative coaching hypotheses, practice career conversations, and turn insights into small actions.

It is not therapy, diagnosis, legal advice, financial advice, immigration advice, or a substitute for licensed professional care.

## User-Facing Boundary

The product must clearly indicate that coaching is an AI system and not a licensed therapist. Sensitive emotional content is handled with support resources and escalation, not clinical claims.

## Safety Escalation

- Normal: continue coaching with evidence grounding and at most one question.
- Sensitive: acknowledge the concern, avoid diagnosis, and recommend appropriate human support when needed.
- Crisis: self-harm or suicidal ideation triggers crisis resources and the `<<CRISIS_ALERT>>` path.

## Data Use

Coaching data is used to provide the service, personalize the user experience, record quality telemetry, and support human quality review. It is not used to train base models.

## Quality Review

Low-quality or LLM-judge-failed turns enter `CoachingReviewPool`. Reviewers should inspect concrete failures: missed user question, abstract language, weak evidence grounding, disjointed transition, missed emotion, or premature advice.

## Versioning

Every saved `CoachingTurnEval.stateJson` should include:

- `promptVersion`
- `evalVersion`
- `judgeVersion`

Current versions are defined in `lib/coaching/governance.ts`.

## Deletion

User deletion must cover coaching memory, hypotheses, review pool entries, turn evals, sessions, feedback, action items/plans, and related reports/profile data.
