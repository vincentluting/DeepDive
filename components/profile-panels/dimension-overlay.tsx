/**
 * DimensionOverlay — expanded dimension content in a centered modal.
 *
 * Triggered from a Bento Grid / spotlight card. Renders full dimension content
 * (charts, narratives, feedback) inside the shared PortalOverlay primitive,
 * which portals to document.body and centers in the viewport — fixing the
 * earlier off-screen positioning when a card was clicked after scrolling
 * (the `fixed top-[5vh]` panel resolved against the wrong containing block).
 */
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PortalOverlay } from "@/components/ui/portal-overlay";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";

interface DimensionOverlayProps {
  /** Whether the overlay is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Dimension title */
  title: string;
  /** One-line summary */
  summary: string;
  /** Signal strength (0-100) */
  signalStrength?: number;
  /** Locale for i18n */
  locale: string;
  /** Feedback section key */
  feedbackSection?: string;
  /** Action tip text */
  actionTip?: string;
  /** Optional CTA link */
  ctaHref?: string;
  /** CTA label */
  ctaLabel?: string;
  /** The dimension content (charts, visualizations, etc.) */
  children: React.ReactNode;
  /** Admin viewing another user's profile — suppress feedback writes. */
  viewingAsAdmin?: boolean;
}

export function DimensionOverlay({
  isOpen,
  onClose,
  title,
  summary,
  signalStrength,
  locale,
  feedbackSection,
  actionTip,
  ctaHref,
  ctaLabel,
  children,
  viewingAsAdmin = false,
}: DimensionOverlayProps) {
  return (
    <PortalOverlay
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      className="rounded-[4px] border border-rev-rule bg-rev-paper-warm"
    >
      {/* Accent bar — top hairline */}
      <div className="sticky top-0 h-1 z-10 bg-rev-paper-warm" />

      {/* Header */}
      <div className="sticky top-1 z-10 bg-rev-paper-warm/95 px-5 sm:px-6 py-4 border-b border-rev-rule/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-rev-ink-soft/70">
              {title}
            </p>
            <p className="text-sm font-medium text-rev-ink mt-1">{summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {signalStrength != null && signalStrength > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rev-paper-warm text-rev-signal-info">
                {signalStrength}%
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-11 sm:h-7 sm:w-7 -mr-2 sm:mr-0 rounded-full flex items-center justify-center
                hover:bg-rev-ink-soft/10 transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-rev-signal-info/40"
            >
              <X className="w-4 h-4 text-rev-ink-soft" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-6 py-5">
        {children}

        {/* Action tip */}
        {actionTip && (
          <p
            className="mt-5 text-xs text-rev-ink-soft leading-relaxed italic
            pl-3 border-l-2 border-rev-rule"
          >
            {actionTip}
          </p>
        )}

        {/* CTA link */}
        {ctaHref && ctaLabel && (
          <a
            href={ctaHref}
            onClick={() => {
              analytics
                .track("profile_cta_clicked", {
                  dimension: title,
                  destination: ctaHref,
                })
                .catch(() => {});
            }}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-rev-signal-info hover:text-rev-signal-info transition-colors w-fit"
          >
            <span>{ctaLabel}</span>
            <span>→</span>
          </a>
        )}

        {/* Micro-feedback — hidden in admin view to avoid attributing
            the OTHER user's feedback to the admin's account. */}
        {feedbackSection && !viewingAsAdmin && (
          <FeedbackRow section={feedbackSection} locale={locale} />
        )}
      </div>
    </PortalOverlay>
  );
}

// ── Inline feedback row ─────────────────────────────────────

function FeedbackRow({ section, locale }: { section: string; locale: string }) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  return <FeedbackRowInner section={section} t={t} />;
}

function FeedbackRowInner({
  section,
  t,
}: {
  section: string;
  t: Record<string, string>;
}) {
  const [feedbackState, setFeedbackState] = useState<"idle" | "submitted">(
    "idle",
  );

  const handleFeedback = async (accurate: boolean) => {
    setFeedbackState("submitted");
    analytics
      .track("profile_feedback_submitted", { section, accurate })
      .catch(() => {});
    try {
      await csrfFetch("/api/profile-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, accurate }),
      });
    } catch {
      // Non-critical
    }
  };

  return (
    <div className="mt-5 pt-4 border-t border-rev-rule/50">
      {feedbackState === "idle" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFeedback(true)}
            className="px-3.5 py-2 sm:py-1.5 rounded-full text-xs font-medium min-h-[44px] sm:min-h-0
              bg-rev-paper-warm text-rev-signal-info hover:bg-rev-paper transition-colors"
          >
            {t.feedbackAccurate}
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(false)}
            className="px-3.5 py-2 sm:py-1.5 rounded-full text-xs font-medium min-h-[44px] sm:min-h-0
              bg-rev-paper-warm text-rev-ink-soft hover:bg-rev-paper transition-colors"
          >
            {t.feedbackUnsure}
          </button>
        </div>
      ) : (
        <p className="text-xs text-rev-ink-soft/80 italic">
          {t.feedbackThanks}
        </p>
      )}
    </div>
  );
}
