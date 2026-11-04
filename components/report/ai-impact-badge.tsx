"use client";

import { Activity, TrendingUp, Zap } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type AiImpactLabel = "low" | "medium" | "high";

interface AiImpactBadgeProps {
  label: AiImpactLabel;
  score?: number | null; // 0-1
  locale: Locale;
  variant?: "compact" | "default" | "detailed";
}

const IMPACT_CONFIG: Record<
  AiImpactLabel,
  {
    icon: typeof Activity;
    colorClass: string;
    bgClass: string;
    label_en: string;
    label_zh: string;
    label_nl: string;
    desc_en: string;
    desc_zh: string;
    desc_nl: string;
  }
> = {
  low: {
    icon: Activity,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-500/8 border-sky-500/20",
    label_en: "Low AI Impact",
    label_zh: "AI影响 低",
    label_nl: "Lage AI-impact",
    desc_en: "Minimal AI penetration in current tasks",
    desc_zh: "当前任务中 AI 渗透率极低",
    desc_nl: "Minimale AI-penetratie in huidige taken",
  },
  medium: {
    icon: TrendingUp,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/8 border-amber-500/20",
    label_en: "Medium AI Impact",
    label_zh: "AI影响 中",
    label_nl: "Gemiddelde AI-impact",
    desc_en: "Growing AI adoption in key tasks",
    desc_zh: "核心任务中 AI 采用率持续增长",
    desc_nl: "Groeiende AI-adoptie in kerntaken",
  },
  high: {
    icon: Zap,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/8 border-rose-500/20",
    label_en: "High AI Impact",
    label_zh: "AI影响 高",
    label_nl: "Hoge AI-impact",
    desc_en: "Significant AI penetration in daily work",
    desc_zh: "日常工作中 AI 渗透率显著",
    desc_nl: "Sterke AI-penetratie in dagelijks werk",
  },
};

function localizeImpact(
  config: (typeof IMPACT_CONFIG)[AiImpactLabel],
  key: "label" | "desc",
  locale: Locale,
): string {
  const localeKey = `${key}_${locale}` as keyof typeof config;
  const enKey = `${key}_en` as keyof typeof config;
  const value = config[localeKey];
  return typeof value === "string" ? value : String(config[enKey]);
}

export function AiImpactBadge({
  label,
  score,
  locale,
  variant = "default",
}: AiImpactBadgeProps) {
  const config = IMPACT_CONFIG[label];
  const Icon = config.icon;
  const text = localizeImpact(config, "label", locale);

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium",
          config.bgClass,
          config.colorClass,
        )}
        aria-label={text}
      >
        <Icon className="h-3 w-3 shrink-0" />
      </span>
    );
  }

  if (variant === "detailed" && score != null) {
    const pct = Math.round(score * 100);
    const desc = localizeImpact(config, "desc", locale);
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border p-2.5",
          config.bgClass,
        )}
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.colorClass)} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", config.colorClass)}>
              {text}
            </span>
            <span className="text-[10px] text-muted-foreground">{pct}%</span>
          </div>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            {desc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.bgClass,
        config.colorClass,
      )}
      aria-label={text}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{text}</span>
      {score != null && (
        <span className="opacity-60">{Math.round(score * 100)}%</span>
      )}
    </span>
  );
}
