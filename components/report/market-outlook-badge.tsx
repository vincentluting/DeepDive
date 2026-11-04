"use client";

import { useState, useRef } from "react";
import { TrendingUp, Minus, RefreshCw, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerDirection, ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";

type MarketOutlook = NonNullable<CareerDirection["marketOutlook"]>;

interface MarketOutlookBadgeProps {
  marketOutlook: MarketOutlook;
  locale: Locale;
  t: ReportDict;
  /** compact = icon only (for overview cards), default = icon + label */
  variant?: "compact" | "default";
}

const TREND_CONFIG = {
  growing: {
    icon: TrendingUp,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/8 border-emerald-500/20",
    hoverBgClass: "hover:bg-emerald-500/12",
    dotClass: "bg-emerald-500",
  },
  stable: {
    icon: Minus,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-500/8 border-sky-500/20",
    hoverBgClass: "hover:bg-sky-500/12",
    dotClass: "bg-sky-500",
  },
  transforming: {
    icon: RefreshCw,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/8 border-amber-500/20",
    hoverBgClass: "hover:bg-amber-500/12",
    dotClass: "bg-amber-500",
  },
  emerging: {
    icon: Sparkles,
    colorClass: "text-md-gold-text",
    bgClass: "bg-md-gold/10 border-md-gold/30",
    hoverBgClass: "hover:bg-md-gold/15",
    dotClass: "bg-md-gold-deep dark:bg-md-gold",
  },
} as const;

export function MarketOutlookBadge({
  marketOutlook,
  locale,
  t,
  variant = "default",
}: MarketOutlookBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config =
    TREND_CONFIG[marketOutlook.trend as keyof typeof TREND_CONFIG] ??
    TREND_CONFIG.stable;
  const Icon = config.icon;
  const label = getLocalizedField(marketOutlook, "label", locale);
  const note = getLocalizedField(marketOutlook, "note", locale);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 150);
  };

  const handleTouchToggle = (e: React.TouchEvent) => {
    e.stopPropagation();
    setShowTooltip((prev) => !prev);
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
          config.bgClass,
          config.colorClass,
          config.hoverBgClass,
          variant === "compact" && "px-1.5",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleTouchToggle}
        aria-label={`${t.marketOutlookTitle}: ${label}`}
      >
        <Icon
          className={cn(
            "shrink-0",
            variant === "compact" ? "h-3 w-3" : "h-3 w-3",
          )}
        />
        {variant !== "compact" && <span>{label}</span>}
      </button>

      {/* Tooltip / popover */}
      {showTooltip && (
        <div
          className={cn(
            "absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border/50",
            "bg-card/95 backdrop-blur-sm shadow-lg p-3 text-left",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Title row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={cn(
                "inline-flex h-1.5 w-1.5 rounded-full shrink-0",
                config.dotClass,
              )}
            />
            <p className={cn("text-xs font-semibold", config.colorClass)}>
              {label}
            </p>
          </div>

          {/* Note */}
          {note && (
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
              {note}
            </p>
          )}

          {/* Source */}
          <div className="flex items-center gap-1 pt-2 border-t border-muted/40">
            <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <p className="text-[10px] text-muted-foreground/50 leading-snug">
              {t.marketOutlookSource}: {marketOutlook.source} ·{" "}
              {t.marketOutlookUpdated} {marketOutlook.lastUpdated}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
