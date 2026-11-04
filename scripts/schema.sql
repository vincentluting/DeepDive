-- ============================================================
-- Deep Dive — Canonical Database Schema (Single Source of Truth)
-- Neon PostgreSQL
--
-- THIS IS THE ONLY AUTHORITATIVE SCHEMA DEFINITION.
-- All table creation (initTables(), migration scripts) must
-- stay in sync with this file.
--
-- Usage: Run in Neon SQL Editor to create all tables from scratch.
-- All statements are idempotent (IF NOT EXISTS).
--
-- Supersedes: all ensureTable() lazy-init patterns in lib/
--
-- Changes from previous canonical schema:
--   - Removed FollowUpSchedule (unused feature)
--   - Removed all DEPRECATED comment blocks
--   - Added ReportEngagement table (was lazy-init only)
--   - Added CoachingFeedback table (was lazy-init only)
--   - Added NotableVisitor table (was lazy-init only)
--   - Fixed CoachingSession.messagesJson: TEXT → JSONB
--   - Fixed QuestionnaireSession.currentModule default: 'SPARK' → 'A'
--   - All FK constraints included
--   - All indexes included
-- ============================================================


-- ============================================================
-- 1. Base tables (no foreign key dependencies)
-- ============================================================

-- User — registered platform users
CREATE TABLE IF NOT EXISTS "User" (
  "id"                      TEXT PRIMARY KEY,
  "email"                   TEXT UNIQUE NOT NULL,
  "passwordHash"            TEXT,
  "name"                    TEXT,
  "isAdmin"                 BOOLEAN NOT NULL DEFAULT FALSE,
  "careerStage"             TEXT,
  "registrationIp"          TEXT,
  "registrationCountry"     TEXT,
  -- RESEARCH ONLY: the next 3 columns are dropped post-thesis.
  -- See docs/architecture/research-lifecycle.md for decommission plan.
  "researchGroup"           TEXT CHECK ("researchGroup" IN ('classic', 'immersive')), -- RESEARCH ONLY
  "researchParticipantId"   TEXT, -- RESEARCH ONLY
  "researchConsentAt"       TIMESTAMPTZ, -- RESEARCH ONLY
  "cohort"                  TEXT,
  "journeyState"            TEXT NOT NULL DEFAULT 'not_started'
                            CHECK ("journeyState" IN (
                              'not_started', 'quick_dive_complete', 'deep_dive_complete',
                              'profile_generated', 'report_generated', 'coaching_unlocked'
                            )),
  "emailVerifiedAt"         TIMESTAMPTZ,
  "coachPersona"            JSONB,
  "socialEnabled"           BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_cohort" ON "User"("cohort") WHERE "cohort" IS NOT NULL;


-- ============================================================
-- 2. User-related tables (depend on User)
-- ============================================================

-- UserSession — server-side session management (httpOnly cookie)
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_session_user" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_expires" ON "UserSession"("expiresAt");

-- PasswordResetToken — time-limited tokens for password reset flow
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_prt_token_hash"
  ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "idx_prt_user"
  ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_prt_expires"
  ON "PasswordResetToken"("expiresAt")
  WHERE "usedAt" IS NULL;

-- OAuthAccount — links external OAuth identities to User
CREATE TABLE IF NOT EXISTS "OAuthAccount" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider"          TEXT NOT NULL CHECK ("provider" IN ('google', 'apple')),
  "providerAccountId" TEXT NOT NULL,
  "email"             TEXT,
  "name"              TEXT,
  "avatarUrl"         TEXT,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_oauth_provider_account"
  ON "OAuthAccount"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "idx_oauth_user"
  ON "OAuthAccount"("userId");

-- UserProfile — user insights profile (linked to auth system)
CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "username"    VARCHAR(30) UNIQUE,
  "isPublic"    BOOLEAN NOT NULL DEFAULT FALSE,
  "insightsJson" JSONB DEFAULT '[]',
  "lastUpdated" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt"   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_profile_user" ON "UserProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_userprofile_username" ON "UserProfile"("username") WHERE "username" IS NOT NULL;

-- IdentityLink — maps anonymous visitor IDs to registered users
CREATE TABLE IF NOT EXISTS "IdentityLink" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "anonymousId" TEXT NOT NULL,
  "linkedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "source"      TEXT NOT NULL DEFAULT 'registration'
    CHECK ("source" IN ('registration', 'login', 'manual', 'backfill'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_identity_link_unique
  ON "IdentityLink"("userId", "anonymousId");
CREATE INDEX IF NOT EXISTS idx_identity_anon
  ON "IdentityLink"("anonymousId");
CREATE INDEX IF NOT EXISTS idx_identity_user
  ON "IdentityLink"("userId");


-- ============================================================
-- 3. Platform feature tables (depend on User)
-- ============================================================

-- CoachingSession — AI coaching conversation sessions
CREATE TABLE IF NOT EXISTS "CoachingSession" (
  "id"                TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sessionType"       TEXT NOT NULL DEFAULT 'coaching',
  "reportId"          TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "startedAt"         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "endedAt"           TIMESTAMP WITH TIME ZONE,
  "roundNumber"       INTEGER DEFAULT 0,
  "maxRounds"         INTEGER DEFAULT 5,
  "messagesJson"      JSONB DEFAULT '[]',
  "summaryJson"       TEXT,
  "savedToProfile"    BOOLEAN DEFAULT FALSE,
  "tagsGeneratedJson" TEXT DEFAULT '[]',
  "mode"              TEXT NOT NULL DEFAULT 'explore',
  "stateJson"         JSONB NOT NULL DEFAULT '{}',
  "locale"            TEXT NOT NULL DEFAULT 'en',
  "status"            TEXT NOT NULL DEFAULT 'active'
                      CHECK ("status" IN ('active', 'completed')),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_coaching_user" ON "CoachingSession"("userId");
CREATE INDEX IF NOT EXISTS idx_coaching_report ON "CoachingSession"("reportId") WHERE "reportId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_coaching_user_updated" ON "CoachingSession"("userId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_coaching_user_active" ON "CoachingSession"("userId", "status") WHERE "status" = 'active';

-- CoachingTurnAudit — per-turn V2 understanding, routing, and response diagnostics
CREATE TABLE IF NOT EXISTS "CoachingTurnAudit" (
  "id"                      TEXT PRIMARY KEY,
  "sessionId"               TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "userId"                  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "turnNumber"              INTEGER NOT NULL,
  "strategyVersion"         TEXT NOT NULL
                              CHECK ("strategyVersion" IN ('legacy', 'shadow', 'v2')),
  "mode"                    TEXT NOT NULL
                              CHECK ("mode" IN ('explore', 'decide', 'act', 'support', 'job_analysis')),
  "primaryIntent"           TEXT NOT NULL,
  "coreQuestion"            TEXT NOT NULL,
  "importantFacts"          JSONB NOT NULL DEFAULT '[]',
  "constraints"             JSONB NOT NULL DEFAULT '[]',
  "desiredHelp"             TEXT NOT NULL
                              CHECK ("desiredHelp" IN ('listen', 'analyze', 'recommend', 'plan', 'information')),
  "ambiguities"             JSONB NOT NULL DEFAULT '[]',
  "confidence"              NUMERIC(4,3) NOT NULL,
  "correctionSignal"        TEXT,
  "needsRepair"             BOOLEAN NOT NULL DEFAULT FALSE,
  "assistantResponseLength" INTEGER,
  "hasActionDraft"          BOOLEAN NOT NULL DEFAULT FALSE,
  "hasRecommendation"       BOOLEAN NOT NULL DEFAULT FALSE,
  "completedAt"             TIMESTAMPTZ,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("sessionId", "turnNumber")
);

CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_created"
  ON "CoachingTurnAudit"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_strategy"
  ON "CoachingTurnAudit"("strategyVersion", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_coaching_turn_audit_repair"
  ON "CoachingTurnAudit"("needsRepair", "createdAt" DESC)
  WHERE "needsRepair" = TRUE;


-- ============================================================
-- 4. Assessment tables (depend on User)
-- ============================================================

-- QuestionnaireSession — Deep Dive questionnaire progress and answers
CREATE TABLE IF NOT EXISTS "QuestionnaireSession" (
  "id"                      TEXT PRIMARY KEY,
  "userId"                  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "tier"                    TEXT NOT NULL DEFAULT 'deep' CHECK ("tier" IN ('quick', 'deep', 'ultra')),
  "language"                TEXT NOT NULL DEFAULT 'zh' CHECK ("language" IN ('en', 'zh', 'nl', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'ru')),
  "answersJson"             JSONB NOT NULL DEFAULT '[]',
  "currentModule"           TEXT NOT NULL DEFAULT 'A',
  "currentQuestionIndex"    INTEGER NOT NULL DEFAULT 0,
  "answerAssistantEnabled"  BOOLEAN NOT NULL DEFAULT false,
  "explorationProgressJson" JSONB NOT NULL DEFAULT '{}',
  "status"                  TEXT NOT NULL DEFAULT 'in_progress' CHECK ("status" IN ('in_progress', 'completed', 'abandoned')),
  "startedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"             TIMESTAMPTZ,
  "totalTimeMs"             INTEGER,
  "lastActiveAt"            TIMESTAMPTZ,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_user_qs ON "QuestionnaireSession"("userId");
CREATE INDEX IF NOT EXISTS idx_session_status ON "QuestionnaireSession"("status");

-- AssessmentResult — output of scoring pipeline v2.0/v3.0
CREATE TABLE IF NOT EXISTS "AssessmentResult" (
  "id"                TEXT PRIMARY KEY,
  "sessionId"         TEXT NOT NULL REFERENCES "QuestionnaireSession"("id") ON DELETE CASCADE,
  "userId"            TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "resultJson"        JSONB NOT NULL,
  "confidence"        REAL,
  "version"           TEXT NOT NULL DEFAULT '2.0',
  "idempotencyKey"    TEXT,
  "resumeFlowVersion" TEXT NOT NULL DEFAULT 'v2-dialog',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ar_resume_flow_version_valid" CHECK ("resumeFlowVersion" IN ('v1-inline','v2-dialog'))
);

CREATE INDEX IF NOT EXISTS idx_assessment_session ON "AssessmentResult"("sessionId");
CREATE INDEX IF NOT EXISTS idx_assessment_user ON "AssessmentResult"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_idempotency ON "AssessmentResult"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;

-- QuickDiveResult — Quick Dive assessment results (RIASEC + 12-type archetype)
CREATE TABLE IF NOT EXISTS "QuickDiveResult" (
  "id"             TEXT PRIMARY KEY,
  "scoresJson"     JSONB NOT NULL,
  "archetypeCode"  TEXT NOT NULL,
  "archetypeLabel" TEXT NOT NULL,
  "language"       TEXT NOT NULL DEFAULT 'en',
  "userId"         TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "anonymousId"    TEXT,
  "resultDataJson" JSONB,
  "exploreMode"    TEXT NOT NULL DEFAULT 'narrative',
  "adminNote"      TEXT,
  "environment"    TEXT NOT NULL DEFAULT 'production',
  "chibiGender"    VARCHAR(10) NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quickdive_archetype ON "QuickDiveResult"("archetypeCode");
CREATE INDEX IF NOT EXISTS idx_quickdive_user ON "QuickDiveResult"("userId");
CREATE INDEX IF NOT EXISTS idx_quickdive_mode ON "QuickDiveResult"("exploreMode");
CREATE INDEX IF NOT EXISTS idx_quickdive_anonymous ON "QuickDiveResult"("anonymousId");


-- ============================================================
-- 5. Report & profile tables (depend on assessment tables)
-- ============================================================

-- RealConditions — user's reality snapshot for Panel 3
CREATE TABLE IF NOT EXISTS "RealConditions" (
  "id"             TEXT PRIMARY KEY,
  "sessionId"      TEXT NOT NULL REFERENCES "QuestionnaireSession"("id") ON DELETE CASCADE,
  "userId"         TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "conditionsJson" JSONB NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rc_session ON "RealConditions"("sessionId");
CREATE INDEX IF NOT EXISTS idx_rc_user ON "RealConditions"("userId");

-- CareerReport — generated career reports (4 LLM calls)
CREATE TABLE IF NOT EXISTS "CareerReport" (
  "id"               TEXT PRIMARY KEY,
  "assessmentId"     TEXT NOT NULL REFERENCES "AssessmentResult"("id") ON DELETE CASCADE,
  "userId"           TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "reportJson"       JSONB NOT NULL,
  "generationTimeMs" INTEGER,
  "llmModel"         TEXT,
  "llmCalls"         INTEGER,
  "version"          TEXT NOT NULL DEFAULT '2.0',
  "inputHash"        TEXT,
  "supersededAt"     TIMESTAMPTZ,
  -- Migration 094: per-section LLM provenance + quality score
  "llmProviderMap"   JSONB,
  "qualityScore"     NUMERIC(3,2) CHECK ("qualityScore" >= 0 AND "qualityScore" <= 1),
  "degradedSections" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active (non-superseded) report per assessment. Historical reports
-- stay in the table for audit/thesis provenance when the user triggers a
-- resume-enhanced regenerate.
CREATE UNIQUE INDEX IF NOT EXISTS "CareerReport_assessment_active_idx"
  ON "CareerReport" ("assessmentId")
  WHERE "supersededAt" IS NULL;
CREATE INDEX IF NOT EXISTS "CareerReport_assessment_history_idx"
  ON "CareerReport" ("assessmentId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_report_user ON "CareerReport"("userId");
-- Migration 094: admin dashboard "show reports with degraded sections" query
CREATE INDEX IF NOT EXISTS "idx_report_quality_score"
  ON "CareerReport" ("qualityScore" ASC NULLS FIRST, "createdAt" DESC)
  WHERE "qualityScore" IS NOT NULL AND "qualityScore" < 1.0;

-- ResumeMatchResult — persisted "Career Evidence" (resume parse + match).
-- Generalises to future sources (linkedin, portfolio) via sourceType.
-- Superseded rows are retained so thesis analysis can trace what evidence
-- was visible at each report generation.
CREATE TABLE IF NOT EXISTS "ResumeMatchResult" (
  "id"              TEXT PRIMARY KEY,
  "assessmentId"    TEXT NOT NULL REFERENCES "AssessmentResult"("id") ON DELETE CASCADE,
  "userId"          TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "sourceType"      TEXT NOT NULL DEFAULT 'resume',
  "fileName"        TEXT,
  "fileType"        TEXT,
  "resumeDataJson"  JSONB NOT NULL,
  "matchResultJson" JSONB NOT NULL,
  "flowVersion"     TEXT NOT NULL DEFAULT 'v2-dialog',
  "supersededAt"    TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "rmr_source_type_valid" CHECK ("sourceType" IN ('resume','linkedin','portfolio'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "ResumeMatchResult_assessment_active_idx"
  ON "ResumeMatchResult" ("assessmentId")
  WHERE "supersededAt" IS NULL;
CREATE INDEX IF NOT EXISTS "ResumeMatchResult_user_idx"
  ON "ResumeMatchResult" ("userId");
CREATE INDEX IF NOT EXISTS "ResumeMatchResult_assessment_history_idx"
  ON "ResumeMatchResult" ("assessmentId", "createdAt" DESC);

-- ReportGenerationLock — prevents duplicate cross-instance report generation.
-- Atomic claim via INSERT...ON CONFLICT UPDATE WHERE expiresAt < NOW().
-- Self-expiring to tolerate instance crash (expiresAt typically NOW() + 180s).
CREATE TABLE IF NOT EXISTS "ReportGenerationLock" (
  "assessmentId" TEXT PRIMARY KEY,
  "instanceId"   TEXT NOT NULL,
  "expiresAt"    TIMESTAMPTZ NOT NULL,
  "acquiredAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ReportGenerationLock_expiresAt_idx"
  ON "ReportGenerationLock" ("expiresAt");

-- PersonalProfile — assessment-linked personal profile
CREATE TABLE IF NOT EXISTS "PersonalProfile" (
  "id"           TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "AssessmentResult"("id") ON DELETE CASCADE,
  "userId"       TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "profileJson"    JSONB NOT NULL,
  "exercisesJson"  JSONB NOT NULL DEFAULT '{}',
  "version"        TEXT NOT NULL DEFAULT '2.0',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_assessment ON "PersonalProfile"("assessmentId");
CREATE INDEX IF NOT EXISTS idx_profile_user_pp ON "PersonalProfile"("userId");

-- UserMemory — AI coaching persistent memory (cross-session)
-- pgvector extension for semantic memory retrieval (UserMemory.embedding, migration 106)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "UserMemory" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "category"   TEXT NOT NULL CHECK ("category" IN (
    'personality', 'values', 'behavior', 'career',
    'constraint', 'motivation', 'blindspot', 'strength',
    'coaching_insight'
  )),
  "keyword"    TEXT NOT NULL,
  "insight"    TEXT NOT NULL,
  "source"     TEXT NOT NULL CHECK ("source" IN ('questionnaire', 'report', 'profile', 'coaching', 'manual')),
  "confidence" REAL NOT NULL DEFAULT 0.8,
  "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
  "metadata"   JSONB DEFAULT '{}',
  "embedding"  vector(1536),
  "embeddingModel" TEXT,
  "embeddedAt" TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_user_memory_user" ON "UserMemory"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_memory_active" ON "UserMemory"("userId", "isActive");
-- HNSW over cosine for semantic memory retrieval (migration 106)
CREATE INDEX IF NOT EXISTS "idx_user_memory_embedding" ON "UserMemory" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "idx_memory_active_confidence"
  ON "UserMemory"("userId", "confidence" DESC)
  WHERE "isActive" = TRUE;
CREATE INDEX IF NOT EXISTS "idx_memory_decay_check"
  ON "UserMemory"("userId", "updatedAt")
  WHERE "isActive" = TRUE;


-- ============================================================
-- 6. Engagement & Feedback tables
-- ============================================================

-- ReportReaction — user reactions to report panels
CREATE TABLE IF NOT EXISTS "ReportReaction" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT,
  "reportId"  TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,
  "reaction"  TEXT NOT NULL CHECK ("reaction" IN ('surprised', 'skeptical', 'resonates')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_reaction_report_user"
  ON "ReportReaction"("reportId", "userId") WHERE "userId" IS NOT NULL;

-- ReportNPS — Net Promoter Score feedback on reports
CREATE TABLE IF NOT EXISTS "ReportNPS" (
  "id"        TEXT PRIMARY KEY,
  "reportId"  TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,
  "userId"    TEXT,
  "score"     INTEGER NOT NULL CHECK ("score" >= 1 AND "score" <= 10),
  "pmfResponse" TEXT CHECK ("pmfResponse" IN ('very_disappointed', 'somewhat_disappointed', 'not_disappointed')),
  "feedback"  TEXT,
  "locale"    TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_nps_report_user"
  ON "ReportNPS"("reportId", "userId") WHERE "userId" IS NOT NULL;

-- ReportEngagement — passive report page engagement tracking (via sendBeacon).
-- KEEP post-thesis as a product analytics signal (panelTimes / maxScrollDepth /
-- totalTimeMs). The "scrollbacks" JSONB column is research-only and gets
-- dropped at thesis decommission. See docs/architecture/research-lifecycle.md.
CREATE TABLE IF NOT EXISTS "ReportEngagement" (
  "id"             TEXT PRIMARY KEY,
  "reportId"       TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,
  "userId"         TEXT,
  "panelTimes"     JSONB NOT NULL DEFAULT '{}',
  "scrollbacks"    JSONB NOT NULL DEFAULT '[]', -- RESEARCH ONLY: drops post-thesis (raw back-scroll event log; product code uses array length only)
  "maxScrollDepth" REAL,
  "totalTimeMs"    INTEGER,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_reportengagement_report" ON "ReportEngagement"("reportId");
CREATE INDEX IF NOT EXISTS "idx_reportengagement_user" ON "ReportEngagement"("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_reportengagement_created" ON "ReportEngagement"("createdAt" DESC);

-- CoachingFeedback — satisfaction feedback at end of coaching sessions
CREATE TABLE IF NOT EXISTS "CoachingFeedback" (
  "id"        TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "userId"    TEXT,
  "rating"    TEXT NOT NULL CHECK ("rating" IN ('okay', 'helpful', 'very_helpful')),
  "reasons"   TEXT[] NOT NULL DEFAULT '{}',
  "highlight" TEXT,
  "tagsJson"  JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_coaching_feedback_session" ON "CoachingFeedback"("sessionId");

-- CoachingTurnEval — per-turn AI coach quality telemetry
CREATE TABLE IF NOT EXISTS "CoachingTurnEval" (
  "id"                      TEXT PRIMARY KEY,
  "userId"                  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reportId"                TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "round"                   INTEGER NOT NULL,
  "locale"                  TEXT NOT NULL DEFAULT 'en',
  "phase"                   TEXT NOT NULL CHECK ("phase" IN (
    'discovery', 'pattern_surfacing', 'tension_naming', 'synthesis', 'action'
  )),
  "depthScore"              INTEGER NOT NULL CHECK ("depthScore" BETWEEN 1 AND 5),
  "transitionScore"         INTEGER NOT NULL CHECK ("transitionScore" BETWEEN 1 AND 5),
  "evidenceGroundingScore"  INTEGER NOT NULL CHECK ("evidenceGroundingScore" BETWEEN 1 AND 5),
  "prematureAdviceFlag"     BOOLEAN NOT NULL DEFAULT FALSE,
  "genericSummaryFlag"      BOOLEAN NOT NULL DEFAULT FALSE,
  "oneQuestionCompliance"   BOOLEAN NOT NULL DEFAULT TRUE,
  "reasonsJson"             JSONB NOT NULL DEFAULT '[]',
  "stateJson"               JSONB NOT NULL DEFAULT '{}',
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_coaching_turn_eval_user_created"
  ON "CoachingTurnEval"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_coaching_turn_eval_quality"
  ON "CoachingTurnEval"("createdAt" DESC)
  WHERE "transitionScore" < 4
     OR "evidenceGroundingScore" < 4
     OR "prematureAdviceFlag" = TRUE
     OR "genericSummaryFlag" = TRUE;

-- CoachingReviewPool — low-quality coaching turns queued for human quality review
CREATE TABLE IF NOT EXISTS "CoachingReviewPool" (
  "id"                    TEXT PRIMARY KEY,
  "userId"                TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reportId"              TEXT REFERENCES "CareerReport"("id") ON DELETE SET NULL,
  "round"                 INTEGER NOT NULL,
  "locale"                TEXT NOT NULL DEFAULT 'en',
  "reason"                TEXT NOT NULL,
  "userMessage"           TEXT,
  "assistantMessage"      TEXT NOT NULL,
  "deterministicEvalJson" JSONB NOT NULL DEFAULT '{}',
  "llmJudgeJson"          JSONB,
  "status"                TEXT NOT NULL DEFAULT 'open'
    CHECK ("status" IN ('open', 'reviewed', 'dismissed')),
  "reviewNotes"           TEXT,
  "reviewedBy"            TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewedAt"            TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_coaching_review_pool_status_created"
  ON "CoachingReviewPool"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_coaching_review_pool_user_created"
  ON "CoachingReviewPool"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

-- CoachingHypothesis — long-term coach hypotheses to validate with the user
CREATE TABLE IF NOT EXISTS "CoachingHypothesis" (
  "id"                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"                TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "hypothesis"            TEXT NOT NULL,
  "evidenceJson"          JSONB NOT NULL DEFAULT '[]',
  "counterEvidenceJson"   JSONB NOT NULL DEFAULT '[]',
  "confidence"            DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK ("confidence" >= 0 AND "confidence" <= 1),
  "status"                TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'confirmed', 'rejected', 'stale')),
  "sourceSessionId"       TEXT,
  "lastValidatedAt"       TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_coaching_hypothesis_user_status"
  ON "CoachingHypothesis"("userId", "status", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_coaching_hypothesis_active_relevance"
  ON "CoachingHypothesis"("userId", "confidence" DESC, "updatedAt" DESC)
  WHERE "status" IN ('active', 'confirmed');

-- CoachingSessionSummary — structured per-session summary for cross-session
-- continuity (Phase 4 longitudinal memory). embedding enables semantic recall
-- of past sessions. Added in migration 107.
CREATE TABLE IF NOT EXISTS "CoachingSessionSummary" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sessionId"     TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "summary"       TEXT NOT NULL,
  "keyDecisions"  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "openLoops"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "emotionalArc"  TEXT,
  "embedding"     vector(1536),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_session_summary_user"
  ON "CoachingSessionSummary"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_session_summary_embedding"
  ON "CoachingSessionSummary" USING hnsw ("embedding" vector_cosine_ops);

-- CoachingGrowthMarker — tracked stance changes across sessions (growth /
-- regression / contradiction) for a personality dimension or tension.
-- Added in migration 107.
CREATE TABLE IF NOT EXISTS "CoachingGrowthMarker" (
  "id"                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"             TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "dimension"          TEXT NOT NULL,
  "previousStance"     TEXT,
  "currentStance"      TEXT NOT NULL,
  "changeType"         TEXT NOT NULL CHECK ("changeType" IN ('growth', 'regression', 'contradiction')),
  "evidenceSessionIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "detectedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_growth_marker_user"
  ON "CoachingGrowthMarker"("userId", "detectedAt" DESC);

-- CDSEResponse — removed in v4.3 (CDSE-SF replaced by CDC-5)
-- Migration 068 drops table if it exists.

-- ============================================================
-- 7. Analytics tables
-- ============================================================

-- UserFunnel — key user journey events (funnel tracking)
CREATE TABLE IF NOT EXISTS "UserFunnel" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT,
  "clientId"       TEXT,
  "event"          TEXT NOT NULL,
  "metadata"       JSONB DEFAULT '{}',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "idempotencyKey" TEXT,
  "isAdmin"        BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "idx_funnel_user" ON "UserFunnel"("userId");
CREATE INDEX IF NOT EXISTS "idx_funnel_event" ON "UserFunnel"("event");
CREATE INDEX IF NOT EXISTS "idx_funnel_created" ON "UserFunnel"("createdAt");
-- Partial unique index: NULLs are excluded so legacy rows without a key are unaffected
CREATE UNIQUE INDEX IF NOT EXISTS "idx_funnel_idempotency_key"
  ON "UserFunnel" ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_userfunnel_isadmin"
  ON "UserFunnel"("isAdmin") WHERE "isAdmin" = TRUE;

-- PageVisit — visitor tracking via middleware after()
CREATE TABLE IF NOT EXISTS "PageVisit" (
  "id"             TEXT PRIMARY KEY,
  "path"           TEXT NOT NULL,
  "ipHash"         TEXT,
  "userAgent"      TEXT,
  "referer"        TEXT,
  "userId"         TEXT,
  "country"        TEXT,
  "isBot"          BOOLEAN DEFAULT FALSE,
  "isInternal"     BOOLEAN DEFAULT FALSE,
  "city"           TEXT,
  "region"         TEXT,
  "timezone"       TEXT,
  "isMobile"       BOOLEAN,
  "platform"       TEXT,
  "acceptLanguage" TEXT,
  "deviceType"     TEXT,
  "utmSource"      TEXT,
  "utmMedium"      TEXT,
  "utmCampaign"    TEXT,
  "utmContent"     TEXT,
  "durationMs"      INTEGER,
  "visitSessionId"  TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_pagevisit_created" ON "PageVisit"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_pagevisit_iphash" ON "PageVisit"("ipHash");
CREATE INDEX IF NOT EXISTS "idx_pagevisit_path" ON "PageVisit"("path");
CREATE INDEX IF NOT EXISTS "idx_pagevisit_user" ON "PageVisit"("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_pagevisit_isbot" ON "PageVisit"("isBot", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_pagevisit_internal" ON "PageVisit"("isInternal", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_pagevisit_utm" ON "PageVisit"("utmSource") WHERE "utmSource" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_pagevisit_session" ON "PageVisit"("visitSessionId") WHERE "visitSessionId" IS NOT NULL;

-- AnalyticsError — observability log for errors inside the analytics layer
CREATE TABLE IF NOT EXISTS "AnalyticsError" (
  "id"        TEXT PRIMARY KEY,
  "layer"     TEXT NOT NULL
    CHECK ("layer" IN (
      'funnel', 'page_visit', 'engagement', 'identity', 'cron'
    )),
  "event"     TEXT,
  "error"     TEXT NOT NULL,
  "context"   JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_error_created
  ON "AnalyticsError"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_error_layer
  ON "AnalyticsError"("layer", "createdAt" DESC);


-- NotableVisitor — automatically detected high-value visitors
CREATE TABLE IF NOT EXISTS "NotableVisitor" (
  "id"         TEXT PRIMARY KEY,
  "ipHash"     TEXT NOT NULL UNIQUE,
  "score"      INTEGER NOT NULL DEFAULT 0,
  "reasons"    TEXT[] NOT NULL DEFAULT '{}',
  "summary"    JSONB,
  "detectedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "dismissed"  BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS "idx_notable_expires" ON "NotableVisitor"("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_notable_score" ON "NotableVisitor"("score" DESC);


-- ============================================================
-- 8. GDPR & Data Management tables
-- ============================================================

-- UserDeletionRequest — GDPR right-to-erasure scheduling
CREATE TABLE IF NOT EXISTS "UserDeletionRequest" (
  "id"                  TEXT PRIMARY KEY,
  "userId"              TEXT NOT NULL UNIQUE,
  "requestedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "scheduledDeletionAt" TIMESTAMPTZ NOT NULL,
  "cancelledAt"         TIMESTAMPTZ,
  "executedAt"          TIMESTAMPTZ
);


-- ConsentRecord — immutable audit trail of informed-consent acceptances.
-- One row per (user, consentVersion) — so if the consent text is updated
-- mid-study, existing participants have a frozen record of the exact
-- wording they agreed to. User.researchConsentAt remains the "first
-- consent timestamp" convenience column; this table is the source of
-- truth for regulatory/audit review.
-- RESEARCH ONLY: retained per IRB policy (typically 5+ years post-publication),
-- NOT dropped at the standard "thesis decommission" trigger. See
-- docs/architecture/research-lifecycle.md for retention schedule.
CREATE TABLE IF NOT EXISTS "ConsentRecord" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "consentVersion"   TEXT NOT NULL,
  "consentTextHash"  TEXT NOT NULL,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "sessionId"        TEXT,
  "agreedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "withdrawnAt"      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_consent_user_version"
  ON "ConsentRecord"("userId", "consentVersion");
CREATE INDEX IF NOT EXISTS "idx_consent_user"
  ON "ConsentRecord"("userId");


-- Post1WeekReminderLog — idempotency for T2 reminder emails.
-- One row is claimed before sending so the daily cron and manual admin
-- endpoint cannot send duplicate reminders to the same participant.
-- RESEARCH ONLY: drops post-thesis (T2 reminder is part of the pre/post study).
-- See docs/architecture/research-lifecycle.md for decommission plan.
CREATE TABLE IF NOT EXISTS "Post1WeekReminderLog" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "email"           TEXT NOT NULL,
  "locale"          TEXT NOT NULL DEFAULT 'en' CHECK ("locale" IN ('en', 'zh')),
  "postImmediateAt" TIMESTAMPTZ NOT NULL,
  "claimedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sentAt"          TIMESTAMPTZ,
  "sendStatus"      TEXT NOT NULL DEFAULT 'claimed' CHECK ("sendStatus" IN ('claimed', 'sent', 'failed')),
  "error"           TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_post1week_reminder_user"
  ON "Post1WeekReminderLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_post1week_reminder_status"
  ON "Post1WeekReminderLog"("sendStatus", "claimedAt");


-- DurableJob — generic Postgres-backed queue for non-critical but
-- must-eventually-run side effects. Workers claim due jobs with SKIP LOCKED
-- and retry failures with exponential backoff.
CREATE TABLE IF NOT EXISTS "DurableJob" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type"           TEXT NOT NULL,
  "payload"        JSONB NOT NULL DEFAULT '{}',
  "status"         TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed')),
  "priority"       INTEGER NOT NULL DEFAULT 0,
  "attempts"       INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0),
  "maxAttempts"    INTEGER NOT NULL DEFAULT 5 CHECK ("maxAttempts" > 0),
  "runAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lockedBy"       TEXT,
  "lockedAt"       TIMESTAMPTZ,
  "lastError"      TEXT,
  "idempotencyKey" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_durable_job_idempotency"
  ON "DurableJob"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_durable_job_workable"
  ON "DurableJob"("status", "runAt", "priority" DESC)
  WHERE "status" IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS "idx_durable_job_type_status"
  ON "DurableJob"("type", "status", "runAt");
CREATE INDEX IF NOT EXISTS "idx_durable_job_locked"
  ON "DurableJob"("lockedAt")
  WHERE "lockedBy" IS NOT NULL;


-- ============================================================
-- 9. Research measurement tables (Pre-Post Study)
--    RESEARCH ONLY: all tables in this section drop post-thesis.
--    See docs/architecture/research-lifecycle.md for decommission plan.
-- ============================================================

-- PrePostAssessment — SCC + CDSE combined pre/post measurement for research.
-- RESEARCH ONLY: drops post-thesis. SCC-12/UES-12/CDC-5 are psychometric
-- instruments specific to the thesis design; not part of long-term product.
CREATE TABLE IF NOT EXISTS "PrePostAssessment" (
  "id"                 SERIAL PRIMARY KEY,
  "userId"             TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "assessmentType"     VARCHAR(16) NOT NULL CHECK ("assessmentType" IN ('pre', 'post_immediate', 'post_1week')),
  "sccResponses"       JSONB NOT NULL,
  "sccTotalScore"      NUMERIC(5,2),
  "cdseResponses"      JSONB,                -- CDC-5 responses (repurposed from CDSE-SF; nullable for non-research users)
  "cdseTotalScore"     NUMERIC(5,2),
  "experienceFeedback" JSONB,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_prepost_user" ON "PrePostAssessment"("userId");
CREATE INDEX IF NOT EXISTS "idx_prepost_type" ON "PrePostAssessment"("assessmentType");
CREATE INDEX IF NOT EXISTS "idx_prepost_user_type" ON "PrePostAssessment"("userId", "assessmentType");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_prepost_user_type_unique"
  ON "PrePostAssessment"("userId", "assessmentType")
  WHERE "userId" IS NOT NULL;


-- UserExplorationProgress — tracks which modules a user has completed (depth gauge)
CREATE TABLE IF NOT EXISTS "UserExplorationProgress" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE UNIQUE,
  "modulesJson" JSONB NOT NULL DEFAULT '{}',
  "depthM"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_exploration_progress_user" ON "UserExplorationProgress"("userId");


-- ============================================================
-- 10. Cohort enrollment
-- ============================================================

-- InviteCode — self-service cohort enrollment codes
CREATE TABLE IF NOT EXISTS "InviteCode" (
  "id"                TEXT PRIMARY KEY,
  "code"              TEXT UNIQUE NOT NULL,
  "cohortId"          TEXT NOT NULL,
  "createdBy"         TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "maxUses"           INTEGER NOT NULL DEFAULT 1,
  "usedCount"         INTEGER NOT NULL DEFAULT 0,
  "claimedByUserIds"  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "expiresAt"         TIMESTAMPTZ,
  -- RESEARCH ONLY: invite-code-driven A/B group assignment. Drops post-thesis
  -- (column itself becomes NULL-able product flag or is removed entirely).
  "researchGroup"     TEXT CHECK ("researchGroup" IN ('classic', 'immersive')), -- RESEARCH ONLY
  "adminNote"         TEXT, -- admin-only: free-text note for who this code is assigned to
  "isActive"          BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitecode_code" ON "InviteCode"("code");
CREATE INDEX IF NOT EXISTS "idx_invitecode_cohort" ON "InviteCode"("cohortId");
CREATE INDEX IF NOT EXISTS "idx_invitecode_created_by" ON "InviteCode"("createdBy");


-- ============================================================
-- 11. Action Hub tables
-- ============================================================

-- ActionPlan — top-level action plan derived from CareerReport
CREATE TABLE IF NOT EXISTS "ActionPlan" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reportId"    TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,
  "status"      TEXT NOT NULL DEFAULT 'active'
    CHECK ("status" IN ('active', 'archived', 'superseded')),
  "contextJson" JSONB NOT NULL DEFAULT '{}',
  "locale"      TEXT NOT NULL DEFAULT 'en',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_action_plan_user" ON "ActionPlan"("userId");
CREATE INDEX IF NOT EXISTS "idx_action_plan_report" ON "ActionPlan"("reportId");
CREATE INDEX IF NOT EXISTS "idx_action_plan_active" ON "ActionPlan"("status")
  WHERE "status" = 'active';
CREATE INDEX IF NOT EXISTS "idx_action_plan_user_active"
  ON "ActionPlan"("userId", "status")
  WHERE "status" = 'active';


-- ActionItem — individual action tasks within a plan
CREATE TABLE IF NOT EXISTS "ActionItem" (
  "id"                TEXT PRIMARY KEY,
  "planId"            TEXT NOT NULL REFERENCES "ActionPlan"("id") ON DELETE CASCADE,
  "userId"            TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title"             TEXT NOT NULL,
  "description"       TEXT,
  "category"          TEXT NOT NULL
    CHECK ("category" IN ('explore', 'learn', 'network', 'create', 'apply', 'reflect')),
  "intensity"         TEXT NOT NULL DEFAULT 'passive'
    CHECK ("intensity" IN ('passive', 'active', 'social', 'creative')),
  "status"            TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'in_progress', 'completed', 'skipped')),
  "priority"          INTEGER NOT NULL DEFAULT 0,
  "estimatedMinutes"  INTEGER,
  "sourceDimension"   TEXT,
  "planPhase"         INTEGER
    CHECK ("planPhase" IS NULL OR "planPhase" IN (1, 2, 3)),
  "recommendationReason" TEXT,
  "completionOutcome" TEXT,
  "dueDate"           DATE,
  "completedAt"       TIMESTAMPTZ,
  "userNote"          TEXT,
  "matchedNonNegotiable" TEXT,
  "matchedFlowDimension" JSONB,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_action_item_plan" ON "ActionItem"("planId");
CREATE INDEX IF NOT EXISTS "idx_action_item_user" ON "ActionItem"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_action_item_status" ON "ActionItem"("status")
  WHERE "status" IN ('pending', 'in_progress');


-- ActionMilestone — milestone markers within a plan
CREATE TABLE IF NOT EXISTS "ActionMilestone" (
  "id"          TEXT PRIMARY KEY,
  "planId"      TEXT NOT NULL REFERENCES "ActionPlan"("id") ON DELETE CASCADE,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "targetDay"   INTEGER NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'reached', 'skipped')),
  "reachedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_milestone_plan" ON "ActionMilestone"("planId");


-- ============================================================
-- 11. LLM Usage tracking
-- ============================================================

-- LLMUsageLog — tracks every LLM call for cost/latency monitoring
CREATE TABLE IF NOT EXISTS "LLMUsageLog" (
  "id"            TEXT PRIMARY KEY,
  "taskName"      VARCHAR(50) NOT NULL,
  "provider"      VARCHAR(20) NOT NULL,
  "model"         VARCHAR(50) NOT NULL,
  "inputTokens"   INTEGER,
  "outputTokens"  INTEGER,
  "latencyMs"     INTEGER NOT NULL,
  "success"       BOOLEAN NOT NULL,
  "degraded"      BOOLEAN NOT NULL DEFAULT FALSE,
  "errorMessage"  TEXT,
  "userId"        TEXT,
  "environment"   VARCHAR(20) NOT NULL DEFAULT 'production',
  "cacheReadTokens"  INTEGER,
  "cacheWriteTokens" INTEGER,
  "cacheHit"         BOOLEAN,
  -- Migration 095: quality gate result per call
  "qualityCheckResult" TEXT CHECK ("qualityCheckResult" IN (
    'pass', 'fail-length', 'fail-field', 'fail-count',
    'fail-language', 'fail-repetition', 'not-checked'
  )),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_llm_usage_created"
  ON "LLMUsageLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_llm_usage_task"
  ON "LLMUsageLog"("taskName", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_llm_usage_env"
  ON "LLMUsageLog"("environment", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_llm_usage_provider_failures"
  ON "LLMUsageLog"("provider", "createdAt" DESC) WHERE "success" = false;
-- Migration 095: partial index for "fail rate by task" cron query
CREATE INDEX IF NOT EXISTS "idx_llm_usage_quality_fail"
  ON "LLMUsageLog" ("taskName", "createdAt" DESC)
  WHERE "qualityCheckResult" IS NOT NULL
    AND "qualityCheckResult" NOT IN ('pass', 'not-checked');
-- Migration 093: partial index for per-user cost attribution joins.
-- Excludes anonymous-flow rows (userId IS NULL) to stay small under
-- Neon free-tier storage. Used by getUserUsageStats and per-user
-- LLM cost queries.
CREATE INDEX IF NOT EXISTS "idx_llm_usage_user"
  ON "LLMUsageLog"("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;

-- LLMPromptMeta — tracks RealConditions injection per LLM call.
-- Migration 092. Written from prompt builders (not from model-router) so
-- frozen routing logic stays untouched. Aggregate by (taskName, time
-- window) to verify the audit-driven prompt fix is active in production.
CREATE TABLE IF NOT EXISTS "LLMPromptMeta" (
  "id"                       UUID PRIMARY KEY,
  "taskName"                 TEXT NOT NULL,
  "userId"                   UUID,
  "locale"                   TEXT NOT NULL,
  "realConditionsProvided"   BOOLEAN NOT NULL,
  "realConditionsFieldCount" INTEGER NOT NULL DEFAULT 0,
  "environment"              TEXT NOT NULL DEFAULT 'production',
  "createdAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_llm_prompt_meta_task_created"
  ON "LLMPromptMeta" ("taskName", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_llm_prompt_meta_user_created"
  ON "LLMPromptMeta" ("userId", "createdAt" DESC)
  WHERE "userId" IS NOT NULL;


-- ============================================================
-- 14. Admin answer presets (for reproducible test generation)
-- ============================================================

-- CareerDirection — unified career direction library (curated + O*NET + emerging)
CREATE TABLE IF NOT EXISTS "CareerDirection" (
  "id"                    TEXT PRIMARY KEY,
  "source"                TEXT NOT NULL CHECK ("source" IN ('curated', 'onet', 'emerging')),
  "titleEn"               TEXT NOT NULL,
  "titleZh"               TEXT NOT NULL,
  "subtitleZh"            TEXT,
  "titleLocales"          JSONB NOT NULL DEFAULT '{}',
  "idealRiasec"           JSONB NOT NULL,
  "alignedValues"         TEXT[] NOT NULL DEFAULT '{}',
  "idealBigFive"          JSONB DEFAULT '{}',
  "industries"            TEXT[] NOT NULL DEFAULT '{}',
  "crossCulturalFit"      TEXT[] NOT NULL DEFAULT '{}',
  "seniorityMin"          INTEGER NOT NULL DEFAULT 0,
  "seniorityMax"          INTEGER NOT NULL DEFAULT 20,
  "tags"                  TEXT[] NOT NULL DEFAULT '{}',
  "aiEraCategory"         TEXT CHECK ("aiEraCategory" IN ('stable', 'augmented', 'transformed', 'ai-native')),
  "aiExposureScore"       REAL CHECK ("aiExposureScore" >= 0 AND "aiExposureScore" <= 1),
  "aiImpactLabel"         TEXT CHECK ("aiImpactLabel" IN ('low', 'medium', 'high')),
  "aiExposureSources"     TEXT[] DEFAULT '{}',
  "annotationSource"      TEXT NOT NULL CHECK ("annotationSource" IN ('expert-heuristic', 'empirical-data', 'ai-assisted')),
  "annotationConfidence"  TEXT NOT NULL CHECK ("annotationConfidence" IN ('expert-estimated', 'data-validated', 'community-verified')),
  "marketOutlook"         JSONB,
  "resilienceScore"       REAL,
  "resilienceLevel"       INTEGER CHECK ("resilienceLevel" >= 0 AND "resilienceLevel" <= 3),
  "jobZone"               INTEGER CHECK ("jobZone" IS NULL OR ("jobZone" >= 1 AND "jobZone" <= 5)),
  "jobZoneSource"         TEXT CHECK ("jobZoneSource" IS NULL OR "jobZoneSource" IN ('onet-official', 'llm-batch', 'manual')),
  "jobZoneConfidence"     REAL CHECK ("jobZoneConfidence" IS NULL OR ("jobZoneConfidence" >= 0 AND "jobZoneConfidence" <= 1)),
  "isActive"              BOOLEAN NOT NULL DEFAULT TRUE,
  "sunsetDate"            DATE,
  "deprecationStatus"     TEXT CHECK ("deprecationStatus" IN ('active', 'warning', 'sunset', 'retired')) DEFAULT 'active',
  "lastReviewedAt"        TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_dir_source ON "CareerDirection"("source");
CREATE INDEX IF NOT EXISTS idx_career_dir_active ON "CareerDirection"("isActive") WHERE "isActive" = TRUE;
CREATE INDEX IF NOT EXISTS idx_career_dir_industries ON "CareerDirection" USING gin("industries");
CREATE INDEX IF NOT EXISTS idx_career_dir_tags ON "CareerDirection" USING gin("tags");
CREATE INDEX IF NOT EXISTS idx_career_dir_updated ON "CareerDirection"("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_career_dir_ai_era ON "CareerDirection"("aiEraCategory") WHERE "aiEraCategory" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_dir_ai_impact ON "CareerDirection"("aiImpactLabel") WHERE "aiImpactLabel" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_dir_ai_exposure_score ON "CareerDirection"("aiExposureScore" DESC NULLS LAST) WHERE "aiExposureScore" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_dir_resilience_level ON "CareerDirection"("resilienceLevel") WHERE "resilienceLevel" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_dir_job_zone ON "CareerDirection"("jobZone") WHERE "jobZone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_dir_deprecation ON "CareerDirection"("deprecationStatus") WHERE "deprecationStatus" != 'active';
CREATE INDEX IF NOT EXISTS idx_career_dir_sunset ON "CareerDirection"("sunsetDate") WHERE "sunsetDate" IS NOT NULL;


-- ============================================================

-- AdminAnswerPreset — stores admin's real questionnaire answers as reusable test templates
CREATE TABLE IF NOT EXISTS "AdminAnswerPreset" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name"             VARCHAR(100) NOT NULL DEFAULT 'My Answers',
  "quickDiveAnswers" JSONB,
  "deepDiveAnswers"  JSONB,
  "locale"           VARCHAR(5) NOT NULL DEFAULT 'en',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_admin_preset_user" ON "AdminAnswerPreset"("userId");


-- UserContext — per-user context stored as JSONB (1:1 with User)
CREATE TABLE IF NOT EXISTS "UserContext" (
  "userId"      TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "contextJson" JSONB NOT NULL DEFAULT '{}',
  "version"     INTEGER NOT NULL DEFAULT 1,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 15. Assessment Completion Registry
-- ============================================================

-- AssessmentCompletion — unified registry of completed assessments per user.
-- Single source of truth for "which assessments has this user completed?"
-- Extensible: add new assessmentType values as new assessment modes are introduced.
CREATE TABLE IF NOT EXISTS "AssessmentCompletion" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "assessmentType" TEXT NOT NULL CHECK ("assessmentType" IN (
    'quick_dive', 'immersive_dive', 'deep_dive', 'ultra_deep_dive', 'pvq_quick'
  )),
  "resultId"       TEXT NOT NULL,
  "completedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ac_user ON "AssessmentCompletion"("userId");
CREATE INDEX IF NOT EXISTS idx_ac_user_type ON "AssessmentCompletion"("userId", "assessmentType");
CREATE UNIQUE INDEX IF NOT EXISTS idx_ac_user_type_result
  ON "AssessmentCompletion"("userId", "assessmentType", "resultId");


-- ============================================================
-- 16. Journey State Machine
-- ============================================================

-- JourneyTransitionLog — audit trail for user journey state transitions
CREATE TABLE IF NOT EXISTS "JourneyTransitionLog" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fromState"   TEXT NOT NULL,
  "toState"     TEXT NOT NULL,
  "event"       TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL DEFAULT 'system',
  "metadata"    JSONB DEFAULT '{}',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_journey_log_user" ON "JourneyTransitionLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_journey_log_created" ON "JourneyTransitionLog"("createdAt");


-- ============================================================
-- 18. Achievement system
-- ============================================================

-- UserAchievement — unlocked achievements per user (gamification)
CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "achievementKey"  TEXT NOT NULL,
  "unlockedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "metadata"        JSONB DEFAULT '{}',
  UNIQUE("userId", "achievementKey")
);

CREATE INDEX IF NOT EXISTS idx_achievement_user ON "UserAchievement"("userId");
CREATE INDEX IF NOT EXISTS idx_achievement_key ON "UserAchievement"("achievementKey");


-- ============================================================
-- 19. User purchases (Stripe payment tracking)
-- ============================================================

-- UserPurchase — tracks which users have purchased which product tiers
CREATE TABLE IF NOT EXISTS "UserPurchase" (
  "id"                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"                 TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tier"                   TEXT NOT NULL CHECK ("tier" IN ('report', 'journey', 'coaching')),
  "stripeSessionId"        TEXT,
  "stripePaymentIntentId"  TEXT,
  "amountCents"            INTEGER NOT NULL DEFAULT 0,
  "currency"               TEXT NOT NULL DEFAULT 'usd',
  "status"                 TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'refunded', 'expired')),
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_purchase_user ON "UserPurchase" ("userId");
CREATE INDEX IF NOT EXISTS idx_user_purchase_user_tier ON "UserPurchase" ("userId", "tier");
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_purchase_stripe_session ON "UserPurchase" ("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;


-- ============================================================
-- 20. Migration tracking table
-- ============================================================

-- CoachMessage — proactive messages from AI coach companion to users
CREATE TABLE IF NOT EXISTS "CoachMessage" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type"        TEXT NOT NULL CHECK ("type" IN ('guide', 'insight', 'nudge', 'welcome')),
  "trigger"     TEXT NOT NULL,
  "content"     JSONB NOT NULL DEFAULT '{}',
  "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
  "actionUrl"   TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_message_user ON "CoachMessage" ("userId");
CREATE INDEX IF NOT EXISTS idx_coach_message_user_unread ON "CoachMessage" ("userId", "isRead") WHERE "isRead" = FALSE;
CREATE INDEX IF NOT EXISTS idx_coach_message_created ON "CoachMessage" ("createdAt" DESC);


-- CoachingTheme — longitudinal coaching memory: recurring topics across sessions
CREATE TABLE IF NOT EXISTS "CoachingTheme" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "theme"         TEXT NOT NULL,
  "context"       TEXT,
  "sentiment"     TEXT CHECK ("sentiment" IN ('positive', 'negative', 'neutral', 'conflicted')),
  "mentionCount"  INTEGER NOT NULL DEFAULT 1,
  "firstMentionedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastMentionedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolved"      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_coaching_theme_user ON "CoachingTheme" ("userId");
CREATE INDEX IF NOT EXISTS idx_coaching_theme_user_active ON "CoachingTheme" ("userId", "resolved") WHERE "resolved" = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_coaching_theme_user_theme ON "CoachingTheme" ("userId", "theme");


-- AssessmentPipeline — server-orchestrated, idempotent pipeline for the
-- "Deep Dive complete → scoring → profile → narratives → report" chain.
-- Single source of truth for post-completion processing. See migration 076.
-- Per-step status; reportStatus starts as 'not_requested' and becomes 'pending'
-- when the user clicks "View Deep Dive Report" on the profile page.
CREATE TABLE IF NOT EXISTS "AssessmentPipeline" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "assessmentId"    TEXT NOT NULL UNIQUE,
  "userId"          TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sessionId"       TEXT NOT NULL,
  "locale"          TEXT NOT NULL DEFAULT 'en',
  "scoringStatus"    TEXT NOT NULL DEFAULT 'pending',
  "profileStatus"    TEXT NOT NULL DEFAULT 'pending',
  "narrativesStatus" TEXT NOT NULL DEFAULT 'pending',
  "reportStatus"     TEXT NOT NULL DEFAULT 'not_requested',
  "resumeAnalysisStatus" TEXT NOT NULL DEFAULT 'not_requested',
  "reportRequestedAt" TIMESTAMPTZ,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "retryCount"      INT NOT NULL DEFAULT 0,
  "lastStepError"   TEXT,
  "lastAttemptAt"   TIMESTAMPTZ,
  "nextAttemptAt"   TIMESTAMPTZ,
  "workerLock"      TEXT,
  "workerLockAt"    TIMESTAMPTZ,
  "startedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"     TIMESTAMPTZ,
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ap_scoring_status_valid"    CHECK ("scoringStatus"    IN ('pending','running','done','failed')),
  CONSTRAINT "ap_profile_status_valid"    CHECK ("profileStatus"    IN ('pending','running','done','failed')),
  CONSTRAINT "ap_narratives_status_valid" CHECK ("narrativesStatus" IN ('pending','running','done','failed')),
  CONSTRAINT "ap_report_status_valid"     CHECK ("reportStatus"     IN ('not_requested','pending','running','done','failed')),
  CONSTRAINT "ap_resume_analysis_status_valid" CHECK ("resumeAnalysisStatus" IN ('not_requested','pending','running','done','failed','skipped')),
  CONSTRAINT "ap_status_valid"            CHECK ("status"           IN ('pending','running','auto_done','completed','failed'))
);

CREATE INDEX IF NOT EXISTS "AssessmentPipeline_workable_idx"
  ON "AssessmentPipeline" ("status", "nextAttemptAt")
  WHERE "status" IN ('pending','running');
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_user_idx"
  ON "AssessmentPipeline" ("userId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "AssessmentPipeline_workerlock_idx"
  ON "AssessmentPipeline" ("workerLockAt")
  WHERE "workerLock" IS NOT NULL;


-- _migrations — tracks which numbered migration scripts have been applied
CREATE TABLE IF NOT EXISTS "_migrations" (
  "id"         SERIAL PRIMARY KEY,
  "filename"   TEXT UNIQUE NOT NULL,
  "appliedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 12. Archetype Companion (social discovery + friend connections)
-- ============================================================
-- Migrations 085–089 add the four tables below plus the
-- User.socialEnabled flag (already declared in section 1).
-- Cohort-level access is gated by entitlements.socialFeatures
-- (see lib/cohort/types.ts); user-level access is gated by
-- User.socialEnabled. Both must be true to enter discovery.

-- CompanionProfile — public-facing companion identity (decoupled from PersonalProfile)
CREATE TABLE IF NOT EXISTS "CompanionProfile" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "displayName"   TEXT NOT NULL,
  "bio"           TEXT,
  "archetypeCode" TEXT NOT NULL,
  "scoresJson"    JSONB NOT NULL,
  "locale"        TEXT NOT NULL DEFAULT 'en' CHECK ("locale" IN ('en', 'zh')),
  "visibility"    TEXT NOT NULL DEFAULT 'discoverable'
                  CHECK ("visibility" IN ('discoverable', 'friends_only', 'hidden')),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_profile_bio_length" CHECK (char_length("bio") <= 200),
  CONSTRAINT "companion_profile_displayname_length"
    CHECK (char_length("displayName") BETWEEN 1 AND 40)
);

CREATE INDEX IF NOT EXISTS "idx_companion_profile_discoverable"
  ON "CompanionProfile"("archetypeCode")
  WHERE "visibility" = 'discoverable';

-- CompanionConnection — friend request / accepted state machine
CREATE TABLE IF NOT EXISTS "CompanionConnection" (
  "id"               TEXT PRIMARY KEY,
  "requesterId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "recipientId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status"           TEXT NOT NULL DEFAULT 'pending'
                     CHECK ("status" IN ('pending', 'accepted', 'declined')),
  "requesterMessage" TEXT,
  "acceptedAt"       TIMESTAMPTZ,
  "declinedAt"       TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_connection_no_self"
    CHECK ("requesterId" <> "recipientId"),
  CONSTRAINT "companion_connection_message_length"
    CHECK (char_length("requesterMessage") <= 200),
  CONSTRAINT "companion_connection_unique_pair"
    UNIQUE ("requesterId", "recipientId")
);

CREATE INDEX IF NOT EXISTS "idx_companion_connection_recipient_pending"
  ON "CompanionConnection"("recipientId")
  WHERE "status" = 'pending';

CREATE INDEX IF NOT EXISTS "idx_companion_connection_accepted"
  ON "CompanionConnection"("requesterId", "recipientId")
  WHERE "status" = 'accepted';

-- Canonical pair UNIQUE — symmetrises the ordered UNIQUE above so that
-- A→B and B→A cannot coexist (defends bidirectional race; see migration 090).
CREATE UNIQUE INDEX IF NOT EXISTS "idx_companion_connection_canonical_pair"
  ON "CompanionConnection" (
    LEAST("requesterId", "recipientId"),
    GREATEST("requesterId", "recipientId")
  );

-- CompanionBlock — one-way blocking (blocker can never see blocked in discovery)
CREATE TABLE IF NOT EXISTS "CompanionBlock" (
  "id"        TEXT PRIMARY KEY,
  "blockerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "blockedId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason"    TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_block_no_self"
    CHECK ("blockerId" <> "blockedId"),
  CONSTRAINT "companion_block_unique_pair"
    UNIQUE ("blockerId", "blockedId")
);

CREATE INDEX IF NOT EXISTS "idx_companion_block_blocker"
  ON "CompanionBlock"("blockerId");
CREATE INDEX IF NOT EXISTS "idx_companion_block_blocked"
  ON "CompanionBlock"("blockedId");

-- CompanionReport — Trust & Safety report queue (admin triage)
CREATE TABLE IF NOT EXISTS "CompanionReport" (
  "id"          TEXT PRIMARY KEY,
  "reporterId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reportedId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason"      TEXT NOT NULL
                CHECK ("reason" IN ('harassment', 'inappropriate_content', 'spam', 'other')),
  "details"     TEXT,
  "status"      TEXT NOT NULL DEFAULT 'open'
                CHECK ("status" IN ('open', 'reviewed', 'dismissed')),
  "reviewedBy"  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_report_no_self"
    CHECK ("reporterId" <> "reportedId"),
  CONSTRAINT "companion_report_details_length"
    CHECK (char_length("details") <= 1000)
);

CREATE INDEX IF NOT EXISTS "idx_companion_report_open"
  ON "CompanionReport"("createdAt")
  WHERE "status" = 'open';
CREATE INDEX IF NOT EXISTS "idx_companion_report_reported"
  ON "CompanionReport"("reportedId");


-- ============================================================
-- 13. Materialized Views (created via migrations, NOT in this file)
-- ============================================================
--
-- The following materialized views exist in production but are NOT
-- created by this schema.sql (they require data from tables above
-- and must be created AFTER tables are populated).
-- They are managed by: scripts/migrations/018-create-materialized-views.sql
--
--   analytics_daily_summary      — daily PageVisit aggregates by date × country
--     Unique index: idx_ads_date_country (date, country)
--     Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
--
--   funnel_weekly_summary        — weekly UserFunnel event counts by week × event
--     Unique index: idx_fws_week_event (week, event)
--     Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_weekly_summary;
--
--   cohort_retention_weekly      — cohort retention by registration week × activity week
--     Unique index: idx_crw_cohort_activity (cohortWeek, activityWeek)
--     Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_retention_weekly;
--
-- To rebuild on a fresh database, run AFTER schema.sql:
--   npx tsx scripts/run-migrations.ts
-- ============================================================


-- ============================================================
-- RESET SCRIPT — Clear all data (preserves table schemas)
-- Uncomment and run manually when needed.
-- ============================================================

-- TRUNCATE TABLE "CoachingFeedback" CASCADE;
-- TRUNCATE TABLE "CoachingTurnEval" CASCADE;
-- TRUNCATE TABLE "ReportEngagement" CASCADE;
-- TRUNCATE TABLE "PersonalProfile" CASCADE;
-- TRUNCATE TABLE "CareerReport" CASCADE;
-- TRUNCATE TABLE "RealConditions" CASCADE;
-- TRUNCATE TABLE "AssessmentResult" CASCADE;
-- TRUNCATE TABLE "QuestionnaireSession" CASCADE;
-- TRUNCATE TABLE "QuickDiveResult" CASCADE;
-- TRUNCATE TABLE "CoachingSession" CASCADE;
-- TRUNCATE TABLE "UserMemory" CASCADE;
-- TRUNCATE TABLE "ReportNPS" CASCADE;
-- TRUNCATE TABLE "ReportReaction" CASCADE;
-- (CDSEResponse removed in v4.3)
-- TRUNCATE TABLE "PrePostAssessment" CASCADE;
-- TRUNCATE TABLE "UserFunnel" CASCADE;
-- TRUNCATE TABLE "PageVisit" CASCADE;
-- TRUNCATE TABLE "NotableVisitor" CASCADE;
-- TRUNCATE TABLE "UserDeletionRequest" CASCADE;
-- TRUNCATE TABLE "UserProfile" CASCADE;
-- TRUNCATE TABLE "UserSession" CASCADE;
-- TRUNCATE TABLE "User" CASCADE;
