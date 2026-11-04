---
title: Data Flow — Deep Dive Platform
category: database
sources:
  - lib/scoring/index.ts
  - lib/report-generation/index.ts
  - lib/coaching/build-system-prompt.ts
  - lib/profile-generation/generate-profile.ts
  - lib/journey/state-machine.ts
  - lib/db/journey.ts
  - lib/action-hub/seed-extractor.ts
sync_mode: partial
last_verified: 2026-06-15
verified_by: claude-code
---

# Data Flow — Deep Dive Platform

Visual overview of the complete data pipeline, from user interactions through assessment, report generation, and coaching.

> **Last updated:** 2026-06-15

---

## 1. Journey State Machine — Coordination Layer

`journeyState` on the `User` row is the **single source of truth** for user progression. Every pipeline gate (profile generation, report generation, coaching access) derives its unlock status from this state. No pipeline runs unless the state machine permits it.

**Source:** `lib/journey/state-machine.ts` (pure FSM) + `lib/db/journey.ts` (atomic DB transitions)

```mermaid
stateDiagram-v2
    [*] --> not_started
    not_started --> quick_dive_complete : COMPLETE_QUICK_DIVE
    quick_dive_complete --> deep_dive_complete : COMPLETE_DEEP_DIVE
    deep_dive_complete --> profile_generated : GENERATE_PROFILE
    profile_generated --> report_generated : GENERATE_REPORT
    not_started --> coaching_unlocked : ADMIN_SKIP
    quick_dive_complete --> coaching_unlocked : ADMIN_SKIP
    deep_dive_complete --> coaching_unlocked : ADMIN_SKIP
    profile_generated --> coaching_unlocked : ADMIN_SKIP
    report_generated --> coaching_unlocked : ADMIN_SKIP
```

**Access gating derived from state:**

| Feature                                  | Requires state >=     | Derived by            |
| ---------------------------------------- | --------------------- | --------------------- |
| Deep Dive questionnaire                  | `quick_dive_complete` | `deriveUnlocked()`    |
| Profile generation                       | `deep_dive_complete`  | `deriveUnlocked()`    |
| Report generation                        | `profile_generated`   | `deriveUnlocked()`    |
| Coaching (State 2, unlimited, 10 rounds) | `deep_dive_complete`  | `deriveCoachAccess()` |
| Coaching (State 1, limited, 3 rounds)    | `quick_dive_complete` | `deriveCoachAccess()` |

**Atomic transitions:** `transitionJourney()` uses a `WHERE "journeyState" = $current` clause to prevent race conditions. If another process already advanced the state, the update affects zero rows and the caller gets a conflict error.

**Audit trail:** Every transition is logged to `JourneyTransitionLog` (userId, fromState, toState, event, triggeredBy, metadata, createdAt). Log failures are non-blocking — they never prevent the transition itself.

---

## 2. Main Data Pipeline

The top-level journey: Quick Dive → Deep Dive → Report → Coaching. Each stage transition is gated by the journey state machine (Section 1).

```mermaid
flowchart TD
    U([User]) --> QD[Quick Dive\n30 questions\nRIASEC 6 dimensions]
    QD --> QDR[(QuickDiveResult\nDB)]
    QD -->|COMPLETE_QUICK_DIVE| JS[(User.journeyState\nDB — single source of truth)]
    QDR --> DD[Deep Dive\nQuestionnaire v3.0\n86 questions]
    QDR --> DDH[Inherits RIASEC]
    DDH --> DD

    DD --> QS[(QuestionnaireSession\nDB)]
    DD --> RC[Reality Snapshot\nOptional form]
    RC --> RCD[(RealConditions\nDB)]
    DD -->|COMPLETE_DEEP_DIVE| JS

    QS --> SP[Scoring Pipeline\nv3.0 only]
    SP --> AR[(AssessmentResult\nDB)]

    JS -->|"gate: deep_dive_complete"| PG
    AR --> PG[Profile Generation\n1 LLM call]
    PG --> PP[(PersonalProfile\nDB)]
    PG -->|GENERATE_PROFILE| JS

    JS -->|"gate: profile_generated"| RG
    PP --> RG[Report Generation\n2-3 LLM calls\nreads profile algoSnapshot]
    RCD --> RG
    RG --> CR[(CareerReport\nDB)]
    RG -->|GENERATE_REPORT| JS

    CR --> RPG[Report Page\nCareerMatch / Profile / CareerPathway + Integration]
    RPG --> RXN[(ReportReaction\nReportNPS\nDB)]
    RPG --> RE[(ReportEngagement\nsendBeacon\nDB)]

    CR --> AH[Action Hub\nSeed Extractor\npure algorithm]
    AH --> AHD[(ActionItem\nDB)]

    JS -->|"gate: report_generated"| Coach
    RPG --> Coach[AI Coaching\nSSE streaming]
    Coach --> CS[(CoachingSession\nDB)]
    Coach --> UM[(UserMemory\nDB)]
    Coach --> UP[(UserProfile\ninsightsJson\nDB)]
    Coach --> CF[(CoachingFeedback\nDB)]
    Coach -.->|"access via deriveCoachAccess()"| JS

    JS -->|every transition| TL[(JourneyTransitionLog\naudit trail\nDB)]

    U --> AN[Analytics\nPassive tracking]
    AN --> PV[(PageVisit\nmiddleware after\nDB)]
    AN --> UF[(UserFunnel\nevents\nDB)]
```

