import type React from "react";
import { cn } from "@/lib/utils";

type BubbleVariant = "user" | "ai" | "editor-note";

/**
 * SancBubble — Sanctuary Surface conversation bubble.
 *
 * Variants:
 * - `user`: sand-warm background, user-side tail
 * - `ai`: salt background + lantern-warm left accent, ai-side tail
 * - `editor-note`: salt + italic Source Serif + magnetic-cold left line
 *   (for AI quoting report content — "sea memory" brought into sanctuary)
 *
 * See `.claude/skills/deepdive-design/references/surface-sanctuary.md` §3.1.
 */
export function SancBubble({
  variant,
  children,
  className,
}: {
  variant: BubbleVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-[18px] py-[14px] border border-[var(--sanc-rule)]",
        "text-[var(--sanc-ink)] font-sans text-[15px] leading-[1.6]",
        variant === "user" &&
          "bg-[var(--sanc-sand-warm)] rounded-[18px_18px_4px_18px]",
        variant === "ai" &&
          "bg-[var(--sanc-salt)] rounded-[18px_18px_18px_4px] border-l-2 border-l-[var(--sanc-lantern)]",
        variant === "editor-note" &&
          "bg-[var(--sanc-salt)] rounded-[18px_18px_18px_4px] border-l-2 border-l-[var(--sanc-sea-memory)] font-serif italic",
        className,
      )}
    >
      {children}
    </div>
  );
}
