/**
 * RevHandRule — SVG-based "handmade" horizontal rule.
 *
 * Replaces <hr> and plain div.h-px with a gently curved SVG path, giving
 * the line a slightly hand-drawn quality. One curve, seeded, no animation
 * — reliable and SSR-safe.
 *
 * Use for:
 *   - Chapter opener accent (width=40, tone="cold")
 *   - Section dividers inside artifacts (width="full", tone="rule")
 *   - Decorative marks under titles (width=120)
 */
import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "cold" | "rule" | "attention" | "ink";

interface RevHandRuleProps extends Omit<React.ComponentProps<"svg">, "width"> {
  /** CSS width. Number → px; "full" → 100%; otherwise a CSS length. */
  width?: number | "full" | string;
  tone?: Tone;
  /** Stroke thickness in px (visual). Default 1.5. */
  strokeWidth?: number;
}

const STROKE: Record<Tone, string> = {
  cold: "var(--rev-glow-cold)",
  rule: "var(--rev-rule)",
  attention: "var(--rev-signal-attention)",
  ink: "var(--rev-ink)",
};

export function RevHandRule({
  width = 40,
  tone = "rule",
  strokeWidth = 1.5,
  className,
  ...props
}: RevHandRuleProps) {
  const resolvedWidth =
    width === "full"
      ? "100%"
      : typeof width === "number"
        ? `${width}px`
        : width;

  return (
    <svg
      data-slot="rev-hand-rule"
      aria-hidden="true"
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      width={resolvedWidth}
      height="3"
      className={cn("block shrink-0", className)}
      style={{ width: resolvedWidth, height: "3px" }}
      {...props}
    >
      <path
        d="M0 2 C 18 1.4, 38 2.6, 50 2 S 82 1.3, 100 2"
        fill="none"
        stroke={STROKE[tone]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
