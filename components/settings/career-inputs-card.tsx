"use client";

// ============================================================
// CareerInputsCard — Settings → Career Inputs section
//
// Discoverable always-on entry point for managing the data sources the
// user has fed the system. Today: Resume only. The row structure is
// designed so LinkedIn / portfolio rows can be added later without a
// re-architect (matches ResumeEvidenceSource in lib/db/resume-match.ts).
//
// Behavior:
//   - No assessment yet → empty state with a "Start Quick Dive" link.
//   - Cohort not entitled (resumeEnhancement=false) → row visible but
//     greyed; copy explains the gate. Avoids bait-and-deny.
//   - Active resume present → filename + upload date + Replace / Remove.
//   - No resume yet → Upload CTA.
//
// On successful upload we surface a freshness modal explaining that
// existing reports still use the old snapshot, and offer one-click
// regenerate (or Later). Coaching follows reports — we never silently
// regenerate, since it costs the user's LLM credits.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload as UploadIcon,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { toDateLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { DocumentUploadResult } from "@/lib/documents/types";

export interface CareerInputsCardTranslations {
  sectionTitle: string;
  sectionDescription: string;
  resumeLabel: string;
  noResumeHelper: string;
  activeStateUploadedAt: string;
  uploadCta: string;
  replaceCta: string;
  removeCta: string;
  removeConfirmTitle: string;
  removeConfirmBody: string;
  removeConfirmConfirm: string;
  removeConfirmCancel: string;
  removeSuccessToast: string;
  removeErrorToast: string;
  gatedNotice: string;
  noAssessmentEmpty: string;
  noAssessmentCta: string;
  freshnessTitle: string;
  freshnessBody: string;
  regenerateNowCta: string;
  regenerateLaterCta: string;
  uploadDialogClose: string;
}

interface CurrentResume {
  fileName: string | null;
  uploadedAt: string;
}

interface CareerInputsCardProps {
  locale: Locale;
  assessmentId: string | null;
  canUpload: boolean;
  initialCurrentResume: CurrentResume | null;
  t: CareerInputsCardTranslations;
}

type Phase = "idle" | "uploading" | "freshness" | "removeConfirm" | "removing";

