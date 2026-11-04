import type React from "react";
import { cn } from "@/lib/utils";

/**
 * RevBody — long-form reading paragraph for Revelation surface.
 * Uses Source Serif 4 at 18/1.7 with 62ch max width (golden reading column).
 *
 * See `.claude/skills/deepdive-design/references/surface-revelation.md` §2.2.
 */
export function RevBody({
  children,
  className,
  as: Component = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "div";
}) {
  return (
    <Component
      className={cn(
        "font-serif text-[18px] leading-[1.7]",
        "text-[var(--rev-ink)]",
        "max-w-[62ch]",
        className,
      )}
    >
      {children}
    </Component>
  );
}
