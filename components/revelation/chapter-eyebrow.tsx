import type React from "react";
import { cn } from "@/lib/utils";

/**
 * ChapterEyebrow — small-caps metadata line above a chapter title.
 *
 * Example: `CHAPTER 01 · ANCHOR`.
 * See `.claude/skills/deepdive-design/references/surface-revelation.md` §3.4.
 */
export function ChapterEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-sans text-[13px] font-medium uppercase tracking-[0.12em]",
        "text-[var(--rev-glow-cold)]",
        className,
      )}
    >
      {children}
    </p>
  );
}
