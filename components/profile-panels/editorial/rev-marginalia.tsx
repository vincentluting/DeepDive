/**
 * RevMarginalia — Page-margin annotations (like a scholarly book's side notes).
 *
 * Lives in the right rail of <RevSpread> on desktop. Shows confidence,
 * cross-references, methodology footnotes, and timestamps — the metadata
 * that would otherwise clutter the prose column.
 *
 * On mobile, the parent <RevSpread> folds these below the prose with a thin
 * rule separator; no layout changes needed here.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface MarginaliaItem {
  /** Small uppercase label, e.g. "Confidence" */
  label?: React.ReactNode;
  /** Italic serif body value, e.g. "72% coverage" */
  value: React.ReactNode;
  /** Optional key for list reconciliation */
  key?: string | number;
}

interface RevMarginaliaProps extends React.ComponentProps<"div"> {
  items?: MarginaliaItem[];
  children?: React.ReactNode;
}

export function RevMarginalia({
  items,
  className,
  children,
  ...props
}: RevMarginaliaProps) {
  return (
    <div
      data-slot="rev-marginalia"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      {items?.map((item, idx) => (
        <div key={item.key ?? idx} className="flex flex-col gap-1">
          {item.label && (
            <span className="font-sans uppercase tracking-[0.14em] text-[10px] text-rev-signal-info">
              {item.label}
            </span>
          )}
          <span className="font-serif italic text-[13px] leading-[1.5] text-rev-ink-soft">
            {item.value}
          </span>
        </div>
      ))}
      {children}
    </div>
  );
}
