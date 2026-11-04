import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUserWithAdmin } from "@/lib/auth";
import { getLatestSessionIdForUser } from "@/lib/db/assessments";
import {
  getCachedUserReports,
  getCachedUserProfileInsights,
  getCachedProfile,
  getCachedLatestQuickDive,
  getCachedCoachingSessionCount,
  getCachedDeepDiveStatus,
  getCachedLatestReportId,
} from "@/lib/db/cached";
import { computeProgressFromSourceTables } from "@/lib/db/exploration-progress";
import {
  calculateDepth,
  getModuleStatusList,
} from "@/lib/exploration/depth-calculator";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";
import { ReportsList } from "@/components/features/reports-list";
import { ExpeditionRail } from "@/components/design/meridian/expedition-rail";
import { MobileSectionNav } from "@/components/design/meridian/mobile-section-nav";
import { ChevronRight, Clock, Shield, Lock, Target } from "lucide-react";
import { Bioluminescence, SonarPulse } from "@/components/ui/icons";

import { Post1WeekReminder } from "@/components/features/post-1week-reminder";

import { ContinueExplorationCard } from "@/components/features/continue-exploration-card";
import { WelcomeCard } from "@/components/features/welcome-card";
import { DepthSection } from "@/components/features/depth-gauge/depth-section";
import { LogbookEntry } from "@/components/dashboard/logbook-entry";
import { CompanionCardDashboard } from "@/components/dashboard/companion-card-dashboard";
import { canAccess } from "@/lib/cohort/entitlements";
import {
  countIncomingPendingByUser,
  getUserSocialEnabled,
} from "@/lib/db/companions";
import DashboardLoading from "./loading";
import { type Locale, toDateLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import { ArchetypeAvatar } from "@/components/avatar/archetype-avatar";
import { CohortJourneyPanel } from "@/components/features/cohort-journey-panel";
import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { computeCohortProgress } from "@/lib/cohort/progress";
import { getCohortSteps } from "@/lib/cohort/config";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { getJourneyState } from "@/lib/db/journey";
import { deriveUserLevel } from "@/lib/journey/state-machine";
import { getLatestPipelineForUser } from "@/lib/db/pipeline";
import { AlertCircle, Loader2 } from "lucide-react";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const pipelineFailedFlag =
    typeof sp.pipelineFailed === "string" ? sp.pipelineFailed === "1" : false;
  const user = await getCurrentUserWithAdmin();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Track dashboard page view (non-blocking)
  trackFunnelEvent("dashboard_viewed", {
    userId: user.id,
    metadata: { locale },
  }).catch(() => {});

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent
        user={user}
        locale={locale}
        pipelineFailedFlag={pipelineFailedFlag}
      />
    </Suspense>
  );
}

