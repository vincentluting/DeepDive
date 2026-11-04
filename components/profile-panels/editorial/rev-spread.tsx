/**
 * RevSpread — Editorial two-column layout for main body + marginalia.
 *
 * On desktop (≥1024px): 1fr prose column + 240px marginalia rail.
 * On mobile: single column, marginalia slots folded beneath.
 *
 * The prose column is clamped to --rev-measure (62ch) for ideal reading.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface RevSpreadProps extends React.ComponentProps<"div"> {
  /** Right-rail marginalia. Typically <RevMarginalia/> or small meta nodes. */
  margin?: React.ReactNode;
  /** Main prose / artifact column. */
  children: React.ReactNode;
  /** If true, collapses to single column even on desktop (for centered heroes). */
  singleColumn?: boolean;
}

export function RevSpread({
  margin,
  singleColumn = false,
  className,
  children,
  ...props
}: RevSpreadProps) {
  return (
    <div
      data-slot="rev-spread"
      className={cn(
        "mx-auto w-full",
        singleColumn
          ? "max-w-[var(--rev-measure)]"
          : "max-w-[min(1100px,100%)] lg:grid lg:grid-cols-[1fr_240px] lg:gap-16",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative",
          !singleColumn && "max-w-[var(--rev-measure)]",
        )}
      >
        {children}
      </div>
      {margin && !singleColumn && (
        <aside
          data-slot="rev-spread-margin"
          className={cn(
            "mt-10 lg:mt-2",
            "border-t border-rev-rule/60 pt-6 lg:border-t-0 lg:pt-0",
            "text-[13px] leading-[1.55] text-rev-ink-soft",
          )}
        >
          {margin}
        </aside>
      )}
    </div>
  );
}
