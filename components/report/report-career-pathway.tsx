"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import type {
  Panel3Pathway,
  Panel1CareerMatch,
  RealConditions,
  CareerReport,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import {
  getCityDisplayName,
  getCountryDisplayName,
} from "@/lib/data/global-cities";
import { JobDirectionsCard } from "./job-directions-card";
import { SearchStrategySection } from "./search-strategy-section";
import { WeeklyActionPlan } from "./weekly-action-plan";
import { RealConditionsForm } from "@/components/reality-conditions/real-conditions-form";
import { IdealRealityDirections } from "./ideal-reality-directions";

interface ReportCareerPathwayProps {
  pathway: Panel3Pathway;
  reportId: string;
  locale: Locale;
  t: Record<string, string>;
  /** Assessment session ID for saving reality conditions */
  sessionId?: string | null;
  /** User ID for userId-based conditions lookup (primary) */
  userId?: string | null;
  /** Assessment ID for report regeneration */
  assessmentId?: string | null;
  /** Career match section for showing directions when real conditions not provided */
  careerMatch?: Panel1CareerMatch | null;
  /** Callback when report is updated via pathway regeneration */
  onReportUpdated?: (report: CareerReport) => void;
}

export function ReportCareerPathway({
  pathway: initialPathway,
  reportId,
  locale,
  t,
  sessionId,
  userId,
  assessmentId: _assessmentId,
  careerMatch: initialCareerMatch,
  onReportUpdated,
}: ReportCareerPathwayProps) {
  const [pathway, setPathway] = useState(initialPathway);
  const [careerMatch, setCareerMatch] = useState(initialCareerMatch);
  const [formOpen, setFormOpen] = useState(false);
  const [existingConditions, setExistingConditions] =
    useState<RealConditions | null>(null);

  // Fetch existing conditions — userId-first, sessionId fallback
  useEffect(() => {
    const url = userId
      ? `/api/reality-conditions?userId=${userId}`
      : sessionId
        ? `/api/reality-conditions?sessionId=${sessionId}`
        : null;
    if (!url) return;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.conditions) {
          setExistingConditions(data.conditions);
        }
      })
      .catch(() => {});
  }, [userId, sessionId]);

  // Derive LinkedIn location string from real conditions
  const linkedinLocation = useMemo(() => {
    if (!existingConditions) return undefined;

    const firstCity = existingConditions.targetCities?.find(
      (c) => c.toLowerCase() !== "remote",
    );
    if (firstCity) {
      return getCityDisplayName(firstCity, locale);
    }

    if (existingConditions.targetCountry) {
      return getCountryDisplayName(existingConditions.targetCountry, locale);
    }

    return undefined;
  }, [existingConditions, locale]);

  const handleFormSuccess = () => {
    window.location.reload();
  };

  // Handle report update from inline regeneration
  const handleReportUpdated = useCallback(
    (updatedReport: unknown) => {
      const report = updatedReport as CareerReport;
      if (report.careerPathway) {
        setPathway(report.careerPathway);
      }
      if (report.careerMatch) {
        setCareerMatch(report.careerMatch);
      }
      if (onReportUpdated) {
        onReportUpdated(report);
      }
    },
    [onReportUpdated],
  );

  return (
    // overflow-x-clip guards against any future child that accidentally
    // overflows the 375px viewport (cards, badges, long LinkedIn queries).
    // clip > hidden here: does not create a scroll container and does not
    // break sticky descendants.
    <div className="space-y-16 overflow-x-clip">
      {/* Ideal vs Reality career directions */}
      <section id="pathway-section">
        <IdealRealityDirections
          careerMatch={careerMatch ?? { directions: [], summary: "" }}
          reportId={reportId}
          locale={locale}
          t={t}
          sessionId={sessionId}
          realConditionsProvided={pathway.realConditionsProvided}
          existingConditions={existingConditions}
          onReportUpdated={handleReportUpdated}
        />
      </section>

      {/* Career pathway full content (only when conditions provided) */}
      {pathway.realConditionsProvided && (
        <>
          {/* Edit conditions button */}
          {sessionId && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                {t.editConditions}
              </Button>
            </div>
          )}

          {/* 3.1 Job Directions */}
          {pathway.jobDirections.length > 0 && (
            <section id="pathway-directions">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {t.jobDirections}
                </h2>
                <p className="text-muted-foreground mt-1">{t.directionsNote}</p>
              </div>
              <JobDirectionsCard
                directions={pathway.jobDirections}
                locale={locale}
                t={t}
                linkedinLocation={linkedinLocation}
              />
            </section>
          )}

          {/* 3.2 Job Search Strategy */}
          <section id="pathway-strategy">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t.jobSearchStrategy}
              </h2>
            </div>
            <SearchStrategySection strategy={pathway.jobSearchStrategy} t={t} />
          </section>

          {/* 3.3 Action Plan */}
          <section id="pathway-action-plan">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t.actionPlan}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {t.actionIntensity}:{" "}
                  {actionIntensityLabel(pathway.actionPlan.intensity, locale)}
                </Badge>
              </div>
            </div>
            <WeeklyActionPlan
              actionPlan={pathway.actionPlan}
              reportId={reportId}
              locale={locale}
              t={t}
              onLockedWeekClick={() => {}}
            />
          </section>

          {sessionId && (
            <RealConditionsForm
              open={formOpen}
              onOpenChange={setFormOpen}
              sessionId={sessionId}
              locale={locale as Locale}
              existingConditions={existingConditions}
              onSuccess={handleFormSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}

function actionIntensityLabel(intensity: string, locale: Locale): string {
  const dict = getDictionaryClient(locale);
  const t = dict.reportPanels;
  const labels: Record<string, string> = {
    exploratory: t.intensityExploratory,
    structured: t.intensityStructured,
    accelerated: t.intensityAccelerated,
  };
  return labels[intensity] || intensity;
}
