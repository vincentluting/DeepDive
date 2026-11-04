# Coach OS Risk Register

Last updated: 2026-06-10

| Risk | Level | Mitigation |
| --- | --- | --- |
| User treats AI coach as therapy | High | AI boundary disclosure, no diagnosis prompt rules, crisis escalation resources |
| Abstract or generic coaching replies | Medium | Deterministic gate, LLM judge, automatic rewrite, golden conversations |
| AI overstates hypotheses as facts | Medium | Hypothesis memory labels active hypotheses as tentative until user confirms |
| Reality constraints ignored | Medium | Unified evidence packet includes reality constraints and action signals |
| Sensitive data retained after deletion | High | User deletion path covers `CoachingReviewPool`, `CoachingTurnEval`, `CoachingHypothesis`, sessions, feedback |
| Action advice becomes too large or risky | Medium | Seven-day action generator caps scope and keeps actions small |
| Role-play feedback feels evaluative or shaming | Low | Feedback rubric focuses on clarity, values alignment, avoidance points, next practice |
| Quality drift after prompt/model changes | Medium | Versioned prompt/eval/judge state and periodic review pool sampling |
