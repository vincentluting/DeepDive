---
title: Report Generation Pipeline
category: architecture
sources:
  - lib/report-generation/index.ts
  - lib/report-generation/career-match-algorithm.ts
  - lib/report-generation/diversity-quota.ts
  - lib/report-generation/career-match-narrative.ts
  - lib/report-generation/career-pathway.ts
  - lib/report-generation/integration.ts
  - lib/report-generation/career-drain-algorithmic.ts
  - lib/report-generation/career-drain-content.ts
  - lib/report-generation/header.ts
  - lib/report-generation/common-rules.ts
  - lib/report-generation/prompt-utils.ts
  - lib/report-generation/types.ts
  - lib/report/prerequisites.ts
  - lib/profile-generation/profile-algorithm.ts
  - lib/profile-generation/generate-identity-narratives.ts
  - lib/types/report.ts
  - app/api/generate-report/route.ts
  - lib/report-generation/language-guard.ts
  - lib/i18n/language-detect.ts
sync_mode: partial
last_verified: 2026-06-15
verified_by: claude-code
---

# Report Generation Pipeline

Entry point: `generateCareerReport()` in `lib/report-generation/index.ts`.
Prerequisites & staleness: `lib/report/prerequisites.ts`.
API route: `app/api/generate-report/route.ts`.

## Overview

**Architecture note:** Profile and Report are now separate products. Profile is generated first (after assessment completion), and Report is generated on-demand. The profile algorithm (`computeProfileAlgorithm()`) runs during profile generation; Report reads the profile's `algoSnapshot` from DB to avoid recomputation.

Generates a `CareerReport` from `AssessmentInput` + optional `RealConditions`. Approximately 65% pure algorithm, 35% LLM. Total pipeline timeout: 180s. Per-LLM-call timeout: 90s. Report pipeline now makes 2-3 LLM calls (was 4), since profile narrative is generated separately.

## Prerequisites Gate

Before report generation begins, the API route (`/api/generate-report`) enforces prerequisites. Logic lives in `lib/report/prerequisites.ts`.

### `checkPrerequisites()`

Determines whether report generation can proceed:

| Check                         | Required?     | Source                                                |
| ----------------------------- | ------------- | ----------------------------------------------------- |
| `assessmentId` exists         | Yes           | Request body                                          |
| Profile exists (`hasProfile`) | Yes           | `getProfileByAssessment()`                            |
| Reality conditions            | No (optional) | `getRealConditionsByUserId()` / `getRealConditions()` |

Returns `{ canGenerate, missingConditions, assessmentId }`. When `missingConditions` is true, the report is still generated but Career Pathway falls back to a placeholder.

### journeyState as prerequisite

