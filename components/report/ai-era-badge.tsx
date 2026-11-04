"use client";

import type { Locale } from "@/lib/i18n/config";
import { Cpu, Shield, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiEraCategory } from "@/lib/types/report";

interface AiEraBadgeProps {
  category: AiEraCategory;
  locale: Locale;
  variant?: "compact" | "default";
}

const CATEGORY_CONFIG: Record<
  AiEraCategory,
  {
    icon: typeof Cpu;
    colorClass: string;
    bgClass: string;
    label_en: string;
    label_zh: string;
  }
> = {
  stable: {
    icon: Shield,
    colorClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-500/8 border-sky-500/20",
    label_en: "AI-Stable",
    label_zh: "AI稳定型",
  },
  augmented: {
    icon: Cpu,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/8 border-emerald-500/20",
    label_en: "AI-Augmented",
    label_zh: "AI增强型",
  },
  transformed: {
    icon: RefreshCw,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/8 border-amber-500/20",
    label_en: "AI-Transformed",
    label_zh: "AI转型中",
  },
  "ai-native": {
    icon: Sparkles,
    colorClass: "text-md-gold-text",
    bgClass: "bg-md-gold/10 border-md-gold/30",
    label_en: "AI-Native",
    label_zh: "AI原生型",
  },
};

export function AiEraBadge({
  category,
  locale,
  variant = "default",
}: AiEraBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const label = locale === "zh" ? config.label_zh : config.label_en;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.bgClass,
        config.colorClass,
        variant === "compact" && "px-1.5",
      )}
      aria-label={label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {variant !== "compact" && <span>{label}</span>}
    </span>
  );
}
