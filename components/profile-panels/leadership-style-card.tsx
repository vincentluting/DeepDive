"use client";

import type { LeadershipStyleResult, LeadershipStyleType } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";

const STYLE_INFO: Record<
  LeadershipStyleType,
  {
    label: { en: string; zh: string };
    phrase: { en: string; zh: string };
    impact: { en: string; zh: string };
    color: string;
  }
> = {
  visionary: {
    label: { en: "Visionary", zh: "愿景型" },
    phrase: { en: '"Come with me."', zh: '"跟我来。"' },
    impact: { en: "Strongly positive", zh: "强烈正面" },
    color: "var(--archetype-a-rev)",
  },
  coaching: {
    label: { en: "Coaching", zh: "教练型" },
    phrase: { en: '"Try this."', zh: '"试试这个。"' },
    impact: { en: "Positive", zh: "正面" },
    color: "var(--archetype-s-rev)",
  },
  affiliative: {
    label: { en: "Affiliative", zh: "亲和型" },
    phrase: { en: '"People come first."', zh: '"人最重要。"' },
    impact: { en: "Positive", zh: "正面" },
    color: "var(--archetype-i-rev)",
  },
  democratic: {
    label: { en: "Democratic", zh: "民主型" },
    phrase: { en: '"What do you think?"', zh: '"你怎么看？"' },
    impact: { en: "Positive", zh: "正面" },
    color: "var(--rev-signal-info)",
  },
  pacesetting: {
    label: { en: "Pacesetting", zh: "标杆型" },
    phrase: { en: '"Do as I do, now."', zh: '"照我的标准来。"' },
    impact: { en: "Can be negative", zh: "可能负面" },
    color: "var(--rev-signal-attention)",
  },
  commanding: {
    label: { en: "Commanding", zh: "指令型" },
    phrase: { en: '"Do what I tell you."', zh: '"照我说的做。"' },
    impact: { en: "Often negative", zh: "常为负面" },
    color: "var(--rev-signal-risk)",
  },
};

interface LeadershipStyleCardProps {
  leadershipStyle: LeadershipStyleResult;
  locale: string;
}

export function LeadershipStyleContent({
  leadershipStyle,
  locale,
}: LeadershipStyleCardProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";

  const sorted = (
    Object.entries(leadershipStyle.scores) as [LeadershipStyleType, number][]
  ).sort((a, b) => b[1] - a[1]);

  const primaryInfo = STYLE_INFO[leadershipStyle.primary];

  return (
    <div className="space-y-4">
      {/* Primary style highlight */}
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{ backgroundColor: `${primaryInfo.color}10` }}
      >
        <div
          className="w-2 h-8 rounded-full"
          style={{ backgroundColor: primaryInfo.color }}
        />
        <div>
          <p className="text-sm font-semibold text-rev-ink">
            {pickLocaleText(primaryInfo.label, loc)}
            {leadershipStyle.secondary && (
              <span className="text-rev-ink-soft font-normal">
                {" + "}
                {pickLocaleText(
                  STYLE_INFO[leadershipStyle.secondary].label,
                  loc,
                )}
              </span>
            )}
          </p>
          <p className="text-xs text-rev-ink-soft italic mt-0.5">
            {pickLocaleText(primaryInfo.phrase, loc)}
          </p>
        </div>
      </div>

      {/* 6-style bar chart */}
      <div className="space-y-2">
        {sorted.map(([style, score]) => {
          const info = STYLE_INFO[style];
          const isPrimary = style === leadershipStyle.primary;
          return (
            <div key={style} className="flex items-center gap-2">
              <span
                className={`text-[10px] w-16 shrink-0 truncate ${isPrimary ? "font-semibold text-rev-ink" : "text-rev-ink-soft/80"}`}
              >
                {pickLocaleText(info.label, loc)}
              </span>
              <div className="flex-1 h-2 rounded-full bg-rev-paper-warm/70 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    backgroundColor: isPrimary ? info.color : `${info.color}40`,
                  }}
                />
              </div>
              <span
                className={`text-[10px] w-7 text-right tabular-nums ${isPrimary ? "font-semibold" : "text-rev-ink-soft/70"}`}
              >
                {score}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-rev-ink-soft/70 leading-relaxed">
        {t.leadershipStyleNote}
      </p>
    </div>
  );
}
