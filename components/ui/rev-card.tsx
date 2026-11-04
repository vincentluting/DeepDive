import * as React from "react";

import { cn } from "@/lib/utils";

type Tone = "paper" | "warm";
type Density = "compact" | "default" | "relaxed";
type ArchetypeCode = "R" | "I" | "A" | "S" | "E" | "C";

interface RevCardProps extends React.ComponentProps<"div"> {
  tone?: Tone;
  emphasis?: boolean;
  density?: Density;
  archetypeAccent?: ArchetypeCode | Lowercase<ArchetypeCode>;
  asChild?: never;
}

const TONE_BG: Record<Tone, string> = {
  paper: "bg-rev-paper",
  warm: "bg-rev-paper-warm",
};

const DENSITY_PAD: Record<Density, string> = {
  compact: "p-5",
  default: "p-8",
  relaxed: "p-10",
};

const ARCHETYPE_RING: Record<ArchetypeCode, string> = {
  R: "ring-archetype-r-rev/40",
  I: "ring-archetype-i-rev/40",
  A: "ring-archetype-a-rev/40",
  S: "ring-archetype-s-rev/40",
  E: "ring-archetype-e-rev/40",
  C: "ring-archetype-c-rev/40",
};

function RevCard({
  className,
  tone = "warm",
  emphasis = false,
  density = "default",
  archetypeAccent,
  ...props
}: RevCardProps) {
  const accent = archetypeAccent
    ? (archetypeAccent.toUpperCase() as ArchetypeCode)
    : undefined;

  return (
    <div
      data-slot="rev-card"
      data-tone={tone}
      data-emphasis={emphasis || undefined}
      className={cn(
        "relative rounded-[4px] border text-rev-ink transition-colors duration-150",
        TONE_BG[tone],
        DENSITY_PAD[density],
        emphasis
          ? "border-rev-rule border-l-2 border-l-rev-glow-cold"
          : "border-rev-rule hover:border-rev-ink-soft/40",
        accent && ["ring-1 ring-inset", ARCHETYPE_RING[accent]],
        className,
      )}
      {...props}
    />
  );
}

function RevCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rev-card-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function RevCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="rev-card-title"
      className={cn(
        "font-display text-rev-ink text-xl font-normal tracking-[-0.01em] leading-[1.2]",
        className,
      )}
      {...props}
    />
  );
}

function RevCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="rev-card-description"
      className={cn("text-rev-ink-soft text-[14px] leading-[1.6]", className)}
      {...props}
    />
  );
}

function RevCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rev-card-content"
      className={cn("text-rev-ink-soft leading-[1.7]", className)}
      {...props}
    />
  );
}

function RevCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rev-card-footer"
      className={cn(
        "flex items-center gap-3 border-t border-rev-rule pt-5 mt-5",
        className,
      )}
      {...props}
    />
  );
}

interface RevEyebrowProps extends React.ComponentProps<"span"> {
  tone?: "cold" | "ink";
}

function RevEyebrow({ className, tone = "cold", ...props }: RevEyebrowProps) {
  return (
    <span
      data-slot="rev-eyebrow"
      className={cn(
        "font-sans uppercase tracking-[0.12em] text-[11px] sm:text-[12px] font-medium",
        tone === "cold" ? "text-rev-glow-cold" : "text-rev-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

interface RevRuleProps extends React.ComponentProps<"div"> {
  tone?: "cold" | "rule";
  width?: "short" | "long" | "full";
}

function RevRule({
  className,
  tone = "rule",
  width = "short",
  ...props
}: RevRuleProps) {
  return (
    <div
      data-slot="rev-rule"
      aria-hidden
      className={cn(
        "h-px",
        tone === "cold" ? "bg-rev-glow-cold" : "bg-rev-rule",
        width === "short" && "w-10",
        width === "long" && "w-24",
        width === "full" && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export {
  RevCard,
  RevCardHeader,
  RevCardTitle,
  RevCardDescription,
  RevCardContent,
  RevCardFooter,
  RevEyebrow,
  RevRule,
};
export type { RevCardProps };
