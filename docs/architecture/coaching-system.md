---
title: AI Coaching System
category: architecture
sources:
  - lib/coaching/build-system-prompt.ts
  - lib/coaching/conversation-router.ts
  - lib/coaching/parse-report-context.ts
  - lib/coaching/get-coach-access-level.ts
  - lib/ai/model-router.ts
  - lib/memory/
  - lib/db/profiles.ts
  - lib/content/archetype-growth.ts
  - lib/content/archetype-relations.ts
  - lib/db/action-hub.ts
  - lib/db/coaching.ts
  - components/features/coaching-chat.tsx
sync_mode: partial
last_verified: 2026-06-10
verified_by: codex
---

# AI Coaching System

## Architecture Overview

```
User clicks "Talk to Coach"
  |
  v
API: /api/coaching-chat (SSE streaming)
  |
  v
analyzeCoachingTurn()          ← deterministic TurnUnderstanding + mode routing
  ├── latest explicit request wins over profile/history
  ├── extracts core question, facts, constraints, desired help
  ├── detects correction / conversation repair
  └── updates resumable CoachingSession.stateJson
  |
  v
buildCoachingSystemPrompt()     ← lib/coaching/build-system-prompt.ts
  ├── [State 1] buildState1SystemPrompt()  ← Quick Dive only (3-round strategy)
  ├── parseReportContext()       ← Extract key findings from CareerReport
  ├── buildMemorySection()       ← Top 10 memories by confidence
  ├── buildActionHubContextSection()  ← If has active action plan
  ├── buildExercisesContextSection()  ← Non-negotiables, flow, energy
  ├── buildFacetContextSection()      ← Big Five top/bottom facets
  ├── buildGrownSelfPersona()         ← "Grown Self" persona from facets + archetype
  ├── buildPersonaStyleSection()      ← Coaching style preferences (if set)
  ├── buildChallengeGradientSection() ← Adjusts challenge level by style + round
  ├── buildAdaptiveTurnInstruction()  ← Highest-priority V2 turn contract
  └── legacy round protocol           ← Rollback only
  |
  v
streamLLM('coaching', messages)  ← via model-router.ts, SSE response
  |
  v
CoachingSession upsert          ← stable sessionId, messages, mode, state
```

## Core Components

### System Prompt Builder (`build-system-prompt.ts`)

`buildCoachingSystemPrompt()` constructs a context-rich system prompt. It is a pure function with no IO. Accepts `BuildCoachingPromptParams` which includes optional `persona` (coaching/communication/detail preferences), `archetypeLabel`/`archetypeCode` (standard 12-type), and `userName` (personalized greetings).

**Two coaching states:**

- **State 1** (coachState=1): Quick Dive only users. Uses `buildState1SystemPrompt()` with a specialized 3-round "wow" strategy (Mirror → Reframe → Transformation), RIASEC-specific opening strategies per dimension (R/I/A/S/E/C), and a natural upsell to Deep Dive in round 3.
- **State 2** (coachState=2, default): Deep Dive completed users. Full coaching with all context layers.

**Context injection layers (State 2):**

1. **Report context**: Key findings from the user's career report (archetype, top directions, tensions, values)
2. **Memory**: Top 10 user memories sorted by confidence, categorized (personality, values, career, blindspot, etc.)
3. **Action Hub context** (optional): Active action plan progress, completion %, pending items
4. **Exercises context** (optional): Non-negotiables, flow moments, energy log from career exercises
5. **Facet context** (optional): Top 5 strongest + bottom 5 weakest Big Five facets
6. **Industry context** (optional): Current + target industries from reality conditions
7. **Archetype growth context**: Growth path + mirror type for "grown self" persona (from `archetype-growth.ts` + `archetype-relations.ts`)
8. **Persona style** (optional): Coaching style (supportive/balanced/challenging), communication style (warm/professional), response detail (brief/balanced/thorough)
9. **Challenge gradient**: Adjusts conversational challenge level based on persona coaching style and current round
10. **Adaptive turn instruction**: Latest intent, core question, facts, constraints, desired help, confidence, correction state, and selected coaching mode

V2 is enabled by default. Set `COACHING_V2_ENABLED=shadow` to run understanding and mode selection without injecting the V2 prompt, or `COACHING_V2_ENABLED=false` for the legacy strategy. `COACHING_V2_ROLLOUT_PERCENT` supports deterministic 0/10/50/100 rollout by stable session ID.

Every completed user turn is written to `CoachingTurnAudit` with the inferred core question, mode, confidence, correction/repair signal, and lightweight response contribution flags. Run `npm run coaching:v2:metrics` for rollout metrics, or add `-- --export-review=coaching-review.jsonl --limit=100` to create a human-review queue for the 90% core-question and answer-focus gates.

### Report Context Parser (`parse-report-context.ts`)

`parseReportContext(reportSummary, profileData?)` extracts a structured summary from `CareerReport` for prompt injection. Keeps the coaching prompt focused on actionable findings rather than raw data.

The optional `profileData` parameter (v3.0+) provides personality context directly from `PersonalProfile` (archetype label, tagline, cognitive style code, narrative snapshots) instead of relying on report header data as a legacy fallback.

