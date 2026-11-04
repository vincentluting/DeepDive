"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  Loader2,
  AlertCircle,
  CircleDashed,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import type {
  PipelineStatusResponse,
  PipelineStepStatus,
  PipelineReportStatus,
} from "@/lib/pipeline/types";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { reportClientError } from "@/lib/observability/client-error";

interface ProcessingClientProps {
  locale: string;
  pipelineId: string;
  assessmentId: string;
}

const POLL_INTERVAL_MS = 2500;
const POLL_BACKOFF_CAP_MS = 20_000;
const SLOW_WARNING_MS = 240_000;
// After all auto steps are done, hold on the reveal card for this long before
// navigating — gives the user time to absorb their archetype.
const REVEAL_HOLD_MS = 3800;

function StepRow({
  label,
  status,
  dictStates,
}: {
  label: string;
  status: PipelineStepStatus | PipelineReportStatus;
  dictStates: Record<string, string>;
}) {
  const isDone = status === "done";
  const isRunning = status === "running";
  const isFailed = status === "failed";
  const isNotRequested = status === "not_requested";

  const stateLabel =
    status === "done"
      ? dictStates.stateDone
      : status === "running"
        ? dictStates.stateRunning
        : status === "failed"
          ? dictStates.stateFailed
          : status === "not_requested"
            ? dictStates.stateNotRequested
            : dictStates.stateWaiting;

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-white/5 last:border-none">
      <div className="flex items-center gap-3">
        {isDone ? (
          <Check className="w-5 h-5 text-emerald-400" aria-hidden />
        ) : isRunning ? (
          <Loader2 className="w-5 h-5 text-sky-300 animate-spin" aria-hidden />
        ) : isFailed ? (
          <AlertCircle className="w-5 h-5 text-amber-300" aria-hidden />
        ) : isNotRequested ? (
          <CircleDashed className="w-5 h-5 text-white/40" aria-hidden />
        ) : (
          <CircleDashed className="w-5 h-5 text-white/60" aria-hidden />
        )}
        <span
          className={
            isDone
              ? "text-white/95"
              : isRunning
                ? "text-white"
                : isFailed
                  ? "text-amber-100"
                  : "text-white/70"
          }
        >
          {label}
        </span>
      </div>
      <span className="text-xs uppercase tracking-wider text-white/50">
        {stateLabel}
      </span>
    </div>
  );
}

// ── Static bilingual labels for preview chips (not UI copy) ──
const RIASEC_LABELS: Record<string, { en: string; zh: string; nl: string }> = {
  R: { en: "Realistic", zh: "现实型", nl: "Realistisch" },
  I: { en: "Investigative", zh: "研究型", nl: "Onderzoekend" },
  A: { en: "Artistic", zh: "艺术型", nl: "Artistiek" },
  S: { en: "Social", zh: "社会型", nl: "Sociaal" },
  E: { en: "Enterprising", zh: "企业型", nl: "Ondernemend" },
  C: { en: "Conventional", zh: "常规型", nl: "Conventioneel" },
};
const BIG_FIVE_LABELS: Record<string, { en: string; zh: string; nl: string }> =
  {
    openness: { en: "Openness", zh: "开放性", nl: "Openheid" },
    conscientiousness: {
      en: "Conscientiousness",
      zh: "尽责性",
      nl: "Consciëntieusheid",
    },
    extraversion: { en: "Extraversion", zh: "外向性", nl: "Extraversie" },
    agreeableness: { en: "Agreeableness", zh: "宜人性", nl: "Vriendelijkheid" },
    neuroticism: {
      en: "Emotional Sensitivity",
      zh: "情绪敏感性",
      nl: "Emotionele gevoeligheid",
    },
  };
