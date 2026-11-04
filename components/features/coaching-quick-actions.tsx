"use client";

import { MessageCircle, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const INITIAL_VISIBLE_COUNT = 6;

interface CoachingQuickActionsProps {
  title: string;
  description: string;
  options: string[];
  isFirstRound: boolean;
  isExpanded: boolean;
  showHeader?: boolean;
  expandLabel: string;
  collapseLabel: string;
  className?: string;
  onSelect: (option: string) => void;
  onToggleExpanded: () => void;
}

export function CoachingQuickActions({
  title,
  description,
  options,
  isFirstRound,
  isExpanded,
  showHeader = true,
  expandLabel,
  collapseLabel,
  className,
  onSelect,
  onToggleExpanded,
}: CoachingQuickActionsProps) {
  const visibleOptions =
    isFirstRound && !isExpanded
      ? options.slice(0, INITIAL_VISIBLE_COUNT)
      : options;
  const hasOverflow = isFirstRound && options.length > INITIAL_VISIBLE_COUNT;
  const Icon = isFirstRound ? Sparkles : MessageCircle;

  return (
    <div className={cn("dd-coach-quick-actions flex h-full flex-col", className)}>
      {showHeader && (
        <div className="dd-coach-quick-actions__header border-b border-border/50 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Icon className="h-4 w-4 text-primary" />
            <span>{title}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      )}

      <div className="dd-coach-quick-actions__list flex-1 overflow-y-auto p-4 space-y-2">
        {visibleOptions.map((option, index) => (
          <button
            key={`${option}-${index}`}
            type="button"
            onClick={() => onSelect(option)}
            className="dd-coach-quick-actions__option w-full rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground transition-colors hover:border-primary/20 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:outline-none"
          >
            {option}
          </button>
        ))}
      </div>

      {hasOverflow && (
        <div className="dd-coach-quick-actions__footer border-t border-border/50 p-4">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="w-full rounded-xl border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/20 hover:bg-accent hover:text-foreground"
          >
            {isExpanded ? collapseLabel : expandLabel}
          </button>
        </div>
      )}
    </div>
  );
}
