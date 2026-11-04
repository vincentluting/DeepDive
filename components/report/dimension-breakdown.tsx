"use client";

import type { Locale } from "@/lib/i18n/config";
import { getWeightedMatchFactors } from "@/lib/career-matching/weights";
/** Source question evidence — defined locally, not exported from lib/types */
interface SourceQuestion {
  questionId: string;
  type: string;
  weight: number;
}

interface DimensionBreakdownProps {
  /** Match score breakdown components with percentages */
  matchBreakdown?: {
    interestFit: number;
    valueFit: number;
    personalityFit: number;
    adaptabilityFit: number;
    industryFit?: number;
  };
  /** Source questions per dimension (for expanded view) */
  sourceQuestions?: SourceQuestion[];
  /** Show expanded question-level detail */
  expanded?: boolean;
  locale: Locale;
  t: Record<string, string>;
}

interface DimensionBarData {
  key: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  color: string;
}

function getDimensionColor(key: string): string {
  switch (key) {
    case "interestFit":
      return "bg-blue-500";
    case "valueFit":
      return "bg-emerald-500";
    case "personalityFit":
      return "bg-md-sea";
    case "adaptabilityFit":
      return "bg-amber-500";
    case "industryFit":
      return "bg-cyan-500";
    default:
      return "bg-slate-500";
  }
}

function getDimensionDotColor(key: string): string {
  switch (key) {
    case "interestFit":
      return "bg-blue-400";
    case "valueFit":
      return "bg-emerald-400";
    case "personalityFit":
      return "bg-md-sea-bright";
    case "adaptabilityFit":
      return "bg-amber-400";
    case "industryFit":
      return "bg-cyan-400";
    default:
      return "bg-slate-400";
  }
}

export function DimensionBreakdown({
  matchBreakdown,
  sourceQuestions,
  expanded = false,
  locale: _locale,
  t,
}: DimensionBreakdownProps) {
  if (!matchBreakdown) return null;

  // Weights come from the engine's single source of truth (WEIGHT_PRESETS),
  // so the breakdown can never drift from how the score is actually computed.
  // Only factors that contribute (weight > 0) are shown.
  const breakdownScores = matchBreakdown as Record<string, number | undefined>;
  const dimensions: DimensionBarData[] = getWeightedMatchFactors("full").map(
    (f) => {
      const score = breakdownScores[f.key] ?? 0;
      return {
        key: f.key,
        label: t[f.key] ?? f.key,
        score,
        weight: f.weight,
        contribution: score * f.weight,
        color: getDimensionColor(f.key),
      };
    },
  );

  const weightFormula = dimensions
    .map((d) => `${d.label} ${Math.round(d.weight * 100)}%`)
    .join(" · ");

  const totalContribution = dimensions.reduce(
    (sum, d) => sum + d.contribution,
    0,
  );

  return (
    <div className="space-y-3">
      {/* Stacked horizontal bar (pie chart alternative - better for narrow spaces) */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          {t.matchComposition}
        </p>
        <div className="h-3 rounded-full overflow-hidden flex">
          {dimensions.map((dim) => {
            const widthPct =
              totalContribution > 0
                ? (dim.contribution / totalContribution) * 100
                : 25;
            return (
              <div
                key={dim.key}
                className={`${dim.color} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${widthPct}%` }}
                title={`${dim.label}: ${dim.score}% (${t.weight} ${Math.round(dim.weight * 100)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend + scores */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {dimensions.map((dim) => (
          <div
            key={dim.key}
            className="flex items-center justify-between gap-1"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${getDimensionDotColor(dim.key)}`}
              />
              <span className="text-xs text-muted-foreground truncate">
                {dim.label}
              </span>
            </div>
            <span className="text-xs font-mono text-foreground shrink-0">
              {dim.score}%
            </span>
          </div>
        ))}
      </div>

      {/* Weight explanation */}
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        {(t.weightedFormula ?? "").replace("{{formula}}", weightFormula)}
      </p>

      {/* Expanded: Source questions */}
      {expanded && sourceQuestions && sourceQuestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            {t.sourceQuestions}
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {sourceQuestions.map((sq, i) => (
              <div
                key={`${sq.questionId}-${i}`}
                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30"
              >
                <span className="text-muted-foreground font-mono">
                  {sq.questionId}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{sq.type}</span>
                  <span className="font-medium text-foreground">
                    +{sq.weight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
