import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PostAssessmentClient } from "./post-assessment-client";
import { getCoachingSessionCount } from "@/lib/db/coaching";
import { isEligibleForPost1Week } from "@/lib/db/pre-post-assessment";
import {
  buildPostAssessmentHref,
  normalizePrePostAssessmentType,
} from "@/lib/pre-post-assessment/navigation";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { type Locale, toDateLocaleOrDefault } from "@/lib/i18n/config";
import { getJourneyState } from "@/lib/db/journey";
import { hasReached } from "@/lib/journey/state-machine";
import { resolveGateCopy } from "@/lib/journey/gate-copy";
import { PrerequisiteGate } from "@/components/journey/prerequisite-gate";

export default async function PostAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  const assessmentType = normalizePrePostAssessmentType(sp.type);
  const currentPath = buildPostAssessmentHref({
    locale,
    type: assessmentType,
    redirect: sp.redirect,
  });

  if (!user) {
    redirect(`/${locale}/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  // T1 (post_immediate) requires Deep Dive completion AND coaching for research participants.
  // Bug-log #018: previously this page only checked coachingCount. Coaching unlocks
  // after Quick Dive, so a user could reach /post-assessment?type=post_immediate
  // without ever doing Deep Dive — and only discover the API rejection AFTER
  // filling the whole survey. Now we redirect to /deepdive first if DD incomplete.
  let hasUsedCoaching = true;
  if (user.researchGroup) {
    if (assessmentType === "post_immediate") {
      const journeyState = await getJourneyState(user.id).catch(
        () => "not_started" as const,
      );
      // gate-redirect-ok: research-flow auto-routing — Deep Dive + report
      // must come before T1 per the consent (lib/cdse/research-consent.ts:22)
      // which promises participants do "the Deep Dive ... then receive a
      // personal profile, a personalized career report, and AI coaching"
      // before the immediately-after survey.
      if (!hasReached(journeyState, "report_generated")) {
        // If DD itself isn't done, send to /deepdive. Otherwise the report
        // is still pending — /processing observer page is the right place.
        if (!hasReached(journeyState, "deep_dive_complete")) {
          // gate-redirect-ok: research-flow auto-routing — direct the
          // participant to the missing prerequisite before the T1 survey.
          redirect(`/${locale}/deepdive?gate=post_survey_needs_dd`);
        }
        redirect(`/${locale}/dashboard?gate=post_survey_needs_report`);
      }
    }
    const coachingCount = await getCoachingSessionCount(user.id);
    hasUsedCoaching = coachingCount > 0;
    // gate-redirect-ok: research-flow auto-routing — coaching page renders a
    // `post_survey` banner explaining the next step, so the user gets context
    // immediately. TODO: migrate to <PrerequisiteGate> in the followups PR.
    if (assessmentType === "post_immediate" && !hasUsedCoaching) {
      redirect(`/${locale}/coaching?gate=post_survey`);
    }
  }

  // T2 (post_1week) requires 7-day wait after T1
  if (assessmentType === "post_1week" && user.researchGroup) {
    const { eligible, postImmediateDate } = await isEligibleForPost1Week(
      user.id,
    );
    if (!eligible) {
      // Compute the date this opens — postImmediate + 7 days — so the gate
      // shows a concrete "Available on Mon, May 28" instead of "come back later".
      const availableDate = postImmediateDate
        ? new Date(
            new Date(postImmediateDate).getTime() + 7 * 24 * 60 * 60 * 1000,
          )
        : null;
      const availableOn = availableDate
        ? new Intl.DateTimeFormat(toDateLocaleOrDefault(locale), {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(availableDate)
        : "";
      const [dict, journeyState] = await Promise.all([
        getDictionary(locale as Locale),
        getJourneyState(user.id).catch(() => "not_started" as const),
      ]);
      const copy = resolveGateCopy({
        feature: "post_assessment_too_early",
        dict,
        currentState: journeyState,
        context: { availableOn },
      });
      // (immersive)/layout.tsx ships a skip link to #main-content but no
      // <main> wrapper — supply one here so the gate is the landmark.
      return (
        <main id="main-content">
          <PrerequisiteGate
            locale={locale as Locale}
            feature="post_assessment_too_early"
            currentState={journeyState}
            copy={copy}
            userId={user.id}
          />
        </main>
      );
    }
  }

  return (
    <PostAssessmentClient
      locale={locale}
      researchGroup={user.researchGroup ?? null}
      hasUsedCoaching={hasUsedCoaching}
    />
  );
}
