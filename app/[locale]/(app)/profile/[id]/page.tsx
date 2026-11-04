import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { getUserById } from "@/lib/auth/users";
import { getUserContext, getUserContextOrCompute } from "@/lib/db/user-context";
import { getCachedProfile } from "@/lib/db/cached";
import { getRealConditionsByUserId } from "@/lib/db/conditions";
import { getJourneyState } from "@/lib/db/journey";
import { getReportInputHash } from "@/lib/db/reports";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import {
  getEffectiveAssessment,
  getLatestSessionIdForUser,
} from "@/lib/db/assessments";
import { getCanonicalRiasec } from "@/lib/db/riasec-canonical";
import { hasReached } from "@/lib/journey/state-machine";
import {
  getLatestPipelineForUser,
  getPipelineByAssessment,
} from "@/lib/db/pipeline";
import {
  computeInputHash,
  checkReportFreshness,
} from "@/lib/report/prerequisites";
import { ProfileDashboard } from "@/components/profile-panels/profile-dashboard";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { hasCompleteNarratives } from "@/lib/profile-generation/narrative-renderability";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";
import {
  computeNarrativeInputHash,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import ProfileDetailLoading from "./loading";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: profileId } = await params;
  const user = await getCurrentUserWithAdmin();
  if (!user) redirect(`/${locale}/login`);

  const isSelf = profileId === user.id;
  const viewingAsAdmin = !isSelf && user.isAdmin === true;

  // gate-redirect-ok: access control — non-admin can't see other profiles.
  // Bouncing them silently to their own profile preserves the rest of the UX;
  // a gate here would leak the existence of the target profile.
  if (!isSelf && !viewingAsAdmin) {
    redirect(`/${locale}/profile/${user.id}`);
  }

  return (
    <Suspense fallback={<ProfileDetailLoading />}>
      <ProfileContent
        targetUserId={profileId}
        locale={locale}
        viewingAsAdmin={viewingAsAdmin}
        adminViewerId={viewingAsAdmin ? user.id : null}
      />
    </Suspense>
  );
}

