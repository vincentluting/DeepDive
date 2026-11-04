---
title: Scoring Pipeline v3.0
category: architecture
sources:
  - lib/scoring/index.ts
  - lib/scoring/score-ipip60.ts
  - lib/scoring/score-ddvq21.ts
  - lib/scoring/score-sjt.ts
  - lib/scoring/riasec-utils.ts
  - lib/scoring/layer3-derive.ts
  - lib/scoring/constants.ts
  - lib/scoring/behavior-insights.ts
  - lib/types/assessment.ts
sync_mode: partial
last_verified: 2026-04-13
verified_by: claude-code
---

# Scoring Pipeline v3.0

Entry point: `runScoringPipelineV3()` in `lib/scoring/index.ts`.

## Overview

86 questions across 3 modules, producing `AssessmentResultV3`. The pipeline is pure synchronous computation with no IO or LLM calls.

```
Raw Answers (86 items)
  |
  v
Layer 1: Score each module independently
  ├── Module A: SJT (6 scenarios)        → scoreSJTGaps()
  ├── Module B: TwIVI (20 items)         → scoreDDVQ21()
  └── Module C: IPIP-NEO-60 (60 items)       → scoreIPIP60()
  |
  v
Layer 2: Derive cross-module constructs
  ├── Archetype = RIASEC Top-1 × ValueOrientation (Enhancement|Transcendence)  → buildArchetype()
  ├── Cognitive Style = Big Five mapping                  → deriveCognitiveStyleFromBigFive()
  └── Collaboration Style = Big Five + facets             → mapBigFiveToCollabStyle()
  |
  v
Layer 3: Quality metadata (rush detection, answer counts)
  |
  v
Output: AssessmentResultV3
```

## Input

- `QuestionnaireAnswersV3` — answers grouped by module:
  - `sjt: SJTAnswer[]` (6 scenarios, each with ideal + worst picks)
  - `values: Record<number, number>` (TwIVI, items 1-20, scale 1-6). Deprecated `pvq` field accepted as fallback.
  - `ipip60: Record<number, number>` (IPIP-NEO-60, items by id, scale 1-5)
- `previousRiasec: Record<RIASECDimension, number>` — RIASEC scores (0-100) inherited from Quick Dive
- `SessionMetadataV3` — timing data for rush detection. Module time keys: `sjt`, `ddvq`, `ipip60`.

**RIASEC is NOT re-measured** in Deep Dive. It comes from the Quick Dive result (`QuickDiveResult.scoresJson`).

## Module Details

### Module A: SJT (Situational Judgment Test)

`scoreSJTGaps()` in `lib/scoring/score-sjt.ts`.

6 workplace scenarios, each with 4 response options. User picks "most likely" and "least likely". Measures gaps between stated values (TwIVI) and behavioral tendencies. Output: per-scenario gap scores + overall consistency + notable tensions.

### Module B: TwIVI (Twenty Item Values Inventory)

`scoreDDVQ21()` in `lib/scoring/score-ddvq21.ts`.

20 items mapping to 10 Schwartz basic values (Sandy, Gosling, Schwartz & Koelkebeck, 2017). Scale: 1-6. Input field is `values` in `QuestionnaireAnswersV3` (deprecated `pvq` field accepted for backward compatibility).

Output:

- `raw`: 10 value scores (mean per value)
- `centered`: ipsative-centered scores (individual mean subtracted) — standard Schwartz methodology
- `higherOrder`: 4 higher-order values (openness-to-change, conservation, self-enhancement, self-transcendence)
- `ranking`: all 10 values sorted by centered score
- `top3`: top 3 values by centered score

### Module C: IPIP-NEO-60

`scoreIPIP60()` in `lib/scoring/score-ipip60.ts`.

60 items measuring Big Five personality domains (12 items per domain). Scale: 1-5. Precision level: `"standard"` (vs `"screening"` for the deprecated IPIP-30).

Output:

- `domains`: 5 domain scores (extraversion, agreeableness, conscientiousness, neuroticism, openness)
- `facets`: 30 facet scores (6 per domain, 2 items each)
- `domainsNormalized`: z-score normalized domain scores
- `precision`: `"standard"`

## Layer 2: Derived Constructs

