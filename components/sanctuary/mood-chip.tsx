import type React from "react";
import { cn } from "@/lib/utils";

/**
 * MoodChip — emotion check-in chip. Selected state gets lantern-light halo.
 *
 * See `.claude/skills/deepdive-design/references/surface-sanctuary.md` §3.4.
 */
export function MoodChip({
  selected,
  children,
  onClick,
  className,
}: {
  selected?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected || undefined}
      className={cn(
        "px-[18px] py-[10px] rounded-full",
        "font-sans text-[14px] text-[var(--sanc-ink)]",
        "border border-[var(--sanc-rule)] bg-[var(--sanc-salt)]",
        "transition-all duration-[250ms] ease-out",
        "data-[selected=true]:bg-[var(--sanc-lantern-soft)]",
        "data-[selected=true]:border-[var(--sanc-lantern)]",
        "data-[selected=true]:shadow-[0_0_16px_rgba(245,166,35,0.2)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
