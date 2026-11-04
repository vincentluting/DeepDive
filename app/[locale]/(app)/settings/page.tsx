import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { getUserReports } from "@/lib/db/reports";
import { getUserProfileInsights } from "@/lib/db/profiles";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import {
  getCompanionProfileByUserId,
  getUserSocialEnabled,
} from "@/lib/db/companions";
import { canAccess } from "@/lib/cohort/entitlements";
import { canAccessFeature } from "@/lib/access/check-access";
import { isCohortActive, isResearchCohort } from "@/lib/cohort/config";
import { getLatestAssessmentForUser } from "@/lib/db/assessments";
import { getLatestActiveResumeMatch } from "@/lib/db/resume-match";

import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocalizedField } from "@/lib/i18n/localize";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";
import { SettingsPageClient } from "./settings-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const nav = dictionary.nav;
  return {
    title: `${nav.settings} — Deep Dive`,
    description:
      locale === "zh"
        ? "管理你的账户信息和数据隐私设置。"
        : "Manage your account information and data privacy settings.",
  };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUserWithAdmin();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const dictionary = await getDictionary(locale as Locale);

  const showCompanion = canAccess(user.cohort, "socialFeatures");
  // Resume upload follows the unified cohort-OR-purchase rule so paying
  // users in the default cohort aren't locked out of managing their
  // resume from Settings — matches the gate in /api/documents/upload.
  const canUploadResume = await canAccessFeature(
    user.id,
    user.cohort,
    "resumeEnhancement",
  ).catch(() => false);
  // Whether to surface the invite-code section in Settings:
  //   - null cohort → show (first-time claim path)
  //   - active non-research cohort → show (upgrade-to-research path)
  //   - research cohort → hide (terminal; exit goes through consent withdrawal)
  //   - unknown / retired cohort → hide (claim would 409; UI shouldn't
  //     bait the user into a guaranteed failure)
  const canShowInviteSection =
    !user.cohort ||
    (isCohortActive(user.cohort) && !isResearchCohort(user.cohort));

  const [
    reportsResult,
    profileInsights,
    quickDiveResult,
    companionProfile,
    socialEnabled,
    latestAssessment,
  ] = await Promise.all([
    getUserReports(user.id).catch(() => ({ reports: [] })),
    getUserProfileInsights(user.id).catch(() => null),
    getLatestQuickDiveByUserId(user.id).catch(() => null),
    showCompanion
      ? getCompanionProfileByUserId(user.id).catch(() => null)
      : Promise.resolve(null),
    showCompanion
      ? getUserSocialEnabled(user.id).catch(() => false)
      : Promise.resolve(false),
    getLatestAssessmentForUser(user.id).catch(() => null),
  ]);

  // Resume metadata for the Career Inputs card. Only the active row is
  // surfaced — superseded history stays in the DB for thesis provenance
  // but is intentionally hidden from this UI (v1 scope decision).
  const assessmentIdForResume = latestAssessment?.id ?? null;
  const currentResume = assessmentIdForResume
    ? await getLatestActiveResumeMatch(assessmentIdForResume).catch(() => null)
    : null;

  const reportCount = reportsResult.reports?.length ?? 0;

  const insightCount = (() => {
    if (!profileInsights?.insightsJson) return 0;
    const raw = profileInsights.insightsJson;
    return Array.isArray(raw) ? raw.length : 0;
  })();

  const archetypeName = quickDiveResult?.archetypeCode
    ? ARCHETYPE_MAP[quickDiveResult.archetypeCode]
      ? getLocalizedField(
          ARCHETYPE_MAP[quickDiveResult.archetypeCode]!,
          "label",
          locale as Locale,
        )
      : quickDiveResult.archetypeLabel
    : null;

  // dd-utility-page + isolate (not dd-page-shell): isolate gives the fixed
  // ::before/::after breathing layers their stacking context, but WITHOUT
  // dd-page-shell's overflow-x:hidden — that computes overflow-y to auto,
  // making this element the sticky scroll-ancestor and breaking the desktop
  // section nav's position:sticky.
  return (
    <div className="dd-utility-page relative isolate min-h-dvh flex flex-col text-foreground">
      <div className="dd-page-main flex-1 w-full max-w-2xl md:max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-16">
        <SettingsPageClient
          userName={user.name}
          userEmail={user.email}
          userCreatedAt={user.createdAt.toISOString()}
          userCohort={user.cohort ?? null}
          canShowInviteSection={canShowInviteSection}
          reportCount={reportCount}
          insightCount={insightCount}
          archetypeName={archetypeName}
          locale={locale as Locale}
          dictionary={dictionary}
          showCompanion={showCompanion}
          companionEnabled={socialEnabled ?? false}
          companionProfile={companionProfile}
          hasQuickDive={quickDiveResult !== null}
          careerInputs={{
            assessmentId: assessmentIdForResume,
            canUpload: canUploadResume,
            currentResume: currentResume
              ? {
                  fileName: currentResume.fileName,
                  uploadedAt: currentResume.createdAt.toISOString(),
                }
              : null,
          }}
        />
      </div>
    </div>
  );
}
