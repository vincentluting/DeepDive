/**
 * RevArtifact — Museum-style display card for data visualisations.
 *
 * Every visualisation (Terrain, Spectrum, Astrolabe, Compass, etc.) is
 * wrapped in one of these. It enforces the exhibit rhythm:
 *   eyebrow (code · category) → content → rule → meta row
 *
 * No drop shadow, no rounded corners beyond 4px — Revelation rule.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RevHandRule } from "./rev-hand-rule";

interface MetaItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

interface RevArtifactProps extends Omit<
  React.ComponentProps<"article">,
  "title"
> {
  /** Small eyebrow, e.g. "Artifact No.02 · Inner Terrain" */
  eyebrow?: React.ReactNode;
  /** Optional display title rendered in Fraunces above the content. */
  title?: React.ReactNode;
  /** Main visualisation / content. */
  children: React.ReactNode;
  /** Bottom meta row — e.g. [{label: "Confidence", value: "72%"}] */
  meta?: MetaItem[];
  /** Tone: "paper" (default) or "warm". */
  tone?: "paper" | "warm";
}

export function RevArtifact({
  eyebrow,
  title,
  meta,
  tone = "warm",
  className,
  children,
  ...props
}: RevArtifactProps) {
  return (
    <article
      data-slot="rev-artifact"
      className={cn(
        "relative rounded-[4px] border border-rev-rule text-rev-ink",
        tone === "paper" ? "bg-rev-paper" : "bg-rev-paper-warm",
        "px-6 py-7 sm:px-8 sm:py-9",
        className,
      )}
      {...props}
    >
      {eyebrow && (
        <p
          className={cn(
            "font-sans uppercase font-medium",
            "tracking-[0.14em] text-[11px]",
            "text-rev-signal-info",
            "mb-4",
          )}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h3
          className="font-display text-rev-ink font-normal tracking-[-0.01em] leading-[1.15] mb-5"
          style={{ fontSize: "clamp(22px, 2.5vw, 30px)" }}
        >
          {title}
        </h3>
      )}
      <div className="relative">{children}</div>
      {meta && meta.length > 0 && (
        <>
          <div className="mt-7">
            <RevHandRule width="full" tone="rule" />
          </div>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-rev-ink-soft">
            {meta.map((item, idx) => (
              <div key={idx} className="flex items-baseline gap-1.5">
                <dt className="font-sans uppercase tracking-[0.12em] text-[10px] text-rev-signal-info">
                  {item.label}
                </dt>
                <dd className="font-serif italic">{item.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </article>
  );
}
