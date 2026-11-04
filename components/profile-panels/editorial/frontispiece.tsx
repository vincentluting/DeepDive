/**
 * Frontispiece — Title page of the Personal Monograph.
 *
 * The first thing a reader sees before any chapter. Sparse by design: a small
 * eyebrow, a rule, the user's core insight rendered as a pull-quote, and a
 * publishing-style meta line. No avatar, no archetype name — those belong to
 * Ch.01 Portrait. This page is just the dedication.
 *
 * Inspired by antique book title pages where the whole sheet carries one line
 * of type and decades of silence around it.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RevHandRule } from "./rev-hand-rule";
import { RevFleuron } from "./rev-fleuron";

interface FrontispieceProps {
  /** The Core Insight sentence lifted from narrative snapshots. */
  coreInsight?: string | null;
  /** Small impression number (e.g. "a3f2" — derived from profile id). */
  impressionNumber: string;
  /** Already-localised minted date string, e.g. "April 22, 2026". */
  mintedDate: string;
  /** Eyebrow text ("A Personal Monograph" in en, etc.) */
  eyebrowLabel: string;
  // coreInsightCite was removed in Frontispiece v2 — the quote stands by
  // itself without a "— Core Insight" attribution label (the label was
  // telegraphing the obvious and fighting the editorial silence).
  /** "Impression No." label, localised */
  impressionLabel: string;
  /** "Minted {date}" template with {date} placeholder already filled */
  mintedLabel: string;
  /** Fallback prose shown when coreInsight is missing */
  emptyFallback?: string;
  className?: string;
}

export function Frontispiece({
  coreInsight,
  impressionNumber,
  eyebrowLabel,
  impressionLabel,
  mintedLabel,
  emptyFallback,
  className,
}: FrontispieceProps) {
  const insight = coreInsight?.trim();

  return (
    <section
      data-slot="rev-frontispiece"
      className={cn(
        "relative w-full bg-rev-paper text-rev-ink",
        "min-h-[72svh] flex flex-col items-center justify-center",
        "px-6 sm:px-10 py-24 sm:py-28",
        className,
      )}
    >
      <div className="w-full max-w-[60ch] flex flex-col items-center text-center">
        {/* — Eyebrow — */}
        <p
          className={cn(
            "font-sans uppercase font-medium",
            "tracking-[0.28em] text-[11px] sm:text-[12px]",
            "text-rev-signal-info",
          )}
        >
          {eyebrowLabel}
        </p>
        <div className="mt-5">
          <RevHandRule tone="cold" width={56} />
        </div>

        {/* — Pull-quote —
            Editorial: large italic serif, wide enough to read in 3–5 lines,
            breathing on its own lighting (opacity 0.96↔1 via
            rev-pullquote-breath, disabled under reduced-motion). No cite
            label — the quote stands by itself. */}
        {insight ? (
          <blockquote
            data-slot="rev-pullquote"
            className={cn(
              "mx-auto mt-20 sm:mt-24 mb-0 max-w-[28ch]",
              "font-display italic font-normal text-rev-ink",
              "leading-[1.35] tracking-[-0.005em]",
              "rev-pullquote-breath",
            )}
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)" }}
          >
            {insight}
          </blockquote>
        ) : (
          <p
            className={cn(
              "mx-auto mt-20 sm:mt-24 max-w-[28ch]",
              "font-display italic text-rev-ink-soft",
              "leading-[1.35] tracking-[-0.005em]",
            )}
            style={{ fontSize: "clamp(24px, 2.8vw, 36px)" }}
          >
            {emptyFallback}
          </p>
        )}

        {/* — Fleuron — section end-mark with generous breathing above and below */}
        <RevFleuron glyph="sextile" className="mt-20 mb-14 sm:mt-24 sm:mb-16" />

        {/* — Meta — impression + minted date, rendered as a single line of
            small caps with an italic number and date interleaved.
            Feels like a printed frontispiece's colophon-style footer. */}
        <div
          className={cn(
            "font-sans uppercase tracking-[0.28em] text-[10px] sm:text-[11px]",
            "text-rev-ink-soft/85",
            "flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1",
          )}
        >
          <span className="inline-flex items-baseline gap-1.5">
            <span>{impressionLabel}</span>
            <span className="font-serif italic normal-case tracking-normal text-rev-ink">
              {impressionNumber}
            </span>
          </span>
          <span aria-hidden="true" className="text-rev-glow-cold/50 text-[9px]">
            ✦
          </span>
          <span className="font-serif italic normal-case tracking-normal text-rev-ink-soft">
            {mintedLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
