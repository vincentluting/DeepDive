// ============================================================
// Gate Copy Resolver
//
// Resolves a GateConfig + dictionary + render-time context into a
// fully-formed `GateCopy` object that the PrerequisiteGate component
// renders without further string handling.
//
// All translation lookup happens here so the component stays presentational.
// ============================================================

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { JOURNEY_STATES, type JourneyState } from "./state-machine";
import {
  GATE_CONFIG,
  type GateConfig,
  type GateFeature,
  type GateStep,
} from "./prerequisite-gates";

// ── GateCopy — display contract consumed by PrerequisiteGate ──
// Lives in lib/ (not components/) so dependency direction stays
// component → lib, not the other way around.
export interface GateCopy {
  /** e.g. "Step 4 of 5" — visible eyebrow text */
  readonly eyebrow: string;
  /** Main headline */
  readonly title: string;
  /** Explanatory body — 1-3 sentences */
  readonly body: string;
  /** Optional secondary line (e.g. "Available on May 28") */
  readonly meta?: string;
  /** Step key → visible display label */
  readonly stepLabels: Record<GateStep["key"], string>;
  /** Localized status labels for each step (done/blocked/pending) */
  readonly stepStatusLabels: {
    readonly done: string;
    readonly blocked: string;
    readonly pending: string;
  };
  /**
   * i18n template for per-step aria-label, e.g.
   *   "Step {{n}} of {{total}}: {{label}}, {{status}}"
   * Renderer interpolates n/total/label/status per step.
   */
  readonly stepAriaLabelTemplate: string;
  readonly primaryCtaLabel: string;
  readonly secondaryCtaLabel?: string;
  /** Aria label for the locked indicator (sr-only prefix) */
  readonly lockedAriaLabel: string;
}

/**
 * Render-time context. Each field is an optional interpolation token —
 * the helper interpolates `{{key}}` placeholders found in i18n strings.
 *
 * Add new fields here as you add new dynamic gates. Keep it shallow.
 */
export interface GateRenderContext {
  /** For post_assessment_too_early — formatted date string */
  readonly availableOn?: string;
  /** Generic catch-all for one-off interpolation tokens */
  readonly extra?: Record<string, string | number>;
}

export function resolveGateCopy({
  feature,
  dict,
  currentState,
  context = {},
}: {
  feature: GateFeature;
  dict: Dictionary;
  currentState: JourneyState;
  context?: GateRenderContext;
}): GateCopy {
  const config: GateConfig = GATE_CONFIG[feature];
  const gateDict = dict.journeyGate;
  if (!gateDict) {
    throw new Error(
      `journeyGate dictionary missing for feature "${feature}". ` +
        `Check lib/i18n/dictionaries/<locale>/journeyGate.json.`,
    );
  }
  const ns = gateDict[config.i18nNamespace];

  const interpolations = buildInterpolations(currentState, config, context);

  return {
    eyebrow: interpolate(gateDict.stepIndicator, interpolations),
    title: interpolate(ns.title, interpolations),
    body: interpolate(ns.body, interpolations),
    meta: ns.meta ? interpolate(ns.meta, interpolations) : undefined,
    stepLabels: gateDict.steps,
    stepStatusLabels: gateDict.stepStatus,
    stepAriaLabelTemplate: gateDict.stepAriaLabel,
    primaryCtaLabel: interpolate(ns.primaryCta, interpolations),
    secondaryCtaLabel: ns.secondaryCta
      ? interpolate(ns.secondaryCta, interpolations)
      : undefined,
    lockedAriaLabel: gateDict.nav.locked,
  };
}

/** Public helper — same interpolation used by the renderer. */
export function interpolateStepAriaLabel(
  template: string,
  values: {
    n: number;
    total: number;
    label: string;
    status: string;
  },
): string {
  return interpolate(template, values);
}

// ── Helpers ───────────────────────────────────────────────

function buildInterpolations(
  currentState: JourneyState,
  config: GateConfig,
  context: GateRenderContext,
): Record<string, string | number> {
  const blockedIdx = config.steps.findIndex(
    (s) => s.key === config.blockedStepKey,
  );
  const stepNumber = blockedIdx >= 0 ? blockedIdx + 1 : 1;
  const total = config.steps.length;
  const currentJourneyIdx = JOURNEY_STATES.indexOf(currentState);

  return {
    n: stepNumber,
    total,
    journeyIndex: currentJourneyIdx >= 0 ? currentJourneyIdx + 1 : 0,
    availableOn: context.availableOn ?? "",
    ...(context.extra ?? {}),
  };
}

/** Simple `{{key}}` interpolation. Missing keys render empty string. */
function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = values[k];
    return v == null ? "" : String(v);
  });
}
