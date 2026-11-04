"use client";

import type { Locale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Award,
  Users,
  Target,
  Building2,
} from "lucide-react";
import type { CareerDirection, ReportDict } from "@/lib/types";
import { getWeightedMatchFactors } from "@/lib/career-matching/weights";
import { getLocalizedField } from "@/lib/i18n/localize";
import {
  INDUSTRY_MAP,
  getIndustryLabelByLocale,
} from "@/lib/constants/industries";
import { CrossCulturalRealityPanel } from "./cross-cultural-reality-panel";
import { MarketOutlookBadge } from "./market-outlook-badge";

interface CareerDetailPanelProps {
  direction: CareerDirection;
  locale: Locale;
  t: ReportDict;
  /** Show full market outlook badge — only in reality-adjusted phase */
  showMarketOutlook?: boolean;
}

export function CareerDetailPanel({
  direction,
  locale,
  t,
  showMarketOutlook = true,
}: CareerDetailPanelProps) {
  const detailColors: Record<string, string> = {
    interestFit: "bg-blue-500",
    valueFit: "bg-rose-500",
    personalityFit: "bg-amber-500",
    adaptabilityFit: "bg-emerald-500",
    industryFit: "bg-cyan-500",
  };
  const breakdownScores = (direction.matchBreakdown ?? {}) as Record<
    string,
    number | undefined
  >;
  // Factors + weights come from the engine's WEIGHT_PRESETS (single source),
  // so the report breakdown always matches how the score is computed.
  const breakdownItems = direction.matchBreakdown
    ? getWeightedMatchFactors("full").map((f) => ({
        label: (t as Record<string, string>)[f.key] ?? f.key,
        value: breakdownScores[f.key] ?? 0,
        weight: `${Math.round(f.weight * 100)}%`,
        color: detailColors[f.key] ?? "bg-slate-500",
      }))
    : [];
  const weightFormula = breakdownItems
    .map((item) => `${item.label} ${item.weight}`)
    .join(" · ");

  return (
    <div className="mt-4 pt-4 border-t border-muted/50 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {/* Market outlook badge — full view with note, reality-adjusted phase only */}
      {showMarketOutlook && direction.marketOutlook && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t.marketOutlookTitle ?? "Market Outlook"}:
          </span>
          <MarketOutlookBadge
            marketOutlook={direction.marketOutlook}
            locale={locale}
            t={t}
          />
        </div>
      )}

      {/* Industry tags */}
      {direction.industries && direction.industries.length > 0 && (
        <div className="flex items-start gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1.5">
            {direction.industries.slice(0, 4).map((id) => {
              const ind = INDUSTRY_MAP.get(id);
              const label = ind ? getIndustryLabelByLocale(ind, locale) : id;
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="text-[10px] font-normal"
                >
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Match breakdown visualization */}
      {breakdownItems.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t.evidenceMatchComposition}
          </p>
          {breakdownItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {item.label} ({item.weight})
                </span>
                <span className="font-medium">{item.value}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                  style={{ width: `${Math.min(item.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/50">
            {(t.evidenceWeightFormula ?? "").replace(
              "{{formula}}",
              weightFormula,
            )}
          </p>
        </div>
      )}

      {/* Cross-cultural reality */}
      {direction.crossCulturalFit && direction.crossCulturalBarrierLevel && (
        <CrossCulturalRealityPanel
          crossCulturalFit={direction.crossCulturalFit}
          barrierLevel={direction.crossCulturalBarrierLevel}
          locale={locale}
          directionTitle={getLocalizedField(direction, "title", locale)}
          t={t}
        />
      )}

      {/* Challenges */}
      {direction.challenges && (
        <Card className="border-amber-500/15 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                  {t.challenges}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {direction.challenges}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exploration note */}
      {direction.explorationNote && (
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-1">
                  {t.explorationTip}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {direction.explorationNote}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actionable Insights Roadmap */}
      {direction.actionableInsights && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">
            {t.actionableRoadmap}
          </p>

          {/* Books */}
          {direction.actionableInsights.books?.length > 0 && (
            <Card className="border-blue-500/15 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {t.recommendedBooks}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {direction.actionableInsights.books.map((book, bi) => (
                    <div key={bi} className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {book.title}{" "}
                        <span className="text-muted-foreground font-normal">
                          {t.bookBy} {book.author}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {getLocalizedField(book, "reason", locale)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {direction.actionableInsights.certifications?.length > 0 && (
            <Card className="border-md-gold/30 bg-md-gold/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <Award className="h-4 w-4 text-md-gold-text shrink-0" />
                  <p className="text-xs font-medium text-md-gold-text">
                    {t.certifications}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {direction.actionableInsights.certifications.map(
                    (cert, ci) => (
                      <div key={ci} className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {cert.name}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {cert.provider}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              cert.priority === "start_here"
                                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {cert.priority === "start_here"
                              ? t.certStartHere
                              : t.certNextStep}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {cert.timeToComplete}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getLocalizedField(cert, "reason", locale)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Community Move */}
          {direction.actionableInsights.communityMove && (
            <Card className="border-teal-500/15 bg-teal-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                        {t.communityMove}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {direction.actionableInsights.communityMove.platform}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getLocalizedField(
                        direction.actionableInsights.communityMove,
                        "action",
                        locale,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 30-Day Challenge */}
          {direction.actionableInsights.thirtyDayChallenge && (
            <Card className="border-orange-500/15 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                      {t.thirtyDayChallenge}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getLocalizedField(
                        direction.actionableInsights.thirtyDayChallenge,
                        "challenge",
                        locale,
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Overall match summary */}
      {direction.matchScore >= 75 && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{t.strongAlignment}</span>
        </div>
      )}
    </div>
  );
}
