import type React from "react";
import { cn } from "@/lib/utils";

/**
 * JournalEntry — hand-journal style container for reflection entries.
 * Sand background, minimal border, Source Serif italic headline.
 *
 * See `.claude/skills/deepdive-design/references/surface-sanctuary.md` §3.2.
 */
export function JournalEntry({
  date,
  headline,
  children,
  className,
}: {
  date?: React.ReactNode;
  headline?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "bg-[var(--sanc-sand)] border border-[var(--sanc-rule)] rounded-[8px] p-8",
        "max-w-[640px] mx-auto",
        className,
      )}
    >
      {date && (
        <p className="font-sans text-[13px] font-medium tracking-[0.04em] text-[var(--sanc-ink-soft)] mb-3">
          {date}
        </p>
      )}
      {headline && (
        <h3 className="font-display text-[32px] font-normal leading-[1.25] text-[var(--sanc-ink)] mb-6">
          {headline}
        </h3>
      )}
      <div className="font-sans text-[16px] leading-[1.7] text-[var(--sanc-ink)]">
        {children}
      </div>
    </article>
  );
}
