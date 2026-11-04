"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  Compass,
  FileText,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocaleFromCookie } from "@/lib/i18n/get-locale-client";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import {
  buildTriggerContext,
  isReportSectionId,
  sectionLabel,
  type CoachingEntryContext,
} from "@/lib/coaching/types";
import {
  buildCoachOSModeTrigger,
  coachOSModes,
  type CoachOSMode,
} from "@/lib/coaching/coach-os-modes";
import dynamic from "next/dynamic";

const CoachingChat = dynamic(
  () =>
    import("@/components/features/coaching-chat").then((m) => m.CoachingChat),
  { ssr: false },
);
const MemoryPanel = dynamic(
  () => import("@/components/features/memory-panel").then((m) => m.MemoryPanel),
  { ssr: false },
);
import { getBehaviorInsight } from "@/lib/scoring/behavior-insights";

import { NautilusSpiral } from "@/components/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { analytics } from "@/lib/analytics/client";
import { getClientId } from "@/lib/auth/client-id";
import type { Locale } from "@/lib/i18n/config";
import type { CoachAccessLevel } from "@/lib/coaching/get-coach-access-level";

const __DEV__ = process.env.NODE_ENV === "development";

type PageView = "setup" | "lobby" | "chat";

const TRIAL_STORAGE_KEY = "deep-dive-coaching-trial";

