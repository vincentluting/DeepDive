import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { ImmersiveExploreShell } from "@/components/immersive-explore/immersive-explore-shell";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { getCurrentUser } from "@/lib/auth/guards";
import { canAccess } from "@/lib/cohort/entitlements";
import { hasCompletedPre } from "@/lib/db/pre-post-assessment";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPostAssessmentHref } from "@/lib/pre-post-assessment/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const t = dict.quickDive as Record<string, string>;
  return {
    title: t.narrativeMetaTitle,
    description: t.narrativeMetaDesc,
  };
}

export default async function ImmersiveDivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Require authentication — immersive dive needs user commitment
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/register?from=immersive-dive`);
  }

  // Entitlement gate — requires invite code with immersiveDive access
  // gate-redirect-ok: cohort downgrade — user without the immersiveDive
  // entitlement automatically lands on Quick Dive, which they can use.
  // A Gate here would block a usable fallback. TODO: revisit when we
  // expose a "request invite" CTA in the followups PR.
  if (!canAccess(user.cohort, "immersiveDive")) {
    redirect(`/${locale}/quickdive`);
  }

  // Enforce research group: classic participants must use the classic mode
  // gate-redirect-ok: research-group routing — classic was assigned at
  // consent and must be used. Auto-routing, not user-correctable.
  if (user.researchGroup === "classic") {
    redirect(`/${locale}/quickdive`);
  }

  // Research gate: only users with researchSurveys entitlement need pre-assessment
  // gate-redirect-ok: research-flow auto-routing — sending the participant
  // directly to the pre-assessment form is more useful than gating with
  // a "you need to do X" page. TODO: upgrade to PrerequisiteGate in the
  // research-flow gate set (see silent-redirect-followups #4).
  if (
    user.researchGroup &&
    canAccess(user.cohort, "researchSurveys") &&
    !(await hasCompletedPre(user.id))
  ) {
    redirect(
      buildPostAssessmentHref({
        locale,
        type: "pre",
        redirect: `/${locale}/immersive-dive`,
      }),
    );
  }

  return (
    <main id="main-content" className="min-h-screen">
      <ErrorBoundary>
        <ImmersiveExploreShell locale={locale as Locale} />
      </ErrorBoundary>
    </main>
  );
}
