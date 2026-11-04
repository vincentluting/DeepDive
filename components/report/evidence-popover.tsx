"use client";

import { useState, useEffect } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DimensionBreakdown } from "./dimension-breakdown";
import { ConfidenceIndicator } from "./confidence-indicator";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

/** Source question evidence — defined locally, not exported from lib/types */
interface SourceQuestion {
  questionId: string;
  type: string;
  weight: number;
}

interface EvidencePopoverProps {
  /** Match score to display */
  matchScore: number;
  /** Match breakdown components */
  matchBreakdown?: {
    interestFit: number;
    valueFit: number;
    personalityFit: number;
    adaptabilityFit: number;
  };
  /** Source questions for expanded view */
  sourceQuestions?: SourceQuestion[];
  /** Confidence breakdown for the relevant dimensions */
  confidenceEntries?: {
    dimension: string;
    confidence: number;
    reasons: { factor: string; impact: number; detail: string }[];
  }[];
  /** Overall confidence for this match */
  confidence?: number;
  /** Direction title for the sheet header */
  directionTitle?: string;
  locale: Locale;
  t: Record<string, string>;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

/** Shared content rendered inside both Popover and Sheet */
function EvidenceContent({
  matchBreakdown,
  sourceQuestions,
  confidenceEntries,
  confidence,
  locale,
  t,
}: Omit<EvidencePopoverProps, "matchScore" | "directionTitle">) {
  const [expanded, setExpanded] = useState(false);

  // Find the average confidence from all entries, or use the provided confidence
  const avgConfidence =
    confidence ??
    (confidenceEntries && confidenceEntries.length > 0
      ? confidenceEntries.reduce((sum, e) => sum + e.confidence, 0) /
        confidenceEntries.length
      : undefined);

  return (
    <div className="space-y-4">
      {/* Dimension breakdown chart */}
      <DimensionBreakdown
        matchBreakdown={matchBreakdown}
        sourceQuestions={expanded ? sourceQuestions : undefined}
        expanded={expanded}
        locale={locale}
        t={t}
      />

      {/* Confidence indicator */}
      {avgConfidence !== undefined && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            {t.evidenceMatchConfidence}
          </p>
          <ConfidenceIndicator confidence={avgConfidence} locale={locale} />
        </div>
      )}

      {/* Confidence breakdown details */}
      {confidenceEntries && confidenceEntries.length > 0 && expanded && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.evidenceConfidenceDetails}
          </p>
          <div className="space-y-2">
            {confidenceEntries.map((entry) => (
              <div key={entry.dimension} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {entry.dimension}
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {Math.round(entry.confidence * 100)}%
                  </span>
                </div>
                {entry.reasons.length > 0 && (
                  <div className="pl-2 space-y-0.5">
                    {entry.reasons.map((reason, ri) => (
                      <p
                        key={ri}
                        className="text-[10px] text-muted-foreground/70"
                      >
                        <span
                          className={
                            reason.impact >= 0
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }
                        >
                          {reason.impact >= 0 ? "+" : ""}
                          {(reason.impact * 100).toFixed(0)}%
                        </span>{" "}
                        {reason.detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/collapse toggle */}
      {sourceQuestions && sourceQuestions.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline w-full justify-center pt-1"
        >
          {expanded ? t.evidenceShowLess : t.evidenceViewSources}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * EvidencePopover — renders an ⓘ button that opens evidence chain details.
 * Desktop: Radix Popover | Mobile: Bottom Sheet
 */
export function EvidencePopover(props: EvidencePopoverProps) {
  const { matchScore, directionTitle, locale, t, ...contentProps } = props;
  const isMobile = useIsMobile();
  const a11y = getDictionaryClient(locale as Locale).a11y;

  const triggerButton = (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
      aria-label={t.evidenceViewDetails}
    >
      <Info className="h-3.5 w-3.5" />
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-y-auto rounded-t-2xl"
          closeLabel={a11y.close}
        >
          <SheetHeader>
            <SheetTitle className="text-base">
              {directionTitle && (
                <span className="text-muted-foreground font-normal text-sm mr-2">
                  {directionTitle}
                </span>
              )}
              {matchScore}% {t.matchScore}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t.evidenceHowCalculated}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 pt-2">
            <EvidenceContent {...contentProps} locale={locale} t={t} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 max-h-[60vh] overflow-y-auto"
      >
        <div className="mb-3">
          <p className="text-sm font-medium">
            {matchScore}% {t.matchScore}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.evidenceHowCalculated}
          </p>
        </div>
        <EvidenceContent {...contentProps} locale={locale} t={t} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * EvidenceCollapsible — inline collapsible evidence section for Panel 2 modules.
 * Shows "View Evidence" button that expands to show confidence + source details.
 */
interface EvidenceCollapsibleProps {
  /** Module confidence (0-1) */
  confidence: number;
  /** Dimension name for display */
  dimensionLabel: string;
  /** Confidence breakdown entries for this module */
  confidenceEntries?: {
    dimension: string;
    confidence: number;
    reasons: { factor: string; impact: number; detail: string }[];
  }[];
  locale: Locale;
  /** Dark variant for profile page */
  variant?: "light" | "dark";
}

export function EvidenceCollapsible({
  confidence,
  dimensionLabel,
  confidenceEntries,
  locale,
  variant = "dark",
}: EvidenceCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = variant === "dark";
  const t = getDictionaryClient(locale).reportPanels;

  // Find the entry matching this dimension
  const entry = confidenceEntries?.find(
    (e) => e.dimension.toLowerCase() === dimensionLabel.toLowerCase(),
  );

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs transition-colors ${
          isDark
            ? "text-white/60 hover:text-white/80"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {t.evidenceViewEvidence}
      </button>

      {isOpen && (
        <div
          className={`mt-2 p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-muted/30"}`}
        >
          <ConfidenceIndicator
            confidence={confidence}
            locale={locale}
            variant={variant}
          />

          {/* Show reasons if available */}
          {entry && entry.reasons.length > 0 && (
            <div className="mt-3 space-y-1">
              <p
                className={`text-xs font-medium ${isDark ? "text-white/70" : "text-muted-foreground"}`}
              >
                {t.evidenceConfidenceFactors}
              </p>
              {entry.reasons.map((reason, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-[11px] ${
                    isDark ? "text-white/60" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`shrink-0 font-mono ${
                      reason.impact >= 0 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {reason.impact >= 0 ? "+" : ""}
                    {(reason.impact * 100).toFixed(0)}%
                  </span>
                  <span>{reason.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
