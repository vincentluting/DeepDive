// PersonalityShadow — "A Capability You're Probably Underestimating"
// V2 (2026-05-09): 3-section layout (what+why / how-you-know / how-to-use)
// + folded disclosures. Reframes Jungian "shadow" as an underestimated capability.
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PersonalProfileData, ShadowInsight } from "@/lib/types";
import { computeShadowInsights } from "@/lib/profile-generation/shadow-algorithm";
import { DOMAIN_LABELS } from "@/lib/content/shadow-content";
import {
  SHADOW_PANEL_V2,
  renderObservableSignals,
  type PanelLocaleText,
} from "@/lib/content/shadow-panel-v2";
import { getArchetypeContent } from "@/lib/content";
import { SCHWARTZ_VALUE_LABELS } from "@/lib/scoring/constants";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import { getCareerContextLabel } from "@/lib/data/career-context-labels";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";

interface PersonalityShadowProps {
  profile: PersonalProfileData;
  locale: string;
  /** Optional: career drain direction label to cross-reference (e.g. "Sales Manager") */
  careerDrainDirection?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Approximate percentile from a 0-100 normalized Big Five score.
 * For neuroticism the "shadow" gift sits at the HIGH end (heightened sensitivity),
 * so percentile is `score` itself. For other domains the gift sits at the LOW end,
 * so we report `100 - score` ("more reserved than X% of people").
 */
function shadowPercentile(
  domain: ShadowInsight["domain"],
  score: number,
): number {
  const raw = domain === "neuroticism" ? score : 100 - score;
  return Math.max(1, Math.min(99, Math.round(raw)));
}

/**
 * The trait label that names the user's actual side of the spectrum
 * (high end for neuroticism, low end for others).
 */
function traitLabelForShadow(insight: ShadowInsight): {
  en: string;
  zh: string;
} {
  return insight.domain === "neuroticism"
    ? insight.spectrumHighLabel
    : insight.spectrumLowLabel;
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: spectrum bar (kept; rendered inside the folded "details" disclosure)
// ────────────────────────────────────────────────────────────────────────────
function SpectrumBar({
  score,
  domain,
  lowLabel,
  highLabel,
  locale,
}: {
  score: number;
  domain: string;
  lowLabel: { en: string; zh: string };
  highLabel: { en: string; zh: string };
  locale: Locale;
}) {
  const position = Math.max(4, Math.min(96, score));
  const isNeuroticism = domain === "neuroticism";

  return (
    <div className="mt-3 mb-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] text-rev-ink-soft uppercase tracking-wide">
          {pickLocaleText(lowLabel, locale)}
        </span>
        <span className="text-[10px] text-rev-ink-soft">{score}/100</span>
        <span className="text-[10px] text-rev-ink-soft uppercase tracking-wide">
          {pickLocaleText(highLabel, locale)}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-rev-paper-warm border border-rev-rule border-l-2 border-l-rev-glow-warm">
        {isNeuroticism ? (
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-full rounded-r-full bg-rev-glow-warm/25"
            style={{ width: "50%" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full rounded-l-full bg-rev-glow-warm/25"
            style={{ width: "50%" }}
          />
        )}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rev-glow-warm border-2 border-rev-paper "
          style={{ left: `calc(${position}% - 5px)` }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: collapsible disclosure
// ────────────────────────────────────────────────────────────────────────────
function Disclosure({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-rev-rule">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-rev-paper-warm transition-colors"
        aria-expanded={open}
      >
        <span className="text-[11px] text-rev-ink-soft font-medium">
          {label}
        </span>
        <span className="text-[10px] text-rev-ink-soft/80">
          {open ? "↑" : "↓"}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-rev-rule/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-component: one shadow insight card (V2 — 3 sections + folded disclosures)
// ────────────────────────────────────────────────────────────────────────────
function ShadowCardV2({
  insight,
  locale,
  t,
  careerDrainDirection,
}: {
  insight: ShadowInsight;
  locale: Locale;
  t: Record<string, string>;
  careerDrainDirection?: string;
}) {
  const panelContent = SHADOW_PANEL_V2[insight.domain];
  const domainLabel = DOMAIN_LABELS[insight.domain];
  const trait = traitLabelForShadow(insight);
  const percentile = shadowPercentile(insight.domain, insight.score);
  const pickText = (lt: PanelLocaleText): string => pickLocaleText(lt, locale);

  // Section 1 strings
  const percentileLine = interpolate(
    t.shadowPercentileFraming ??
      "Your score on {{domain}} is {{score}} — more {{highTrait}} than {{percentile}}% of people.",
    {
      domain: pickLocaleText(domainLabel, locale),
      score: insight.score.toFixed(1),
      highTrait: pickLocaleText(trait, locale),
      percentile,
    },
  );
  const whyUnderestimate = pickText(panelContent.whyYouUnderestimate);
  const capabilityName = pickText(panelContent.capabilityName);

  // Section 2 strings
  const signalLines = renderObservableSignals(panelContent, pickText);
  const signalSummary = pickText(panelContent.signalSummary);

  // Section 3 strings
  const ta = panelContent.takeAways;
  const tensionDesc = insight.tensionWith
    ? getLocalizedField(insight.tensionWith, "description", locale)
    : undefined;

  return (
    <div className="rounded-[4px] border border-rev-rule border-l-2 border-l-rev-glow-warm bg-rev-paper-warm overflow-hidden">
      {/* Domain → Capability name header */}
      <div className="px-4 pt-4 pb-3 border-b border-rev-rule/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-rev-ink-soft uppercase tracking-[0.12em]">
            {pickLocaleText(domainLabel, locale)}
          </span>
          <span className="text-rev-glow-warm/50 text-xs">→</span>
          <span className="text-xs font-semibold text-rev-ink tracking-wide">
            {capabilityName}
          </span>
        </div>
      </div>

      {/* ─── Section 1: What it is + why it's you ─── */}
      <section className="px-4 pt-4 pb-5 space-y-3">
        <p className="text-[10px] font-medium text-rev-glow-warm uppercase tracking-[0.15em]">
          {t.shadowSection1Label ?? "What it is + why it's you"}
        </p>
        <p className="text-sm text-rev-ink leading-relaxed">{percentileLine}</p>
        <p className="text-sm text-rev-ink leading-relaxed">
          {whyUnderestimate}
        </p>
        <p className="text-sm text-rev-ink/85 leading-relaxed italic">
          {(t.shadowCapabilityLabel ?? "This capability, we call it") +
            " 「" +
            capabilityName +
            "」"}
        </p>
      </section>

      {/* ─── Section 2: How you know this is you ─── */}
      <section className="px-4 pt-4 pb-5 space-y-3 border-t border-rev-rule/50 bg-rev-paper">
        <p className="text-[10px] font-medium text-rev-glow-warm uppercase tracking-[0.15em]">
          {t.shadowSection2Label ?? "How you know this is you"}
        </p>
        <p className="text-sm text-rev-ink-soft leading-relaxed">
          {t.shadowSection2Hook ??
            "The signals below — most people who have this capability have lived through them."}
        </p>
        <ul className="space-y-2.5 list-none pl-0">
          {signalLines.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-rev-ink leading-relaxed"
            >
              <span
                className="mt-2 w-1 h-1 rounded-full bg-rev-glow-warm/70 shrink-0"
                aria-hidden="true"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-rev-ink/85 leading-relaxed italic pt-1">
          {signalSummary}
        </p>
      </section>

      {/* ─── Section 3: How to use it ─── */}
      <section className="px-4 pt-4 pb-5 space-y-4 border-t border-rev-rule/50">
        <p className="text-[10px] font-medium text-rev-glow-warm uppercase tracking-[0.15em]">
          {t.shadowSection3Label ?? "How to use it (and what to avoid)"}
        </p>

        <TakeAwayRow
          label={t.shadowResumeFramingLabel ?? "On a résumé"}
          body={pickText(ta.resumeFraming)}
        />
        <TakeAwayRow
          label={t.shadowInterviewStoryLabel ?? "In an interview"}
          body={pickText(ta.interviewStory)}
        />

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-rev-ink/90">
            {t.shadowSelectRolesContext ?? "When choosing your next role"}
          </p>
          <div className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="text-rev-signal-positive font-medium shrink-0">
              ✓ {t.shadowSeekRolesLabel ?? "Look for"}:
            </span>
            <span className="text-rev-ink-soft">{pickText(ta.seekRoles)}</span>
          </div>
          <div className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="text-rev-signal-attention font-medium shrink-0">
              ✗ {t.shadowAvoidRolesLabel ?? "Avoid"}:
            </span>
            <span className="text-rev-ink-soft">{pickText(ta.avoidRoles)}</span>
          </div>
        </div>

        <TakeAwayRow
          label={t.shadowSelfCheckLabel ?? "A question to ask yourself"}
          body={pickText(ta.selfCheckQuestion)}
        />
      </section>

      {/* ─── Folded: Career contexts (advantageousContexts + per-context explanations) ─── */}
      <Disclosure
        label={interpolate(
          t.shadowAdvancedToggle ??
            "Career contexts where this is an advantage ({{count}})",
          { count: panelContent.careerExplanations.length },
        )}
      >
        <div className="pt-3 space-y-2.5">
          {panelContent.careerExplanations.map(
            ({ contextKey, explanation }) => (
              <div
                key={contextKey}
                className="flex flex-col gap-0.5 py-1.5 border-b border-rev-rule/30 last:border-0"
              >
                <span className="text-xs font-medium text-rev-glow-warm">
                  {getCareerContextLabel(contextKey, locale)}
                </span>
                <span className="text-xs text-rev-ink-soft leading-relaxed pl-1">
                  「{pickText(explanation)}」
                </span>
              </div>
            ),
          )}
        </div>
      </Disclosure>

      {/* ─── Folded: Score detail + spectrum bar ─── */}
      <Disclosure label={t.shadowDetailsToggle ?? "Score detail + spectrum"}>
        <div className="pt-3">
          <SpectrumBar
            score={insight.score}
            domain={insight.domain}
            lowLabel={insight.spectrumLowLabel}
            highLabel={insight.spectrumHighLabel}
            locale={locale}
          />
        </div>
      </Disclosure>

      {/* Cross-framework tension (always visible — important signal) */}
      {insight.tensionWith && tensionDesc && (
        <div className="px-4 py-3 border-t border-rev-signal-attention/30 bg-rev-paper-warm">
          <p className="text-[10px] font-medium text-rev-signal-attention/80 uppercase tracking-[0.12em] mb-1">
            {t.shadowTensionLabel ?? "Identity Tension"}{" "}
            <span className="normal-case font-normal text-rev-signal-attention/60">
              ({insight.tensionWith.dimension})
            </span>
          </p>
          <p className="text-xs text-rev-ink-soft leading-relaxed">
            {tensionDesc}
          </p>
        </div>
      )}

      {/* Career drain cross-reference (preserved) */}
      {careerDrainDirection && (
        <div className="px-4 py-2.5 border-t border-rev-rule bg-rev-paper-warm">
          <p className="text-xs text-rev-ink-soft leading-relaxed italic">
            {interpolate(
              t.shadowDrainConnection ??
                "This is also why {direction} would be especially draining",
              { direction: careerDrainDirection },
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// Small row for take-aways (label + body)
function TakeAwayRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-rev-ink/90">{label}</p>
      <p className="text-sm text-rev-ink-soft leading-relaxed">{body}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main exported component
// ────────────────────────────────────────────────────────────────────────────
export function PersonalityShadow({
  profile,
  locale,
  careerDrainDirection,
}: PersonalityShadowProps) {
  const loc = isValidLocale(locale) ? locale : defaultLocale;
  const t = getDictionaryClient(loc).profile;

  const shadowInsights =
    profile.shadowInsights ?? computeShadowInsights(profile);
  const hasShadows = shadowInsights.shadows.length > 0;
  const overallPattern = getLocalizedField(
    shadowInsights,
    "overallPattern",
    loc,
  );

  const archetypeCode = profile.archetype.code;
  const archetypeContent = getArchetypeContent(archetypeCode);
  const growthEdges = archetypeContent?.growthEdges ?? [];

  const { schwartzAnchors } = profile;
  const conflictPair = schwartzAnchors.conflictPair;
  let conflictValue1Label: { zh?: string; en?: string } | undefined;
  let conflictValue2Label: { zh?: string; en?: string } | undefined;
  const conflictValues = getSchwartzConflictValues(conflictPair);
  if (conflictValues) {
    const [firstValue, secondValue] = conflictValues;
    conflictValue1Label = SCHWARTZ_VALUE_LABELS[firstValue];
    conflictValue2Label = SCHWARTZ_VALUE_LABELS[secondValue];
  }
  const hasConflict =
    conflictPair && conflictValue1Label && conflictValue2Label;
  const isBoundary = profile.archetype.isBoundary;

  return (
    <div className="relative">
      {/* Header — new framing */}
      <div className="pb-4 mb-4 border-b border-rev-rule border-l-2 border-l-rev-glow-warm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-rev-ink tracking-wide">
              {t.personalityShadowTitle}
            </h3>
            <p className="text-xs text-rev-ink-soft mt-0.5 leading-relaxed">
              {t.personalityShadowSubtitle}
            </p>
          </div>
          {isBoundary && (
            <span className="text-[10px] px-2 py-1 rounded-md bg-rev-paper text-rev-glow-warm border border-rev-rule border-l-2 border-l-rev-glow-warm shrink-0">
              {t.boundaryArchetypeBadge}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {hasShadows ? (
          <>
            {/* Concept card — explains "what is shadow?" before any specific dimension */}
            <div className="rounded-[4px] border border-rev-rule border-l-2 border-l-rev-glow-warm bg-rev-paper-warm/70 p-4 space-y-2">
              <p className="text-[11px] font-semibold text-rev-glow-warm uppercase tracking-[0.15em]">
                {t.shadowConceptCardTitle ?? "What is the shadow?"}
              </p>
              <p className="text-sm text-rev-ink leading-relaxed">
                {t.shadowConceptCardBody1}
              </p>
              <p className="text-sm text-rev-ink-soft leading-relaxed">
                {t.shadowConceptCardBody2}
              </p>
              <p className="text-sm text-rev-ink-soft leading-relaxed pt-1">
                {interpolate(
                  t.shadowConceptCardBody3 ??
                    "The {{count}} dimension(s) below are what the algorithm found in your data.",
                  { count: shadowInsights.shadows.length },
                )}
              </p>
            </div>

            {overallPattern && (
              <div>
                <p className="text-[10px] font-medium text-rev-ink-soft uppercase tracking-[0.15em] mb-2">
                  {t.shadowOverallPattern ?? "Your pattern"}
                </p>
                <p className="text-sm text-rev-ink/90 leading-relaxed italic">
                  {overallPattern}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {shadowInsights.shadows.map((insight) => (
                <ShadowCardV2
                  key={insight.domain}
                  insight={insight}
                  locale={loc}
                  t={t}
                  careerDrainDirection={careerDrainDirection}
                />
              ))}
            </div>
          </>
        ) : (
          /* Fallback: legacy growth edges for profiles without bigFiveScores */
          growthEdges.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-rev-ink-soft uppercase tracking-[0.15em] mb-3">
                {t.growthEdgesLabel}
              </p>
              <div className="space-y-3">
                {growthEdges.map((edge, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rev-glow-warm mt-1.5 shrink-0" />
                    <p className="text-sm text-rev-ink leading-relaxed">
                      {pickLocaleText(edge, loc)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Value conflict (preserved) */}
        {hasConflict && (
          <div>
            <p className="text-[10px] font-medium text-rev-ink-soft uppercase tracking-[0.15em] mb-3">
              {t.innerTensionsLabel}
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 p-3.5 rounded-[4px] bg-rev-paper-warm border border-rev-rule ">
                <span className="text-sm text-rev-ink font-medium">
                  {pickLocaleText(
                    conflictValue1Label as { en: string; zh: string },
                    loc,
                  )}
                </span>
                <span className="text-rev-glow-warm text-sm">{"⟷"}</span>
                <span className="text-sm text-rev-ink font-medium">
                  {pickLocaleText(
                    conflictValue2Label as { en: string; zh: string },
                    loc,
                  )}
                </span>
                {schwartzAnchors.conflictStatus && (
                  <span className="ml-auto text-xs text-rev-ink-soft">
                    {schwartzAnchors.conflictStatus === "confirmed"
                      ? t.conflictStatusConfirmed
                      : schwartzAnchors.conflictStatus === "managed"
                        ? t.conflictStatusManaged
                        : t.conflictStatusResolved}
                  </span>
                )}
                {!schwartzAnchors.conflictStatus && (
                  <span className="ml-auto text-xs text-rev-ink-soft">
                    {t.conflictStatusSimultaneous}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-rev-ink-soft mt-2.5 leading-relaxed">
              {t.valueConflictExplanation}
            </p>
          </div>
        )}

        {/* Boundary signal (folded by default to declutter; only when no value conflict shown above) */}
        {isBoundary && !hasConflict && (
          <div>
            <p className="text-[10px] font-medium text-rev-ink-soft uppercase tracking-[0.15em] mb-3">
              {t.identityBoundarySignalLabel}
            </p>
            <div className="p-3.5 rounded-[4px] bg-rev-paper-warm border border-rev-rule ">
              <p className="text-sm text-rev-ink leading-relaxed">
                {interpolate(t.boundaryArchetypeExplanation, {
                  archetypeLabel: getLocalizedField(
                    profile.archetype,
                    "label",
                    loc,
                  ),
                })}
              </p>
            </div>
          </div>
        )}

        {/* Footer note (reframed) */}
        <div className="pt-3 border-t border-rev-rule border-l-2 border-l-rev-glow-warm">
          <p className="text-xs text-rev-ink-soft leading-relaxed italic">
            {t.shadowFootnote}
          </p>
        </div>
      </div>
    </div>
  );
}
