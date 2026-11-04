"use client";

// ============================================================
// ResumeRegenerateBanner — "Re-enhance with your resume" entry point
//
// Rendered at the top of the Report page. Three states:
//
//   Standard report (meta.resumeEnhanced !== true):
//     Invite the user to upload a resume and regenerate. Non-blocking.
//     Uses ReportDepthDialog → ResumeUpload → /api/assessment/:id/regenerate-report
//     → navigate to /processing with the new pipelineId.
//
//   Enhanced report + current resume present, fresh:
//     Show the active resume (filename + upload date) + a "Replace" CTA so
//     the user can update without hunting in Settings.
//
//   Enhanced report + current resume newer than this report (STALE snapshot):
//     Surface a stale warning. The report's resumeEvidence is a frozen
//     snapshot; uploading a new resume does NOT auto-regenerate (we don't
//     burn the user's LLM credits silently). Offer a one-click
//     "Regenerate to use latest" path.
// ============================================================

import { useCallback, useState } from "react";
import { FileText, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { Locale } from "@/lib/i18n/config";
import { toDateLocale } from "@/lib/i18n/config";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { DocumentUploadResult } from "@/lib/documents/types";

interface ResumeRegenerateBannerProps {
  locale: Locale;
  assessmentId: string;
  /** True if the current report was already generated with resume evidence. */
  resumeEnhanced: boolean;
  /** Filename of the currently-active ResumeMatchResult, or null if none. */
  currentResumeFileName?: string | null;
  /** ISO string when the active resume was uploaded; null if no resume. */
  currentResumeUploadedAt?: string | null;
  /** ISO string when this CareerReport was generated; null if unknown. */
  reportCreatedAt?: string | null;
}

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

export function ResumeRegenerateBanner({
  locale,
  assessmentId,
  resumeEnhanced,
  currentResumeFileName,
  currentResumeUploadedAt,
  reportCreatedAt,
}: ResumeRegenerateBannerProps) {
  const t = getDictionaryClient(locale).reportDepthDialog;
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const triggerRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      // depthMode=enhanced because the user just uploaded a resume from
      // the banner; that's the whole point of the re-enhance path.
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

  const handleUploadComplete = useCallback(
    (result: DocumentUploadResult | null) => {
      setUploading(false);
      // ResumeUpload fires `onComplete(null)` when the user previews the
      // parsed resume and then chooses Skip — don't regenerate in that
      // case. A null result means "I changed my mind", not "enhance with
      // whatever is in the DB".
      if (!result) return;
      triggerRegenerate();
    },
    [triggerRegenerate],
  );

  const handleSkip = useCallback(() => {
    setUploading(false);
  }, []);

  if (uploading) {
    // Wrap ResumeUpload in a card container — without this, ResumeUpload's
    // border-t footer reads as a floating divider in the report page flow.
    return (
      <div className="mx-auto mb-6 max-w-3xl px-4">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <ResumeUpload
            locale={locale}
            assessmentId={assessmentId}
            onSkip={handleSkip}
            onComplete={handleUploadComplete}
          />
        </div>
      </div>
    );
  }

  if (resumeEnhanced) {
    const uploadedLabel = formatUploadedDate(currentResumeUploadedAt, locale);
    const displayName = truncateFilename(currentResumeFileName ?? "");
    const isStale =
      currentResumeUploadedAt &&
      reportCreatedAt &&
      new Date(currentResumeUploadedAt).getTime() >
        new Date(reportCreatedAt).getTime();

    return (
      <div className="mx-auto mb-6 max-w-3xl px-4">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {displayName || t.enhancedAckLabel}
                </div>
                {uploadedLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {interpolate(t.enhancedAckUploadedTemplate, {
                      date: uploadedLabel,
                    })}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploading(true)}
              disabled={regenerating}
              className="shrink-0 inline-flex min-h-9 items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.enhancedAckReplaceCta}
            </button>
          </div>

          {isStale && uploadedLabel && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed text-foreground/85">
                  {interpolate(t.enhancedStaleWarning, { date: uploadedLabel })}
                </p>
              </div>
              <button
                type="button"
                onClick={triggerRegenerate}
                disabled={regenerating}
                className="shrink-0 inline-flex min-h-9 items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <Sparkles
                  className={`h-3.5 w-3.5 ${regenerating ? "animate-pulse" : ""}`}
                />
                {regenerating
                  ? t.regenerateBannerLoading
                  : t.enhancedStaleRegenerateCta}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-6 max-w-3xl px-4">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm text-foreground mb-0.5">
              {t.regenerateBannerTitle}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.regenerateBannerSubtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUploading(true)}
          disabled={regenerating}
          className="shrink-0 inline-flex min-h-11 items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Sparkles
            className={`h-3.5 w-3.5 ${regenerating ? "animate-pulse" : ""}`}
          />
          {regenerating ? t.regenerateBannerLoading : t.regenerateBannerCta}
        </button>
      </div>
    </div>
  );
}
