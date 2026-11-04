"use client";

// ============================================================
// ReportDepthDialog — Standard vs Enhanced mode selector
//
// Sits between the Profile "Generate Report" CTA and the actual report
// generation pipeline. Gives the user a meaningful, reversible choice:
//
//   Standard  — generate now from assessment answers (~60s)
//   Enhanced  — layer on a resume upload first, so the report can surface
//               the tension between what you tested like and what you've
//               actually built (~90s)
//
// Both paths converge on the same `onGenerate()` callback; the dialog
// does NOT trigger generation itself. Persistence of the uploaded resume
// happens inside the Enhanced flow (via /api/documents/upload) so the
// report generator picks it up from the DB regardless of what happens
// after the dialog closes.
// ============================================================

import { useCallback, useState } from "react";
import { FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalOverlay } from "@/components/ui/portal-overlay";
import { ResumeUpload } from "@/components/resume/resume-upload";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { DocumentUploadResult } from "@/lib/documents/types";

type DialogPhase = "choose" | "uploading";

/** The report generation mode the user committed to inside the dialog.
 *  - "standard": generate from the assessment alone, ignore any previously
 *    uploaded resume evidence (user explicitly said "not this time").
 *  - "enhanced": a fresh resume was uploaded (or a previous one exists and
 *    the user opted into re-using it); the generator should layer the
 *    latest active ResumeMatchResult into the report. */
export type ReportDepthMode = "standard" | "enhanced";

interface ReportDepthDialogProps {
  open: boolean;
  locale: Locale;
  assessmentId: string;
  onClose: () => void;
  /** Called after the user has committed to a mode and the dialog has
   *  collected whatever data it needed. The parent should trigger report
   *  generation in this handler, forwarding the chosen mode so the backend
   *  can honor "Standard" even when a stale resume still exists. */
  onGenerate: (mode: ReportDepthMode) => void;
}

export function ReportDepthDialog({
  open,
  locale,
  assessmentId,
  onClose,
  onGenerate,
}: ReportDepthDialogProps) {
  const t = getDictionaryClient(locale).reportDepthDialog;
  const [phase, setPhase] = useState<DialogPhase>("choose");

  const handleStandard = useCallback(() => {
    onClose();
    onGenerate("standard");
  }, [onClose, onGenerate]);

  const handleEnhanced = useCallback(() => {
    setPhase("uploading");
  }, []);

  const handleResumeComplete = useCallback(
    (result: DocumentUploadResult | null) => {
      // ResumeUpload sends `result` only when the user actively confirmed
      // the parsed resume ("Apply to My Profile"). In the preview state the
      // user can still back out with a Skip button that fires
      // `onComplete(null)` — that path is a Standard intent, not a
      // confirmation of the freshly-uploaded evidence. Honor the distinction
      // so the persisted upload isn't silently used against the user's
      // wishes for this generation.
      setPhase("choose");
      onClose();
      onGenerate(result ? "enhanced" : "standard");
    },
    [onClose, onGenerate],
  );

  const handleResumeSkip = useCallback(() => {
    // User opened the upload flow and then backed out from the idle state —
    // treat as Standard, NOT as "use the old resume". This is the fix for
    // the silent-enhance bug: onGenerate() with no mode would always load
    // whatever resume already existed in the DB.
    setPhase("choose");
    onClose();
    onGenerate("standard");
  }, [onClose, onGenerate]);

  const handleBackdropDismiss = useCallback(() => {
    if (phase === "uploading") return; // Don't lose an in-flight upload
    setPhase("choose");
    onClose();
  }, [onClose, phase]);

  return (
    <PortalOverlay
      open={open}
      onOpenChange={(next) => {
        if (!next) handleBackdropDismiss();
      }}
      title={t.title}
      overlayClassName="bg-black/60 backdrop-blur-sm"
      className="relative max-w-2xl rounded-2xl bg-background border border-border shadow-2xl"
    >
      {phase === "choose" && (
        <>
          <button
            type="button"
            onClick={handleBackdropDismiss}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            aria-label={t.close}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                {t.title}
              </h2>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleStandard}
                className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <Sparkles className="h-5 w-5 text-primary mb-3" />
                <div className="font-medium text-foreground mb-1">
                  {t.standardTitle}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {t.standardDuration}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.standardDescription}
                </p>
              </button>

              <button
                type="button"
                onClick={handleEnhanced}
                data-testid="report-depth-enhanced"
                className="group text-left rounded-xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-5 hover:border-primary hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <FileText className="h-5 w-5 text-primary mb-3" />
                <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                  {t.enhancedTitle}
                  <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {t.enhancedBadge}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {t.enhancedDuration}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.enhancedDescription}
                </p>
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t.reassurance}
            </p>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleBackdropDismiss}>
                {t.cancel}
              </Button>
            </div>
          </div>
        </>
      )}

      {phase === "uploading" && (
        <div className="p-2 sm:p-4">
          <ResumeUpload
            locale={locale}
            assessmentId={assessmentId}
            onSkip={handleResumeSkip}
            onComplete={handleResumeComplete}
          />
        </div>
      )}
    </PortalOverlay>
  );
}