The journey state machine (`lib/journey/state-machine.ts`) serves as the authoritative source for user progress. Consumers use `hasReached(journeyState, 'profile_generated')` to gate access to report-dependent pages (e.g., profile page redirects to dashboard if the user hasn't reached the `profile_generated` milestone). After successful report generation, the API route transitions the journey via `transitionJourney(userId, 'GENERATE_REPORT', 'system')`.

## Staleness Detection

Reports can become stale when the user updates their reality conditions after generation. The system detects this via input hashing.

### `computeInputHash()`

Computes a deterministic SHA-256 hash (truncated to 16 hex chars) of all inputs that affect report content:

- `assessmentId` (assessment scores are immutable, so this is stable)
- `realConditions` (the primary driver of staleness)

The hash is stored in `CareerReport.inputHash` (DB column) at save time.

### `checkReportFreshness()`

Compares the stored hash against a freshly computed hash from current inputs. Returns one of:

- `'fresh'` — stored hash matches current inputs
- `'stale'` — inputs have changed since report was generated
- `'missing'` — no stored hash (legacy reports)

Consumer example: the profile page (`app/[locale]/(app)/profile/[id]/page.tsx`) computes freshness and passes `reportStale` to `ProfileDashboard`, enabling a "regenerate" prompt.

### Refresh flow

The API route accepts a `refresh` flag. When true, the existing report is deleted and a new one is generated with the current inputs and a fresh `inputHash`.

## Pipeline Steps

```
Input: AssessmentInput + RealConditions? + locale + ProfileAlgoSnapshot (from DB)

Step 0: buildReportHeader()
  → Archetype label, report title (from Quick Dive archetype)

Step 1: Algorithm layer (async — awaits career pool loading)
  └── computeCareerMatchAlgorithm() → career direction matching & ranking (3+2+AI architecture)
  (Profile algorithm already computed during profile generation)

Step 2: PARALLEL (2 LLM calls + algo)
  ├── generateCareerMatchNarrative(LLM) — career direction + AI-era direction explanations
  ├── generateCareerPathway(LLM)        — action pathway (only if realConditions exist)
  └── generateCareerDrainAlgorithmic()  — pure algo, no LLM
  └── computeAiEraPersonalInsight()     — pure algo, AI-era moat/watch-out/positioning

Step 3: SEQUENTIAL (1 LLM call)
  └── generateIntegration(LLM) — cross-panel synthesis

Output: CareerReport
```

**Total: 2-3 LLM calls** (1-2 parallel + 1 sequential). Career pathway uses a lightweight career match summary to run in parallel with the career match narrative.

## Panel Details

### Career Direction Match (`career-match-algorithm.ts` + `career-match-narrative.ts`)

**Algorithm** (`computeCareerMatchAlgorithm`, async):

- Thin wrapper around the unified career exploration engine (`lib/career-matching/engine.ts`)
- `explore()` internally awaits `ensureCareerPoolLoaded()` — no cold-start empty pool
- Match score = weighted combination of RIASEC fit, values alignment, personality compatibility, adaptability fit, optional collab fit, optional industry fit
- When `RealConditions` provided: applies industry and seniority filters to re-rank
- 3+2+AI architecture: 3 primary directions (deep LLM narratives) + 2 exploratory (algorithm-only) + top 3 AI-era opportunity directions (ai-native/augmented)
- Diversity quota (`diversity-quota.ts`): caps same-RIASEC-family roles at `MAX_PER_RIASEC_GROUP` (2) across the 5 main slots via `selectWithQuota`, so converging score profiles can't fill every slot with near-identical roles; falls back to pure rank order when the quota can't be met (added 2026-06, commit 8c364c0c)
- Outputs top 8 ideal (unfiltered) candidates for reality impact comparison
- Generates structured `MatchInsight` per candidate (strengths + gaps) so LLM only writes prose
- Computes `realityImpact`: which directions were strengthened/weakened/newly appeared

**Narrative** (`generateCareerMatchNarrative`, LLM):

- For each top 3 primary direction: `whySuitable`, `challenges`
- For each AI-era direction (optional): brief `whySuitable`, `challenges`
- Overall `summary` paragraph
- `actionableInsights` (books, certifications, community move, 30-day challenge) generated per direction

### Personality Profile (`lib/profile-generation/profile-algorithm.ts` + `generate-identity-narratives.ts`)

> Profile is now a separate product, generated after assessment completion. The report reads the profile's `algoSnapshot` from DB.

**Algorithm** (`computeProfileAlgorithm` in `lib/profile-generation/profile-algorithm.ts`):

- Assembles RIASEC radar data, archetype info
- Prepares Schwartz top-3 values with centered scores
- Extracts Big Five domain + facet scores
- Prepares SJT tension data
- Derives cognitive style + collaboration style
- `generateProfile()` accepts optional `ProfileAlgorithmOutput` to avoid recomputation

**Narrative** (`generateIdentityNarratives`, LLM — single "soul call", legacy 2-parallel fallback; see [`profile-generation.md`](./profile-generation.md)):

- `archetypeNarrative`: archetype story in user-facing language
- `valueNarrative`: values profile narrative
- `bigFiveNarrative`: personality dimensions narrative
- `sjtTensionNarrative`: values-behavior gap narrative
- `valuesCrossImpactNarrative`: cross-dimensional connections

### AI-Era Personal Insight (algorithmic)

`computeAiEraPersonalInsight()` in `index.ts`.

Pure algorithm module — no LLM call. Based on top RIASEC dimension + Big Five openness/conscientiousness. Generates:

- `moat_zh/en`: what AI cannot replace about this person
- `watchOut_zh/en`: key shift to be aware of
- `positioning_zh/en`: recommended AI-era positioning (high vs low openness)
- `adaptabilityScore`: 0-100, weighted: openness (60%) + conscientiousness (40%)

Attached to `Panel1CareerMatch.aiEraPersonalInsight`.

### Career Pathway (`career-pathway.ts`)

**LLM call** (`generateCareerPathway`):

- Only generated when `RealConditions` are provided
- Uses algorithm-only career match data (rank, title, matchScore) — no narrative dependency
- Uses Schwartz-based action plan intensity (security vs stimulation) instead of CAAS thrust
- Includes gap analysis, resource guide (ATS keywords, LinkedIn tips, salary context), and AI-era roadmap rules
- Falls back to `buildPathwayPlaceholder()` on failure or missing conditions
- Includes JSON recovery logic for token-limit truncation (`tryParseJSON`)

### Integration (`integration.ts`)

**LLM call** (`generateIntegration`):

- Cross-panel synthesis connecting personality, career directions, and action steps
- Runs after all panels complete (sequential)

### Career Drain (algorithmic)

`generateCareerDrainAlgorithmic()` in `career-drain-algorithmic.ts`.

Pure algorithm module — no LLM call. Identifies potential career energy drains based on personality facets and value conflicts. Content sourced from `career-drain-content.ts` (frozen content). Includes `sourceLabel_zh/en` per drain item indicating which trait triggered the drain.

### Self-Portrait (algorithmic)

`self-portrait.ts` — pure algorithmic module generating a personality self-portrait visualization data structure.

## Resume-Enhanced Path (optional)

Users can opt into resume-aware report generation via `ReportDepthDialog` (Standard vs Resume-enhanced). When enabled, the resume is parsed and matched _before_ report generation; the resulting evidence is threaded into two LLM prompts.

### Data flow

1. **Upload** — `POST /api/documents/upload` parses the resume into structured experience (LLM `resume-parse` task).
2. **Match** — `lib/resume/match-resume.ts` compares resume evidence against the user's top career directions, producing a `ResumeMatchRow` with `alignedDimensions`, `conflictingDimensions`, and bilingual `summary_zh/en`.
3. **Persist** — `lib/db/resume-match.ts` stores the match so the pipeline can read it back (migration `078-resume-match-persistence.sql`).
4. **Inject** — `generateCareerReport()` accepts an optional `resumeMatch?: ResumeMatchRow`. Its `matchResult` becomes `resumeEvidence` and flows into:
   - `generateCareerMatchNarrative()` — grounds `whySuitable` / `challenges` in the user's actual experience
   - `generateIntegration()` — cross-references evidence against personality insights

### Pipeline integration

Resume analysis is a **separate branch** from the main 4-step pipeline: `resumeAnalysisStatus` progresses as `not_requested | pending | running | done | failed | skipped` independently of the report step. `skipped` = user chose Standard mode. See `docs/architecture/assessment-pipeline.md`.

### Persisted metadata

When a resume match is attached, the report stores provenance fields for the UI:

- `report.meta.resumeMatchId`, `resumeMatchAt`
- `report.resumeEvidence`: `{ alignedDimensions, conflictingDimensions, summary_zh, summary_en }`

### Regeneration

`ResumeRegenerateBanner` (profile page) prompts users to regenerate when a newer resume upload post-dates the current report. Route: `POST /api/assessment/[assessmentId]/regenerate-report`.

## LLM Routing

All LLM calls go through `model-router.ts`. Report LLM calls use `enableCache: true` for Anthropic prompt caching — system messages are sent with `cache_control: { type: "ephemeral" }`, reducing input token cost by ~90% for shared prefixes.

| Task                     | Primary Provider | Model             | Notes                                         |
| ------------------------ | ---------------- | ----------------- | --------------------------------------------- |
| `profile-narrative`      | Anthropic        | claude-sonnet-4-6 | Generated during profile creation, not report |
| `career-match-narrative` | Gemini           | gemini-2.5-flash  | fallback chain: Gemini -> Anthropic -> OpenAI |
| `career-pathway`         | OpenAI           | gpt-4o-mini       |                                               |
| `integration`            | Anthropic        | claude-sonnet-4-6 |                                               |

### Provider failover chain

Fallback is task-specific, not a universal `anthropic -> openai` downgrade:

- `profile-narrative`: `anthropic -> gemini`
- `integration`: `anthropic -> gemini`
- `career-match-narrative`: `gemini -> anthropic -> openai`
- `career-pathway`: `openai -> gemini`

### Language Guard

Every LLM narrative section (`career-match-narrative`, `career-pathway`, `integration`) runs its output through `enforceOutputLocale()` (`language-guard.ts`): detect locale mismatch → regenerate with a corrective prompt → sanitize/drop leaked fields on the second failure. On exhaustion the section degrades to algorithmic fallback text. Kill switch: `LANGUAGE_GUARD_DISABLED=1`.

At runtime, `model-router.ts` retries up to 3 times for transient errors (429, 529, 5xx, timeout) with exponential backoff (1s base, 4s base for 529 overloaded). If retries are exhausted, it activates the next approved provider in the fallback chain.

A global timeout guard (250s) caps the entire `callLLM()` invocation (primary + retries + failover) to stay safely under the 300s report route `maxDuration`. Per-call timeout is 90s.

A **529 soft-circuit** tracks consecutive Anthropic overloaded errors: after 5 consecutive 529s, requests are proactively routed to the fallback provider (avoiding ~28s of retry delays per request). 529s do not count toward the hard circuit breaker (threshold: 3 consecutive non-529 failures).

Failover calls are logged with `degraded: true` for observability. Groq mode (dev/test) skips failover entirely.

## Output: CareerReport

Defined in `lib/types/report.ts`. Key structure:

```
CareerReport {
  id, assessmentId, locale
  profileId?: string                     (reference to PersonalProfile, v3.0+)
  header: ReportHeader
  careerAnchors?: CareerAnchor[]         (pure algorithm, Ch1 bridge)
  careerMatch: Panel1CareerMatch {
    directions: CareerDirection[]         (top 3 primary, deep LLM narratives)
    exploratoryDirections?: CareerDirection[]  (2 algorithm-only)
    summary: string
    idealDirections?: CareerDirection[]   (top 7-8 before reality filtering)
    aiEraDirections?: CareerDirection[]   (top 3 ai-native/augmented)
    aiEraPersonalInsight?: AiEraPersonalInsight  (moat/watchOut/positioning/adaptabilityScore)
    realityImpact?: { strengthened, weakened, newOpportunities }
  }
  careerPathway: Panel3Pathway
  integration: IntegrationLayer
  careerDrainWarning?: CareerDrainWarning
  meta: { generatedAt, version, llmModel, generationTimeMs, llmCalls, realConditionsProvided }
}

CareerDirection now includes: matchBreakdown (interestFit, valueFit, personalityFit, adaptabilityFit, industryFit?),
  industries?, crossCulturalFit?, crossCulturalBarrierLevel?, aiEraCategory?, resilienceLevel?,
  annotationConfidence?, marketOutlook?, actionableInsights?

DB column: CareerReport.inputHash (TEXT, nullable) — stored at save time for staleness detection.
```

## Key Files

| File                                              | Role                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`                                        | Pipeline orchestration, assembly helpers, career anchors, AI-era personal insight                                                                         |
| `career-match-algorithm.ts`                       | Career direction scoring & ranking (wrapper around `lib/career-matching/engine.ts`)                                                                       |
| `career-match-narrative.ts`                       | LLM narrative for career matches                                                                                                                          |
| `career-pathway.ts`                               | LLM action pathway generation                                                                                                                             |
| `profile-narrative.ts`                            | LLM narrative for personality (in `lib/profile-generation/`, called during profile generation)                                                            |
| `integration.ts`                                  | LLM cross-panel synthesis                                                                                                                                 |
| `career-drain-algorithmic.ts`                     | Algorithmic career drain detection                                                                                                                        |
| `career-drain-content.ts`                         | Frozen drain narrative content                                                                                                                            |
| `self-portrait.ts`                                | Algorithmic self-portrait                                                                                                                                 |
| `header.ts`                                       | Report header builder                                                                                                                                     |
| `common-rules.ts`                                 | Locale-aware shared prompt rules (common rules, narrative restraint, exploration framing, exploration note template). Supports en/zh + arbitrary locales. |
| `prompt-utils.ts`                                 | Prompt construction helpers                                                                                                                               |
| `types.ts`                                        | Internal pipeline types                                                                                                                                   |
| **`lib/report/prerequisites.ts`**                 | Prerequisites gate, input hashing, staleness detection                                                                                                    |
| **`lib/profile-generation/profile-algorithm.ts`** | Personality profile data assembly (canonical location)                                                                                                    |
| `panel2-algorithm.ts`                             | Re-export shim → `profile-algorithm.ts` (backward compat)                                                                                                 |
