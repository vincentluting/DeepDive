// lib/content/types.ts
// Deep Dive — Archetype Content Type Definitions

import type { RIASECDimension, ValueOrientation } from "../types/dimensions";

/** Bilingual text with optional 9-locale extensions */
export interface MultiLocaleText {
  zh: string;
  en: string;
  nl?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  it?: string;
  ru?: string;
  ja?: string;
  ko?: string;
}

/** Archetype content (12-type: RIASEC × ValueOrientation) */
export interface ArchetypeContent {
  code: string; // "R-enhancement", "I-transcendence", etc.
  primary: RIASECDimension;
  orientation: ValueOrientation;
  label_zh: string;
  label_en: string;
  label_nl?: string;
  label_de?: string;
  label_fr?: string;
  label_es?: string;
  label_pt?: string;
  label_it?: string;
  label_ru?: string;
  label_ja?: string;
  label_ko?: string;
  tagline_zh: string;
  tagline_en: string;
  tagline_nl?: string;
  tagline_de?: string;
  tagline_fr?: string;
  tagline_es?: string;
  tagline_pt?: string;
  tagline_it?: string;
  tagline_ru?: string;
  tagline_ja?: string;
  tagline_ko?: string;
  narrative_zh: string;
  narrative_en: string;
  narrative_nl?: string;
  narrative_de?: string;
  narrative_fr?: string;
  narrative_es?: string;
  narrative_pt?: string;
  narrative_it?: string;
  narrative_ru?: string;
  narrative_ja?: string;
  narrative_ko?: string;
  coreStrengths: Array<MultiLocaleText>;
  growthEdges: Array<MultiLocaleText>;
  collaborationStyle_zh: string;
  collaborationStyle_en: string;
  collaborationStyle_nl?: string;
  collaborationStyle_de?: string;
  collaborationStyle_fr?: string;
  collaborationStyle_es?: string;
  collaborationStyle_pt?: string;
  collaborationStyle_it?: string;
  collaborationStyle_ru?: string;
  collaborationStyle_ja?: string;
  collaborationStyle_ko?: string;
  colorHex: string;
}
