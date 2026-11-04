import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { canAccess } from "@/lib/cohort/entitlements";
import {
  areFriends,
  getCompanionProfileByUserId,
  getUserSocialEnabled,
  isBlockedEitherWay,
} from "@/lib/db/companions";
import { sql } from "@/lib/db/connection";
import { getJourneyState } from "@/lib/db/journey";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocalizedField } from "@/lib/i18n/localize";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";
import { computeCompatibility } from "@/lib/companions/compatibility";
import { ProfileDetailActions } from "@/components/companions/profile-detail-actions";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  return {
    title: `${dictionary.companionDiscover.pageTitle} — Deep Dive`,
  };
}

/**
 * /companions/[userId] — view another user's Companion profile.
 *
 * Same gates as the API:
 *   - signed-in + cohort entitlement + socialEnabled (viewer)
 *   - target's cohort + socialEnabled
 *   - mutual block → 404 (don't leak existence)
 *   - target.visibility !== 'hidden'
 *   - friends_only requires accepted connection
 *
 * v1.1 will hydrate the AI insight panel with a model-router call —
 * for v1 we surface archetype + tagline + compatibility math and a
 * placeholder card.
 */
export default async function CompanionProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId: targetId } = await params;
  const viewer = await getCurrentUserWithAdmin();

  if (!viewer) redirect(`/${locale}/login`);

  // Pre-fetch dictionary + journey state for any gate path we may render.
  const [dictionary, journeyState] = await Promise.all([
    getDictionary(locale as Locale),
    getJourneyState(viewer.id).catch(() => "not_started" as const),
  ]);

  // Viewer-side entitlement gates — replace silent redirects with explained
  // gates so users arriving via deep link understand what's missing.
  if (!canAccess(viewer.cohort, "socialFeatures")) {
    const copy = resolveGateCopy({
      feature: "companions_cohort",
      dict: dictionary,
      currentState: journeyState,
    });
    return (
      <PrerequisiteGate
        locale={locale as Locale}
        feature="companions_cohort"
        currentState={journeyState}
        copy={copy}
        userId={viewer.id}
      />
    );
  }
  const enabled = await getUserSocialEnabled(viewer.id);
  if (!enabled) {
    const copy = resolveGateCopy({
      feature: "companions_opt_in",
      dict: dictionary,
      currentState: journeyState,
    });
    return (
      <PrerequisiteGate
        locale={locale as Locale}
        feature="companions_opt_in"
        currentState={journeyState}
        copy={copy}
        userId={viewer.id}
      />
    );
  }
  // gate-redirect-ok: self-view bounce — users editing their own card belong
  // in Settings, not the public detail page. Behavioral parity with the
  // pre-gate implementation.
  if (targetId === viewer.id) redirect(`/${locale}/settings`);
  if (await isBlockedEitherWay(viewer.id, targetId)) notFound();

  const userRows = (await sql`
    SELECT "cohort", "socialEnabled" FROM "User"
    WHERE "id" = ${targetId} LIMIT 1
  `) as unknown as Array<{ cohort: string | null; socialEnabled: boolean }>;
  if (
    userRows.length === 0 ||
    !canAccess(userRows[0].cohort ?? null, "socialFeatures") ||
    !userRows[0].socialEnabled
  ) {
    notFound();
  }

  const profile = await getCompanionProfileByUserId(targetId);
  if (!profile || profile.visibility === "hidden") notFound();

  const friend = await areFriends(viewer.id, targetId);
  if (profile.visibility === "friends_only" && !friend) notFound();

  const viewerProfile = await getCompanionProfileByUserId(viewer.id);
  const compatibility = viewerProfile
    ? computeCompatibility(viewerProfile, profile)
    : null;

  // dictionary was already fetched in the gate-prep block above; reuse it.
  const tDiscover = dictionary.companionDiscover;
  const tDetail = dictionary.companionProfileDetail;
  const tReport = dictionary.companionReport;
  const tConn = dictionary.companionConnections;

  const archetypeEntry = ARCHETYPE_MAP[profile.archetypeCode];
  const archetypeLabel = archetypeEntry
    ? getLocalizedField(archetypeEntry, "label", locale as Locale)
    : profile.archetypeCode;
  const archetypeTagline = archetypeEntry
    ? getLocalizedField(archetypeEntry, "tagline", locale as Locale)
    : "";

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <div className="flex-1 w-full max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-16 space-y-6">
        <Link
          href={`/${locale}/companions`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {tDetail.backToDiscover}
        </Link>

        {/* Header — display name + archetype + compatibility */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 card-inset-highlight">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {profile.displayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {archetypeLabel}
                {archetypeTagline && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    · {archetypeTagline}
                  </span>
                )}
              </p>
            </div>
            {compatibility && (
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {compatibility.score}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tDetail.scoreLabel}
                </p>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-foreground/90 whitespace-pre-line pt-2">
              {profile.bio}
            </p>
          )}

          {compatibility && (
            <p className="text-xs text-muted-foreground italic pt-1">
              {compatibility.complementarity === 1.0
                ? tDiscover.matchInsightOpposite
                : tDiscover.matchInsightSame}
            </p>
          )}
        </div>

        {/* AI insight placeholder — v1.1 will hydrate this with a model-router call */}
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{tDetail.insightTitle}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {tDetail.insightComingSoon}
          </p>
        </div>

        {/* Trust & Safety actions */}
        <ProfileDetailActions
          targetUserId={targetId}
          targetDisplayName={profile.displayName}
          blockRedirect={`/${locale}/companions`}
          t={{
            blockButton: tDetail.blockButton,
            reportButton: tDetail.reportButton,
            confirmBlock: tConn.confirmUnfriend,
            blockError: tConn.errorGeneric,
          }}
          tReport={{
            title: tReport.title,
            intro: tReport.intro,
            reasonLabel: tReport.reasonLabel,
            reasonHarassment: tReport.reasonHarassment,
            reasonInappropriate: tReport.reasonInappropriate,
            reasonSpam: tReport.reasonSpam,
            reasonOther: tReport.reasonOther,
            detailsLabel: tReport.detailsLabel,
            detailsPlaceholder: tReport.detailsPlaceholder,
            detailsCounter: tReport.detailsCounter,
            cancel: tReport.cancel,
            submit: tReport.submit,
            submitting: tReport.submitting,
            successTitle: tReport.successTitle,
            successBody: tReport.successBody,
            errorGeneric: tReport.errorGeneric,
          }}
        />
      </div>
    </div>
  );
}