---

## 3. Scoring Pipeline Internals

Three-layer architecture: Raw → Normalize → Derive.

```mermaid
flowchart LR
    subgraph Input
        AJ[answersJson\nfrom QuestionnaireSession]
        QR[QuickDiveResult\nRIASEC + Archetype30]
    end

    subgraph Layer1["Layer 1 — Raw Scoring (per module)"]
        SJT[Module A: SJT\n6 scenarios\nShould vs Would]
        DDVQ[Module B: TwIVI\nSchwartz 10 values\n+ 4 higher-order dims]
        IPIP[Module C: IPIP-60\nBig Five domains\nstandard level]
    end

    subgraph Layer2["Layer 2 — Normalize"]
        N1[SJT → Tension scores\noverallConsistency\nnotableTensions]
        N2[DDVQ → Ipsative centering\nranking + top3]
        N3[IPIP → 0–100 normalize\nbigFive.domainsNormalized]
    end

    subgraph Layer3["Layer 3 — Derive"]
        D1[Inherit RIASEC from QuickDive]
        D2[Derive Archetype\nfrom RIASEC × Enhancement/Transcendence]
        D3[Derive CognitiveStyle\nfrom Big Five]
        D4[Derive CollabMapping\nfrom Big Five]
    end

    Output[(AssessmentResult\nv3.0 stored in DB)]

    AJ --> SJT & DDVQ & IPIP
    QR --> D1

    SJT --> N1
    DDVQ --> N2
    IPIP --> N3

    N1 & N2 & N3 --> D3 & D4
    D1 --> D2

    D1 & D2 & D3 & D4 & N1 & N2 & N3 --> Output
```

**Rush detection thresholds:** SJT 3000ms · TwIVI 1500ms · IPIP 1200ms

---

## 4. Profile Generation Pipeline

Pure algorithm (0 LLM) for data + 2 parallel LLM calls for narratives. Runs after assessment completion, before report.

```mermaid
flowchart TD
    Input1[(AssessmentResult\nDB)] --> PAlgo

    PAlgo["generateProfile()\nPure algorithm\nRIASEC, values, Big Five, SJT,\ncollabStyle, shadow, coreQualities,\nsocialStyle, leadershipStyle,\ninterpersonalEnergy, conflictHandling"]
    PAlgo --> PNarr["generateIdentityNarratives()\n2 PARALLEL LLM calls:\nCall A — Identity Portrait\nCall B — Growth & Synthesis\nAnthropic Claude Sonnet 4.6"]

    PNarr --> Out[(PersonalProfile\nstored in DB\nwith algoSnapshot + narrativeSnapshots)]
```

> `generateProfile()` is pure algorithm (0 LLM). It accepts optional `ProfileAlgorithmOutput` to avoid recomputation. Narrative generation (`generateIdentityNarratives()`) runs 2 parallel LLM calls (~15s total).

## 5. Report Generation Pipeline

2-3 LLM calls, ~65% algorithmic / ~35% LLM, 180-second pipeline timeout (90s per-call timeout).

**Progress streaming:** `generateCareerReport()` accepts an optional `onProgress?: ReportProgressCallback` parameter. SSE endpoints use this to stream real-time stage updates to the frontend: `"preparing"` → `"algorithms"` → `"career_match"` → `"integration"` → `"complete"`. Defined in `lib/report-generation/index.ts` as `ReportProgressStage` and `ReportProgressCallback`.

```mermaid
flowchart TD
    Input1[(AssessmentResult\nDB)] --> Step0
    Input3[(PersonalProfile\nalgoSnapshot from DB)] --> Step1
    Input2[(RealConditions\nDB — optional)] --> Step2

    Step0["Step 0: buildReportHeader()\nPure algorithm\narchetype labels, collab style"]
    Step0 --> Step1

    Step1["Step 1: computeCareerMatchAlgorithm()\nPure algorithm\nRIASEC match, career direction ranking\n(profile algo read from DB snapshot)"]
    Step1 --> Step2

    subgraph Step2["Step 2: Parallel LLM calls"]
        LLM1["LLM #1 — career-match-narrative\nGoogle Gemini 2.5 Flash\nCareer directions narrative (temp 0.5, 2000 tok)"]
        LLM2["LLM #2 — career-pathway\nOpenAI GPT-4o-mini\nReality pathway (temp 0.4, 1000 tok)\nRequires RealConditions — placeholder if absent"]
        ALG["Algorithm: generateCareerDrainAlgorithmic()\nPure algorithm\nDraining career patterns"]
    end

    Step2 --> Step3["Step 3: generateIntegration()\nLLM #3 — integration\nAnthropic Claude Sonnet 4.6\nCross-panel synthesis (temp 0.5, 2000 tok)"]

    Step3 --> Out[(CareerReport\nstored in DB)]
```

