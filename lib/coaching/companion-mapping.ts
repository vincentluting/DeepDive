// ============================================================
// RIASEC ↔ Immersive Dive Companion mapping
// ============================================================
// Maps each RIASEC dimension to its narrative companion from the
// Immersive Dive Round Zero ensemble (see components/immersive-explore/data/characters.ts).
// Used by the report page (portrait reveal) and coach system prompt
// to surface continuity between the assessment journey and the report.
//
// Hex colors below mirror chapters-config.ts accentColor (the Immersive Dive
// chapter palette, which is the visual identity the user actually saw). Kept
// inline to keep this module self-contained and consumable from server code.
// ============================================================
/* eslint-disable local/no-hardcoded-brand-colors */

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export interface CompanionMeta {
  /** Stable id matching characters.ts */
  id: string;
  /** Editorial portrait at /public/immersive/characters/{id}.webp */
  portraitUrl: string;
  /** Internal trait label (English, used in LLM prompt — never user-facing) */
  trait: string;
  /** Accent hex (matches Dive surface accent color) */
  accentColor: string;
}

export const COMPANION_BY_RIASEC: Record<RiasecLetter, CompanionMeta> = {
  R: {
    id: "marcus",
    portraitUrl: "/immersive/characters/marcus.webp",
    trait: "Realistic",
    accentColor: "#8B6040",
  },
  I: {
    id: "mia",
    portraitUrl: "/immersive/characters/mia.webp",
    trait: "Investigative",
    accentColor: "#42C6FF",
  },
  A: {
    id: "kai",
    portraitUrl: "/immersive/characters/kai.webp",
    trait: "Artistic",
    accentColor: "#B47DE0",
  },
  S: {
    id: "leila",
    portraitUrl: "/immersive/characters/leila.webp",
    trait: "Social",
    accentColor: "#4ECDC4",
  },
  E: {
    id: "adrian",
    portraitUrl: "/immersive/characters/adrian.webp",
    trait: "Enterprising",
    accentColor: "#FF8B6B",
  },
  C: {
    id: "nora",
    portraitUrl: "/immersive/characters/nora.webp",
    trait: "Conventional",
    accentColor: "#A8C5D0",
  },
};

/**
 * Resolve the dominant companion from an archetypeCode like "RIA", "SEC".
 * Returns null when the input cannot be parsed (defensive — caller decides fallback).
 */
export function resolveDominantCompanion(
  archetypeCode: string | null | undefined,
): CompanionMeta | null {
  if (!archetypeCode || archetypeCode.length === 0) return null;
  const head = archetypeCode.charAt(0).toUpperCase() as RiasecLetter;
  return COMPANION_BY_RIASEC[head] ?? null;
}
