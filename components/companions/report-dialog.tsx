"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { CompanionReportReason } from "@/lib/types/companion";

export interface ReportDialogTexts {
  title: string;
  intro: string;
  reasonLabel: string;
  reasonHarassment: string;
  reasonInappropriate: string;
  reasonSpam: string;
  reasonOther: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  detailsCounter: string;
  cancel: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  errorGeneric: string;
}

interface ReportDialogProps {
  reportedId: string;
  reportedDisplayName: string;
  onClose: () => void;
  t: ReportDialogTexts;
}

const REASONS: ReadonlyArray<{
  value: CompanionReportReason;
  key: keyof Pick<
    ReportDialogTexts,
    "reasonHarassment" | "reasonInappropriate" | "reasonSpam" | "reasonOther"
  >;
}> = [
  { value: "harassment", key: "reasonHarassment" },
  { value: "inappropriate_content", key: "reasonInappropriate" },
  { value: "spam", key: "reasonSpam" },
  { value: "other", key: "reasonOther" },
];

/**
 * Trust & Safety report form. Renders as a fixed-position overlay
 * (no Radix dependency) so any caller — connection row, profile
 * detail page, future card variants — can summon the same UX.
 */
export function ReportDialog({
  reportedId,
  reportedDisplayName,
  onClose,
  t,
}: ReportDialogProps) {
  const [reason, setReason] = useState<CompanionReportReason>("harassment");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await csrfFetch("/api/companions/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId,
          reason,
          details: details.trim() || null,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(t.errorGeneric);
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(t.errorGeneric);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-5 sm:p-6 space-y-4">
        <button
          type="button"
          aria-label={t.cancel}
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "success" ? (
          <div className="space-y-3 py-4">
            <p className="text-base font-semibold text-foreground">
              {t.successTitle}
            </p>
            <p className="text-sm text-muted-foreground">{t.successBody}</p>
            <div className="pt-2">
              <Button size="sm" onClick={onClose}>
                {t.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {t.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t.intro.replace("{name}", reportedDisplayName)}
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-foreground">
                {t.reasonLabel}
              </legend>
              {REASONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                    reason === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={() => setReason(opt.value)}
                    disabled={status === "loading"}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">{t[opt.key]}</span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <label
                htmlFor="report-details"
                className="flex items-center justify-between text-xs font-medium text-foreground"
              >
                <span>{t.detailsLabel}</span>
                <span className="text-muted-foreground/70">
                  {interpolate(t.detailsCounter, {
                    count: String(details.length),
                  })}
                </span>
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                placeholder={t.detailsPlaceholder}
                rows={3}
                disabled={status === "loading"}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-50"
              />
            </div>

            {status === "error" && errorMsg && (
              <p className="text-xs text-destructive">{errorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onClose}
                disabled={status === "loading"}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={status === "loading"}
                className="gap-1.5"
              >
                {status === "loading" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {status === "loading" ? t.submitting : t.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
