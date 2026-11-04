"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Minus,
  TrendingDown,
  Info,
  Tag,
  Linkedin,
  DollarSign,
  Sparkles,
} from "lucide-react";
import type { JobDirection } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import { GapAnalysisDrawer } from "./gap-analysis-drawer";

interface JobDirectionsCardProps {
  directions: JobDirection[];
  locale: Locale;
  t: Record<string, string>;
  linkedinLocation?: string;
}

export function JobDirectionsCard({
  directions,
  locale,
  t,
  linkedinLocation,
}: JobDirectionsCardProps) {
  return (
    <div className="space-y-4">
      {directions.map((dir, idx) => (
        <DirectionCard
          key={idx}
          direction={dir}
          rank={idx + 1}
          locale={locale}
          t={t}
          linkedinLocation={linkedinLocation}
        />
      ))}
    </div>
  );
}

function DirectionCard({
  direction,
  rank,
  locale,
  t,
  linkedinLocation,
}: {
  direction: JobDirection;
  rank: number;
  locale: Locale;
  t: Record<string, string>;
  linkedinLocation?: string;
}) {
  const [copied, setCopied] = useState(false);
  const title = getLocalizedField(direction, "title", locale);

  const handleCopySearch = async () => {
    try {
      await navigator.clipboard.writeText(direction.linkedinSearchQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = direction.linkedinSearchQuery;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkedInSearch = () => {
    const query = encodeURIComponent(direction.linkedinSearchQuery);
    const locationParam = linkedinLocation
      ? `&location=${encodeURIComponent(linkedinLocation)}`
      : "";
    window.open(
      `https://www.linkedin.com/jobs/search/?keywords=${query}${locationParam}`,
      "_blank",
    );
  };

  const DemandIcon =
    direction.marketSignal?.demandTrend === "rising"
      ? TrendingUp
      : direction.marketSignal?.demandTrend === "declining"
        ? TrendingDown
        : Minus;

  const demandLabel = direction.marketSignal?.demandTrend
    ? t[direction.marketSignal.demandTrend] ||
      direction.marketSignal.demandTrend
    : null;

  return (
    <Card className={rank === 1 ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-5 sm:p-6">
        {/* Header: rank + title + score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0 mt-0.5">
              {rank}
            </span>
            <div className="min-w-0">
              <h4 className="font-semibold text-base leading-snug">{title}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {direction.isIdealMatch && (
                  <Badge className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t.idealFit}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {direction.industry}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {direction.seniority}
                </Badge>
                {demandLabel && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    <DemandIcon className="h-3 w-3" />
                    {demandLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">
              {direction.matchScore}%
            </div>
            <div className="text-xs text-muted-foreground">{t.matchScore}</div>
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

        {/* Match reason */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {direction.matchReason}
        </p>

        {/* LinkedIn search query + actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-muted/40 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <code className="text-xs text-muted-foreground truncate flex-1">
              {direction.linkedinSearchQuery}
            </code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleCopySearch}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  {t.copyKeyword}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleLinkedInSearch}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t.linkedinSearch}
            </Button>
          </div>
        </div>

        {/* Resource Guide */}
        {direction.resourceGuide && (
          <div className="mt-4 pt-3 border-t border-muted/50 space-y-3">
            <p className="text-xs font-semibold text-foreground">
              {t.resourceGuide}
            </p>

            {/* ATS Keywords */}
            {direction.resourceGuide.atsKeywords?.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.atsKeywords}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {direction.resourceGuide.atsKeywords.map((kw, ki) => (
                    <Badge key={ki} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* LinkedIn Tip */}
            {getLocalizedField(
              direction.resourceGuide,
              "linkedinTip",
              locale,
            ) && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.linkedinTip}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                  {getLocalizedField(
                    direction.resourceGuide,
                    "linkedinTip",
                    locale,
                  )}
                </p>
              </div>
            )}

            {/* Salary Context */}
            {getLocalizedField(
              direction.resourceGuide,
              "salaryContext",
              locale,
            ) && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t.salaryContext}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                  {getLocalizedField(
                    direction.resourceGuide,
                    "salaryContext",
                    locale,
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gap Analysis Drawer */}
        {direction.gapAnalysis && (
          <GapAnalysisDrawer
            gapAnalysis={direction.gapAnalysis}
            locale={locale}
            t={t}
          />
        )}

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
      </CardContent>
    </Card>
  );
}