Returns `ReportContext` with `topRoles`, `tensions`, `coreInsight`, `hasRealityConditions`, and `sectionContext` (per-panel summaries for targeted coaching: `careerMatchSummary`, `profileSummary`, `pathwaySummary`).

### Memory System (`lib/memory/`)

Pure algorithmic memory generation. Memories are extracted from assessment data and coaching conversations. Each memory has:

- `category`: personality, values, behavior, career, blindspot, constraint, motivation, strength, coaching_insight
- `keyword`: short label
- `insight`: detailed observation
- `confidence`: 0-1 score

Top 10 memories (by confidence, reduced from 15 to lower prompt size / TTFB) are injected into the coaching prompt with bilingual category labels.

### Turn Understanding and Routing

Every request is routed by `lib/coaching/conversation-router.ts` before the LLM call. The deterministic router makes intent behavior testable without adding another model call.

`TurnUnderstanding` captures the primary intent, core question, important facts, constraints, desired help, ambiguities, and confidence. The mode is recalculated on every turn:

| Mode           | Required behavior                                                                        |
| -------------- | ---------------------------------------------------------------------------------------- |
| `explore`      | Offer a useful observation, then clarify only what is needed                             |
| `decide`       | Give a provisional recommendation, basis, risk, and uncertainty                          |
| `act`          | Produce a concrete editable action draft                                                 |
| `support`      | Address the specific pressure and follow the user's listening/problem-solving preference |
| `job_analysis` | Separate role-match evidence, gaps, and unknowns                                         |

High-confidence turns are answered directly. Low-confidence turns get one concise restatement and one material clarification question. Correction signals trigger explicit repair before the answer continues.

The prompt uses an explicit evidence hierarchy: the user's latest statement, saved reality conditions, the latest active resume match or user-provided JD, report/profile evidence, then curated career knowledge. The resume block includes evidence-backed alignment, gaps to verify, seniority, skills, and industries without exposing upload metadata. Curated knowledge carries `COACHING_KNOWLEDGE_VERSION_DATE` (default `2026-06-10`); dynamic salary, visa, and market facts must remain unknown unless supplied.

### Quick Reply System

LLM-generated contextual reply options shown after each coach turn. Two layers:

**First round** (hardcoded, i18n): 10 research-backed options displayed before the user has spoken. Defined in the coaching chat component via i18n dictionary keys (`qs_whyRecommended`, `qs_evaluateOffer`, `qs_analyzeJd`, `qs_feelStuck`, `qs_actionPlan`, `qs_exploreMore`, `qs_skillGap`, `qs_resultsSurprised`, `qs_burnout`, `qs_careerSwitch`).

**Subsequent rounds** (LLM-generated): The system prompt instructs the LLM to append 2-3 quick reply options at the end of every response using a structured marker format:

```
<<QUICK_REPLIES>>["Option 1", "Option 2", "Option 3"]<</QUICK_REPLIES>>
```

The frontend parses this marker, strips it from displayed and persisted message content, and renders the options as tappable chips.

### Action Drafts

`act` mode appends a structured `<<ACTION_DRAFT>>...<</ACTION_DRAFT>>` marker. The frontend renders the title, actions, and descriptions as editable fields. Nothing is written to Action Hub until the user confirms it through `POST /api/action-hub/draft`.

### Access Control (`get-coach-access-level.ts`)

Determines coaching access level from journey state (single source of truth) via `deriveCoachAccess(journeyState)` from the journey state machine.

Three levels:

- **Level 0**: No Quick Dive completed — coaching locked
- **Level 1**: Quick Dive done, no Deep Dive — coaching limited (`COACH_STATE1_MAX_ROUNDS = 3`)
- **Level 2**: Deep Dive completed — coaching fully unlocked with no fixed frontend 10-turn cap

Returns `CoachAccessLevel` with `level`, `maxRounds` (null = unlimited), `completedRounds` (DB-persisted user turns across all past sessions), and `primaryRiasecType` (derived from Quick Dive score map).

## Two Profile Systems

Both accessed through `lib/db/profiles.ts` (single entry point):

| Table             | JSON Column    | Writer                  | Content                        |
| ----------------- | -------------- | ----------------------- | ------------------------------ |
| `UserProfile`     | `insightsJson` | `/api/coaching-summary` | Coaching conversation insights |
| `PersonalProfile` | `profileJson`  | `/api/generate-profile` | Assessment-derived profile     |

## LLM Configuration

| Task               | Provider                              | Temp | Max Tokens | Notes                      |
| ------------------ | ------------------------------------- | ---- | ---------- | -------------------------- |
| `coaching`         | Anthropic (claude-sonnet-4-6)         | 0.7  | 1500       | Primary streaming chat     |
| `coaching-first`   | Anthropic (claude-haiku-4-5-20251001) | 0.7  | 800        | First turn, fast TTFB      |
| `coaching-summary` | OpenAI (gpt-4o-mini)                  | 0.3  | 500        | Non-streaming summary task |

