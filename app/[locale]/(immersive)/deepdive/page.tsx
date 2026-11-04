import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { QuestionnaireShell } from "@/components/questionnaire/questionnaire-shell";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { getCurrentUser } from "@/lib/auth";
import { canAccess } from "@/lib/cohort/entitlements";
import { hasCompletedPre } from "@/lib/db/pre-post-assessment";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import { getCanonicalRiasec } from "@/lib/db/riasec-canonical";
import { resolveDeepDiveModules } from "@/lib/questionnaire/module-resolver";
import { getJourneyState } from "@/lib/db/journey";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  return {
    title: t.metadata.deepDiveTitle,
    description: t.metadata.deepDiveDescription,
  };
}

export default async function QuestionnairePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bypass?: string }>;
}) {
  const { locale } = await params;
  const { bypass } = await searchParams;

  // Let DB errors propagate to error.tsx rather than silently redirecting
  // logged-in users to register during transient DB outages.
  const user = await getCurrentUser();

  if (!user) {
    console.warn("[deepdive] No authenticated user — redirecting to register");
    redirect(`/${locale}/register?from=deepdive`);
  }

  // Entitlement gate — requires invite code with deepDive access
  // gate-redirect-ok: explore-hub already renders an `invite_required` banner
  // for this `?gate=` query param, so the user gets a clear explanation
  // immediately. TODO: migrate to <PrerequisiteGate> in the followups PR.
  if (!canAccess(user.cohort, "deepDive")) {
    redirect(`/${locale}/explore?gate=invite_required`);
  }

  // gate-redirect-ok: research-flow auto-routing — a research participant must
  // complete the T0 baseline (which carries informed consent) before Deep Dive.
  // Send them to the pre-assessment first, mirroring the Quick Dive gate so DD
  // cannot be used to bypass consent. TODO: migrate to <PrerequisiteGate> (#043).
  if (
    user.researchGroup &&
    canAccess(user.cohort, "researchSurveys") &&
    !(await hasCompletedPre(user.id))
  ) {
    redirect(`/${locale}/post-assessment?type=pre`);
  }

  // Fetch Quick Dive result and resolve modules in parallel.
  // QuickDive: getLatestQuickDiveByUserId returns null only when no row exists;
  // any thrown error means a real DB failure and must propagate to error.tsx
  // (matches the line 38-39 comment above — was previously silenced as null
  // which caused transient DB errors to look like "user never did Quick Dive").
  // Modules: failure is functional-degraded — fall back to all-modules default.
  const [qeResult, resolvedModules] = await Promise.all([
    getLatestQuickDiveByUserId(user.id),
    resolveDeepDiveModules(user.id).catch(() => ({
      // Fallback: include all modules if resolution fails
      includeRIASEC: false,
      includeModuleA: true,
      includeModuleB: true,
      includeModuleC: true,
      totalQuestions: 86,
      estimatedMinutes: 20,
    })),
  ]);

  // Gate: require Quick Dive completion before Deep Dive
  // bypass=true is dev-only — scoring requires RIASEC data from Quick Dive
  if (
    !qeResult &&
    !(bypass === "true" && process.env.NODE_ENV === "development")
  ) {
    console.warn(
      "[deepdive] No Quick Dive result — rendering PrerequisiteGate",
    );
    const [dict, journeyState] = await Promise.all([
      getDictionary(locale as Locale),
      getJourneyState(user.id).catch(() => "not_started" as const),
    ]);
    const copy = resolveGateCopy({
      feature: "deep_dive_needs_quick_dive",
      dict,
      currentState: journeyState,
    });
    // (immersive)/layout.tsx renders a skip link pointing at #main-content
    // but no <main> itself — each page provides one. Wrap the gate so the
    // skip-link target exists and the landmark tree stays valid.
    return (
      <main id="main-content">
        <PrerequisiteGate
          locale={locale as Locale}
          feature="deep_dive_needs_quick_dive"
          currentState={journeyState}
          copy={copy}
          userId={user.id}
        />
      </main>
    );
  }

  let quickDiveData: {
    riasecNormalized: Record<string, number>;
  } | null = null;

  // Compute 12-type archetype code from RIASEC scores (not the old single-letter code)
  let archetypeCode18: string | null = null;

  if (qeResult) {
    const { riasecNormalized, archetype } = getCanonicalRiasec(qeResult);
    archetypeCode18 = archetype.code; // e.g. "R-enhancement", "I-transcendence"
    quickDiveData = { riasecNormalized };
  }

  return (
    <ErrorBoundary>
      <QuestionnaireShell
        archetypeCode={archetypeCode18}
        quickDiveData={quickDiveData}
        resolvedModules={resolvedModules}
      />
    </ErrorBoundary>
  );
}
