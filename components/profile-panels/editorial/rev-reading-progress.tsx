/**
 * RevReadingProgress — Top sticky reading progress bar (mobile / tablet).
 *
 * A 2px cold-glow line pinned to the top of the viewport that fills left-to-
 * right as the user scrolls. Replaces the spine navigation on narrow
 * screens where fixed side rails are too expensive. When `label` is given it
 * also renders a compact chip with the current section name so mobile readers
 * keep the same "where am I" cue the desktop spine provides.
 *
 * PR-2 wires it from ProfileDashboard with a real scroll listener driving
 * `percent` via React state.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RevReadingProgressProps extends React.ComponentProps<"div"> {
  /** 0..1 scroll completion. */
  percent: number;
  /** Hide on desktop where spine navigation takes over. */
  hideOnDesktop?: boolean;
  /** Current section name shown in a compact chip below the bar. */
  label?: string;
}

export function RevReadingProgress({
  percent,
  hideOnDesktop = true,
  label,
  className,
  ...props
}: RevReadingProgressProps) {
  const clamped = Math.max(0, Math.min(1, percent));
  return (
    <div
      data-slot="rev-reading-progress"
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        hideOnDesktop && "lg:hidden",
        className,
      )}
      {...props}
    >
      <div className="h-[2px] bg-rev-rule/30" aria-hidden="true">
        <div
          className="h-full bg-rev-glow-cold origin-left"
          style={{
            transform: `scaleX(${clamped})`,
            transition: "transform 80ms linear",
          }}
        />
      </div>
      {label && (
        <div className="flex justify-start px-4 pt-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rev-paper/85 px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-rev-ink-soft backdrop-blur-sm">
            <span
              className="inline-block h-1 w-1 rounded-full bg-rev-glow-cold"
              aria-hidden="true"
            />
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
