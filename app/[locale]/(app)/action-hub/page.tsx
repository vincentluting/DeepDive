import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUserWithAdmin } from "@/lib/auth";
import { getUserContextOrCompute } from "@/lib/db/user-context";
import { getCachedProfile } from "@/lib/db/cached";
import { getExercises } from "@/lib/db/profiles";
import { getJourneyState } from "@/lib/db/journey";
import { resolveReportId } from "@/lib/journey/get-authoritative-report";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { pickLocaleText } from "@/lib/i18n/localize";
import {
  ActionBoard,
  type ActionItem,
  type Milestone,
} from "@/components/action-hub/action-board";
import { NonNegotiablesExercise } from "@/components/action-hub/non-negotiables-exercise";
import { FlowMomentsExercise } from "@/components/action-hub/flow-moments-exercise";
import { ProgressOverview } from "@/components/action-hub/progress-overview";
import {
  getActiveActionPlan,
  getActionItemsByPlan,
  getMilestonesByPlan,
  getReachedMilestones,
  type ActionCategory,
} from "@/lib/db/action-hub";
import {
  calculateDepth,
  getDepthZone,
} from "@/lib/exploration/depth-calculator";
import {
  normalizePlanPhase,
  summarizeActionProgress,
} from "@/lib/action-hub/guidance";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { ARCHETYPES } from "@/lib/content";
import ActionHubLoading from "./loading";

// ── Action Hub — Personalised action plan board ────────────

/** Fetch plan + items + milestones + progress in ONE pass (no duplicate DB calls). */
function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

async function fetchAllActionData(userId: string, locale: string) {
  try {
    const plan = await getActiveActionPlan(userId);
    if (!plan)
      return { plan: null, items: [], milestones: [], progressData: null };

    const [items, milestones, reachedMilestones, exploration] =
      await Promise.all([
        getActionItemsByPlan(plan.id),
        getMilestonesByPlan(plan.id),
        getReachedMilestones(userId, 10),
        import("@/lib/db/exploration-progress").then((m) =>
          m.getExplorationProgress(userId),
        ),
      ]);

    const completed = items.filter((i) => i.status === "completed");
    const stats = {
      actionsCompleted: completed.length,
      milestonesReached: reachedMilestones.length,
    };

    const events: Array<{
      type: string;
      title: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }> = [];

    for (const item of items) {
      if (item.completedAt) {
        events.push({
          type: "action_completed",
          title: item.title,
          timestamp: new Date(item.completedAt).toISOString(),
        });
      } else if (item.status === "in_progress") {
        events.push({
          type: "action_started",
          title: item.title,
          timestamp: new Date(item.updatedAt).toISOString(),
        });
      }
    }
    for (const m of reachedMilestones) {
      const ms = m as Record<string, unknown>;
      events.push({
        type: "milestone_reached",
        title: String(ms.title),
        timestamp: new Date(ms.reachedAt as string).toISOString(),
      });
    }

    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const depthResult = exploration
      ? calculateDepth(exploration.modules as Record<string, Date | null>)
      : { depthM: 0, completionPercent: 0 };
    const zone = getDepthZone(depthResult.depthM);
    const zoneName = pickLocaleText(zone.label, resolveLocale(locale));

    const progressData = {
      events,
      total: events.length,
      stats,
      depth: {
        depthM: depthResult.depthM,
        completionPercent: depthResult.completionPercent,
        zoneName,
      },
    };

    return { plan, items, milestones, progressData };
  } catch {
    return { plan: null, items: [], milestones: [], progressData: null };
  }
}

export default async function ActionHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reportId?: string }>;
}) {
  const { locale } = await params;
  const { reportId: reportIdParam } = await searchParams;
  const user = await getCurrentUserWithAdmin();
  if (!user) redirect(`/${locale}/login`);

  return (
    <Suspense fallback={<ActionHubLoading />}>
      <ActionHubContent
        userId={user.id}
        locale={locale}
        reportIdParam={reportIdParam}
      />
    </Suspense>
  );
}

