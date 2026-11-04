"use client";

import type { PersonalProfileData } from "@/lib/types";

type ConfidenceBreakdownEntry = {
  dimension: string;
  confidence: number;
  reasons: { factor: string; impact: number; detail: string }[];
};
import { SCHWARTZ_VALUE_LABELS } from "@/lib/scoring/constants";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import { defaultLocale, isValidLocale } from "@/lib/i18n/config";
import { getTermText } from "@/lib/content/term-glossary";
import { EvidenceCollapsible } from "@/components/report/evidence-popover";
import { LowConfidenceWarning } from "@/components/report/confidence-indicator";
import { Astrolabe, type AstrolabePoint } from "./editorial/viz";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";

/**
 * Canonical Schwartz motivational wheel order (clockwise). Adjacent values are
 * theoretically compatible; opposites (6 slots apart) sit on opposing motives.
 * Using a fixed order means each value keeps its own angle across users, so
 * `security` is always at the same slot and the astrolabe's conflictPair
 * chord meaningfully represents theoretical opposition.
 *
 * Order: self-enhancement → openness → self-transcendence → conservation.
 */
const SCHWARTZ_WHEEL_ORDER = [
  "power",
  "achievement",
  "hedonism",
  "stimulation",
  "self-direction",
  "universalism",
  "benevolence",
  "tradition",
  "conformity",
  "security",
] as const;

interface ValueAnchorsProps {
  profile: PersonalProfileData;
  locale: string;
  confidenceBreakdown?: ConfidenceBreakdownEntry[];
  /** When false, hides LowConfidenceWarning + EvidenceCollapsible (default: true) */
  showConfidenceUI?: boolean;
}

// Ranking medal styles: 1st → 2nd → 3rd
const MEDAL_STYLES = [
  "bg-rev-paper-warm text-rev-signal-info ring-1 ring-primary/20",
  "bg-rev-paper-warm text-rev-ink-soft ring-1 ring-border/30",
  "bg-rev-paper-warm/70 text-rev-ink-soft ring-1 ring-border/20",
] as const;

/**
 * Compute Schwartz higher-order dimensions from raw value scores.
 * Returns x/y position for the four-quadrant value compass.
 *
 * X axis: OTC (right) ↔ CON (left)
 * Y axis: SE (top) ↔ ST (bottom)
 */
