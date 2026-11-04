"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchetypeAvatar } from "@/components/avatar";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import type { PersonalProfileData, RIASECDimension } from "@/lib/types";
import {
  COLLAB_STYLE_COLORS,
  RIASEC_BRAND_COLORS,
  SCHWARTZ_VALUE_LABELS,
} from "@/lib/scoring/constants";
import { PendingReportDossier } from "./pending-report-dossier";

const READINESS_INTERVAL_MS = 1_250;
const READINESS_MAX_ATTEMPTS = 12;
const STATUS_INTERVAL_MS = 2_500;
const STATUS_MAX_ATTEMPTS = 36;
const REFLECTION_STORAGE_PREFIX = "pending-report-reflection";

interface PendingReportClientProps {
  locale: string;
  assessmentId: string;
  initialReportId: string | null;
  profile: PendingProfileSummary | null;
}

type PendingProfileSummary = Pick<
  PersonalProfileData,
  | "assessmentId"
  | "archetype"
  | "collabMapping"
  | "schwartzAnchors"
  | "narrativeSnapshots"
>;

type PendingPhase =
  | "opening"
  | "recovering"
  | "checking"
  | "ready"
  | "slow"
  | "error";

function deriveIdentityAnchors(
  profile: PendingProfileSummary | null,
  locale: Locale,
) {
  if (!profile) return [];

  const anchors: string[] = [];
  const riasecPrimary = profile.archetype.primary as RIASECDimension;
  const primaryLabel = RIASEC_BRAND_COLORS[riasecPrimary];
  if (primaryLabel) {
    anchors.push(
      pickLocaleText(
        { en: primaryLabel.brandKey_en, zh: primaryLabel.brandKey_zh },
        locale,
      ),
    );
  }

  const topValue = profile.schwartzAnchors?.top3?.[0];
  if (topValue) {
    const valueLabel =
      SCHWARTZ_VALUE_LABELS[topValue as keyof typeof SCHWARTZ_VALUE_LABELS];
    if (valueLabel) anchors.push(pickLocaleText(valueLabel, locale));
  }

  const collabPrimary = profile.collabMapping?.primary;
  if (collabPrimary) {
    const collab = COLLAB_STYLE_COLORS[collabPrimary];
    if (collab) {
      anchors.push(
        pickLocaleText({ en: collab.name_en, zh: collab.name_zh }, locale),
      );
    }
  }

  return anchors;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PendingReportClient({
  locale,
  assessmentId,
  initialReportId,
  profile,
}: PendingReportClientProps) {
  const loc = locale as Locale;
  const dict = getDictionaryClient(loc);
  const t = dict.reportView;
  const rp = dict.reportPanels;
  const [phase, setPhase] = useState<PendingPhase>(
    initialReportId ? "opening" : "recovering",
  );
  const [attempts, setAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    initialReportId ? t.pendingStepOpening : t.pendingStepRecovering,
  );
  const [resolvedReportId, setResolvedReportId] = useState<string | null>(
    initialReportId,
  );
  const [selectedReflection, setSelectedReflection] = useState<string | null>(
    null,
  );
  const archetypeName = profile
    ? getLocalizedField(profile.archetype, "label", loc)
    : "";
  const tagline = profile
    ? getLocalizedField(profile.archetype, "tagline", loc)
    : "";
  const identitySummary =
    profile?.narrativeSnapshots?.identitySummary ||
    profile?.narrativeSnapshots?.coreInsight ||
    "";
  const identityAnchors = deriveIdentityAnchors(profile, loc);
  const chamberGradient =
    profile?.collabMapping?.cssGradient ||
    "linear-gradient(135deg, rgba(8,112,174,0.45), rgba(6,90,144,0.2), rgba(8,112,174,0.38))";
  const chapterCards = [
    {
      title: rp.yourIdentity,
      caption: t.progressStep2,
    },
    {
      title: rp.careerDirections,
      caption: t.progressStep3,
    },
    {
      title: rp.letterToUser,
      caption: t.progressStep4,
    },
  ];
  const activeChapterIndex =
    phase === "ready" || (phase === "opening" && resolvedReportId)
      ? chapterCards.length - 1
      : attempts > 0
        ? (attempts - 1) % chapterCards.length
        : 0;
  const showReflection = phase === "slow" || phase === "error" || attempts >= 5;
  const reflectionPrompts = [
    t.pendingReflectionPrompt1,
    t.pendingReflectionPrompt2,
    t.pendingReflectionPrompt3,
  ].filter(Boolean);
  const reflectionStorageKey = `${REFLECTION_STORAGE_PREFIX}:${assessmentId}:${locale}`;
  const coachingHref = selectedReflection
    ? `/${locale}/coaching?from=report&q=${encodeURIComponent(selectedReflection)}`
    : `/${locale}/coaching?from=report`;

  useEffect(() => {
    let cancelled = false;

    const waitForReadableReport = async (reportId: string) => {
      for (let attempt = 1; attempt <= READINESS_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return false;

        setAttempts(attempt);
        setPhase("opening");
        setStatusMessage(t.pendingStepOpening);

        try {
          const res = await fetch(`/api/report/${reportId}`, {
            credentials: "include",
            cache: "no-store",
          });

          if (res.ok) {
            setResolvedReportId(reportId);
            setPhase("ready");
            setStatusMessage(t.pendingStepReady);
            window.location.href = `/${locale}/report/${reportId}`;
            return true;
          }

          if (res.status === 401) {
            window.location.href = `/${locale}/login?redirect=/${locale}/report/pending?assessmentId=${assessmentId}`;
            return true;
          }
        } catch {
          if (cancelled) return false;
        }

        if (attempt < READINESS_MAX_ATTEMPTS) {
          await sleep(READINESS_INTERVAL_MS);
        }
      }

      return false;
    };

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/report/status?assessmentId=${encodeURIComponent(assessmentId)}`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (res.ok) {
          const data = (await res.json()) as {
            status?: "pending" | "ready";
            reportId?: string | null;
          };
          return data;
        }

        if (res.status === 401) {
          window.location.href = `/${locale}/login?redirect=/${locale}/report/pending?assessmentId=${assessmentId}`;
          return { status: "pending", reportId: null } as const;
        }
      } catch {
        if (cancelled) return null;
      }

      return null;
    };

    const recoverReport = async () => {
      if (initialReportId) {
        const ready = await waitForReadableReport(initialReportId);
        if (ready || cancelled) return;
      }

      setPhase("checking");
      setStatusMessage(t.pendingStepChecking);

      for (let attempt = 1; attempt <= STATUS_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;

        setAttempts(attempt);

        const data = await checkStatus();
        if (cancelled) return;

        if (data?.status === "ready" && data.reportId) {
          const ready = await waitForReadableReport(data.reportId);
          if (ready || cancelled) return;
        }

        if (attempt === Math.ceil(STATUS_MAX_ATTEMPTS / 2)) {
          setPhase("slow");
          setStatusMessage(t.pendingStepStillWorking);
        }

        if (attempt < STATUS_MAX_ATTEMPTS) {
          await sleep(STATUS_INTERVAL_MS);
        }
      }

      if (!cancelled) {
        setPhase("error");
        setStatusMessage(t.pendingErrorDesc);
      }
    };

    void recoverReport();

    return () => {
      cancelled = true;
    };
  }, [
    assessmentId,
    initialReportId,
    locale,
    t.pendingErrorDesc,
    t.pendingStepChecking,
    t.pendingStepOpening,
    t.pendingStepReady,
    t.pendingStepRecovering,
    t.pendingStepStillWorking,
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(reflectionStorageKey);
      if (stored) setSelectedReflection(stored);
    } catch {
      // ignore localStorage availability issues
    }
  }, [reflectionStorageKey]);

  const handleSelectReflection = (prompt: string) => {
    setSelectedReflection(prompt);
    try {
      localStorage.setItem(reflectionStorageKey, prompt);
    } catch {
      // ignore localStorage availability issues
    }
  };

  const title = phase === "error" ? t.pendingErrorTitle : t.pendingTitle;
  const description =
    phase === "error"
      ? t.pendingErrorDesc
      : phase === "recovering"
        ? t.pendingRecoveryDesc
        : t.pendingDesc;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(180deg, #011828 0%, #022A4A 36%, #0A5A8A 100%)",
      }}
    >
      <div className="absolute inset-0 caustics-overlay-subtle opacity-[0.14] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%)] pointer-events-none" />
      <div className="absolute top-28 left-[10%] w-28 h-28 rounded-full bg-sky-300/12 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute top-40 right-[12%] w-40 h-40 rounded-full bg-cyan-300/10 blur-3xl animate-float-slow pointer-events-none [animation-delay:1.5s]" />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-white/[0.04] blur-[120px] animate-breathe pointer-events-none" />

      <main
        className="relative flex-1 flex items-center justify-center px-4 py-10"
        style={{ paddingTop: "var(--header-height, 64px)" }}
      >
        <div className="w-full max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[32px] border border-white/12 overflow-hidden shadow-[0_30px_120px_-40px_rgba(0,0,0,0.6)]"
              style={{ background: chamberGradient }}
            >
              <div className="relative h-full bg-black/38 backdrop-blur-md p-6 sm:p-8">
                <div className="absolute inset-0 caustics-overlay-subtle opacity-[0.08] pointer-events-none" />
                <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/[0.08] blur-[120px] pointer-events-none" />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-7">
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute w-24 h-24 rounded-full opacity-45 blur-[2px] motion-safe:animate-[shimmer-rotate_18s_linear_infinite]"
                        style={{ background: "var(--grad-shimmer)" }}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute w-[88px] h-[88px] rounded-full"
                        style={{ background: chamberGradient }}
                        aria-hidden="true"
                      />
                      {profile ? (
                        <ArchetypeAvatar
                          code={profile.archetype.code}
                          size="md"
                          animated
                          locale={loc}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                          <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                        {t.pendingTitle}
                      </p>
                      <AnimatedGradientText
                        shimmer
                        className="text-2xl sm:text-3xl font-bold tracking-[-0.02em]"
                      >
                        {archetypeName || title}
                      </AnimatedGradientText>
                      <p className="text-sm text-white/72 mt-2 leading-relaxed max-w-md">
                        {tagline || description}
                      </p>
                    </div>
                  </div>

                  {identityAnchors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-7">
                      {identityAnchors.map((anchor, index) => (
                        <motion.span
                          key={anchor}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.12 + index * 0.08,
                          }}
                          className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/88"
                        >
                          {anchor}
                        </motion.span>
                      ))}
                    </div>
                  )}

                  <div className="rounded-[28px] border border-white/12 bg-white/[0.07] backdrop-blur-md p-5 sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 mb-3">
                      {dict.reportView.yourDeepDiveIdentity || rp.yourIdentity}
                    </p>
                    <p className="text-base sm:text-lg leading-[1.8] text-white/90 font-medium">
                      {identitySummary || description}
                    </p>
                  </div>

                  {showReflection && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      className="mt-6 rounded-[28px] border border-white/10 bg-black/20 backdrop-blur-md p-5 sm:p-6"
                    >
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 mb-2">
                        {t.pendingReflectionTitle}
                      </p>
                      <p className="text-sm text-white/72 leading-relaxed mb-4">
                        {t.pendingReflectionDesc}
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {reflectionPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => handleSelectReflection(prompt)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm leading-relaxed transition-colors ${
                              selectedReflection === prompt
                                ? "border-sky-300/28 bg-sky-300/[0.12] text-white"
                                : "border-white/10 bg-white/[0.06] text-white/82 hover:bg-white/[0.09]"
                            }`}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          asChild
                          className="rounded-full px-6 w-full sm:w-auto"
                        >
                          <Link href={coachingHref}>{t.startConversation}</Link>
                        </Button>
                        <p className="text-xs text-white/54 leading-relaxed">
                          {selectedReflection || t.aiCoachingDesc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
            >
              <Card className="h-full border-white/10 bg-[#031625]/70 text-white backdrop-blur-xl shadow-[0_24px_120px_-48px_rgba(0,0,0,0.7)] overflow-hidden">
                <CardContent className="relative p-6 sm:p-8 h-full flex flex-col">
                  <div className="absolute inset-0 caustics-overlay-subtle opacity-[0.08] pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]" />

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 mb-2">
                        {t.pendingProductLabel}
                      </p>
                      <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                        {title}
                      </h2>
                      <p className="text-sm text-white/68 leading-relaxed mt-2">
                        {description}
                      </p>
                    </div>

                    <div className="mb-5">
                      <PendingReportDossier
                        label={t.pendingTitle}
                        archetypeName={archetypeName || title}
                        tagline={tagline || description}
                        chapterCards={chapterCards}
                        activeChapterIndex={activeChapterIndex}
                        resolved={phase === "ready" || !!resolvedReportId}
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 sm:p-5 space-y-3 mb-5">
                      {chapterCards.map((chapter, index) => {
                        const isResolved =
                          (phase === "ready" ||
                            (phase === "opening" && resolvedReportId)) &&
                          index <= activeChapterIndex;
                        const isActive =
                          !isResolved &&
                          index === activeChapterIndex &&
                          phase !== "error";

                        return (
                          <motion.div
                            key={chapter.title}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.35,
                              delay: 0.15 + index * 0.08,
                            }}
                            className={`relative overflow-hidden rounded-2xl border px-4 py-4 ${
                              isResolved
                                ? "border-emerald-400/30 bg-emerald-400/[0.08]"
                                : isActive
                                  ? "border-sky-300/25 bg-sky-300/[0.08]"
                                  : "border-white/8 bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {isResolved ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                ) : isActive ? (
                                  <Loader2 className="w-4 h-4 text-sky-200 animate-spin" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-white/18 bg-white/[0.06]" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/92">
                                  {chapter.title}
                                </p>
                                <p className="text-xs text-white/58 leading-relaxed mt-1">
                                  {chapter.caption}
                                </p>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.75),transparent)] bg-[length:200%_100%] motion-safe:animate-[gradientSweep_5s_ease-in-out_infinite]" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    <div
                      className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 space-y-4"
                      aria-live="polite"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                          {phase === "error" ? (
                            <AlertCircle className="w-5 h-5 text-amber-300" />
                          ) : phase === "ready" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                          ) : (
                            <Loader2 className="w-5 h-5 text-sky-200 animate-spin" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white/92 leading-relaxed">
                            {statusMessage}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-emerald-300 mt-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{t.pendingSafeLeave}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/45">
                        {attempts > 0 && (
                          <span>
                            {t.pendingAttemptLabel.replace(
                              "{n}",
                              String(attempts),
                            )}
                          </span>
                        )}
                        {resolvedReportId && (
                          <span className="break-all">
                            {t.pendingReportIdLabel.replace(
                              "{id}",
                              resolvedReportId,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        size="lg"
                        className="rounded-full px-8 w-full sm:w-auto"
                        onClick={() => window.location.reload()}
                      >
                        {t.pendingRetryButton}
                      </Button>
                      <Button
                        asChild
                        variant="glass"
                        size="lg"
                        className="rounded-full px-6 w-full sm:w-auto"
                      >
                        <Link href={`/${locale}/profile`}>
                          {t.pendingBackToProfile}
                        </Link>
                      </Button>
                    </div>

                    {phase === "error" && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 space-y-2">
                        <p className="text-xs text-white/72 leading-relaxed">
                          {t.pendingContactResearcherHelp}
                        </p>
                        <a
                          href={`mailto:vincentluting@gmail.com?subject=Deep%20Dive%20report%20generation%20stuck&body=${encodeURIComponent(
                            `Report ID: ${resolvedReportId ?? assessmentId}\nAttempts: ${attempts}`,
                          )}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-200 hover:text-white transition-colors"
                        >
                          {t.pendingContactResearcher} →
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
