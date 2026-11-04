"use client";

import type {
  CognitiveStyleDimensionInfo,
  CognitiveStyleDisplayMode,
} from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import { SpectrumBar } from "./editorial/viz";

interface CognitiveStyleBreakdownProps {
  code: string | null;
  displayMode: CognitiveStyleDisplayMode;
  dimensions: Record<"EI" | "SN" | "TF" | "JP", CognitiveStyleDimensionInfo>;
  confidence: number;
  locale: string;
}

type CognitiveStyleAxis = "EI" | "SN" | "TF" | "JP";

const AXIS_ORDER: CognitiveStyleAxis[] = ["EI", "SN", "TF", "JP"];

const AXIS_LABELS: Record<
  CognitiveStyleAxis,
  { left: { en: string; zh: string }; right: { en: string; zh: string } }
> = {
  EI: {
    left: { en: "Extraversion", zh: "外向" },
    right: { en: "Introversion", zh: "内向" },
  },
  SN: {
    left: { en: "Sensing", zh: "实感" },
    right: { en: "Intuition", zh: "直觉" },
  },
  TF: {
    left: { en: "Thinking", zh: "思考" },
    right: { en: "Feeling", zh: "情感" },
  },
  JP: {
    left: { en: "Judging", zh: "判断" },
    right: { en: "Perceiving", zh: "感知" },
  },
};

// Axis colors (left side accent) — map to Revelation archetype-rev depth hues
const AXIS_COLORS: Record<CognitiveStyleAxis, string> = {
  EI: "var(--archetype-r-rev)", // deep amber
  SN: "var(--archetype-s-rev)", // deep seagrass
  TF: "var(--archetype-e-rev)", // deep coral
  JP: "var(--archetype-i-rev)", // deep phosphor
};

// Hint i18n key map per axis and direction
const AXIS_HINT_KEYS: Record<
  CognitiveStyleAxis,
  { left: string; right: string }
> = {
  EI: { left: "cogHintEI_E", right: "cogHintEI_I" },
  SN: { left: "cogHintSN_S", right: "cogHintSN_N" },
  TF: { left: "cogHintTF_T", right: "cogHintTF_F" },
  JP: { left: "cogHintJP_J", right: "cogHintJP_P" },
};

/**
 * Compute preference strength from a score (0-100, midpoint 50).
 * Returns: label key + numeric strength percentage.
 */
function getPreferenceStrength(
  score: number,
  isNearMidpoint: boolean,
  t: Record<string, string>,
): { label: string; strength: number; className: string } {
  const strength = Math.abs(score - 50);
  if (isNearMidpoint || strength < 8) {
    return {
      label: t.cogPrefBalanced,
      strength,
      className: "text-rev-ink-soft/80",
    };
  }
  if (strength < 15) {
    return { label: t.cogPrefSlight, strength, className: "text-rev-ink-soft" };
  }
  if (strength < 25) {
    return {
      label: t.cogPrefModerate,
      strength,
      className: "text-rev-ink-soft",
    };
  }
  return { label: t.cogPrefClear, strength, className: "text-rev-ink" };
}

export function CognitiveStyleBreakdown({
  code,
  displayMode,
  dimensions,
  confidence,
  locale,
}: CognitiveStyleBreakdownProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";

  return (
    <div className="space-y-5">
      {/* Code display */}
      <div className="flex items-center gap-3">
        {code && displayMode === "normal" ? (
          <div className="flex gap-1">
            {code.split("").map((letter, i) => {
              const axis = AXIS_ORDER[i];
              const dim = dimensions[axis];
              return (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${
                    dim.isNearMidpoint
                      ? "bg-rev-paper-warm text-rev-ink-soft border border-dashed border-rev-rule"
                      : "bg-rev-paper-warm text-rev-signal-info border border-rev-rule"
                  }`}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-rev-ink-soft italic">
            {t.balancedCognitiveDesc}
          </span>
        )}
      </div>

      {/* 4-axis breakdown */}
      <div className="space-y-4">
        {AXIS_ORDER.map((axis) => {
          const dim = dimensions[axis];
          const labels = AXIS_LABELS[axis];
          const color = AXIS_COLORS[axis];
          const hintKeys = AXIS_HINT_KEYS[axis];
          // Score represents preference toward left pole (E, S, T, J)
          // 0 = fully right, 50 = midpoint, 100 = fully left
          const leftPct = dim.score;
          const rightPct = 100 - dim.score;
          const isBalanced = dim.isNearMidpoint;
          const pref = getPreferenceStrength(dim.score, isBalanced, t);

          // Determine hint text
          const hintKey = isBalanced
            ? "cogHintBalanced"
            : leftPct >= 50
              ? hintKeys.left
              : hintKeys.right;
          const hintText = t[hintKey as keyof typeof t] ?? "";

          return (
            <div key={axis} className="space-y-1">
              {/* Axis labels with strength indicator */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${leftPct >= 50 && !isBalanced ? "text-rev-ink" : "text-rev-ink-soft"}`}
                >
                  {pickLocaleText(labels.left, loc)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${pref.className}`}>
                    {pref.label}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-rev-ink-soft/70 w-6 text-right">
                    {pref.strength > 0 ? `${pref.strength}` : "—"}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium ${rightPct > 50 && !isBalanced ? "text-rev-ink" : "text-rev-ink-soft"}`}
                >
                  {pickLocaleText(labels.right, loc)}
                </span>
              </div>

              {/* Bidirectional spectrum — fills from centre towards the dominant pole.
                  We invert dim.score (which counts toward the LEFT pole) so
                  SpectrumBar's right-positive convention still renders on the
                  correct side. */}
              <SpectrumBar
                value={100 - dim.score}
                bidirectional
                centerTick
                height={7}
                color={isBalanced ? "var(--rev-ink-soft)" : color}
              />

              {/* Axis hint — contextual interpretation */}
              <p className="text-[11px] text-rev-ink-soft/80 leading-relaxed">
                {hintText}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-rev-rule">
        <span className="text-[11px] text-rev-ink-soft/80 font-mono tabular-nums">
          {t.accuracy} {(confidence * 100).toFixed(0)}%
        </span>
        <span className="text-[10px] text-rev-ink-soft/80">
          {t.indirectlyDerivedFull}
        </span>
      </div>
    </div>
  );
}
