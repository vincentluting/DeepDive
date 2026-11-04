import type React from "react";
import { cn } from "@/lib/utils";

/**
 * RevCard — Revelation Surface paper card.
 * No shadow, ivory paper-warm background, thin rule border.
 * Use `emphasis` to add a cold-glow left accent line.
 *
 * See `.claude/skills/deepdive-design/references/surface-revelation.md` §3.2.
 */
export function RevCard({
  children,
  className,
  emphasis,
}: {
  children: React.ReactNode;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-[var(--rev-paper-warm)] border border-[var(--rev-rule)] rounded-[4px] p-8",
        emphasis && "border-l-2 border-l-[var(--rev-glow-cold)] pl-[38px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