// ── Heavy data fetching in a separate async component ────
async function ProfileContent({
  targetUserId,
  locale,
  viewingAsAdmin,
  adminViewerId,
}: {
  targetUserId: string;
  locale: string;
  viewingAsAdmin: boolean;
  adminViewerId: string | null;
}) {
  // Data-first guard: we trust what's actually in the DB over derived state.
  // journeyState can lag behind PersonalProfile when the pipeline's
  // transitionJourney side-effect fails transiently (see 2026-04-21 incident).
  // Only fall back to journeyState when there is no profile row at all.
  //
  // 6 parallel queries: context + profile + conditions + latest QD + sessionId
  // + journey + (admin only) target user details for the banner.
  const [
    ctx,
    profile,
    conditions,
    latestQD,
    latestSessionId,
    journeyState,
    targetUser,
  ] = await Promise.all([
    // Admin view is strictly read-only — never trigger the recompute fallback
    // that writes to UserContext for the target user. Degrade to null if the
    // cache row hasn't been precomputed yet (downstream tolerates null).
    viewingAsAdmin
      ? getUserContext(targetUserId).catch(() => null)
      : getUserContextOrCompute(targetUserId),
    getCachedProfile(targetUserId),
    getRealConditionsByUserId(targetUserId).catch(() => null),
    getLatestQuickDiveByUserId(targetUserId).catch(() => null),
    getLatestSessionIdForUser(targetUserId).catch(() => null),
    getJourneyState(targetUserId),
    viewingAsAdmin ? getUserById(targetUserId).catch(() => null) : null,
  ]);

  // Track page view (non-blocking) — but skip when admin is viewing someone
  // else's profile, so the funnel doesn't get polluted with internal views.
  if (!viewingAsAdmin) {
    trackFunnelEvent("profile_viewed", {
      userId: targetUserId,
      metadata: { locale, hasProfile: !!profile },
    }).catch(() => {});
  } else {
    // Audit breadcrumb (no DB write — Sentry only). If a persistent audit
    // trail is required, add an AdminAuditLog table.
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.addBreadcrumb({
        category: "admin",
        message: "admin viewed user profile",
        level: "info",
        data: { adminId: adminViewerId, targetUserId },
      });
    } catch {
      // Sentry unavailable — non-fatal.
    }
  }

  // No profile in DB — decide where to route based on pipeline state.
  //   - Deep Dive not done yet → dashboard (user is earlier in the journey).
  //   - Pipeline pending/running → /processing (observer can poll).
  //   - Pipeline auto_done or completed but profile missing → inconsistency
  //     (we should always have the profile when those states are reached).
  //     Log to Sentry and fall back to /processing so the user at least sees
  //     a retry mechanism rather than a silent bounce to dashboard.
  //   - Pipeline failed → dashboard with a surfaceable ?pipelineFailed flag
  //     (the dashboard can read this query param to show a banner; even if
  //     it doesn't yet, this flag gives us a tracked failure path).
  //   - No pipeline row → legacy user with deep_dive_complete. Best effort:
  //     dashboard (they likely did Deep Dive before the pipeline existed; a
  //     /processing page without a pipelineId would be meaningless).
  if (!profile) {
    // gate-redirect-ok: pre-Deep-Dive user has no profile by design. Dashboard
    // is the natural starting point — a Gate would be noisy for the common
    // "I just signed up" case.
    if (!hasReached(journeyState, "deep_dive_complete")) {
      redirect(`/${locale}/dashboard`);
    }

    const pendingPipeline = await getLatestPipelineForUser(targetUserId).catch(
      () => null,
    );

    if (pendingPipeline) {
      const { status, id } = pendingPipeline;
      if (status === "pending" || status === "running") {
        redirect(`/${locale}/processing?pipelineId=${encodeURIComponent(id)}`);
      }
      if (status === "auto_done" || status === "completed") {
        // Inconsistent state: pipeline thinks profile is saved but
        // getCachedProfile returned null. Could be cache lag or a DB
        // inconsistency worth investigating.
        try {
          const Sentry = await import("@sentry/nextjs");
          Sentry.captureMessage(
            "profile missing despite terminal pipeline status",
            {
              level: "warning",
              tags: { route: "/profile/[id]", pipelineStatus: status },
              extra: {
                userId: targetUserId,
                pipelineId: id,
                assessmentId: pendingPipeline.assessmentId,
              },
            },
          );
        } catch {
          // Sentry unavailable — non-fatal.
        }
        // Send the user back to /processing so the observer page can reload
        // the profile as it lands. If it's truly missing, the poll will
        // surface the issue rather than silently bouncing to dashboard.
        redirect(`/${locale}/processing?pipelineId=${encodeURIComponent(id)}`);
      }
      if (status === "failed") {
        // Pipeline irrecoverably failed — show an explained gate with retry
        // path instead of bouncing to dashboard with a hidden query flag.
        const [dict, journeyForGate] = await Promise.all([
          getDictionary(locale as Locale),
          getJourneyState(targetUserId).catch(() => "not_started" as const),
        ]);
        const copy = resolveGateCopy({
          feature: "pipeline_failed",
          dict,
          currentState: journeyForGate,
        });
        return (
          <PrerequisiteGate
            locale={locale as Locale}
            feature="pipeline_failed"
            currentState={journeyForGate}
            copy={copy}
            userId={adminViewerId ?? targetUserId}
          />
        );
      }
    }

    // gate-redirect-ok: legacy fallback — user reached deep_dive_complete
    // before the pipeline system existed, so there's no pipeline to observe.
    // Dashboard is the safe landing.
    redirect(`/${locale}/dashboard`);
  }

  // Do not render Profile as a half-finished artifact. The waiting experience
  // belongs on /processing, where the user can see the narrative step finish
  // or recover from a permanent pipeline failure.
  if (!hasCompleteNarratives(profile.narrativeSnapshots)) {
    const pipeline = profile.assessmentId
      ? await getPipelineByAssessment(profile.assessmentId).catch(() => null)
      : null;

    // gate-redirect-ok: pipeline is still active — /processing is the
    // observer page that lets the user watch narratives land.
    if (pipeline) {
      redirect(
        `/${locale}/processing?pipelineId=${encodeURIComponent(pipeline.id)}`,
      );
    }

    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(
        "profile blocked because narratives are incomplete",
        {
          level: "warning",
          tags: { route: "/profile/[id]" },
          extra: { userId: targetUserId, assessmentId: profile.assessmentId },
        },
      );
    } catch {
      // Sentry unavailable — non-fatal.
    }
    // Inconsistent state (narratives incomplete + no pipeline) is functionally
    // the same as a failed pipeline — render the explained Gate instead of a
    // hidden ?pipelineFailed=1 query param.
    const copy = resolveGateCopy({
      feature: "pipeline_failed",
      dict: await getDictionary(locale as Locale),
      currentState: journeyState,
    });
    return (
      <PrerequisiteGate
        locale={locale as Locale}
        feature="pipeline_failed"
        currentState={journeyState}
        copy={copy}
        userId={adminViewerId ?? targetUserId}
      />
    );
  }

  // ── Profile-level staleness detection ────
  // New profiles carry an input fingerprint, which catches retakes where the
  // archetype code remains the same but the underlying RIASEC/value inputs
  // changed. Legacy profiles without a fingerprint fall back to archetype code.
  let profileStale = false;
  let narrativesInputStale = false;
  const effectiveAssessment = profile.assessmentId
    ? await getEffectiveAssessment(profile.assessmentId, targetUserId).catch(
        () => null,
      )
    : null;

  if (effectiveAssessment && profile.profileInputHash) {
    profileStale = !isProfileCurrentForAssessment(profile, effectiveAssessment);
  } else if (latestQD && profile) {
    const canonical = getCanonicalRiasec(latestQD);
    if (canonical.archetype.code !== profile.archetype?.code) {
      profileStale = true;
    }
  }

  if (profile.profileInputHash && profile.narrativeSnapshots) {
    const narrativeLocale =
      profile.narrativeSnapshots.narrativeLocale ?? locale;
    const expectedNarrativeHash = computeNarrativeInputHash(
      profile.profileInputHash,
      narrativeLocale,
    );
    narrativesInputStale =
      profile.narrativeSnapshots.narrativeInputHash !== undefined &&
      profile.narrativeSnapshots.narrativeInputHash !== expectedNarrativeHash;
  }

  if (narrativesInputStale) profileStale = true;

  // ── Report-level staleness detection ────
  let reportStale = false;
  if (ctx?.latestReportId && profile.assessmentId) {
    const storedHash = await getReportInputHash(ctx.latestReportId).catch(
      () => null,
    );
    if (storedHash) {
      const currentHash = computeInputHash({
        assessmentId: profile.assessmentId,
        realConditions: conditions,
        riasecNormalized: profile.riasecScores,
      });
      reportStale = checkReportFreshness(storedHash, currentHash) === "stale";
    }
  }
  // If profile itself is stale, report is definitely stale too
  if (profileStale) reportStale = true;

  return (
    <div className="dd-profile-page min-h-dvh pb-16">
      <ProfileDashboard
        profile={profile}
        locale={locale}
        reportId={ctx?.latestReportId ?? null}
        hasConditions={!!conditions}
        conditions={conditions}
        reportStale={reportStale}
        profileStale={profileStale}
        riasecScores={profile.riasecScores}
        sessionId={latestSessionId}
        savedAvatarGender={latestQD?.avatarGender ?? null}
        viewingAsAdmin={viewingAsAdmin}
        viewingAsAdminEmail={targetUser?.email ?? null}
        viewingAsAdminName={targetUser?.name ?? null}
      />
    </div>
  );
}
