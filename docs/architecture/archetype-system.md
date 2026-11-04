---
title: 12 Archetype System
category: architecture
sources:
  - lib/scoring/riasec-utils.ts
  - lib/scoring/constants.ts
  - lib/types/dimensions.ts
  - lib/content/archetypes-12.ts
  - lib/content/archetype-relations.ts
  - lib/content/archetype-growth.ts
  - lib/content/shadow-content.ts
sync_mode: partial
last_verified: 2026-04-13
verified_by: claude-code
---

# 12 Archetype System

## Formula

```
Archetype = RIASEC Top-1 × Value Orientation
          = 6 × 2 = 12 types
```

Two axes:

- **RIASEC Top-1**: Highest-scoring dimension from Quick Dive (R, I, A, S, E, C)
- **Value Orientation**: Based on Schwartz Self-Enhancement vs Self-Transcendence axis (from TwIVI)
  - `Enhancement` — self-enhancement values dominate (Achievement + Power)
  - `Transcendence` — self-transcendence values dominate (Benevolence + Universalism)

Code format: `${primary}-${orientation}` (e.g. `"R-enhancement"`, `"I-transcendence"`, `"A-enhancement"`).

## Computation

### Step 1: Derive Value Orientation

`deriveValueOrientation()` in `lib/scoring/riasec-utils.ts`:

1. Compare Self-Enhancement score mean(Achievement, Power) vs Self-Transcendence score mean(Benevolence, Universalism) from TwIVI **raw** scores (not ipsatively centered — raw means maintain measurement invariance with Quick Dive and avoid MRAT bias from unrelated values)
2. **Hedonism excluded**: ambiguous placement in Schwartz circumplex (boundary between Enhancement and Openness), near-zero RIASEC discriminating power (Sagiv 2002), ensures Quick Dive and Deep Dive use identical value definitions
3. Higher score determines orientation: `"enhancement"` or `"transcendence"`
4. Confidence = `min(gap / 2, 1)` — gap of 2+ yields full confidence

### Step 2: Build Archetype

`buildArchetype()` in `lib/scoring/riasec-utils.ts`:

1. Sort RIASEC dimensions by score descending, with Holland-order tiebreaker (R-I-A-S-E-C) for deterministic results regardless of JS/PostgreSQL JSONB key order → `p1` (top-1), `p2` (top-2), `p3` (top-3), plus `gap12` and `gap23`
2. Combine RIASEC Top-1 with Value Orientation to produce archetype code (`"R-enhancement"`, `"I-transcendence"`, etc.)
3. Look up labels from `ARCHETYPE_MAP` in `constants.ts`
4. Calculate confidence: `gap12 >= 15 → 0.85`, `>= 10 → 0.70`, `>= 5 → 0.55`, `< 5 → 0.40`
5. Detect boundary cases: `isBoundary = true` when `gap12 <= 5`

Output: `Archetype` interface (defined in `lib/types/dimensions.ts`).

### Key Output Fields

| Field                      | Description                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `code`                     | Archetype code: `"R-enhancement"`, `"I-transcendence"`, `"A-enhancement"`, etc.                   |
| `primary`                  | RIASEC dimension (R/I/A/S/E/C)                                                                    |
| `orientation`              | `'enhancement'` \| `'transcendence'` (`ValueOrientation` type)                                    |
| `label_en`, `label_zh`     | Display names from `ARCHETYPE_MAP`                                                                |
| `tagline_en`, `tagline_zh` | One-line descriptions                                                                             |
| `confidence`               | 0–1, based on RIASEC score differentiation (gap12)                                                |
| `confidenceLevel`          | `'high'` (≥0.75) / `'medium'` (≥0.5) / `'low'`                                                    |
| `isBoundary`               | True when `gap12 <= 5`                                                                            |
| `valueScores`              | Optional `{ enhancement, transcendence }` — raw mean scores passed to `deriveValueOrientation()`  |
| `derivedFrom.primary`      | `{ dimension, score }` — Top-1 RIASEC                                                             |
| `derivedFrom.secondary`    | `{ dimension, score }` — Top-2 RIASEC                                                             |
| `derivedFrom.tertiary`     | `{ dimension, score }` — Top-3 RIASEC                                                             |
| `derivedFrom.gap12`        | Top-1 minus Top-2 score                                                                           |
| `derivedFrom.gap23`        | Top-2 minus Top-3 score                                                                           |
| `derivedFrom.relation`     | `'dominant'` \| `'adjacent'` \| `'cross'` (`HollandRelation` type) — retained for RIASEC analysis |

