"use client";

import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface QualityMetricsProps {
  meta: {
    totalTimeMs: number;
    rushCount: number;
    hesitationCount: number;
    totalQuestions: number;
    answeredQuestions: number;
  };
  locale: string;
}

function formatDuration(ms: number, t: Record<string, string>): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return interpolate(t.qmSeconds, { seconds });
  return interpolate(t.qmMinSec, { minutes, seconds });
}

function getResponseStyle(
  rushCount: number,
  hesitationCount: number,
  total: number,
  t: Record<string, string>,
): { label: string; description: string } {
  const rushRatio = rushCount / total;
  const hesitationRatio = hesitationCount / total;

  if (rushRatio > 0.25) {
    return {
      label: t.qmResponseStyleIntuitive,
      description: t.qmIntuitiveDesc,
    };
  }
  if (hesitationRatio > 0.25) {
    return {
      label: t.qmResponseStyleDeliberate,
      description: t.qmDeliberateDesc,
    };
  }
  return {
    label: t.qmResponseStyleBalanced,
    description: t.qmBalancedDesc,
  };
}

export function QualityMetrics({ meta, locale }: QualityMetricsProps) {
  const t = getDictionaryClient(locale as Locale).profile;
  const style = getResponseStyle(
    meta.rushCount,
    meta.hesitationCount,
    meta.totalQuestions,
    t,
  );

  const stats: { label: string; value: string }[] = [
    {
      label: t.qmDuration,
      value: formatDuration(meta.totalTimeMs, t),
    },
    {
      label: t.qmCompletion,
      value: `${meta.answeredQuestions}/${meta.totalQuestions}`,
    },
    {
      label: t.qmQuickAnswers,
      value: `${meta.rushCount}`,
    },
    {
      label: t.qmDeliberated,
      value: `${meta.hesitationCount}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Response style badge */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1.5 rounded-[2px] text-xs font-semibold bg-rev-paper border border-rev-glow-cold/35 text-rev-signal-info tracking-[0.02em]">
          {style.label}
        </span>
        <p className="text-sm text-rev-ink-soft leading-relaxed flex-1">
          {style.description}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-3 rounded-[2px] bg-rev-paper-warm border border-rev-rule"
          >
            <p className="text-base font-semibold text-rev-ink font-mono tabular-nums">
              {stat.value}
            </p>
            <p className="text-[10px] text-rev-ink-soft/70 mt-0.5 uppercase tracking-[0.08em]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
