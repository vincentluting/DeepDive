"use client";

import type { SocialStyleResult } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";

const STYLE_INFO: Record<
  SocialStyleResult["style"],
  {
    label: { en: string; zh: string };
  }
> = {
  analytical: { label: { en: "Analytical", zh: "分析型" } },
  driver: { label: { en: "Driver", zh: "驱动型" } },
  amiable: { label: { en: "Amiable", zh: "亲和型" } },
  expressive: { label: { en: "Expressive", zh: "表达型" } },
};

interface SocialStyleCardProps {
  socialStyle: SocialStyleResult;
  locale: string;
}

export function SocialStyleContent({
  socialStyle,
  locale,
}: SocialStyleCardProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";
  const e = socialStyle.extraversionScore;
  const a = socialStyle.agreeablenessScore;

  return (
    <div className="space-y-4">
      {/* 2×2 Grid with position indicator */}
      <div className="relative aspect-square max-w-[220px] mx-auto">
        {/* Grid background */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-[4px] overflow-hidden border border-rev-rule">
          <QuadrantCell
            style="analytical"
            active={socialStyle.style === "analytical"}
            loc={loc}
          />
          <QuadrantCell
            style="driver"
            active={socialStyle.style === "driver"}
            loc={loc}
          />
          <QuadrantCell
            style="amiable"
            active={socialStyle.style === "amiable"}
            loc={loc}
          />
          <QuadrantCell
            style="expressive"
            active={socialStyle.style === "expressive"}
            loc={loc}
          />
        </div>

        {/* Position dot */}
        <div
          className="absolute w-3 h-3 rounded-full bg-rev-paper-warm border-2 border-white shadow-md z-10 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${e}%`,
            top: `${100 - a}%`,
          }}
        />

        {/* Axis labels */}
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full text-[8px] text-rev-ink-soft/60 uppercase tracking-wider">
          {t.socialStyleAxisAsk}
        </span>
        <span className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full text-[8px] text-rev-ink-soft/60 uppercase tracking-wider">
          {t.socialStyleAxisTell}
        </span>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[8px] text-rev-ink-soft/60 uppercase tracking-wider">
          {t.socialStyleAxisTask}
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-[8px] text-rev-ink-soft/60 uppercase tracking-wider">
          {t.socialStyleAxisPeople}
        </span>
      </div>

      {/* Communication tip */}
      <div className="p-3 rounded-lg bg-rev-paper-warm">
        <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-rev-ink-soft/80 mb-1.5">
          {t.socialStyleCommTip}
        </p>
        <p className="text-xs text-rev-ink/90 leading-relaxed">
          {pickLocaleText(socialStyle.commTip, loc)}
        </p>
      </div>

      <p className="text-[11px] text-rev-ink-soft/70 leading-relaxed">
        {t.socialStyleNote}
      </p>
    </div>
  );
}

function QuadrantCell({
  style,
  active,
  loc,
}: {
  style: SocialStyleResult["style"];
  active: boolean;
  loc: "en" | "zh";
}) {
  const info = STYLE_INFO[style];
  return (
    <div
      className={`flex items-center justify-center p-2 transition-colors ${
        active ? "bg-rev-paper-warm" : "bg-rev-paper-warm/5"
      }`}
    >
      <span
        className={`text-[10px] font-medium ${
          active ? "text-rev-ink" : "text-rev-ink-soft/50"
        }`}
      >
        {pickLocaleText(info.label, loc)}
      </span>
    </div>
  );
}
