// ============================================================
// ThresholdCta — Revelation-domain replacement for DeepDiveCTA.
//
// Visually a "doorway" rather than a button: an attention-tone hand-rule
// above and below a single italic display line. Hover lifts the rule to
// signal interaction without imposing a UI button on a paper page.
//
// Behaviour mirrors DeepDiveCTA (legacy file lines 1716-1813):
//   • not logged in → /{locale}/register?from=deepdive
//   • logged in     → /{locale}/deepdive
//   • awaits waitForSave() before navigating so DB persistence completes
//
// Save-failure handling: if waitForSave() resolves to null (network/5xx),
// navigation is BLOCKED — the user sees an inline retry prompt instead.
// Reason: /deepdive rejects with `?gate=quickdive` when no QD row exists,
// which trapped users in a "you must do Quick Dive" loop after their save
// silently failed. Blocking + retry prevents that loop.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RevHandRule } from "@/components/profile-panels/editorial";

interface ThresholdCtaProps {
  locale: string;
  isLoggedIn: boolean | null;
  /** Localised CTA copy chosen by the parent based on auth state. */
  label: string;
  /** Auxiliary one-liner under the link, e.g. "86 questions · 12 min · free". */
  meta?: string;
  /** Analytics fire — non-blocking. */
  onTrack?: () => void;
  /** Awaited before navigation so the Quick Dive save completes. Resolves to
   *  the saved row id on success, or null when the save failed (network / 5xx). */
  waitForSave?: () => Promise<string | null>;
  /** Localised inline-error copy shown when waitForSave() returns null. */
  saveErrorLabel: string;
  /** Localised retry-button label. */
  saveRetryLabel: string;
}

export function ThresholdCta({
  locale,
  isLoggedIn,
  label,
  meta,
  onTrack,
  waitForSave,
  saveErrorLabel,
  saveRetryLabel,
}: ThresholdCtaProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const handleClick = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setSaveFailed(false);
    onTrack?.();
    if (waitForSave) {
      // waitForSave never throws — it returns null on failure (see
      // components/quickdive/use-explore-engine.ts:594,681-702). Treat null
      // as a hard block so the user doesn't get bounced from /deepdive.
      const saveResult = await waitForSave();
      if (saveResult === null) {
        setSaveFailed(true);
        setIsNavigating(false);
        return;
      }
    }
    if (isLoggedIn === false) {
      router.push(`/${locale}/register?from=deepdive`);
    } else {
      router.push(`/${locale}/deepdive`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center select-none">
      <RevHandRule
        tone={isHover ? "attention" : "cold"}
        width={isHover ? 96 : 72}
      />

      <motion.button
        type="button"
        onClick={handleClick}
        data-testid="quickdive-threshold-cta"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onFocus={() => setIsHover(true)}
        onBlur={() => setIsHover(false)}
        disabled={isNavigating}
        whileTap={{ scale: 0.985 }}
        className="mt-7 mb-7 font-display italic text-rev-ink hover:text-rev-signal-attention focus:outline-none focus-visible:text-rev-signal-attention transition-colors disabled:opacity-60"
        style={{ fontSize: "clamp(22px, 2.6vw, 32px)", lineHeight: 1.25 }}
      >
        {label}
      </motion.button>

      <RevHandRule
        tone={isHover ? "attention" : "cold"}
        width={isHover ? 96 : 72}
      />

      {meta && (
        <p className="mt-6 font-sans uppercase tracking-[0.18em] text-[10px] text-rev-ink-soft/80">
          {meta}
        </p>
      )}

      {saveFailed && (
        <div
          role="alert"
          data-testid="quickdive-threshold-save-error"
          className="mt-6 max-w-md text-center"
        >
          <p className="text-sm text-rev-signal-attention font-serif italic">
            {saveErrorLabel}
          </p>
          <button
            type="button"
            onClick={handleClick}
            disabled={isNavigating}
            data-testid="quickdive-threshold-save-retry"
            className="mt-3 underline underline-offset-4 text-[13px] text-rev-ink hover:text-rev-signal-attention transition-colors disabled:opacity-60"
          >
            {saveRetryLabel}
          </button>
        </div>
      )}
    </div>
  );
}
