import type React from "react";
import { cn } from "@/lib/utils";

/**
 * ReflectionPrompt — AI-initiated reflective question.
 * Rendered as a bookish italic line between rule borders — not a button, not a card.
 *
 * See `.claude/skills/deepdive-design/references/surface-sanctuary.md` §3.3.
 */
export function ReflectionPrompt({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "py-6 my-8 text-center",
        "border-t border-b border-[var(--sanc-rule)]",
        "font-display italic text-[20px] leading-[1.5] font-normal",
        "text-[var(--sanc-ink)]",
        className,
      )}
    >
      {children}
    </p>
  );
}