function formatUploadedDate(iso: string | null | undefined, locale: Locale) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(toDateLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateFilename(name: string | null | undefined, max = 32): string {
  if (!name) return "";
  if (name.length <= max) return name;
  const head = name.slice(0, Math.floor(max / 2) - 1);
  const tail = name.slice(name.length - Math.floor(max / 2) + 2);
  return `${head}…${tail}`;
}

export function CareerInputsCard({
  locale,
  assessmentId,
  canUpload,
  initialCurrentResume,
  t,
}: CareerInputsCardProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentResume, setCurrentResume] = useState<CurrentResume | null>(
    initialCurrentResume,
  );
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const handleUploadComplete = useCallback(
    (result: DocumentUploadResult | null) => {
      // ResumeUpload fires onComplete(null) when the user previews and skips
      // — treat as cancel, not as a successful save.
      if (!result) {
        setPhase("idle");
        return;
      }
      const resumeMatch =
        result.type === "resume"
          ? (result.data as { fileName?: string })
          : null;
      setCurrentResume({
        fileName: resumeMatch?.fileName ?? null,
        uploadedAt: new Date().toISOString(),
      });
      setPhase("freshness");
    },
    [],
  );

  const handleUploadSkip = useCallback(() => setPhase("idle"), []);

  // Closing the upload dialog without saving (backdrop or X) still needs a
  // router.refresh — the POST may have completed but the user dismissed the
  // result UI. The next render then reflects whatever is actually in the DB.
  const handleUploadDialogDismiss = useCallback(() => {
    setPhase("idle");
    router.refresh();
  }, [router]);

  // ESC handler — dismiss any open modal so keyboard users aren't trapped.
  // Removal in-flight is the one state that should NOT be cancellable.
  useEffect(() => {
    if (phase === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (phase === "removing") return;
      if (phase === "uploading") {
        setPhase("idle");
        router.refresh();
        return;
      }
      setPhase("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, router]);

  const handleRegenerateNow = useCallback(async () => {
    if (!assessmentId) return;
    setRegenerating(true);
    try {
      const res = await csrfFetch(
        `/api/assessment/${encodeURIComponent(assessmentId)}/regenerate-report?locale=${encodeURIComponent(locale)}&depthMode=enhanced`,
        { method: "POST" },
      );
      if (!res.ok) {
        setRegenerating(false);
        return;
      }
      const body = (await res.json()) as { pipelineId: string };
      window.location.href = `/${locale}/processing?pipelineId=${encodeURIComponent(body.pipelineId)}`;
    } catch {
      setRegenerating(false);
    }
  }, [assessmentId, locale]);

  const handleRegenerateLater = useCallback(() => {
    setPhase("idle");
    // RSC refresh so the page reflects the new resume on next render
    // (and Banner stale check on the report page picks it up).
    router.refresh();
  }, [router]);

  const handleRemove = useCallback(async () => {
    if (!assessmentId) return;
    setPhase("removing");
    try {
      const res = await csrfFetch(
        `/api/documents/resume?assessmentId=${encodeURIComponent(assessmentId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        throw new Error("delete-failed");
      }
      setCurrentResume(null);
      setPhase("idle");
      setSuccessToast(t.removeSuccessToast);
      setTimeout(() => setSuccessToast(null), 3500);
      router.refresh();
    } catch {
      setPhase("removeConfirm");
      setErrorToast(t.removeErrorToast);
      setTimeout(() => setErrorToast(null), 4000);
    }
  }, [assessmentId, router, t.removeErrorToast, t.removeSuccessToast]);

  const renderResumeRow = () => {
    if (!assessmentId) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
          <div className="rounded-full bg-muted p-2 shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t.resumeLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.noAssessmentEmpty}
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/${locale}/quickdive`}>
              {t.noAssessmentCta}
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      );
    }

    if (!canUpload) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5 opacity-70">
          <div className="rounded-full bg-muted p-2 shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t.resumeLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {t.gatedNotice}
            </p>
          </div>
        </div>
      );
    }

    if (currentResume) {
      const uploadedLabel = formatUploadedDate(
        currentResume.uploadedAt,
        locale,
      );
      const displayName = truncateFilename(currentResume.fileName ?? "");
      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3.5">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName || t.resumeLabel}
            </p>
            {uploadedLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {interpolate(t.activeStateUploadedAt, { date: uploadedLabel })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPhase("uploading")}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.replaceCta}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPhase("removeConfirm")}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.removeCta}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] px-4 py-3.5">
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{t.resumeLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t.noResumeHelper}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setPhase("uploading")}
          className="shrink-0 gap-1.5"
        >
          <UploadIcon className="h-3.5 w-3.5" />
          {t.uploadCta}
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-2xl bg-card border border-border card-inset-highlight overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2.5 mb-1.5">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold text-foreground">
              {t.sectionTitle}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {t.sectionDescription}
          </p>
          {renderResumeRow()}
        </div>
      </div>

      {/* ─── Upload dialog ─── */}
      <AnimatePresence>
        {phase === "uploading" && assessmentId && (
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleUploadDialogDismiss}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleUploadDialogDismiss}
                className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                aria-label={t.uploadDialogClose}
              >
                <X className="h-4 w-4" />
              </button>
              <ResumeUpload
                locale={locale}
                assessmentId={assessmentId}
                onSkip={handleUploadSkip}
                onComplete={handleUploadComplete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Freshness modal (after successful upload) ─── */}
      <AnimatePresence>
        {phase === "freshness" && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="career-inputs-freshness-title"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-full bg-emerald-500/15 p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="career-inputs-freshness-title"
                    className="text-base font-semibold text-foreground"
                  >
                    {t.freshnessTitle}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {t.freshnessBody}
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={handleRegenerateLater}
                  disabled={regenerating}
                >
                  {t.regenerateLaterCta}
                </Button>
                <Button
                  onClick={handleRegenerateNow}
                  disabled={regenerating || !assessmentId}
                  className="gap-1.5"
                >
                  <Sparkles
                    className={`h-3.5 w-3.5 ${regenerating ? "animate-pulse" : ""}`}
                  />
                  {t.regenerateNowCta}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Remove confirmation ─── */}
      <AnimatePresence>
        {(phase === "removeConfirm" || phase === "removing") && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="career-inputs-remove-title"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={phase === "removing" ? undefined : () => setPhase("idle")}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-full bg-destructive/10 p-2 shrink-0">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <h3
                  id="career-inputs-remove-title"
                  className="text-base font-semibold text-foreground"
                >
                  {t.removeConfirmTitle}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {t.removeConfirmBody}
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setPhase("idle")}
                  disabled={phase === "removing"}
                >
                  {t.removeConfirmCancel}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={phase === "removing"}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.removeConfirmConfirm}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toasts (inline, no library) ─── */}
      <AnimatePresence>
        {(successToast || errorToast) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium border"
            style={{
              background: successToast
                ? "rgb(16 185 129 / 0.95)"
                : "rgb(239 68 68 / 0.95)",
              color: "white",
              borderColor: "transparent",
            }}
          >
            {successToast ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{successToast ?? errorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
