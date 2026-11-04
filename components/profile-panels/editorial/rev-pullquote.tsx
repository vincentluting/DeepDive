/**
 * RevPullquote — The "nail" of each chapter.
 *
 * Editorial convention: one Fraunces Italic display quote per chapter,
 * bordered on the left with a 2px cold-glow rule. 80px of vertical breathing
 * room above and below turns it into a deliberate reading pause.
 *
 * Optionally breathes (opacity 0.96↔1, 8s) — disabled under reduced motion
 * via CSS `@media (prefers-reduced-motion: reduce)`.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface RevPullquoteProps extends Omit<
  React.ComponentProps<"blockquote">,
  "cite"
> {
  /** Optional citation line, e.g. "— Core Insight" */
  cite?: React.ReactNode;
  /** Enable subtle breathing animation (defaults to true). */
  breath?: boolean;
  children: React.ReactNode;
}

export function RevPullquote({
  cite,
  breath = true,
  className,
  children,
  ...props
}: RevPullquoteProps) {
  return (
    <figure
      className={cn(
        "mx-auto my-20 max-w-[52ch] pl-10",
        "border-l-2 border-rev-glow-cold",
        className,
      )}
    >
      <blockquote
        data-slot="rev-pullquote"
        className={cn(
          "font-display italic font-medium",
          "text-rev-ink",
          "leading-[1.25] tracking-[-0.01em]",
          breath && "rev-pullquote-breath",
        )}
        style={{ fontSize: "var(--rev-display-md)" }}
        {...props}
      >
        {children}
      </blockquote>
      {cite && (
        <figcaption className="mt-5 font-sans uppercase tracking-[0.16em] text-[11px] text-rev-ink-soft">
          {cite}
        </figcaption>
      )}
    </figure>
  );
}
