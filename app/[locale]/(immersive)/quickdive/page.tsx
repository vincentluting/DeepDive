import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ClassicExploreShell } from "@/components/quickdive/classic-explore-shell";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { getCurrentUser } from "@/lib/auth/guards";
import { hasCompletedPre } from "@/lib/db/pre-post-assessment";
import { canAccess } from "@/lib/cohort/entitlements";
import { redirect } from "next/navigation";

interface QuickDivePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: QuickDivePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  return {
    title: t.metadata.quickDiveTitle,
    description: t.metadata.quickDiveDescription,
  };
}

export default async function QuickDivePage({ params }: QuickDivePageProps) {
  const { locale } = await params;

  // Enforce research group: immersive participants must use the immersive mode
  const user = await getCurrentUser();
  // gate-redirect-ok: research-group routing — the participant was assigned
  // immersive mode at consent and must use it. Auto-routing, not a
  // user-correctable precondition.
  if (user?.researchGroup === "immersive") {
    redirect(`/${locale}/immersive-dive`);
  }

  // Research gate: only users with researchSurveys entitlement need pre-assessment
  // gate-redirect-ok: research-flow auto-routing — sending the participant
  // directly to the pre-assessment form is more useful than gating with
  // a "you need to do X" page. TODO: upgrade to PrerequisiteGate when we
  // ship the research-flow gate set (see silent-redirect-followups #4).
  if (
    user?.researchGroup &&
    canAccess(user.cohort, "researchSurveys") &&
    !(await hasCompletedPre(user.id))
  ) {
    redirect(`/${locale}/post-assessment?type=pre`);
  }

  return (
    <main
      id="main-content"
      className="sunlit-field min-h-screen"
      data-surface="dive"
    >
      <ErrorBoundary>
        <ClassicExploreShell locale={locale as Locale} />
      </ErrorBoundary>
    </main>
  );
}
