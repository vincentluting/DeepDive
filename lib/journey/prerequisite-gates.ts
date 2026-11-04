// ============================================================
// Prerequisite Gates — Configuration Layer
//
// Each "gate feature" describes a business precondition that, when unmet,
// must show a PrerequisiteGate UI instead of a silent redirect.
//
// Architecture (see /Users/l/.claude/plans/buzzing-puzzling-meteor.md):
//   Layer 1: state-machine.ts (journey FSM) — single source of truth
//   Layer 2: this file (per-feature config)
//   Layer 3: components/journey/prerequisite-gate.tsx (rendering)
//   Layer 4: app/**/page.tsx (consumption)
//
// To add a new gate: append to GateFeature + GATE_CONFIG + i18n journeyGate.*
//
// i18n contract — for each feature, copy lives at
//   journeyGate[i18nNamespace] = { title, body, primaryCta, secondaryCta?, meta? }
// ============================================================

import type { JourneyState } from "./state-machine";

/** All gate-driven features. Append-only. */
export type GateFeature =
  | "action_hub"
  | "companions_cohort"
  | "companions_opt_in"
  | "companions_profile"
  | "deep_dive_needs_quick_dive"
  | "post_assessment_too_early"
  | "pipeline_failed";

/** Visual Surface the gate renders within. Maps to deepdive-design system. */
export type GateSurface = "sanctuary" | "revelation" | "utility";

/**
 * Journey progress step shown on the gate.
 * `state` ties each step to the FSM; null = aggregate/conceptual step.
 */
export interface GateStep {
  /** Stable key — used as i18n key (journeyGate.steps.<key>) */
  readonly key:
    | "quickDive"
    | "deepDive"
    | "profile"
    | "report"
    | "actionHub"
    | "coaching";
  /** Journey state this step represents (null = aggregate). */
  readonly state: JourneyState | null;
}

/** Default 5-step journey rendered on most gates. */
export const DEFAULT_JOURNEY_STEPS: ReadonlyArray<GateStep> = [
  { key: "quickDive", state: "quick_dive_complete" },
  { key: "deepDive", state: "deep_dive_complete" },
  { key: "profile", state: "profile_generated" },
  { key: "report", state: "report_generated" },
  { key: "actionHub", state: null },
] as const;

/** CTA descriptor. `href` is rendered as Next.js Link relative to locale. */
export interface GateCta {
  /** Path WITHOUT locale prefix; consumer prepends `/${locale}`. */
  readonly href: string;
}

/**
 * i18n namespace keys under `journeyGate.*`.
 * Each key must have a corresponding object in journeyGate.json.
 */
export type GateI18nNamespace =
  | "actionHub"
  | "companionsCohort"
  | "companionsOptIn"
  | "companionsProfile"
  | "deepDive"
  | "postAssessment"
  | "pipeline";

export interface GateConfig {
  /**
   * Required journey state for the gate to clear. null = non-journey
   * precondition (entitlement, time gate, pipeline state).
   */
  readonly requiredState: JourneyState | null;
  /** Steps shown in the progress visualization. */
  readonly steps: ReadonlyArray<GateStep>;
  /**
   * Key of the step the user is currently blocked on. Used to highlight
   * the right node in the progress bar.
   */
  readonly blockedStepKey: GateStep["key"];
  /** Primary action — the path forward. */
  readonly primaryCta: GateCta;
  /** Optional escape hatch (e.g. back to safe ground). */
  readonly secondaryCta?: GateCta;
  /** i18n namespace under journeyGate.<namespace>.* */
  readonly i18nNamespace: GateI18nNamespace;
  /** Visual surface for rendering. */
  readonly surface: GateSurface;
}

/**
 * Static configuration table. KEEP THIS FILE SERIALIZABLE — no runtime calls.
 * Any dynamic data (dates, names) is passed via gate-render-time context.
 */
export const GATE_CONFIG: Record<GateFeature, GateConfig> = {
  action_hub: {
    requiredState: "report_generated",
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "report",
    primaryCta: { href: "/profile" },
    // No secondaryCta — both paths previously pointed at /profile, which
    // gave the user a fake "choice." The single primary CTA is clearer.
    i18nNamespace: "actionHub",
    surface: "sanctuary",
  },
  companions_cohort: {
    requiredState: null,
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "report",
    primaryCta: { href: "/settings" },
    i18nNamespace: "companionsCohort",
    surface: "utility",
  },
  companions_opt_in: {
    requiredState: null,
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "report",
    primaryCta: { href: "/settings" },
    i18nNamespace: "companionsOptIn",
    surface: "utility",
  },
  companions_profile: {
    requiredState: null,
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "report",
    primaryCta: { href: "/settings" },
    i18nNamespace: "companionsProfile",
    surface: "utility",
  },
  deep_dive_needs_quick_dive: {
    requiredState: "quick_dive_complete",
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "quickDive",
    primaryCta: { href: "/quickdive" },
    secondaryCta: { href: "/explore" },
    i18nNamespace: "deepDive",
    surface: "revelation",
  },
  post_assessment_too_early: {
    requiredState: null,
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "actionHub",
    primaryCta: { href: "/dashboard" },
    i18nNamespace: "postAssessment",
    surface: "utility",
  },
  pipeline_failed: {
    requiredState: null,
    steps: DEFAULT_JOURNEY_STEPS,
    blockedStepKey: "profile",
    primaryCta: { href: "/dashboard" },
    // No secondaryCta — Settings has no clear "contact support" entry today,
    // so the second CTA would be a dead-end. The body copy directs persistent
    // failures to support inline.
    i18nNamespace: "pipeline",
    surface: "utility",
  },
} as const;

/** Type guard so consumers can validate a feature name from URL/query. */
export function isGateFeature(value: unknown): value is GateFeature {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(GATE_CONFIG, value)
  );
}
