/**
 * Single source of truth for all funnel event names.
 *
 * ZERO DEPENDENCIES — this file intentionally imports nothing so that
 * both the DB layer (funnel.ts) and the validation layer (api-schemas.ts)
 * can import it without creating transitive dependency chains.
 *
 * To add a new event: add it here. The TypeScript type and Zod enum
 * both derive from this array automatically.
 */
export const FUNNEL_EVENTS = [
  "registered",
  "quickdive_started",
  "quickdive_completed",
  "quickdive_abandoned",
  "immersive_explore_started",
  "immersive_explore_completed",
  "immersive_exit_clicked",
  "deepdive_started",
  "deepdive_completed",
  "deepdive_abandoned",
  "profile_generated",
  "report_generated",
  "report_viewed",
  "report_reacted",
  "coaching_started",
  "coaching_completed",
  "share_clicked",
  "profile_viewed",
  "profile_tab_switched",
  "profile_cta_clicked",
  "profile_feedback_submitted",
  "profile_transparency_toggled",
  "action_hub_viewed",
  // Navigation & page views
  "landing_viewed",
  "dashboard_viewed",
  // Auth lifecycle
  "login",
  "logout",
  // Pre-funnel engagement events
  "intro_cta_clicked",
  "micro_feedback_shown",
  // Granular tracking — question-level & progress milestones
  "question_answered",
  "progress_milestone",
  // Engagement depth signals
  "coaching_prompt_shown",
  // Feedback signals
  "report_nps_submitted",
  // Safety & wellbeing signals
  "crisis_signal_detected",
  // Pipeline lifecycle (server-orchestrated assessment pipeline)
  "pipeline_started",
  "pipeline_completed",
  "pipeline_step_failed",
  "pipeline_retry_requested",
  "report_generation_requested",
  "report_generation_failed",
  // Prerequisite gate — user reached a feature whose preconditions weren't met.
  // Tracks "intent to use" so PM can size the demand behind locked features.
  "prerequisite_gate_displayed",
  // Research-flow funnel — first-time consent submission moment.
  // Distinct from `registered` because invite-only research users register
  // FIRST, then read consent on the next page. The gap between the two is
  // the consent-form abandonment rate (a key recruitment metric).
  "consent_submitted",
  // Recruitment landing view — segments traffic by source so we can compare
  // UvA / LinkedIn / 小红书 / referral channels.
  "recruitment_landing_viewed",
  // Research-flow assessment completion (T0/T1/T2) — fills the recruitment
  // funnel blind spot for pre/post conversion. Recorded at
  // /api/pre-post-assessment, queried by research-specific tooling (not in the
  // main acquisition FUNNEL_STEPS, same as consent_submitted).
  "pre_assessment_completed",
  "post_immediate_completed",
  "post_1week_completed",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
