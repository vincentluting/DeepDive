"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientId } from "@/lib/auth/client-id";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";
import { type Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  AlertCircle,
  Anchor,
  Target,
  MapPin,
  Languages,
  Sparkles,
  RotateCw,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { CareerReport } from "@/lib/types";
import { CareerAnchors } from "@/components/report/career-anchors";
import { ReportEngagementTracker } from "@/components/analytics/report-engagement-tracker";
import { findLabel } from "@/components/quickdive/quickdive-data";
import { getArchetypeContent } from "@/lib/content";
import {
  ReportCardFlow,
  type CardFlowScreen,
} from "@/components/report/report-card-flow";
import { ShareButton } from "@/components/share/share-button";
import { ResumeRegenerateBanner } from "@/components/report/resume-regenerate-banner";
import { ReportConsistency } from "@/components/report/report-consistency";
import { ReportSignature } from "@/components/report/report-signature";
import { ReportDossierCover } from "@/components/report/report-dossier-cover";

// Below-fold components — lazy-loaded to reduce initial bundle
const RealisticCareerSection = dynamic(
  () =>
    import("@/components/report/realistic-career-section").then(
      (m) => m.RealisticCareerSection,
    ),
  { ssr: false },
);
const CareerDrainSection = dynamic(
  () =>
    import("@/components/report/career-drain-section").then(
      (m) => m.CareerDrainSection,
    ),
  { ssr: false },
);
const LetterToUser = dynamic(
  () =>
    import("@/components/report/letter-to-user").then((m) => m.LetterToUser),
  { ssr: false },
);
const MethodologySection = dynamic(
  () =>
    import("@/components/report/methodology-section").then(
      (m) => m.MethodologySection,
    ),
  { ssr: false },
);
const StrengthsSummary = dynamic(
  () =>
    import("@/components/report/strengths-summary").then(
      (m) => m.StrengthsSummary,
    ),
  { ssr: false },
);
const CoachPreviewCard = dynamic(
  () =>
    import("@/components/report/coach-preview-card").then(
      (m) => m.CoachPreviewCard,
    ),
  { ssr: false },
);
const ReportReactionCheck = dynamic(
  () =>
    import("@/components/features/report-reaction-check").then(
      (m) => m.ReportReactionCheck,
    ),
  { ssr: false },
);
const ReportNPS = dynamic(
  () => import("@/components/features/report-nps").then((m) => m.ReportNPS),
  { ssr: false },
);

export default function ReportClient() {
  const params = useParams();
  const locale = (params.locale as Locale) || "en";
  const reportId = params.id as string;

  const [data, setData] = useState<{
    report: CareerReport;
    phase: number;
    assessmentSessionId?: string;
    assessmentId?: string;
    currentUserId?: string | null;
    researchGroup?: string | null;
    /** Whether the user actually walked Immersive Dive Round Zero — gates companion easter egg */
    walkedRoundZero?: boolean;
    assessmentMeta?: {
      rushCount: number;
      hesitationCount: number;
      totalQuestions: number;
      answeredQuestions: number;
    };
    schwartzTop3?: string[] | null;
    /** SJT behavioral consistency (0-1): how often ideal choice matched likely. */
    behavioralConsistency?: number | null;
    /** Raw Big Five facet scores (30, 1-5) for the "Beneath the Surface" signature. */
    bigFiveFacets?: Record<string, number> | null;
    /** ISO timestamp when this CareerReport row was created — used by
     *  ResumeRegenerateBanner to detect a stale resume snapshot. */
    reportCreatedAt?: string | null;
    /** Currently-active ResumeMatchResult metadata for the underlying
     *  assessment. Null when no resume has been uploaded (or all were
     *  superseded via the Settings "Remove" flow). */
    currentResume?: {
      fileName: string | null;
      uploadedAt: string;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notGenerated, setNotGenerated] = useState(false);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [bypassLocaleMismatch, setBypassLocaleMismatch] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const dict = getDictionaryClient(locale);
  const t = dict.reportView;
  const tv = dict.reportPanels;
  const tcf = dict.reportCardFlow;

  // Set analytics context once on mount
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  // Track report_viewed funnel event when report data loads successfully.
  useEffect(() => {
    if (!data) return;
    try {
      if (sessionStorage.getItem(`rv:${reportId}`)) return;
      sessionStorage.setItem(`rv:${reportId}`, "1");

      const clientId = getClientId();
      const actorId = data.currentUserId ?? clientId;
      const today = new Date().toISOString().slice(0, 10);
      const idempotencyKey = `report_viewed:${actorId}:${reportId}:${today}`;

      analytics
        .track(
          "report_viewed",
          {
            reportId,
            reportVersion: data.report?.meta?.version,
            hasRealConditions: !!data.report?.meta?.realConditionsProvided,
          },
          { idempotencyKey },
        )
        .catch(() => {});
    } catch {
      // Tracking failure is non-critical
    }
  }, [data, reportId]);

  useEffect(() => {
    let cancelled = false;
    const fetchReport = async (attempt = 1) => {
      try {
        const clientId = getClientId();
        const res = await fetch(
          `/api/report/${reportId}?clientId=${clientId}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) {
          if (cancelled) return;
          if (res.status === 401) {
            window.location.href = `/${locale}/login?redirect=/${locale}/report/${reportId}`;
            return;
          } else if (res.status === 404) {
            // Report may still be generating — retry with exponential backoff.
            // Pipeline timeout is 180s (lib/report-generation/index.ts:69);
            // polling window must exceed it so worst-case pipeline finishes
            // before user sees "not generated".
            // Attempts: 3s, 4.5s, 6.75s, 10s, 15s ×11 = ~189s + jitter (±20%)
            if (attempt < 16) {
              if (!cancelled) setPollingAttempt(attempt);
              const baseDelay = Math.min(
                3000 * Math.pow(1.5, attempt - 1),
                15000,
              );
              const jitter = baseDelay * (0.8 + Math.random() * 0.4);
              setTimeout(() => fetchReport(attempt + 1), jitter);
              return;
            }
            setNotGenerated(true);
          } else {
            setError(t.failedToLoadReport);
          }
          setLoading(false);
          return;
        }

        const result = await res.json();
        if (cancelled) return;
        if (!result || !result.report) {
          setError(t.failedToLoadReport);
          setLoading(false);
          return;
        }
        setData(result);
        // Show reveal overlay on first visit to this report
        try {
          const revealKey = `report-revealed-${reportId}`;
          if (!localStorage.getItem(revealKey)) {
            localStorage.setItem(revealKey, "1");
            setShowRevealOverlay(true);
          }
        } catch {
          /* ignore */
        }
      } catch {
        if (cancelled) return;
        setError(t.errorOccurred);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [reportId, locale, retryKey]);

  // Auto-dismiss reveal overlay after 1.5s
  useEffect(() => {
    if (!showRevealOverlay) return;
    const id = setTimeout(() => setShowRevealOverlay(false), 1500);
    return () => clearTimeout(id);
  }, [showRevealOverlay]);

  // Typewriter effect for archetype name in reveal overlay
  useEffect(() => {
    if (!showRevealOverlay || !data) return;
    const name = data.report.header.archetype
      ? getLocalizedField(
          data.report.header.archetype,
          "label",
          locale as Locale,
        )
      : "";
    if (!name) return;
    let i = 0;
    setTypedName("");
    const interval = setInterval(() => {
      i++;
      setTypedName(name.slice(0, i));
      if (i >= name.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [showRevealOverlay, data, locale]);

  // ── Retry handler — reset state and re-trigger polling ──
  const handleRetry = () => {
    setError(null);
    setNotGenerated(false);
    setLoading(true);
    setPollingAttempt(0);
    setRetryKey((k) => k + 1);
  };

  // ── Update report in-place when child regenerates career pathway ──
  const handleReportUpdated = (updatedReport: CareerReport) => {
    setData((prev) => (prev ? { ...prev, report: updatedReport } : prev));
  };

  // ── Hooks that depend on report data ──
  const deepReport = data ? (data.report as CareerReport) : null;

  // Loading state — phased progress messages during ~85s polling window
  if (loading) {
    const progressSteps = [
      t.progressStep1,
      t.progressStep2,
      t.progressStep3,
      t.progressStep4,
      t.progressStep5,
    ];
    const stepIndex = Math.min(pollingAttempt, progressSteps.length - 1);
    const progressPct =
      pollingAttempt > 0
        ? Math.min(Math.round((pollingAttempt / 8) * 100), 95)
        : 0;

    return (
      <div className="min-h-screen flex flex-col">
        <main
          className="flex-1 flex items-center justify-center"
          style={{ paddingTop: "var(--header-height, 64px)" }}
        >
          <div className="text-center space-y-4 max-w-xs">
            <div className="mx-auto w-14 h-14 rounded-full bg-secondary flex items-center justify-center animate-scale-in">
              <Anchor
                className="h-6 w-6 text-primary animate-pulse"
                strokeWidth={1.5}
              />
            </div>
            <div className="animate-fade-in-up stagger-1">
              <p className="text-muted-foreground">
                {pollingAttempt > 0 ? progressSteps[stepIndex] : t.loading}
              </p>
            </div>
            {pollingAttempt > 0 && (
              <div className="animate-fade-in-up stagger-2">
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/50 transition-all duration-1000 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Not-yet-generated state — guide user to Profile to trigger report generation
  if (notGenerated) {
    return (
      <div className="min-h-screen flex flex-col">
        <main
          className="flex-1 flex items-center justify-center p-4"
          style={{ paddingTop: "var(--header-height, 64px)" }}
        >
          <Card className="max-w-md w-full border-primary/20">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">
                {t.reportNotGenerated}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t.reportNotGeneratedDesc}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-6">
                {t.reportStillProcessing}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href={`/${locale}/profile`}>{t.goToProfile}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-6 text-muted-foreground"
                  onClick={() => {
                    setNotGenerated(false);
                    setLoading(true);
                    setPollingAttempt(0);
                    setRetryKey((k) => k + 1);
                  }}
                >
                  {t.refreshRetry}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <main
          className="flex-1 flex items-center justify-center p-4"
          style={{ paddingTop: "var(--header-height, 64px)" }}
        >
          <Card className="max-w-md w-full border-destructive/20">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">{t.unableToLoad}</h2>
              <p className="text-muted-foreground mb-6">
                {error || t.noReportData}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={handleRetry}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {t.retryLoadReport}
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-6 text-muted-foreground"
                >
                  <Link href={`/${locale}`}>{t.returnHome}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const report = deepReport!;

  // ── Locale mismatch intercept ──
  // If the report was generated in a different language than the current site locale,
  // show an intercept page instead of rendering mixed-language content.
  const reportLocale = report.locale as Locale | undefined;
  const hasLocaleMismatch =
    reportLocale && reportLocale !== locale && !bypassLocaleMismatch;

  if (hasLocaleMismatch) {
    const reportLangName =
      reportLocale === "zh" ? t.localeMismatchLangZh : t.localeMismatchLangEn;
    const handleRegenerate = async () => {
      setRegenerating(true);
      try {
        // Inherit the current report's depth mode so a pure language refresh
        // doesn't silently flip Standard → Enhanced (or vice versa) just
        // because a persisted ResumeMatchResult happens to exist.
        const inheritedDepthMode: "standard" | "enhanced" = report.meta
          ?.resumeEnhanced
          ? "enhanced"
          : "standard";
        const res = await csrfFetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: data?.assessmentId,
            locale,
            refresh: true,
            depthMode: inheritedDepthMode,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const { reportId: newId } = await res.json();
        window.location.href = `/${locale}/report/${newId}`;
      } catch {
        setRegenerating(false);
        setBypassLocaleMismatch(true);
      }
    };

    return (
      <div className="min-h-screen flex flex-col">
        <main
          className="flex-1 flex items-center justify-center p-4"
          style={{ paddingTop: "var(--header-height, 64px)" }}
        >
          <Card className="max-w-md w-full border-amber-500/20">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Languages className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold mb-3">
                {t.localeMismatchTitle}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                {t.localeMismatchDesc?.replace("{lang}", reportLangName)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  size="lg"
                  className="rounded-full px-6"
                  aria-live="polite"
                >
                  <Sparkles
                    className={`w-4 h-4 mr-2 ${regenerating ? "animate-pulse" : ""}`}
                  />
                  {regenerating ? t.loading : t.localeMismatchRegenerate}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-6 text-muted-foreground"
                  onClick={() => setBypassLocaleMismatch(true)}
                >
                  {t.localeMismatchViewAnyway}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentReportId = report.id || reportId;
  const sl = tcf.screenLabels;
  const archetypeLabel = getLocalizedField(
    report.header.archetype,
    "label",
    locale as Locale,
  );

  // ── Build card flow screens (5-chapter report) ──
  const screens: CardFlowScreen[] = [
    // Chapter 1: Career Anchors — lightweight bridge from Profile identity to career navigation
    {
      id: "anchors",
      label: sl.anchors ?? sl.identity,
      subtitle: tcf.screenSubtitles?.anchors ?? tcf.screenSubtitles?.identity,
      content: (
        <CareerAnchors
          anchors={report.careerAnchors ?? []}
          locale={locale as Locale}
          t={tv}
          archetypeLabel={archetypeLabel}
          schwartzTop3={data?.schwartzTop3 ?? null}
        />
      ),
    },
    // Chapter 1.5: Strengths Summary — affirm before directing
    ...(() => {
      const content = report.header.archetypeCode
        ? getArchetypeContent(report.header.archetypeCode)
        : undefined;
      if (!content?.coreStrengths?.length) return [];
      return [
        {
          id: "strengths",
          label: sl.strengths ?? sl.traits,
          subtitle:
            tcf.screenSubtitles?.strengths ?? tcf.screenSubtitles?.traits,
          content: (
            <>
              <StrengthsSummary
                archetypeLabel={archetypeLabel}
                coreStrengths={content.coreStrengths}
                coreInsight={report.integration?.coreInsight}
                locale={locale as Locale}
                t={tv}
                schwartzTop3={data?.schwartzTop3 ?? null}
                cognitiveStyleCode={report.header.cognitiveStyleCode}
              />
              {/* Beneath the Surface — facet-level nuance the domain scores hide */}
              <ReportSignature
                facets={data?.bigFiveFacets ?? null}
                locale={locale as Locale}
                t={tv}
              />
            </>
          ),
        },
      ] as CardFlowScreen[];
    })(),
    // Chapter 2: Career Landscape — scatter map + directions + pathway
    {
      id: "careers",
      label: sl.careers,
      subtitle: tcf.screenSubtitles?.careers,
      layout: "wide",
      hideHeader: true,
      content: (
        <>
          {report.careerPathway && (
            <RealisticCareerSection
              pathway={report.careerPathway}
              reportId={currentReportId}
              locale={locale as Locale}
              t={tv}
              sessionId={data?.assessmentSessionId}
              userId={data?.currentUserId}
              assessmentId={data?.assessmentId}
              transitionText={report.integration?.transitions?.profileToPathway}
              careerMatch={report.careerMatch}
              onReportUpdated={handleReportUpdated}
            />
          )}
          {/* F-019: Rationale callout — explains that the career matching
              engine uses the user's full interest pattern (not just the
              archetype label), so readers are not confused when fit
              directions differ from the archetype name they saw on the
              cover. Reframes the mismatch as breadth rather than error. */}
          {tv.careerMatchRationale && (
            <div
              className="mt-10 mx-auto max-w-2xl rounded-2xl border border-primary/15
                bg-gradient-to-br from-primary/[0.04] to-transparent
                p-6 sm:p-7"
            >
              <p className="text-[11px] uppercase tracking-[0.15em] font-medium text-primary/80 mb-2.5">
                {tv.careerMatchRationaleLabel}
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">
                {tv.careerMatchRationale.replace(
                  "{{archetype}}",
                  archetypeLabel,
                )}
              </p>
            </div>
          )}
        </>
      ),
    },
    // Chapter 3: Shadow & Energy Drain — standalone chapter
    {
      id: "shadow",
      label: sl.shadow ?? sl.growth,
      subtitle: tcf.screenSubtitles?.shadow ?? tcf.screenSubtitles?.growth,
      content: (
        <>
          {report.careerDrainWarning && (
            <CareerDrainSection
              drain={report.careerDrainWarning}
              locale={locale as Locale}
              t={tv}
              standalone
            />
          )}
          {/* Ideals vs. Actions — SJT should/would consistency, previously
              computed but never surfaced to the reader. */}
          <ReportConsistency
            consistency={data?.behavioralConsistency ?? null}
            t={tv}
          />
        </>
      ),
    },
    // Chapter 4: Letter + Coach
    {
      id: "letter",
      label: sl.letter,
      subtitle: tcf.screenSubtitles?.letter,
      content: (
        <>
          {report.integration?.letterToUser && (
            <div className="mb-10">
              <LetterToUser
                letter={report.integration.letterToUser}
                locale={locale as Locale}
                t={tv}
                archetypeLabel={archetypeLabel}
                oneThingToday={
                  report.careerPathway?.actionPlan?.week1?.tasks?.[0]
                    ?.description ?? null
                }
              />
            </div>
          )}
          {/* #070: realistic-career-section already renders a coaching CTA
              whenever aiEraPersonalInsight exists, so only show this bottom
              CoachPreviewCard when that CTA is absent — avoids a duplicate
              report→coaching entry (cf. the "no redundant coach CTA" rule). */}
          {!report.careerMatch?.aiEraPersonalInsight && (
            <CoachPreviewCard
              archetypeLabel={archetypeLabel}
              archetypeColor={
                getArchetypeContent(report.header.archetypeCode || "")?.colorHex
              }
              archetypeCode={report.header.archetypeCode || undefined}
              walkedRoundZero={data?.walkedRoundZero === true}
              locale={locale as Locale}
              t={tv}
              schwartzConflictNarrative={null}
            />
          )}
        </>
      ),
    },
    // Chapter 5: Feedback + Methodology + Navigation
    {
      id: "explore",
      label: sl.explore,
      subtitle: tcf.screenSubtitles?.explore,
      content: (
        <>
          {/* Feedback */}
          <ReportReactionCheck
            reportId={currentReportId}
            locale={locale as Locale}
            t={tv}
          />
          <ReportNPS reportId={currentReportId} locale={locale as Locale} />

          {/* Methodology — trust anchor */}
          <MethodologySection locale={locale as Locale} t={tv} />

          {/* Share identity card */}
          {report.header.archetypeCode &&
            (() => {
              const shareContent = getArchetypeContent(
                report.header.archetypeCode,
              );
              const shareLabel = findLabel(report.header.archetypeCode);
              const shareColor =
                shareContent?.colorHex || shareLabel?.colorHex || "#3D2F23";
              return (
                <div className="mt-8 flex justify-center">
                  <ShareButton
                    code={report.header.archetypeCode}
                    locale={locale}
                    color={shareColor}
                    rare={5}
                    buttonLabel={tv.shareMyIdentity}
                  />
                </div>
              );
            })()}

          {/* Research: post-immediate assessment prompt (thesis participants only) */}
          {data?.researchGroup && (
            <Card className="mt-10 border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  {t.feedbackTitle}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {t.feedbackDesc}
                </p>
                <Button asChild className="rounded-full">
                  <Link href={`/${locale}/post-assessment?type=post_immediate`}>
                    {t.startFeedback} →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Footer navigation */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              variant="outline"
              className="rounded-full bg-transparent"
            >
              <Link href={`/${locale}`}>
                <Home className="h-4 w-4 mr-2" />
                {t.returnHome}
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              <Link href={`/${locale}/action-hub?reportId=${report.id}`}>
                <Target className="h-4 w-4 mr-2" />
                {t.goToActionHub}
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href={`/${locale}/dashboard`}>{t.returnToDashboard}</Link>
            </Button>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="dd-report-reader min-h-screen flex flex-col report-page-bg">
      {/* Report Ready reveal overlay — first visit only */}
      <AnimatePresence>
        {showRevealOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          >
            {report.header.archetypeCode &&
              (() => {
                const revealContent = getArchetypeContent(
                  report.header.archetypeCode,
                );
                const revealLabel = findLabel(report.header.archetypeCode);
                const revealColor =
                  revealContent?.colorHex || revealLabel?.colorHex || "#3D2F23";
                const revealInitial = (
                  revealContent?.label_en ||
                  revealLabel?.label_en ||
                  report.header.archetypeCode
                )
                  .charAt(0)
                  .toUpperCase();
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-28 h-28 mb-5 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 45% 35%, ${revealColor}, ${revealColor}B3)`,
                    }}
                  >
                    <span
                      className="text-5xl font-bold"
                      style={{
                        color: "rgba(255,255,255,0.92)",
                        fontFamily:
                          "var(--font-display, system-ui, sans-serif)",
                        lineHeight: 1,
                      }}
                    >
                      {revealInitial}
                    </span>
                  </motion.div>
                );
              })()}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-xl font-semibold text-foreground tracking-wide"
            >
              {typedName}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passive engagement tracker */}
      <ReportEngagementTracker reportId={reportId} />

      {/* ═══ Card Flow ═══ */}
      <div
        className="flex-1 w-full"
        style={{ paddingTop: "var(--header-height, 68px)" }}
      >
        {/* Resume regenerate banner — present on every report; shows either a
            "re-enhance with resume" CTA or a quiet acknowledgment depending
            on whether resume evidence was baked into this report. */}
        {report.assessmentId && (
          <ResumeRegenerateBanner
            locale={locale as Locale}
            assessmentId={report.assessmentId}
            resumeEnhanced={report.meta?.resumeEnhanced === true}
            currentResumeFileName={data?.currentResume?.fileName ?? null}
            currentResumeUploadedAt={data?.currentResume?.uploadedAt ?? null}
            reportCreatedAt={data?.reportCreatedAt ?? null}
          />
        )}
        {/* In-one-line identity hook — 0-LLM Aha-moment surfaced before the
            card flow so value lands immediately (archetype + top values). */}
        <ReportDossierCover report={report} locale={locale as Locale} t={tv} />
        {/* The standalone "in one line — you are X" hook was removed: the dossier
            cover above already states the archetype as its primary signal, so
            the extra line repeated the archetype a third time. Top values now
            surface in the Strengths chapter where they have room to breathe. */}
        <ReportCardFlow
          screens={screens}
          reportId={currentReportId}
          t={tcf}
          profileHref={`/${locale}/profile`}
        />
      </div>
    </div>
  );
}
