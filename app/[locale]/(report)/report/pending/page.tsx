import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { getProfileByAssessment } from "@/lib/db/profiles";
import type { PersonalProfileData } from "@/lib/types";
import PendingReportClient from "./pending-report-client";

function readFirst(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function PendingReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const assessmentId = readFirst(resolvedSearchParams.assessmentId);
  const reportId = readFirst(resolvedSearchParams.reportId);

  // gate-redirect-ok: URL param missing — not a journey precondition; the
  // page is meaningless without an assessmentId.
  if (!assessmentId) {
    redirect(`/${locale}/profile`);
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/${locale}/login?redirect=/${locale}/report/pending?assessmentId=${assessmentId}`,
    );
  }

  const assessment = await getEffectiveAssessment(assessmentId, user.id);
  // gate-redirect-ok: anti-enumeration + invalid URL — don't reveal whether
  // a foreign assessmentId exists. Not a business precondition.
  if (!assessment) {
    redirect(`/${locale}/profile`);
  }

  const profile = await getProfileByAssessment(assessmentId);
  const pendingProfile = profile
    ? ({
        assessmentId: profile.assessmentId,
        archetype: profile.archetype,
        collabMapping: profile.collabMapping,
        schwartzAnchors: profile.schwartzAnchors,
        narrativeSnapshots: profile.narrativeSnapshots,
      } satisfies Pick<
        PersonalProfileData,
        | "assessmentId"
        | "archetype"
        | "collabMapping"
        | "schwartzAnchors"
        | "narrativeSnapshots"
      >)
    : null;

  return (
    <PendingReportClient
      locale={locale}
      assessmentId={assessmentId}
      initialReportId={reportId ?? null}
      profile={pendingProfile}
    />
  );
}
