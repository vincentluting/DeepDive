"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { ResumeMatchResult } from "@/lib/resume/types";
import type { DocumentUploadResult } from "@/lib/documents/types";

// ============================================================
// Constants
// ============================================================

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SLOW_UPLOAD_TIMEOUT_MS = 10_000;

// ============================================================
// Types
// ============================================================

type UploadPhase = "idle" | "uploading" | "preview" | "applied" | "error";

interface ResumeUploadProps {
  locale: Locale;
  assessmentId: string;
  onSkip: () => void;
  onComplete: (result: DocumentUploadResult | null) => void;
}

// ============================================================
// File validation
// ============================================================

function validateFile(file: File, t: Record<string, string>): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return t.fileTooLarge;
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
    return t.invalidFileType;
  }

  return null;
}

// ============================================================
// ResumeUpload Component
// ============================================================

export function ResumeUpload({
  locale,
  assessmentId,
  onSkip,
  onComplete,
}: ResumeUploadProps) {
  const t = getDictionaryClient(locale).resumeUpload;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(
    null,
  );
  const [isSlow, setIsSlow] = useState(false);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup slow timer on unmount
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  // Derived result accessor
  const resumeResult =
    uploadResult?.type === "resume"
      ? (uploadResult.data as ResumeMatchResult)
      : null;

  // ----------------------------------------------------------
  // Upload handler
  // ----------------------------------------------------------

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file, t);
      if (validationError) {
        setError(validationError);
        setPhase("error");
        return;
      }

      setFileName(file.name);
      setPhase("uploading");
      setError("");
      setIsSlow(false);

      // Start slow timer
      slowTimerRef.current = setTimeout(
        () => setIsSlow(true),
        SLOW_UPLOAD_TIMEOUT_MS,
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assessmentId", assessmentId);
        formData.append("sourceType", "resume");

        const res = await csrfFetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error?.message || t.uploadFailed);
        }

        const result: DocumentUploadResult = await res.json();
        setUploadResult(result);
        setPhase("preview");
      } catch (err) {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setError(err instanceof Error ? err.message : t.uploadFailed);
        setPhase("error");
      }
    },
    [assessmentId, t],
  );

  // ----------------------------------------------------------
  // Drag & drop handlers
  // ----------------------------------------------------------

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      // Reset input so re-selecting the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleUpload],
  );

  // ----------------------------------------------------------
  // Apply result
  // ----------------------------------------------------------

  const handleApply = useCallback(() => {
    setPhase("applied");
    onComplete(uploadResult);
  }, [uploadResult, onComplete]);

  // ----------------------------------------------------------
  // Render helpers: Resume summary
  // ----------------------------------------------------------

  const renderResumeSummaryItems = () => {
    if (!resumeResult) return null;
    const { autoFillRealConditions } = resumeResult;
    const summary = getLocalizedField(resumeResult, "summary", locale);
    const items: Array<{ label: string; value: string }> = [];

    if (autoFillRealConditions.workLanguages?.length) {
      items.push({
        label: t.detectedLanguages,
        value: autoFillRealConditions.workLanguages
          .map(
            (l: { language: string; proficiency: string }) =>
              `${l.language} (${l.proficiency})`,
          )
          .join(", "),
      });
    }

    if (autoFillRealConditions.experienceYears !== undefined) {
      items.push({
        label: t.detectedExperience,
        value: interpolate(t.yearsExperience, {
          years: autoFillRealConditions.experienceYears,
        }),
      });
    }

    if (autoFillRealConditions.pastIndustries?.length) {
      items.push({
        label: t.detectedIndustries,
        value: autoFillRealConditions.pastIndustries.join(", "),
      });
    }

    if (autoFillRealConditions.education) {
      items.push({
        label: t.detectedEducation,
        value: `${autoFillRealConditions.education.level}${autoFillRealConditions.education.field ? " — " + autoFillRealConditions.education.field : ""}`,
      });
    }

    return (
      <div className="space-y-4">
        {summary && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        )}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground whitespace-nowrap min-w-[80px]">
                  {item.label}
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 max-w-2xl mx-auto w-full">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        <p className="text-xs text-muted-foreground/80 mt-2 italic">{t.hint}</p>
      </div>

      {/* Main content */}
      <div className="px-4 py-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ---- IDLE: Drag & Drop Zone ---- */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={t.dragDropLabel}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`
                  relative cursor-pointer rounded-2xl border-2 border-dashed p-10
                  flex flex-col items-center justify-center gap-4
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                  }
                `}
              >
                <div
                  className={`rounded-full p-4 transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Upload
                    className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">{t.dragDropLabel}</p>
                  <p className="text-xs text-muted-foreground">{t.orBrowse}</p>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {t.acceptedFormats}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileSelect}
                  aria-label={t.dragDropLabel}
                  className="sr-only"
                />
              </div>
            </motion.div>
          )}

          {/* ---- UPLOADING: Progress ---- */}
          {phase === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-5 py-16"
            >
              <div className="relative">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{t.uploading}</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
              {isSlow && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2"
                >
                  <p className="text-xs text-muted-foreground">
                    {t.takingLong}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ---- PREVIEW: Show extracted data ---- */}
          {phase === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                <span className="font-medium">{fileName}</span>
              </div>

              <div className="rounded-xl border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold">{t.summaryTitle}</h3>
                {renderResumeSummaryItems()}
              </div>
              <p className="text-xs text-muted-foreground">{t.applyNote}</p>
            </motion.div>
          )}

          {/* ---- APPLIED: Confirmation ---- */}
          {phase === "applied" && (
            <motion.div
              key="applied"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 py-16"
            >
              <div className="rounded-full bg-emerald-100 p-3">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-600">
                {t.applied}
              </p>
            </motion.div>
          )}

          {/* ---- ERROR ---- */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 py-16"
            >
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive text-center">{error}</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setPhase("idle");
                    setError("");
                  }}
                >
                  {t.retry}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={onSkip}
                >
                  {t.skipResume}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="border-t px-4 py-4 max-w-2xl mx-auto w-full">
        {phase === "idle" && (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onSkip} className="rounded-full">
              {t.skipResume}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t.acceptedFormats}
            </span>
          </div>
        )}

        {phase === "preview" && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => onComplete(null)}
              className="rounded-full"
            >
              {t.skipResume}
            </Button>
            <Button onClick={handleApply} className="rounded-full">
              {t.applyToConditions}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {phase === "applied" && (
          <div className="flex justify-end">
            <Button
              onClick={() => onComplete(uploadResult)}
              className="rounded-full"
            >
              {t.continueToReport}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
