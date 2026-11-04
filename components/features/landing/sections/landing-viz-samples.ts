/**
 * Landing visualization sample data — single source of truth.
 *
 * The landing page embeds REAL product viz components (RIASECRadarChart,
 * SpectrumBar, DepthRing) fed with representative, self-consistent sample
 * data. Numbers + stable keys live here; user-visible labels live in the
 * preview.json dictionary (`instruments` namespace) and are resolved at
 * render time, so this file stays i18n-clean (no display strings).
 *
 * Consistency rule: the fingerprint peaks at Investigative ("Decode") and
 * Social ("Connect"), matching the Tactician-leaning sample profile so the
 * hero map, strengths, and directions all tell one coherent story.
 */
import type { RIASECDimension } from "@/lib/types";

/** Identity fingerprint for the RIASEC skyline (0..100). Decode-led. */
export const SAMPLE_RIASEC_SCORES: Record<RIASECDimension, number> = {
  R: 46,
  I: 84,
  A: 63,
  S: 74,
  E: 52,
  C: 57,
};

/** Hero dashboard "instrument" sliders — three signature signals (0..100). */
export const SAMPLE_HERO_SIGNALS = [
  { key: "identity", value: 84 },
  { key: "values", value: 71 },
  { key: "direction", value: 63 },
] as const;

/** 01 Your Portrait — top strengths (SpectrumBar values, 0..100). */
export const SAMPLE_STRENGTHS = [
  { key: "synthesis", value: 88 },
  { key: "systems", value: 79 },
  { key: "empathy", value: 72 },
  { key: "focus", value: 66 },
] as const;

/** 01 / 03 — Reality-fit & progress sparkline series (0..100, ascending). */
export const SAMPLE_REALITY_FIT = [38, 44, 52, 49, 63, 71, 78, 86] as const;
export const SAMPLE_PROGRESS = [12, 20, 28, 34, 33, 47, 56, 68] as const;

/** 02 Career Report — best-fit directions (SpectrumBar, 0..100). */
export const SAMPLE_DIRECTIONS = [
  { key: "productStrategy", value: 91 },
  { key: "uxResearch", value: 84 },
  { key: "dataScience", value: 78 },
  { key: "systemsDesign", value: 70 },
] as const;

/** 02 Career Report — fit-signal dot matrix: filled dots out of `total`. */
export const SAMPLE_FIT_SIGNALS_TOTAL = 7;
export const SAMPLE_FIT_SIGNALS = [
  { key: "interest", filled: 6 },
  { key: "valuesFit", filled: 5 },
  { key: "personality", filled: 5 },
  { key: "market", filled: 4 },
] as const;

/** 02 Career Report — evidence-note skeleton rows (line widths, %). */
export const SAMPLE_EVIDENCE_ROWS = [92, 78, 85, 64] as const;

/** 03 Action Plan — decision-clarity ring (%). */
export const SAMPLE_DECISION_CLARITY = 72;

/** "Choose your depth" band — journey progress ring (%). */
export const SAMPLE_JOURNEY_PROGRESS = 13;

/** 03 Action Plan — milestone completion (first N of journey.items are "done"). */
export const SAMPLE_MILESTONES_DONE = 2;