### Archetype (12-type)

`buildArchetype()` in `lib/scoring/riasec-utils.ts`.

Formula: `RIASEC Top-1` × `Value Orientation (Enhancement | Transcendence)` = 12 types.

Value orientation is derived from Schwartz **raw** scores (not ipsatively centered): mean(Achievement, Power) vs mean(Benevolence, Universalism) from TwIVI. Raw means are used instead of centered scores to maintain measurement invariance with Quick Dive (which also uses raw means of the same 4 value types); ipsative centering introduces MRAT bias from 6 unrelated values that can flip the binary orientation. `deriveValueOrientation()` compares these two means directly. Hedonism is excluded from the Enhancement axis despite being part of the higher-order self-enhancement dimension, due to its ambiguous placement in the Schwartz circumplex and near-zero RIASEC discriminating power (Sagiv 2002). Ipsative centering remains in use for the full Schwartz profile (ranking, top3, higherOrder).

Confidence (RIASEC differentiation): gap12 >= 15 → 0.85, gap12 >= 10 → 0.70, gap12 >= 5 → 0.55, else 0.40. Boundary detection: gap12 <= 5 → `isBoundary: true`.

Labels looked up from `ARCHETYPE_MAP` in `constants.ts`. Code format: `${primary}-${orientation}` (e.g. `R-enhancement`).

See `docs/architecture/archetype-system.md` for full details.

### Cognitive Style

`deriveCognitiveStyleFromBigFive()` in `lib/scoring/index.ts`.

Maps Big Five domains to approximate cognitive style axes (McCrae & Costa, 1989):

- E/I: Extraversion (>= 3.0 → E)
- S/N: Openness (>= 3.0 → N)
- T/F: Agreeableness (>= 3.0 → F)
- J/P: Conscientiousness (>= 3.0 → J)

When 2+ axes are near midpoint (< 0.5 distance), `displayMode` becomes `"balanced"` and code is `null`.

**Terminology**: We call this "Cognitive Style", NOT "MBTI". Similarly "Collaboration Style", NOT "DISC".

### Collaboration Style

`mapBigFiveToCollabStyle()` in `lib/scoring/layer3-derive.ts`.

Derived from Big Five domains + facets. Maps to collaboration behavior patterns.

## Output: AssessmentResultV3

Key fields in the output type (defined in `lib/types/assessment.ts`):

| Field                | Source                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `bigFive`            | Module C (IPIP-NEO-60)                                                 |
| `schwartz`           | Module B (TwIVI)                                                       |
| `tensions`           | Module A (SJT)                                                         |
| `riasecNormalized`   | Inherited from Quick Dive                                              |
| `archetype`          | RIASEC × Enhancement/Transcendence (12-type)                           |
| `cognitiveStyleCode` | Big Five mapping                                                       |
| `collabMapping`      | Big Five + facets                                                      |
| `meta`               | Quality: rush count, timing, answer count, optional `generationSource` |

> `archetype12` and `archetype24` fields exist as deprecated aliases for `archetype`.

### v3.0 `meta.moduleTimes` keys

| Key      | Module                  |
| -------- | ----------------------- |
| `sjt`    | SJT scenarios           |
| `ddvq`   | TwIVI values            |
| `ipip60` | IPIP-NEO-60 personality |

## Quality: Rush Detection

Items answered faster than module-specific thresholds (defined in `constants.ts` as `RUSH_THRESHOLD_MS`) are counted. The `meta.rushCount` field reports total rushed responses across all modules.

## Re-exports

The scoring `index.ts` re-exports key functions and types for external use:

- `scoreIPIP60`, `scoreDDVQ21`, `scoreSJTGaps`, `mapBigFiveToCollabStyle`
- Types: `SJTAnswer`, `IPIP60Result`, `DDVQ21Result`, `SJTResult`

## Deprecated: v2.0 Pipeline

The `QuestionnaireAnswers` interface (without `V3` suffix) and `AssessmentResult` (v2.0) are marked `@deprecated`. The v2.0 scoring pipeline (`runScoringPipeline`) has been removed. `AssessmentResult` is retained for reading historical data from DB. `QuestionnaireAnswers` is retained for potential Ultra Deep Dive use.
