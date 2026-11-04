import type React from "react";
import { cn } from "@/lib/utils";

/**
 * Pullquote — editorial large italic quote with cold-glow left rule.
 * Fraunces italic 56pt / light weight, 52ch max width.
 *
 * See `.claude/skills/deepdive-design/references/surface-revelation.md` §3.3.
 */
export function Pullquote({
  children,
  attribution,
  className,
}: {
  children: React.ReactNode;
  attribution?: React.ReactNode;
  className?: string;
}) {
  return (
    <blockquote
      className={cn(
        "font-display italic font-light",
        "text-[clamp(32px,4.5vw,56px)] leading-[1.3]",
        "max-w-[52ch] my-20 pl-10",
        "border-l-2 border-[var(--rev-glow-cold)]",
        "text-[var(--rev-ink)]",
        className,
      )}
    >
      {children}
      {attribution && (
        <footer className="font-sans not-italic text-base font-normal mt-6 text-[var(--rev-ink-soft)]">
          — {attribution}
        </footer>
      )}
    </blockquote>
  );
}
