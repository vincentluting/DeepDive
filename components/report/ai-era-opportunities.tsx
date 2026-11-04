"use client";

import type { Locale } from "@/lib/i18n/config";
import { Cpu, Shield, AlertTriangle, Compass } from "lucide-react";
import type { CareerDirection, ReportDict } from "@/lib/types";
import type { AiEraPersonalInsight } from "@/lib/types/report";
import { CareerDirectionCard } from "./career-direction-card";
import { AiEraBadge } from "./ai-era-badge";

interface AiEraOpportunitiesProps {
  directions: CareerDirection[];
  reportId: string;
  locale: Locale;
  t: ReportDict;
  personalInsight?: AiEraPersonalInsight;
}

export function AiEraOpportunities({
  directions,
  reportId,
  locale,
  t,
  personalInsight,
}: AiEraOpportunitiesProps) {
  if (directions.length === 0 && !personalInsight) return null;

  const isZh = locale === "zh";

  return (
    <section id="ai-era-opportunities" className="mt-16">
      {/* Section divider */}
      <div className="w-12 h-px mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-10" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="h-5 w-5 text-md-gold-text" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t.aiEraOpportunitiesTitle}
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          {t.aiEraOpportunitiesSubtitle}
        </p>
      </div>

      {/* Personal AI-era insight — algorithm-generated, personalized */}
      {personalInsight && (
        <div className="rounded-2xl border border-md-gold/30 bg-md-gold/10 dark:border-md-gold/25 p-5 lg:p-7 mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-md-gold-text mb-4">
            {t.aiEraPersonalInsightTitle}
          </h3>

          {/* Adaptability score */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-2xl font-bold text-md-gold-text">
              {personalInsight.adaptabilityScore}
            </div>
            <div>
              <p className="text-xs font-medium text-md-gold-text/80">
                {t.aiEraAdaptabilityScore}
              </p>
              <div className="w-32 h-1.5 rounded-full bg-md-gold/20 mt-1">
                <div
                  className="h-full rounded-full bg-md-gold-deep dark:bg-md-gold"
                  style={{ width: `${personalInsight.adaptabilityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Moat */}
          <div className="flex items-start gap-3 mb-4">
            <Shield
              size={15}
              className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                {t.aiEraMoatLabel}
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">
                {isZh ? personalInsight.moat_zh : personalInsight.moat_en}
              </p>
            </div>
          </div>

          {/* Watch out */}
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle
              size={15}
              className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                {t.aiEraWatchOutLabel}
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">
                {isZh
                  ? personalInsight.watchOut_zh
                  : personalInsight.watchOut_en}
              </p>
            </div>
          </div>

          {/* Positioning */}
          <div className="flex items-start gap-3">
            <Compass
              size={15}
              className="mt-0.5 flex-shrink-0 text-md-gold-text"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-md-gold-text mb-1">
                {t.aiEraPositioningLabel}
              </p>
              <p className="text-sm leading-relaxed text-foreground/85 font-medium">
                {isZh
                  ? personalInsight.positioning_zh
                  : personalInsight.positioning_en}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Direction cards */}
      {directions.length > 0 && (
        <div className="space-y-4">
          {directions.map((dir, idx) => (
            <div key={dir.title_en} className="relative">
              {/* AI era category badge above card */}
              {dir.aiEraCategory && (
                <div className="mb-2">
                  <AiEraBadge category={dir.aiEraCategory} locale={locale} />
                </div>
              )}
              <CareerDirectionCard
                direction={dir}
                index={idx}
                totalDirections={directions.length}
                reportId={reportId}
                locale={locale}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
