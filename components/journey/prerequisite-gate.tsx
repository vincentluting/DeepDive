// ============================================================
// PrerequisiteGate — render gate when a feature's preconditions aren't met
//
// Replaces silent `redirect()` in page.tsx with an explained, navigable
// "you can't enter yet — here's why and where to go" UI.
//
// Surface-aware: visuals follow deepdive-design surface tokens.
//   - sanctuary  → Action Hub, Coaching gates (--sanc-*)
//   - revelation → Profile-anchored gates    (--rev-*)
//   - utility    → Companions, settings-style gates (default tokens)
//
// Server Component (no "use client") — fully SSR, links are real <a>.
// ============================================================

import Link from "next/link";
import { Lock, ChevronRight, Check } from "lucide-react";

import { JOURNEY_STATES, type JourneyState } from "@/lib/journey/state-machine";
import {
  GATE_CONFIG,
  type GateConfig,
  type GateFeature,
  type GateStep,
  type GateSurface,
} from "@/lib/journey/prerequisite-gates";
import {
  interpolateStepAriaLabel,
  type GateCopy,
} from "@/lib/journey/gate-copy";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import type { Locale } from "@/lib/i18n/config";

// GateCopy is re-exported so existing consumers (e.g. resolveGateCopy callers)
// can keep importing from this file. New code should prefer @/lib/journey/gate-copy.
export type { GateCopy };

export interface PrerequisiteGateProps {
  readonly locale: Locale;
  readonly feature: GateFeature;
  readonly currentState: JourneyState;
  readonly copy: GateCopy;
  /** Override config — defaults to GATE_CONFIG[feature]. */
  readonly config?: GateConfig;
  /** Userid for funnel telemetry — fire-and-forget. */
  readonly userId?: string | null;
}

export function PrerequisiteGate({
  locale,
  feature,
  currentState,
  copy,
  config = GATE_CONFIG[feature],
  userId = null,
}: PrerequisiteGateProps) {
  // Fire telemetry without awaiting — rendering must not block on tracking.
  trackFunnelEvent("prerequisite_gate_displayed", {
    userId,
    metadata: { feature, currentState, locale },
  }).catch(() => {});

  const surfaceClass = SURFACE_STYLES[config.surface];

  // Renders as <section>, not <main>, to keep the gate composable inside any
  // landmark structure. Most route group layouts already provide
  // `<main id="main-content">` ((app)/(report)/(marketing)). The (immersive)
  // group's layout ships only a skip link, so consumers there wrap the gate
  // in their own <main id="main-content"> — see deepdive/page.tsx,
  // post-assessment/page.tsx.
  return (
    <section
      aria-labelledby="prerequisite-gate-heading"
      className={`relative min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6 py-16 ${surfaceClass.bg}`}
    >
      {/* Sanctuary lantern glow — only rendered on sanctuary gates */}
      {config.surface === "sanctuary" && (
        <div
          className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 88% 6%, rgba(245,166,35,0.10), rgba(245,166,35,0.03) 35%, transparent 60%)",
            }}
          />
        </div>
      )}

      <article
        className={`relative z-10 w-full max-w-[560px] space-y-8 ${surfaceClass.text}`}
      >
        <header className="space-y-4">
          <p
            className={`flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] ${surfaceClass.eyebrow}`}
          >
            <Lock className="size-3.5" aria-hidden />
            {/* Visually-hidden prefix gives screen readers the "locked" context,
                visible eyebrow still reads "Step n of total". */}
            <span className="sr-only">{copy.lockedAriaLabel}.</span>
            <span>{copy.eyebrow}</span>
          </p>
          <h1
            id="prerequisite-gate-heading"
            className={`text-[clamp(1.875rem,4.5vw,2.5rem)] leading-[1.15] tracking-tight ${surfaceClass.title}`}
          >
            {copy.title}
          </h1>
          <p className={`text-[15.5px] leading-[1.6] ${surfaceClass.body}`}>
            {copy.body}
          </p>
          {copy.meta && (
            <p className={`text-[13.5px] italic ${surfaceClass.meta}`}>
              {copy.meta}
            </p>
          )}
        </header>

        <GateProgress
          steps={config.steps}
          blockedStepKey={config.blockedStepKey}
          currentState={currentState}
          stepLabels={copy.stepLabels}
          stepStatusLabels={copy.stepStatusLabels}
          stepAriaLabelTemplate={copy.stepAriaLabelTemplate}
          surfaceClass={surfaceClass}
        />

        <nav className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={`/${locale}${config.primaryCta.href}`}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-[14.5px] font-medium transition-colors ${surfaceClass.primaryBtn}`}
          >
            {copy.primaryCtaLabel}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          {config.secondaryCta && copy.secondaryCtaLabel && (
            <Link
              href={`/${locale}${config.secondaryCta.href}`}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-[14.5px] font-medium transition-colors ${surfaceClass.secondaryBtn}`}
            >
              {copy.secondaryCtaLabel}
            </Link>
          )}
        </nav>
      </article>
    </section>
  );
}

