import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { canAccess } from "@/lib/cohort/entitlements";
import {
  getCompanionProfileByUserId,
  getUserSocialEnabled,
} from "@/lib/db/companions";
import { getJourneyState } from "@/lib/db/journey";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { CompanionDiscover } from "@/components/companions/companion-discover";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  return {
    title: `${dictionary.companionDiscover.pageTitle} — Deep Dive`,
    description: dictionary.companionDiscover.pageSubtitle,
  };
}

/**
 * /companions — discovery + connections page (Companion v1).
 *
 * Server-side gates:
 *   - signed-in
 *   - cohort entitlements.socialFeatures
 *   - User.socialEnabled
 *   - existing CompanionProfile (else redirect to /settings to onboard)
 *
 * The client component handles tab state and live data fetching.
 */
export default async function CompanionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUserWithAdmin();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Pre-fetch dictionary + journey state in parallel — every gate path needs
  // them, and pages that clear all gates need the full dictionary anyway.
  const [dictionary, journeyState] = await Promise.all([
    getDictionary(locale as Locale),
    getJourneyState(user.id).catch(() => "not_started" as const),
  ]);

  // Layer 1 — cohort entitlement
  if (!canAccess(user.cohort, "socialFeatures")) {
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
        userId={user.id}
      />
    );
  }

  // Layer 2 — per-user opt-in
  const enabled = await getUserSocialEnabled(user.id);
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
        userId={user.id}
      />
    );
  }

  // Layer 3 — onboarding precondition (must have a Companion profile)
  const profile = await getCompanionProfileByUserId(user.id);
  if (!profile) {
    const copy = resolveGateCopy({
      feature: "companions_profile",
      dict: dictionary,
      currentState: journeyState,
    });
    return (
      <PrerequisiteGate
        locale={locale as Locale}
        feature="companions_profile"
        currentState={journeyState}
        copy={copy}
        userId={user.id}
      />
    );
  }

  const t = dictionary.companionDiscover;
  const tConn = dictionary.companionConnections;

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <div className="flex-1 w-full max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 pb-16">
        <CompanionDiscover
          locale={locale as Locale}
          t={{
            pageTitle: t.pageTitle,
            pageSubtitle: t.pageSubtitle,
            tabsDiscover: t.tabsDiscover,
            tabsPending: t.tabsPending,
            tabsFriends: t.tabsFriends,
            loading: t.loading,
            errorLoad: t.errorLoad,
            retry: t.retry,
            emptyDiscoverTitle: t.emptyDiscoverTitle,
            emptyDiscoverBody: t.emptyDiscoverBody,
            matchScoreSuffix: t.matchScoreSuffix,
            matchInsightSame: t.matchInsightSame,
            matchInsightOpposite: t.matchInsightOpposite,
            sendRequest: t.sendRequest,
            sending: t.sending,
            requestSentBadge: t.requestSentBadge,
            requestPlaceholder: t.requestPlaceholder,
            requestCounter: t.requestCounter,
            requestCancel: t.requestCancel,
            requestSubmit: t.requestSubmit,
            requestErrorGeneric: t.requestErrorGeneric,
            requestErrorDuplicate: t.requestErrorDuplicate,
            requestErrorBlocked: t.requestErrorBlocked,
          }}
          tConn={{
            incomingTitle: tConn.incomingTitle,
            incomingEmpty: tConn.incomingEmpty,
            incomingMessage: tConn.incomingMessage,
            outgoingTitle: tConn.outgoingTitle,
            outgoingEmpty: tConn.outgoingEmpty,
            friendsTitle: tConn.friendsTitle,
            friendsEmpty: tConn.friendsEmpty,
            actionAccept: tConn.actionAccept,
            actionDecline: tConn.actionDecline,
            actionCancel: tConn.actionCancel,
            actionUnfriend: tConn.actionUnfriend,
            actionViewProfile: tConn.actionViewProfile,
            confirmUnfriend: tConn.confirmUnfriend,
            errorGeneric: tConn.errorGeneric,
            errorConflict: tConn.errorConflict,
          }}
        />
      </div>
    </div>
  );
}
