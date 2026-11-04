"use client";

import type { ConflictHandlingProfile, ConflictMode } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import {
  CompassRose,
  SpectrumBar,
  type CompassDirection,
} from "./editorial/viz";

interface ConflictHandlingCardProps {
  profile: ConflictHandlingProfile;
  locale: string;
}

const MODE_COLORS: Record<ConflictMode, string> = {
  competing: "var(--rev-signal-risk)",
  collaborating: "var(--rev-signal-positive)",
  compromising: "var(--rev-signal-attention)",
  avoiding: "var(--archetype-i-rev)",
  accommodating: "var(--rev-signal-info)",
};

/** TKI grid positions: [assertiveness tier, cooperativeness tier] — reserved for future grid visualization */
const _MODE_GRID_POS: Record<ConflictMode, { row: number; col: number }> = {
  competing: { row: 0, col: 2 }, // high assert, low coop
  collaborating: { row: 0, col: 0 }, // high assert, high coop
  compromising: { row: 1, col: 1 }, // mid, mid
  avoiding: { row: 2, col: 2 }, // low assert, low coop
  accommodating: { row: 2, col: 0 }, // low assert, high coop
};
void _MODE_GRID_POS;

const MODES: ConflictMode[] = [
  "collaborating",
  "competing",
  "compromising",
  "accommodating",
  "avoiding",
];

// Map TKI conflict modes onto compass directions:
//   Competing      → N   (high assert, low coop)
//   Collaborating  → E   (high assert, high coop)
//   Accommodating  → S   (low assert, high coop)
//   Avoiding       → W   (low assert, low coop)
//   Compromising   → C   (middle — origin)
const MODE_TO_DIRECTION: Record<ConflictMode, CompassDirection> = {
  competing: "N",
  collaborating: "E",
  accommodating: "S",
  avoiding: "W",
  compromising: "C",
};

export function ConflictHandlingContent({
  profile,
  locale,
}: ConflictHandlingCardProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const dominantColor = MODE_COLORS[profile.dominant];

  // Sort modes by score
  const sortedModes = [...MODES].sort(
    (a, b) => profile.modeScores[b] - profile.modeScores[a],
  );

  const compassLabels: Record<CompassDirection, string> = {
    N: String(t.chMode_competing),
    E: String(t.chMode_collaborating),
    S: String(t.chMode_accommodating),
    W: String(t.chMode_avoiding),
    C: String(t.chMode_compromising),
  };

  return (
    <div className="space-y-6">
      {/* Compass rose — gold needle = primary mode, silver = secondary */}
      <CompassRose
        primary={MODE_TO_DIRECTION[profile.dominant]}
        secondary={
          profile.secondary ? MODE_TO_DIRECTION[profile.secondary] : null
        }
        labels={compassLabels}
        size={260}
      />

      {/* Dominant mode narrative */}
      <div
        className="p-3 rounded-[4px]"
        style={{ backgroundColor: `${dominantColor}10` }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-2 h-5 rounded-full"
            style={{ backgroundColor: dominantColor }}
          />
          <p className="text-xs font-semibold text-rev-ink">
            {t[`chMode_${profile.dominant}` as keyof typeof t]}
            {profile.secondary && (
              <span className="text-rev-ink-soft/80 font-normal">
                {" + "}
                {t[`chMode_${profile.secondary}` as keyof typeof t]}
              </span>
            )}
          </p>
        </div>
        <p className="text-[11px] text-rev-ink/75 leading-relaxed pl-4">
          {t[`chModeDesc_${profile.dominant}` as keyof typeof t]}
        </p>
      </div>

      {/* Two-axis scores */}
      <div className="grid grid-cols-2 gap-3">
        <AxisBar
          label={t.chAxisAssert}
          desc={t.chAssertDesc}
          value={profile.assertiveness}
          color="var(--archetype-a-rev)"
        />
        <AxisBar
          label={t.chAxisCoop}
          desc={t.chCoopDesc}
          value={profile.cooperativeness}
          color="var(--rev-signal-positive)"
        />
      </div>

      {/* Five mode spectrum stack */}
      <div className="space-y-2">
        {sortedModes.map((mode) => {
          const score = profile.modeScores[mode];
          const color = MODE_COLORS[mode];
          const isDominant = mode === profile.dominant;
          const isSecondary = mode === profile.secondary;
          const opacity = isDominant ? 1 : isSecondary ? 0.8 : 0.45;
          return (
            <div key={mode} className="flex items-center gap-2">
              <span
                className={`w-16 text-right text-[10px] shrink-0 ${
                  isDominant
                    ? "font-semibold text-rev-ink"
                    : isSecondary
                      ? "font-medium text-rev-ink/90"
                      : "text-rev-ink-soft/80"
                }`}
              >
                {t[`chMode_${mode}` as keyof typeof t]}
              </span>
              <div className="flex-1" style={{ opacity }}>
                <SpectrumBar value={score} color={color} height={6} />
              </div>
              <span className="w-7 text-right text-[10px] font-serif italic text-rev-ink-soft/70">
                {score}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-rev-ink-soft/70 leading-relaxed">
        {t.conflictHandlingNote}
      </p>
    </div>
  );
}

function AxisBar({
  label,
  desc,
  value,
  color,
}: {
  label: string;
  desc: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium text-rev-ink/90">{label}</span>
        <span className="text-[10px] font-mono text-rev-ink-soft/70">
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-rev-paper-warm overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color, opacity: 0.7 }}
        />
      </div>
      <p className="text-[9px] text-rev-ink-soft/60">{desc}</p>
    </div>
  );
}