// ── Progress bar — 5 step horizontal trail ────────────────
function GateProgress({
  steps,
  blockedStepKey,
  currentState,
  stepLabels,
  stepStatusLabels,
  stepAriaLabelTemplate,
  surfaceClass,
}: {
  steps: ReadonlyArray<GateStep>;
  blockedStepKey: GateStep["key"];
  currentState: JourneyState;
  stepLabels: Record<GateStep["key"], string>;
  stepStatusLabels: GateCopy["stepStatusLabels"];
  stepAriaLabelTemplate: string;
  surfaceClass: SurfaceStyle;
}) {
  return (
    <ol
      className={`grid grid-cols-5 gap-2 border-t border-b py-5 ${surfaceClass.rule}`}
    >
      {steps.map((step, index) => {
        const status = deriveStepStatus(step, blockedStepKey, currentState);
        const label = stepLabels[step.key];
        // Localized aria-label — e.g. "Step 3 of 5: Profile, done" (en) /
        // "第 3 步 / 共 5 步: 个人档案, 已完成" (zh).
        const ariaLabel = interpolateStepAriaLabel(stepAriaLabelTemplate, {
          n: index + 1,
          total: steps.length,
          label,
          status: stepStatusLabels[status],
        });
        return (
          <li
            key={step.key}
            className="flex flex-col items-center gap-2"
            aria-label={ariaLabel}
            aria-current={status === "blocked" ? "step" : undefined}
          >
            <div
              className={`relative flex size-7 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${
                status === "done"
                  ? surfaceClass.stepDone
                  : status === "blocked"
                    ? surfaceClass.stepBlocked
                    : surfaceClass.stepPending
              }`}
              aria-hidden
            >
              {status === "done" ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span
              aria-hidden
              className={`text-center text-[10.5px] uppercase tracking-[0.12em] leading-tight ${
                status === "blocked" ? surfaceClass.title : surfaceClass.eyebrow
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ── Step status derivation ────────────────────────────────
type StepStatus = "done" | "blocked" | "pending";

function deriveStepStatus(
  step: GateStep,
  blockedStepKey: GateStep["key"],
  currentState: JourneyState,
): StepStatus {
  // Blocked step is always rendered as the active "you're here" node
  // regardless of journey progress (covers entitlement gates where
  // requiredState is null but we still want to point at a concept).
  if (step.key === blockedStepKey) return "blocked";

  if (step.state === null) {
    // Aggregate/conceptual step (e.g. "Action Hub") — done only if every
    // prior journey step is reached.
    return "pending";
  }

  const stepIdx = JOURNEY_STATES.indexOf(step.state);
  const currentIdx = JOURNEY_STATES.indexOf(currentState);
  return currentIdx >= stepIdx ? "done" : "pending";
}

// ── Surface styles — Tailwind class bundles per Surface ───
interface SurfaceStyle {
  bg: string;
  text: string;
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  rule: string;
  primaryBtn: string;
  secondaryBtn: string;
  stepDone: string;
  stepBlocked: string;
  stepPending: string;
}

const SURFACE_STYLES: Record<GateSurface, SurfaceStyle> = {
  sanctuary: {
    bg: "bg-[var(--sanc-salt)]",
    text: "text-[var(--sanc-ink)]",
    eyebrow: "text-[var(--sanc-ink-soft)]",
    title: "text-[var(--sanc-ink)] font-display-soft",
    body: "text-[var(--sanc-ink-soft)]",
    meta: "text-[var(--sanc-lantern)]",
    rule: "border-[var(--sanc-rule)]",
    primaryBtn:
      "bg-[var(--sanc-ink)] text-[var(--sanc-salt)] hover:bg-[var(--sanc-ink-soft)]",
    secondaryBtn:
      "border border-[var(--sanc-rule)] text-[var(--sanc-ink)] hover:bg-[var(--sanc-sand)]",
    stepDone: "bg-[var(--exec-green)] text-[var(--sanc-salt)]",
    stepBlocked:
      "bg-[var(--sanc-lantern)] text-[var(--sanc-ink)] ring-2 ring-[var(--sanc-lantern-soft)] ring-offset-2 ring-offset-[var(--sanc-salt)]",
    stepPending:
      "bg-transparent border border-[var(--sanc-rule)] text-[var(--sanc-ink-soft)]",
  },
  revelation: {
    bg: "bg-[var(--rev-paper)]",
    text: "text-[var(--rev-ink)]",
    eyebrow: "text-[var(--rev-ink-soft)]",
    title: "text-[var(--rev-ink)] font-serif",
    body: "text-[var(--rev-ink-soft)]",
    meta: "text-[var(--rev-signal-info)]",
    rule: "border-[var(--rev-rule)]",
    primaryBtn:
      "bg-[var(--rev-ink)] text-[var(--rev-paper)] hover:bg-[var(--rev-ink-soft)]",
    secondaryBtn:
      "border border-[var(--rev-rule)] text-[var(--rev-ink)] hover:bg-[var(--rev-paper-warm)]",
    stepDone: "bg-[var(--rev-signal-positive)] text-[var(--rev-paper)]",
    stepBlocked:
      "bg-[var(--rev-ink)] text-[var(--rev-paper)] ring-2 ring-[var(--rev-glow-cold)] ring-offset-2 ring-offset-[var(--rev-paper)]",
    stepPending:
      "bg-transparent border border-[var(--rev-rule)] text-[var(--rev-ink-soft)]",
  },
  utility: {
    bg: "bg-background",
    text: "text-foreground",
    eyebrow: "text-muted-foreground",
    title: "text-foreground",
    body: "text-muted-foreground",
    meta: "text-foreground/80",
    rule: "border-border",
    primaryBtn: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondaryBtn: "border border-border text-foreground hover:bg-accent",
    stepDone: "bg-primary text-primary-foreground",
    stepBlocked:
      "bg-foreground text-background ring-2 ring-primary ring-offset-2 ring-offset-background",
    stepPending: "bg-transparent border border-border text-muted-foreground",
  },
};
