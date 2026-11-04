import type React from "react";
import { cn } from "@/lib/utils";

export type RiasecKey = "r" | "i" | "a" | "s" | "e" | "c";

// Static class mapping required by Tailwind JIT (dynamic `var(--archetype-${key}-rev)` won't compile).
const REV_ARCHETYPE_CLASS: Record<RiasecKey, string> = {
  r: "border-[var(--archetype-r-rev)] text-[var(--archetype-r-rev)]",
  i: "border-[var(--archetype-i-rev)] text-[var(--archetype-i-rev)]",
  a: "border-[var(--archetype-a-rev)] text-[var(--archetype-a-rev)]",
  s: "border-[var(--archetype-s-rev)] text-[var(--archetype-s-rev)]",
  e: "border-[var(--archetype-e-rev)] text-[var(--archetype-e-rev)]",
  c: "border-[var(--archetype-c-rev)] text-[var(--archetype-c-rev)]",
};

/**
 * RevBadge — Revelation Surface archetype identity badge.
 * Border + text color comes from the archetype's Revelation tier CSS variable.
 *
 * Pass `riasecKey` to use the token system, or `color` to override directly.
 * See `.claude/skills/deepdive-design/references/surface-revelation.md` §3.6.
 */
export function RevBadge({
  riasecKey,
  color,
  children,
  className,
}: {
  riasecKey?: RiasecKey;
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const archetypeClass = riasecKey ? REV_ARCHETYPE_CLASS[riasecKey] : null;
  const inlineStyle = color ? { borderColor: color, color } : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1",
        "bg-[var(--rev-paper-warm)] rounded-[2px]",
        "font-sans text-[13px] tracking-[0.04em]",
        "border",
        archetypeClass ?? "border-[var(--rev-ink)] text-[var(--rev-ink)]",
        className,
      )}
      style={inlineStyle}
    >
      {children}
    </span>
  );
}
