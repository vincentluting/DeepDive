// ============================================================
// Deep Dive — Barrel Re-export for all type modules
// ============================================================

// --- Dimension types (RIASEC, Big Five, Schwartz, CollabStyle derived, Cross-Cultural) ---
export type {
  RIASECDimension,
  BigFiveDimension,
  CrossCulturalType,
  SchwartzValue,
  CollabStyle,
  CollabMapping,
  ArchetypeConfidenceLevel,
  Archetype,
  ValueOrientation,
  HollandRelation,
  CognitiveStyleDimensionInfo,
  CognitiveStyleDisplayMode,
  CognitiveStyleCode,
  SchwartzAnchorsResult,
  SJTTensionScore,
} from "./dimensions";

// --- Questionnaire types (147-item questionnaire) ---
export type {
  SJTScenario,
  SJTOption,
  PVQItem,
  IPIPItem,
  AnswerValue,
  ModuleCode,
  ModuleInfo,
  ZoneTimeline,
} from "./questionnaire";

// --- Assessment types (scoring pipeline) ---
export type {
  AssessmentResult,
  AssessmentResultV3,
  AssessmentInput,
} from "./assessment";

// --- Report types (Career report structure, panels, templates) ---
export type {
  ReportHeader,
  CareerDirection,
  Panel1CareerMatch,
  GapAnalysis,
  JobDirection,
  ActionPlanTask,
  WeekPreview,
  ConstraintStrategy,
  FollowUpTrigger,
  Panel3Pathway,
  IntegrationLayer,
  CareerAnchor,
  CareerReport,
  CareerDrainWarning,
  AnnotationConfidence,
  AiEraPersonalInsight,
  CareerDirectionTemplate,
  ArchetypeMapEntry,
  ProfileAlgorithmOutput,
  ReportDict,
} from "./report";

// --- Platform types (Profile, sessions, coaching, real conditions) ---
export type {
  RealConditions,
  PersonalProfileData,
  ShadowInsight,
  ShadowInsights,
  CoreQualityQuadrant,
  SocialStyleResult,
  LeadershipStyleResult,
  LeadershipStyleType,
  InterpersonalEnergySpectrum,
  ConflictHandlingProfile,
  ConflictMode,
  SessionQuestionAnswer,
  QuestionnaireSession,
  IkigaiCircle,
  IkigaiItem,
  MeaningCompass,
} from "./platform";

// --- Resume types (Resume upload, parsing, and re-matching) ---
export type {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeLanguage,
  ResumeMatchResult,
  AlignedDimension,
  ConflictingDimension,
} from "@/lib/resume/types";

// --- Memory types (AI coaching persistent memory) ---
export type {
  MemoryCategory,
  MemorySource,
  UserMemory,
  MemoryEntry,
} from "./memory";
export { MEMORY_CATEGORY_LABELS, MEMORY_CATEGORY_COLORS } from "./memory";
