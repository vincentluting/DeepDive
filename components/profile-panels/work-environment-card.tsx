"use client";

import type { PersonalProfileData } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { deriveEnvironmentPreferences } from "./derive-environment-preferences";

interface WorkEnvironmentCardProps {
  profile: PersonalProfileData;
  locale: string;
}

export function WorkEnvironmentCard({
  profile,
  locale,
}: WorkEnvironmentCardProps) {
  const t = getDictionaryClient(locale as Locale).profile;
  const dims = deriveEnvironmentPreferences(profile);

  if (!dims) return null;

  const LABELS: Record<string, { left: string; right: string }> = {
    social: { left: t.envSocialLeft, right: t.envSocialRight },
    structure: { left: t.envStructureLeft, right: t.envStructureRight },
    pace: { left: t.envPaceLeft, right: t.envPaceRight },
    autonomy: { left: t.envAutonomyLeft, right: t.envAutonomyRight },
    motivation: { left: t.envMotivationLeft, right: t.envMotivationRight },
  };

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-rev-ink-soft/80 font-medium uppercase tracking-[0.15em]">
        {t.envTitle}
      </p>
      <p className="text-[10px] text-rev-ink-soft/80 leading-relaxed -mt-2">
        {t.envDesc}
      </p>

      <div className="space-y-3">
        {dims.map((dim) => {
          const label = LABELS[dim.key];
          if (!label) return null;

          return (
            <div key={dim.key} className="space-y-1">
              {/* Pole labels */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-[11px] font-medium ${dim.position < 45 ? "text-rev-ink" : "text-rev-ink-soft/70"}`}
                >
                  {label.left}
                </span>
                <span
                  className={`text-[11px] font-medium ${dim.position > 55 ? "text-rev-ink" : "text-rev-ink-soft/70"}`}
                >
                  {label.right}
                </span>
              </div>

              {/* Position bar */}
              <div className="relative h-1.5 bg-rev-paper border border-rev-rule rounded-full overflow-hidden">
                {/* Center mark */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rev-rule" />
                {/* Position dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-rev-paper transition-all duration-500"
                  style={{
                    left: `calc(${dim.position}% - 5px)`,
                    backgroundColor:
                      dim.strength === "strong"
                        ? "var(--rev-signal-attention)"
                        : dim.strength === "moderate"
                          ? "var(--rev-ink-soft)"
                          : "var(--rev-rule)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-rev-ink-soft/60 italic leading-relaxed">
        {t.envNote}
      </p>
    </div>
  );
}
