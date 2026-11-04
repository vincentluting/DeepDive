"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/glow-card";

import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { useQuestionnaireStore } from "@/store/questionnaire-store";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { canAccess } from "@/lib/cohort/entitlements";

// ============================================================
// localStorage keys for detecting prior results
// ============================================================

const QD_HISTORY_KEY = "deep-dive-quickdive-history";
const QUESTIONNAIRE_KEY = "deep-dive-questionnaire-session";
const DD_ZUSTAND_KEY = "deep-dive-questionnaire-session-v2";
const IMM_PROGRESS_KEY = "deep-dive-immersive-progress";
const IMM_RESULT_KEY = "deep-dive-last-immersive-id";
const QD_RESULT_KEY = "deep-dive-last-quickdive-id";

interface AssessmentStatus {
  hasResults: boolean;
  inProgress: boolean;
}

function getQuickDiveStatus(): AssessmentStatus {
  try {
    const history = localStorage.getItem(QD_HISTORY_KEY);
    if (history) {
      const entries = JSON.parse(history);
      if (Array.isArray(entries) && entries.length > 0) {
        return { hasResults: true, inProgress: false };
      }
    }
  } catch {
    /* ignore */
  }
  return { hasResults: false, inProgress: false };
}

function getDeepDiveStatus(): AssessmentStatus {
  try {
    // Check Zustand persisted store
    const stored = localStorage.getItem(DD_ZUSTAND_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const session = data?.state?.session;
      if (session) {
        if (session.completedAt) {
          return { hasResults: true, inProgress: false };
        }
        if (session.answers?.length > 0) {
          return { hasResults: false, inProgress: true };
        }
      }
    }
    // Also check the raw session key
    const rawSession = localStorage.getItem(QUESTIONNAIRE_KEY);
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session.completedAt) {
        return { hasResults: true, inProgress: false };
      }
      if (session.answers?.length > 0) {
        return { hasResults: false, inProgress: true };
      }
    }
  } catch {
    /* ignore */
  }
  return { hasResults: false, inProgress: false };
}

function getImmersiveStatus(): AssessmentStatus {
  try {
    const progress = localStorage.getItem(IMM_PROGRESS_KEY);
    if (progress) {
      const data = JSON.parse(progress);
      if (data.answers && Object.keys(data.answers).length > 0) {
        return { hasResults: false, inProgress: true };
      }
    }
    const immersiveResultId = localStorage.getItem(IMM_RESULT_KEY);
    if (immersiveResultId) {
      return { hasResults: true, inProgress: false };
    }
    // Backward compatibility: older immersive completions used the shared key.
    // Only treat it as immersive when Quick Dive history is absent.
    const legacyResultId = localStorage.getItem(QD_RESULT_KEY);
    if (legacyResultId && !getQuickDiveStatus().hasResults) {
      return { hasResults: true, inProgress: false };
    }
  } catch {
    /* ignore */
  }
  return { hasResults: false, inProgress: false };
}

