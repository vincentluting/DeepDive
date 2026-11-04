"use client";

import { useEffect, useState } from "react";
import type { RIASECDimension } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import { TerrainLine, type TerrainPoint } from "./editorial/viz";
import { SpectrumBar } from "./editorial/viz";

// RIASEC dimension order mapped to brand names + Revelation-surface archetype hues.
const RIASEC_KEYS: { key: RIASECDimension; brandKey: string; color: string }[] =
  [
    { key: "R", brandKey: "build", color: "var(--archetype-r-rev)" },
    { key: "I", brandKey: "decode", color: "var(--archetype-i-rev)" },
    { key: "A", brandKey: "create", color: "var(--archetype-a-rev)" },
    { key: "S", brandKey: "connect", color: "var(--archetype-s-rev)" },
    { key: "E", brandKey: "drive", color: "var(--archetype-e-rev)" },
    { key: "C", brandKey: "structure", color: "var(--archetype-c-rev)" },
  ];

const DIMENSION_SUBTYPES: Record<string, { en: string; zh: string }> = {
  build: { en: "Hands-on", zh: "动手派" },
  decode: { en: "Analytical", zh: "分析派" },
  create: { en: "Creative", zh: "创作派" },
  connect: { en: "Relational", zh: "关系派" },
  drive: { en: "Driver", zh: "驱动派" },
  structure: { en: "Systematic", zh: "系统派" },
};

/**
 * Standalone skyline chart. Name retained for backward compatibility with
 * dimension-explorer's dynamic import. Output is a TerrainLine, not a radar.
 */
export function RIASECRadarChart({
  scores,
  locale,
}: {
  scores?: Record<RIASECDimension, number>;
  locale: string;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
  }, []);

  const riasecScores = scores ?? { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 };
  const loc = locale as Locale;

  const points: TerrainPoint[] = RIASEC_KEYS.map(({ key, brandKey, color }) => {
    const label = String(t[brandKey as keyof typeof t] ?? brandKey);
    const subtype = DIMENSION_SUBTYPES[brandKey];
    return {
      key,
      label,
      sublabel: subtype ? pickLocaleText(subtype, loc) : undefined,
      value: riasecScores[key] ?? 0,
      color,
    };
  });

  return (
    <TerrainLine
      points={points}
      height={180}
      labelSpace={52}
      halo
      animated={!prefersReducedMotion}
    />
  );
}

/**
 * Ranked horizontal bars — kept for panels that prefer a list over a skyline.
 * Each bar is now a SpectrumBar so the family of visualisations shares a
 * consistent vocabulary.
 */
export function RIASECDimensionBars({
  scores,
  locale,
}: {
  scores?: Record<RIASECDimension, number>;
  locale: string;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  const [animated, setAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq?.matches) {
      setPrefersReducedMotion(true);
      setAnimated(true);
    } else {
      const timer = setTimeout(() => setAnimated(true), 200);
      return () => clearTimeout(timer);
    }
  }, []);

  const riasecScores = scores ?? { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 };
  const loc = locale as Locale;

  const data = RIASEC_KEYS.map(({ key, brandKey, color }) => {
    const subtype = DIMENSION_SUBTYPES[brandKey];
    return {
      dimension: String(t[brandKey as keyof typeof t] ?? brandKey),
      subtype: subtype ? pickLocaleText(subtype, loc) : "",
      value: riasecScores[key] ?? 0,
      brandKey,
      color,
    };
  });

  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const isTop = i < 2;
        return (
          <div key={item.brandKey} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: isTop ? item.color : "var(--rev-ink-soft)",
                opacity: isTop ? 1 : 0.35,
              }}
            />
            <div className="w-16 shrink-0">
              <span
                className={`text-xs font-medium block leading-tight ${
                  isTop ? "text-rev-ink" : "text-rev-ink-soft"
                }`}
              >
                {item.dimension}
              </span>
              <span className="text-[10px] text-rev-ink-soft/80 block leading-tight">
                {item.subtype}
              </span>
            </div>
            <div className="flex-1">
              <SpectrumBar
                value={animated ? item.value : 0}
                color={isTop ? item.color : "var(--rev-ink-soft)"}
                height={6}
                animated={!prefersReducedMotion}
              />
            </div>
            <span
              className={`text-xs font-serif italic w-7 text-right tabular-nums ${
                isTop ? "font-semibold" : "text-rev-ink-soft"
              }`}
              style={isTop ? { color: item.color } : undefined}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