// ── Heavy data fetching in a separate async component ────
async function DashboardContent({
  user,
  locale,
  pipelineFailedFlag,
}: {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    isAdmin: boolean;
    cohort?: string | null;
  };
  locale: string;
  pipelineFailedFlag: boolean;
}) {
  const showCompanion = canAccess(user.cohort, "socialFeatures");

  const [
    dictionary,
    reports,
    profileInsights,
    _latestSessionId,
    quickDiveData,
    sessionCount,
    explorationProgressData,
    personalProfile,
    cohortProgress /* prewarm */ /* prewarm */,
    ,
    ,
    journeyState,
    latestPipeline,
    companionEnabled,
    companionIncomingPending,
  ] = await Promise.all([
    getDictionary(locale as Locale),
    getCachedUserReports(user.id)
      .then((r) => r.reports)
      .catch(
        () => [] as Awaited<ReturnType<typeof getCachedUserReports>>["reports"],
      ),
    getCachedUserProfileInsights(user.id).catch(() => null),
    getLatestSessionIdForUser(user.id).catch(() => null),
    getCachedLatestQuickDive(user.id).catch(() => null),
    getCachedCoachingSessionCount(user.id).catch(() => 0),
    computeProgressFromSourceTables(user.id).catch(() => null),
    getCachedProfile(user.id).catch(() => null),
    computeCohortProgress(user.id, user.cohort).catch(() => null),
    // Prewarm caches for Profile/Reports/ActionHub pages — not used here,
    // but ensures instant navigation when user clicks any nav link
    getCachedDeepDiveStatus(user.id).catch(() => null),
    getCachedLatestReportId(user.id).catch(() => null),
    getJourneyState(user.id).catch(() => "not_started" as const),
    getLatestPipelineForUser(user.id).catch(() => null),
    showCompanion
      ? getUserSocialEnabled(user.id).catch(() => false)
      : Promise.resolve(false),
    showCompanion
      ? countIncomingPendingByUser(user.id).catch(() => 0)
      : Promise.resolve(0),
  ]);

  // Pipeline banner state. Shown above the main dashboard body.
  //   - pending/running → "still preparing" + link to /processing
  //   - ?pipelineFailed=1 or pipeline.status=failed → retry CTA to /processing
  //     (the same page surfaces the failure and can trigger another attempt)
  const pipelineBanner: {
    variant: "in_progress" | "failed";
    pipelineId: string;
  } | null = latestPipeline
    ? latestPipeline.status === "pending" || latestPipeline.status === "running"
      ? { variant: "in_progress", pipelineId: latestPipeline.id }
      : latestPipeline.status === "failed" || pipelineFailedFlag
        ? { variant: "failed", pipelineId: latestPipeline.id }
        : null
    : pipelineFailedFlag
      ? null // no pipeline row but flag present — nothing actionable to link to
      : null;

  const t = dictionary.dashboardPage;

  // Compute progress data server-side
  const progressModules = explorationProgressData?.modules ?? {};

  const {
    depthM: progressDepth,
    zone: progressZone,
    completionPercent: progressCompletionPercent,
  } = calculateDepth(progressModules);

  const progressModuleList = explorationProgressData
    ? getModuleStatusList(explorationProgressData)
    : [];
  const insights: Array<{ insight?: string; discoveredAt?: string }> = (() => {
    if (!profileInsights?.insightsJson) return [];
    const raw = profileInsights.insightsJson;
    const arr = (raw as Record<string, unknown>).coachingInsights;
    return Array.isArray(arr)
      ? (arr as Array<{ insight?: string; discoveredAt?: string }>)
      : [];
  })();

  const createdAt = user.createdAt
    ? new Date(user.createdAt).getTime()
    : Date.now();
  const daysActive = Math.max(
    1,
    Math.ceil((Date.now() - createdAt) / (1000 * 60 * 60 * 24)),
  );

  // Derive user level from journey state (single source of truth)
  const hasPowerUserData = reports.length > 1 && insights.length > 0;
  const userLevel = deriveUserLevel(journeyState, hasPowerUserData);

  // Level 1: resolve archetype display info
  const archetypeEntry = quickDiveData
    ? ARCHETYPE_MAP[quickDiveData.archetypeCode]
    : null;
  const archetypeLabel = archetypeEntry
    ? getLocalizedField(archetypeEntry, "label", locale as Locale)
    : quickDiveData?.archetypeCode
      ? ARCHETYPE_MAP[quickDiveData.archetypeCode]
        ? getLocalizedField(
            ARCHETYPE_MAP[quickDiveData.archetypeCode]!,
            "label",
            locale as Locale,
          )
        : ""
      : "";
  const quickReport = reports.find((r) => r.reportType === "quick");

  // Identity snapshot data (Level 2+): archetype code + coreInsight from PersonalProfile
  const coreInsight = personalProfile?.narrativeSnapshots?.coreInsight ?? null;
  const snapshotArchetypeCode =
    personalProfile?.archetype?.code ?? quickDiveData?.archetypeCode ?? "";
  const snapshotArchetypeLabel = personalProfile?.archetype
    ? getLocalizedField(personalProfile.archetype, "label", locale as Locale)
    : archetypeLabel;
  const snapshotTagline = snapshotArchetypeCode
    ? (() => {
        const entry = ARCHETYPE_MAP[snapshotArchetypeCode];
        return entry
          ? getLocalizedField(entry, "tagline", locale as Locale)
          : null;
      })()
    : null;

  // Level 2/3: Hero CTA varies by level
  const heroCta =
    userLevel === 2
      ? { label: t.level2CoachCta, href: `/${locale}/coaching` }
      : { label: t.startNewExploration, href: `/${locale}/deepdive` };

  const processingDict = dictionary.processing;

  // Single source of in-page sections — fed to both the desktop Expedition Rail
  // and the mobile section nav so they stay in lockstep. `dash-reports` only
  // exists once the user has reports, so omit its chip otherwise (no dead anchor).
  const hasReportsSection =
    userLevel >= 2 || (userLevel === 1 && reports.length > 0);
  const railSections = [
    { id: "dash-overview", label: t.railSecOverview },
    { id: "dash-continue", label: t.railSecContinue },
    ...(hasReportsSection
      ? [{ id: "dash-reports", label: t.railSecReports }]
      : []),
  ];

  return (
    <div className="dd-page-shell dd-utility-page min-h-dvh flex flex-col text-foreground">
      <div className="w-full max-w-7xl mx-auto flex-1 lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <ExpeditionRail
          surface="utility"
          kicker={t.railKicker}
          title={t.dashboardLabel}
          intro={t.dashboardDesc}
          signatureName={t.railSignature}
          sections={railSections}
        />
        <main className="dd-page-main dd-dashboard-page flex-1 w-full min-w-0 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-16">
          <MobileSectionNav sections={railSections} label={t.dashboardLabel} />
          {/* Pipeline status banner — shows when background processing is still
            running or when the last pipeline failed. Clicking takes the user
            to /processing where they can observe progress or retry. */}
          {pipelineBanner && (
            <Link
              href={`/${locale}/processing?pipelineId=${encodeURIComponent(pipelineBanner.pipelineId)}`}
              className={`mb-6 block rounded-2xl border p-5 transition-colors ${
                pipelineBanner.variant === "in_progress"
                  ? "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10"
                  : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    pipelineBanner.variant === "in_progress"
                      ? "bg-sky-500/10"
                      : "bg-amber-500/10"
                  }`}
                >
                  {pipelineBanner.variant === "in_progress" ? (
                    <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {pipelineBanner.variant === "in_progress"
                      ? processingDict.bannerInProgressTitle
                      : processingDict.bannerFailedTitle}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pipelineBanner.variant === "in_progress"
                      ? processingDict.bannerInProgressBody
                      : processingDict.bannerFailedBody}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0 self-center inline-flex items-center gap-1">
                  {pipelineBanner.variant === "in_progress"
                    ? processingDict.bannerInProgressCta
                    : processingDict.bannerFailedCta}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {/* Cohort Journey Panel (research participants only) */}
          {cohortProgress && user.cohort && (
            <CohortJourneyPanel
              locale={locale}
              dict={dictionary}
              completedSteps={cohortProgress.completedSteps}
              currentStep={cohortProgress.currentStep}
              steps={getCohortSteps(user.cohort)}
              progressPercent={cohortProgress.progressPercent}
              isComplete={cohortProgress.isComplete}
            />
          )}

          {/* Depth Exploration Header + Journey */}
          <div id="dash-overview" className="scroll-mt-24">
            <DepthSection
              locale={locale}
              userName={user.name || t.explorer}
              reportCount={reports.length}
              insightCount={insights.length}
              daysActive={daysActive}
              sessionCount={sessionCount}
              depth={progressDepth}
              completionPercent={progressCompletionPercent}
              zoneName={pickLocaleText(progressZone.label, locale as Locale)}
              completedModules={progressModuleList
                .filter((m) => m.status === "completed")
                .map((m) => m.id)}
            />
          </div>

          {/* Continue Exploration Card (client component, checks localStorage) */}
          <div
            id="dash-continue"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 scroll-mt-24"
          >
            <ContinueExplorationCard locale={locale as Locale} />
          </div>

          {/* Welcome Card for first-time users (client component, checks localStorage) */}
          <WelcomeCard locale={locale as Locale} t={dictionary.welcomeCard} />

          {/* ===== Level 0: New User — Welcome Experience ===== */}
          {userLevel === 0 && (
            <>
              <LogbookEntry
                date={new Date()}
                dayLabel={interpolate(t.logbookDayLabel, { n: daysActive })}
                eyebrowLabel={t.logbookEntryEyebrow}
                narratorLine={t.logbookNarratorL0}
                title={t.level0Title}
                body={t.level0Subtitle}
                primaryCta={{
                  label: t.level0Cta,
                  href: `/${locale}/explore`,
                }}
                locale={locale}
              />

              {/* Three-step guide cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up stagger-1">
                {/* Step 1: Quick Dive — active */}
                <Link
                  href={`/${locale}/explore`}
                  className="group p-6 rounded-2xl bg-card border border-primary/20 card-inset-highlight hover-lift active:scale-[0.97] active:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {t.level0Step1}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.level0Step1Desc}
                  </p>
                </Link>

                {/* Step 2: Deep Dive — locked */}
                <div className="p-6 rounded-2xl bg-card border border-border opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-secondary text-muted-foreground text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {t.level0Step2}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.level0Step2Desc}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {t.level0Locked}
                  </p>
                </div>

                {/* Step 3: AI Coach — locked */}
                <div className="p-6 rounded-2xl bg-card border border-border opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-secondary text-muted-foreground text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {t.level0Step3}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.level0Step3Desc}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {t.level0Locked}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ===== Level 1: Explorer — Archetype Revealed ===== */}
          {userLevel === 1 && (
            <>
              <LogbookEntry
                date={new Date()}
                dayLabel={interpolate(t.logbookDayLabel, { n: daysActive })}
                eyebrowLabel={t.logbookEntryEyebrow}
                narratorLine={t.logbookNarratorL1}
                title={interpolate(t.level1Title, {
                  archetype: archetypeLabel,
                })}
                tagline={
                  archetypeEntry
                    ? locale === "zh"
                      ? archetypeEntry.tagline_zh
                      : archetypeEntry.tagline_en
                    : undefined
                }
                body={t.level1Subtitle}
                primaryCta={{
                  label: t.level1Cta,
                  href: `/${locale}/deepdive`,
                }}
                secondaryCta={
                  quickReport
                    ? {
                        label: t.level1ViewQuickReport,
                        href: `/${locale}/report/quick/${quickReport.id}`,
                        variant: "ghost",
                      }
                    : undefined
                }
                locale={locale}
              />

              {/* Profile card (stats already shown in DepthSection) */}
              <div className="mb-6 animate-fade-in-up stagger-1">
                <Link
                  href={`/${locale}/profile`}
                  className="group flex items-center gap-3 p-5 rounded-2xl bg-card border border-border card-inset-highlight hover-lift active:scale-[0.97] active:bg-white/[0.03] max-w-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                    {(user.name?.[0] || "E").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.name || t.explorer}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>
                      {t.joined}{" "}
                      {new Date(user.createdAt).toLocaleDateString(
                        toDateLocale(locale as Locale),
                        {
                          year: "numeric",
                          month: "short",
                        },
                      )}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Quick Dive reports list */}
              {reports.length > 0 && (
                <div
                  id="dash-reports"
                  className="bg-card border border-border rounded-2xl p-6 card-inset-highlight animate-fade-in-up stagger-2 scroll-mt-24"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        {t.yourReports}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {interpolate(t.reportsCount, { count: reports.length })}
                      </p>
                    </div>
                    {quickReport && (
                      <Link
                        href={`/${locale}/report/quick/${quickReport.id}`}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        {t.viewLatestReport}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                  <ReportsList initialReports={reports} locale={locale} />
                </div>
              )}

              {/* Achievement Gallery */}
              <div className="mt-6 animate-fade-in-up stagger-3">
                <AchievementGallery locale={locale} dict={t} />
              </div>
            </>
          )}

          {/* ===== Level 2 & 3: Diver / Grower — Full Dashboard ===== */}
          {(userLevel === 2 || userLevel === 3) && (
            <>
              {/* Post-1week research survey reminder */}
              <Post1WeekReminder locale={locale as Locale} />

              {/* === Logbook Entry (replaces gradient hero CTA) === */}
              <LogbookEntry
                date={new Date()}
                dayLabel={interpolate(t.logbookDayLabel, { n: daysActive })}
                eyebrowLabel={t.logbookEntryEyebrow}
                narratorLine={
                  userLevel === 3 ? t.logbookNarratorL3 : t.logbookNarratorL2
                }
                title={heroCta.label}
                body={t.dashboardDesc}
                primaryCta={{ label: t.startExploring, href: heroCta.href }}
                locale={locale}
              />

              {/* Identity Snapshot — archetype + coreInsight, links to Profile */}
              {snapshotArchetypeCode && (
                <Link
                  href={`/${locale}/profile`}
                  className="group flex p-5 mb-10 rounded-2xl bg-card border border-border card-inset-highlight hover-lift animate-fade-in-up stagger-1 active:scale-[0.97] active:bg-white/[0.03] max-w-md"
                >
                  <div className="flex items-center gap-4 w-full">
                    <ArchetypeAvatar
                      code={snapshotArchetypeCode}
                      size="sm"
                      locale={locale as Locale}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground">
                        {snapshotArchetypeLabel}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {coreInsight || snapshotTagline}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </Link>
              )}

              {/* Quick Actions Row */}
              <div className="mb-10 animate-fade-in-up stagger-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 section-title-line">
                  {t.quickActions}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href={`/${locale}/action-hub`}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover-lift card-inset-highlight active:scale-[0.97] active:bg-white/[0.03]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/8 flex items-center justify-center flex-shrink-0">
                      <Target className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">
                        {t.actionHubTitle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.actionHubDesc}
                      </span>
                    </div>
                  </Link>
                  {/* Companion entry — gated by cohort entitlement; surfaces incoming requests */}
                  {showCompanion && (
                    <CompanionCardDashboard
                      locale={locale as Locale}
                      enabled={companionEnabled ?? false}
                      incomingPendingCount={companionIncomingPending}
                      t={{
                        title: dictionary.companionDashboardCard.title,
                        subtitle: dictionary.companionDashboardCard.subtitle,
                        subtitleEmpty:
                          dictionary.companionDashboardCard.subtitleEmpty,
                        subtitlePending:
                          dictionary.companionDashboardCard.subtitlePending,
                        ctaOpen: dictionary.companionDashboardCard.ctaOpen,
                        ctaEnable: dictionary.companionDashboardCard.ctaEnable,
                      }}
                    />
                  )}
                  {/* Reality conditions form moved to Profile → Report generation flow */}
                  {user.isAdmin && (
                    <Link
                      href={`/${locale}/admin`}
                      className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover-lift card-inset-highlight active:scale-[0.97] active:bg-white/[0.03]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/8 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground block">
                          {dictionary.admin.adminPanel}
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main content: Reports */}
                <div className="lg:col-span-2">
                  <div
                    id="dash-reports"
                    className="bg-card border border-border rounded-2xl p-6 card-inset-highlight animate-fade-in-up stagger-3 scroll-mt-24"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-0.5">
                          {t.yourReports}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {reports.length === 0
                            ? t.noReports
                            : interpolate(t.reportsCount, {
                                count: reports.length,
                              })}
                        </p>
                      </div>
                      {reports.length > 0 && (
                        <Link
                          href={
                            reports[0].reportType === "quick"
                              ? `/${locale}/report/quick/${reports[0].id}`
                              : `/${locale}/report/${reports[0].id}`
                          }
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          {t.viewLatestReport}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                    <ReportsList initialReports={reports} locale={locale} />
                  </div>
                </div>

                {/* Sidebar: Insights + Achievements */}
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-2xl p-6 card-inset-highlight animate-fade-in-up stagger-4">
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {t.personalInsights}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      {t.keyDiscoveries}
                    </p>
                    {insights.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center empty-state-icon">
                          <Bioluminescence className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.insightsAppear}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {insights.slice(0, 5).map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-secondary/50 border border-border text-sm"
                          >
                            <div className="flex items-start gap-2.5">
                              <SonarPulse className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span className="text-muted-foreground leading-relaxed">
                                {item.insight}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Achievement Gallery */}
                  <AchievementGallery locale={locale} dict={t} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