## Content Layers

### Layer 1: 12-Type Full Narratives (`lib/content/archetypes-12.ts`)

`ARCHETYPES: Record<string, ArchetypeContent>` — 12 entries with:

- Bilingual narratives (400+ words each)
- `coreStrengths` (4-5 items), `growthEdges` (3-4 items)
- `collaborationStyle_zh/en`
- `colorHex`

**Frozen**: Add-only, no modifications to existing entries.

### Layer 1b: Archetype Relations (`lib/content/archetype-relations.ts`)

Mirror types, allies, and growth edges for all 12 archetypes. Each archetype has:

- `mirror`: the archetype that shares the same RIASEC but opposite value orientation
- `allies`: related archetypes with complementary strengths
- `growthEdge`: archetypes that represent growth areas

Bilingual content (zh + en). Used by coaching system for "grown self" persona construction.

### Layer 1c: Archetype Growth Paths (`lib/content/archetype-growth.ts`)

Maturation arc with coaching nudges for all 12 archetypes. Each has:

- Growth trajectory description
- Phase-based coaching guidance
- Bilingual content (zh + en)

Used by coaching system to inject growth path context into the system prompt.

### Layer 3: Career Narratives (`lib/content/career-narratives.ts`)

Golden quotes + day-in-the-life narratives for 1,140 career directions (keyed by `careerId`). Used for career matching storytelling.

### Layer 3b: Holland Code Narratives (`lib/content/holland-code-narratives.ts`)

Golden quotes + day-in-the-life narratives keyed by 3-letter Holland code (83 entries, from O\*NET data).

### Layer 4: Shadow Content (`lib/content/shadow-content.ts`)

Shadow-side narratives — potential blind spots and growth edges.

**Frozen**: Add-only.

## Where Archetypes Are Used

| Consumer           | How                                                                           |
| ------------------ | ----------------------------------------------------------------------------- |
| Profile generation | Archetype embedded in `PersonalProfile`, stored as `algoSnapshot`             |
| Career report      | `generateCareerReport()` reads `algoSnapshot.archetype` for narrative context |
| Report header      | Archetype label as report title                                               |
| Career matching    | Archetype influences career direction scoring                                 |
| Coaching system    | Archetype context injected into coaching system prompt                        |

## RIASEC Source

RIASEC is measured only in Quick Dive (30 questions, 5 per dimension). Two normalization paths:

- **Classic Mini-IP** (0-4 Likert × 5 items = max 20): `normalizeRiasecScores()` (convenience wrapper)
- **Immersive Dive** (1-5 Likert × 5 items = max 25): `normalizeRiasecScoresWithMax(scores, 25)`

Both normalize to 0-100 via `normalizeRiasecScoresWithMax()` in `riasec-utils.ts`.

Deep Dive does NOT re-measure RIASEC. The Quick Dive result is inherited via `QuickDiveResult.scoresJson`.

## Migration Notes

- Legacy `Archetype12`, `Archetype24` type aliases have been removed → use `Archetype`
- Legacy `ARCHETYPE_12_MAP`, `ARCHETYPE_24_MAP` aliases have been removed → use `ARCHETYPE_MAP`
- Legacy `buildArchetype12()`, `buildArchetype24()` have been removed → use `buildArchetype()`
- `AssessmentResult` (v2.0) and `AssessmentResultV3` (v3.0) both use `archetype: Archetype` field directly
- 18-type system (RIASEC × Core/Blend/Bridge) replaced by 12-type system (RIASEC × Enhancement/Transcendence)
- `ExpressionMode` type deprecated → replaced by `ValueOrientation`
- Career narratives live in `lib/content/career-narratives.ts` (keyed by careerId) and `lib/content/holland-code-narratives.ts` (keyed by Holland code)
- New types in `lib/types/dimensions.ts`: `ValueOrientation`, `HollandRelation`
