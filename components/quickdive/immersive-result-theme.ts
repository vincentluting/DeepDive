// ============================================================
// Immersive Result Theme — Warm Gold High-Contrast
//
// When exploreMode === "immersive", the result page uses warm
// brown/gold colors with HIGH text contrast for readability.
// Every text value is tuned for "glance and absorb" legibility
// in both light and dark system modes.
//
// Import the helper and apply conditionally in UnifiedExploreResult.
// ============================================================

import { C, T } from "../immersive-explore/data/immersive-tokens";

// ── Background & overlay ──────────────────────────────────────

export const IMMERSIVE_BG = `linear-gradient(180deg, ${C.bgDeep} 0%, ${C.bgWarm} 25%, ${C.bgDeep} 70%, ${C.bgDeepest} 100%)`;

export const IMMERSIVE_CAUSTIC = `radial-gradient(ellipse 60% 40% at 50% 15%, rgba(255, 225, 160, 0.05) 0%, transparent 70%)`;

// ── Card surfaces ─────────────────────────────────────────────

export const IMMERSIVE_CARD = {
  background: C.bgCard,
  border: `1px solid rgba(255, 225, 160, 0.1)`,
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
} as const;

// ── Text colors — HIGH CONTRAST for readability ───────────────

export const IMMERSIVE_TEXT = {
  primary: "rgba(255, 255, 255, 0.95)", // near-white — maximum readability
  secondary: "rgba(255, 255, 255, 0.78)", // white at 78% — clearly readable
  muted: "rgba(255, 255, 255, 0.58)", // white at 58% — visible but subdued
  accent: "rgba(255, 225, 160, 0.95)", // gold — ONLY for decorative labels
  accentMuted: "rgba(255, 225, 160, 0.78)", // gold muted — badges, borders
} as const;

// ── RIASEC dimension colors (warm palette, higher saturation) ─

export const IMMERSIVE_DIM_COLORS: Record<string, string> = {
  R: "#C09070", // warm copper
  I: "#70A0B8", // cool steel
  A: "#D08060", // terracotta
  S: "#80B898", // sage
  E: "#D0A050", // amber
  C: "#A09080", // taupe
};

// ── Chapter room labels (for radar chart) ─────────────────────

export const CHAPTER_ROOM_LABELS: Record<string, Record<string, string>> = {
  R: {
    en: "Machine Room",
    zh: "机械室",
    nl: "Machinekamer",
    de: "Maschinenraum",
    es: "Sala de Máquinas",
    fr: "Salle des Machines",
    it: "Sala Macchine",
    ja: "機械室",
    ko: "기계실",
    pt: "Sala de Máquinas",
    ru: "Машинный зал",
  },
  I: {
    en: "Research Lab",
    zh: "研究空间",
    nl: "Onderzoekslab",
    de: "Forschungslabor",
    es: "Laboratorio",
    fr: "Laboratoire",
    it: "Laboratorio",
    ja: "研究室",
    ko: "연구실",
    pt: "Laboratório",
    ru: "Лаборатория",
  },
  A: {
    en: "Theater",
    zh: "剧场",
    nl: "Theater",
    de: "Theater",
    es: "Teatro",
    fr: "Théâtre",
    it: "Teatro",
    ja: "劇場",
    ko: "극장",
    pt: "Teatro",
    ru: "Театр",
  },
  S: {
    en: "Waiting Room",
    zh: "等候室",
    nl: "Wachtkamer",
    de: "Wartezimmer",
    es: "Sala de Espera",
    fr: "Salle d'Attente",
    it: "Sala d'Attesa",
    ja: "待合室",
    ko: "대기실",
    pt: "Sala de Espera",
    ru: "Зал ожидания",
  },
  E: {
    en: "Negotiation Floor",
    zh: "谈判层",
    nl: "Onderhandelingszaal",
    de: "Verhandlungssaal",
    es: "Sala de Negociación",
    fr: "Salle de Négociation",
    it: "Sala Negoziazioni",
    ja: "交渉フロア",
    ko: "협상실",
    pt: "Sala de Negociação",
    ru: "Зал переговоров",
  },
  C: {
    en: "Archive",
    zh: "档案室",
    nl: "Archief",
    de: "Archiv",
    es: "Archivo",
    fr: "Archives",
    it: "Archivio",
    ja: "アーカイブ",
    ko: "기록실",
    pt: "Arquivo",
    ru: "Архив",
  },
};

// ── Zone 4 CTA (Deep Dive upsell) ────────────────────────────

export const IMMERSIVE_CTA = {
  background: `linear-gradient(135deg, ${C.bgWarm} 0%, ${C.bgDeep} 50%, ${C.bgWarm} 100%)`,
  buttonBg: `linear-gradient(135deg, rgba(180, 140, 80, 0.85) 0%, rgba(200, 160, 90, 0.7) 50%, rgba(180, 140, 80, 0.85) 100%)`,
  buttonShadow:
    "0 4px 20px rgba(180, 140, 80, 0.35), 0 0 40px rgba(255, 225, 160, 0.1)",
  subtitleColor: "rgba(220, 210, 195, 0.72)",
} as const;

// ── Combo insight block ───────────────────────────────────────

export function immersiveComboStyle(_colorHex: string) {
  return {
    background: `linear-gradient(135deg, ${C.bgCard} 0%, ${C.bgDeep} 100%)`,
    borderLeft: "3px solid rgba(255, 225, 160, 0.4)",
  };
}

// ── Animation timing (matches immersive ceremony pacing) ──────

export const IMMERSIVE_ANIM = {
  /** Slower entrance for dramatic pacing */
  enterDuration: T.slow,
  /** Stagger between zones */
  stagger: T.staggerNormal,
  /** Easing curve (matches immersive system) */
  ease: T.ease,
} as const;