Streaming via SSE. Stream timeouts: 15s inactivity (`STREAM_INACTIVITY_TIMEOUT_MS`), 60s first-content (`FIRST_CONTENT_TIMEOUT_MS`), 90s overall wall-clock (`OVERALL_STREAM_TIMEOUT_MS`). Client-side timeout: 100s (`CLIENT_TIMEOUT_MS`). API route `maxDuration = 120`. Haiku model is overridable via `ANTHROPIC_HAIKU_MODEL` env var.

### Provider Failover Chain

`coaching` and `coaching-first` both have `fallbackProviders: ["openai"]` configured in `TASK_CONFIG`. Streaming failover is implemented:

1. **No silent low-quality downgrade**: If `ANTHROPIC_API_KEY` is missing, `resolveConfig()` fails fast instead of silently routing chat to OpenAI.
2. **Streaming failover**: `streamLLM()` attempts the fallback provider (OpenAI) when the primary (Anthropic) returns a non-ok response or throws. The failover is filtered to `STREAMING_PROVIDERS` (anthropic, openai) — Gemini is excluded from streaming failover.
3. **Circuit breaker**: Consecutive failures (threshold: 3) open the circuit for 5 minutes, routing directly to the fallback. A **529 soft-circuit** (threshold: 5 consecutive overloaded errors) proactively routes to the fallback to avoid retry delays.
4. **User-visible recovery**: The frontend preserves partial content, surfaces retry UI, and lets the user retry explicitly.

## Coaching Companion (⚠️ Not yet implemented)

> `lib/coaching-companion/` directory does not exist yet. This is a planned future feature.

A structured multi-day program (e.g., 7-day sprint) with:

- Daily briefings, micro-actions, reflections
- Mood detection and adaptive difficulty adjustment
- Graduation reports

See `docs/product/coaching-companion-blueprint.md` for full product spec.

## Action Hub (`lib/db/action-hub.ts`)

Action plan management: `ActionPlan` -> `ActionItem` -> `ActionMilestone`. Types include `ActionCategory` (explore, learn, network, create, apply, reflect), `ActionIntensity` (passive, active, social, creative), and `ActionItemStatus` (pending, in_progress, completed, skipped). The coaching chat component fetches action plan context on mount via `/api/action-hub/plan` and injects it into the system prompt.

## Cohort System (`lib/cohort/`)

A/B testing and adaptive grouping. `adaptive-engine.ts` dynamically adjusts group weights based on completion rates and feedback. Migration 021.

## Session Persistence and Recovery

The client creates one stable `sessionId` and reuses it across chat streaming, beacon save, summary extraction, feedback, and Action Hub confirmation.

Each completed stream upserts clean message history, the current coaching mode, locale, status, and `stateJson`. The state stores the user's goal, current focus, unresolved questions, recognized constraints, pending artifact, and correction count.

`GET /api/coaching-sessions` lists recent owned sessions or loads one session by ID. Database upserts and API reads are ownership-scoped.

Correction chips are stored as message kind `correction`. They remain available to the next coaching turn but are excluded from theme extraction and explicitly blocked from long-term memory extraction.

## Feedback and Diagnostics

`CoachingFeedback.reasons` supports structured reasons including `missed_my_point`, `unclear`, `too_many_questions`, `not_practical`, and positive signals. Feedback is linked to the real coaching `sessionId`; failed submissions remain visible and can be retried.

## Evaluation and Rollout

`lib/coaching/eval-cases.ts` defines 100 English and Chinese golden scenarios covering long narratives, mixed emotion and decisions, corrections, profile conflicts, direct-advice requests, real-world constraints, topic switching, ambiguity, irony, and short colloquial messages.

The deterministic suite checks intent, mode, desired help, constraints, and repair routing. Narrative evaluation rewards useful contribution and penalizes excessive questioning or coercive certainty; a question is no longer mandatory in every response.

Recommended rollout:

1. Shadow-log V2 understanding and mode decisions.
2. Enable V2 for 10% of eligible sessions.
3. Expand to 50% after intent and repair thresholds hold.
4. Expand to 100%, retaining `COACHING_V2_ENABLED=false` as the short-term rollback.

## Client Features (`coaching-chat.tsx`)

- **Retry on failure**: When a stream fails mid-response, partial content is preserved with error notice, and a retry button appears to resend the failed user message.
- **Stable session save**: Streams, summaries, feedback, and beacon saves share one session ID.
- **History recovery**: Recent sessions can be reopened with their message history and mode.
- **Correction controls**: "missed my point", "be direct", "recommend", and "not practical" signals are sent into the next turn.
- **Editable action draft**: The user can edit and confirm a generated draft before it reaches Action Hub.
- **Feedback retry**: Failed feedback submissions display an error instead of pretending to succeed.
- **JD paste**: Collapsible textarea for pasting job descriptions, wrapped in `[JOB_DESCRIPTION]` tags and sent as a user message.
- **State 1 round tracking**: Tracks `completedRounds` (DB-persisted) + `userTurnsInSession` to enforce `maxCoachRounds`. Shows remaining rounds counter and upgrade card when exhausted.
- **Action hub context**: Fetched on mount (non-blocking, best-effort) and passed to the API on each request.
