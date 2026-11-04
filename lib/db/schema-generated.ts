// ============================================================
// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source:    scripts/schema.sql
// Generator: scripts/generate-db-types.ts
// Re-run:    npm run db:generate-types
//
// This file is the single source of truth for raw DB row types.
// Import these in lib/db/*.ts instead of hand-writing interfaces
// and casting `as unknown as T`.
//
// Narrowing JSONB columns: the generator emits `unknown` for JSON
// columns. In callers, cast explicitly via a typed helper at the
// boundary between raw row and app type.
// ============================================================

export interface Db_migrations {
  id: number; // SERIAL
  filename: string; // TEXT
  appliedAt: Date; // TIMESTAMPTZ
}

export interface DbActionItem {
  id: string; // TEXT
  planId: string; // TEXT
  userId: string; // TEXT
  title: string; // TEXT
  description: string | null; // TEXT NULL
  category: string; // TEXT
  intensity: string; // TEXT
  status: string; // TEXT
  priority: number; // INTEGER
  estimatedMinutes: number | null; // INTEGER NULL
  sourceDimension: string | null; // TEXT NULL
  planPhase: number | null; // INTEGER NULL
  recommendationReason: string | null; // TEXT NULL
  completionOutcome: string | null; // TEXT NULL
  dueDate: Date | null; // DATE NULL
  completedAt: Date | null; // TIMESTAMPTZ NULL
  userNote: string | null; // TEXT NULL
  matchedNonNegotiable: string | null; // TEXT NULL
  matchedFlowDimension: unknown | null; // JSONB NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbActionMilestone {
  id: string; // TEXT
  planId: string; // TEXT
  title: string; // TEXT
  description: string | null; // TEXT NULL
  targetDay: number; // INTEGER
  status: string; // TEXT
  reachedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbActionPlan {
  id: string; // TEXT
  userId: string; // TEXT
  reportId: string; // TEXT
  status: string; // TEXT
  contextJson: unknown; // JSONB
  locale: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbAdminAnswerPreset {
  id: string; // TEXT
  userId: string; // TEXT
  name: string; // VARCHAR(100)
  quickDiveAnswers: unknown | null; // JSONB NULL
  deepDiveAnswers: unknown | null; // JSONB NULL
  locale: string; // VARCHAR(5)
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbAnalyticsError {
  id: string; // TEXT
  layer: string; // TEXT
  event: string | null; // TEXT NULL
  error: string; // TEXT
  context: unknown | null; // JSONB NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbAssessmentCompletion {
  id: string; // TEXT
  userId: string; // TEXT
  assessmentType: string; // TEXT
  resultId: string; // TEXT
  completedAt: Date; // TIMESTAMPTZ
}

export interface DbAssessmentPipeline {
  id: string; // TEXT
  assessmentId: string; // TEXT
  userId: string; // TEXT
  sessionId: string; // TEXT
  locale: string; // TEXT
  scoringStatus: string; // TEXT
  profileStatus: string; // TEXT
  narrativesStatus: string; // TEXT
  reportStatus: string; // TEXT
  resumeAnalysisStatus: string; // TEXT
  reportRequestedAt: Date | null; // TIMESTAMPTZ NULL
  status: string; // TEXT
  retryCount: number; // INT
  lastStepError: string | null; // TEXT NULL
  lastAttemptAt: Date | null; // TIMESTAMPTZ NULL
  nextAttemptAt: Date | null; // TIMESTAMPTZ NULL
  workerLock: string | null; // TEXT NULL
  workerLockAt: Date | null; // TIMESTAMPTZ NULL
  startedAt: Date; // TIMESTAMPTZ
  completedAt: Date | null; // TIMESTAMPTZ NULL
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbAssessmentResult {
  id: string; // TEXT
  sessionId: string; // TEXT
  userId: string | null; // TEXT NULL
  resultJson: unknown; // JSONB
  confidence: number | null; // REAL NULL
  version: string; // TEXT
  idempotencyKey: string | null; // TEXT NULL
  resumeFlowVersion: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCareerDirection {
  id: string; // TEXT
  source: string; // TEXT
  titleEn: string; // TEXT
  titleZh: string; // TEXT
  subtitleZh: string | null; // TEXT NULL
  titleLocales: unknown; // JSONB
  idealRiasec: unknown; // JSONB
  alignedValues: string[]; // TEXT[]
  idealBigFive: unknown | null; // JSONB NULL
  industries: string[]; // TEXT[]
  crossCulturalFit: string[]; // TEXT[]
  seniorityMin: number; // INTEGER
  seniorityMax: number; // INTEGER
  tags: string[]; // TEXT[]
  aiEraCategory: string | null; // TEXT NULL
  aiExposureScore: number | null; // REAL NULL
  aiImpactLabel: string | null; // TEXT NULL
  aiExposureSources: string[] | null; // TEXT[] NULL
  annotationSource: string; // TEXT
  annotationConfidence: string; // TEXT
  marketOutlook: unknown | null; // JSONB NULL
  resilienceScore: number | null; // REAL NULL
  resilienceLevel: number | null; // INTEGER NULL
  jobZone: number | null; // INTEGER NULL
  jobZoneSource: string | null; // TEXT NULL
  jobZoneConfidence: number | null; // REAL NULL
  isActive: boolean; // BOOLEAN
  sunsetDate: Date | null; // DATE NULL
  deprecationStatus: string | null; // TEXT NULL
  lastReviewedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbCareerReport {
  id: string; // TEXT
  assessmentId: string; // TEXT
  userId: string | null; // TEXT NULL
  reportJson: unknown; // JSONB
  generationTimeMs: number | null; // INTEGER NULL
  llmModel: string | null; // TEXT NULL
  llmCalls: number | null; // INTEGER NULL
  version: string; // TEXT
  inputHash: string | null; // TEXT NULL
  supersededAt: Date | null; // TIMESTAMPTZ NULL
  llmProviderMap: unknown | null; // JSONB NULL
  qualityScore: number | null; // NUMERIC(3,2) NULL
  degradedSections: string[]; // TEXT[]
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingFeedback {
  id: string; // TEXT
  sessionId: string; // TEXT
  userId: string | null; // TEXT NULL
  rating: string; // TEXT
  reasons: string[]; // TEXT[]
  highlight: string | null; // TEXT NULL
  tagsJson: unknown; // JSONB
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingGrowthMarker {
  id: string; // TEXT
  userId: string; // TEXT
  dimension: string; // TEXT
  previousStance: string | null; // TEXT NULL
  currentStance: string; // TEXT
  changeType: string; // TEXT
  evidenceSessionIds: unknown; // JSONB
  detectedAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingHypothesis {
  id: string; // TEXT
  userId: string; // TEXT
  hypothesis: string; // TEXT
  evidenceJson: unknown; // JSONB
  counterEvidenceJson: unknown; // JSONB
  confidence: number; // DOUBLE PRECISION
  status: string; // TEXT
  sourceSessionId: string | null; // TEXT NULL
  lastValidatedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingReviewPool {
  id: string; // TEXT
  userId: string | null; // TEXT NULL
  reportId: string | null; // TEXT NULL
  round: number; // INTEGER
  locale: string; // TEXT
  reason: string; // TEXT
  userMessage: string | null; // TEXT NULL
  assistantMessage: string; // TEXT
  deterministicEvalJson: unknown; // JSONB
  llmJudgeJson: unknown | null; // JSONB NULL
  status: string; // TEXT
  reviewNotes: string | null; // TEXT NULL
  reviewedBy: string | null; // TEXT NULL
  reviewedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingSession {
  id: string; // TEXT
  userId: string; // TEXT
  sessionType: string; // TEXT
  reportId: string | null; // TEXT NULL
  startedAt: Date | null; // TIMESTAMP WITH TIME ZONE NULL
  endedAt: Date | null; // TIMESTAMP WITH TIME ZONE NULL
  roundNumber: number | null; // INTEGER NULL
  maxRounds: number | null; // INTEGER NULL
  messagesJson: unknown | null; // JSONB NULL
  summaryJson: string | null; // TEXT NULL
  savedToProfile: boolean | null; // BOOLEAN NULL
  tagsGeneratedJson: string | null; // TEXT NULL
  mode: string; // TEXT
  stateJson: unknown; // JSONB
  locale: string; // TEXT
  status: string; // TEXT
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingSessionSummary {
  id: string; // TEXT
  userId: string; // TEXT
  sessionId: string; // TEXT
  summary: string; // TEXT
  keyDecisions: unknown; // JSONB
  openLoops: unknown; // JSONB
  emotionalArc: string | null; // TEXT NULL
  embedding: unknown | null; // VECTOR NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingTheme {
  id: string; // TEXT
  userId: string; // TEXT
  theme: string; // TEXT
  context: string | null; // TEXT NULL
  sentiment: string | null; // TEXT NULL
  mentionCount: number; // INTEGER
  firstMentionedAt: Date; // TIMESTAMPTZ
  lastMentionedAt: Date; // TIMESTAMPTZ
  resolved: boolean; // BOOLEAN
}

export interface DbCoachingTurnAudit {
  id: string; // TEXT
  sessionId: string; // TEXT
  userId: string; // TEXT
  turnNumber: number; // INTEGER
  strategyVersion: string; // TEXT
  mode: string; // TEXT
  primaryIntent: string; // TEXT
  coreQuestion: string; // TEXT
  importantFacts: unknown; // JSONB
  constraints: unknown; // JSONB
  desiredHelp: string; // TEXT
  ambiguities: unknown; // JSONB
  confidence: number; // NUMERIC(4,3)
  correctionSignal: string | null; // TEXT NULL
  needsRepair: boolean; // BOOLEAN
  assistantResponseLength: number | null; // INTEGER NULL
  hasActionDraft: boolean; // BOOLEAN
  hasRecommendation: boolean; // BOOLEAN
  completedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachingTurnEval {
  id: string; // TEXT
  userId: string | null; // TEXT NULL
  reportId: string | null; // TEXT NULL
  round: number; // INTEGER
  locale: string; // TEXT
  phase: string; // TEXT
  depthScore: number; // INTEGER
  transitionScore: number; // INTEGER
  evidenceGroundingScore: number; // INTEGER
  prematureAdviceFlag: boolean; // BOOLEAN
  genericSummaryFlag: boolean; // BOOLEAN
  oneQuestionCompliance: boolean; // BOOLEAN
  reasonsJson: unknown; // JSONB
  stateJson: unknown; // JSONB
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCoachMessage {
  id: string; // TEXT
  userId: string; // TEXT
  type: string; // TEXT
  trigger: string; // TEXT
  content: unknown; // JSONB
  isRead: boolean; // BOOLEAN
  actionUrl: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCompanionBlock {
  id: string; // TEXT
  blockerId: string; // TEXT
  blockedId: string; // TEXT
  reason: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCompanionConnection {
  id: string; // TEXT
  requesterId: string; // TEXT
  recipientId: string; // TEXT
  status: string; // TEXT
  requesterMessage: string | null; // TEXT NULL
  acceptedAt: Date | null; // TIMESTAMPTZ NULL
  declinedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbCompanionProfile {
  id: string; // TEXT
  userId: string; // TEXT
  displayName: string; // TEXT
  bio: string | null; // TEXT NULL
  archetypeCode: string; // TEXT
  scoresJson: unknown; // JSONB
  locale: string; // TEXT
  visibility: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbCompanionReport {
  id: string; // TEXT
  reporterId: string; // TEXT
  reportedId: string; // TEXT
  reason: string; // TEXT
  details: string | null; // TEXT NULL
  status: string; // TEXT
  reviewedBy: string | null; // TEXT NULL
  reviewedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbConsentRecord {
  id: string; // TEXT
  userId: string; // TEXT
  consentVersion: string; // TEXT
  consentTextHash: string; // TEXT
  ipAddress: string | null; // TEXT NULL
  userAgent: string | null; // TEXT NULL
  sessionId: string | null; // TEXT NULL
  agreedAt: Date; // TIMESTAMPTZ
  withdrawnAt: Date | null; // TIMESTAMPTZ NULL
}

export interface DbDurableJob {
  id: string; // TEXT
  type: string; // TEXT
  payload: unknown; // JSONB
  status: string; // TEXT
  priority: number; // INTEGER
  attempts: number; // INTEGER
  maxAttempts: number; // INTEGER
  runAt: Date; // TIMESTAMPTZ
  lockedBy: string | null; // TEXT NULL
  lockedAt: Date | null; // TIMESTAMPTZ NULL
  lastError: string | null; // TEXT NULL
  idempotencyKey: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
  completedAt: Date | null; // TIMESTAMPTZ NULL
}

export interface DbIdentityLink {
  id: string; // TEXT
  userId: string; // TEXT
  anonymousId: string; // TEXT
  linkedAt: Date; // TIMESTAMPTZ
  source: string; // TEXT
}

export interface DbInviteCode {
  id: string; // TEXT
  code: string; // TEXT
  cohortId: string; // TEXT
  createdBy: string | null; // TEXT NULL
  maxUses: number; // INTEGER
  usedCount: number; // INTEGER
  claimedByUserIds: unknown; // JSONB
  expiresAt: Date | null; // TIMESTAMPTZ NULL
  researchGroup: string | null; // TEXT NULL
  adminNote: string | null; // TEXT NULL
  isActive: boolean; // BOOLEAN
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbJourneyTransitionLog {
  id: number; // SERIAL
  userId: string; // TEXT
  fromState: string; // TEXT
  toState: string; // TEXT
  event: string; // TEXT
  triggeredBy: string; // TEXT
  metadata: unknown | null; // JSONB NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbLLMPromptMeta {
  id: string; // UUID
  taskName: string; // TEXT
  userId: string | null; // UUID NULL
  locale: string; // TEXT
  realConditionsProvided: boolean; // BOOLEAN
  realConditionsFieldCount: number; // INTEGER
  environment: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbLLMUsageLog {
  id: string; // TEXT
  taskName: string; // VARCHAR(50)
  provider: string; // VARCHAR(20)
  model: string; // VARCHAR(50)
  inputTokens: number | null; // INTEGER NULL
  outputTokens: number | null; // INTEGER NULL
  latencyMs: number; // INTEGER
  success: boolean; // BOOLEAN
  degraded: boolean; // BOOLEAN
  errorMessage: string | null; // TEXT NULL
  userId: string | null; // TEXT NULL
  environment: string; // VARCHAR(20)
  cacheReadTokens: number | null; // INTEGER NULL
  cacheWriteTokens: number | null; // INTEGER NULL
  cacheHit: boolean | null; // BOOLEAN NULL
  qualityCheckResult: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbNotableVisitor {
  id: string; // TEXT
  ipHash: string; // TEXT
  score: number; // INTEGER
  reasons: string[]; // TEXT[]
  summary: unknown | null; // JSONB NULL
  detectedAt: Date | null; // TIMESTAMPTZ NULL
  expiresAt: Date; // TIMESTAMPTZ
  dismissed: boolean | null; // BOOLEAN NULL
}

export interface DbOAuthAccount {
  id: string; // TEXT
  userId: string; // TEXT
  provider: string; // TEXT
  providerAccountId: string; // TEXT
  email: string | null; // TEXT NULL
  name: string | null; // TEXT NULL
  avatarUrl: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbPageVisit {
  id: string; // TEXT
  path: string; // TEXT
  ipHash: string | null; // TEXT NULL
  userAgent: string | null; // TEXT NULL
  referer: string | null; // TEXT NULL
  userId: string | null; // TEXT NULL
  country: string | null; // TEXT NULL
  isBot: boolean | null; // BOOLEAN NULL
  isInternal: boolean | null; // BOOLEAN NULL
  city: string | null; // TEXT NULL
  region: string | null; // TEXT NULL
  timezone: string | null; // TEXT NULL
  isMobile: boolean | null; // BOOLEAN NULL
  platform: string | null; // TEXT NULL
  acceptLanguage: string | null; // TEXT NULL
  deviceType: string | null; // TEXT NULL
  utmSource: string | null; // TEXT NULL
  utmMedium: string | null; // TEXT NULL
  utmCampaign: string | null; // TEXT NULL
  utmContent: string | null; // TEXT NULL
  durationMs: number | null; // INTEGER NULL
  visitSessionId: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbPasswordResetToken {
  id: string; // TEXT
  userId: string; // TEXT
  tokenHash: string; // TEXT
  expiresAt: Date; // TIMESTAMPTZ
  usedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbPersonalProfile {
  id: string; // TEXT
  assessmentId: string; // TEXT
  userId: string | null; // TEXT NULL
  profileJson: unknown; // JSONB
  exercisesJson: unknown; // JSONB
  version: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbPost1WeekReminderLog {
  id: string; // TEXT
  userId: string; // TEXT
  email: string; // TEXT
  locale: string; // TEXT
  postImmediateAt: Date; // TIMESTAMPTZ
  claimedAt: Date; // TIMESTAMPTZ
  sentAt: Date | null; // TIMESTAMPTZ NULL
  sendStatus: string; // TEXT
  error: string | null; // TEXT NULL
}

export interface DbPrePostAssessment {
  id: number; // SERIAL
  userId: string | null; // TEXT NULL
  assessmentType: string; // VARCHAR(16)
  sccResponses: unknown; // JSONB
  sccTotalScore: number | null; // NUMERIC(5,2) NULL
  cdseResponses: unknown | null; // JSONB NULL
  cdseTotalScore: number | null; // NUMERIC(5,2) NULL
  experienceFeedback: unknown | null; // JSONB NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbQuestionnaireSession {
  id: string; // TEXT
  userId: string | null; // TEXT NULL
  tier: string; // TEXT
  language: string; // TEXT
  answersJson: unknown; // JSONB
  currentModule: string; // TEXT
  currentQuestionIndex: number; // INTEGER
  answerAssistantEnabled: boolean; // BOOLEAN
  explorationProgressJson: unknown; // JSONB
  status: string; // TEXT
  startedAt: Date; // TIMESTAMPTZ
  completedAt: Date | null; // TIMESTAMPTZ NULL
  totalTimeMs: number | null; // INTEGER NULL
  lastActiveAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbQuickDiveResult {
  id: string; // TEXT
  scoresJson: unknown; // JSONB
  archetypeCode: string; // TEXT
  archetypeLabel: string; // TEXT
  language: string; // TEXT
  userId: string | null; // TEXT NULL
  anonymousId: string | null; // TEXT NULL
  resultDataJson: unknown | null; // JSONB NULL
  exploreMode: string; // TEXT
  adminNote: string | null; // TEXT NULL
  environment: string; // TEXT
  chibiGender: string | null; // VARCHAR(10) NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbRealConditions {
  id: string; // TEXT
  sessionId: string; // TEXT
  userId: string | null; // TEXT NULL
  conditionsJson: unknown; // JSONB
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbReportEngagement {
  id: string; // TEXT
  reportId: string; // TEXT
  userId: string | null; // TEXT NULL
  panelTimes: unknown; // JSONB
  scrollbacks: unknown; // JSONB
  maxScrollDepth: number | null; // REAL NULL
  totalTimeMs: number | null; // INTEGER NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbReportGenerationLock {
  assessmentId: string; // TEXT
  instanceId: string; // TEXT
  expiresAt: Date; // TIMESTAMPTZ
  acquiredAt: Date; // TIMESTAMPTZ
}

export interface DbReportNPS {
  id: string; // TEXT
  reportId: string; // TEXT
  userId: string | null; // TEXT NULL
  score: number; // INTEGER
  pmfResponse: string | null; // TEXT NULL
  feedback: string | null; // TEXT NULL
  locale: string | null; // TEXT NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbReportReaction {
  id: string; // TEXT
  userId: string | null; // TEXT NULL
  reportId: string; // TEXT
  reaction: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbResumeMatchResult {
  id: string; // TEXT
  assessmentId: string; // TEXT
  userId: string | null; // TEXT NULL
  sourceType: string; // TEXT
  fileName: string | null; // TEXT NULL
  fileType: string | null; // TEXT NULL
  resumeDataJson: unknown; // JSONB
  matchResultJson: unknown; // JSONB
  flowVersion: string; // TEXT
  supersededAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbUser {
  id: string; // TEXT
  email: string; // TEXT
  passwordHash: string | null; // TEXT NULL
  name: string | null; // TEXT NULL
  isAdmin: boolean; // BOOLEAN
  careerStage: string | null; // TEXT NULL
  registrationIp: string | null; // TEXT NULL
  registrationCountry: string | null; // TEXT NULL
  researchGroup: string | null; // TEXT NULL
  researchParticipantId: string | null; // TEXT NULL
  researchConsentAt: Date | null; // TIMESTAMPTZ NULL
  cohort: string | null; // TEXT NULL
  journeyState: string; // TEXT
  emailVerifiedAt: Date | null; // TIMESTAMPTZ NULL
  coachPersona: unknown | null; // JSONB NULL
  socialEnabled: boolean; // BOOLEAN
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbUserAchievement {
  id: string; // TEXT
  userId: string; // TEXT
  achievementKey: string; // TEXT
  unlockedAt: Date; // TIMESTAMPTZ
  metadata: unknown | null; // JSONB NULL
}

export interface DbUserContext {
  userId: string; // TEXT
  contextJson: unknown; // JSONB
  version: number; // INTEGER
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbUserDeletionRequest {
  id: string; // TEXT
  userId: string; // TEXT
  requestedAt: Date; // TIMESTAMPTZ
  scheduledDeletionAt: Date; // TIMESTAMPTZ
  cancelledAt: Date | null; // TIMESTAMPTZ NULL
  executedAt: Date | null; // TIMESTAMPTZ NULL
}

export interface DbUserExplorationProgress {
  id: string; // TEXT
  userId: string; // TEXT
  modulesJson: unknown; // JSONB
  depthM: number; // INTEGER
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbUserFunnel {
  id: string; // TEXT
  userId: string | null; // TEXT NULL
  clientId: string | null; // TEXT NULL
  event: string; // TEXT
  metadata: unknown | null; // JSONB NULL
  createdAt: Date; // TIMESTAMPTZ
  idempotencyKey: string | null; // TEXT NULL
  isAdmin: boolean | null; // BOOLEAN NULL
}

export interface DbUserMemory {
  id: string; // TEXT
  userId: string; // TEXT
  category: string; // TEXT
  keyword: string; // TEXT
  insight: string; // TEXT
  source: string; // TEXT
  confidence: number; // REAL
  isActive: boolean; // BOOLEAN
  metadata: unknown | null; // JSONB NULL
  embedding: unknown | null; // VECTOR NULL
  embeddingModel: string | null; // TEXT NULL
  embeddedAt: Date | null; // TIMESTAMPTZ NULL
  createdAt: Date; // TIMESTAMPTZ
  updatedAt: Date; // TIMESTAMPTZ
}

export interface DbUserProfile {
  id: string; // TEXT
  userId: string; // TEXT
  username: string | null; // VARCHAR(30) NULL
  isPublic: boolean; // BOOLEAN
  insightsJson: unknown | null; // JSONB NULL
  lastUpdated: Date; // TIMESTAMP WITHOUT TIME ZONE
  createdAt: Date; // TIMESTAMP WITHOUT TIME ZONE
}

export interface DbUserPurchase {
  id: string; // TEXT
  userId: string; // TEXT
  tier: string; // TEXT
  stripeSessionId: string | null; // TEXT NULL
  stripePaymentIntentId: string | null; // TEXT NULL
  amountCents: number; // INTEGER
  currency: string; // TEXT
  status: string; // TEXT
  createdAt: Date; // TIMESTAMPTZ
}

export interface DbUserSession {
  id: string; // TEXT
  userId: string; // TEXT
  expiresAt: Date; // TIMESTAMPTZ
  createdAt: Date; // TIMESTAMPTZ
}

/** Map of table name → row interface. */
export interface DbTables {
  "_migrations": Db_migrations;
  "ActionItem": DbActionItem;
  "ActionMilestone": DbActionMilestone;
  "ActionPlan": DbActionPlan;
  "AdminAnswerPreset": DbAdminAnswerPreset;
  "AnalyticsError": DbAnalyticsError;
  "AssessmentCompletion": DbAssessmentCompletion;
  "AssessmentPipeline": DbAssessmentPipeline;
  "AssessmentResult": DbAssessmentResult;
  "CareerDirection": DbCareerDirection;
  "CareerReport": DbCareerReport;
  "CoachingFeedback": DbCoachingFeedback;
  "CoachingGrowthMarker": DbCoachingGrowthMarker;
  "CoachingHypothesis": DbCoachingHypothesis;
  "CoachingReviewPool": DbCoachingReviewPool;
  "CoachingSession": DbCoachingSession;
  "CoachingSessionSummary": DbCoachingSessionSummary;
  "CoachingTheme": DbCoachingTheme;
  "CoachingTurnAudit": DbCoachingTurnAudit;
  "CoachingTurnEval": DbCoachingTurnEval;
  "CoachMessage": DbCoachMessage;
  "CompanionBlock": DbCompanionBlock;
  "CompanionConnection": DbCompanionConnection;
  "CompanionProfile": DbCompanionProfile;
  "CompanionReport": DbCompanionReport;
  "ConsentRecord": DbConsentRecord;
  "DurableJob": DbDurableJob;
  "IdentityLink": DbIdentityLink;
  "InviteCode": DbInviteCode;
  "JourneyTransitionLog": DbJourneyTransitionLog;
  "LLMPromptMeta": DbLLMPromptMeta;
  "LLMUsageLog": DbLLMUsageLog;
  "NotableVisitor": DbNotableVisitor;
  "OAuthAccount": DbOAuthAccount;
  "PageVisit": DbPageVisit;
  "PasswordResetToken": DbPasswordResetToken;
  "PersonalProfile": DbPersonalProfile;
  "Post1WeekReminderLog": DbPost1WeekReminderLog;
  "PrePostAssessment": DbPrePostAssessment;
  "QuestionnaireSession": DbQuestionnaireSession;
  "QuickDiveResult": DbQuickDiveResult;
  "RealConditions": DbRealConditions;
  "ReportEngagement": DbReportEngagement;
  "ReportGenerationLock": DbReportGenerationLock;
  "ReportNPS": DbReportNPS;
  "ReportReaction": DbReportReaction;
  "ResumeMatchResult": DbResumeMatchResult;
  "User": DbUser;
  "UserAchievement": DbUserAchievement;
  "UserContext": DbUserContext;
  "UserDeletionRequest": DbUserDeletionRequest;
  "UserExplorationProgress": DbUserExplorationProgress;
  "UserFunnel": DbUserFunnel;
  "UserMemory": DbUserMemory;
  "UserProfile": DbUserProfile;
  "UserPurchase": DbUserPurchase;
  "UserSession": DbUserSession;
}

export type DbTableName = keyof DbTables;
export type DbRow<T extends DbTableName> = DbTables[T];
