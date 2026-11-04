"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerDirection, ReportDict } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import { getWeightedMatchFactors } from "@/lib/career-matching/weights";
import { EvidencePopover } from "./evidence-popover";
import { ExploreTasksSection } from "./explore-tasks-section";
import { CareerDetailPanel } from "./career-detail-panel";
import { MatchBreakdownExplainer } from "@/components/features/match-breakdown-explainer";
import { MarketOutlookBadge } from "./market-outlook-badge";
import { AiEraBadge } from "./ai-era-badge";
import { AiImpactBadge } from "./ai-impact-badge";
import { ResilienceBadge } from "./resilience-badge";

interface CareerDirectionCardProps {
  direction: CareerDirection;
  index: number;
  totalDirections: number;
  reportId: string;
  locale: Locale;
  t: ReportDict;
  isFirst?: boolean;
  /** Show market outlook badge — only in reality-adjusted phase */
  showMarketOutlook?: boolean;
}

export function CareerDirectionCard({
  direction,
  index,
  totalDirections,
  reportId,
  locale,
  t,
  isFirst = false,
  showMarketOutlook = true,
}: CareerDirectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const title = getLocalizedField(direction, "title", locale);

  return (
    <div
      id={`direction-${index + 1}`}
      className={cn(
        "card-elevated rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/[0.04] hover:-translate-y-0.5",
        isFirst && "ring-1 ring-primary/10 bg-primary/[0.02]",
        expanded && "ring-1 ring-primary/15",
      )}
    >
      <div className="p-6 sm:p-8">
        {/* Clickable header */}
        <div
          role="button"
          tabIndex={0}
          className="w-full text-left cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded(!expanded);
            }
          }}
          aria-expanded={expanded}
          aria-label={title}
        >
          {/* Header: rank + title + score */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Magazine-style rank number */}
              <span className="text-3xl sm:text-4xl font-bold text-primary/20 tabular-nums mr-4 shrink-0 leading-none">
                {String(direction.rank || index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h4 className="font-semibold text-base leading-snug">
                  {title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {direction.alignedValues?.length > 0 && (
                    <span className="text-[11px] text-muted-foreground/60 font-medium">
                      {direction.alignedValues.join(" · ")}
                    </span>
                  )}
                  {direction.aiImpactLabel && (
                    <AiImpactBadge
                      label={direction.aiImpactLabel}
                      score={direction.aiExposureScore}
                      locale={locale}
                      variant="compact"
                    />
                  )}
                  {direction.aiEraCategory && (
                    <AiEraBadge
                      category={direction.aiEraCategory}
                      locale={locale}
                      variant="compact"
                    />
                  )}
                  {direction.resilienceLevel != null && (
                    <ResilienceBadge
                      level={direction.resilienceLevel}
                      locale={locale}
                    />
                  )}
                  {showMarketOutlook && direction.marketOutlook && (
                    <MarketOutlookBadge
                      marketOutlook={direction.marketOutlook}
                      locale={locale}
                      t={t}
                      variant="compact"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold tracking-tight text-primary">
                      {direction.matchScore}
                    </span>
                    <span className="text-xs text-muted-foreground/50">%</span>
                  </div>
                  <EvidencePopover
                    matchScore={direction.matchScore}
                    matchBreakdown={direction.matchBreakdown}
                    directionTitle={title}
                    locale={locale}
                    t={t}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.matchScore}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </div>
        </div>

        {/* Match score progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(direction.matchScore, 100)}%` }}
            />
          </div>
        </div>

        {/* Details section — hidden on mobile unless expanded, always visible on desktop */}
        <div className={cn(expanded ? "block" : "hidden sm:block")}>
          {/* Match breakdown */}
          {direction.matchBreakdown && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
              {getWeightedMatchFactors("full").map((f) => {
                const scores = direction.matchBreakdown as Record<
                  string,
                  number | undefined
                >;
                return (
                  <span
                    key={f.key}
                    className="text-[11px] text-muted-foreground"
                  >
                    {(t as Record<string, string>)[f.key]} {scores[f.key] ?? 0}%
                  </span>
                );
              })}
            </div>
          )}

          {/* Brief summary */}
          {direction.whySuitable && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t.whySuitable}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {direction.whySuitable}
              </p>
            </div>
          )}

          {/* Match Breakdown Explainer */}
          {direction.matchBreakdown && (
            <div className="mb-3">
              <MatchBreakdownExplainer
                direction={direction}
                locale={locale}
                t={t}
              />
            </div>
          )}
        </div>

        {/* Expanded detail panel with animation */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-border/30 mt-6">
                <CareerDetailPanel
                  direction={direction}
                  locale={locale}
                  t={t}
                  showMarketOutlook={showMarketOutlook}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explore Tasks + Annotation — hidden on mobile unless expanded */}
        <div className={cn(expanded ? "block" : "hidden sm:block")}>
          <ExploreTasksSection
            directionRank={direction.rank || index + 1}
            directionTitle={title}
            reportId={reportId}
            locale={locale}
            t={t}
            totalDirections={totalDirections}
            onNavigateNext={
              index < totalDirections - 1
                ? () => {
                    document
                      .getElementById(`direction-${index + 2}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                : undefined
            }
          />

          {/* Annotation confidence disclaimer */}
          {direction.annotationConfidence && (
            <div className="mt-4 pt-3 border-t border-muted/50 flex items-start gap-1.5">
              <Info className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground/60 leading-snug">
                {direction.annotationConfidence === "community-verified"
                  ? t.annotationCommunityVerified
                  : t.annotationExpertEstimated}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
