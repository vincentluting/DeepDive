"use client";

import type { Locale } from "@/lib/i18n/config";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { Panel1CareerMatch, CareerDirection } from "@/lib/types";
import { CareerDirectionCard } from "./career-direction-card";
import { InlineRealityForm, RegeneratingOverlay } from "./inline-reality-form";
import type { RealConditions } from "@/lib/types";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";

interface IdealRealityDirectionsProps {
  careerMatch: Panel1CareerMatch;
  reportId: string;
  locale: Locale;
  t: Record<string, string>;
  sessionId?: string | null;
  realConditionsProvided: boolean;
  existingConditions?: RealConditions | null;
  onReportUpdated?: (updatedReport: unknown) => void;
}

export function IdealRealityDirections({
  careerMatch,
  reportId,
  locale,
  t,
  sessionId,
  realConditionsProvided,
  existingConditions,
  onReportUpdated,
}: IdealRealityDirectionsProps) {
  const [phase, setPhase] = useState<"ideal" | "reality">(
    realConditionsProvided ? "reality" : "ideal",
  );
  const [regenerating, setRegenerating] = useState(false);
  const [showAllIdeal, setShowAllIdeal] = useState(false);

  const idealDirections =
    careerMatch.idealDirections && careerMatch.idealDirections.length > 0
      ? careerMatch.idealDirections
      : careerMatch.directions;
  const filteredDirections = careerMatch.directions;
  const realityImpact = careerMatch.realityImpact;

  const hasRealityData = realConditionsProvided && realityImpact;

  // Handle reality conditions submitted — trigger Panel 3 regeneration
  const handleRealityConditionsSuccess = useCallback(async () => {
    if (!sessionId) return;
    setRegenerating(true);
    try {
      const res = await csrfFetch(
        `/api/report/${reportId}/regenerate-pathway`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.report && onReportUpdated) {
          onReportUpdated(data.report);
        }
        setPhase("reality");
      } else {
        // Fallback: reload if regeneration fails
        window.location.reload();
      }
    } catch {
      window.location.reload();
    } finally {
      setRegenerating(false);
    }
  }, [sessionId, reportId, onReportUpdated]);

  // Determine impact category for a direction
  const getImpactCategory = (
    dir: CareerDirection,
  ): "strengthened" | "weakened" | "new" | "unchanged" => {
    if (!realityImpact) return "unchanged";
    if (realityImpact.strengthened.includes(dir.title_en))
      return "strengthened";
    if (realityImpact.weakened.includes(dir.title_en)) return "weakened";
    if (realityImpact.newOpportunities.includes(dir.title_en)) return "new";
    return "unchanged";
  };

  // Directions for the current phase
  const displayDirections =
    phase === "ideal"
      ? showAllIdeal
        ? idealDirections
        : idealDirections.slice(0, 5)
      : filteredDirections;

  if (regenerating) {
    return <RegeneratingOverlay t={t} />;
  }

  return (
    <div className="space-y-6">
      {/* Phase header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {phase === "ideal" ? t.idealPhaseTitle : t.realityPhaseTitle}
        </h2>
        <p className="text-muted-foreground text-sm">
          {phase === "ideal" ? t.idealPhaseSubtitle : t.realityPhaseSubtitle}
        </p>
      </div>

      {/* Toggle between ideal and reality (only when reality data available) */}
      {hasRealityData && (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-full w-fit">
          <button
            onClick={() => setPhase("ideal")}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background:
                phase === "ideal" ? "var(--background)" : "transparent",
              color:
                phase === "ideal"
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              boxShadow:
                phase === "ideal" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.toggleIdeal}
          </button>
          <button
            onClick={() => setPhase("reality")}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background:
                phase === "reality" ? "var(--background)" : "transparent",
              color:
                phase === "reality"
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              boxShadow:
                phase === "reality" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.toggleReality}
          </button>
        </div>
      )}

      {/* Focused Path label (reality phase) */}
      {phase === "reality" && hasRealityData && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {t.focusedPath}
          </span>
        </motion.div>
      )}

      {/* Direction cards with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="space-y-4"
        >
          {displayDirections.map((dir, idx) => {
            const impact =
              phase === "reality" ? getImpactCategory(dir) : "unchanged";
            return (
              <motion.div
                key={`${phase}-${dir.title_en}`}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: impact === "weakened" ? 0.6 : 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.05,
                  layout: { duration: 0.3 },
                }}
              >
                {/* Impact badge */}
                {phase === "reality" && impact !== "unchanged" && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    className="mb-2"
                  >
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor:
                          impact === "strengthened" || impact === "new"
                            ? "rgba(34, 197, 94, 0.4)"
                            : "rgba(250, 204, 21, 0.4)",
                        color:
                          impact === "strengthened" || impact === "new"
                            ? "var(--report-impact-positive)"
                            : "var(--report-impact-caution)",
                        background:
                          impact === "strengthened" || impact === "new"
                            ? "rgba(34, 197, 94, 0.08)"
                            : "rgba(250, 204, 21, 0.08)",
                      }}
                    >
                      {impact === "strengthened" &&
                        `✦ ${t.directionStrengthened}`}
                      {impact === "weakened" && t.directionWeakened}
                      {impact === "new" && `✦ ${t.directionNewOpportunity}`}
                    </Badge>
                  </motion.div>
                )}

                <CareerDirectionCard
                  direction={dir}
                  index={idx}
                  totalDirections={displayDirections.length}
                  reportId={reportId}
                  locale={locale}
                  t={t}
                  isFirst={idx === 0}
                  showMarketOutlook
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Show more/less for ideal phase */}
      {phase === "ideal" && idealDirections.length > 5 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllIdeal(!showAllIdeal)}
            className="text-muted-foreground"
          >
            {showAllIdeal ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {t.showLess}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {interpolate(t.showAllDirections, {
                  count: String(idealDirections.length),
                })}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Exploratory directions (3+2 architecture: lighter treatment, algorithm-only) */}
      {careerMatch.exploratoryDirections &&
        careerMatch.exploratoryDirections.length > 0 &&
        phase !== "ideal" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4 pt-4 border-t border-border/40"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground/80">
                {t.exploratoryDirectionsTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.exploratoryDirectionsSubtitle}
              </p>
            </div>
            {careerMatch.exploratoryDirections.map((dir, idx) => (
              <motion.div
                key={`exploratory-${dir.title_en}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
              >
                <CareerDirectionCard
                  direction={dir}
                  index={idx + displayDirections.length}
                  totalDirections={
                    displayDirections.length +
                    careerMatch.exploratoryDirections!.length
                  }
                  reportId={reportId}
                  locale={locale}
                  t={t}
                  showMarketOutlook
                />
              </motion.div>
            ))}
          </motion.div>
        )}

      {/* Exploratory directions (ideal phase — show after main ideal directions) */}
      {careerMatch.exploratoryDirections &&
        careerMatch.exploratoryDirections.length > 0 &&
        phase === "ideal" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-4 pt-4 border-t border-border/40"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground/80">
                {t.exploratoryDirectionsTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.exploratoryDirectionsSubtitle}
              </p>
            </div>
            {careerMatch.exploratoryDirections.map((dir, idx) => (
              <motion.div
                key={`exploratory-ideal-${dir.title_en}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 0.85, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
              >
                <CareerDirectionCard
                  direction={dir}
                  index={idx + displayDirections.length}
                  totalDirections={
                    displayDirections.length +
                    careerMatch.exploratoryDirections!.length
                  }
                  reportId={reportId}
                  locale={locale}
                  t={t}
                  showMarketOutlook
                />
              </motion.div>
            ))}
          </motion.div>
        )}

      {/* Summary */}
      {careerMatch.summary && phase === "ideal" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-6 bg-muted/30 rounded-xl"
        >
          <p className="text-muted-foreground leading-relaxed">
            {careerMatch.summary}
          </p>
        </motion.div>
      )}

      {/* Inline reality CTA (only when no conditions yet) */}
      {phase === "ideal" && !realConditionsProvided && sessionId && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <InlineRealityForm
            sessionId={sessionId}
            locale={locale}
            t={t}
            existingConditions={existingConditions}
            onSuccess={handleRealityConditionsSuccess}
          />
        </motion.div>
      )}
    </div>
  );
}