const VALUE_LABELS: Record<string, { en: string; zh: string; nl: string }> = {
  achievement: { en: "Achievement", zh: "成就", nl: "Prestatie" },
  power: { en: "Power", zh: "权力", nl: "Invloed" },
  stimulation: { en: "Stimulation", zh: "刺激", nl: "Stimulatie" },
  "self-direction": { en: "Self-Direction", zh: "自主", nl: "Zelfsturing" },
  hedonism: { en: "Hedonism", zh: "享乐", nl: "Plezier" },
  benevolence: { en: "Benevolence", zh: "仁慈", nl: "Welwillendheid" },
  universalism: { en: "Universalism", zh: "普世", nl: "Universalisme" },
  conformity: { en: "Conformity", zh: "顺从", nl: "Conformiteit" },
  tradition: { en: "Tradition", zh: "传统", nl: "Traditie" },
  security: { en: "Security", zh: "安全", nl: "Zekerheid" },
};

function pickLocaleLabel(
  map: Record<string, { en: string; zh: string; nl: string }>,
  key: string,
  loc: Locale,
): string {
  const row = map[key];
  if (!row) return key;
  if (loc === "nl") return row.nl;
  return loc === "zh" ? row.zh : row.en;
}

export default function ProcessingClient({
  locale,
  pipelineId,
  assessmentId,
}: ProcessingClientProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const dict = getDictionaryClient(loc);
  const t = dict.processing;

  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number>(Date.now());
  const [showReveal, setShowReveal] = useState(false);
  const revealTriggeredRef = useRef(false);
  const navigatedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  // Retry button state. "idle" → button clickable; "loading" → POST in flight;
  // "rate-limited" / "error" → show inline message and re-enable button after a beat.
  const [retryState, setRetryState] = useState<
    "idle" | "loading" | "rate-limited" | "error"
  >("idle");
  const [retryErrorMessage, setRetryErrorMessage] = useState<string | null>(
    null,
  );

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline/${pipelineId}/status`, {
        credentials: "include",
      });
      if (!res.ok) {
        consecutiveErrorsRef.current += 1;
        setError(`HTTP ${res.status}`);
        return;
      }
      const body = (await res.json()) as PipelineStatusResponse;
      consecutiveErrorsRef.current = 0;
      setStatus(body);
      setError(null);
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      setError(err instanceof Error ? err.message : "network");
    }
  }, [pipelineId]);

  // Retry handler — invoked when pipeline.status === 'failed' and user clicks
  // the "重新启动分析 / Restart analysis" button. POSTs to the retry endpoint
  // which atomically resets retryCount=0 + status=pending so the cron worker
  // picks it up again within ~60s. Pre-2026-05 this was window.location.reload()
  // which did nothing (the cron worker's claim SQL filters retryCount<5).
  const handleRetry = useCallback(async () => {
    if (retryState === "loading") return;
    setRetryState("loading");
    setRetryErrorMessage(null);
    try {
      const res = await csrfFetch(`/api/pipeline/${pipelineId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 429) {
        setRetryState("rate-limited");
        setRetryErrorMessage(t.errorRetryFailed);
        // Re-enable after 5s — DB rate limit is 60s but user UX shouldn't
        // be locked that long; if they click again within 60s they'll just
        // get another 429 with the same message.
        setTimeout(() => setRetryState("idle"), 5000);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // Success — DB now in 'pending'. Trigger an immediate status fetch
      // so the UI flips out of the failed view without waiting for the
      // next poll tick. The reveal/navigate effects take over from there.
      await fetchStatus();
      setRetryState("idle");
    } catch (err) {
      reportClientError(err, {
        component: "ProcessingClient",
        feature: "pipeline-retry",
        extra: { pipelineId },
      });
      setRetryState("error");
      setRetryErrorMessage(t.errorRetryFailed);
      setTimeout(() => setRetryState("idle"), 5000);
    }
  }, [pipelineId, retryState, fetchStatus, t.errorRetryFailed]);

  // Poll the status endpoint with:
  //   - visibility pause: don't hammer the server while the tab is hidden
  //   - exponential backoff on consecutive errors: 2.5s → 5s → 10s → 20s cap
  //     so an outage doesn't cause the client to thrash
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (cancelled) return;
      const backoffMs =
        consecutiveErrorsRef.current > 0
          ? Math.min(
              POLL_INTERVAL_MS * 2 ** (consecutiveErrorsRef.current - 1),
              POLL_BACKOFF_CAP_MS,
            )
          : POLL_INTERVAL_MS;
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (typeof document !== "undefined" && document.hidden) {
          // Tab hidden — skip this tick, try again later.
          schedule();
          return;
        }
        await fetchStatus();
        schedule();
      }, backoffMs);
    };

    // Kick off immediately, then poll on schedule.
    void (async () => {
      await fetchStatus();
      schedule();
    })();

    // Resume immediately when the tab becomes visible again.
    const onVisibility = () => {
      if (!document.hidden && !cancelled) {
        if (timer) clearTimeout(timer);
        void fetchStatus().then(schedule);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [fetchStatus]);

  // Elapsed counter.
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When the full profile lands (algorithmic profile + complete narratives),
  // flip to reveal + hold + then navigate.
  //
  // Depend on atomic step fields rather than the whole `status` object.
  // Previously this effect re-ran every 2.5s poll (status reference changed),
  // and React's cleanup pattern — prior-cleanup → next-effect — would clear
  // the navigation timer before it could fire. Because revealTriggeredRef was
  // already true after the first run, no new timer got scheduled, so the 3.8s
  // auto-navigation never executed. Depending on specific primitive fields
  // (that stop changing once "done") means the effect settles after one run.
  //
  // Profile is a complete deliverable: users should not enter it while the
  // identity narrative chapter is still missing sections.
  useEffect(() => {
    if (revealTriggeredRef.current) return;
    if (
      !(
        status?.profileStatus === "done" &&
        status?.narrativesStatus === "done" &&
        status?.profileId
      )
    ) {
      return;
    }
    revealTriggeredRef.current = true;
    setShowReveal(true);
    const profileId = status.profileId;
    const timeout = setTimeout(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace(`/${locale}/profile/${profileId}`);
    }, REVEAL_HOLD_MS);
    return () => clearTimeout(timeout);
  }, [
    status?.profileStatus,
    status?.narrativesStatus,
    status?.profileId,
    locale,
    router,
  ]);

  const allFailed = status?.status === "failed";
  const showSlow = elapsedMs > SLOW_WARNING_MS && !allFailed && !showReveal;
  const isRetrying = (status?.retryCount ?? 0) > 0;
  const preview = status?.profilePreview ?? null;

  const archetypeName =
    preview &&
    (loc === "zh" ? preview.archetypeLabelZh : preview.archetypeLabelEn);
  const archetypeTagline =
    preview &&
    (loc === "zh" ? preview.archetypeTaglineZh : preview.archetypeTaglineEn);

  const openProfile = () => {
    if (navigatedRef.current || !status?.profileId) return;
    navigatedRef.current = true;
    router.replace(`/${locale}/profile/${status.profileId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-xl px-6 py-16">
        <AnimatePresence mode="wait">
          {showReveal && preview ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/30 via-indigo-400/20 to-transparent">
                <Sparkles className="h-10 w-10 text-sky-200" aria-hidden />
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3">
                {t.revealEyebrow}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-3">
                {archetypeName}
              </h1>
              {archetypeTagline && (
                <p className="text-sm text-white/70 max-w-sm mx-auto mb-8">
                  {archetypeTagline}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {preview.topInterest && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                    <p className="text-[10px] uppercase tracking-widest text-white/50">
                      {t.revealTopInterest}
                    </p>
                    <p className="text-sm text-white">
                      {pickLocaleLabel(
                        RIASEC_LABELS,
                        preview.topInterest.code,
                        loc,
                      )}{" "}
                      <span className="text-white/50 text-xs">
                        {preview.topInterest.score}
                      </span>
                    </p>
                  </div>
                )}
                {preview.topBigFive && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left">
                    <p className="text-[10px] uppercase tracking-widest text-white/50">
                      {t.revealTopTrait}
                    </p>
                    <p className="text-sm text-white">
                      {pickLocaleLabel(
                        BIG_FIVE_LABELS,
                        preview.topBigFive.key,
                        loc,
                      )}{" "}
                      <span className="text-white/50 text-xs">
                        {preview.topBigFive.score}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              {preview.topValues.length > 0 && (
                <div className="mx-auto mb-10 max-w-sm rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
                    {t.revealCoreValues}
                  </p>
                  <p className="text-sm text-white">
                    {preview.topValues
                      .map((v) => pickLocaleLabel(VALUE_LABELS, v, loc))
                      .join(" · ")}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-300/90 mb-8">
                <Check className="h-4 w-4" aria-hidden />
                <span>
                  {status?.narrativesStatus === "done"
                    ? t.revealReady
                    : t.revealNarrativesWorking}
                </span>
              </div>
              <Button
                onClick={openProfile}
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                {t.revealOpenCta}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-serif text-white/95 mb-2">
                {allFailed ? t.errorTitle : t.title}
              </h1>
              <p
                className={`text-sm text-white/70 ${allFailed ? "mb-8" : "mb-4"}`}
              >
                {allFailed ? t.errorBody : t.subtitle}
              </p>

              {!allFailed && (
                <div className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/[0.08] px-3 py-2 text-xs text-sky-100/85">
                  <Clock
                    className="h-3.5 w-3.5 shrink-0 text-sky-200"
                    aria-hidden
                  />
                  <span>{t.estimatedTime}</span>
                </div>
              )}

              <Card className="bg-white/[0.04] border-white/10 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div role="progressbar" aria-label={t.ariaProgress}>
                    <StepRow
                      label={t.stepScoringLabel}
                      status={
                        (status?.scoringStatus as PipelineStepStatus) ??
                        "pending"
                      }
                      dictStates={t}
                    />
                    <StepRow
                      label={t.stepProfileLabel}
                      status={
                        (status?.profileStatus as PipelineStepStatus) ??
                        "pending"
                      }
                      dictStates={t}
                    />
                    <StepRow
                      label={t.stepNarrativesLabel}
                      status={
                        (status?.narrativesStatus as PipelineStepStatus) ??
                        "pending"
                      }
                      dictStates={t}
                    />
                  </div>
                </CardContent>
              </Card>

              {isRetrying && !allFailed && (
                <p className="mt-6 text-sm text-amber-200/90">
                  {interpolate(t.retryingMessage, {
                    attempt: status?.retryCount ?? 0,
                  })}
                </p>
              )}
              {showSlow && !isRetrying && !allFailed && (
                <p className="mt-6 text-sm text-white/60">{t.slowMessage}</p>
              )}

              {allFailed && (
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    onClick={handleRetry}
                    disabled={
                      retryState === "loading" || retryState === "rate-limited"
                    }
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {retryState === "loading" ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {t.errorRetrying}
                      </span>
                    ) : (
                      t.errorRetry
                    )}
                  </Button>
                  {retryErrorMessage && (
                    <p
                      className="text-xs text-amber-200/80"
                      role="alert"
                      aria-live="polite"
                    >
                      {retryErrorMessage}
                    </p>
                  )}
                  {status?.lastStepError && (
                    <p className="text-xs text-white/50 font-mono break-all">
                      {status.lastStepError}
                    </p>
                  )}
                </div>
              )}

              {error && !status && (
                <p className="mt-6 text-xs text-red-300/70 font-mono">
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dev data for debugging */}
        {process.env.NODE_ENV === "development" && status && (
          <details className="mt-8 text-xs text-white/30">
            <summary>dev · pipeline state</summary>
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify({ pipelineId, assessmentId, status }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
