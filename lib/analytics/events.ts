import { z } from "zod/v4";
import type { FunnelEvent } from "@/lib/analytics/funnel";

export const EventSchemas = {
  registered: z.object({
    registrationCountry: z.string().optional(),
    language: z.string().optional(),
    researchGroup: z.string().optional(),
  }),
  quickdive_started: z.object({
    exploreMode: z.enum(["classic", "immersive"]),
    language: z.string(),
    clientId: z.string().optional(),
  }),
  quickdive_completed: z.object({
    exploreMode: z.enum(["classic", "immersive"]),
    archetypeCode: z.string(),
    language: z.string(),
    timeMs: z.number().optional(),
  }),
  quickdive_abandoned: z.object({
    exploreMode: z.enum(["classic", "immersive"]),
    questionIndex: z.number().optional(),
    lastQuestionIndex: z.number().optional(),
    questionsAnswered: z.number().optional(),
    totalQuestions: z.number().optional(),
    completionRate: z.number().optional(),
    timeSpentMs: z.number().optional(),
    language: z.string().optional(),
    locale: z.string().optional(),
  }),
  immersive_explore_started: z.object({
    language: z.string(),
  }),
  immersive_explore_completed: z.object({
    archetypeCode: z.string(),
    language: z.string(),
    timeMs: z.number().optional(),
  }),
  immersive_exit_clicked: z.object({
    phase: z.string().optional(),
    questionIndex: z.number().optional(),
  }),
  deepdive_started: z.object({
    sessionId: z.string(),
    language: z.string(),
    inheritedRIASEC: z.boolean().optional(),
  }),
  deepdive_completed: z.object({
    sessionId: z.string(),
    totalTimeMs: z.number().optional(),
    language: z.string(),
    pipelineVersion: z.string().optional(),
  }),
  deepdive_abandoned: z.object({
    sessionId: z.string().optional(),
    currentModule: z.string().optional(),
    questionIndex: z.number().optional(),
    lastQuestionId: z.string().optional(),
    questionsAnswered: z.number().optional(),
    totalQuestions: z.number().optional(),
    completionRate: z.number().optional(),
    timeSpentMs: z.number().optional(),
    language: z.string().optional(),
    locale: z.string().optional(),
  }),
  profile_generated: z.object({
    assessmentId: z.string(),
    userId: z.string().optional(),
  }),
  report_viewed: z.object({
    reportId: z.string(),
    reportVersion: z.string().optional(),
    hasRealConditions: z.boolean().optional(),
  }),
  report_reacted: z.object({
    reportId: z.string(),
    reaction: z.string(),
  }),
  coaching_started: z.object({
    reportId: z.string().optional(),
    triggerContext: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  share_clicked: z.object({
    mode: z.string().optional(),
    archetypeCode: z.string().optional(),
    locale: z.string().optional(),
  }),
  // Pre-funnel engagement events
  intro_cta_clicked: z.object({
    locale: z.string().optional(),
    secondsOnPage: z.number().optional(),
    exploreMode: z.string().optional(),
    source: z.string().optional(),
    targetHref: z.string().optional(),
    surface: z.string().optional(),
  }),
  micro_feedback_shown: z.object({
    triggerType: z.string(),
    sessionId: z.string().optional(),
  }),
  report_generated: z.object({
    assessmentId: z.string(),
    reportId: z.string(),
    locale: z.string().optional(),
  }),
  coaching_completed: z.object({
    sessionId: z.string(),
    reportId: z.string().optional(),
    rounds: z.number().optional(),
    locale: z.string().optional(),
  }),
  profile_viewed: z.object({
    profileId: z.string().optional(),
  }),
  profile_tab_switched: z.object({
    tab: z.string(),
    previousTab: z.string().optional(),
  }),
  profile_cta_clicked: z.object({
    dimension: z.string(),
    destination: z.string(),
  }),
  profile_feedback_submitted: z.object({
    section: z.string(),
    accurate: z.boolean(),
  }),
  profile_transparency_toggled: z.object({
    expanded: z.boolean(),
  }),
  action_hub_viewed: z.object({
    locale: z.string().optional(),
    hasReport: z.boolean().optional(),
  }),
  landing_viewed: z.object({
    locale: z.string().optional(),
    referrer: z.string().optional(),
  }),
  dashboard_viewed: z.object({
    locale: z.string().optional(),
    hasQuickDive: z.boolean().optional(),
    hasDeepDive: z.boolean().optional(),
  }),
  login: z.object({
    locale: z.string().optional(),
  }),
  logout: z.object({
    locale: z.string().optional(),
  }),
  // Granular tracking — question-level & progress milestones
  question_answered: z.object({
    questionIndex: z.number(),
    timeOnQuestionMs: z.number(),
    moduleId: z.string().optional(),
    questionId: z.string().optional(),
    exploreMode: z.enum(["classic", "immersive"]).optional(),
    sessionId: z.string().optional(),
  }),
  progress_milestone: z.object({
    percentComplete: z.number(),
    sessionId: z.string().optional(),
    timeElapsedMs: z.number(),
    exploreMode: z.enum(["classic", "immersive"]).optional(),
  }),
  // Engagement depth signals
  coaching_prompt_shown: z.object({
    context: z.string().optional(),
    reportId: z.string().optional(),
    locale: z.string().optional(),
  }),
  // Feedback signals
  report_nps_submitted: z.object({
    reportId: z.string(),
    score: z.number(),
    hasFeedback: z.boolean().optional(),
  }),
  // Safety & wellbeing signals
  crisis_signal_detected: z.object({
    severity: z.enum(["low", "medium", "high"]).optional(),
    triggerPhrase: z.string().optional(),
  }),
  // Pipeline lifecycle (server-orchestrated assessment pipeline)
  pipeline_started: z.object({
    pipelineId: z.string(),
    assessmentId: z.string(),
  }),
  pipeline_completed: z.object({
    pipelineId: z.string(),
    assessmentId: z.string(),
  }),
  pipeline_step_failed: z.object({
    pipelineId: z.string(),
    step: z.string(),
    error: z.string().optional(),
    retryCount: z.number().optional(),
    // Error classification (post 2026-05 split). "transient" means we
    // retried up to MAX_PIPELINE_RETRIES; "validation" means we failed
    // fast at MAX_VALIDATION_RETRIES; "permanent" means no retry.
    errorClass: z.enum(["validation", "transient", "permanent"]).optional(),
  }),
  pipeline_retry_requested: z.object({
    pipelineId: z.string(),
    assessmentId: z.string(),
    /** retryCount at the moment the user clicked "restart analysis". */
    priorRetryCount: z.number().optional(),
    /** First 200 chars of the failed step's error message (for ops). */
    priorError: z.string().nullable().optional(),
  }),
  report_generation_requested: z.object({
    pipelineId: z.string(),
    assessmentId: z.string(),
  }),
  report_generation_failed: z.object({
    pipelineId: z.string().optional(),
    assessmentId: z.string().optional(),
    errorCode: z.string().optional(),
  }),
  prerequisite_gate_displayed: z.object({
    /** Gate feature key — matches GateFeature in lib/journey/prerequisite-gates.ts */
    feature: z.string(),
    /** User's current JourneyState when the gate rendered */
    currentState: z.string().optional(),
    /** Site locale at render time */
    locale: z.string().optional(),
  }),
  consent_submitted: z.object({
    /** Research cohort the user belongs to (e.g. thesis_2026) */
    cohort: z.string().optional(),
    /** Research group within the cohort (classic / immersive) */
    researchGroup: z.string().optional(),
    /** Site locale at consent time */
    locale: z.string().optional(),
  }),
  recruitment_landing_viewed: z.object({
    /** Where the click came from — UvA / linkedin / xiaohongshu / referral / direct */
    source: z.string().optional(),
    /** Invite code if the URL carried one (we DON'T log the code value itself) */
    hasInvite: z.boolean().optional(),
    /** Site locale at view time */
    locale: z.string().optional(),
  }),
  // Research assessment completion (T0/T1/T2) — #108. Records pre/post
  // conversion so the recruitment funnel isn't blind to assessment drop-off.
  pre_assessment_completed: z.object({
    researchGroup: z.string().optional(),
  }),
  post_immediate_completed: z.object({
    researchGroup: z.string().optional(),
  }),
  post_1week_completed: z.object({
    researchGroup: z.string().optional(),
  }),
} satisfies Record<FunnelEvent, z.ZodObject<z.ZodRawShape>>;

export type EventMetadata<T extends FunnelEvent> = z.infer<
  (typeof EventSchemas)[T]
>;

export function validateEventMetadata<T extends FunnelEvent>(
  event: T,
  metadata: unknown,
): z.infer<(typeof EventSchemas)[T]> | null {
  const result = EventSchemas[event].safeParse(metadata);
  return result.success
    ? (result.data as z.infer<(typeof EventSchemas)[T]>)
    : null;
}
