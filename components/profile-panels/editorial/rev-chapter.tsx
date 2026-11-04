/**
 * RevChapter — Standard chapter container for the Personal Monograph.
 *
 * Every chapter must open with the same ritual: eyebrow + cold-glow rule +
 * display title + lead paragraph + 96px vertical gutter. That repetition is
 * the heartbeat of the book — readers learn the cadence after Ch.01 and
 * trust it for the rest.
 *
 * Server-safe (no "use client"). IntersectionObserver-based reveal is added
 * in PR-2 via a separate <RevChapterReveal> wrapper.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RevHandRule } from "./rev-hand-rule";
import { RevFleuron } from "./rev-fleuron";

type ChapterTone = "paper" | "warm";

interface RevChapterProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  /** URL hash anchor, e.g. "ch-portrait" */
  id: string;
  /** Eyebrow line, e.g. "CHAPTER 01 · PORTRAIT" — rendered in UPPERCASE tracking */
  eyebrow: React.ReactNode;
  /** Display title — rendered in Fraunces / Noto Serif SC at --rev-display-xl */
  title: React.ReactNode;
  /** Optional lead paragraph (Source Serif 4 Italic) under the title */
  lead?: React.ReactNode;
  /** Background alternation: "paper" or "warm". Default "paper". */
  tone?: ChapterTone;
  /** Accent colour for the opener rule. Defaults to cold-glow. */
  ruleTone?: "cold" | "attention";
  /** Render a closing ornamental fleuron at the end of the chapter.
   *  Defaults to true — the heartbeat pattern of the book. */
  closeWithFleuron?: boolean;
  /** Optional spacing override for the content body below the opener. */
  contentClassName?: string;
  /** Content — spreads, artifacts, pull-quotes. */
  children: React.ReactNode;
}

const TONE_BG: Record<ChapterTone, string> = {
  paper: "bg-rev-paper",
  warm: "bg-rev-paper-warm",
};

export function RevChapter({
  id,
  eyebrow,
  title,
  lead,
  tone = "paper",
  ruleTone = "cold",
  closeWithFleuron = true,
  contentClassName,
  className,
  children,
  ...props
}: RevChapterProps) {
  return (
    <section
      id={id}
      data-slot="rev-chapter"
      data-surface="revelation"
      className={cn(
        "relative w-full text-rev-ink",
        "px-6 sm:px-10 lg:px-16",
        "py-[var(--rev-chapter-gutter)]",
        TONE_BG[tone],
        className,
      )}
      {...props}
    >
      <header className="mx-auto max-w-[var(--rev-measure)] text-left">
        <p
          className={cn(
            "font-sans uppercase font-medium",
            "tracking-[0.18em]",
            "text-[var(--rev-eyebrow)]",
            ruleTone === "attention"
              ? "text-rev-signal-attention"
              : "text-rev-signal-info",
          )}
        >
          {eyebrow}
        </p>
        <div className="mt-5">
          <RevHandRule tone={ruleTone} width={40} className="origin-left" />
        </div>
        <h2
          className={cn(
            "font-display font-normal text-rev-ink",
            "mt-6 mb-0",
            "leading-[1.05] tracking-[-0.015em]",
          )}
          style={{ fontSize: "var(--rev-display-xl)" }}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "font-serif italic text-rev-ink-soft",
              "mt-5 max-w-[62ch]",
              "leading-[1.5]",
            )}
            style={{ fontSize: "var(--rev-lead)" }}
          >
            {lead}
          </p>
        )}
      </header>
      <div className={cn("mt-16 sm:mt-20 lg:mt-24", contentClassName)}>
        {children}
      </div>
      {closeWithFleuron && <RevFleuron />}
    </section>
  );
}