**Model fallback:** Each task has a configured fallback chain in `model-router.ts`. Career-match-narrative routes to Gemini (fallback: Anthropic, OpenAI). Integration and profile narratives route to Anthropic (fallback: Gemini). Career-pathway routes to OpenAI (fallback: Gemini). Circuit breaker + retry logic handle provider outages.

### 5b. Resume-Enhanced Report (optional, non-blocking branch)

User uploads a resume from the report page (`ReportDepthDialog`) → triggers an independent regeneration branch (`resumeAnalysis`) that does **not** block or re-run the main scoring/profile pipeline.

```mermaid
flowchart LR
    UP[Resume upload\n/api/documents/upload] --> RP["LLM: resume-parse\nGPT-4o-mini\nstructured extraction"]
    RP --> RMR[(ResumeMatchResult\nDB — migration 078)]
    EXIST[(Existing CareerReport)] --> REGEN
    RMR --> REGEN["Regenerate career-match-narrative\n+ integration\nwith resume evidence injected"]
    REGEN --> CR2[(CareerReport\nupdated narratives)]
```

> Resume evidence is injected into the `career-match` + `integration` prompts only — scoring and profile algorithms are never re-run. See `lib/db/resume-match.ts` + `lib/types/report.ts`.

---

## 6. Action Hub Pipeline

Report → Action Hub: the seed extractor converts report content into DB-stored action items.

```mermaid
flowchart LR
    CR[(CareerReport\nDB)] --> SE["extractSeeds()\nPure algorithm\nlib/action-hub/seed-extractor.ts"]

    subgraph Sources["Seed sources (by weight)"]
        S1["Career pathway week-1 tasks\nweight 0.9"]
        S2["Job search strategy\nresume/networking/positioning\nweight 0.7–0.8"]
        S3["Panel 1 career directions\ntop 5 → explore seeds\nweight 0.6+"]
        S4["Career drain warnings\nreflection seeds\nweight 0.5"]
    end

    SE --> Sources
    Sources --> PR["rankSeeds()\nPriority ranker"]
    PR --> GH["assignPlanPhases() + buildActionGuidance()\nphase, reason, outcome"]
    GH --> AH[(ActionItem\nDB)]

    WP["Report weekly-action-plan\ncomponent"] -->|"reads ActionItem status\nfalls back to localStorage"| AH
    WP -->|"optimistic toggle\nwith rollback"| AH
```

> **Unification (2026-03-15):** The report's weekly-action-plan component now reads/writes ActionItem status from the DB (matching by reportId + `panel3_week1` source dimension). Falls back to localStorage for unauthenticated users or when no Action Hub plan exists.

---

## 7. Analytics Tracking Flow

Passive and active tracking across the platform.

```mermaid
flowchart LR
    subgraph Passive["Passive — middleware after()"]
        MW[Every page request\nproxy.ts]
        MW -->|"async, non-blocking"| PV[(PageVisit\nipHash, UA, country,\ncity, device, UTM)]
        Client -->|"sendBeacon\nCSRF-exempt"| DUR["/api/analytics/duration\nPageVisit.durationMs"]
        Client2 -->|"sendBeacon\nCSRF-exempt"| ENG["/api/analytics/report-engagement\nReportEngagement"]
    end

    subgraph Active["Active — csrfFetch"]
        Events["User actions trigger\nFunnelEvent"]
        Events -->|"csrfFetch"| UF[(UserFunnel\n39 event types)]
    end

    subgraph Research["Research — pre/post study"]
        PA[Pre-assessment\nbefore Quick Dive]
        PA --> PPA[(PrePostAssessment\nassessmentType='pre')]
        PA2[Post-assessment\nafter coaching]
        PA2 --> PPA2[(PrePostAssessment\nassessmentType='post_immediate'\nor 'post_1week')]
    end
```

**Funnel events (39):** `registered` · `login` · `logout` · `landing_viewed` · `dashboard_viewed` · `quickdive_started` · `quickdive_completed` · `quickdive_abandoned` · `immersive_explore_started` · `immersive_explore_completed` · `immersive_exit_clicked` · `deepdive_started` · `deepdive_completed` · `deepdive_abandoned` · `profile_generated` · `report_generated` · `report_viewed` · `report_reacted` · `coaching_started` · `coaching_completed` · `share_clicked` · `profile_viewed` · `profile_tab_switched` · `profile_cta_clicked` · `profile_feedback_submitted` · `profile_transparency_toggled` · `action_hub_viewed` · `intro_cta_clicked` · `micro_feedback_shown` · `question_answered` · `progress_milestone` · `coaching_prompt_shown` · `report_nps_submitted` · `crisis_signal_detected` · `pipeline_started` · `pipeline_completed` · `pipeline_step_failed` · `report_generation_requested` · `report_generation_failed`

**CSRF-exempt endpoints:** `/api/analytics/duration` · `/api/analytics/report-engagement` (both use `sendBeacon` which cannot carry headers) · `/api/analytics/event` (used by micro-feedback components with bare fetch). All three endpoints only accept anonymous tracking data with no state-changing operations.