function computeValueCompass(scores: Record<string, number>) {
  const mean = (...keys: string[]) => {
    const vals = keys.map((k) => scores[k]).filter((v) => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const otc = mean("self-direction", "stimulation");
  const con = mean("security", "conformity", "tradition");
  const se = mean("achievement", "power", "hedonism");
  const st = mean("benevolence", "universalism");

  // Bipolar axes: positive = right/top
  const xRaw = otc - con; // positive → Open to Change
  const yRaw = se - st; // positive → Self-Enhancement

  // Normalize to 0-100% for positioning (50% = center)
  // Max raw diff on 1-6 scale ≈ ±5, but typical range ±2
  const clamp = (v: number) => Math.max(8, Math.min(92, 50 + v * 20));
  const xPct = clamp(xRaw);
  const yPct = clamp(-yRaw); // CSS top: 0 = top, invert

  // Determine dominant quadrant
  const quadrant =
    xRaw >= 0
      ? yRaw >= 0
        ? "Q1"
        : "Q3" // right: OTC side
      : yRaw >= 0
        ? "Q4"
        : "Q2"; // left: CON side

  // Strength of positioning
  const dist = Math.sqrt(xRaw * xRaw + yRaw * yRaw);
  const strength: "strong" | "moderate" | "weak" =
    dist > 0.8 ? "strong" : dist > 0.4 ? "moderate" : "weak";

  return { xPct, yPct, xRaw, yRaw, quadrant, strength, otc, con, se, st };
}

/**
 * Get polarity narrative from OTC/CON axis.
 */
function getPolarityNarrative(
  xRaw: number,
  strength: "strong" | "moderate" | "weak",
  t: Record<string, string>,
) {
  if (strength === "weak") return t.valuePolarityBalanced;
  return xRaw > 0 ? t.valuePolarityExplore : t.valuePolarityAnchor;
}

export function ValueAnchors({
  profile,
  locale,
  confidenceBreakdown,
  showConfidenceUI = true,
}: ValueAnchorsProps) {
  const loc = isValidLocale(locale) ? locale : defaultLocale;
  const t = getDictionaryClient(loc).profile;
  const { schwartzAnchors } = profile;

  const getValueLabel = (key: string): string => {
    const label =
      SCHWARTZ_VALUE_LABELS[key as keyof typeof SCHWARTZ_VALUE_LABELS];
    if (label) return pickLocaleText(label, loc);
    return key;
  };

  // Resolve conflict pair id to the real Schwartz value keys. Do not split the
  // string: autonomy_conformity maps to self-direction + conformity.
  const conflictPair = schwartzAnchors.conflictPair;
  let conflictValue1: string | undefined;
  let conflictValue2: string | undefined;
  const conflictValues = getSchwartzConflictValues(conflictPair);
  if (conflictValues) {
    [conflictValue1, conflictValue2] = conflictValues;
  }

  // Compute 2D value compass from raw scores
  const hasScores =
    schwartzAnchors.scores && Object.keys(schwartzAnchors.scores).length >= 8;
  const compass = hasScores
    ? computeValueCompass(schwartzAnchors.scores)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-rev-ink-soft/80 font-mono tabular-nums">
          {t.accuracy} {((schwartzAnchors.confidence ?? 0) * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-xs text-rev-ink-soft leading-relaxed">
        {
          getTermText(
            "valueAnchors",
            loc,
          )?.definition
        }
      </p>

      {/* Top-3 value anchors with medal ranking */}
      <div>
        <p className="text-[10px] text-rev-ink-soft/80 font-medium mb-3 uppercase tracking-[0.15em]">
          {t.valueAnchorTop3}
        </p>
        <div className="space-y-3">
          {schwartzAnchors.top3.map((value, index) => (
            <div key={value} className="flex items-center gap-3">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${MEDAL_STYLES[index] || MEDAL_STYLES[2]}`}
              >
                {index + 1}
              </span>
              <span className="text-rev-ink text-sm font-medium">
                {getValueLabel(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Astrolabe — 10 values as a celestial chart, rank = radius.
          Replaces the old proportional bar stack. Reads at a glance: top-3
          ride the outer ring with roman numerals, inner values orbit the
          centre. A detected conflict renders as a dashed chord. */}
      <div className="pt-2">
        <Astrolabe
          /* Points ordered by the canonical Schwartz wheel so each value owns
           * a fixed angular slot. Rank still drives radius via the rank prop.
           * Filter ensures we never emit an unknown key the astrolabe would
           * render at an orphan angle. */
          points={SCHWARTZ_WHEEL_ORDER.filter((k) =>
            schwartzAnchors.ranking.includes(k),
          ).map<AstrolabePoint>((v) => ({
            key: v,
            label: getValueLabel(v),
            rank: schwartzAnchors.ranking.indexOf(v) + 1,
          }))}
          conflictPair={
            conflictValue1 && conflictValue2
              ? { a: conflictValue1, b: conflictValue2 }
              : null
          }
          size={320}
        />
      </div>

      {/* Conflict analysis */}
      <div>
        <p className="text-[10px] text-rev-ink-soft/80 font-medium mb-3 uppercase tracking-[0.15em]">
          {t.valueTensions}
        </p>
        {conflictValue1 && conflictValue2 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3.5 rounded-[4px] bg-rev-paper-warm/80 border border-rev-rule">
              <span className="text-sm text-rev-ink-soft">
                {t.conflictBetween}
                <span className="text-rev-signal-info font-medium">
                  {getValueLabel(conflictValue1)}
                </span>
                {t.and}
                <span className="text-rev-signal-info font-medium">
                  {getValueLabel(conflictValue2)}
                </span>
              </span>
              {schwartzAnchors.conflictStatus && (
                <span
                  className={`ml-auto px-2.5 py-1 sm:px-2 sm:py-0.5 rounded text-xs border shrink-0 ${
                    schwartzAnchors.conflictStatus === "confirmed"
                      ? "text-rev-ink font-medium bg-rev-paper-warm border-rev-rule"
                      : schwartzAnchors.conflictStatus === "resolved"
                        ? "text-rev-ink-soft bg-rev-paper-warm border-rev-rule"
                        : "text-rev-ink-soft bg-rev-paper-warm/70 border-rev-rule"
                  }`}
                >
                  {schwartzAnchors.conflictStatus === "confirmed"
                    ? t.confirmed
                    : schwartzAnchors.conflictStatus === "resolved"
                      ? t.unconfirmed
                      : t.mild}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-rev-ink-soft italic">{t.noConflicts}</p>
        )}
      </div>

      {/* Value Blind Spots: bottom 3 values with drain narratives */}
      {schwartzAnchors.ranking.length >= 6 && (
        <div className="pt-4 border-t border-rev-rule/60">
          <p className="text-[10px] text-rev-ink-soft/80 font-medium mb-1.5 uppercase tracking-[0.15em]">
            {t.valueBlindSpotsTitle}
          </p>
          <p className="text-[10px] text-rev-ink-soft/80 mb-3 leading-relaxed">
            {t.valueBlindSpotsDesc}
          </p>
          <div className="space-y-2">
            {schwartzAnchors.ranking
              .slice(-3)
              .reverse()
              .map((value) => {
                const narrative =
                  t[`valueBlindSpotNarrative_${value}` as keyof typeof t];
                return (
                  <div
                    key={value}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rev-paper-warm/70 border border-rev-rule/60"
                  >
                    <span className="text-rev-signal-info/60 text-[10px] mt-0.5 shrink-0">
                      &#x25CB;
                    </span>
                    <div>
                      <span className="text-xs font-medium text-rev-ink-soft">
                        {getValueLabel(value)}
                      </span>
                      {narrative && (
                        <p className="text-[11px] text-rev-ink-soft/80 leading-relaxed mt-0.5">
                          {narrative}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Value Compass: 2D quadrant chart (OTC↔CON × SE↔ST) */}
      {compass && (
        <div className="pt-4 border-t border-rev-rule/60">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-rev-ink-soft/80 font-medium uppercase tracking-[0.15em]">
              {t.valueQuadrantTitle}
            </p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                compass.strength === "strong"
                  ? "bg-rev-paper-warm text-rev-signal-info"
                  : compass.strength === "moderate"
                    ? "bg-rev-paper-warm text-rev-signal-info"
                    : "bg-rev-paper-warm text-rev-ink-soft"
              }`}
            >
              {compass.strength === "strong"
                ? t.valuePolarityStrong
                : compass.strength === "moderate"
                  ? t.valuePolarityModerate
                  : t.valuePolarityWeak}
            </span>
          </div>

          {/* Quadrant grid */}
          <div className="relative aspect-square w-full max-w-[220px] mx-auto">
            {/* Background quadrants */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px rounded-[4px] overflow-hidden">
              {/* Q3: top-left = OTC+ST (Visionary Idealist) */}
              <div
                className={`flex items-center justify-center p-1.5 ${compass.quadrant === "Q3" ? "bg-rev-paper-warm" : "bg-rev-paper-warm"}`}
              >
                <span
                  className={`text-[9px] text-center leading-tight ${compass.quadrant === "Q3" ? "text-rev-ink font-medium" : "text-rev-ink-soft/70"}`}
                >
                  {t.valueQuadrantQ3}
                </span>
              </div>
              {/* Q2: top-right = CON+ST (Devoted Guardian) */}
              <div
                className={`flex items-center justify-center p-1.5 ${compass.quadrant === "Q2" ? "bg-rev-paper-warm" : "bg-rev-paper-warm"}`}
              >
                <span
                  className={`text-[9px] text-center leading-tight ${compass.quadrant === "Q2" ? "text-rev-ink font-medium" : "text-rev-ink-soft/70"}`}
                >
                  {t.valueQuadrantQ2}
                </span>
              </div>
              {/* Q1: bottom-left = OTC+SE (Autonomous Achiever) */}
              <div
                className={`flex items-center justify-center p-1.5 ${compass.quadrant === "Q1" ? "bg-rev-paper-warm" : "bg-rev-paper-warm"}`}
              >
                <span
                  className={`text-[9px] text-center leading-tight ${compass.quadrant === "Q1" ? "text-rev-ink font-medium" : "text-rev-ink-soft/70"}`}
                >
                  {t.valueQuadrantQ1}
                </span>
              </div>
              {/* Q4: bottom-right = CON+SE (Strategic Builder) */}
              <div
                className={`flex items-center justify-center p-1.5 ${compass.quadrant === "Q4" ? "bg-rev-paper-warm" : "bg-rev-paper-warm"}`}
              >
                <span
                  className={`text-[9px] text-center leading-tight ${compass.quadrant === "Q4" ? "text-rev-ink font-medium" : "text-rev-ink-soft/70"}`}
                >
                  {t.valueQuadrantQ4}
                </span>
              </div>
            </div>

            {/* Axis lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60 z-10" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-border/60 z-10" />

            {/* Axis labels */}
            <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[8px] text-rev-ink-soft/80 font-medium">
              {t.valuePolarityOTC}
            </span>
            <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-rev-ink-soft/80 font-medium text-right">
              {t.valuePolarityCON}
            </span>
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-rev-ink-soft/80 font-medium">
              {t.valuePolarityST}
            </span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-rev-ink-soft/80 font-medium">
              {t.valuePolaritySE}
            </span>

            {/* User position dot — editorial: rev-paper ring, no drop shadow */}
            <div
              className="absolute w-3 h-3 rounded-full bg-rev-glow-cold border-2 border-rev-paper z-20 transition-all duration-700"
              style={{
                left: `calc(${compass.xPct}% - 6px)`,
                top: `calc(${compass.yPct}% - 6px)`,
                boxShadow: "0 0 0 1px var(--rev-rule)",
              }}
            />
          </div>

          {/* Quadrant description + narrative */}
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-rev-ink font-medium text-center">
              {
                t[
                  `valueQuadrantQ${compass.quadrant.slice(1)}` as keyof typeof t
                ]
              }
            </p>
            <p className="text-[10px] text-rev-ink-soft text-center">
              {
                t[
                  `valueQuadrantQ${compass.quadrant.slice(1)}Desc` as keyof typeof t
                ]
              }
            </p>
            <p className="text-[11px] text-rev-ink-soft/80 leading-relaxed mt-2">
              {getPolarityNarrative(compass.xRaw, compass.strength, t)}
            </p>
          </div>
        </div>
      )}

      {/* Low confidence warning + evidence collapsible */}
      {showConfidenceUI && (
        <>
          <LowConfidenceWarning
            confidence={schwartzAnchors.confidence ?? 0}
            locale={loc}
            dimensionLabel={t.valueAnchors}
          />
          <EvidenceCollapsible
            confidence={schwartzAnchors.confidence ?? 0}
            dimensionLabel="values"
            confidenceEntries={confidenceBreakdown}
            locale={loc}
          />
        </>
      )}
    </div>
  );
}
