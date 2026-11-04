"use client";

import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { RESEARCH_TARGET_N } from "@/lib/research/config";
import { useAdminQuery } from "@/lib/hooks/use-admin-query";
import { LoadingSkeleton } from "@/components/admin/shared/states";
import type {
  ParticipantProgress,
  ResearchProgressSummary,
} from "@/lib/db/research-progress";

export interface RecruitmentStageCounts {
  consented: number;
  t0: number;
  quickDive: number;
  deepDive: number;
  report: number;
  coaching: number;
  t1: number;
  t2: number;
}

interface ProgressResponse {
  participants: ParticipantProgress[];
  summary: ResearchProgressSummary;
}

function computeStages(
  participants: ParticipantProgress[],
): RecruitmentStageCounts {
  return {
    consented: participants.length,
    t0: participants.filter((p) => p.preTest?.completed).length,
    quickDive: participants.filter((p) => p.quickDive?.completed).length,
    deepDive: participants.filter((p) => p.deepDive?.completed).length,
    report: participants.filter((p) => p.report?.generated).length,
    coaching: participants.filter((p) => p.coaching?.started).length,
    t1: participants.filter((p) => p.postImmediate?.completed).length,
    t2: participants.filter((p) => p.post1Week?.completed).length,
  };
}

/**
 * Thesis recruitment funnel: consent → T0 → QD → DD → report →
 * coaching → T1 → T2, with target progress bar and group balance.
 * Self-fetching from the research-progress API (canonical population).
 */
export function RecruitmentFunnelCard({ locale }: { locale: Locale }) {
  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const t = (dict.recruitFunnel || {}) as Record<string, string>;

  const { data, loading } = useAdminQuery<ProgressResponse>(
    "/api/admin/research-progress",
    { component: "RecruitmentFunnelCard" },
  );

  if (loading || !data) {
    return <LoadingSkeleton height="h-64" />;
  }

  const stages = computeStages(data.participants);
  const summary = data.summary;

  const stageDefs: { key: keyof RecruitmentStageCounts; label: string }[] = [
    { key: "consented", label: t.stageConsented || "Consented" },
    { key: "t0", label: t.stageT0 || "T0" },
    { key: "quickDive", label: t.stageQuickDive || "Quick Dive" },
    { key: "deepDive", label: t.stageDeepDive || "Deep Dive" },
    { key: "report", label: t.stageReport || "Report" },
    { key: "coaching", label: t.stageCoaching || "Coaching" },
    { key: "t1", label: t.stageT1 || "T1" },
    { key: "t2", label: t.stageT2 || "T2" },
  ];

  const max = Math.max(stages.consented, 1);
  const targetPct = Math.min(
    100,
    Math.round((stages.consented / RESEARCH_TARGET_N) * 100),
  );

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header + target progress */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {t.title || "Recruitment Funnel"}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {interpolate(t.consentedOfTarget || "{n} / {target} consented", {
              n: String(stages.consented),
              target: String(RESEARCH_TARGET_N),
            })}
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-muted/50 overflow-hidden"
          role="progressbar"
          aria-valuenow={stages.consented}
          aria-valuemin={0}
          aria-valuemax={RESEARCH_TARGET_N}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${targetPct}%` }}
          />
        </div>

        {/* Stage bars */}
        <div className="space-y-1.5 pt-1">
          {stageDefs.map(({ key, label }) => {
            const value = stages[key];
            const pct = Math.round((value / max) * 100);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/30 rounded"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-8 text-right">
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Group balance + reminders */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>
            {t.groupBalance || "Group balance"}:{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              Classic {summary.classicCount}
            </span>
            {" · "}
            <span className="font-medium text-violet-600 dark:text-violet-400">
              Immersive {summary.immersiveCount}
            </span>
          </span>
          {summary.needsReminder > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {interpolate(t.needsReminder || "{n} need reminder", {
                n: String(summary.needsReminder),
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