function getTrialState(): {
  active: boolean;
  startedAt?: string;
  goal?: string;
  pace?: string;
} | null {
  try {
    const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

function saveTrialState(data: {
  active: boolean;
  startedAt: string;
  goal: string;
  pace: string;
}) {
  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface ReportContext {
  answers: Record<string, unknown>;
  reportSummary: string | Record<string, unknown> | null;
  reportId: string | null;
  behaviorInsight?: string;
  triggerContext?: string;
}

export default function CoachingClient({
  userName,
}: {
  userName: string | null;
}) {
  const params = useParams();

  const searchParams = useSearchParams();
  const locale = (params.locale as string) || getLocaleFromCookie();
  const coachDict = getDictionaryClient(locale as "en" | "zh");
  const t = coachDict.coaching;
  const _ct = coachDict.coachingChat;
  const a11y = coachDict.a11y;

  // Read context from URL params (set by coaching CTAs in report)
  const rawFromParam = searchParams.get("from");
  const fromReport = rawFromParam === "report";
  const panelSource = searchParams.get("panel");
  // New chapter-based entry: ?from=<sectionId>&focus=<concept>
  const chapterSectionId = isReportSectionId(rawFromParam)
    ? rawFromParam
    : null;
  const rawFocus = searchParams.get("focus");
  // `focus=ai_anxiety` is a typed routing flag (not a concept the user wants
  // to "explore"), so we promote it to userIntent and keep focusConcept clean.
  // Any other focus value is treated as free-text concept (capped at 100ch).
  const isAiAnxietyFocus = rawFocus === "ai_anxiety";
  const focusConcept =
    rawFocus && !isAiAnxietyFocus ? rawFocus.slice(0, 100) : null;

  // Structured entry context (set if user came from a report chapter).
  // Persisted in state so the user can clear it via "change topic" button.
  const [entryContext, setEntryContext] = useState<CoachingEntryContext | null>(
    chapterSectionId
      ? {
          enteredFrom: chapterSectionId,
          focusConcept: focusConcept ?? undefined,
          userIntent: isAiAnxietyFocus ? "ai_anxiety" : undefined,
        }
      : null,
  );
  const gate = searchParams.get("gate");
  // When gate=post_survey, after coaching completes redirect to T1 survey
  const returnUrl =
    gate === "post_survey"
      ? `/${locale}/post-assessment?type=post_immediate`
      : undefined;

  const [view, setView] = useState<PageView>("lobby");
  const [goal, setGoal] = useState("");
  const [pace, setPace] = useState("");
  const [reportContext, setReportContext] = useState<ReportContext | null>(
    null,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [introContextText, setIntroContextText] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<CoachAccessLevel | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessRetryKey, setAccessRetryKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  /** Guard against concurrent / duplicate fetchReportContext calls */
  const fetchingContextRef = useRef(false);

  // Generate a stable client ID for the chat session
  const [clientId] = useState(() => {
    if (typeof window !== "undefined") {
      const existing = sessionStorage.getItem("coaching-client-id");
      if (existing) return existing;
      const id = `coach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("coaching-client-id", id);
      return id;
    }
    return `coach-${Date.now()}`;
  });

  // Set analytics context once on mount
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  // Hide the layout-level MobileTabBar while the immersive coaching surface is active.
  useEffect(() => {
    document.body.dataset.hideTabbar = "true";
    return () => {
      delete document.body.dataset.hideTabbar;
    };
  }, []);

  // Fetch coaching access level on mount (with retry on transient failure)
  useEffect(() => {
    let cancelled = false;
    const fetchAccess = async (attempt = 1) => {
      if (__DEV__)
        console.log(
          `[coach-debug][client] fetching /api/coaching-access (attempt ${attempt})`,
        );
      try {
        const r = await fetch("/api/coaching-access");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: (CoachAccessLevel & { userId?: string }) | null =
          await r.json();
        if (cancelled) return;
        if (__DEV__)
          console.log(
            "[coach-debug][client] coaching-access result:",
            JSON.stringify(data),
          );
        if (data?.userId) setUserId(data.userId);
        setAccessError(null);
        setAccessLevel(data);
        setAccessLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (attempt < 3) {
          if (__DEV__)
            console.warn(
              `[coach-debug][client] coaching-access attempt ${attempt} failed, retrying...`,
            );
          setTimeout(() => fetchAccess(attempt + 1), attempt * 1500);
        } else {
          if (__DEV__)
            console.error(
              "[coach-debug][client] coaching-access error after 3 attempts:",
              err,
            );
          setAccessLevel(null);
          setAccessError(_ct.errorConnection);
          setAccessLoading(false);
        }
      }
    };
    setAccessLoading(true);
    setAccessError(null);
    fetchAccess();
    return () => {
      cancelled = true;
    };
  }, [_ct.errorConnection, accessRetryKey]);

  const fetchReportContext = useCallback(async () => {
    // Prevent concurrent duplicate calls (e.g. from multiple effects)
    if (fetchingContextRef.current) {
      if (__DEV__)
        console.log(
          "[coach-debug][client] fetchReportContext SKIPPED (already in progress)",
        );
      return;
    }
    fetchingContextRef.current = true;
    if (__DEV__) console.log("[coach-debug][client] fetchReportContext START");

    setContextLoading(true);
    setContextError(null);
    try {
      // Fetch latest report
      const reportRes = await fetch("/api/reports/latest");
      let reportData = null;
      let reportId = null;
      let behaviorHint: string | undefined;
      if (reportRes.ok) {
        const data = await reportRes.json();
        if (data.id) {
          reportId = data.id;
          // Fetch full report (includes assessmentMeta for behavior insight)
          const fullRes = await fetch(`/api/report/${data.id}`);
          if (fullRes.ok) {
            reportData = await fullRes.json();
            // Derive coaching hint from assessment behavior data
            if (reportData?.assessmentMeta) {
              const meta = reportData.assessmentMeta;
              const insight = getBehaviorInsight(
                meta.rushCount,
                meta.hesitationCount,
                meta.totalQuestions,
              );
              behaviorHint = getLocalizedField(
                insight,
                "coachingHint",
                locale as Locale,
              );
            }
          }
        }
      }

      // Coaching context is built server-side from the report + profile +
      // memory — NOT raw questionnaire answers. The /api/coaching-chat route
      // discards client-sent answers and the system prompt never reads them,
      // so collecting a payload here would be dead weight. Keep it empty.
      const answers: Record<string, unknown> = {};

      // Build trigger context from report panel source or chapter entry
      let trigger: string | undefined;
      if (entryContext?.enteredFrom) {
        // New chapter-based entry: ?from=<sectionId>&focus=<concept>
        const built = buildTriggerContext(entryContext, locale);
        if (built) trigger = built;
      } else if (fromReport && panelSource) {
        // Legacy entry from CoachPreviewCard: ?from=report&panel=<1|2|3>
        const panelTopics: Record<string, { zh: string; en: string }> = {
          "1": {
            zh: "用户从报告的职业方向板块点进来，想讨论这些职业方向如何结合自身实际情况",
            en: "User came from the career directions panel and wants to discuss how these directions fit their real situation",
          },
          "2": {
            zh: "用户从报告的性格画像板块点进来，想深入了解自己的性格优势",
            en: "User came from the personality profile panel and wants to explore their personality strengths further",
          },
          "3": {
            zh: "用户从报告的现实路径板块点进来，想制定具体的行动计划",
            en: "User came from the reality pathway panel and wants to create a concrete action plan",
          },
        };
        const topic = panelTopics[panelSource];
        if (topic) {
          trigger = pickLocaleText(topic, locale as Locale);
        }
      }

      setReportContext({
        answers,
        reportSummary: reportData?.report || reportData?.content || null,
        reportId,
        behaviorInsight: behaviorHint,
        triggerContext: trigger,
      });
    } catch {
      setContextError(t.contextError);
      setReportContext({
        answers: {},
        reportSummary: null,
        reportId: null,
      });
    } finally {
      if (__DEV__)
        console.log("[coach-debug][client] fetchReportContext DONE", {
          hasReportContext: !!reportContext,
        });
      setContextLoading(false);
      fetchingContextRef.current = false;
    }
  }, [locale, entryContext, fromReport, panelSource, t.contextError]);

  // Fetch report context on mount — lobby is the entry point so we always need this
  useEffect(() => {
    if (__DEV__)
      console.log("[coach-debug][client] mount → fetchReportContext");
    fetchReportContext();
  }, [fetchReportContext]);

  // Read starter question from URL params (set by CoachPreviewCard on report page)
  useEffect(() => {
    const starterQ = searchParams.get("q");
    if (starterQ) {
      if (__DEV__)
        console.log(
          "[coach-debug][client] starter question from URL:",
          starterQ,
        );
      setIntroContextText(starterQ);
    }
  }, [searchParams]);

  const goals = [
    { key: "explore", label: t.goalExplore },
    { key: "transition", label: t.goalTransition },
    { key: "grow", label: t.goalGrow },
    { key: "clarity", label: t.goalClarity },
  ];

  const paces = [
    { key: "intensive", label: t.paceIntensive },
    { key: "balanced", label: t.paceBalanced },
    { key: "relaxed", label: t.paceRelaxed },
  ];

  const profileContextItems = [
    {
      label: t.observatoryProfileCorePattern,
      value: t.observatoryProfileCorePatternValue,
    },
    {
      label: t.observatoryProfileValuesTension,
      value: t.observatoryProfileValuesTensionValue,
    },
    {
      label: t.observatoryProfileCareerDirection,
      value: t.observatoryProfileCareerDirectionValue,
    },
  ];

  const sessionSignals = [
    t.observatorySessionSignalPrivate,
    t.observatorySessionSignalReport,
    t.observatorySessionSignalAction,
  ];

  const actionLabSteps = [
    {
      title: t.observatoryActionStep1,
      description: t.observatoryActionStep1Desc,
    },
    {
      title: t.observatoryActionStep2,
      description: t.observatoryActionStep2Desc,
    },
    {
      title: t.observatoryActionStep3,
      description: t.observatoryActionStep3Desc,
    },
  ];

  function trackCoachingStarted() {
    analytics
      .track("coaching_started", {
        reportId: reportContext?.reportId ?? undefined,
        triggerContext: reportContext?.triggerContext,
      })
      .catch(() => {});
  }

  function handleActivateTrial() {
    if (!goal || !pace) return;
    saveTrialState({
      active: true,
      startedAt: new Date().toISOString(),
      goal,
      pace,
    });
    trackCoachingStarted();
    // Return to entry/prep screen so user confirms before starting
    setView("lobby");
  }

  function handleLobbyConfirm() {
    // Save trial state and track analytics on first start
    const existing = getTrialState();
    if (!existing?.active) {
      saveTrialState({
        active: true,
        startedAt: new Date().toISOString(),
        goal: "explore",
        pace: "balanced",
      });
      trackCoachingStarted();
    }
    setView("chat");
  }

  function getCoachOSLabel(mode: CoachOSMode): string {
    const coachingCopy = t as Record<string, string>;
    return coachingCopy[mode.labelKey] ?? mode.intent.en;
  }

  function handleCoachOSMode(mode: CoachOSMode) {
    // #093: do NOT seed introContext with the button label — introContext is
    // rendered verbatim as the coach's first message AND skips the LLM init, so
    // the label would show as the opener and the mode would never reach the
    // coach. Clear it so the coach generates a real opener from the mode
    // trigger below.
    setIntroContextText(null);
    const modeTrigger = buildCoachOSModeTrigger(mode.id, locale);
    // #094: preserve the mode trigger even before the report context has loaded
    // (the old `: prev` dropped it when prev was null). A minimal context still
    // carries the trigger into the coach init.
    setReportContext((prev) =>
      prev
        ? {
            ...prev,
            triggerContext: [prev.triggerContext, modeTrigger]
              .filter(Boolean)
              .join("\n"),
          }
        : {
            answers: {},
            reportSummary: null,
            reportId: null,
            triggerContext: modeTrigger,
          },
    );
    handleLobbyConfirm();
  }

  // Access level loading spinner
  if (accessLoading) {
    return (
      <div className="dd-coaching-page min-h-dvh bg-background text-foreground">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100dvh - var(--header-height, 68px))" }}
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="dd-coaching-page min-h-dvh bg-background text-foreground">
        <div
          className="flex items-center justify-center px-4"
          style={{ minHeight: "calc(100dvh - var(--header-height, 68px))" }}
        >
          <div className="max-w-sm w-full rounded-2xl border border-border bg-card p-6 text-center card-shadow">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {accessError}
            </p>
            <button
              type="button"
              onClick={() => setAccessRetryKey((value) => value + 1)}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {_ct.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 0: No Quick Dive — show locked preview
  if (accessLevel?.level === 0) {
    return (
      <div className="dd-coaching-page min-h-dvh bg-background text-foreground pb-16 md:pb-0">
        <div
          className="flex"
          style={{ height: "calc(100dvh - var(--header-height, 68px))" }}
        >
          <div className="flex-1 flex flex-col min-w-0 px-4 pb-0">
            {/* Locked chat card */}
            <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto">
              <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border card-shadow">
                {/* Header */}
                <div className="border-b border-border bg-card px-4 sm:px-6 py-3 sm:py-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <NautilusSpiral className="h-5 w-5 text-primary" />
                    {_ct.aiCareerCoach}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {_ct.deepConversation}
                  </p>
                </div>

                {/* Message area with static welcome + invitation card */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-2 space-y-4 coaching-chat-bg">
                  {/* Static welcome message */}
                  <div className="flex justify-start items-end gap-2">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <NautilusSpiral className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="max-w-[80vw] sm:max-w-md lg:max-w-lg px-5 py-3 text-sm leading-relaxed chat-bubble-assistant">
                      {t.lockedWelcomeText}
                    </div>
                  </div>

                  {/* Invitation card */}
                  <div className="ml-8 sm:ml-9">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 max-w-sm">
                      <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
                        {t.lockedCardTitle}
                      </p>
                      <Link
                        href={`/${locale}/quickdive`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        {t.lockedCtaButton}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Disabled input */}
                <div
                  className="border-t border-border bg-card p-4"
                  style={{
                    paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                      disabled
                      placeholder={t.lockedInputPlaceholder}
                      className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground placeholder:text-muted-foreground/60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-coaching-page dd-coach-stage bg-background text-foreground h-[calc(100dvh-var(--header-height,68px))] overflow-hidden">
      {/* Chat view — full height, memory as on-demand sheet */}
      {view === "chat" && (
        <div className="flex flex-col h-full">
          {/* Memory toggle — top-right */}
          <div className="dd-coach-chat-toolbar flex items-center justify-end px-4 py-2 shrink-0">
            <button
              onClick={() => setMemoryPanelOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              title={t.aiMemory}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Memory Sheet — slides in from right on all screen sizes */}
          <Sheet open={memoryPanelOpen} onOpenChange={setMemoryPanelOpen}>
            <SheetContent
              side="right"
              className="w-[340px] sm:w-[380px] sm:max-w-[380px] p-0 overflow-y-auto"
              closeLabel={a11y.close}
            >
              <SheetHeader className="px-5 pt-5 pb-0">
                <SheetTitle className="text-sm font-medium">
                  {t.aiMemory}
                </SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <MemoryPanel locale={locale as "en" | "zh"} compact />
              </div>
            </SheetContent>
          </Sheet>

          {/* Chat container — full width with bottom breathing room */}
          <div className="dd-coach-workspace flex-1 min-h-0 flex flex-col px-4 pb-12">
            {contextLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {t.preparingSession}
                  </p>
                </div>
              </div>
            ) : reportContext ? (
              <div className="dd-coach-chat-shell flex-1 min-h-0 max-w-6xl w-full mx-auto">
                {contextError && (
                  <div className="mb-3 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                    {contextError}
                  </div>
                )}
                {entryContext?.enteredFrom && (
                  <div
                    data-testid="entry-badge"
                    data-intent={entryContext.userIntent ?? "default"}
                    className="mb-3 flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-[var(--rev-paper-warm,#f3efe6)] border border-[var(--rev-rule,rgba(0,0,0,0.08))] text-sm"
                  >
                    <span className="text-foreground/80">
                      {entryContext.userIntent === "ai_anxiety"
                        ? (coachDict.aiAnxiety?.entryBadge ??
                          "From the AI Era Anxiety focus")
                        : (
                            t.entryBadge ?? "From the {section} chapter"
                          ).replace(
                            "{section}",
                            sectionLabel(entryContext.enteredFrom, locale),
                          )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEntryContext(null);
                        // Also clear the derived trigger in reportContext so next turn is unhinted
                        setReportContext((prev) =>
                          prev ? { ...prev, triggerContext: undefined } : prev,
                        );
                      }}
                      className="text-[12px] font-medium text-[var(--rev-glow-cold,#0891b2)] hover:underline underline-offset-4"
                    >
                      {t.entryBadgeChangeTopic ?? "Change topic"}
                    </button>
                  </div>
                )}
                <CoachingChat
                  answers={reportContext.answers}
                  reportSummary={reportContext.reportSummary}
                  locale={locale as "en" | "zh"}
                  clientId={clientId}
                  userId={userId || undefined}
                  reportId={reportContext.reportId || undefined}
                  behaviorInsight={reportContext.behaviorInsight}
                  introContext={introContextText || undefined}
                  triggerContext={reportContext.triggerContext}
                  accessLevel={accessLevel?.level ?? 2}
                  completedRounds={accessLevel?.completedRounds ?? 0}
                  maxCoachRounds={accessLevel?.maxRounds ?? null}
                  returnUrl={returnUrl}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t.unableToLoadData}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Landing and Setup views */}
      {view !== "chat" && (
        <div className="h-full">
          {/* Lobby — single-screen flex layout, no scrolling */}
          {view === "lobby" &&
            (() => {
              const level = accessLevel?.level ?? 2;
              const remaining =
                level === 1 && accessLevel?.maxRounds != null
                  ? Math.max(
                      0,
                      accessLevel.maxRounds -
                        (accessLevel.completedRounds ?? 0),
                    )
                  : null;
              const greetingText = userName
                ? t.lobbyGreeting.replace("{{name}}", userName)
                : t.lobbyGreetingGeneric;

              return (
                <div className="dd-coach-lobby dd-coach-lobby-map dd-coach-observatory h-full px-4 py-6">
                  <div className="dd-coach-observatory-topbar">
                    <div className="min-w-0">
                      <p className="dd-coach-kicker">{t.observatoryEyebrow}</p>
                      <h1>{t.observatoryTitle}</h1>
                      <p>{t.observatorySubtitle}</p>
                    </div>
                    <div className="dd-coach-session-status">
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {remaining !== null
                          ? t.lobbyRoundsRemaining.replace(
                              "{{remaining}}",
                              String(remaining),
                            )
                          : level === 2
                            ? t.lobbyRoundsUnlimited
                            : t.observatorySessionStatus}
                      </span>
                    </div>
                  </div>

                  <div className="dd-coach-observatory-grid">
                    <section className="dd-coach-profile-rail">
                      <div className="dd-coach-rail-heading">
                        <Compass className="h-4 w-4" />
                        <div>
                          <p className="dd-coach-kicker">
                            {t.observatoryProfileKicker}
                          </p>
                          <h2>{t.observatoryProfileTitle}</h2>
                        </div>
                      </div>
                      <div className="dd-coach-context-list">
                        {profileContextItems.map((item) => (
                          <div key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="dd-coach-context-instrument">
                        <BarChart3 className="h-4 w-4" />
                        <div>
                          <span>{t.observatoryProfileInstrumentLabel}</span>
                          <strong>{t.observatoryProfileInstrumentValue}</strong>
                        </div>
                      </div>
                    </section>

                    <main className="dd-coach-session-panel">
                      <div className="dd-coach-session-copy">
                        <p className="dd-coach-kicker">{greetingText}</p>
                        <h2>{t.observatorySessionTitle}</h2>
                        <p>{t.observatorySessionPrompt}</p>
                      </div>

                      <div className="dd-coach-session-signals">
                        {sessionSignals.map((signal) => (
                          <span key={signal}>
                            <LockKeyhole className="h-3.5 w-3.5" />
                            {signal}
                          </span>
                        ))}
                      </div>

                      <div className="dd-coach-mode-board">
                        <div className="dd-coach-mode-board__header">
                          <Sparkles className="h-4 w-4" />
                          <div>
                            <p className="dd-coach-kicker">{t.coachOsTitle}</p>
                            <h3>{t.observatoryModeTitle}</h3>
                          </div>
                        </div>
                        <div className="dd-coach-os-grid">
                          {coachOSModes.map((mode) => (
                            <button
                              key={mode.id}
                              onClick={() => handleCoachOSMode(mode)}
                              className="min-h-11 px-4 py-2.5 rounded-xl border border-border bg-card text-left text-xs text-foreground/80 hover:border-primary/30 hover:bg-accent transition-colors"
                            >
                              {getCoachOSLabel(mode)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="dd-coach-session-actions">
                        <button
                          onClick={handleLobbyConfirm}
                          className="dd-coach-primary-cta inline-flex min-h-11 items-center justify-center gap-2 px-10 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {t.lobbyStartButton}
                        </button>
                        <button
                          onClick={() => setView("setup")}
                          className="dd-coach-secondary-cta inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t.simpleLandingSetupCta}
                        </button>
                      </div>
                    </main>

                    <section className="dd-coach-action-lab">
                      <div className="dd-coach-rail-heading">
                        <Target className="h-4 w-4" />
                        <div>
                          <p className="dd-coach-kicker">
                            {t.observatoryActionKicker}
                          </p>
                          <h2>{t.observatoryActionTitle}</h2>
                        </div>
                      </div>
                      <p className="dd-coach-action-copy">
                        {t.observatoryActionSubtitle}
                      </p>
                      <div className="dd-coach-action-steps">
                        {actionLabSteps.map((step, index) => (
                          <div key={step.title}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <div>
                              <strong>{step.title}</strong>
                              <p>{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="dd-coach-action-boundary">
                        <FileText className="h-4 w-4" />
                        <span>{t.observatoryActionBoundary}</span>
                      </div>
                    </section>
                  </div>
                </div>
              );
            })()}

          {/* Setup view — single-screen, no scrolling */}
          {view === "setup" && (
            <div className="dd-coach-lobby dd-coach-setup-panel h-full flex flex-col items-center justify-center px-4 py-6">
              {/* Header */}
              <div className="flex flex-col items-center mb-auto pt-4 sm:pt-8">
                <button
                  onClick={() => setView("lobby")}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.back}</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
                  {t.trialStartTitle}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t.trialStartSubtitle}
                </p>
              </div>

              {/* Selections */}
              <div className="dd-coach-setup-form w-full max-w-lg mb-auto">
                {/* Goal selection */}
                <div className="mb-6">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                    {t.goalLabel}
                  </label>
                  <div className="dd-coach-selection-grid grid grid-cols-2 gap-2">
                    {goals.map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setGoal(g.key)}
                        className={`px-4 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                          goal === g.key
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace selection */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                    {t.paceLabel}
                  </label>
                  <div className="dd-coach-selection-grid dd-coach-selection-grid--pace grid grid-cols-3 gap-2">
                    {paces.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPace(p.key)}
                        className={`px-3 py-2.5 rounded-xl border text-sm text-center transition-colors ${
                          pace === p.key
                            ? "border-primary bg-primary/5 text-foreground font-medium"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activate CTA */}
              <div className="dd-coach-setup-actions pb-4 sm:pb-8">
                <button
                  onClick={handleActivateTrial}
                  disabled={!goal || !pace}
                  className="dd-coach-primary-cta px-10 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t.activateTrial}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