// ── Heavy data fetching in a separate async component ────
async function ActionHubContent({
  userId,
  locale,
  reportIdParam,
}: {
  userId: string;
  locale: string;
  reportIdParam?: string;
}) {
  // ── Phase A — gate-decision data only ─────────────────
  // Fetch the minimum needed to decide whether to render the gate. Heavy
  // action-plan queries are deferred until after the gate clears, so users
  // without a report don't pay for queries whose result we'd discard.
  const [dict, ctx, journeyState] = await Promise.all([
    getDictionary(locale as Locale),
    getUserContextOrCompute(userId),
    getJourneyState(userId).catch(() => "not_started" as const),
  ]);

  const actionDict = dict.actionHub;

  // Resolve the authoritative report id (recovers stale UserContext).
  const { reportId } = await resolveReportId({
    userId,
    reportIdParam,
    latestReportIdFromContext: ctx.latestReportId,
    journeyState,
  });

  // gate-redirect-ok: previously a silent redirect to /profile; now an
  // explained prerequisite gate so the user understands the path forward.
  if (!reportId) {
    const copy = resolveGateCopy({
      feature: "action_hub",
      dict,
      currentState: journeyState,
    });
    return (
      <PrerequisiteGate
        locale={locale as Locale}
        feature="action_hub"
        currentState={journeyState}
        copy={copy}
        userId={userId}
      />
    );
  }

  // ── Phase B — heavy data fetch (only when gate cleared) ──
  const [profile, actionData, exercises] = await Promise.all([
    getCachedProfile(userId),
    fetchAllActionData(userId, locale),
    getExercises(userId).catch(() => null),
  ]);

  const archetypeCode = profile ? String(profile.archetype) : null;
  const archetype = archetypeCode ? ARCHETYPES[archetypeCode] : null;
  const archetypeLabel = archetype
    ? locale === "zh"
      ? archetype.label_zh
      : archetype.label_en
    : null;

  const { plan, items, milestones, progressData } = actionData;

  // Exercise completion drives the plan-tier banner + the "Exercises x/2"
  // mini-counter in progress-overview. Only the two tier-driving exercises
  // count here (energy-log is supplementary).
  const exerciseCompletion = {
    flow:
      !!exercises?.flowMoments?.completedAt &&
      exercises.flowMoments.moments.length === 3,
    nonNeg:
      !!exercises?.nonNegotiables?.completedAt &&
      exercises.nonNegotiables.selected.length === 3,
  };

  // Plan tier lives in ActionPlan.contextJson.tier (set by generateActionPlan).
  const planContext = (plan?.contextJson ?? {}) as Record<string, unknown>;
  const planTier =
    (planContext.tier as "lite" | "deep" | "personal" | undefined) ?? null;
  const planLlmEnriched = planContext.llmEnriched === true;

  // Detect if any exercise was completed AFTER the plan was generated.
  // If so, the plan is stale — nudge the user to regenerate.
  const exercisesUpdatedAfterPlan = !!(
    plan &&
    exercises &&
    ((exercises.nonNegotiables?.completedAt &&
      new Date(exercises.nonNegotiables.completedAt) > plan.createdAt) ||
      (exercises.flowMoments?.completedAt &&
        new Date(exercises.flowMoments.completedAt) > plan.createdAt) ||
      (exercises.energyLog?.completedAt &&
        new Date(exercises.energyLog.completedAt) > plan.createdAt))
  );

  // ── Hero telemetry — dashboard-style readout ──────────────
  // Day N: 1-indexed days since plan creation; 1 when no plan yet.
  // Clamp at 90 — beyond that a plan is stale and the number becomes absurd
  // ("Day 731"). Plans older than 90d should be regenerated anyway.
  const rawDayN = plan
    ? Math.max(
        1,
        Math.floor((Date.now() - plan.createdAt.getTime()) / 86400000) + 1,
      )
    : 1;
  const dayN = Math.min(rawDayN, 90);
  const planIsStale = rawDayN > 90;
  const itemsTyped = (items as Array<Record<string, unknown>>).map(
    (item, index) => ({
      id: String(item.id),
      status: String(item.status),
      category: String(item.category),
      priority: Number(item.priority ?? 0),
      planPhase: normalizePlanPhase(
        typeof item.planPhase === "number" ? item.planPhase : null,
        index,
      ),
    }),
  );
  const itemsTotal = itemsTyped.length;
  const itemsCompleted = itemsTyped.filter(
    (i) => i.status === "completed",
  ).length;
  const progressSummary = summarizeActionProgress(itemsTyped);

  const milestonesTyped = milestones as Array<{ status: string }>;
  const milestonesTotal = milestonesTyped.length;
  // Clamp reached to total — defends against DB inconsistencies (seed races,
  // manual edits) that would otherwise render "7/5 milestones" in the Hero.
  const milestonesReached = Math.min(
    milestonesTyped.filter((m) => m.status === "reached").length,
    milestonesTotal,
  );

  // Next active/pending category (for "next — Explore" stat)
  const nextItem =
    itemsTyped.find((i) => i.status === "in_progress") ??
    itemsTyped.find((i) => i.status === "pending");
  const nextCategoryKey = nextItem?.category ?? null;
  // Prefer the translated dimension label; fall back to the raw category key
  // (title-cased) so the Keystone attribution row always has content even if
  // the dictionary is missing this category — never silently disappear.
  const categoryLabel = nextCategoryKey
    ? (actionDict.categories[nextCategoryKey] ??
      nextCategoryKey.charAt(0).toUpperCase() + nextCategoryKey.slice(1))
    : null;

  const heroDict = actionDict.hero;
  const eyebrowText = heroDict
    ? dayN === 1
      ? (heroDict.eyebrowFirstDay ??
        heroDict.eyebrow.replace("{{day}}", String(dayN)))
      : heroDict.eyebrow.replace("{{day}}", String(dayN))
    : "";
  const heroTitle = heroDict
    ? archetypeLabel
      ? heroDict.titleWithArchetype.replace("{{archetype}}", archetypeLabel)
      : heroDict.titleNoArchetype
    : actionDict.title;

  // Mono stat row — three terse data points, separated by middle dots.
  const statParts: string[] = [];
  if (heroDict) {
    if (actionDict.progressModel) {
      statParts.push(
        actionDict.progressModel.phaseLabel
          .replace("{{current}}", String(progressSummary.currentPhase))
          .replace("{{total}}", String(progressSummary.totalPhases)),
      );
      statParts.push(
        actionDict.progressModel.countLabel
          .replace("{{completed}}", String(progressSummary.completed))
          .replace("{{total}}", String(progressSummary.total)),
      );
    }
    if (milestonesTotal > 0) {
      statParts.push(
        heroDict.statMilestones
          .replace("{{reached}}", String(milestonesReached))
          .replace("{{total}}", String(milestonesTotal)),
      );
    } else {
      statParts.push(heroDict.statNoMilestones);
    }
    if (categoryLabel) {
      statParts.push(
        heroDict.statNextCategory.replace("{{category}}", categoryLabel),
      );
    } else if (itemsTotal > 0 && itemsCompleted === itemsTotal) {
      statParts.push(heroDict.statAllDone);
    }
  }
  const sectionLabels = actionDict.sectionLabels;

  trackFunnelEvent("action_hub_viewed", {
    userId,
    metadata: { locale, hasReport: !!reportId },
  }).catch(() => {});

  return (
    <main className="dd-action-hub-page relative mx-auto w-full max-w-[1360px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16 space-y-12">
      {/* Ambient field — light reads as noon ledger, dark as instrument table. */}
      <div
        className="dd-action-hub-ambient fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        aria-hidden="true"
      />

      {/* Hero — dashboard readout: eyebrow / archetype.title / mono stats */}
      <header className="dd-action-hero">
        {eyebrowText && (
          <p className="font-eyebrow text-[var(--md-gold-text)]">
            {eyebrowText}
          </p>
        )}
        <h1 className="font-display-soft text-[clamp(2.75rem,7vw,4.5rem)] text-[var(--sanc-ink)]">
          {heroTitle}
        </h1>
        <p className="font-serif-italic text-[clamp(1rem,2vw,1.35rem)] text-[var(--sanc-ink-soft)]">
          {actionDict.subtitle}
        </p>
        {statParts.length > 0 && (
          <div className="dd-action-stat-rail font-stat">
            {statParts.map((part, i) => (
              <span key={i} className="inline-flex items-baseline gap-3">
                {i > 0 && (
                  <span aria-hidden className="text-[var(--sanc-ink-soft)]/45">
                    ·
                  </span>
                )}
                <span>{part}</span>
              </span>
            ))}
            {planIsStale && heroDict?.statStale && (
              <span className="inline-flex items-baseline gap-3">
                <span aria-hidden className="text-[var(--sanc-ink-soft)]/45">
                  ·
                </span>
                <span className="font-eyebrow text-[var(--exec-red)]">
                  {heroDict.statStale}
                </span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Keystone + Pathway + Ledger (theme-aware inside ActionBoard). */}
      <section>
        <ActionBoard
          dict={actionDict}
          locale={locale}
          reportId={reportId}
          initialPlan={
            plan
              ? { id: plan.id, createdAt: plan.createdAt.toISOString() }
              : null
          }
          initialItems={
            (items as Array<Record<string, unknown>>).map((raw) => ({
              id: String(raw.id),
              title: String(raw.title),
              description: (raw.description as string | null) ?? null,
              category: String(raw.category) as ActionCategory,
              intensity: String(raw.intensity),
              status: String(raw.status),
              priority: Number(raw.priority ?? 0),
              estimatedMinutes:
                typeof raw.estimatedMinutes === "number"
                  ? raw.estimatedMinutes
                  : null,
              sourceDimension: (raw.sourceDimension as string | null) ?? null,
              planPhase:
                typeof raw.planPhase === "number" ? raw.planPhase : null,
              recommendationReason:
                (raw.recommendationReason as string | null) ?? null,
              completionOutcome:
                (raw.completionOutcome as string | null) ?? null,
              completedAt:
                raw.completedAt instanceof Date
                  ? raw.completedAt.toISOString()
                  : typeof raw.completedAt === "string"
                    ? raw.completedAt
                    : null,
              matchedNonNegotiable:
                (raw.matchedNonNegotiable as string | null) ?? null,
              matchedFlowDimension:
                (raw.matchedFlowDimension as {
                  activity?: string;
                  social?: string;
                  environment?: string;
                } | null) ?? null,
            })) as ActionItem[]
          }
          initialMilestones={
            (milestones as Array<Record<string, unknown>>).map((raw) => ({
              id: String(raw.id),
              title: String(raw.title),
              description: (raw.description as string | null) ?? null,
              targetDay: Number(raw.targetDay ?? 0),
              status: String(raw.status),
              reachedAt:
                raw.reachedAt instanceof Date
                  ? raw.reachedAt.toISOString()
                  : typeof raw.reachedAt === "string"
                    ? raw.reachedAt
                    : null,
            })) as Milestone[]
          }
          initialShowExerciseNudge={exercisesUpdatedAfterPlan}
          planTier={planTier}
          planLlmEnriched={planLlmEnriched}
          exerciseCompletion={exerciseCompletion}
        />
      </section>

      {/* 02 · Telemetry */}
      {progressData && progressData.total > 0 && (
        <section className="space-y-4">
          <SectionLabel
            index="02"
            label={actionDict.progress?.title ?? "Telemetry"}
          />
          <ProgressOverview
            dict={actionDict}
            locale={locale}
            data={progressData}
            exerciseCompletion={exerciseCompletion}
            exerciseSectionId="exercises-section"
          />
        </section>
      )}

      {/* 03 · Exercises */}
      {actionDict.exercises && (
        <section id="exercises-section" className="space-y-5 scroll-mt-20">
          <SectionLabel
            index="03"
            label={sectionLabels?.exercises ?? actionDict.exercises.title}
          />
          <NonNegotiablesExercise
            dict={actionDict.exercises.nonNegotiables}
            errors={actionDict.errors}
            initialResult={exercises?.nonNegotiables ?? null}
          />
          <FlowMomentsExercise
            dict={actionDict.exercises.flowMoments}
            errors={actionDict.errors}
            initialResult={exercises?.flowMoments ?? null}
          />
        </section>
      )}
    </main>
  );
}

// ── Section Label — terminal/editorial numbered divider ────
function SectionLabel({ index, label }: { index: string; label: string }) {
  // Renders visually as "01 — Actions" but exposed to screen readers as a
  // proper level-2 heading with semantic content "Section 1: Actions".
  return (
    <h2
      className="flex items-baseline gap-3 border-t border-[var(--sanc-rule)] pt-5 m-0 font-normal"
      aria-label={`Section ${Number(index)}: ${label}`}
    >
      <span
        aria-hidden
        className="font-eyebrow tabular-nums text-[var(--exec-green)]"
      >
        {index}
      </span>
      <span aria-hidden className="text-[var(--sanc-ink-soft)]/45 text-xs">
        —
      </span>
      <span aria-hidden className="font-eyebrow text-[var(--sanc-ink-soft)]">
        {label}
      </span>
    </h2>
  );
}
