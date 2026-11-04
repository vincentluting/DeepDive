"use client";

import { ArrowRight, Compass, Sparkles, Triangle } from "lucide-react";

import { DepthGauge } from "@/components/design/meridian/depth-gauge";
import {
  SpectrumBar,
  TerrainLine,
  type TerrainPoint,
} from "@/components/profile-panels/editorial/viz";
import type { PreviewDictionary } from "../landing-dictionaries";
import { AreaSparkline } from "./landing-viz-mini";
import {
  SAMPLE_HERO_SIGNALS,
  SAMPLE_REALITY_FIT,
  SAMPLE_RIASEC_SCORES,
} from "./landing-viz-samples";

const DIM_ORDER = ["R", "I", "A", "S", "E", "C"] as const;
const GAUGE_DEPTHS = ["0m", "200m", "400m", "600m"] as const;
const SIGNAL_ICONS = [Compass, Triangle, Sparkles] as const;

/**
 * HeroDashboard — the hero's visual protagonist: a glass instrument panel
 * floating over the living ocean. Composes the real product viz (Depth
 * Gauge + RIASEC skyline + spectrum sliders) plus a reality-fit sparkline,
 * all fed from the shared landing sample data. Decorative (aria-hidden);
 * every label is resolved from the preview dictionary.
 */
export function HeroDashboard({ d }: { d: PreviewDictionary }) {
  const entries = DIM_ORDER.map((k, i) => ({
    k,
    label: d.showcase.portrait.dims[i] ?? k,
    value: SAMPLE_RIASEC_SCORES[k],
  }));
  const topKey = entries.reduce((a, b) => (b.value > a.value ? b : a)).k;
  const points: TerrainPoint[] = entries.map((e) => ({
    key: e.k,
    label: e.label,
    value: e.value,
    color: e.k === topKey ? "var(--md-gold-text)" : "var(--md-sea)",
  }));

  const stations = d.showcase.meter.map((label, i) => ({
    depth: GAUGE_DEPTHS[i] ?? "",
    label,
  }));

  return (
    <div className="dd-instrument-panel dd-hero-dashboard" aria-hidden="true">
      <div className="dd-instrument-panel__body dd-hero-dashboard__body">
        <div className="dd-hero-dashboard__gauge">
          <p className="dd-instrument-cap">{d.showcase.railLabel}</p>
          <DepthGauge stations={stations} activeIndex={2} />
        </div>
        <div className="dd-hero-dashboard__main">
          <p className="dd-instrument-cap">{d.glassCard.label}</p>
          <TerrainLine
            points={points}
            height={118}
            labelSpace={32}
            halo
            animated={false}
          />
          <div className="dd-hero-dashboard__sliders">
            {SAMPLE_HERO_SIGNALS.map((s, i) => {
              const Icon = SIGNAL_ICONS[i] ?? Compass;
              return (
                <span key={s.key} className="dd-slider-row">
                  <Icon aria-hidden="true" />
                  <SpectrumBar
                    value={s.value}
                    color="var(--md-sea)"
                    height={5}
                    animated={false}
                  />
                  <ArrowRight aria-hidden="true" />
                </span>
              );
            })}
          </div>
          <AreaSparkline series={SAMPLE_REALITY_FIT} height={42} />
        </div>
      </div>
    </div>
  );
}