function clearQuickDiveResults() {
  try {
    localStorage.removeItem(QD_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

function clearDeepDiveResults() {
  try {
    localStorage.removeItem(DD_ZUSTAND_KEY);
    localStorage.removeItem(QUESTIONNAIRE_KEY);
    localStorage.removeItem("deepdive_pending_assessment");
  } catch {
    /* ignore */
  }
}

// ============================================================
// ExploreHub Component
// ============================================================

interface ExploreHubProps {
  locale: Locale;
  researchGroup?: "classic" | "immersive" | null;
  cohort?: string | null;
  gate?: string;
  /** Server-side assessment status from DB — authoritative for logged-in users */
  serverStatus?: {
    quickDive: { hasResults: boolean };
    immersiveDive: { hasResults: boolean };
    deepDive: { hasResults: boolean; inProgress: boolean };
  } | null;
  /** Whether current user is admin — enables quick test buttons */
  isAdmin?: boolean;
}

export function ExploreHub({
  locale,
  researchGroup = null,
  cohort = null,
  gate,
  serverStatus = null,
  isAdmin = false,
}: ExploreHubProps) {
  const fullDict = getDictionaryClient(locale);
  const t = fullDict.exploreHub as Record<string, string>;
  const a11y = fullDict.a11y;

  const resetSession = useQuestionnaireStore((s) => s.resetSession);

  const [qdStatus, setQdStatus] = useState<AssessmentStatus>({
    hasResults: false,
    inProgress: false,
  });
  const [imStatus, setImStatus] = useState<AssessmentStatus>({
    hasResults: false,
    inProgress: false,
  });
  const [ddStatus, setDdStatus] = useState<AssessmentStatus>({
    hasResults: false,
    inProgress: false,
  });
  const [retakeConfirm, setRetakeConfirm] = useState<
    "quickdive" | "immersive" | "deepdive" | null
  >(null);
  const [mounted, setMounted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(
    gate === "quickdive" || gate === "invite_required",
  );
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoFillLoading, setAutoFillLoading] = useState<
    | "quick"
    | "immersive"
    | "deep"
    | "preset-quick"
    | "preset-immersive"
    | "preset-deep"
    | null
  >(null);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [hasPreset, setHasPreset] = useState<{
    quickDive: boolean;
    deepDive: boolean;
  } | null>(null);

  // Lock states:
  // All three cards are always visible. Locked based on entitlement + research group assignment.
  // Research group locks the opposite mode (classic group locks Immersive, immersive group locks Classic).
  const hasImmersiveAccess = canAccess(cohort, "immersiveDive");
  const hasDeepDiveAccess = canAccess(cohort, "deepDive");
  const classicLockedByResearch = researchGroup === "immersive";
  const immersiveLockedByResearch = researchGroup === "classic";
  const immersiveLocked = !hasImmersiveAccess || immersiveLockedByResearch;

  // Check if admin has a saved preset
  useEffect(() => {
    if (!isAdmin) return;
    csrfFetch("/api/admin/answer-preset")
      .then((res) => {
        if (!res.ok) throw new Error(`Preset fetch ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.preset) {
          setHasPreset({
            quickDive: data.preset.hasQuickDive,
            deepDive: data.preset.hasDeepDive,
          });
        }
      })
      .catch(() => {
        setHasPreset(null);
      });
  }, [isAdmin]);

  const handleAutoFill = useCallback(
    async (type: "quick" | "immersive" | "deep", usePreset = false) => {
      const loadingKey = usePreset ? (`preset-${type}` as const) : type;
      setAutoFillLoading(loadingKey);
      setAutoFillError(null);
      try {
        const res = await csrfFetch("/api/admin/auto-fill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, locale, usePreset }),
        });
        if (!res.ok) {
          const data = await res
            .json()
            .catch(() => ({ error: { message: "Request failed" } }));
          throw new Error(
            data.error?.message || `Auto-fill failed (${res.status})`,
          );
        }
        const data = await res.json();
        if (data.type === "deep") {
          // Deep Dive → profile page (report is generated manually from profile)
          window.location.href = `/${locale}/profile`;
        } else {
          if (!data.reportId) throw new Error("Quick Dive save failed");
          window.location.href = `/${locale}/report/quick/${data.reportId}`;
        }
      } catch (err) {
        setAutoFillError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setAutoFillLoading(null);
      }
    },
    [locale],
  );

  useEffect(() => {
    setMounted(true);
    if (serverStatus) {
      // Logged-in user: use authoritative DB status
      setQdStatus({
        hasResults: serverStatus.quickDive.hasResults,
        inProgress: false,
      });
      setImStatus({
        hasResults: serverStatus.immersiveDive.hasResults,
        inProgress: false,
      });
      setDdStatus(serverStatus.deepDive);
    } else {
      // Anonymous user: fall back to localStorage
      setQdStatus(getQuickDiveStatus());
      setImStatus(getImmersiveStatus());
      setDdStatus(getDeepDiveStatus());
    }
  }, [serverStatus]);

  useEffect(() => {
    if (bannerVisible && gate !== "invite_required") {
      bannerTimerRef.current = setTimeout(() => setBannerVisible(false), 3000);
    }
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [bannerVisible]);

  const handleRetake = useCallback(
    async (assessment: "quickdive" | "immersive" | "deepdive") => {
      if (assessment === "quickdive") {
        // Best-effort server reset (silently ignored if not logged in)
        await csrfFetch("/api/quickdive/reset", { method: "POST" }).catch(
          () => {},
        );
        clearQuickDiveResults();
        try {
          localStorage.removeItem(QD_RESULT_KEY);
        } catch {
          /* ignore */
        }
        setQdStatus({ hasResults: false, inProgress: false });
      } else if (assessment === "immersive") {
        await csrfFetch("/api/immersive/reset", { method: "POST" }).catch(
          () => {},
        );
        const hasQuickDiveResults = getQuickDiveStatus().hasResults;
        try {
          localStorage.removeItem(IMM_PROGRESS_KEY);
          localStorage.removeItem(IMM_RESULT_KEY);
          if (!hasQuickDiveResults) {
            localStorage.removeItem(QD_RESULT_KEY);
          }
        } catch {
          /* ignore */
        }
        setImStatus({ hasResults: false, inProgress: false });
      } else {
        // Best-effort server reset (silently ignored if not logged in)
        await csrfFetch("/api/deepdive/reset", { method: "POST" }).catch(
          () => {},
        );
        clearDeepDiveResults();
        resetSession();
        setDdStatus({ hasResults: false, inProgress: false });
      }
      setRetakeConfirm(null);
    },
    [resetSession],
  );

  if (!mounted) {
    return (
      <div className="dd-explore sunlit-field min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
      </div>
    );
  }

  const deepDivePrereqLocked = !qdStatus.hasResults && !imStatus.hasResults;
  const deepDiveLocked = deepDivePrereqLocked || !hasDeepDiveAccess;
  const immersiveCompletedViaQuick =
    !imStatus.hasResults && !imStatus.inProgress && qdStatus.hasResults;

  return (
    // reducedMotion="user" → Framer auto-disables transform/layout motion for
    // the whole Explore tree when the OS preference is set, keeping gentle
    // opacity fades (vestibular-safe). One wrapper vs. gating each motion.div.
    <MotionConfig reducedMotion="user">
      <div className="dd-explore sunlit-field min-h-dvh pt-12 sm:pt-20 lg:pt-24 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="dd-explore-shell max-w-6xl mx-auto relative z-10">
          {/* Gate banner */}
          <AnimatePresence>
            {bannerVisible && (
              <motion.div
                className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-foreground/[0.04] border border-border/50 text-sm text-foreground/80"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 shrink-0" />
                <span className="flex-1">
                  {gate === "invite_required"
                    ? t.gateInviteRequired
                    : t.gateQuickdive}
                </span>
                {gate === "invite_required" && serverStatus && (
                  <Link
                    href={`/${locale}/settings`}
                    className="shrink-0 text-xs font-medium underline underline-offset-2 hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {t.gateInviteSettingsLink}
                  </Link>
                )}
                <button
                  onClick={() => setBannerVisible(false)}
                  className="shrink-0 p-0.5 rounded hover:bg-primary/10 transition-colors"
                  aria-label={a11y.dismiss}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header — Dive Gateway stage */}
          <motion.div
            className="dd-explore-hero text-center mb-6 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="dd-explore-kicker">{t.gatewayLabel}</p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[var(--explore-ink)] mb-4">
              {t.title}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl !text-[rgba(198,223,239,0.78)] max-w-xl lg:max-w-2xl mx-auto leading-relaxed">
              {t.subtitle}
            </p>
          </motion.div>

          {/* Admin auto-fill error */}
          {autoFillError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center justify-between">
              <span>{autoFillError}</span>
              <button
                onClick={() => setAutoFillError(null)}
                className="ml-2 shrink-0"
                aria-label={a11y.dismissError}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Assessment Cards — horizontal tier layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* ── Quick Dive ── */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="flex-1">
                <AssessmentCard
                  stage="01"
                  stepLabel={t.stepQuickDive}
                  icon={Compass}
                  title={t.quickDiveTitle}
                  description={t.quickDiveDesc}
                  time={t.quickDiveTime}
                  questionCount={t.quickDiveQuestions}
                  href={`/${locale}/quickdive`}
                  status={
                    classicLockedByResearch
                      ? { hasResults: false, inProgress: false }
                      : qdStatus
                  }
                  t={t}
                  accentFrom="from-amber-400/50"
                  accentTo="to-orange-300/30"
                  onRetake={() => setRetakeConfirm("quickdive")}
                  locked={classicLockedByResearch}
                  lockedHint={t.quickDiveResearchLockHint}
                  lockedButtonLabel={t.quickDiveResearchLockButton}
                  lockedHref={`/${locale}/immersive-dive`}
                  featured={!classicLockedByResearch}
                  adminQuickTest={
                    isAdmin
                      ? {
                          label: t.adminQuickTest,
                          loadingLabel: t.adminQuickTestLoading,
                          loading: autoFillLoading === "quick",
                          disabled: autoFillLoading !== null,
                          onClick: () => handleAutoFill("quick"),
                        }
                      : undefined
                  }
                  adminPresetTest={
                    isAdmin
                      ? {
                          label: t.adminPresetTest,
                          loadingLabel: t.adminPresetTestLoading,
                          loading: autoFillLoading === "preset-quick",
                          disabled:
                            autoFillLoading !== null || !hasPreset?.quickDive,
                          disabledHint: !hasPreset?.quickDive
                            ? t.adminNoPresetHint
                            : undefined,
                          onClick: () => handleAutoFill("quick", true),
                        }
                      : undefined
                  }
                  testId="assessment-card-quickdive-link"
                />
              </div>
            </motion.div>

            {/* ── Immersive Dive ── */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <div className="flex-1">
                <AssessmentCard
                  stage="02"
                  stepLabel={t.stepImmersiveDive}
                  icon={BookOpen}
                  title={t.immersiveDiveTitle}
                  description={t.immersiveDiveDesc}
                  time={t.immersiveDiveTime}
                  questionCount={t.immersiveDiveQuestions}
                  href={`/${locale}/immersive-dive`}
                  status={
                    immersiveLocked && !imStatus.hasResults
                      ? { hasResults: false, inProgress: false }
                      : imStatus
                  }
                  t={t}
                  accentFrom="from-sky-500/40"
                  accentTo="to-blue-400/25"
                  onRetake={() => setRetakeConfirm("immersive")}
                  completedViaBadge={
                    immersiveCompletedViaQuick
                      ? t.immersiveCompleted
                      : undefined
                  }
                  locked={immersiveLocked}
                  lockedHint={
                    immersiveLockedByResearch
                      ? t.immersiveDiveResearchLockHint
                      : t.immersiveDiveLockHint
                  }
                  lockedButtonLabel={
                    immersiveLockedByResearch
                      ? t.immersiveDiveResearchLockButton
                      : t.immersiveDiveLockButton
                  }
                  lockedHref={
                    immersiveLockedByResearch
                      ? `/${locale}/quickdive`
                      : serverStatus
                        ? `/${locale}/settings`
                        : `/${locale}/register`
                  }
                  featured={!immersiveLocked}
                  adminQuickTest={
                    isAdmin
                      ? {
                          label: t.adminQuickTest,
                          loadingLabel: t.adminQuickTestLoading,
                          loading: autoFillLoading === "immersive",
                          disabled: autoFillLoading !== null,
                          onClick: () => handleAutoFill("immersive"),
                        }
                      : undefined
                  }
                  adminPresetTest={
                    isAdmin
                      ? {
                          label: t.adminPresetTest,
                          loadingLabel: t.adminPresetTestLoading,
                          loading: autoFillLoading === "preset-immersive",
                          disabled:
                            autoFillLoading !== null || !hasPreset?.quickDive,
                          disabledHint: !hasPreset?.quickDive
                            ? t.adminNoPresetHint
                            : undefined,
                          onClick: () => handleAutoFill("immersive", true),
                        }
                      : undefined
                  }
                  testId="assessment-card-immersive-link"
                />
              </div>
            </motion.div>

            {/* ── Deep Dive ── */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div className="flex-1">
                <AssessmentCard
                  stage="03"
                  stepLabel={t.stepDeepDive}
                  icon={Brain}
                  title={t.deepDiveTitle}
                  description={t.deepDiveDesc}
                  time={t.deepDiveTime}
                  questionCount={t.deepDiveQuestions}
                  href={`/${locale}/deepdive`}
                  status={ddStatus}
                  t={t}
                  accentFrom="from-slate-500/60"
                  accentTo="to-slate-400/35"
                  onRetake={() => setRetakeConfirm("deepdive")}
                  locked={deepDiveLocked}
                  lockedHint={
                    !hasDeepDiveAccess
                      ? t.deepDiveInviteLockHint
                      : t.deepDiveLockHint
                  }
                  lockedButtonLabel={
                    !hasDeepDiveAccess
                      ? t.deepDiveInviteLockButton
                      : t.deepDiveLockButton
                  }
                  lockedHref={
                    !hasDeepDiveAccess
                      ? serverStatus
                        ? `/${locale}/settings`
                        : `/${locale}/register`
                      : `/${locale}/explore`
                  }
                  adminQuickTest={
                    isAdmin
                      ? {
                          label: t.adminQuickTestDeep,
                          loadingLabel: t.adminQuickTestDeepLoading,
                          loading: autoFillLoading === "deep",
                          disabled: autoFillLoading !== null,
                          onClick: () => handleAutoFill("deep"),
                        }
                      : undefined
                  }
                  adminPresetTest={
                    isAdmin
                      ? {
                          label: t.adminPresetTestDeep,
                          loadingLabel: t.adminPresetTestDeepLoading,
                          loading: autoFillLoading === "preset-deep",
                          disabled:
                            autoFillLoading !== null || !hasPreset?.deepDive,
                          disabledHint: !hasPreset?.deepDive
                            ? t.adminNoPresetHint
                            : undefined,
                          onClick: () => handleAutoFill("deep", true),
                        }
                      : undefined
                  }
                  testId="assessment-card-deepdive-link"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Retake Confirmation Modal */}
        {retakeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              className="bg-card rounded-2xl border border-border card-shadow max-w-sm w-full p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm text-foreground font-medium mb-4 leading-relaxed">
                {t.retakeConfirm}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRetakeConfirm(null)}
                >
                  {t.retakeCancel}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRetake(retakeConfirm)}
                >
                  {t.retakeConfirmYes}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

// ============================================================
// AssessmentCard
// ============================================================

function AssessmentCard({
  stage,
  stepLabel,
  icon: Icon,
  title,
  description,
  time,
  questionCount,
  href,
  status,
  t,
  accentFrom,
  accentTo,
  onRetake,
  locked = false,
  lockedHint,
  lockedButtonLabel,
  lockedHref,
  completedViaBadge,
  featured = false,
  adminQuickTest,
  adminPresetTest,
  testId,
}: {
  stage: string;
  stepLabel: string;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  questionCount: string;
  href: string;
  status: AssessmentStatus;
  t: Record<string, string>;
  accentFrom: string;
  accentTo: string;
  onRetake: () => void;
  locked?: boolean;
  lockedHint?: string;
  lockedButtonLabel?: string;
  lockedHref?: string;
  completedViaBadge?: string;
  featured?: boolean;
  adminQuickTest?: {
    label: string;
    loadingLabel: string;
    loading: boolean;
    disabled: boolean;
    onClick: () => void;
  };
  adminPresetTest?: {
    label: string;
    loadingLabel: string;
    loading: boolean;
    disabled: boolean;
    disabledHint?: string;
    onClick: () => void;
  };
  testId?: string;
}) {
  const effectiveHref = locked && lockedHref ? lockedHref : href;
  const buttonLabel =
    locked && lockedButtonLabel
      ? lockedButtonLabel
      : status.inProgress
        ? t.continueAssessment
        : t.startAssessment;
  const statusLabel = locked
    ? t.gatewayLocked
    : completedViaBadge || status.hasResults
      ? completedViaBadge || t.hasResults
      : status.inProgress
        ? t.inProgress
        : t.gatewayReady;
  const StatusIcon = locked
    ? Lock
    : completedViaBadge || status.hasResults
      ? CheckCircle2
      : status.inProgress
        ? Sparkles
        : Compass;

  const CardWrapper = locked ? Card : GlowCard;
  const cardWrapperProps = locked
    ? {}
    : { intensity: featured ? ("medium" as const) : ("subtle" as const) };

  return (
    <CardWrapper
      {...cardWrapperProps}
      className={`dd-explore-card group relative overflow-hidden h-full flex flex-col transition-all duration-300 ${locked ? "dd-explore-card-locked" : "hover:-translate-y-1 active:scale-[0.99]"} ${featured ? "dd-explore-card-featured" : ""}`}
    >
      <div
        className={`dd-explore-card-accent bg-gradient-to-r ${accentFrom} ${accentTo} ${featured ? "opacity-90" : "opacity-60"} ${locked ? "" : "group-hover:opacity-100"}`}
      />

      <CardContent className="dd-explore-card-content flex-1 flex flex-col">
        <div className="dd-explore-card-top">
          <div>
            <p className="dd-explore-stage">{stage}</p>
            <p className="dd-explore-step">{stepLabel}</p>
          </div>
          <div className="dd-explore-icon">
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>

        <div className="dd-explore-status-row">
          <StatusIcon className="size-4" aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>

        <h2 className="font-display text-xl lg:text-[1.45rem] font-semibold text-[var(--explore-ink)] mb-3">
          {title}
        </h2>
        <p className="dd-explore-description">{description}</p>

        <div className="dd-explore-meta-grid">
          <span>
            <Clock className="size-4" aria-hidden="true" />
            {time}
          </span>
          <span>
            <BookOpen className="size-4" aria-hidden="true" />
            {questionCount}
          </span>
        </div>

        {locked && lockedHint && (
          <div className="dd-explore-lock-note">
            <p className="dd-explore-lock-label">
              <Lock className="size-3.5" aria-hidden="true" />
              {t.gatewayLockReasonLabel}
            </p>
            <p>{lockedHint}</p>
          </div>
        )}

        <div className="dd-explore-actions mt-auto">
          <Button
            asChild
            className="dd-explore-primary flex-1 min-h-11 rounded-lg"
            variant={locked ? "outline" : "default"}
          >
            <Link href={effectiveHref} data-testid={testId}>
              <span>{buttonLabel}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          {!locked &&
          (completedViaBadge || status.hasResults || status.inProgress) ? (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              onClick={onRetake}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t.retakeTest}
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden min-h-11 rounded-lg text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Link href={effectiveHref}>{t.gatewaySecondaryAction}</Link>
            </Button>
          )}
        </div>

        {/* Admin Test Buttons — keep functional, minimize visual noise */}
        {(adminQuickTest || adminPresetTest) && (
          <div className="mt-3 flex gap-2">
            {adminQuickTest && (
              <button
                onClick={adminQuickTest.onClick}
                disabled={adminQuickTest.disabled}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-md-sea bg-md-sea/10 border border-md-sea/25 dark:border-md-sea/30 hover:bg-md-sea/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {adminQuickTest.loading
                  ? adminQuickTest.loadingLabel
                  : adminQuickTest.label}
              </button>
            )}
            {adminPresetTest && (
              <button
                onClick={adminPresetTest.onClick}
                disabled={adminPresetTest.disabled}
                title={adminPresetTest.disabledHint}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {adminPresetTest.loading
                  ? adminPresetTest.loadingLabel
                  : adminPresetTest.label}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </CardWrapper>
  );
}
