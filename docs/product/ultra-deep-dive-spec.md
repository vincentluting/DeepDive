---
title: Ultra-Deep Dive Product Specification
category: product
sources: []
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Ultra-Deep Dive — Product Specification

> **Document type:** Product vision + future development brief for Claude Code
> **Status:** Planning document — describes future features not yet implemented. Some codebase references have changed since this was written.
> **Last updated:** 2026-02-27 (codebase note added 2026-03-04)
> **Author:** Founder + Claude Code

> **⚠️ Codebase changes since this doc was written (2026-03-12):**
>
> - **Archetype system**: Now 12-type (RIASEC × Enhancement/Transcendence). Unified `Archetype` interface. See `docs/architecture/archetype-system.md`.
> - **IPIP questionnaire**: Zone 3 now uses IPIP-60 (60 items, standard level), not IPIP-30 (30 items, screening level). The `bigFive.precision` value for current Deep Dive is `"standard"`.
> - **v2.0 scoring pipeline removed**: `runScoringPipeline()` has been deleted (2026-03, PR #795). Ultra-Deep's IPIP-NEO-120 support will need a new scoring implementation.
> - **Quick Dive**: Now outputs RIASEC 6 dimensions only; archetype is computed separately.
> - **Panel naming removed**: "Panel 1/2/3" nomenclature replaced by `careerMatch` / profile / `careerPathway`. References below retain Panel naming for historical context.

---

## Table of Contents

1. [Overview & Positioning](#1-overview--positioning)
2. [Ocean Exploration Map — Extended](#2-ocean-exploration-map--extended)
3. [Dynamic vs Static Features Comparison](#3-dynamic-vs-static-features-comparison)
4. [Questionnaire Design — Extended Modules](#4-questionnaire-design--extended-modules)
5. [Ocean Metaphor — Full Journey Design](#5-ocean-metaphor--full-journey-design)
6. [Dynamic Career Recommendation Engine](#6-dynamic-career-recommendation-engine)
7. [AI Coach — Premium Features](#7-ai-coach--premium-features)
8. [Technical Implementation Notes](#8-technical-implementation-notes)
9. [Development Priority — Post-Thesis Phase](#9-development-priority--post-thesis-phase)

---

## 1. Overview & Positioning

### What Ultra-Deep Dive Is

Ultra-Deep Dive is the premium subscription tier of the Deep Dive career exploration platform. Where Deep Dive gives users a high-quality static snapshot of their career identity (generated once from 86 questions), Ultra-Deep Dive creates a **living, evolving portrait** — one that deepens every time the user completes another assessment module, uploads a resume, or has a coaching conversation.

The core shift: from **event** (a report) to **relationship** (a companion that grows with you).

| Tier                            | Metaphor                | Time investment | Output             |
| ------------------------------- | ----------------------- | --------------- | ------------------ |
| Quick Dive (免费)               | Surface snorkeling      | 5 min           | Archetype card     |
| Deep Dive (one-time)            | Submersible dive        | 20 min          | Career report      |
| **Ultra-Deep Dive** (€29.99/mo) | **Deep-sea expedition** | **Ongoing**     | **Living profile** |

### Target User — Who Needs This Depth?

Ultra-Deep Dive is for a specific minority of career explorers: people who are not just curious about their archetype, but who are **actively navigating a complex career transition** and need a durable, evolving companion.

**Primary persona:** The Cross-Cultural Career Navigator (跨文化职业导航者)

- Mid-career professional (28–42), often living outside their home country
- Holding multiple professional identities simultaneously (e.g., "trained engineer, becoming product lead, considering entrepreneurship")
- Has done personality tests before — is skeptical of surface-level results
- Willing to invest time and money for something that actually tracks _with_ them
- Values depth, nuance, and longitudinal understanding over novelty

**Secondary persona:** The Systematic Self-Investor (系统性自我探索者)

- Doctoral student, researcher, or knowledge worker fascinated by self-knowledge
- Wants full-depth IPIP-NEO-120 personality facets, not just screening-level Big Five
- Interested in comparing results across time ("has my personality stabilized?")
- May want to export their data or share with a therapist/coach

**Who is NOT the target:**

- Someone who just wants one quick answer — Deep Dive one-time report serves them
- Someone primarily motivated by job-seeking — future job board integrations may serve this need separately
- Someone unwilling to engage across multiple sessions

### Price Positioning

**€29.99/month subscription**

Rationale:

- Below traditional career coaching rates (€80–200/session)
- Above generic self-help app prices (€5–15/month)
- Signals serious intent; price filters for committed users
- Monthly cadence encourages return visits and profile deepening
- Future discount: annual plan at ~€249/year (≈30% off)

---

## 2. Ocean Exploration Map — Extended

### Deep Dive's 4 Existing Zones

The current Deep Dive questionnaire (`lib/questionnaire/constants.ts`) defines module depth colors that map to ocean zones. These serve as the foundation:

| Zone   | Module      | Depth  | Name                                  | Assessment                   |
| ------ | ----------- | ------ | ------------------------------------- | ---------------------------- |
| Zone 1 | A (SJT)     | ~200m  | **Scenario Zone / 情境区**            | 6 situational judgment items |
| Zone 2 | B (TwIVI)   | ~600m  | **Values Zone / 价值观区**            | 20 TwIVI value items         |
| Zone 3 | C (IPIP-60) | ~1200m | **Personality Snapshot / 人格速写区** | 60 IPIP standard items       |
| Zone 4 | R (Reality) | ~2000m | **Reality Anchor / 现实锚点区**       | Reality conditions snapshot  |

> **Note on Zone 4 naming:** The MODULE_DEPTH_COLORS constant also references a Module D slot at ~1800m ("Adaptability Zone"), and Reality Anchor at ~2000m. In the current v3.0 questionnaire flow, Module D is not yet live — it is reserved for Ultra-Deep Dive's adaptability assessment. Reality conditions sit at the deepest current point.

### Ultra-Deep Adds 2+ Additional Zones

Ultra-Deep Dive extends the ocean map with zones that go beyond what the standard submersible can reach:

---

#### Zone 5 — Hadal Zone / 超深渊区 (~4000m)

**IPIP-NEO-120: Full Personality Depth**

> _"The submersible reaches its limit. Here the expedition vessel takes over."_

**What it replaces:** Zone 3's IPIP-60 provides standard-level Big Five (5 domains + 30 facets at 2 items/facet). Zone 5 replaces this with the full IPIP-NEO-120, delivering **30 personality facets** — 6 per domain, 4 items each — at higher Cronbach's α 0.63–0.88.

**Assessment:** 120 items, delivered across 5 paced chapters (already defined in codebase):

| Chapter   | Items  | Theme                        | Duration |
| --------- | ------ | ---------------------------- | -------- |
| Chapter 1 | 1–24   | Emotions & social situations | ~3 min   |
| Chapter 2 | 25–48  | Thinking style               | ~3 min   |
| Chapter 3 | 49–72  | How you relate to others     | ~3 min   |
| Chapter 4 | 73–96  | Work and goals               | ~3 min   |
| Chapter 5 | 97–120 | Daily patterns               | ~2 min   |

**Total: ~14 minutes, 5 sittings possible** — chapters are independently completable sessions.

**What users gain from Zone 5:**

- 30-facet personality portrait instead of 5-domain summary (e.g., "High Conscientiousness" → "High Self-Efficacy, High Achievement-Striving, but Low Orderliness")
- Facet-level career drain analysis (e.g., "High Vulnerability + High Anxiety facets → burnout risk in high-stakes roles")
- Micro-insight triggers after Chapters 1, 2, and 3 (已在 `MICRO_INSIGHT_TRIGGERS.afterIPIP_chapter: [1,2,3]` 中配置)
- More precise archetype nuancing — sub-archetype differentiation within the 12 types

**Data reference:** `lib/questionnaire/module-c-ipip120.ts` (120 items, fully implemented, public domain IPIP)

---

#### Zone 6 — Trench Zone / 海沟区 (~6000m)

**Additional Commercial Scales: Specialized Depth**

> _"The deepest reaches. Few expedition members ever come this far."_

**What it adds:** Targeted psychometric instruments that address specific career dimensions not captured by the core Big Five + values framework. Each scale illuminates a distinct aspect of career navigation.

**Candidate scales for Zone 6 — all subject to licensing verification:**

| Scale                                                 | Construct                                                                                | Items                      | License status                                                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Career Anchors (Schein, 1978/1990)**                | 8 career motivation anchors (Technical/Functional, Managerial, Security, Autonomy, etc.) | ~40 items                  | ⚠️ Originally published widely, but Career Anchors Inventory (CAI) is proprietary; **free adaptation may require custom re-writing** |
| **Grit Scale (Duckworth, 2007)**                      | Perseverance of effort + consistency of interests                                        | 12 items (Grit-S: 8 items) | ✅ Public — freely available for non-commercial/research; commercial license may be needed                                           |
| **Emotional Intelligence — WLEIS** (Wong & Law, 2002) | Self-emotion appraisal, others' emotion appraisal, use of emotion, regulation            | 16 items                   | ✅ Published in academic papers, widely self-administered; verify with authors for commercial use                                    |
| **Career Adapt-Abilities Scale (Savickas CAAS-SF)**   | Concern, control, curiosity, confidence                                                  | 24 items                   | ⚠️ Copyright held by Savickas; was used in v2.0, removed for compliance — **requires license**                                       |
| **Self-Determination Scale**                          | Intrinsic vs. extrinsic motivation orientation                                           | 10 items                   | ✅ SDT theory measures generally freely available for research                                                                       |
| **Proactive Personality Scale (Bateman & Crant)**     | Tendency to take initiative and shape environment                                        | 17 items (short: 10)       | ✅ Published 1993 in Journal of Organizational Behavior; likely free for research                                                    |

> **注意 (For founder):** 正式上线前，每个量表都必须确认授权状态。建议优先使用已验证的开源量表（参考 TwIVI 的经验），避免版权风险。Grit Scale 和 WLEIS 是最安全的起点。

**Zone 6 design principle:** Users choose 1–2 scales from the Zone 6 menu rather than completing all. This creates **personalized expedition depth** — one user might go deep on grit, another on career anchors, depending on their current exploration need.

---

#### Zone 7+ — Abyssal Extension / 深渊延伸 (Future)

Reserved for:

- Longitudinal re-assessment (same instruments at T1, T2, T3 — tracking change over time)
- 360-degree perspective inputs (future: invite colleagues/mentors to rate you)
- ~~Diary/journaling integration~~ — removed (2026-03-09): low ROI, privacy concerns, coaching conversation covers this value

---

### Cumulative Exploration Score

Each zone completed permanently contributes to the user's **Exploration Depth Score** (探索深度分):

- Zone completion is binary (completed = illuminated)
- Score = weighted sum of zones completed: Zone 1 (10pts) + Zone 2 (15pts) + Zone 3 (15pts) + Zone 4 (10pts) + Zone 5 (25pts) + Zone 6 (15pts each, max 2) + additional data sources (resume upload +5, diary entries +1 each up to 10)
- Score shown on profile as "Ocean Depth: Xm" — a single number that gamifies longitudinal engagement
- Score never decreases

---

## 3. Dynamic vs Static Features Comparison

| Feature                    | Deep Dive (one-time)                         | Ultra-Deep Dive (€29.99/mo)                                                            |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Career Report**          | Static — generated once from assessment      | **Dynamic** — updates when new assessment data, resume, or coaching insights are added |
| **Personal Profile**       | Static snapshot in time                      | **Living profile** — reflects accumulated understanding, evolves over months           |
| **Personality Depth**      | Big Five: 5 domains (screening level)        | **Big Five: 30 facets** (IPIP-NEO-120, research grade)                                 |
| **Values Depth**           | TwIVI → 10 Schwartz values                   | Same values foundation + coaching-refined understanding over time                      |
| **AI Coach**               | Fixed free turns (e.g. 5 messages/session)   | **Generous quota** (e.g. 50 messages/month) + persistent cross-session memory          |
| **Coach Memory**           | No memory between sessions                   | **Full cross-session memory** — coach remembers what you told it 3 weeks ago           |
| **Career Recommendations** | Based on initial assessment scores only      | **Dynamic engine** — updates with resume, coaching signals, market data (future)       |
| **Exploration Map**        | 4 zones (Zones 1–4)                          | **6+ zones** (Zones 1–6+), each permanently illuminated when completed                 |
| **Personality Facets**     | None — domain scores only                    | **30 facets with labels** (e.g., "High Assertiveness, Low Activity Level")             |
| **Data Export**            | Single report download (PDF/share card)      | **Full data export** (JSON Resume format + assessment history)                         |
| **Resume Integration**     | One-time upload, re-match to recommendations | **Continuous** — resume updates re-run matching and flag profile changes               |
| **Micro-Insights**         | After SJT + after TwIVI item 12              | + **After IPIP chapters 1, 2, 3** — progressive revelation as you go deeper            |
| **Session Notes**          | None                                         | **Coach reflection notes between sessions** (SessionNote type)                         |
| **Topic Queue**            | Not exposed                                  | **Visible topic queue** — user can see and steer what coach will explore               |
| **Re-assessment**          | N/A                                          | Planned longitudinal re-assessment at 6-month intervals                                |

---

## 4. Questionnaire Design — Extended Modules

### Module C — Upgrade Path: IPIP-30 → IPIP-NEO-120

**Current state (Deep Dive v3.0):**

- Module C = IPIP-60 (60 items)
- Provides: 5 Big Five domain scores + 30 facets at standard level
- File: items embedded in `lib/questionnaire/` (v3.0 pipeline)

**Ultra-Deep state:**

- Module C extended = IPIP-NEO-120 (120 items, 5 chapters)
- Provides: 30 facet scores (6 per domain) at research grade
- File: `lib/questionnaire/module-c-ipip120.ts` — **fully implemented and ready**

**Scoring upgrade:**

- ⚠️ The v2.0 scoring pipeline (`runScoringPipeline()`) has been removed (2026-03). Ultra-Deep will need a new or re-implemented pipeline for IPIP-NEO-120 → Big Five 5+30
- Facet scores feed into enhanced personality depth profile and enhanced career drain analysis

**Chapter pacing UX design (Ultra-Deep specific):**

- Each of 5 chapters is a self-contained session (can close and return)
- Progress indicator shows chapter completion (e.g., "Chapter 2 of 5 — Thinking Style")
- Micro-insight unlocks after chapters 1, 2, 3 — a reward for continuing
- Chapters 4 and 5 proceed without interruption (avoid breaking momentum near the end)
- Total: ~14 minutes across 5 sittings, or ~14 minutes in one sitting

**Sample micro-insight format (Chapter 1 completion):**

> _"Your emotional landscape is taking shape. Early signals suggest you navigate anxiety through intellectual engagement rather than social support — a pattern we'll explore further."_
> (中文版: 你的情绪图景初现轮廓。早期信号显示你倾向于通过智识投入而非社交支持来处理焦虑——这是我们后续将深入探索的模式。)

---

### Zone 6 Scale Design Principles

When building additional Zone 6 scales (future work), follow these design principles derived from the TwIVI experience:

1. **Self-author when possible** — the TwIVI (validated instrument, Sandy et al. 2016) handles values measurement. For Career Anchors and CAAS, consider self-authoring psychometrically grounded alternatives.
2. **Shorter is better** — users are already fatigued by Zone 5. Zone 6 scales should be 8–16 items maximum per scale.
3. **One scale per session** — don't bundle multiple Zone 6 scales. Each scale = one focused session.
4. **Bilingual from day 1** — all items must have EN/ZH versions before launch.
5. **Reference validation studies** — document Cronbach's α, test-retest reliability from published literature.

**Priority order for Zone 6 development:**

1. **Grit Scale (short form, 8 items)** — Grit-S is freely available, short, highly relevant to career perseverance narrative, easy to self-administer. Low IP risk.
2. **WLEIS Emotional Intelligence (16 items)** — Strong theoretical grounding, modest item count, applicable across cultures.
3. **Career Motivation Profile** (自研替代 Career Anchors) — Rather than licensing CAI, develop a 16-item original instrument based on Schein's 8 anchor theory, validated internally with research participants. (Reference: TwIVI precedent)
4. **Proactive Personality Scale (10-item short form)** — Public domain, widely cited, measures initiative-taking relevant to entrepreneurial and career change contexts.

---

## 5. Ocean Metaphor — Full Journey Design

### The Exploration Map Concept

Every user has a personal **Ocean Exploration Map** (海洋探索地图) — a persistent visual record of how deep they've gone. This map is:

- **Unique to each user** — your depths, your discoveries
- **Cumulative and permanent** — completed zones never go dark
- **Visually evocative** — dark ocean surface (未探索) → bioluminescent glow (已探索)
- **Accessible from profile page** — always visible, always showing progress

### Tier → Depth Mapping

```
Surface (0m)
│  Quick Dive ████████████████ 5 min
│  → Archetype card, RIASEC surface reading
│  → Zone unlocked: none (Quick Dive is the entry ramp)
│
▼ 200m — Zone 1: Scenario Zone (情境区)
│  SJT: 6 situational judgment items
│  "How you navigate real-world tensions"
│  Color: #B3D9F2 (pale ocean blue)
│
▼ 600m — Zone 2: Values Zone (价值观区)
│  TwIVI: 20 items → 10 Schwartz values
│  "What you're moving toward, what you're protecting"
│  Color: #6BA3C7 (mid ocean blue)
│
▼ 1200m — Zone 3: Personality Snapshot (人格速写区)
│  IPIP-60: 60 items → Big Five standard (5 domains + 30 facets)
│  "How you show up in the world"
│  Color: #1E5478 (deep ocean blue)
│
▼ 2000m — Zone 4: Reality Anchor (现实锚点区)
│  Reality Conditions: location, profession, salary, years
│  "The water you're swimming in"
│  Color: #082A45 (abyssal blue)
│
│  ═══════════════════════════════════════════════
│  DEEP DIVE SUBMERSIBLE LIMIT — Standard tier ends here
│  ═══════════════════════════════════════════════
│
▼ 4000m — Zone 5: Hadal Zone (超深渊区) ← Ultra-Deep exclusive
│  IPIP-NEO-120: 120 items → 30 Big Five facets
│  "The granular terrain of your personality"
│  5 chapters, each illuminates a facet cluster
│  Color: #041520 with bioluminescent highlights
│  Micro-insights trigger after chapters 1–3
│
▼ 6000m — Zone 6: Trench Zone (海沟区) ← Ultra-Deep exclusive
│  Additional commercial scales (Grit, EQ, etc.)
│  "Specialized instruments for specific questions"
│  User selects 1–2 scales from menu
│  Color: near-black with crystalline glow points
│
▼ 8000m+ — Zone 7: Abyssal Extension (深渊延伸) ← Future
   Longitudinal re-assessment + 360 inputs + diary
   "Time is the deepest dimension"
```

### Visual Design Principles

**Dark-to-bioluminescent gradient as user goes deeper:**

- Surface zones (1–4): Progressively darker blue (`#B3D9F2` → `#082A45`)
- Ultra zones (5–6): Near-black background with **bioluminescent accent colors** — deep-sea creatures as inspiration
  - Zone 5: Amber-gold glow (like anglerfish lure) — "illuminating what's hidden"
  - Zone 6: Electric blue + violet glow — "specialized instruments, rare discoveries"
- Unlocked zones: Fill with gradient, emit a soft pulse animation
- Locked zones: Silhouetted in dark, faint depth indicator (e.g., "4000m — accessible with Ultra-Deep")

**Exploration progress bar (profile page top):**

```
[███████████████░░░░░░░░░░] 2,000m / 6,000m explored
Zones completed: 4 of 6 · Ocean Depth Score: 380
```

**Micro-insight reveal moment (UX):**
After Zone 5 Chapter 1 completes:

> A bioluminescent creature drifts past your viewport.
> _"Something is becoming clear in the deep..."_
> [Insight card fades in]

---

## 6. Dynamic Career Recommendation Engine

> ⚠️ **Status: Future feature (post-thesis).** No implementation exists yet.

### Concept

Deep Dive's Career Pathway section is generated once at report creation using assessment scores + real conditions. The recommendations are static — they don't change unless the user creates a new session.

Ultra-Deep's **Dynamic Recommendation Engine** continuously refines career direction suggestions as new signals arrive:

### Signal Sources

| Signal                        | Weight                   | Frequency                  |
| ----------------------------- | ------------------------ | -------------------------- |
| Assessment scores (initial)   | High baseline            | Once (Zone 1–4 completion) |
| IPIP-NEO-120 facet scores     | High modifier            | Once (Zone 5 completion)   |
| Resume content analysis       | Medium                   | On upload/update           |
| Coaching conversation signals | Low–Medium (accumulated) | Per session                |
| Market data (future API)      | Medium                   | Monthly refresh            |
| User explicit corrections     | High override            | On demand                  |

### How Recommendations Update

**Trigger:** Any new signal above arrives → queue recommendation re-evaluation job

**Re-evaluation logic:**

1. Load current `AssessmentResult` + `UserMemory` + `CareerReport`
2. Apply new signal delta (facet scores, resume match, coaching patterns)
3. Run updated career pathway generation (`generateCareerPathway()` with new inputs)
4. Diff old vs new recommendations:
   - If change is significant (>20% shift in top recommendation) → notify user, update profile
   - If change is minor → silent update, note in `SessionNote`
5. Store recommendation history for longitudinal comparison

**User-facing experience:**

- Profile shows "Career Directions" section with last-updated timestamp
- "What changed" explanation when recommendations update (e.g., "Your resume showed 4 years in project management — this strengthened the Strategic Operations direction")
- Option to freeze recommendations ("I've made my decision — stop updating")

### Architecture Notes (Future)

Will require:

- Background job queue (or Vercel cron) for re-evaluation triggers
- Recommendation versioning in DB (`CareerRecommendationHistory` table)
- Delta detection algorithm to avoid noise updates
- Market data integration (LinkedIn job posting API, or curated dataset)

**Does not require:** Changes to scoring pipeline — scoring remains stable, only interpretation layer (career pathway) refreshes.

---

## 7. AI Coach — Premium Features

### Cross-Session Memory (跨会话记忆)

**Status: Partially built** (`lib/memory/`, `lib/coaching/build-system-prompt.ts`)

The memory infrastructure exists — `generateMemoriesFromAssessment()` creates a `MemoryEntry[]` from assessment data. The coaching system prompt loads "top 15 memories by confidence" into every session.

**What's missing for premium memory:**

- User-contributed memories (not just assessment-derived) — user says "I hate open-plan offices" → stored as a memory
- Memory decay/recency weighting — recent coaching insights should outweigh older ones
- Memory editing UI — user can view, correct, or delete memories
- Memory growth over time — each coaching session generates new `MemoryEntry` items stored in DB

**Premium memory volume:** Ultra-Deep users get unlimited memory storage; Deep Dive users get a fixed memory snapshot from their assessment only.

### Extended Thinking Mode (深度思考模式)

For complex analytical questions (e.g., "Should I leave my current role for a startup?"), the coaching response can optionally use extended reasoning — a slower but more structured analytical process.

**Trigger:** User question contains explicit decision-making language ("should I", "comparing", "deciding between")
**Output format:** Structured response with: Observations → Tensions → Perspectives → Synthesis → Question back to user

**Implementation note:** This is a prompt engineering enhancement, not a model change. The `claude-sonnet-4-5-20250929` model used for coaching tasks already has this capability.

### Coach Reflection Notes Between Sessions (会话间教练反思)

**Status: Type exists** — `SessionNote` in `lib/types/platform.ts`:

```typescript
interface SessionNote {
  id: string;
  sessionId: string;
  keyInsights: string[]; // What the coach noticed this session
  valueAdjustments?: Array<{
    // Did coaching reveal profile adjustments?
    dimension: string;
    oldValue: number;
    newValue: number;
    reason: string;
  }>;
  newTensions?: string[]; // New tensions surfaced
  suggestedTopics: string[]; // Queue for next session
  generatedAt: number;
}
```

**Premium feature:** After each Ultra-Deep coaching session, a `SessionNote` is generated (via `coaching-summary` LLM task) and stored. The next session begins with the coach having reviewed its own notes.

**User-facing:** "Your coach made some notes since last time" → optional summary shown at session start.

### Topic Queue System (话题队列系统)

**Status: Type exists** — `CoachingTopicQueue` in `lib/types/platform.ts`

**Current behavior (Deep Dive):** Topic queue is internally generated by `generateTopicQueue()` but not visible to users.

**Ultra-Deep feature:** Users can see and influence their topic queue:

- "Your coach has 3 topics queued for you" → expandable list
- User can mark topics as "not interested" or "explore this first"
- User can add custom topics ("I want to talk about imposter syndrome")
- Queue persists across sessions

**Value proposition:** Makes the coaching relationship feel collaborative, not prescribed. User has agency over the exploration direction.

### Message Limits

| Plan           | Coaching messages                      | Memory                        | Session notes                    | Topic visibility       |
| -------------- | -------------------------------------- | ----------------------------- | -------------------------------- | ---------------------- |
| Deep Dive      | 5 per session, no carry-over           | Assessment snapshot only      | None                             | Hidden                 |
| **Ultra-Deep** | **50/month** pooled + **5 free daily** | **Full cross-session memory** | **Generated after each session** | **Visible + editable** |

---

## 8. Technical Implementation Notes

### What Already Exists (Ready to Build On)

All of the following infrastructure is in place today. Ultra-Deep Dive is not starting from scratch — it is activating and connecting existing components.

| Component                        | File(s)                                                                       | Status                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `tier: 'ultra'` in type system   | `lib/types/platform.ts` — `QuestionnaireSession.tier`                         | ✅ Ready                                                      |
| `tier: 'ultra'` in DB schema     | `lib/db/sessions.ts` — CHECK constraint                                       | ✅ Ready                                                      |
| `tier: 'ultra'` in validation    | `lib/validation/api-schemas.ts` — `z.enum(['quick', 'deep', 'ultra'])`        | ✅ Ready                                                      |
| IPIP-NEO-120 full dataset        | `lib/questionnaire/module-c-ipip120.ts`                                       | ✅ Ready (120 items)                                          |
| IPIP chapter pacing              | `lib/questionnaire/constants.ts` — `IPIP_CHAPTERS`                            | ✅ Ready (5 chapters)                                         |
| Micro-insight triggers for IPIP  | `lib/questionnaire/constants.ts` — `MICRO_INSIGHT_TRIGGERS.afterIPIP_chapter` | ✅ Configured                                                 |
| v2.0 scoring pipeline (IPIP-120) | `lib/scoring/` — ~~`runScoringPipeline()`~~                                   | ❌ Removed (2026-03) — needs re-implementation for Ultra-Deep |
| 30-facet Big Five scoring        | `lib/scoring/` — FACET_MAP                                                    | ✅ Ready                                                      |
| Memory generation                | `lib/memory/generate-from-assessment.ts`                                      | ✅ Ready                                                      |
| Coaching system                  | `lib/coaching/` — 5 modules                                                   | ✅ Ready                                                      |
| SessionNote type                 | `lib/types/platform.ts`                                                       | ✅ Type defined                                               |
| CoachingTopicQueue type          | `lib/types/platform.ts`                                                       | ✅ Type defined                                               |
| ~~Diary/document parsing~~       | Removed (2026-03-09)                                                          | ❌ Removed                                                    |
| Model router                     | `lib/ai/model-router.ts`                                                      | ✅ Ready (frozen)                                             |
| CAAS reservation note            | `lib/profile-generation/profile-algorithm.ts`                                 | ✅ Documented                                                 |
| Ultra CTA in Career Pathway      | `lib/report-generation/career-pathway.ts`                                     | ✅ Placeholder                                                |

### What Needs to Be Built

**Questionnaire layer:**

- [ ] Ultra-Deep questionnaire shell — routes `tier: 'ultra'` sessions through IPIP-120 chapters instead of IPIP-60
- [ ] Chapter completion state persistence — partial IPIP-120 completion, resume from chapter
- [ ] Micro-insight generation endpoint — triggered after chapters 1, 2, 3
- [ ] Zone 6 scale delivery UI — scale selection screen, dedicated module flow

**Profile & reporting layer:**

- [ ] Dynamic profile update pipeline — re-run report generation with new signals
- [ ] Recommendation versioning — DB schema + diff logic
- [ ] Facet-level profile sections — 30-facet portrait in personal profile

**Subscription & access control:**

- [ ] Stripe integration — subscription checkout flow (€29.99/month)
- [ ] Tier gating middleware — protect Ultra routes behind subscription check
- [ ] Subscription status in DB — new `UserSubscription` table or column on `User`
- [ ] Graceful downgrade — if subscription lapses, profile is readable but not updatable

**Coach premium features:**

- [ ] User-editable memory UI — view, edit, delete memory entries
- [ ] Cross-session `SessionNote` generation — auto-generated after each session
- [ ] Topic queue UI — visible, interactive queue in coaching chat interface
- [ ] Extended thinking mode prompt — trigger on decision-language detection

**Exploration map:**

- [ ] Zone completion tracking — record which zones each user has completed
- [ ] Ocean exploration map component — visual rendering with dark-to-bioluminescent gradient
- [ ] Depth score calculation — weighted score across all signals
- [ ] Profile map display — persistent map on user profile page

**Future (Dynamic Recommendation Engine):**

- [ ] Signal ingestion queue — accepts new signals, triggers re-evaluation
- [ ] Market data integration — job posting API or curated dataset
- [ ] Recommendation history table — versioned storage
- [ ] Delta notification system — notify user when recommendations materially change

---

## 9. Development Priority — Post-Thesis Phase

These phases assume the thesis research period ends and commercial development begins. Phases are sequential; each phase gates the next.

### Phase 1 — Extended Questionnaire + Exploration Map Zones 5–6

**Goal:** Ship the IPIP-NEO-120 experience and visual ocean map. Give users a reason to come back.

Tasks:

1. Ultra-Deep questionnaire shell (chapter-based IPIP-120 flow)
2. Chapter completion state persistence (resume mid-assessment)
3. Micro-insight endpoint + unlock UI after chapters 1, 2, 3
4. Ocean exploration map component (basic version — zone completion tracking + visual)
5. Depth score calculation and display
6. Profile page zone map section

**Does not require:** Payment/subscription yet. Can be beta-gated with `RESEARCH-*` codes.

---

### Phase 2 — Stripe Subscription + Paywall + Tier Gating

**Goal:** Monetize. Make Ultra-Deep a real paid product.

Tasks:

1. Stripe Checkout integration (€29.99/month recurring)
2. `UserSubscription` DB table (stripeCustomerId, status, currentPeriodEnd)
3. Subscription middleware — check `tier: 'ultra'` and active subscription
4. Upgrade CTA on Deep Dive report (career pathway section already has copy placeholder)
5. Graceful downgrade flow when subscription lapses

---

### Phase 3 — Dynamic Profile + Recommendation Engine

**Goal:** Make the profile feel alive. Justify the monthly subscription.

Tasks:

1. Dynamic profile update pipeline (new signal → re-run career pathway)
2. Recommendation versioning DB schema
3. Delta detection + user notification
4. Facet-level profile sections (30-facet portrait)
5. User-editable memory UI (view/edit/delete `MemoryEntry` items)
6. Cross-session `SessionNote` generation + coach review at session start
7. Topic queue UI in coaching chat

---

### Phase 4 — Zone 6 Scales + Market Data

**Goal:** Add differentiated depth through additional instruments and live market signals.

Tasks:

1. Grit Scale (short form) — develop/adapt, validate with research participants
2. WLEIS Emotional Intelligence — adapt for platform format
3. Career Motivation Profile (self-authored Career Anchors alternative)
4. Zone 6 scale selection UI ("Choose your next instrument")
5. Market data integration — job posting API (LinkedIn, indeed) or curated dataset
6. Dynamic recommendation signals from market data

---

## Appendix — Key File Index for Developers

When implementing Ultra-Deep Dive, start with these files:

```
lib/questionnaire/module-c-ipip120.ts  — All 120 IPIP items + FACET_MAP
lib/questionnaire/constants.ts         — IPIP_CHAPTERS, MICRO_INSIGHT_TRIGGERS, MODULE_DEPTH_COLORS
lib/types/platform.ts                  — QuestionnaireSession.tier, SessionNote, CoachingTopicQueue
lib/types/assessment.ts                — AssessmentResult (v2.0, deprecated — for reading historical data)
lib/scoring/                           — runScoringPipelineV3() (v3.0); v2.0 pipeline removed
lib/memory/generate-from-assessment.ts — Memory generation (ready for ultra tier)
lib/coaching/build-system-prompt.ts    — Coaching system prompt (add SessionNote loading here)
lib/coaching/topic-generator.ts        — Topic queue generation (expose to user UI)
lib/db/sessions.ts                     — createSession() with tier: 'ultra'
lib/validation/api-schemas.ts          — Already accepts tier: 'ultra'
lib/profile-generation/profile-algorithm.ts — CAAS reservation note
lib/report-generation/career-pathway.ts   — Ultra CTA placeholder
```

---

_Document ends. For technical conventions, see CLAUDE.md. For archetype system, see docs/architecture/archetype-system.md._
