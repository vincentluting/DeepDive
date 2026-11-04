---
title: Data Dictionary — Table Schemas & JSONB Column Schemas
category: database
sources:
  - scripts/schema.sql
  - lib/types/assessment.ts
  - lib/types/report.ts
  - lib/types/platform.ts
  - lib/types/achievement.ts
sync_mode: partial
last_verified: 2026-06-10
verified_by: codex
---

# Data Dictionary — Table Schemas & JSONB Column Schemas

All 51 tables in the Deep Dive database, with column definitions, constraints, and JSONB column schemas.

> **Source of truth:** `scripts/schema.sql` (51 tables + 3 materialized views)
> **Last updated:** 2026-06-10

---

## Table of Contents

### Part 1 — Table Schemas

**Base tables:**

- [User](#user)
- [UserSession](#usersession)
- [PasswordResetToken](#passwordresettoken)
- [OAuthAccount](#oauthaccount)
- [UserProfile](#userprofile)
- [IdentityLink](#identitylink)

**Platform feature tables:**

- [CoachingSession](#coachingsession)
- [CoachingTurnAudit](#coachingturnaudit)
- [CoachMessage](#coachmessage)
- [CoachingTheme](#coachingtheme)
- [QuestionnaireSession](#questionnairesession)
- [AssessmentResult](#assessmentresult)
- [QuickDiveResult](#quickdiveresult)
- [RealConditions](#realconditions)
- [CareerReport](#careerreport)
- [ResumeMatchResult](#resumematchresult)
- [PersonalProfile](#personalprofile)
- [UserMemory](#usermemory)

**Engagement & Feedback:**

- [ReportReaction](#reportreaction)
- [ReportNPS](#reportnps)
- [ReportEngagement](#reportengagement)
- [CoachingFeedback](#coachingfeedback)

**Analytics:**

- [UserFunnel](#userfunnel)
- [PageVisit](#pagevisit)
- [AnalyticsError](#analyticserror)
- [NotableVisitor](#notablevisitor)

**GDPR & Data Management:**

- [UserDeletionRequest](#userdeletionrequest)

**Research:**

- [PrePostAssessment](#prepostassessment)
- [UserExplorationProgress](#userexplorationprogress)

**Cohort Enrollment:**

- [InviteCode](#invitecode)

**Action Hub:**

- [ActionPlan](#actionplan)
- [ActionItem](#actionitem)
- [ActionMilestone](#actionmilestone)

**LLM Tracking:**

- [LLMUsageLog](#llmusagelog)

**Career Library:**

- [CareerDirection](#careerdirection)

**Admin:**

- [AdminAnswerPreset](#adminanswerpreset)

**User Context & Journey:**

- [UserContext](#usercontext)
- [AssessmentCompletion](#assessmentcompletion)
- [JourneyTransitionLog](#journeytransitionlog)

**Gamification:**

- [UserAchievement](#userachievement)

**Payments:**

- [UserPurchase](#userpurchase)

**Operations:**

- [ReportGenerationLock](#reportgenerationlock)
- [AssessmentPipeline](#assessmentpipeline)

**Internal:**

- [\_migrations](#_migrations)

**Coaching v2 (memory & evaluation):**

- [CoachingSessionSummary](#coachingsessionsummary)
- [CoachingGrowthMarker](#coachinggrowthmarker)
- [CoachingHypothesis](#coachinghypothesis)
- [CoachingReviewPool](#coachingreviewpool)
- [CoachingTurnEval](#coachingturneval)

**Companion (social discovery):**

- [CompanionProfile](#companionprofile)
- [CompanionConnection](#companionconnection)
- [CompanionReport](#companionreport)
- [CompanionBlock](#companionblock)

**Research & Jobs:**

- [ConsentRecord](#consentrecord)
- [DurableJob](#durablejob)

### Part 2 — JSONB Column Schemas

- [UserProfile.insightsJson](#userprofileinsightsjson)
- [QuestionnaireSession.answersJson](#questionnairesessionanswersjson)
- [QuestionnaireSession.explorationProgressJson](#questionnairesessionexplorationprogressjson)
- [AssessmentResult.resultJson](#assessmentresultresultjson)
- [QuickDiveResult.scoresJson](#quickdiveresultscorejson)
- [QuickDiveResult.resultDataJson](#quickdiveresultresultdatajson)
- [RealConditions.conditionsJson](#realconditionsconditionsjson)
- [CareerReport.reportJson](#careerreportreportjson)
- [PersonalProfile.profileJson](#personalprofileprofilejson)
- [CoachingSession.messagesJson](#coachingsessionmessagesjson)
- [CoachingSession.stateJson](#coachingsessionstatejson)
- [UserMemory.metadata](#usermemorymeta)
- [PrePostAssessment.sccResponses](#prepostassessmentsccresponses)
- [PrePostAssessment.cdseResponses](#prepostassessmentcdseresponses)
- [PrePostAssessment.experienceFeedback](#prepostassessmentexperiencefeedback)
- [UserFunnel.metadata](#userfunnelmetadata)
- [ReportEngagement.panelTimes](#reportengagementpaneltimes)
- [ReportEngagement.scrollbacks](#reportengagementscrollbacks)
- [NotableVisitor.summary](#notablevisitorsummary)
- [JourneyTransitionLog.metadata](#journeytransitionlogmetadata)
- [UserContext.contextJson](#usercontextcontextjson)
- [PersonalProfile.exercisesJson](#personalprofileexercisesjson)
- [CareerReport.inputHash](#careerreportinputhash) _(scalar)_
- [LLMUsageLog.environment](#llmusagelogenvironment) _(scalar)_
- [ActionPlan.contextJson](#actionplancontextjson)
- [AdminAnswerPreset.quickDiveAnswers / deepDiveAnswers](#adminanswerpresetquickdiveanswers--deepdiveanswers)
- [AnalyticsError.context](#analyticserrorcontext)
- [CareerDirection.idealRiasec](#careerdirectionidealriasec)
- [CareerDirection.idealBigFive](#careerdirectionidealbigfive)
- [CareerDirection.titleLocales](#careerdirectiontitlelocales)
- [CareerDirection.marketOutlook](#careerdirectionmarketoutlook)
- [InviteCode.claimedByUserIds](#invitecodeclaimedbyuserids)
- [UserAchievement.metadata](#userachievementmetadata)
- [UserExplorationProgress.modulesJson](#userexplorationprogressmodulesjson)

---

# Part 1 — Table Schemas

All 51 tables defined in `scripts/schema.sql`. For JSONB column details, see [Part 2](#part-2--jsonb-column-schemas).

---

## User

Base table for registered platform users. All other user-related tables reference this via foreign key.

| Column                  | Type          | Constraints                                        | Description                                              |
| ----------------------- | ------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `id`                    | `TEXT`        | `PRIMARY KEY`                                      | User UUID                                                |
| `email`                 | `TEXT`        | `UNIQUE NOT NULL`                                  | Email address                                            |
| `passwordHash`          | `TEXT`        | nullable                                           | bcrypt hash (12 rounds)                                  |
| `name`                  | `TEXT`        | nullable                                           | Display name                                             |
| `isAdmin`               | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                           | Admin flag                                               |
| `careerStage`           | `TEXT`        | nullable                                           | User-reported career stage                               |
| `registrationIp`        | `TEXT`        | nullable                                           | IP at registration                                       |
| `registrationCountry`   | `TEXT`        | nullable                                           | Country at registration                                  |
| `researchGroup`         | `TEXT`        | `CHECK IN ('classic', 'immersive')`                | A/B research group assignment                            |
| `researchParticipantId` | `TEXT`        | nullable                                           | Research participant identifier                          |
| `researchConsentAt`     | `TIMESTAMPTZ` | nullable                                           | Research consent timestamp                               |
| `cohort`                | `TEXT`        | nullable                                           | Cohort identifier (set via invite code)                  |
| `journeyState`          | `TEXT`        | `NOT NULL DEFAULT 'not_started'`, `CHECK IN (...)` | User journey state machine state                         |
| `emailVerifiedAt`       | `TIMESTAMPTZ` | nullable                                           | Email verification timestamp                             |
| `coachPersona`          | `JSONB`       | nullable                                           | Coach persona preferences (coaching/communication style) |
| `createdAt`             | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                           | Row creation time                                        |
| `updatedAt`             | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                           | Last update time                                         |

**Valid `journeyState` values:** `not_started`, `quick_dive_complete`, `deep_dive_complete`, `profile_generated`, `report_generated`, `coaching_unlocked`

**Indexes:** `idx_user_email(email)`, `idx_user_cohort(cohort) WHERE cohort IS NOT NULL`

---

## UserSession

Server-side session management. Sessions are created on login, validated via httpOnly cookie.

| Column      | Type          | Constraints                                      | Description                            |
| ----------- | ------------- | ------------------------------------------------ | -------------------------------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                    | Session token (stored in cookie)       |
| `userId`    | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Owner user                             |
| `expiresAt` | `TIMESTAMPTZ` | `NOT NULL`                                       | Session expiry (30 days from creation) |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Row creation time                      |

**Indexes:** `idx_session_user(userId)`, `idx_session_expires(expiresAt)`

---

## PasswordResetToken

Time-limited tokens for the password reset flow. Tokens are hashed before storage.

| Column      | Type          | Constraints                                      | Description                     |
| ----------- | ------------- | ------------------------------------------------ | ------------------------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                    | Token record UUID               |
| `userId`    | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Owner user                      |
| `tokenHash` | `TEXT`        | `NOT NULL`                                       | SHA-256 hash of the reset token |
| `expiresAt` | `TIMESTAMPTZ` | `NOT NULL`                                       | Token expiry                    |
| `usedAt`    | `TIMESTAMPTZ` | nullable                                         | When the token was consumed     |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Row creation time               |

**Indexes:** `idx_prt_token_hash(tokenHash) UNIQUE`, `idx_prt_user(userId)`, `idx_prt_expires(expiresAt) WHERE usedAt IS NULL`

---

## OAuthAccount

Links external OAuth identities (Google, Apple) to platform users. One user can have multiple OAuth accounts.

| Column              | Type          | Constraints                                      | Description                  |
| ------------------- | ------------- | ------------------------------------------------ | ---------------------------- |
| `id`                | `TEXT`        | `PRIMARY KEY`                                    | Record UUID                  |
| `userId`            | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Linked platform user         |
| `provider`          | `TEXT`        | `NOT NULL CHECK IN ('google', 'apple')`          | OAuth provider               |
| `providerAccountId` | `TEXT`        | `NOT NULL`                                       | Provider's unique account ID |
| `email`             | `TEXT`        | nullable                                         | Email from provider          |
| `name`              | `TEXT`        | nullable                                         | Display name from provider   |
| `avatarUrl`         | `TEXT`        | nullable                                         | Avatar URL from provider     |
| `createdAt`         | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Row creation time            |

**Indexes:** `idx_oauth_provider_account(provider, providerAccountId) UNIQUE`, `idx_oauth_user(userId)`

---

## UserProfile

User insights profile linked to the auth system. Stores coaching insights accumulated over sessions.

| Column         | Type          | Constraints                                             | Description                                                           |
| -------------- | ------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `id`           | `TEXT`        | `PRIMARY KEY`                                           | Profile record UUID                                                   |
| `userId`       | `TEXT`        | `UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Owner user (1:1)                                                      |
| `username`     | `VARCHAR(30)` | `UNIQUE` (nullable)                                     | Optional public username                                              |
| `isPublic`     | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                                | Profile visibility                                                    |
| `insightsJson` | `JSONB`       | `DEFAULT '[]'`                                          | Coaching insights array. See [JSONB schema](#userprofileinsightsjson) |
| `lastUpdated`  | `TIMESTAMP`   | `NOT NULL DEFAULT NOW()`                                | Last update time                                                      |
| `createdAt`    | `TIMESTAMP`   | `NOT NULL DEFAULT NOW()`                                | Row creation time                                                     |

**Indexes:** `idx_profile_user(userId)`, `idx_userprofile_username(username) WHERE username IS NOT NULL`

---

## IdentityLink

Maps anonymous visitor IDs to registered users, enabling pre-registration analytics to be linked to post-registration user records.

| Column        | Type          | Constraints                                                                                   | Description                  |
| ------------- | ------------- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| `id`          | `TEXT`        | `PRIMARY KEY`                                                                                 | Record UUID                  |
| `userId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                                              | Linked user                  |
| `anonymousId` | `TEXT`        | `NOT NULL`                                                                                    | Anonymous visitor/client ID  |
| `linkedAt`    | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                      | When the link was created    |
| `source`      | `TEXT`        | `NOT NULL DEFAULT 'registration'`, `CHECK IN ('registration', 'login', 'manual', 'backfill')` | How the link was established |

**Indexes:** `idx_identity_link_unique(userId, anonymousId) UNIQUE`, `idx_identity_anon(anonymousId)`, `idx_identity_user(userId)`

---

## CoachingSession

AI coaching conversation sessions. A stable session ID connects streaming, saving, summary extraction, feedback, and resume behavior.

| Column              | Type          | Constraints                                      | Description                                                             |
| ------------------- | ------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `id`                | `TEXT`        | `PRIMARY KEY`                                    | Stable session UUID                                                     |
| `userId`            | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Owner user                                                              |
| `sessionType`       | `TEXT`        | `NOT NULL DEFAULT 'coaching'`                    | Session type                                                            |
| `reportId`          | `TEXT`        | `REFERENCES CareerReport(id) ON DELETE SET NULL` | Associated report                                                       |
| `startedAt`         | `TIMESTAMPTZ` | `DEFAULT NOW()`                                  | Session start time                                                      |
| `endedAt`           | `TIMESTAMPTZ` | nullable                                         | Session completion time                                                 |
| `updatedAt`         | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Last persisted turn                                                     |
| `roundNumber`       | `INTEGER`     | `DEFAULT 0`                                      | Persisted user-turn count                                               |
| `maxRounds`         | `INTEGER`     | `DEFAULT 5`                                      | Access-level limit; full access uses an effectively unlimited value     |
| `messagesJson`      | `JSONB`       | `DEFAULT '[]'`                                   | Conversation messages. See [JSONB schema](#coachingsessionmessagesjson) |
| `summaryJson`       | `TEXT`        | nullable                                         | Post-session summary (serialized JSON)                                  |
| `savedToProfile`    | `BOOLEAN`     | `DEFAULT FALSE`                                  | Whether insights were saved                                             |
| `tagsGeneratedJson` | `TEXT`        | `DEFAULT '[]'`                                   | Generated topic tags                                                    |
| `mode`              | `TEXT`        | `NOT NULL DEFAULT 'explore'`                     | Current adaptive coaching mode                                          |
| `stateJson`         | `JSONB`       | `NOT NULL DEFAULT '{}'`                          | Resumable V2 state. See [JSONB schema](#coachingsessionstatejson)       |
| `locale`            | `TEXT`        | `NOT NULL DEFAULT 'en'`                          | Conversation locale                                                     |
| `status`            | `TEXT`        | `CHECK IN ('active', 'completed')`               | Resume/completion state                                                 |
| `programId`         | `TEXT`        | nullable                                         | Associated program                                                      |

**Indexes:** `idx_coaching_user(userId)`, `idx_coaching_report(reportId) WHERE reportId IS NOT NULL`, `idx_coaching_user_updated(userId, updatedAt DESC)`, `idx_coaching_user_active(userId, status) WHERE status = 'active'`

---

## CoachingTurnAudit

Per-turn AI Coach V2 diagnostics. Stores the deterministic understanding and routing decision plus lightweight response contribution flags; it does not duplicate the full message text.

| Column                    | Type           | Constraints                                                 | Description                                      |
| ------------------------- | -------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `id`                      | `TEXT`         | `PRIMARY KEY`                                               | Deterministic `sessionId:turnNumber` identifier  |
| `sessionId`               | `TEXT`         | `NOT NULL REFERENCES CoachingSession(id) ON DELETE CASCADE` | Source session                                   |
| `userId`                  | `TEXT`         | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`            | Owner user                                       |
| `turnNumber`              | `INTEGER`      | `NOT NULL`, unique with `sessionId`                         | User-turn number                                 |
| `strategyVersion`         | `TEXT`         | `CHECK IN ('legacy','shadow','v2')`                         | Rollout variant                                  |
| `mode`                    | `TEXT`         | adaptive mode check                                         | Selected coaching mode                           |
| `primaryIntent`           | `TEXT`         | `NOT NULL`                                                  | Inferred main intent                             |
| `coreQuestion`            | `TEXT`         | `NOT NULL`                                                  | Inferred user focus                              |
| `importantFacts`          | `JSONB`        | `NOT NULL DEFAULT '[]'`                                     | Relevant facts from the current turn             |
| `constraints`             | `JSONB`        | `NOT NULL DEFAULT '[]'`                                     | Detected reality constraints                     |
| `desiredHelp`             | `TEXT`         | desired-help check                                          | Listen, analyze, recommend, plan, or information |
| `ambiguities`             | `JSONB`        | `NOT NULL DEFAULT '[]'`                                     | Reasons clarification may be needed              |
| `confidence`              | `NUMERIC(4,3)` | `NOT NULL`                                                  | Understanding confidence                         |
| `correctionSignal`        | `TEXT`         | nullable                                                    | Explicit or text-derived correction signal       |
| `needsRepair`             | `BOOLEAN`      | `NOT NULL DEFAULT FALSE`                                    | Whether the response must repair a miss          |
| `assistantResponseLength` | `INTEGER`      | nullable                                                    | Persisted assistant character count              |
| `hasActionDraft`          | `BOOLEAN`      | `NOT NULL DEFAULT FALSE`                                    | Response emitted an action draft                 |
| `hasRecommendation`       | `BOOLEAN`      | `NOT NULL DEFAULT FALSE`                                    | Decision response contained a recommendation     |
| `completedAt`             | `TIMESTAMPTZ`  | nullable                                                    | Response completion time                         |
| `createdAt`               | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                                    | Audit creation time                              |

**Indexes:** `UNIQUE(sessionId, turnNumber)`, `idx_coaching_turn_audit_created(createdAt DESC)`, `idx_coaching_turn_audit_strategy(strategyVersion, createdAt DESC)`, `idx_coaching_turn_audit_repair(needsRepair, createdAt DESC) WHERE needsRepair = TRUE`

---

## CoachMessage

Proactive coaching messages delivered to users (guides, insights, nudges, welcome messages).

| Column      | Type          | Constraints                                                  | Description         |
| ----------- | ------------- | ------------------------------------------------------------ | ------------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                                | Message UUID        |
| `userId`    | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`             | Target user         |
| `type`      | `TEXT`        | `NOT NULL CHECK IN ('guide', 'insight', 'nudge', 'welcome')` | Message type        |
| `trigger`   | `TEXT`        | `NOT NULL`                                                   | What triggered this |
| `content`   | `JSONB`       | `NOT NULL DEFAULT '{}'`                                      | Message content     |
| `isRead`    | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                                     | Read status         |
| `actionUrl` | `TEXT`        | nullable                                                     | Optional CTA URL    |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                     | Creation time       |

**Indexes:** `idx_coach_message_user(userId)`, `idx_coach_message_user_unread(userId, isRead) WHERE isRead = FALSE`, `idx_coach_message_created(createdAt DESC)`

---

## CoachingTheme

Longitudinal coaching memory: recurring topics across coaching sessions.

| Column             | Type          | Constraints                                                  | Description         |
| ------------------ | ------------- | ------------------------------------------------------------ | ------------------- |
| `id`               | `TEXT`        | `PRIMARY KEY`                                                | Theme UUID          |
| `userId`           | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`             | User                |
| `theme`            | `TEXT`        | `NOT NULL`                                                   | Theme label         |
| `context`          | `TEXT`        | nullable                                                     | Theme context       |
| `sentiment`        | `TEXT`        | `CHECK IN ('positive', 'negative', 'neutral', 'conflicted')` | Sentiment           |
| `mentionCount`     | `INTEGER`     | `NOT NULL DEFAULT 1`                                         | Times mentioned     |
| `firstMentionedAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                     | First mention       |
| `lastMentionedAt`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                     | Most recent mention |
| `resolved`         | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                                     | Whether resolved    |

**Indexes:** `idx_coaching_theme_user(userId)`, `idx_coaching_theme_user_active(userId, resolved) WHERE resolved = FALSE`, `UNIQUE idx_coaching_theme_user_theme(userId, theme)`

---

## QuestionnaireSession

Deep Dive questionnaire progress and answers. Tracks a user's journey through the 86-question assessment.

| Column                    | Type          | Constraints                                                                                            | Description                                                                     |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `id`                      | `TEXT`        | `PRIMARY KEY`                                                                                          | Session UUID                                                                    |
| `userId`                  | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                                                               | Owner user                                                                      |
| `tier`                    | `TEXT`        | `NOT NULL DEFAULT 'deep'`, `CHECK IN ('quick', 'deep', 'ultra')`                                       | Assessment tier                                                                 |
| `language`                | `TEXT`        | `NOT NULL DEFAULT 'zh'`, `CHECK IN ('en', 'zh', 'nl', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru')` | Assessment language                                                             |
| `answersJson`             | `JSONB`       | `NOT NULL DEFAULT '[]'`                                                                                | Question answers. See [JSONB schema](#questionnairesessionanswersjson)          |
| `currentModule`           | `TEXT`        | `NOT NULL DEFAULT 'A'`                                                                                 | Current module (A/B/C)                                                          |
| `currentQuestionIndex`    | `INTEGER`     | `NOT NULL DEFAULT 0`                                                                                   | Current question within module                                                  |
| `answerAssistantEnabled`  | `BOOLEAN`     | `NOT NULL DEFAULT false`                                                                               | Answer assistant toggle                                                         |
| `explorationProgressJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                                                                                | Zone progress. See [JSONB schema](#questionnairesessionexplorationprogressjson) |
| `status`                  | `TEXT`        | `NOT NULL DEFAULT 'in_progress'`, `CHECK IN ('in_progress', 'completed', 'abandoned')`                 | Session status                                                                  |
| `startedAt`               | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                               | Session start                                                                   |
| `completedAt`             | `TIMESTAMPTZ` | nullable                                                                                               | Session completion                                                              |
| `totalTimeMs`             | `INTEGER`     | nullable                                                                                               | Total time in milliseconds                                                      |
| `lastActiveAt`            | `TIMESTAMPTZ` | nullable                                                                                               | Last activity                                                                   |
| `createdAt`               | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                               | Row creation time                                                               |
| `updatedAt`               | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                               | Last update time                                                                |

**Indexes:** `idx_session_user_qs(userId)`, `idx_session_status(status)`

---

## AssessmentResult

Output of the scoring pipeline (v2.0 historical / v3.0 current). Links to a QuestionnaireSession.

| Column           | Type          | Constraints                                                      | Description                                                     |
| ---------------- | ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY`                                                    | Result UUID                                                     |
| `sessionId`      | `TEXT`        | `NOT NULL REFERENCES QuestionnaireSession(id) ON DELETE CASCADE` | Source session                                                  |
| `userId`         | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                         | Owner user                                                      |
| `resultJson`     | `JSONB`       | `NOT NULL`                                                       | Scoring output. See [JSONB schema](#assessmentresultresultjson) |
| `confidence`     | `REAL`        | nullable                                                         | Overall confidence score                                        |
| `version`        | `TEXT`        | `NOT NULL DEFAULT '2.0'`                                         | Pipeline version                                                |
| `idempotencyKey` | `TEXT`        | nullable                                                         | Deduplication key                                               |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                         | Row creation time                                               |

**Indexes:** `idx_assessment_session(sessionId)`, `idx_assessment_user(userId)`, `idx_assessment_idempotency(idempotencyKey) UNIQUE WHERE idempotencyKey IS NOT NULL`

---

## QuickDiveResult

Quick Dive (30-question RIASEC) assessment results. Includes archetype assignment and optional narrative.

| Column           | Type          | Constraints                              | Description                                                              |
| ---------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `id`             | `TEXT`        | `PRIMARY KEY`                            | Result UUID                                                              |
| `scoresJson`     | `JSONB`       | `NOT NULL`                               | RIASEC scores. See [JSONB schema](#quickdiveresultscorejson)             |
| `archetypeCode`  | `TEXT`        | `NOT NULL`                               | Two-letter RIASEC code (e.g. `"IA"`)                                     |
| `archetypeLabel` | `TEXT`        | `NOT NULL`                               | Archetype display name                                                   |
| `language`       | `TEXT`        | `NOT NULL DEFAULT 'en'`                  | Assessment language                                                      |
| `userId`         | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL` | Owner user                                                               |
| `anonymousId`    | `TEXT`        | nullable                                 | Anonymous visitor/client ID (no FK)                                      |
| `resultDataJson` | `JSONB`       | nullable                                 | Full result snapshot. See [JSONB schema](#quickdiveresultresultdatajson) |
| `exploreMode`    | `TEXT`        | `NOT NULL DEFAULT 'narrative'`           | Explore mode                                                             |
| `adminNote`      | `TEXT`        | nullable                                 | Admin label for anonymous visitors                                       |
| `environment`    | `TEXT`        | `NOT NULL DEFAULT 'production'`          | Data environment (`production`, `development`, `test`)                   |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                 | Row creation time                                                        |

**Indexes:** `idx_quickdive_archetype(archetypeCode)`, `idx_quickdive_user(userId)`, `idx_quickdive_mode(exploreMode)`, `idx_quickdive_anonymous(anonymousId)`

---

## RealConditions

User's real-world constraints snapshot for career pathway generation.

| Column           | Type          | Constraints                                                      | Description                                                           |
| ---------------- | ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY`                                                    | Record UUID                                                           |
| `sessionId`      | `TEXT`        | `NOT NULL REFERENCES QuestionnaireSession(id) ON DELETE CASCADE` | Source session                                                        |
| `userId`         | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                         | Owner user                                                            |
| `conditionsJson` | `JSONB`       | `NOT NULL`                                                       | Reality conditions. See [JSONB schema](#realconditionsconditionsjson) |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                         | Row creation time                                                     |

**Indexes:** `idx_rc_session(sessionId)`, `idx_rc_user(userId)`

---

## CareerReport

Generated career reports (2-3 LLM calls). Contains the 5-chapter report output.

| Column             | Type          | Constraints                                                  | Description                                                           |
| ------------------ | ------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `id`               | `TEXT`        | `PRIMARY KEY`                                                | Report UUID                                                           |
| `assessmentId`     | `TEXT`        | `NOT NULL REFERENCES AssessmentResult(id) ON DELETE CASCADE` | Source assessment                                                     |
| `userId`           | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                     | Owner user                                                            |
| `reportJson`       | `JSONB`       | `NOT NULL`                                                   | Report content. See [JSONB schema](#careerreportreportjson)           |
| `generationTimeMs` | `INTEGER`     | nullable                                                     | Total generation time in ms                                           |
| `llmModel`         | `TEXT`        | nullable                                                     | Primary LLM model used                                                |
| `llmCalls`         | `INTEGER`     | nullable                                                     | Number of LLM API calls                                               |
| `version`          | `TEXT`        | `NOT NULL DEFAULT '2.0'`                                     | Report schema version                                                 |
| `inputHash`        | `TEXT`        | nullable                                                     | Staleness detection hash. See [scalar schema](#careerreportinputhash) |
| `createdAt`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                     | Row creation time                                                     |

**Indexes:** `idx_report_assessment(assessmentId) UNIQUE`, `idx_report_user(userId)`

---

## ResumeMatchResult

Persisted "Career Evidence" (resume parse + match). Generalises to future sources (LinkedIn, portfolio) via `sourceType`. Superseded rows are retained so thesis analysis can trace what evidence was visible at each report generation.

**Source:** `scripts/migrations/078-resume-match-persistence.sql`

| Column            | Type          | Constraints                                                               | Description                                                                             |
| ----------------- | ------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `id`              | `TEXT`        | `PRIMARY KEY`                                                             | Row UUID                                                                                |
| `assessmentId`    | `TEXT`        | `NOT NULL REFERENCES AssessmentResult(id) ON DELETE CASCADE`              | Source assessment                                                                       |
| `userId`          | `TEXT`        | `REFERENCES User(id) ON DELETE CASCADE`                                   | Owner user                                                                              |
| `sourceType`      | `TEXT`        | `NOT NULL DEFAULT 'resume'`, `CHECK IN ('resume','linkedin','portfolio')` | Evidence source type                                                                    |
| `fileName`        | `TEXT`        | nullable                                                                  | Original file name (if uploaded)                                                        |
| `fileType`        | `TEXT`        | nullable                                                                  | MIME type                                                                               |
| `resumeDataJson`  | `JSONB`       | `NOT NULL`                                                                | Parsed resume fields (experience, skills, education, etc.)                              |
| `matchResultJson` | `JSONB`       | `NOT NULL`                                                                | Resume↔career match scores injected into `career-match` + `integration` report chapters |
| `flowVersion`     | `TEXT`        | `NOT NULL DEFAULT 'v2-dialog'`                                            | Resume-enhanced flow version                                                            |
| `supersededAt`    | `TIMESTAMPTZ` | nullable                                                                  | When this row was replaced by a newer upload (NULL = active)                            |
| `createdAt`       | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                  | Row creation time                                                                       |

**Indexes:**

- `ResumeMatchResult_assessment_active_idx(assessmentId) UNIQUE WHERE supersededAt IS NULL` — only one active row per assessment
- `ResumeMatchResult_user_idx(userId)`
- `ResumeMatchResult_assessment_history_idx(assessmentId, createdAt DESC)` — audit trail for thesis analysis

**Usage pattern:** Resume upload → parse → match → persist (new row) → previous row gets `supersededAt = NOW()` → report generation reads the active row.

---

## PersonalProfile

Assessment-linked personal profile. Contains algorithmically computed profile data and exercise results.

| Column          | Type          | Constraints                                                  | Description                                                         |
| --------------- | ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `id`            | `TEXT`        | `PRIMARY KEY`                                                | Profile UUID                                                        |
| `assessmentId`  | `TEXT`        | `NOT NULL REFERENCES AssessmentResult(id) ON DELETE CASCADE` | Source assessment                                                   |
| `userId`        | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                     | Owner user                                                          |
| `profileJson`   | `JSONB`       | `NOT NULL`                                                   | Profile data. See [JSONB schema](#personalprofileprofilejson)       |
| `exercisesJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                                      | Exercise results. See [JSONB schema](#personalprofileexercisesjson) |
| `version`       | `TEXT`        | `NOT NULL DEFAULT '2.0'`                                     | Profile schema version                                              |
| `createdAt`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                     | Row creation time                                                   |
| `updatedAt`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                     | Last update time                                                    |

**Indexes:** `idx_profile_assessment(assessmentId) UNIQUE`, `idx_profile_user_pp(userId)`

---

## UserMemory

AI coaching persistent memory entries. Cross-session memory for contextual coaching.

| Column       | Type          | Constraints                                                                      | Description                                             |
| ------------ | ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`         | `TEXT`        | `PRIMARY KEY`                                                                    | Memory entry UUID                                       |
| `userId`     | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                                 | Owner user                                              |
| `category`   | `TEXT`        | `NOT NULL CHECK IN (...)`                                                        | Memory category                                         |
| `keyword`    | `TEXT`        | `NOT NULL`                                                                       | Short keyword/label                                     |
| `insight`    | `TEXT`        | `NOT NULL`                                                                       | Full insight text                                       |
| `source`     | `TEXT`        | `NOT NULL CHECK IN ('questionnaire', 'report', 'profile', 'coaching', 'manual')` | Data source                                             |
| `confidence` | `REAL`        | `NOT NULL DEFAULT 0.8`                                                           | Confidence score (0-1)                                  |
| `isActive`   | `BOOLEAN`     | `NOT NULL DEFAULT TRUE`                                                          | Whether memory is active                                |
| `metadata`   | `JSONB`       | `DEFAULT '{}'`                                                                   | Synthesis metadata. See [JSONB schema](#usermemorymeta) |
| `createdAt`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Row creation time                                       |
| `updatedAt`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Last update time                                        |

**Valid `category` values:** `personality`, `values`, `behavior`, `career`, `constraint`, `motivation`, `blindspot`, `strength`, `coaching_insight`

**Indexes:** `idx_user_memory_user(userId)`, `idx_user_memory_active(userId, isActive)`, `idx_memory_active_confidence(userId, confidence DESC) WHERE isActive = TRUE`, `idx_memory_decay_check(userId, updatedAt) WHERE isActive = TRUE`

---

## ReportReaction

User reactions to report panels. One reaction per report per user.

| Column      | Type          | Constraints                                                 | Description       |
| ----------- | ------------- | ----------------------------------------------------------- | ----------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                               | Record UUID       |
| `userId`    | `TEXT`        | nullable                                                    | Reacting user     |
| `reportId`  | `TEXT`        | `NOT NULL REFERENCES CareerReport(id) ON DELETE CASCADE`    | Target report     |
| `reaction`  | `TEXT`        | `NOT NULL CHECK IN ('surprised', 'skeptical', 'resonates')` | Reaction type     |
| `createdAt` | `TIMESTAMPTZ` | `DEFAULT NOW()`                                             | Row creation time |

**Indexes:** `idx_reaction_report_user(reportId, userId) UNIQUE WHERE userId IS NOT NULL`

---

## ReportNPS

Net Promoter Score feedback on reports. Includes PMF (Product-Market Fit) survey response.

| Column        | Type          | Constraints                                                                   | Description                     |
| ------------- | ------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| `id`          | `TEXT`        | `PRIMARY KEY`                                                                 | Record UUID                     |
| `reportId`    | `TEXT`        | `NOT NULL REFERENCES CareerReport(id) ON DELETE CASCADE`                      | Target report                   |
| `userId`      | `TEXT`        | nullable                                                                      | Responding user                 |
| `score`       | `INTEGER`     | `NOT NULL CHECK (score >= 1 AND score <= 10)`                                 | NPS score (1-10)                |
| `pmfResponse` | `TEXT`        | `CHECK IN ('very_disappointed', 'somewhat_disappointed', 'not_disappointed')` | PMF survey answer               |
| `feedback`    | `TEXT`        | nullable                                                                      | Open-ended feedback text        |
| `locale`      | `TEXT`        | nullable                                                                      | User locale at time of feedback |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                      | Row creation time               |

**Indexes:** `idx_nps_report_user(reportId, userId) UNIQUE WHERE userId IS NOT NULL`

---

## ReportEngagement

Passive report page engagement tracking, recorded via `sendBeacon`. Tracks dwell times and scrollback events.

| Column           | Type          | Constraints                                              | Description                                                            |
| ---------------- | ------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY`                                            | Record UUID                                                            |
| `reportId`       | `TEXT`        | `NOT NULL REFERENCES CareerReport(id) ON DELETE CASCADE` | Target report                                                          |
| `userId`         | `TEXT`        | nullable                                                 | Viewing user                                                           |
| `panelTimes`     | `JSONB`       | `NOT NULL DEFAULT '{}'`                                  | Per-panel dwell times. See [JSONB schema](#reportengagementpaneltimes) |
| `scrollbacks`    | `JSONB`       | `NOT NULL DEFAULT '[]'`                                  | Scrollback events. See [JSONB schema](#reportengagementscrollbacks)    |
| `maxScrollDepth` | `REAL`        | nullable                                                 | Maximum scroll depth (0-1)                                             |
| `totalTimeMs`    | `INTEGER`     | nullable                                                 | Total time on page in ms                                               |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                 | Row creation time                                                      |

**Indexes:** `idx_reportengagement_report(reportId)`, `idx_reportengagement_user(userId) WHERE userId IS NOT NULL`, `idx_reportengagement_created(createdAt DESC)`

---

## CoachingFeedback

Satisfaction feedback collected at the end of coaching sessions.

| Column      | Type          | Constraints                                                 | Description                        |
| ----------- | ------------- | ----------------------------------------------------------- | ---------------------------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                               | Record UUID                        |
| `sessionId` | `TEXT`        | `NOT NULL REFERENCES CoachingSession(id) ON DELETE CASCADE` | Source coaching session            |
| `userId`    | `TEXT`        | nullable                                                    | Responding user                    |
| `rating`    | `TEXT`        | `NOT NULL CHECK IN ('okay', 'helpful', 'very_helpful')`     | Satisfaction rating                |
| `reasons`   | `TEXT[]`      | `NOT NULL DEFAULT '{}'`                                     | Structured diagnostic reasons      |
| `highlight` | `TEXT`        | nullable                                                    | User-highlighted most helpful part |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                    | Row creation time                  |

---

## UserFunnel

Key user journey events for funnel tracking and analytics.

| Column           | Type          | Constraints              | Description                                             |
| ---------------- | ------------- | ------------------------ | ------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY`            | Record UUID                                             |
| `userId`         | `TEXT`        | nullable                 | User who triggered the event                            |
| `clientId`       | `TEXT`        | nullable                 | Anonymous client ID                                     |
| `event`          | `TEXT`        | `NOT NULL`               | Event name (e.g. `quickdive_completed`)                 |
| `metadata`       | `JSONB`       | `DEFAULT '{}'`           | Event metadata. See [JSONB schema](#userfunnelmetadata) |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Event timestamp                                         |
| `idempotencyKey` | `TEXT`        | nullable                 | Deduplication key                                       |
| `isAdmin`        | `BOOLEAN`     | `DEFAULT FALSE`          | Whether triggered by admin                              |

**Indexes:** `idx_funnel_user(userId)`, `idx_funnel_event(event)`, `idx_funnel_created(createdAt)`, `idx_funnel_idempotency_key(idempotencyKey) UNIQUE WHERE idempotencyKey IS NOT NULL`, `idx_userfunnel_isadmin(isAdmin) WHERE isAdmin = TRUE`

---

## PageVisit

Visitor tracking via Next.js middleware `after()`. Records every page visit with geo/device metadata.

| Column           | Type          | Constraints     | Description                          |
| ---------------- | ------------- | --------------- | ------------------------------------ |
| `id`             | `TEXT`        | `PRIMARY KEY`   | Record UUID                          |
| `path`           | `TEXT`        | `NOT NULL`      | Page path visited                    |
| `ipHash`         | `TEXT`        | nullable        | SHA-256 hash of visitor IP           |
| `userAgent`      | `TEXT`        | nullable        | Raw user-agent string                |
| `referer`        | `TEXT`        | nullable        | HTTP referer header                  |
| `userId`         | `TEXT`        | nullable        | Authenticated user ID (if logged in) |
| `country`        | `TEXT`        | nullable        | Geo-detected country                 |
| `isBot`          | `BOOLEAN`     | `DEFAULT FALSE` | Bot detection flag                   |
| `isInternal`     | `BOOLEAN`     | `DEFAULT FALSE` | Internal traffic flag                |
| `city`           | `TEXT`        | nullable        | Geo-detected city                    |
| `region`         | `TEXT`        | nullable        | Geo-detected region                  |
| `timezone`       | `TEXT`        | nullable        | Visitor timezone                     |
| `isMobile`       | `BOOLEAN`     | nullable        | Mobile device flag                   |
| `platform`       | `TEXT`        | nullable        | OS/platform                          |
| `acceptLanguage` | `TEXT`        | nullable        | Accept-Language header               |
| `deviceType`     | `TEXT`        | nullable        | Device type classification           |
| `utmSource`      | `TEXT`        | nullable        | UTM source parameter                 |
| `utmMedium`      | `TEXT`        | nullable        | UTM medium parameter                 |
| `utmCampaign`    | `TEXT`        | nullable        | UTM campaign parameter               |
| `utmContent`     | `TEXT`        | nullable        | UTM content parameter                |
| `durationMs`     | `INTEGER`     | nullable        | Visit duration in ms                 |
| `visitSessionId` | `TEXT`        | nullable        | Visit session grouping ID            |
| `createdAt`      | `TIMESTAMPTZ` | `DEFAULT NOW()` | Row creation time                    |

**Indexes:** `idx_pagevisit_created(createdAt DESC)`, `idx_pagevisit_iphash(ipHash)`, `idx_pagevisit_path(path)`, `idx_pagevisit_user(userId) WHERE userId IS NOT NULL`, `idx_pagevisit_isbot(isBot, createdAt DESC)`, `idx_pagevisit_internal(isInternal, createdAt DESC)`, `idx_pagevisit_utm(utmSource) WHERE utmSource IS NOT NULL`, `idx_pagevisit_session(visitSessionId) WHERE visitSessionId IS NOT NULL`

---

## AnalyticsError

Observability log for errors inside the analytics layer. Errors are fire-and-forget; failures here never crash user flows.

| Column      | Type          | Constraints                                                                    | Description                                               |
| ----------- | ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                                                  | Record UUID                                               |
| `layer`     | `TEXT`        | `NOT NULL CHECK IN ('funnel', 'page_visit', 'engagement', 'identity', 'cron')` | Analytics subsystem that errored                          |
| `event`     | `TEXT`        | nullable                                                                       | Event being processed when error occurred                 |
| `error`     | `TEXT`        | `NOT NULL`                                                                     | Error message (truncated to 2000 chars)                   |
| `context`   | `JSONB`       | nullable                                                                       | Error context. See [JSONB schema](#analyticserrorcontext) |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                       | Row creation time                                         |

**Indexes:** `idx_analytics_error_created(createdAt DESC)`, `idx_analytics_error_layer(layer, createdAt DESC)`

---

## NotableVisitor

Automatically detected high-value visitors, scored by visit patterns.

| Column       | Type          | Constraints             | Description                                               |
| ------------ | ------------- | ----------------------- | --------------------------------------------------------- |
| `id`         | `TEXT`        | `PRIMARY KEY`           | Record UUID                                               |
| `ipHash`     | `TEXT`        | `NOT NULL UNIQUE`       | SHA-256 hash of visitor IP                                |
| `score`      | `INTEGER`     | `NOT NULL DEFAULT 0`    | Notable-ness score                                        |
| `reasons`    | `TEXT[]`      | `NOT NULL DEFAULT '{}'` | Array of detection reasons                                |
| `summary`    | `JSONB`       | nullable                | Visit summary. See [JSONB schema](#notablevisitorsummary) |
| `detectedAt` | `TIMESTAMPTZ` | `DEFAULT NOW()`         | First detection time                                      |
| `expiresAt`  | `TIMESTAMPTZ` | `NOT NULL`              | Record expiry                                             |
| `dismissed`  | `BOOLEAN`     | `DEFAULT FALSE`         | Admin dismissal flag                                      |

**Indexes:** `idx_notable_expires(expiresAt)`, `idx_notable_score(score DESC)`

---

## UserDeletionRequest

GDPR right-to-erasure scheduling. Tracks deletion requests through their lifecycle.

| Column                | Type          | Constraints              | Description                           |
| --------------------- | ------------- | ------------------------ | ------------------------------------- |
| `id`                  | `TEXT`        | `PRIMARY KEY`            | Record UUID                           |
| `userId`              | `TEXT`        | `NOT NULL UNIQUE`        | User requesting deletion              |
| `requestedAt`         | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | When deletion was requested           |
| `scheduledDeletionAt` | `TIMESTAMPTZ` | `NOT NULL`               | Scheduled execution date              |
| `cancelledAt`         | `TIMESTAMPTZ` | nullable                 | Cancellation timestamp (if cancelled) |
| `executedAt`          | `TIMESTAMPTZ` | nullable                 | Execution timestamp (if completed)    |

---

## PrePostAssessment

Combined SCC + CDSE pre/post measurement for research. Supports three time points.

| Column               | Type           | Constraints                                                 | Description                                                                        |
| -------------------- | -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `id`                 | `SERIAL`       | `PRIMARY KEY`                                               | Auto-increment ID                                                                  |
| `userId`             | `TEXT`         | `REFERENCES User(id) ON DELETE SET NULL`                    | Participant user                                                                   |
| `assessmentType`     | `VARCHAR(16)`  | `NOT NULL CHECK IN ('pre', 'post_immediate', 'post_1week')` | Measurement time point                                                             |
| `sccResponses`       | `JSONB`        | `NOT NULL`                                                  | SCC scores. See [JSONB schema](#prepostassessmentsccresponses)                     |
| `sccTotalScore`      | `NUMERIC(5,2)` | nullable                                                    | Computed SCC total                                                                 |
| `cdseResponses`      | `JSONB`        | `NOT NULL`                                                  | CDSE scores. See [JSONB schema](#prepostassessmentcdseresponses)                   |
| `cdseTotalScore`     | `NUMERIC(5,2)` | nullable                                                    | Computed CDSE total                                                                |
| `experienceFeedback` | `JSONB`        | nullable                                                    | Post-experience feedback. See [JSONB schema](#prepostassessmentexperiencefeedback) |
| `createdAt`          | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                                    | Row creation time                                                                  |

**Indexes:** `idx_prepost_user(userId)`, `idx_prepost_type(assessmentType)`, `idx_prepost_user_type(userId, assessmentType)`, `idx_prepost_user_type_unique(userId, assessmentType) UNIQUE WHERE userId IS NOT NULL`

---

## UserExplorationProgress

Tracks which modules a user has completed (depth gauge). 1:1 with User.

| Column        | Type          | Constraints                                             | Description                                                                    |
| ------------- | ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`          | `TEXT`        | `PRIMARY KEY`                                           | Record UUID                                                                    |
| `userId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE UNIQUE` | Owner user (1:1)                                                               |
| `modulesJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                                 | Module completion map. See [JSONB schema](#userexplorationprogressmodulesjson) |
| `depthM`      | `INTEGER`     | `NOT NULL DEFAULT 0`                                    | Calculated exploration depth in meters                                         |
| `updatedAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                | Last update time                                                               |

**Indexes:** `idx_exploration_progress_user(userId)`

---

## InviteCode

Self-service cohort enrollment codes. Created by admins, claimed by users to join a cohort.

| Column             | Type          | Constraints                                       | Description                                                           |
| ------------------ | ------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `id`               | `TEXT`        | `PRIMARY KEY`                                     | Record UUID                                                           |
| `code`             | `TEXT`        | `UNIQUE NOT NULL`                                 | Invite code string (uppercase)                                        |
| `cohortId`         | `TEXT`        | `NOT NULL`                                        | Target cohort identifier                                              |
| `createdBy`        | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE RESTRICT` | Admin who created the code                                            |
| `maxUses`          | `INTEGER`     | `NOT NULL DEFAULT 1`                              | Maximum number of claims                                              |
| `usedCount`        | `INTEGER`     | `NOT NULL DEFAULT 0`                              | Current claim count                                                   |
| `claimedByUserIds` | `JSONB`       | `NOT NULL DEFAULT '[]'`                           | User IDs who claimed. See [JSONB schema](#invitecodeclaimedbyuserids) |
| `expiresAt`        | `TIMESTAMPTZ` | nullable                                          | Code expiry                                                           |
| `researchGroup`    | `TEXT`        | `CHECK IN ('classic', 'immersive')`               | Research group assignment for claimants                               |
| `isActive`         | `BOOLEAN`     | `NOT NULL DEFAULT TRUE`                           | Whether code is active                                                |
| `createdAt`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                          | Row creation time                                                     |
| `updatedAt`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                          | Last update time                                                      |

**Indexes:** `idx_invitecode_code(code) UNIQUE`, `idx_invitecode_cohort(cohortId)`

---

## ActionPlan

Top-level action plan derived from a CareerReport. Each user has at most one active plan.

| Column        | Type          | Constraints                                                                  | Description                                              |
| ------------- | ------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `id`          | `TEXT`        | `PRIMARY KEY`                                                                | Plan UUID                                                |
| `userId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                             | Owner user                                               |
| `reportId`    | `TEXT`        | `NOT NULL REFERENCES CareerReport(id) ON DELETE CASCADE`                     | Source report                                            |
| `status`      | `TEXT`        | `NOT NULL DEFAULT 'active'`, `CHECK IN ('active', 'archived', 'superseded')` | Plan lifecycle status                                    |
| `contextJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                                                      | Plan context. See [JSONB schema](#actionplancontextjson) |
| `locale`      | `TEXT`        | `NOT NULL DEFAULT 'en'`                                                      | Plan language                                            |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                     | Row creation time                                        |
| `updatedAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                     | Last update time                                         |

**Indexes:** `idx_action_plan_user(userId)`, `idx_action_plan_report(reportId)`, `idx_action_plan_active(status) WHERE status = 'active'`, `idx_action_plan_user_active(userId, status) WHERE status = 'active'`

---

## ActionItem

Individual action tasks within a plan. Users interact with these directly (complete, skip, add notes).

| Column                 | Type          | Constraints                                                                                 | Description                               |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `id`                   | `TEXT`        | `PRIMARY KEY`                                                                               | Item UUID                                 |
| `planId`               | `TEXT`        | `NOT NULL REFERENCES ActionPlan(id) ON DELETE CASCADE`                                      | Parent plan                               |
| `userId`               | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                                            | Owner user                                |
| `title`                | `TEXT`        | `NOT NULL`                                                                                  | Action title                              |
| `description`          | `TEXT`        | nullable                                                                                    | Detailed description                      |
| `category`             | `TEXT`        | `NOT NULL CHECK IN ('explore', 'learn', 'network', 'create', 'apply', 'reflect')`           | Action category                           |
| `intensity`            | `TEXT`        | `NOT NULL DEFAULT 'passive'`, `CHECK IN ('passive', 'active', 'social', 'creative')`        | Energy intensity level                    |
| `status`               | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending', 'in_progress', 'completed', 'skipped')` | Item status                               |
| `priority`             | `INTEGER`     | `NOT NULL DEFAULT 0`                                                                        | Sort priority (higher = more important)   |
| `estimatedMinutes`     | `INTEGER`     | nullable                                                                                    | Estimated time to complete                |
| `sourceDimension`      | `TEXT`        | nullable                                                                                    | Which assessment dimension generated this |
| `planPhase`            | `INTEGER`     | nullable, `CHECK IN (1, 2, 3)`                                                              | Recommended roadmap phase                 |
| `recommendationReason` | `TEXT`        | nullable                                                                                    | User-facing reason this item is next      |
| `completionOutcome`    | `TEXT`        | nullable                                                                                    | User-facing outcome after completion      |
| `dueDate`              | `DATE`        | nullable                                                                                    | Target completion date                    |
| `completedAt`          | `TIMESTAMPTZ` | nullable                                                                                    | Actual completion time                    |
| `userNote`             | `TEXT`        | nullable                                                                                    | User-added note                           |
| `matchedNonNegotiable` | `TEXT`        | nullable                                                                                    | Non-negotiable ID matched during ranking  |
| `matchedFlowDimension` | `JSONB`       | nullable                                                                                    | Flow tag match captured during ranking    |
| `createdAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                    | Row creation time                         |
| `updatedAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                    | Last update time                          |

**Indexes:** `idx_action_item_plan(planId)`, `idx_action_item_user(userId, status)`, `idx_action_item_status(status) WHERE status IN ('pending', 'in_progress')`

---

## ActionMilestone

Milestone markers within an action plan. Represent progress checkpoints at specific day targets.

| Column        | Type          | Constraints                                                                | Description                         |
| ------------- | ------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `id`          | `TEXT`        | `PRIMARY KEY`                                                              | Milestone UUID                      |
| `planId`      | `TEXT`        | `NOT NULL REFERENCES ActionPlan(id) ON DELETE CASCADE`                     | Parent plan                         |
| `title`       | `TEXT`        | `NOT NULL`                                                                 | Milestone title                     |
| `description` | `TEXT`        | nullable                                                                   | Detailed description                |
| `targetDay`   | `INTEGER`     | `NOT NULL`                                                                 | Target day number (from plan start) |
| `status`      | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending', 'reached', 'skipped')` | Milestone status                    |
| `reachedAt`   | `TIMESTAMPTZ` | nullable                                                                   | When milestone was reached          |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                   | Row creation time                   |

**Indexes:** `idx_milestone_plan(planId)`

---

## LLMUsageLog

Tracks every LLM call for cost monitoring, latency tracking, and usage analytics.

| Column         | Type          | Constraints                     | Description                                                    |
| -------------- | ------------- | ------------------------------- | -------------------------------------------------------------- |
| `id`           | `TEXT`        | `PRIMARY KEY`                   | Record UUID                                                    |
| `taskName`     | `VARCHAR(50)` | `NOT NULL`                      | Task identifier (from model-router)                            |
| `provider`     | `VARCHAR(20)` | `NOT NULL`                      | LLM provider (e.g. `anthropic`, `openai`)                      |
| `model`        | `VARCHAR(50)` | `NOT NULL`                      | Model identifier                                               |
| `inputTokens`  | `INTEGER`     | nullable                        | Input token count                                              |
| `outputTokens` | `INTEGER`     | nullable                        | Output token count                                             |
| `latencyMs`    | `INTEGER`     | `NOT NULL`                      | Call latency in ms                                             |
| `success`      | `BOOLEAN`     | `NOT NULL`                      | Whether the call succeeded                                     |
| `degraded`     | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`        | Whether fallback model was used                                |
| `errorMessage` | `TEXT`        | nullable                        | Error message if failed                                        |
| `userId`       | `TEXT`        | nullable                        | User who triggered the call                                    |
| `environment`  | `VARCHAR(20)` | `NOT NULL DEFAULT 'production'` | Call environment. See [scalar schema](#llmusagelogenvironment) |
| `createdAt`    | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`        | Row creation time                                              |

**Indexes:** `idx_llm_usage_created(createdAt DESC)`, `idx_llm_usage_task(taskName, createdAt DESC)`, `idx_llm_usage_env(environment, createdAt DESC)`

---

## LLMPromptMeta

Per-LLM-call metadata about prompt composition. Currently tracks whether RealConditions was injected and how many fields. Added 2026-05-18 (migration 092) to make the RealConditions-injection audit verifiable in production without touching the frozen `model-router.ts`.

Populated by prompt builders themselves (`career-pathway`, `career-match-narrative`, `integration`, `coaching-chat`) alongside their `callLLM`/`streamLLM` invocations. Joining strategy: aggregate by `(taskName, userId, time window)` — row-level join to `LLMUsageLog` is intentionally avoided (the goal is per-task ratios, not per-call correlation).

| Column                     | Type          | Constraints                     | Description                                                                                                                                                                                                                                            |
| -------------------------- | ------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                       | `UUID`        | `PRIMARY KEY`                   | Record UUID                                                                                                                                                                                                                                            |
| `taskName`                 | `TEXT`        | `NOT NULL`                      | Task identifier. **Note**: `coaching-chat/route.ts` splits by round — `coaching-first` for round 1 (Haiku/TTFB), `coaching` for rounds 2+ (Sonnet). Aggregations should treat them together: `IN ('coaching','coaching-first')` or `LIKE 'coaching%'`. |
| `userId`                   | `UUID`        | nullable                        | User who triggered the call (null for system/test runs)                                                                                                                                                                                                |
| `locale`                   | `TEXT`        | `NOT NULL`                      | Site locale at injection time (e.g. `en`, `zh`)                                                                                                                                                                                                        |
| `realConditionsProvided`   | `BOOLEAN`     | `NOT NULL`                      | Whether the user had filled in RealConditions when this prompt was built                                                                                                                                                                               |
| `realConditionsFieldCount` | `INTEGER`     | `NOT NULL DEFAULT 0`            | Number of distinct RC fields rendered into the prompt (0 when not provided; 19–23 for full/coaching mode after 2026-05-18 expansion)                                                                                                                   |
| `environment`              | `TEXT`        | `NOT NULL DEFAULT 'production'` | Call environment (`production` / `preview` / `development`)                                                                                                                                                                                            |
| `createdAt`                | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`        | Row creation time                                                                                                                                                                                                                                      |

**Indexes:** `idx_llm_prompt_meta_task_created(taskName, createdAt DESC)`, `idx_llm_prompt_meta_user_created(userId, createdAt DESC) WHERE userId IS NOT NULL`

**Canonical aggregation query (per-task RC injection ratio over a window)**:

```sql
SELECT
  CASE WHEN "taskName" LIKE 'coaching%' THEN 'coaching (all rounds)' ELSE "taskName" END AS "task",
  COUNT(*) FILTER (WHERE "realConditionsProvided") AS "withRC",
  COUNT(*) FILTER (WHERE NOT "realConditionsProvided") AS "withoutRC",
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "realConditionsProvided")::numeric
    / NULLIF(COUNT(*), 0), 1
  ) AS "rcPct",
  ROUND(AVG("realConditionsFieldCount") FILTER (WHERE "realConditionsProvided"))::int AS "avgFieldsWhenProvided"
FROM "LLMPromptMeta"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
  AND "environment" = 'production'
GROUP BY 1
ORDER BY 1;
```

To compare round-1 vs round-2+ coaching separately (e.g. greeting vs deepening turns), drop the `LIKE` collapse and group by raw `taskName`.

---

## CareerDirection

Unified career direction library (1,141 entries). Contains curated, O\*NET, and emerging career directions with multi-factor matching annotations.

| Column                 | Type          | Constraints                                                                      | Description                                                                |
| ---------------------- | ------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`                   | `TEXT`        | `PRIMARY KEY`                                                                    | Direction UUID                                                             |
| `source`               | `TEXT`        | `NOT NULL CHECK IN ('curated', 'onet', 'emerging')`                              | Data source                                                                |
| `titleEn`              | `TEXT`        | `NOT NULL`                                                                       | English title                                                              |
| `titleZh`              | `TEXT`        | `NOT NULL`                                                                       | Chinese title                                                              |
| `subtitleZh`           | `TEXT`        | nullable                                                                         | Chinese subtitle                                                           |
| `titleLocales`         | `JSONB`       | `NOT NULL DEFAULT '{}'`                                                          | Additional locale titles. See [JSONB schema](#careerdirectiontitlelocales) |
| `idealRiasec`          | `JSONB`       | `NOT NULL`                                                                       | Ideal RIASEC profile. See [JSONB schema](#careerdirectionidealriasec)      |
| `alignedValues`        | `TEXT[]`      | `NOT NULL DEFAULT '{}'`                                                          | Aligned Schwartz value types                                               |
| `idealBigFive`         | `JSONB`       | `DEFAULT '{}'`                                                                   | Ideal Big Five ranges. See [JSONB schema](#careerdirectionidealbigfive)    |
| `industries`           | `TEXT[]`      | `NOT NULL DEFAULT '{}'`                                                          | Industry sector tags                                                       |
| `crossCulturalFit`     | `TEXT[]`      | `NOT NULL DEFAULT '{}'`                                                          | Cross-cultural fit labels                                                  |
| `seniorityMin`         | `INTEGER`     | `NOT NULL DEFAULT 0`                                                             | Minimum seniority level                                                    |
| `seniorityMax`         | `INTEGER`     | `NOT NULL DEFAULT 20`                                                            | Maximum seniority level                                                    |
| `tags`                 | `TEXT[]`      | `NOT NULL DEFAULT '{}'`                                                          | Classification tags                                                        |
| `aiEraCategory`        | `TEXT`        | `CHECK IN ('stable', 'augmented', 'transformed', 'ai-native')`                   | AI era resilience category                                                 |
| `annotationSource`     | `TEXT`        | `NOT NULL CHECK IN ('expert-heuristic', 'empirical-data', 'ai-assisted')`        | How annotations were created                                               |
| `annotationConfidence` | `TEXT`        | `NOT NULL CHECK IN ('expert-estimated', 'data-validated', 'community-verified')` | Annotation confidence level                                                |
| `marketOutlook`        | `JSONB`       | nullable                                                                         | Market outlook data. See [JSONB schema](#careerdirectionmarketoutlook)     |
| `resilienceScore`      | `REAL`        | nullable                                                                         | Computed resilience score (0-1)                                            |
| `resilienceLevel`      | `INTEGER`     | `CHECK (>= 0 AND <= 3)`                                                          | Resilience tier (0-3)                                                      |
| `isActive`             | `BOOLEAN`     | `NOT NULL DEFAULT TRUE`                                                          | Whether direction is active                                                |
| `lastReviewedAt`       | `TIMESTAMPTZ` | nullable                                                                         | Last expert review date                                                    |
| `createdAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Row creation time                                                          |
| `updatedAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Last update time                                                           |

**Indexes:** `idx_career_dir_source(source)`, `idx_career_dir_active(isActive) WHERE isActive = TRUE`, `idx_career_dir_industries USING gin(industries)`, `idx_career_dir_tags USING gin(tags)`, `idx_career_dir_updated(updatedAt DESC)`, `idx_career_dir_ai_era(aiEraCategory) WHERE aiEraCategory IS NOT NULL`, `idx_career_dir_resilience_level(resilienceLevel) WHERE resilienceLevel IS NOT NULL`

---

## AdminAnswerPreset

Stores admin's real questionnaire answers as reusable test templates for reproducible auto-fill test generation.

| Column             | Type           | Constraints                                      | Description                                                                                         |
| ------------------ | -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `id`               | `TEXT`         | `PRIMARY KEY`                                    | Record UUID                                                                                         |
| `userId`           | `TEXT`         | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Admin user who created the preset                                                                   |
| `name`             | `VARCHAR(100)` | `NOT NULL DEFAULT 'My Answers'`                  | Preset display name                                                                                 |
| `quickDiveAnswers` | `JSONB`        | nullable                                         | Quick Dive answer snapshot. See [JSONB schema](#adminanswerpresetquickdiveanswers--deepdiveanswers) |
| `deepDiveAnswers`  | `JSONB`        | nullable                                         | Deep Dive answer snapshot. See [JSONB schema](#adminanswerpresetquickdiveanswers--deepdiveanswers)  |
| `locale`           | `VARCHAR(5)`   | `NOT NULL DEFAULT 'en'`                          | Locale of the answers                                                                               |
| `createdAt`        | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                         | Row creation time                                                                                   |
| `updatedAt`        | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                         | Last update time                                                                                    |

**Indexes:** `idx_admin_preset_user(userId)`

---

## UserContext

Precomputed user context snapshot (1:1 with User). Write-time aggregation eliminates N+1 queries on page load.

| Column        | Type          | Constraints                                         | Description                                                   |
| ------------- | ------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `userId`      | `TEXT`        | `PRIMARY KEY REFERENCES User(id) ON DELETE CASCADE` | Owner user (1:1, PK is FK)                                    |
| `contextJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                             | Context snapshot. See [JSONB schema](#usercontextcontextjson) |
| `version`     | `INTEGER`     | `NOT NULL DEFAULT 1`                                | Schema version                                                |
| `updatedAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                            | Last recompute time                                           |

---

## AssessmentCompletion

Unified registry of completed assessments per user. Single source of truth for "which assessments has this user completed?"

| Column           | Type          | Constraints                                                                                       | Description                                                   |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY`                                                                                     | Record UUID                                                   |
| `userId`         | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                                                  | Owner user                                                    |
| `assessmentType` | `TEXT`        | `NOT NULL CHECK IN ('quick_dive', 'immersive_dive', 'deep_dive', 'ultra_deep_dive', 'pvq_quick')` | Assessment type                                               |
| `resultId`       | `TEXT`        | `NOT NULL`                                                                                        | ID of the result record (QuickDiveResult or AssessmentResult) |
| `completedAt`    | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                          | Completion timestamp                                          |

**Indexes:** `idx_ac_user(userId)`, `idx_ac_user_type(userId, assessmentType)`, `idx_ac_user_type_result(userId, assessmentType, resultId) UNIQUE`

---

## JourneyTransitionLog

Audit trail for user journey state transitions. One row per successful state change on `User.journeyState`.

| Column        | Type          | Constraints                                      | Description                                                           |
| ------------- | ------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `id`          | `SERIAL`      | `PRIMARY KEY`                                    | Auto-increment ID                                                     |
| `userId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | User whose journey changed                                            |
| `fromState`   | `TEXT`        | `NOT NULL`                                       | Previous journey state                                                |
| `toState`     | `TEXT`        | `NOT NULL`                                       | New journey state                                                     |
| `event`       | `TEXT`        | `NOT NULL`                                       | Triggering event (e.g. `COMPLETE_QUICK_DIVE`, `ADMIN_SKIP`)           |
| `triggeredBy` | `TEXT`        | `NOT NULL DEFAULT 'system'`                      | Who triggered (`system`, `admin`, `user`)                             |
| `metadata`    | `JSONB`       | `DEFAULT '{}'`                                   | Transition context. See [JSONB schema](#journeytransitionlogmetadata) |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Transition timestamp                                                  |

**Indexes:** `idx_journey_log_user(userId)`, `idx_journey_log_created(createdAt)`

---

## UserAchievement

Unlocked achievements per user (gamification). One record per achievement per user.

| Column           | Type          | Constraints                                      | Description                                                       |
| ---------------- | ------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `id`             | `TEXT`        | `PRIMARY KEY DEFAULT gen_random_uuid()::text`    | Record UUID                                                       |
| `userId`         | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Owner user                                                        |
| `achievementKey` | `TEXT`        | `NOT NULL`                                       | Achievement identifier (e.g. `first_dive`, `deep_explorer`)       |
| `unlockedAt`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | When achievement was unlocked                                     |
| `metadata`       | `JSONB`       | `DEFAULT '{}'`                                   | Achievement context. See [JSONB schema](#userachievementmetadata) |

**Constraints:** `UNIQUE(userId, achievementKey)` -- prevents duplicate unlocks

**Indexes:** `idx_achievement_user(userId)`, `idx_achievement_key(achievementKey)`

---

## UserPurchase

Tracks Stripe payment completions. Used for feature access gating.

| Column                  | Type          | Constraints                                                               | Description                |
| ----------------------- | ------------- | ------------------------------------------------------------------------- | -------------------------- |
| `id`                    | `TEXT`        | `PRIMARY KEY DEFAULT gen_random_uuid()::text`                             | Record UUID                |
| `userId`                | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                          | Purchasing user            |
| `tier`                  | `TEXT`        | `NOT NULL CHECK IN ('report', 'journey', 'coaching')`                     | Purchased product tier     |
| `stripeSessionId`       | `TEXT`        | nullable                                                                  | Stripe Checkout session ID |
| `stripePaymentIntentId` | `TEXT`        | nullable                                                                  | Stripe PaymentIntent ID    |
| `amountCents`           | `INTEGER`     | `NOT NULL DEFAULT 0`                                                      | Payment amount in cents    |
| `currency`              | `TEXT`        | `NOT NULL DEFAULT 'usd'`                                                  | Currency code              |
| `status`                | `TEXT`        | `NOT NULL DEFAULT 'active'`, `CHECK IN ('active', 'refunded', 'expired')` | Purchase status            |
| `createdAt`             | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                  | Row creation time          |

**Note:** `journey` tier is a superset that also grants `report` access.

**Indexes:** `idx_user_purchase_user(userId)`, `idx_user_purchase_user_tier(userId, tier)`, `idx_user_purchase_stripe_session(stripeSessionId) UNIQUE WHERE stripeSessionId IS NOT NULL`

---

## \_migrations

Internal migration tracking table. Records which numbered migration scripts have been applied.

| Column      | Type          | Constraints              | Description                |
| ----------- | ------------- | ------------------------ | -------------------------- |
| `id`        | `SERIAL`      | `PRIMARY KEY`            | Auto-increment ID          |
| `filename`  | `TEXT`        | `UNIQUE NOT NULL`        | Migration script filename  |
| `appliedAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | When migration was applied |

---

## ReportGenerationLock

Distributed lock table that prevents duplicate cross-instance report generation. Uses atomic `INSERT ... ON CONFLICT DO UPDATE WHERE expiresAt < NOW()` — only one instance can hold the lock per `assessmentId`. Self-expiring to tolerate instance crash (TTL typically 180s).

**Source:** `scripts/migrations/075_report-generation-lock.sql`

| Column         | Type          | Constraints              | Description                         |
| -------------- | ------------- | ------------------------ | ----------------------------------- |
| `assessmentId` | `TEXT`        | `PRIMARY KEY`            | Assessment being locked             |
| `instanceId`   | `TEXT`        | `NOT NULL`               | Server instance that holds the lock |
| `expiresAt`    | `TIMESTAMPTZ` | `NOT NULL`               | Lock expiry (crash-safe TTL ~180s)  |
| `acquiredAt`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | When the lock was acquired          |

**Indexes:** `ReportGenerationLock_expiresAt_idx(expiresAt)` — used for expired-lock cleanup queries.

**Usage pattern:** Acquire → generate report → release (DELETE). If instance crashes, lock expires naturally and next instance can acquire. No explicit release needed on crash.

---

## AssessmentPipeline

Server-orchestrated assessment completion pipeline: "Deep Dive complete → scoring → profile → narratives → report" chain. Single source of truth for post-completion processing. Per-step status tracking with worker lock + crash recovery. `reportStatus` starts as `'not_requested'` and becomes `'pending'` when the user clicks "View Deep Dive Report" on the profile page.

**Source:** `scripts/migrations/076-assessment-pipeline.sql` + `077-assessment-pipeline-backoff.sql`. See [architecture/assessment-pipeline.md](../architecture/assessment-pipeline.md) for orchestrator contract + failure recovery.

| Column                 | Type          | Constraints                                                                                                    | Description                                          |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `id`                   | `TEXT`        | `PRIMARY KEY DEFAULT gen_random_uuid()::text`                                                                  | Row UUID                                             |
| `assessmentId`         | `TEXT`        | `NOT NULL UNIQUE`                                                                                              | One pipeline row per AssessmentResult                |
| `userId`               | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                                                               | Owner user                                           |
| `sessionId`            | `TEXT`        | `NOT NULL`                                                                                                     | Originating QuestionnaireSession                     |
| `locale`               | `TEXT`        | `NOT NULL DEFAULT 'en'`                                                                                        | Output locale for LLM calls                          |
| `scoringStatus`        | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending','running','done','failed')`                                 | 86-item scoring step                                 |
| `profileStatus`        | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending','running','done','failed')`                                 | Pure-algorithm profile generation step               |
| `narrativesStatus`     | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending','running','done','failed')`                                 | 2 parallel LLM identity narrative calls              |
| `reportStatus`         | `TEXT`        | `NOT NULL DEFAULT 'not_requested'`, `CHECK IN ('not_requested','pending','running','done','failed')`           | 2-3 LLM report generation chain (user-triggered)     |
| `resumeAnalysisStatus` | `TEXT`        | `NOT NULL DEFAULT 'not_requested'`, `CHECK IN ('not_requested','pending','running','done','failed','skipped')` | Resume parse + match step (optional, user-triggered) |
| `reportRequestedAt`    | `TIMESTAMPTZ` | nullable                                                                                                       | When user clicked "View Deep Dive Report"            |
| `status`               | `TEXT`        | `NOT NULL DEFAULT 'pending'`, `CHECK IN ('pending','running','auto_done','completed','failed')`                | Overall pipeline status                              |
| `retryCount`           | `INTEGER`     | `NOT NULL DEFAULT 0`                                                                                           | Exponential backoff retry counter                    |
| `lastStepError`        | `TEXT`        | nullable                                                                                                       | Last error message (truncated)                       |
| `lastAttemptAt`        | `TIMESTAMPTZ` | nullable                                                                                                       | Last retry attempt                                   |
| `nextAttemptAt`        | `TIMESTAMPTZ` | nullable                                                                                                       | Scheduled next retry (backoff)                       |
| `workerLock`           | `TEXT`        | nullable                                                                                                       | Worker instance holding the lock (NULL = available)  |
| `workerLockAt`         | `TIMESTAMPTZ` | nullable                                                                                                       | When the lock was acquired (for stale-lock cleanup)  |
| `startedAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                                       | Pipeline creation time                               |
| `completedAt`          | `TIMESTAMPTZ` | nullable                                                                                                       | Final completion time                                |
| `updatedAt`            | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                                       | Last mutation time                                   |

**Indexes:**

- `AssessmentPipeline_workable_idx(status, nextAttemptAt) WHERE status IN ('pending','running')` — worker queue scan
- `AssessmentPipeline_user_idx(userId, startedAt DESC)` — user history
- `AssessmentPipeline_workerlock_idx(workerLockAt) WHERE workerLock IS NOT NULL` — stale lock cleanup

**Usage pattern:** Deep Dive complete → insert row → worker polls `workable_idx` → acquires lock → runs steps → on crash, `workerLock` TTL expires and another worker picks up via `nextAttemptAt`.

---

## CoachingSessionSummary

Per-session LLM summary written at the end of a coaching session (Phase 4). Feeds cross-session memory recall via the embedding.

| Column         | Type           | Constraints                                                 | Description                                 |
| -------------- | -------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `id`           | `TEXT`         | `PRIMARY KEY DEFAULT gen_random_uuid()`                     | Summary UUID                                |
| `userId`       | `TEXT`         | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`            | Owner user                                  |
| `sessionId`    | `TEXT`         | `NOT NULL REFERENCES CoachingSession(id) ON DELETE CASCADE` | Summarised session                          |
| `summary`      | `TEXT`         | `NOT NULL`                                                  | Narrative session summary                   |
| `keyDecisions` | `JSONB`        | `NOT NULL DEFAULT '[]'`                                     | Decisions the user reached (array)          |
| `openLoops`    | `JSONB`        | `NOT NULL DEFAULT '[]'`                                     | Unresolved threads to revisit (array)       |
| `emotionalArc` | `TEXT`         | nullable                                                    | Emotional trajectory of the session         |
| `embedding`    | `vector(1536)` | nullable                                                    | Semantic embedding for cross-session recall |
| `createdAt`    | `TIMESTAMPTZ`  | `NOT NULL DEFAULT NOW()`                                    | Row creation time                           |

---

## CoachingGrowthMarker

Detected shifts in a user's stance on a dimension across coaching sessions.

| Column               | Type          | Constraints                                                 | Description                                   |
| -------------------- | ------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `id`                 | `TEXT`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                     | Marker UUID                                   |
| `userId`             | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`            | Owner user                                    |
| `dimension`          | `TEXT`        | `NOT NULL`                                                  | Dimension the shift is on                     |
| `previousStance`     | `TEXT`        | nullable                                                    | Prior stance (null if first observation)      |
| `currentStance`      | `TEXT`        | `NOT NULL`                                                  | New stance                                    |
| `changeType`         | `TEXT`        | `NOT NULL CHECK IN ('growth','regression','contradiction')` | Kind of change                                |
| `evidenceSessionIds` | `JSONB`       | `NOT NULL DEFAULT '[]'`                                     | Sessions evidencing the change (array of ids) |
| `detectedAt`         | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                    | When the shift was detected                   |

---

## CoachingHypothesis

Running hypotheses the coach forms about a user, validated over time.

| Column                | Type               | Constraints                                                                    | Description                         |
| --------------------- | ------------------ | ------------------------------------------------------------------------------ | ----------------------------------- |
| `id`                  | `TEXT`             | `PRIMARY KEY DEFAULT gen_random_uuid()`                                        | Hypothesis UUID                     |
| `userId`              | `TEXT`             | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                               | Owner user                          |
| `hypothesis`          | `TEXT`             | `NOT NULL`                                                                     | The hypothesis statement            |
| `evidenceJson`        | `JSONB`            | `NOT NULL DEFAULT '[]'`                                                        | Supporting evidence (array)         |
| `counterEvidenceJson` | `JSONB`            | `NOT NULL DEFAULT '[]'`                                                        | Contradicting evidence (array)      |
| `confidence`          | `DOUBLE PRECISION` | `NOT NULL DEFAULT 0.5 CHECK 0..1`                                              | Confidence 0–1                      |
| `status`              | `TEXT`             | `NOT NULL DEFAULT 'active' CHECK IN ('active','confirmed','rejected','stale')` | Lifecycle status                    |
| `sourceSessionId`     | `TEXT`             | nullable                                                                       | Session that spawned the hypothesis |
| `lastValidatedAt`     | `TIMESTAMPTZ`      | nullable                                                                       | Last validation pass                |
| `createdAt`           | `TIMESTAMPTZ`      | `NOT NULL DEFAULT NOW()`                                                       | Row creation time                   |
| `updatedAt`           | `TIMESTAMPTZ`      | `NOT NULL DEFAULT NOW()`                                                       | Last mutation time                  |

---

## CoachingReviewPool

Coaching turns flagged for offline human QA review.

| Column                  | Type          | Constraints                                                        | Description                          |
| ----------------------- | ------------- | ------------------------------------------------------------------ | ------------------------------------ |
| `id`                    | `TEXT`        | `PRIMARY KEY`                                                      | Pool entry UUID                      |
| `userId`                | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                           | Owner user (nullable after deletion) |
| `reportId`              | `TEXT`        | `REFERENCES CareerReport(id) ON DELETE SET NULL`                   | Related report                       |
| `round`                 | `INTEGER`     | `NOT NULL`                                                         | Coaching turn round number           |
| `locale`                | `TEXT`        | `NOT NULL DEFAULT 'en'`                                            | Turn locale                          |
| `reason`                | `TEXT`        | `NOT NULL`                                                         | Why the turn was flagged             |
| `userMessage`           | `TEXT`        | nullable                                                           | User message for the turn            |
| `assistantMessage`      | `TEXT`        | `NOT NULL`                                                         | Coach response under review          |
| `deterministicEvalJson` | `JSONB`       | `NOT NULL DEFAULT '{}'`                                            | Rule-based eval payload              |
| `llmJudgeJson`          | `JSONB`       | nullable                                                           | LLM-judge eval payload               |
| `status`                | `TEXT`        | `NOT NULL DEFAULT 'open' CHECK IN ('open','reviewed','dismissed')` | Review workflow state                |
| `reviewNotes`           | `TEXT`        | nullable                                                           | Reviewer notes                       |
| `reviewedBy`            | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                           | Reviewing admin                      |
| `reviewedAt`            | `TIMESTAMPTZ` | nullable                                                           | Review timestamp                     |
| `createdAt`             | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                           | Row creation time                    |

---

## CoachingTurnEval

Per-turn quality scores for coaching responses, keyed by Socratic phase.

| Column                   | Type          | Constraints                                                                                 | Description                 |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------- | --------------------------- |
| `id`                     | `TEXT`        | `PRIMARY KEY`                                                                               | Eval UUID                   |
| `userId`                 | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                                                    | Owner user                  |
| `reportId`               | `TEXT`        | `REFERENCES CareerReport(id) ON DELETE SET NULL`                                            | Related report              |
| `round`                  | `INTEGER`     | `NOT NULL`                                                                                  | Turn round number           |
| `locale`                 | `TEXT`        | `NOT NULL DEFAULT 'en'`                                                                     | Turn locale                 |
| `phase`                  | `TEXT`        | `NOT NULL CHECK IN ('discovery','pattern_surfacing','tension_naming','synthesis','action')` | Socratic phase              |
| `depthScore`             | `INTEGER`     | `NOT NULL CHECK 1..5`                                                                       | Depth score                 |
| `transitionScore`        | `INTEGER`     | `NOT NULL CHECK 1..5`                                                                       | Phase-transition quality    |
| `evidenceGroundingScore` | `INTEGER`     | `NOT NULL CHECK 1..5`                                                                       | Evidence grounding          |
| `prematureAdviceFlag`    | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                                                                    | Gave advice too early       |
| `genericSummaryFlag`     | `BOOLEAN`     | `NOT NULL DEFAULT FALSE`                                                                    | Summary was generic         |
| `oneQuestionCompliance`  | `BOOLEAN`     | `NOT NULL DEFAULT TRUE`                                                                     | Asked a single question     |
| `reasonsJson`            | `JSONB`       | `NOT NULL DEFAULT '[]'`                                                                     | Score rationale (array)     |
| `stateJson`              | `JSONB`       | `NOT NULL DEFAULT '{}'`                                                                     | Conversation-state snapshot |
| `createdAt`              | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                                    | Row creation time           |

---

## CompanionProfile

Opt-in public profile for the Archetype Companion social feature. One per user.

| Column          | Type          | Constraints                                                                         | Description                        |
| --------------- | ------------- | ----------------------------------------------------------------------------------- | ---------------------------------- |
| `id`            | `TEXT`        | `PRIMARY KEY`                                                                       | Profile UUID                       |
| `userId`        | `TEXT`        | `UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE`                             | Owner user (one profile per user)  |
| `displayName`   | `TEXT`        | `NOT NULL` (1–40 chars)                                                             | Public display name                |
| `bio`           | `TEXT`        | nullable (≤200 chars)                                                               | Short bio                          |
| `archetypeCode` | `TEXT`        | `NOT NULL`                                                                          | User's archetype code              |
| `scoresJson`    | `JSONB`       | `NOT NULL`                                                                          | Score summary shown on the profile |
| `locale`        | `TEXT`        | `NOT NULL DEFAULT 'en' CHECK IN ('en','zh')`                                        | Profile locale                     |
| `visibility`    | `TEXT`        | `NOT NULL DEFAULT 'discoverable' CHECK IN ('discoverable','friends_only','hidden')` | Discovery visibility               |
| `createdAt`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                            | Row creation time                  |
| `updatedAt`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                            | Last mutation time                 |

---

## CompanionConnection

Friend-request / connection edges between users. Unique per ordered pair, no self-connection.

| Column             | Type          | Constraints                                                             | Description               |
| ------------------ | ------------- | ----------------------------------------------------------------------- | ------------------------- |
| `id`               | `TEXT`        | `PRIMARY KEY`                                                           | Connection UUID           |
| `requesterId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                        | User who sent the request |
| `recipientId`      | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                        | User who received it      |
| `status`           | `TEXT`        | `NOT NULL DEFAULT 'pending' CHECK IN ('pending','accepted','declined')` | Connection state          |
| `requesterMessage` | `TEXT`        | nullable (≤200 chars)                                                   | Optional intro message    |
| `acceptedAt`       | `TIMESTAMPTZ` | nullable                                                                | Acceptance time           |
| `declinedAt`       | `TIMESTAMPTZ` | nullable                                                                | Decline time              |
| `createdAt`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                | Row creation time         |

**Constraints:** `UNIQUE(requesterId, recipientId)`, `CHECK requesterId <> recipientId`

---

## CompanionReport

User-submitted abuse reports against another user, with a moderation workflow.

| Column       | Type          | Constraints                                                               | Description       |
| ------------ | ------------- | ------------------------------------------------------------------------- | ----------------- |
| `id`         | `TEXT`        | `PRIMARY KEY`                                                             | Report UUID       |
| `reporterId` | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                          | Reporting user    |
| `reportedId` | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE`                          | Reported user     |
| `reason`     | `TEXT`        | `NOT NULL CHECK IN ('harassment','inappropriate_content','spam','other')` | Report reason     |
| `details`    | `TEXT`        | nullable (≤1000 chars)                                                    | Free-text details |
| `status`     | `TEXT`        | `NOT NULL DEFAULT 'open' CHECK IN ('open','reviewed','dismissed')`        | Moderation state  |
| `reviewedBy` | `TEXT`        | `REFERENCES User(id) ON DELETE SET NULL`                                  | Reviewing admin   |
| `reviewedAt` | `TIMESTAMPTZ` | nullable                                                                  | Review time       |
| `createdAt`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                  | Row creation time |

**Constraints:** `CHECK reporterId <> reportedId`

---

## CompanionBlock

User-to-user blocks for the Companion feature. Unique per (blocker, blocked) pair, no self-block.

| Column      | Type          | Constraints                                      | Description       |
| ----------- | ------------- | ------------------------------------------------ | ----------------- |
| `id`        | `TEXT`        | `PRIMARY KEY`                                    | Block UUID        |
| `blockerId` | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Blocking user     |
| `blockedId` | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Blocked user      |
| `reason`    | `TEXT`        | nullable                                         | Optional reason   |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Row creation time |

**Constraints:** `UNIQUE(blockerId, blockedId)`, `CHECK blockerId <> blockedId`

---

## ConsentRecord

Immutable research informed-consent audit trail. Append-only per consent event; withdrawal is recorded, not deleted.

| Column            | Type          | Constraints                                      | Description                              |
| ----------------- | ------------- | ------------------------------------------------ | ---------------------------------------- |
| `id`              | `TEXT`        | `PRIMARY KEY`                                    | Consent record UUID                      |
| `userId`          | `TEXT`        | `NOT NULL REFERENCES User(id) ON DELETE CASCADE` | Consenting user                          |
| `consentVersion`  | `TEXT`        | `NOT NULL`                                       | Version of the consent text agreed to    |
| `consentTextHash` | `TEXT`        | `NOT NULL`                                       | Hash of the exact consent text shown     |
| `ipAddress`       | `TEXT`        | nullable                                         | IP at signing (audit)                    |
| `userAgent`       | `TEXT`        | nullable                                         | User agent at signing (audit)            |
| `sessionId`       | `TEXT`        | nullable                                         | Session at signing                       |
| `agreedAt`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                         | Agreement time                           |
| `withdrawnAt`     | `TIMESTAMPTZ` | nullable                                         | Withdrawal time (null = still consented) |

---

## DurableJob

Generic durable background-job queue (worker-locked, retried with backoff).

| Column           | Type          | Constraints                                                                      | Description                          |
| ---------------- | ------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `id`             | `TEXT`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                                          | Job UUID                             |
| `type`           | `TEXT`        | `NOT NULL`                                                                       | Job type discriminator               |
| `payload`        | `JSONB`       | `NOT NULL DEFAULT '{}'`                                                          | Job payload                          |
| `status`         | `TEXT`        | `NOT NULL DEFAULT 'pending' CHECK IN ('pending','running','succeeded','failed')` | Job state                            |
| `priority`       | `INTEGER`     | `NOT NULL DEFAULT 0`                                                             | Higher runs first                    |
| `attempts`       | `INTEGER`     | `NOT NULL DEFAULT 0 CHECK >= 0`                                                  | Attempts made                        |
| `maxAttempts`    | `INTEGER`     | `NOT NULL DEFAULT 5 CHECK > 0`                                                   | Max attempts before terminal fail    |
| `runAt`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Earliest run time (backoff schedule) |
| `lockedBy`       | `TEXT`        | nullable                                                                         | Worker holding the lock              |
| `lockedAt`       | `TIMESTAMPTZ` | nullable                                                                         | Lock acquisition time                |
| `lastError`      | `TEXT`        | nullable                                                                         | Last error message                   |
| `idempotencyKey` | `TEXT`        | nullable                                                                         | Dedup key for at-most-once enqueue   |
| `createdAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Row creation time                    |
| `updatedAt`      | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()`                                                         | Last mutation time                   |
| `completedAt`    | `TIMESTAMPTZ` | nullable                                                                         | Completion time                      |

---

# Part 2 — JSONB Column Schemas

All JSONB columns in the Deep Dive database, with their TypeScript type references and example shapes.

---

## UserProfile.insightsJson

**Table:** `UserProfile`
**Column:** `insightsJson JSONB DEFAULT '[]'`
**Writer:** `POST /api/coaching-summary` (after coaching session ends)
**Reader:** Dashboard page, `/api/coaching-insights`
**TypeScript:** `lib/db/profiles.ts` (stored and read as serialized JSON string; JSONB since migration 007)

Stores an array of coaching insights accumulated over coaching sessions.

| Field    | Type       | Description                                               |
| -------- | ---------- | --------------------------------------------------------- |
| _(root)_ | `string[]` | Array of insight strings extracted from coaching sessions |

**Example:**

```json
[
  "Values autonomy and independence over structured environments",
  "Tension between creative ambitions and financial stability constraints",
  "Strong sense of cross-cultural identity — bridges Eastern and Western work cultures"
]
```

---

## QuestionnaireSession.answersJson

**Table:** `QuestionnaireSession`
**Column:** `answersJson JSONB NOT NULL DEFAULT '[]'`
**Writer:** `/api/questionnaire/answer` (each answer submission)
**Reader:** Scoring pipeline (`runScoringPipelineV3`)
**TypeScript:** `SessionQuestionAnswer[]` — `lib/types/platform.ts`

Array of individual question answers, one entry per question answered.

| Field            | Type          | Description                                              |
| ---------------- | ------------- | -------------------------------------------------------- |
| `questionId`     | `string`      | Unique question identifier (e.g. `"SJT-1"`, `"IPIP-42"`) |
| `value`          | `AnswerValue` | Discriminated union — see sub-types below                |
| `responseTimeMs` | `number`      | Time taken to answer this question in milliseconds       |
| `timestamp`      | `number`      | Unix epoch ms when the answer was submitted              |

**`value` sub-types** (`lib/types/questionnaire.ts`):

| `type`   | Additional Fields                             | Description                                                   |
| -------- | --------------------------------------------- | ------------------------------------------------------------- |
| `"sjt"`  | `wouldChoice: string`, `shouldChoice: string` | Module A: SJT scenario answer (option A–D for each dimension) |
| `"pvq"`  | `rating: number` (1–6)                        | Module B: TwIVI Likert rating                                 |
| `"ipip"` | `rating: number` (1–5)                        | Module C: IPIP-60 Likert rating                               |

**Example:**

```json
[
  {
    "questionId": "SJT-1",
    "value": { "type": "sjt", "wouldChoice": "B", "shouldChoice": "A" },
    "responseTimeMs": 4520,
    "timestamp": 1709078400000
  },
  {
    "questionId": "IPIP-1",
    "value": { "type": "ipip", "rating": 4 },
    "responseTimeMs": 1200,
    "timestamp": 1709078412000
  }
]
```

---

## QuestionnaireSession.explorationProgressJson

**Table:** `QuestionnaireSession`
**Column:** `explorationProgressJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `/api/questionnaire/progress` (Immersive Deep Dive UI)
**Reader:** Immersive Deep Dive UI (zone-based progress tracking)
**TypeScript:** `ZoneTimeline` — `lib/types/questionnaire.ts`

Tracks per-zone timing for the ocean-exploration metaphor UI. Only populated in Immersive mode.

| Field         | Type             | Description                                             |
| ------------- | ---------------- | ------------------------------------------------------- |
| _(key)_       | `string`         | Zone ID (from `ZONE_CONFIG`)                            |
| `startedAt`   | `number \| null` | Epoch ms when user first entered this zone              |
| `completedAt` | `number \| null` | Epoch ms when user completed all questions in this zone |
| `timeSpentMs` | `number`         | Accumulated active time in this zone (pauses excluded)  |
| `discoveries` | `string[]`       | Micro-insight IDs triggered while in this zone          |

**Example:**

```json
{
  "zone_sjt": {
    "startedAt": 1709078400000,
    "completedAt": 1709078520000,
    "timeSpentMs": 118000,
    "discoveries": ["micro_sjt_1_tension"]
  },
  "zone_values": {
    "startedAt": 1709078525000,
    "completedAt": null,
    "timeSpentMs": 45000,
    "discoveries": []
  }
}
```

---

## AssessmentResult.resultJson

**Table:** `AssessmentResult`
**Column:** `resultJson JSONB NOT NULL`
**Writer:** `/api/score` (after questionnaire completion)
**Reader:** Report generation pipeline, coaching system, analytics export
**TypeScript:** `AssessmentResult` (v2.0) | `AssessmentResultV3` (v3.0) — `lib/types/assessment.ts`

Output of the scoring pipeline. The `questionnaireVersion` field distinguishes v2.0 from v3.0.
New assessments use v3.0 only (`runScoringPipelineV3`). The v2.0 scoring pipeline has been removed; v2.0 rows exist as historical data.

### v2.0 Shape (`AssessmentResult`) — historical data only

| Top-level Field               | Type                               | Description                                                                                                       |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`                          | `string`                           | Assessment result UUID                                                                                            |
| `sessionId`                   | `string`                           | Parent QuestionnaireSession ID                                                                                    |
| `timestamp`                   | `string`                           | ISO timestamp of scoring                                                                                          |
| `questionnaireVersion`        | `"2.0"`                            | Pipeline version identifier                                                                                       |
| `bigFive`                     | `object`                           | IPIP-NEO-120 output — Big Five domains + 30 facets                                                                |
| `bigFive.domains`             | `Record<BigFiveDimension, number>` | 5 domain means on 1–5 scale (N, E, O, A, C)                                                                       |
| `bigFive.facets`              | `Record<string, number>`           | 30 facet means on 1–5 scale                                                                                       |
| `bigFive.domainsNormalized`   | `Record<BigFiveDimension, number>` | 0–100 normalized for UI display                                                                                   |
| `schwartz`                    | `object`                           | PVQ-21 output — Schwartz value types                                                                              |
| `schwartz.raw`                | `Record<SchwartzValue, number>`    | Raw means per value type                                                                                          |
| `schwartz.centered`           | `Record<SchwartzValue, number>`    | After ipsative centering                                                                                          |
| `schwartz.ranking`            | `SchwartzValue[]`                  | Values sorted by centered score (highest first)                                                                   |
| `schwartz.top3`               | `SchwartzValue[]`                  | Top 3 value types                                                                                                 |
| `tensions`                    | `object`                           | SJT Should-Would tension analysis                                                                                 |
| `tensions.scenarios`          | `SJTTensionScore[]`                | Per-scenario tension scores (6 items)                                                                             |
| `tensions.overallConsistency` | `number`                           | 0–1, proportion of consistent scenarios                                                                           |
| `tensions.notableTensions`    | `string[]`                         | Domain names with significant should/would gap                                                                    |
| `riasecNormalized`            | `Record<RIASECDimension, number>`  | RIASEC scores inherited from Quick Dive (0–100)                                                                   |
| `archetype`                   | `Archetype`                        | 12-type archetype (RIASEC × Enhancement/Transcendence). Code format: `"R-enhancement"`, `"I-transcendence"`, etc. |
| `cognitiveStyleCode`          | `CognitiveStyleCode \| undefined`  | Derived cognitive style (optional)                                                                                |
| `collabMapping`               | `CollabMapping \| undefined`       | Collaboration Style derived from Big Five (optional)                                                              |
| `meta`                        | `object`                           | Quality metadata                                                                                                  |
| `meta.totalQuestions`         | `number`                           | Total questions (dynamic, typically 147 for v2.0)                                                                 |
| `meta.answeredQuestions`      | `number`                           | Questions actually answered                                                                                       |
| `meta.totalTimeMs`            | `number`                           | Total time spent in milliseconds                                                                                  |
| `meta.rushCount`              | `number`                           | Count of questions answered below rush threshold                                                                  |
| `meta.moduleTimes`            | `{ sjt, pvq, ipip }`               | Time per module in ms                                                                                             |

### v3.0 Additional Fields (`AssessmentResultV3`)

| Field                   | Type                                                      | Description                                                                                            |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `questionnaireVersion`  | `"3.0"`                                                   | v3.0 identifier                                                                                        |
| `bigFive.precision`     | `"screening" \| "standard" \| "full"`                     | `"standard"` for IPIP-60 (v3.0 default), `"full"` for IPIP-120                                         |
| `schwartz.higherOrder`  | `Record<string, number>`                                  | TwIVI higher-order dimensions (openness-to-change, self-enhancement, conservation, self-transcendence) |
| `meta.moduleTimes`      | `{ sjt, ddvq, ipip60 }`                                   | Keys: `ddvq` (TwIVI, key retained for backward compat), `ipip60` (IPIP-60)                             |
| `meta.generationSource` | `'user' \| 'admin-random' \| 'admin-preset' \| undefined` | How this assessment was generated — absent for real user completions                                   |

---

## QuickDiveResult.scoresJson

**Table:** `QuickDiveResult`
**Column:** `scoresJson JSONB NOT NULL`
**Writer:** `/api/quickdive/save`
**Reader:** Deep Dive page (inherits RIASEC), report pages, data export
**TypeScript:** `Record<string, number>` — `lib/db/platform.ts`

Raw RIASEC scores from the Quick Dive 30-question assessment (Mini-IP, 5 items per dimension).

| Field | Type     | Description                           |
| ----- | -------- | ------------------------------------- |
| `R`   | `number` | Realistic dimension score (0–100)     |
| `I`   | `number` | Investigative dimension score (0–100) |
| `A`   | `number` | Artistic dimension score (0–100)      |
| `S`   | `number` | Social dimension score (0–100)        |
| `E`   | `number` | Enterprising dimension score (0–100)  |
| `C`   | `number` | Conventional dimension score (0–100)  |

**Example:**

```json
{ "R": 28, "I": 85, "A": 72, "S": 41, "E": 55, "C": 19 }
```

---

## QuickDiveResult.resultDataJson

**Table:** `QuickDiveResult`
**Column:** `resultDataJson JSONB` (nullable)
**Writer:** `/api/quickdive/save`
**Reader:** Quick report page (`/report/quick/[id]`), dashboard
**TypeScript:** `Record<string, unknown>` — `lib/db/platform.ts`

Full result data snapshot from the Quick Dive explore result page. Shape varies by explore mode (`classic` vs `immersive`), but typically contains:

| Field            | Type                  | Description                                    |
| ---------------- | --------------------- | ---------------------------------------------- |
| `archetypeCode`  | `string`              | Two-letter RIASEC code (e.g. `"IA"`)           |
| `archetypeLabel` | `string`              | Archetype display name                         |
| `sortedScores`   | `[string, number][]`  | RIASEC scores sorted descending                |
| `narrative`      | `string \| undefined` | Generated archetype narrative (immersive mode) |
| `exploreMode`    | `string`              | `"classic"` or `"immersive"`                   |

---

## RealConditions.conditionsJson

**Table:** `RealConditions`
**Column:** `conditionsJson JSONB NOT NULL`
**Writer:** `/api/real-conditions` (Reality Snapshot form)
**Reader:** Career pathway generation (`generateCareerPathway`)
**TypeScript:** `RealConditions` — `lib/types/platform.ts`

The user's real-world constraints and context for career pathway generation.

| Field                                          | Type                               | Description                                                                  |
| ---------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `education.level`                              | `string`                           | `high_school` / `bachelor` / `master` / `phd` / `other`                      |
| `education.field`                              | `string`                           | Field of study                                                               |
| `experienceYears`                              | `number`                           | Years of work experience (0–30)                                              |
| `pastIndustries`                               | `string[]`                         | Previous industry sectors                                                    |
| `currentCountry`                               | `string \| undefined`              | ISO country code (e.g. `"US"`)                                               |
| `currentCity`                                  | `string`                           | Current city of residence                                                    |
| `targetCountry`                                | `string \| undefined`              | Target country for relocation                                                |
| `targetCities`                                 | `string[]`                         | Target cities (may include `"remote"`)                                       |
| `visaStatus`                                   | `string`                           | Visa/residency status enum                                                   |
| `visaType`                                     | `string \| undefined`              | Specific visa type (e.g. `"H1B"`)                                            |
| `workRestrictions.canWorkFullTime`             | `boolean`                          | Full-time work permitted                                                     |
| `workRestrictions.sponsorshipRequired`         | `boolean`                          | Employer visa sponsorship needed                                             |
| `workRestrictions.occupationRestricted`        | `boolean`                          | Limited to specific occupations                                              |
| `workRestrictions.occupationNote`              | `string \| undefined`              | Explanation if restricted (max 80 chars)                                     |
| `workLanguages`                                | `Array<{ language, proficiency }>` | Languages and proficiency levels                                             |
| `locationFlexibility`                          | `string`                           | `stay-local` / `relocate-home` / `relocate-other` / `remote-global` / `open` |
| `relocationTimeline`                           | `string \| undefined`              | `1year` / `2-3years` / `5years` / `indefinite` (if relocating)               |
| `familyConstraints.hasPartner`                 | `boolean`                          | Has partner                                                                  |
| `familyConstraints.partnerWorkRestriction`     | `boolean`                          | Partner has work restrictions                                                |
| `familyConstraints.hasDependents`              | `boolean`                          | Has dependents                                                               |
| `economicConstraints.salaryFloor`              | `string \| undefined`              | `critical` / `important` / `flexible`                                        |
| `economicConstraints.canRelocate`              | `boolean`                          | Willing to relocate                                                          |
| `economicConstraints.willingToRetrain`         | `boolean`                          | Willing to retrain/certify                                                   |
| `salaryRange.min`                              | `number`                           | Minimum salary expectation                                                   |
| `salaryRange.max`                              | `number`                           | Maximum salary expectation                                                   |
| `salaryRange.currency`                         | `string`                           | Currency code (e.g. `"USD"`)                                                 |
| `workType`                                     | `string`                           | `fulltime` / `parttime` / `freelance` / `open`                               |
| `officeMode`                                   | `string`                           | `remote` / `hybrid` / `onsite` / `open`                                      |
| `currentIndustry`                              | `string \| undefined`              | User's current industry (structured, from INDUSTRIES constant)               |
| `industrySatisfaction`                         | `number \| undefined`              | How satisfied with current industry (1-5)                                    |
| `careerChangeUrgency`                          | `string \| undefined`              | `exploring` / `considering` / `urgent`                                       |
| `interestedIndustries`                         | `string[]`                         | Preferred industries (may include `"recommend_for_me"`)                      |
| `openToCareerChange`                           | `string`                           | `yes` / `no` / `open`                                                        |
| `industryBackground`                           | `string \| undefined`              | Free-text industry background                                                |
| `culturalIdentity.externalExpectationPressure` | `string`                           | `high` / `medium` / `low` / `none` (family / social / cultural pressure)     |
| `culturalIdentity.externalExpectationNote`     | `string \| undefined`              | Specific expectation detail (max 80 chars, optional)                         |

---

## CareerReport.reportJson

**Table:** `CareerReport`
**Column:** `reportJson JSONB NOT NULL`
**Writer:** `/api/generate-report`
**Reader:** Report page (`/report/[id]`), coaching system, data export
**TypeScript:** `CareerReport` — `lib/types/report.ts`

The complete career report output from the 2-3 LLM generation pipeline.

| Top-level Field               | Type                              | Description                                                                                           |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                          | `string`                          | Report UUID                                                                                           |
| `assessmentId`                | `string`                          | Parent AssessmentResult ID                                                                            |
| `locale`                      | `"zh" \| "en"`                    | Report language                                                                                       |
| `profileId`                   | `string \| undefined`             | Reference to PersonalProfile this report is based on (v3.0+: profile and report generated separately) |
| `header`                      | `ReportHeader`                    | Identity labels (archetype, cognitive style, collaboration style)                                     |
| `careerAnchors`               | `CareerAnchor[] \| undefined`     | 3 career anchors bridging identity to career (RIASEC, Schwartz, Big Five — pure algorithm)            |
| `careerMatch`                 | `Panel1CareerMatch`               | Career exploration directions (3 primary + 2 exploratory, LLM + algorithm)                            |
| `careerPathway`               | `Panel3Pathway`                   | Career pathway (job directions, gap analysis, action plan)                                            |
| `integration`                 | `IntegrationLayer`                | Cross-panel synthesis (core insight, transitions, letter to user)                                     |
| `careerDrainWarning`          | `CareerDrainWarning \| undefined` | Optional: draining career warning (algorithmic, 0 LLM)                                                |
| `meta.generatedAt`            | `number`                          | Unix epoch ms of generation                                                                           |
| `meta.version`                | `string`                          | Report schema version (`"3.0"`, `"7.0"`, `"6.0"`, etc.)                                               |
| `meta.llmModel`               | `string`                          | Primary LLM model used                                                                                |
| `meta.generationTimeMs`       | `number`                          | Total generation time in ms                                                                           |
| `meta.llmCalls`               | `number`                          | Number of LLM API calls made                                                                          |
| `meta.realConditionsProvided` | `boolean`                         | Whether career pathway used real user conditions                                                      |

See `lib/types/report.ts` for the full nested interface definitions of each panel.

---

## PersonalProfile.profileJson

**Table:** `PersonalProfile`
**Column:** `profileJson JSONB NOT NULL`
**Writer:** `/api/generate-profile`
**Reader:** Profile page, memory generation, data export
**TypeScript:** `PersonalProfileData` — `lib/types/platform.ts`

A normalized assessment profile snapshot used for the personal profile page and cross-session memory.

| Field                         | Type                                                            | Description                                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                          | `string`                                                        | Profile UUID                                                                                                                                                                    |
| `assessmentId`                | `string`                                                        | Parent AssessmentResult ID                                                                                                                                                      |
| `profileSchemaVersion`        | `string \| undefined`                                           | JSON shape contract for profileJson                                                                                                                                             |
| `algorithmVersion`            | `string \| undefined`                                           | Pure-algorithm contract used to derive algoSnapshot + derived cards                                                                                                             |
| `profileInputHash`            | `string \| undefined`                                           | Fingerprint of inputs affecting algorithmic profile insights                                                                                                                    |
| `userId`                      | `string \| undefined`                                           | Owner user ID                                                                                                                                                                   |
| `archetype`                   | `Archetype`                                                     | 12-type archetype (RIASEC × Enhancement/Transcendence). Code format: `"R-enhancement"`, `"I-transcendence"`, etc.                                                               |
| `cognitiveStyleCode`          | `string \| null`                                                | Cognitive style code (4-letter, nullable)                                                                                                                                       |
| `cognitiveStyleDisplayMode`   | `string`                                                        | Display precision mode                                                                                                                                                          |
| `collabMapping`               | `CollabMapping`                                                 | Collaboration Style CSS gradient + labels                                                                                                                                       |
| `schwartzAnchors`             | `SchwartzAnchorsResult`                                         | Top 3 Schwartz values with labels + conflict pair                                                                                                                               |
| `crossCultural.type`          | `CrossCulturalType \| null`                                     | Cross-cultural positioning type                                                                                                                                                 |
| `crossCultural.label_zh`      | `string \| null`                                                | Chinese label for cross-cultural type                                                                                                                                           |
| `riasecScores`                | `Record<RIASECDimension, number> \| undefined`                  | Raw RIASEC scores (0–100)                                                                                                                                                       |
| `confidenceMap`               | `Record<string, number>`                                        | Per-dimension confidence scores (0–1)                                                                                                                                           |
| `bigFiveScores`               | `Record<BigFiveDimension, number> \| undefined`                 | Big Five normalized scores (0–100)                                                                                                                                              |
| `cognitiveStyleDimensions`    | `Record<EI\|SN\|TF\|JP, ...> \| undefined`                      | 4-axis dimensional breakdown                                                                                                                                                    |
| `cognitiveStyleConfidence`    | `number \| undefined`                                           | Cognitive style confidence (0–1, fraction; UI multiplies by 100 for display)                                                                                                    |
| `cognitiveStyleSchemaVersion` | `number \| undefined`                                           | Score-unit schema for cognitiveStyleDimensions (undefined/1 = legacy raw 1–5; 2 = 0–100 normalized). Drives lazy migration                                                      |
| `meaningCompass`              | `MeaningCompass \| undefined`                                   | Pure-algorithm meaning-compass dimension (narrative in `narrativeSnapshots.meaningCompassNarrative`)                                                                            |
| `qualityMeta`                 | `object \| undefined`                                           | Response quality metadata (rush count, times, hesitation count)                                                                                                                 |
| `sjtBehavioralConsistency`    | `object \| undefined`                                           | SJT behavioral consistency index (overallConsistency, notableTensions, scenarioCount)                                                                                           |
| `shadowInsights`              | `ShadowInsights \| undefined`                                   | Jungian shadow framing of Big Five low dimensions (2-3 shadows + overall pattern)                                                                                               |
| `coreQualities`               | `CoreQualityQuadrant[] \| undefined`                            | Ofman Core Qualities quadrants from Big Five facets                                                                                                                             |
| `socialStyle`                 | `SocialStyleResult \| undefined`                                | Social Style (Kramlinger 2x2) from Big Five E×A                                                                                                                                 |
| `leadershipStyle`             | `LeadershipStyleResult \| undefined`                            | Leadership Style (Goleman 6 styles) from Big Five                                                                                                                               |
| `interpersonalEnergy`         | `InterpersonalEnergySpectrum \| undefined`                      | IPC-inspired Agency×Communion spectrum from Big Five facets                                                                                                                     |
| `conflictHandling`            | `ConflictHandlingProfile \| undefined`                          | TKI 5 conflict modes from Big Five facets                                                                                                                                       |
| `narrativeSnapshots`          | `object \| undefined`                                           | LLM-generated narrative interpretations (archetypeNarrative, bigFiveNarrative, sjtTensionNarrative, valueNarrative, crossDimensionNarrative, identitySummary, growthMapInsight) |
| `algoSnapshot`                | `Omit<ProfileAlgorithmOutput, 'archetypeContent'> \| undefined` | Cached profile algorithm output for report pipeline reuse                                                                                                                       |
| `version`                     | `string`                                                        | Profile schema version                                                                                                                                                          |
| `createdAt`                   | `string`                                                        | ISO timestamp                                                                                                                                                                   |
| `updatedAt`                   | `string`                                                        | ISO timestamp                                                                                                                                                                   |

---

## CoachingSession.messagesJson

**Table:** `CoachingSession`
**Column:** `messagesJson JSONB DEFAULT '[]'`
**Writer:** `/api/coaching-chat` (each coaching turn)
**Reader:** Coaching chat UI, coaching summary generation
**TypeScript:** `CoachingMessage[]` — `lib/types/platform.ts`

Full conversation history for a coaching session.

| Field     | Type                        | Description                                                   |
| --------- | --------------------------- | ------------------------------------------------------------- |
| `role`    | `"user" \| "assistant"`     | Message sender                                                |
| `content` | `string`                    | Clean message text without machine-readable UI markers        |
| `kind`    | `"message" \| "correction"` | Optional interaction-only marker for user correction messages |

**Example:**

```json
[
  {
    "role": "assistant",
    "content": "Hi! I've reviewed your career report. What aspect would you like to explore first?"
  },
  {
    "role": "user",
    "content": "I'm curious about the tension between my IA profile and my current finance role."
  }
]
```

---

## CoachingSession.stateJson

**Table:** `CoachingSession`
**Column:** `stateJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `/api/coaching-chat`
**Reader:** Coaching chat routing and resume flow
**TypeScript:** `CoachingSessionState` — `lib/coaching/conversation-router.ts`

| Field                 | Type                                  | Description                                  |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| `mode`                | `CoachingMode`                        | Current adaptive mode                        |
| `strategyVersion`     | `"legacy" \| "shadow" \| "v2"`        | Applied rollout variant                      |
| `userGoal`            | `string \| null`                      | First durable goal captured in the session   |
| `currentFocus`        | `string \| null`                      | Latest core question                         |
| `previousFocus`       | `string \| null`                      | Prior focus used for conversation repair     |
| `unresolvedQuestions` | `string[]`                            | Recent unanswered or active questions        |
| `constraintsUsed`     | `string[]`                            | Reality constraints recognized across turns  |
| `pendingArtifact`     | `"decision" \| "action_plan" \| null` | Expected decision or draft artifact          |
| `correctionCount`     | `number`                              | Consecutive correction count                 |
| `updatedAt`           | `string`                              | ISO timestamp of the latest routing decision |

Correction messages remain in `messagesJson` for immediate conversation context but are excluded from theme and long-term memory extraction.

---

## UserMemory.metadata

**Table:** `UserMemory`
**Column:** `metadata JSONB DEFAULT '{}'`
**Writer:** Memory generation pipeline (`lib/memory/`)
**Reader:** Coaching system prompt builder
**TypeScript:** `Record<string, unknown>` — `lib/types/memory.ts`

Arbitrary metadata associated with a memory entry. Schema is open-ended; typical fields include chain information for synthesized memories.

| Field               | Type                    | Description                                                                |
| ------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `chainType`         | `string \| undefined`   | Memory synthesis chain type (e.g. `"strength_chain"`, `"blindspot_chain"`) |
| `sourceFrameworks`  | `string[] \| undefined` | Frameworks used in synthesis (e.g. `["bigFive", "schwartz"]`)              |
| `conflictingValues` | `string[] \| undefined` | Schwartz values in tension for conflict-type memories                      |

**Example:**

```json
{
  "chainType": "strength_chain",
  "sourceFrameworks": ["bigFive", "riasec"],
  "relatedDimensions": ["openness", "investigative"]
}
```

---

## PrePostAssessment.sccResponses

**Table:** `PrePostAssessment`
**Column:** `sccResponses JSONB NOT NULL`
**Writer:** `/api/pre-post-assessment` (research pre/post measurement)
**Reader:** Research data export
**TypeScript:** `SCCResponses` — `lib/cdse/scc-questions.ts`

Self-Concept Clarity Scale — 12 items on a 1–5 Likert scale. Keys are question IDs (`scc1`–`scc12`). Raw responses before reverse-scoring.

| Field          | Type           | Description                           |
| -------------- | -------------- | ------------------------------------- |
| `scc1`–`scc12` | `number` (1–5) | Raw Likert response for each SCC item |

**Example:**

```json
{
  "scc1": 2,
  "scc2": 3,
  "scc3": 4,
  "scc4": 3,
  "scc5": 2,
  "scc6": 4,
  "scc7": 3,
  "scc8": 5,
  "scc9": 4,
  "scc10": 3,
  "scc11": 4,
  "scc12": 2
}
```

---

## PrePostAssessment.cdseResponses

**Table:** `PrePostAssessment`
**Column:** `cdseResponses JSONB NOT NULL`
**Writer:** `/api/pre-post-assessment` (research pre/post measurement)
**Reader:** Research data export
**TypeScript:** `CDSEScores` — `lib/cdse/scc-questions.ts`

Career Decision Self-Efficacy scores embedded in the combined pre/post assessment. 5 items on a 1–5 Likert scale (q1–q5).

**Example:**

```json
{ "q1": 3, "q2": 4, "q3": 4, "q4": 2, "q5": 3 }
```

---

## PrePostAssessment.experienceFeedback

**Table:** `PrePostAssessment`
**Column:** `experienceFeedback JSONB` (nullable)
**Writer:** `/api/pre-post-assessment` (post-assessment only — `post_immediate` or `post_1week`)
**Reader:** Research data export
**TypeScript:** `ExperienceFeedback` — `lib/types/platform.ts`

Optional post-experience qualitative feedback. Collected on post-assessment time points only.
The `assessmentType` column now accepts `'pre'`, `'post_immediate'`, and `'post_1week'`
(migrated from the previous `'post'` value via migration 010).

### Q1: Trust & Psychological Safety (3 items, 1–5 Likert)

| Field                       | Type                  | Description                                |
| --------------------------- | --------------------- | ------------------------------------------ |
| `trust_willing_to_disclose` | `number \| undefined` | "我愿意向 AI 教练透露真实的职业顾虑" (1–5) |
| `trust_felt_understood`     | `number \| undefined` | "在对话中我感到被理解而非被评判" (1–5)     |
| `trust_comfortable_sharing` | `number \| undefined` | "我愿意在平台上分享个人职业信息" (1–5)     |

### Q2: Real-World Constraints Confidence (2 items, 1–5 Likert)

| Field                               | Type                  | Description                                            |
| ----------------------------------- | --------------------- | ------------------------------------------------------ |
| `constraints_adequately_considered` | `number \| undefined` | "报告充分考虑了我的现实约束（签证/家庭/财务等）" (1–5) |
| `constraints_increased_confidence`  | `number \| undefined` | "考虑现实条件后，我对推荐方向更有信心" (1–5)           |

### Q3: Feature Attribution (multi-select + ranking)

| Field                    | Type                    | Description                                                                              |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------- |
| `most_valuable_features` | `string[] \| undefined` | Multi-select from: `quick_dive`, `profile`, `deep_dive_report`, `ai_coach`, `action_hub` |
| `feature_ranking`        | `string[] \| undefined` | Selected features ordered by perceived importance (first = most important)               |

Historical note: some pre-ranking records may still contain deprecated per-feature contribution Likert keys in stored JSON, but those keys are no longer part of the current API schema, TypeScript model, or survey UI.

### UES-SF-8: User Engagement Scale (8 items, 1-5 Likert)

| Field       | Type                  | Description                            |
| ----------- | --------------------- | -------------------------------------- |
| `ux1`–`ux8` | `number \| undefined` | UES-SF-8 items (ux4 is reverse-scored) |

### Legacy / General Fields

| Field        | Type                  | Description                             |
| ------------ | --------------------- | --------------------------------------- |
| `clarity`    | `number \| undefined` | Self-reported clarity improvement (1–5) |
| `usefulness` | `number \| undefined` | Perceived usefulness of the tool (1–5)  |
| `comments`   | `string \| undefined` | Open-ended feedback text                |

**Example:**

```json
{
  "trust_willing_to_disclose": 4,
  "trust_felt_understood": 5,
  "trust_comfortable_sharing": 4,
  "constraints_adequately_considered": 3,
  "constraints_increased_confidence": 4,
  "most_valuable_features": ["ai_coach", "deep_dive_report"],
  "feature_ranking": ["deep_dive_report", "ai_coach"],
  "clarity": 4,
  "usefulness": 5,
  "comments": "The Deep Dive report gave me language for patterns I had noticed but never named."
}
```

---

## UserFunnel.metadata

**Table:** `UserFunnel`
**Column:** `metadata JSONB DEFAULT '{}'`
**Writer:** `lib/analytics/funnel.ts` (`trackFunnelEvent`)
**Reader:** Admin analytics dashboard
**TypeScript:** `Record<string, unknown>` — `lib/analytics/funnel.ts`

Event-specific metadata. Shape varies by `event` type. Common fields:

| Field           | Type                  | Description                                                     |
| --------------- | --------------------- | --------------------------------------------------------------- |
| `locale`        | `string \| undefined` | User locale at time of event (e.g. `"zh"`, `"en"`)              |
| `mode`          | `string \| undefined` | Explore mode for quickdive events (`"classic"` / `"immersive"`) |
| `archetypeCode` | `string \| undefined` | Archetype at time of `quickdive_completed`                      |
| `reportId`      | `string \| undefined` | Report ID for report-related events                             |
| `sessionId`     | `string \| undefined` | Session ID for deepdive/coaching events                         |

**Example (`quickdive_completed`):**

```json
{
  "locale": "zh",
  "mode": "immersive",
  "archetypeCode": "IA"
}
```

---

## ReportEngagement.panelTimes

**Table:** `ReportEngagement`
**Column:** `panelTimes JSONB NOT NULL DEFAULT '{}'`
**Writer:** `sendBeacon /api/analytics/report-engagement` (CSRF-exempt)
**Reader:** Admin thesis export, analytics dashboard
**TypeScript:** `PanelTimes` — `lib/db/report-engagement.ts`

Dwell time spent in each report panel, in milliseconds.

| Field         | Type                  | Description                                                |
| ------------- | --------------------- | ---------------------------------------------------------- |
| `panel1`      | `number \| undefined` | Milliseconds spent in Career Match section (legacy DB key) |
| `panel2`      | `number \| undefined` | Milliseconds spent in Profile section (legacy DB key)      |
| `panel3`      | `number \| undefined` | Milliseconds spent in Pathway section (legacy DB key)      |
| `integration` | `number \| undefined` | Milliseconds spent in the Integration layer                |

**Example:**

```json
{ "panel1": 45200, "panel2": 92800, "panel3": 31400, "integration": 18900 }
```

---

## ReportEngagement.scrollbacks

**Table:** `ReportEngagement`
**Column:** `scrollbacks JSONB NOT NULL DEFAULT '[]'`
**Writer:** `sendBeacon /api/analytics/report-engagement` (CSRF-exempt)
**Reader:** Admin thesis export
**TypeScript:** `ScrollbackEvent[]` — `lib/db/report-engagement.ts`

Array of scroll-back events — recorded when the user scrolls back up to re-read a section.

| Field  | Type     | Description                                                |
| ------ | -------- | ---------------------------------------------------------- |
| `from` | `string` | Section ID the user scrolled back from                     |
| `to`   | `string` | Section ID the user scrolled back to                       |
| `atMs` | `number` | Milliseconds into the session when the scrollback occurred |

**Example:**

```json
[
  { "from": "panel2", "to": "panel1", "atMs": 85400 },
  { "from": "panel3", "to": "panel2", "atMs": 142000 }
]
```

---

## NotableVisitor.summary

**Table:** `NotableVisitor`
**Column:** `summary JSONB` (nullable)
**Writer:** `lib/db/analytics-visits.ts` (`upsertNotableVisitor`)
**Reader:** Admin analytics dashboard
**TypeScript:** `NotableVisitor['summary']` — `lib/db/analytics-visits.ts`

Aggregated visit summary for a high-value visitor, auto-populated by the notable detection algorithm.

| Field         | Type             | Description                           |
| ------------- | ---------------- | ------------------------------------- |
| `pageCount`   | `number`         | Total pages visited                   |
| `deepestPage` | `string \| null` | Deepest page path reached             |
| `country`     | `string \| null` | Visitor's country                     |
| `city`        | `string \| null` | Visitor's city                        |
| `deviceType`  | `string \| null` | `"mobile"` / `"desktop"` / `"tablet"` |
| `userAgent`   | `string \| null` | Raw user-agent string                 |
| `firstSeen`   | `string`         | ISO timestamp of first visit          |
| `lastSeen`    | `string`         | ISO timestamp of most recent visit    |

**Example:**

```json
{
  "pageCount": 12,
  "deepestPage": "/en/report/abc123",
  "country": "SG",
  "city": "Singapore",
  "deviceType": "desktop",
  "userAgent": "Mozilla/5.0 ...",
  "firstSeen": "2026-02-25T09:12:00Z",
  "lastSeen": "2026-02-25T09:47:00Z"
}
```

---

## JourneyTransitionLog.metadata

**Table:** `JourneyTransitionLog`
**Column:** `metadata JSONB DEFAULT '{}'`
**Writer:** `lib/db/journey.ts` (`transitionJourney`, `adminSkipJourney`)
**Reader:** Admin audit trail, debugging
**TypeScript:** `Record<string, unknown>` — `lib/db/journey.ts`
**Migration:** 040

Audit trail entry for a journey state transition. One row is logged for every successful state change on `User.journeyState`. The `metadata` column carries optional context about why/how the transition occurred.

| Field          | Type                      | Description                              |
| -------------- | ------------------------- | ---------------------------------------- |
| _(open-ended)_ | `Record<string, unknown>` | Arbitrary context supplied by the caller |

**Parent row scalar columns** (non-JSONB, for reference):

| Column        | Type          | Description                                                     |
| ------------- | ------------- | --------------------------------------------------------------- |
| `id`          | `SERIAL`      | Auto-increment primary key                                      |
| `userId`      | `TEXT`        | FK → `User.id`                                                  |
| `fromState`   | `TEXT`        | Previous journey state (e.g. `"not_started"`)                   |
| `toState`     | `TEXT`        | New journey state (e.g. `"quick_dive_complete"`)                |
| `event`       | `TEXT`        | Triggering event (e.g. `"COMPLETE_QUICK_DIVE"`, `"ADMIN_SKIP"`) |
| `triggeredBy` | `TEXT`        | `"system"` / `"admin"` / `"user"`                               |
| `createdAt`   | `TIMESTAMPTZ` | Timestamp of the transition                                     |

**Valid journey states** (enforced by CHECK constraint on `User.journeyState`):
`not_started` → `quick_dive_complete` → `deep_dive_complete` → `profile_generated` → `report_generated` → `coaching_unlocked`

**Example:**

```json
{
  "reason": "Auto-fill test user",
  "adminEmail": "admin@deepdive.com"
}
```

---

## UserContext.contextJson

**Table:** `UserContext`
**Column:** `contextJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `lib/db/user-context.ts` (`recomputeUserContext`) — called after Quick Dive save, report generation, profile generation, coaching session end
**Reader:** Dashboard, navigation guards, any page needing user state (1 query replaces 7+)
**TypeScript:** `UserContextData` — `lib/db/user-context.ts`
**Migration:** 037

Precomputed user context snapshot (1:1 with `User`). Write-time aggregation — recomputed after every data mutation. Eliminates N+1 queries on page load.

| Field                      | Type                                 | Description                                                                           |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `userLevel`                | `0 \| 1 \| 2 \| 3`                   | Derived from `journeyState`: 0=new, 1=quickDiveOnly, 2=profileGenerated+, 3=powerUser |
| `hasQuickDive`             | `boolean`                            | User has completed Quick Dive                                                         |
| `hasDeepReport`            | `boolean`                            | User has at least one deep report                                                     |
| `deepDiveInProgress`       | `boolean`                            | Deep Dive session started but not scored                                              |
| `quickDive`                | `object \| null`                     | Snapshot of latest Quick Dive result                                                  |
| `quickDive.archetypeCode`  | `string`                             | Two-letter RIASEC code (e.g. `"IA"`)                                                  |
| `quickDive.archetypeLabel` | `string`                             | Archetype display name                                                                |
| `quickDive.scoresJson`     | `Record<string, number>`             | RIASEC scores (0–100)                                                                 |
| `latestReportId`           | `string \| null`                     | Most recent CareerReport ID                                                           |
| `reports`                  | `Array<object>`                      | All reports (lightweight: id, createdAt, reportType, exploreMode)                     |
| `profile`                  | `object \| null`                     | Snapshot of personal profile                                                          |
| `profile.archetypeCode`    | `string \| null`                     | Archetype code                                                                        |
| `profile.archetypeLabelEn` | `string \| null`                     | English archetype label                                                               |
| `profile.archetypeLabelZh` | `string \| null`                     | Chinese archetype label                                                               |
| `profile.coreInsight`      | `string \| null`                     | Core narrative insight                                                                |
| `profile.riasecScores`     | `Record<string, number> \| null`     | RIASEC scores (0–100)                                                                 |
| `coachingCount`            | `number`                             | Total coaching sessions                                                               |
| `depth.depthM`             | `number`                             | Exploration depth in meters                                                           |
| `depth.completionPercent`  | `number`                             | Overall completion percentage                                                         |
| `depth.zoneNameEn`         | `string`                             | English name of current depth zone                                                    |
| `depth.zoneNameZh`         | `string`                             | Chinese name of current depth zone                                                    |
| `insights`                 | `Array<{ insight?, discoveredAt? }>` | Coaching insights from profile                                                        |
| `updatedAt`                | `string`                             | ISO timestamp of last recompute                                                       |

**Example:**

```json
{
  "userLevel": 2,
  "hasQuickDive": true,
  "hasDeepReport": true,
  "deepDiveInProgress": false,
  "quickDive": {
    "archetypeCode": "IA",
    "archetypeLabel": "The Analytical Visionary",
    "scoresJson": { "R": 28, "I": 85, "A": 72, "S": 41, "E": 55, "C": 19 }
  },
  "latestReportId": "rpt_abc123",
  "reports": [
    {
      "id": "rpt_abc123",
      "createdAt": "2026-03-10T08:00:00Z",
      "reportType": "deep"
    }
  ],
  "profile": {
    "archetypeCode": "I-enhancement",
    "archetypeLabelEn": "Tactician",
    "archetypeLabelZh": "战略家",
    "coreInsight": "Your investigative drive...",
    "riasecScores": { "R": 28, "I": 85, "A": 72, "S": 41, "E": 55, "C": 19 }
  },
  "coachingCount": 3,
  "depth": {
    "depthM": 420,
    "completionPercent": 78,
    "zoneNameEn": "Twilight Zone",
    "zoneNameZh": "暮光区"
  },
  "insights": [
    {
      "insight": "Values autonomy over structured environments",
      "discoveredAt": "2026-03-08"
    }
  ],
  "updatedAt": "2026-03-14T12:30:00Z"
}
```

---

## PersonalProfile.exercisesJson

**Table:** `PersonalProfile`
**Column:** `exercisesJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `lib/db/profiles.ts` (`saveExercise`) — merge-writes via `jsonb_set`
**Reader:** Profile enhancement UI, coaching system
**TypeScript:** `ExercisesJson` — `lib/db/profiles.ts`
**Migration:** 034

Structured exercise results for profile enhancement v2. Each exercise is stored under its own key; new exercises are merged in without overwriting existing ones.

| Field                               | Type                       | Description                            |
| ----------------------------------- | -------------------------- | -------------------------------------- |
| `nonNegotiables`                    | `object \| undefined`      | Non-Negotiables exercise result        |
| `nonNegotiables.selected`           | `[string, string, string]` | Exactly 3 chosen non-negotiable values |
| `nonNegotiables.completedAt`        | `string`                   | ISO timestamp of completion            |
| `flowMoments`                       | `object \| undefined`      | Flow Moments exercise result           |
| `flowMoments.moments`               | `Array<object>`            | Array of flow moment entries           |
| `flowMoments.moments[].description` | `string`                   | Description of the flow experience     |
| `flowMoments.moments[].activity`    | `string`                   | What the user was doing                |
| `flowMoments.moments[].social`      | `string`                   | Social context (alone, team, etc.)     |
| `flowMoments.moments[].environment` | `string`                   | Physical/digital environment           |
| `flowMoments.completedAt`           | `string`                   | ISO timestamp of completion            |
| `energyLog`                         | `object \| undefined`      | Energy Log exercise result             |
| `energyLog.entries`                 | `Array<object>`            | Daily energy log entries               |
| `energyLog.entries[].day`           | `number`                   | Day number (1-based)                   |
| `energyLog.entries[].energizer`     | `string`                   | What gave energy that day              |
| `energyLog.entries[].drain`         | `string`                   | What drained energy that day           |
| `energyLog.entries[].overallEnergy` | `number`                   | Self-rated energy level                |
| `energyLog.entries[].date`          | `string`                   | ISO date string                        |
| `energyLog.completedAt`             | `string \| null`           | ISO timestamp, null if in progress     |
| `energyLog.startedAt`               | `string`                   | ISO timestamp when logging began       |

**Example:**

```json
{
  "nonNegotiables": {
    "selected": ["remote_work", "min_salary", "meaningful_work"],
    "completedAt": "2026-03-11T10:00:00Z"
  },
  "flowMoments": {
    "moments": [
      {
        "description": "Lost track of time building a data pipeline",
        "activity": "coding",
        "social": "alone",
        "environment": "home office"
      }
    ],
    "completedAt": "2026-03-12T14:30:00Z"
  }
}
```

---

## CareerReport.inputHash

**Table:** `CareerReport`
**Column:** `inputHash TEXT` (nullable)
**Writer:** `/api/generate-report` (via `lib/report/prerequisites.ts` → `computeInputHash`)
**Reader:** Report staleness detection (`isReportStale`, `checkReportFreshness`)
**TypeScript:** `string | null` — `lib/db/reports.ts`
**Migration:** 042

Truncated SHA-256 hash (16 hex chars) of the report's input data at generation time. Computed from `assessmentId` + `realConditions`. When reality conditions change after report generation, the hash mismatch signals the report is stale and should be refreshed.

| Value                | Meaning                                                        |
| -------------------- | -------------------------------------------------------------- |
| `null`               | Report generated before staleness detection was added (legacy) |
| `"a3f2b1c9e7d04f68"` | 16-char hex hash of `{ assessmentId, realConditions }`         |

**Staleness logic** (`lib/report/prerequisites.ts`):

- `'fresh'` — stored hash matches current `computeInputHash()`
- `'stale'` — stored hash differs (inputs changed since generation)
- `'missing'` — stored hash is null (legacy report, cannot determine)

---

## LLMUsageLog.environment

**Table:** `LLMUsageLog`
**Column:** `environment VARCHAR(20) NOT NULL DEFAULT 'production'`
**Writer:** `lib/ai/model-router.ts` (every LLM call)
**Reader:** Admin cost dashboard, analytics queries (filter out test calls)
**TypeScript:** `string`
**Migration:** 041

Distinguishes test/development LLM calls from production calls, enabling accurate cost reporting and usage analytics. Indexed alongside `createdAt` for efficient filtered queries.

| Value           | Meaning                                |
| --------------- | -------------------------------------- |
| `'production'`  | Real user-facing LLM call (default)    |
| `'development'` | Development/local environment call     |
| `'test'`        | Automated test or admin auto-fill call |

---

## ActionPlan.contextJson

**Table:** `ActionPlan`
**Column:** `contextJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `/api/action-hub/generate` (plan generation from report)
**Reader:** Action Hub UI, coaching system
**TypeScript:** `Record<string, unknown>` — `lib/db/action-hub.ts`

Open-ended context data associated with the action plan. Stores generation parameters and report-derived context.

| Field          | Type                      | Description                                 |
| -------------- | ------------------------- | ------------------------------------------- |
| _(open-ended)_ | `Record<string, unknown>` | Arbitrary context supplied at plan creation |

**Example:**

```json
{
  "reportVersion": "7.0",
  "archetypeCode": "I-enhancement",
  "topCareerDirections": ["data-scientist", "ux-researcher"]
}
```

---

## AdminAnswerPreset.quickDiveAnswers / deepDiveAnswers

**Table:** `AdminAnswerPreset`
**Columns:** `quickDiveAnswers JSONB` (nullable), `deepDiveAnswers JSONB` (nullable)
**Writer:** `/api/admin/presets` (admin saves their real answers)
**Reader:** Admin auto-fill system (reproducible test generation)
**TypeScript:** `Record<string, unknown> | null` — `lib/db/admin-presets.ts`

Snapshots of admin's real questionnaire answers stored as reusable templates. The `quickDiveAnswers` column stores Quick Dive (30-question RIASEC) answers; `deepDiveAnswers` stores Deep Dive (86-question) answers. Both follow the same answer format as `QuestionnaireSession.answersJson` but are keyed by question ID for direct lookup.

| Field     | Type          | Description                                              |
| --------- | ------------- | -------------------------------------------------------- |
| _(key)_   | `string`      | Question ID (e.g. `"QD-1"`, `"SJT-1"`, `"IPIP-42"`)      |
| _(value)_ | `AnswerValue` | Answer value (same discriminated union as `answersJson`) |

**Example (`quickDiveAnswers`):**

```json
{
  "QD-1": { "type": "quickdive", "rating": 4 },
  "QD-2": { "type": "quickdive", "rating": 2 }
}
```

---

## AnalyticsError.context

**Table:** `AnalyticsError`
**Column:** `context JSONB` (nullable)
**Writer:** `lib/analytics/errors.ts` (`logAnalyticsError`)
**Reader:** Admin debugging, error investigation
**TypeScript:** `Record<string, unknown> | undefined` — `lib/analytics/errors.ts`

Arbitrary error context provided by the caller. Shape varies by analytics layer and error type.

| Field          | Type                      | Description                                            |
| -------------- | ------------------------- | ------------------------------------------------------ |
| _(open-ended)_ | `Record<string, unknown>` | Arbitrary context from the failing analytics operation |

**Example:**

```json
{
  "userId": "usr_abc123",
  "event": "quickdive_completed",
  "attemptedAt": "2026-03-15T10:30:00Z"
}
```

---

## CareerDirection.idealRiasec

**Table:** `CareerDirection`
**Column:** `idealRiasec JSONB NOT NULL`
**Writer:** Admin career library management, seed scripts
**Reader:** Career matching engine (`lib/career-matching/`)
**TypeScript:** `{ R: number; I: number; A: number; S: number; E: number; C: number }` — `lib/db/career-directions.ts`

Ideal RIASEC profile for this career direction. Scores are on a 0-100 scale. Used for cosine similarity matching against user RIASEC scores.

| Field | Type     | Description                     |
| ----- | -------- | ------------------------------- |
| `R`   | `number` | Realistic dimension (0–100)     |
| `I`   | `number` | Investigative dimension (0–100) |
| `A`   | `number` | Artistic dimension (0–100)      |
| `S`   | `number` | Social dimension (0–100)        |
| `E`   | `number` | Enterprising dimension (0–100)  |
| `C`   | `number` | Conventional dimension (0–100)  |

**Example:**

```json
{ "R": 20, "I": 90, "A": 65, "S": 30, "E": 40, "C": 25 }
```

---

## CareerDirection.idealBigFive

**Table:** `CareerDirection`
**Column:** `idealBigFive JSONB DEFAULT '{}'`
**Writer:** Admin career library management, seed scripts
**Reader:** Career matching engine (`lib/career-matching/factors/big-five.ts`)
**TypeScript:** `Record<string, { min: number; max: number }>` — `lib/db/career-directions.ts`

Ideal Big Five personality ranges for this career direction. Each dimension specifies a min-max range on a 0-100 scale. Missing dimensions are treated as "any range acceptable."

| Field   | Type     | Description                                                                                          |
| ------- | -------- | ---------------------------------------------------------------------------------------------------- |
| _(key)_ | `string` | Big Five dimension (`openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`) |
| `min`   | `number` | Lower bound of ideal range (0–100)                                                                   |
| `max`   | `number` | Upper bound of ideal range (0–100)                                                                   |

**Example:**

```json
{
  "openness": { "min": 60, "max": 100 },
  "conscientiousness": { "min": 50, "max": 90 },
  "extraversion": { "min": 30, "max": 70 }
}
```

---

## CareerDirection.titleLocales

**Table:** `CareerDirection`
**Column:** `titleLocales JSONB NOT NULL DEFAULT '{}'`
**Writer:** Admin career library management
**Reader:** Career direction display (multi-locale support)
**TypeScript:** `Record<string, string>` — `lib/db/career-directions.ts`

Additional locale translations for the career direction title beyond the primary `titleEn` and `titleZh` columns.

| Field     | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| _(key)_   | `string` | Locale code (e.g. `"ja"`, `"ko"`, `"de"`) |
| _(value)_ | `string` | Translated title in that locale           |

**Example:**

```json
{
  "ja": "データサイエンティスト",
  "ko": "데이터 과학자",
  "de": "Datenwissenschaftler"
}
```

---

## CareerDirection.marketOutlook

**Table:** `CareerDirection`
**Column:** `marketOutlook JSONB` (nullable)
**Writer:** Admin career library management, data enrichment scripts
**Reader:** Report generation, career direction display
**TypeScript:** `{ trend: string; label_zh: string; label_en: string; note_zh?: string; note_en?: string; source: string; lastUpdated: string } | null` — `lib/db/career-directions.ts`

Market outlook data for the career direction. Contains trend classification and bilingual labels.

| Field         | Type                  | Description                                                   |
| ------------- | --------------------- | ------------------------------------------------------------- |
| `trend`       | `string`              | Trend direction (e.g. `"growing"`, `"stable"`, `"declining"`) |
| `label_zh`    | `string`              | Chinese label for the outlook                                 |
| `label_en`    | `string`              | English label for the outlook                                 |
| `note_zh`     | `string \| undefined` | Chinese explanatory note                                      |
| `note_en`     | `string \| undefined` | English explanatory note                                      |
| `source`      | `string`              | Data source (e.g. `"BLS"`, `"expert-estimate"`)               |
| `lastUpdated` | `string`              | ISO date of last data update                                  |

**Example:**

```json
{
  "trend": "growing",
  "label_zh": "高速增长",
  "label_en": "Fast Growing",
  "note_en": "Driven by AI adoption across industries",
  "source": "BLS",
  "lastUpdated": "2025-12-01"
}
```

---

## InviteCode.claimedByUserIds

**Table:** `InviteCode`
**Column:** `claimedByUserIds JSONB NOT NULL DEFAULT '[]'`
**Writer:** `lib/db/invite-codes.ts` (`claimInviteCode`)
**Reader:** Admin invite code management dashboard
**TypeScript:** `string[]` — `lib/db/invite-codes.ts`

Array of user IDs who have claimed this invite code. Appended to via `jsonb_concat` on each claim.

| Field    | Type       | Description                             |
| -------- | ---------- | --------------------------------------- |
| _(root)_ | `string[]` | Array of User IDs who claimed this code |

**Example:**

```json
["usr_abc123", "usr_def456"]
```

---

## UserAchievement.metadata

**Table:** `UserAchievement`
**Column:** `metadata JSONB DEFAULT '{}'`
**Writer:** `lib/db/achievements.ts` (`insertAchievement`)
**Reader:** Achievement display UI, analytics
**TypeScript:** `Record<string, unknown>` — `lib/types/achievement.ts`

Context metadata captured at the moment an achievement is unlocked. Shape varies by achievement type.

| Field          | Type                      | Description                                 |
| -------------- | ------------------------- | ------------------------------------------- |
| _(open-ended)_ | `Record<string, unknown>` | Arbitrary context from the triggering event |

**Example (depth-related achievement):**

```json
{
  "depthM": 420,
  "triggeredBy": "depth_updated",
  "achievementRarity": "uncommon"
}
```

---

## UserExplorationProgress.modulesJson

**Table:** `UserExplorationProgress`
**Column:** `modulesJson JSONB NOT NULL DEFAULT '{}'`
**Writer:** `lib/db/exploration-progress.ts` (recalculated from source tables)
**Reader:** Depth gauge UI, dashboard, exploration progress display
**TypeScript:** `Record<string, string | null>` — `lib/db/exploration-progress.ts`

Map of completed module keys to their completion timestamps. The `depthM` column is always recalculated from this map on every write.

**Main-path modules:** `quickDive`, `deepDive`, `profile`, `report`, `actionHub`, `coaching`
**Side quest modules:** `immersive`, `realityCheck`

| Field     | Type             | Description                                                   |
| --------- | ---------------- | ------------------------------------------------------------- |
| _(key)_   | `string`         | Module or side-quest key                                      |
| _(value)_ | `string \| null` | ISO-8601 completion timestamp, or `null` if not yet completed |

**Example:**

```json
{
  "quickDive": "2026-03-01T10:00:00Z",
  "deepDive": "2026-03-05T14:30:00Z",
  "profile": "2026-03-05T14:32:00Z",
  "report": null,
  "immersive": "2026-03-02T08:00:00Z"
}
```
