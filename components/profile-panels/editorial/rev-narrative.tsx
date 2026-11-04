/**
 * RevNarrative — Long-form body paragraph for the Personal Monograph.
 *
 * Use this for narrative paragraphs (combo narratives, archetype prose, etc.)
 * that need to read like an article, not shout like a pull-quote. Source Serif 4
 * at --rev-body, 60ch measure, 1.75 leading. The eyes settle, the page breathes.
 *
 * Pair with `cite` for an editorial uppercase label above the prose, mirroring
 * the figcaption convention used by RevPullquote — but without the cold-glow
 * border and display-italic typography. Pull-quotes shout; narratives speak.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface RevNarrativeProps extends React.ComponentProps<"div"> {
  /** Optional eyebrow / cite line above the prose (uppercase tracked label). */
  cite?: React.ReactNode;
  children: React.ReactNode;
}

export function RevNarrative({
  cite,
  className,
  children,
  ...props
}: RevNarrativeProps) {
  return (
    <div
      data-slot="rev-narrative"
      className={cn("mx-auto my-12 max-w-[60ch]", className)}
      {...props}
    >
      {cite && (
        <p className="mb-4 font-sans uppercase tracking-[0.16em] text-[11px] text-rev-ink-soft">
          {cite}
        </p>
      )}
      <div
        data-slot="rev-narrative-body"
        className="font-serif text-rev-ink"
        style={{ fontSize: "var(--rev-body)" }}
      >
        {children}
      </div>
    </div>
  );
}
