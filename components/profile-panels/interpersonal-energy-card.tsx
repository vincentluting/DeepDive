"use client";

import type { InterpersonalEnergySpectrum } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { PhaseDiagram, SpectrumBar } from "./editorial/viz";

interface InterpersonalEnergyCardProps {
  spectrum: InterpersonalEnergySpectrum;
  locale: string;
}

export function InterpersonalEnergyContent({
  spectrum,
  locale,
}: InterpersonalEnergyCardProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  // Map the four IPC quadrants onto a cartesian NE/SE/SW/NW layout where
  // x = communion (left→right) and y = agency (bottom→top).
  // assured-warm      = high agency + high communion  = NE
  // assured-reserved  = high agency + low communion   = NW
  // unassuming-warm   = low agency + high communion   = SE
  // unassuming-reserved = low agency + low communion  = SW
  const activeQuadrant = (
    {
      "assured-warm": "NE",
      "assured-reserved": "NW",
      "unassuming-warm": "SE",
      "unassuming-reserved": "SW",
    } as const
  )[spectrum.quadrant];

  return (
    <div className="space-y-5">
      <PhaseDiagram
        x={spectrum.communion}
        y={spectrum.agency}
        quadrants={{
          NE: t["ieQuadrant_assured-warm"],
          NW: t["ieQuadrant_assured-reserved"],
          SE: t["ieQuadrant_unassuming-warm"],
          SW: t["ieQuadrant_unassuming-reserved"],
        }}
        axisLabels={{
          x: {
            low: `${t.ieAxisCommunion} ↓`,
            high: `${t.ieAxisCommunion} ↑`,
          },
          y: {
            low: `${t.ieAxisAgency} ↓`,
            high: `${t.ieAxisAgency} ↑`,
          },
        }}
        activeQuadrant={activeQuadrant}
        size={260}
      />

      {/* Quadrant description */}
      <div className="p-3 rounded-lg bg-rev-paper-warm">
        <p className="text-xs font-semibold text-rev-ink mb-1">
          {t[`ieQuadrant_${spectrum.quadrant}` as keyof typeof t]}
        </p>
        <p className="text-[11px] text-rev-ink/75 leading-relaxed">
          {t[`ieQuadrantDesc_${spectrum.quadrant}` as keyof typeof t]}
        </p>
      </div>

      {/* Axis scores */}
      <div className="grid grid-cols-2 gap-3">
        <AxisBar
          label={t.ieAxisAgency}
          desc={t.ieAgencyDesc}
          value={spectrum.agency}
        />
        <AxisBar
          label={t.ieAxisCommunion}
          desc={t.ieCommunionDesc}
          value={spectrum.communion}
        />
      </div>

      {/* Energy mode */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-rev-rule/60">
        <div className="w-1 h-8 rounded-full bg-rev-glow-cold" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rev-ink-soft/80">
            {t.ieEnergyMode}
          </p>
          <p className="text-xs font-semibold text-rev-ink">
            {t[`ieMode_${spectrum.energyMode}` as keyof typeof t]}
          </p>
          <p className="text-[11px] text-rev-ink-soft/80 leading-relaxed">
            {t[`ieModeDesc_${spectrum.energyMode}` as keyof typeof t]}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-rev-ink-soft/70 leading-relaxed">
        {t.interpersonalEnergyNote}
      </p>
    </div>
  );
}

function AxisBar({
  label,
  desc,
  value,
}: {
  label: string;
  desc: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium text-rev-ink/90">{label}</span>
        <span className="text-[10px] font-serif italic text-rev-ink-soft/80">
          {value}
        </span>
      </div>
      <SpectrumBar value={value} height={5} />
      <p className="text-[9px] text-rev-ink-soft/60">{desc}</p>
    </div>
  );
}
