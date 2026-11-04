/**
 * RevBookSpine — Left-rail chapter navigation (desktop ≥1024px).
 *
 * Fixed column pinned to viewport. Each chapter shows a dot + its visible
 * short name so readers always know where they are while scrolling; the
 * active chapter's dot fills with cold-glow and its label goes ink-strong.
 * A "03 / 07" progress counter sits below. Click = jump via URL hash.
 *
 * Hidden on mobile — the <RevReadingProgress> top bar (with the active
 * section name) takes over there.
 *
 * PR-2 wires IntersectionObserver from the ProfileDashboard parent to keep
 * `activeId` in sync with scroll.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpineChapter {
  id: string;
  /** Short label, e.g. "Ch.01 Portrait" */
  label: string;
  /** Hidden for frontispiece/colophon (still navigable) */
  numeral?: string;
}

interface RevBookSpineProps extends React.ComponentProps<"nav"> {
  chapters: SpineChapter[];
  activeId: string;
  /** Accessible navigation label, localised by consumer. */
  ariaLabel: string;
}

export function RevBookSpine({
  chapters,
  activeId,
  ariaLabel,
  className,
  ...props
}: RevBookSpineProps) {
  const activeIndex = chapters.findIndex((c) => c.id === activeId);
  const pageLabel = `${String(activeIndex + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;

  return (
    <nav
      data-slot="rev-book-spine"
      aria-label={ariaLabel}
      className={cn(
        "hidden lg:flex",
        "fixed top-1/2 left-0 -translate-y-1/2 z-30",
        "w-[188px] flex-col items-start",
        "pl-6 pr-4 py-6",
        className,
      )}
      {...props}
    >
      <ol className="flex w-full flex-col gap-4 text-left">
        {chapters.map((ch) => {
          const active = ch.id === activeId;
          return (
            <li key={ch.id} className="w-full">
              <a
                href={`#${ch.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "group flex items-center gap-3",
                  "transition-colors duration-200",
                  active
                    ? "text-rev-ink"
                    : "text-rev-ink-soft/70 hover:text-rev-ink-soft",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block w-1.5 h-1.5 shrink-0 rounded-full transition-colors duration-200",
                    active
                      ? "bg-rev-glow-cold"
                      : "bg-transparent border border-rev-rule group-hover:border-rev-ink-soft",
                  )}
                />
                {ch.numeral && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-serif italic text-[11px] tabular-nums text-rev-ink-soft/70"
                  >
                    {ch.numeral}
                  </span>
                )}
                <span
                  className={cn(
                    "min-w-0 truncate font-sans uppercase tracking-[0.12em] text-[11px] transition-[font-weight] duration-200",
                    active && "font-medium",
                  )}
                >
                  {ch.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <div className="mt-8 pl-4 font-serif italic text-[11px] text-rev-ink-soft/70">
        {pageLabel}
      </div>
    </nav>
  );
}
