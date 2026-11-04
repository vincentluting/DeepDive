// ============================================================
// Narrative completeness predicate — single source of truth
//
// Multiple call sites need to answer "does this PersonalProfile have
// complete LLM identity narratives already?" — the generator step's
// idempotency check, the request-report route's backfill decision,
// and the frontend narrative panel's loading state.
//
// "Complete" means every field that gates the Profile page entrance
// is present. meaningCompassNarrative is intentionally excluded — it
// belongs to a low-traffic chapter (Ch3) and is generated lazily
// when the user actually scrolls there. The MeaningCompass component
// already renders a graceful empty-state when the narrative is absent.
// ============================================================

import type { PersonalProfileData } from "@/lib/types";

export const REQUIRED_NARRATIVE_KEYS = [
  "identitySummary",
  "archetypeNarrative",
  "bigFiveNarrative",
  "valueNarrative",
  "sjtTensionNarrative",
  "crossDimensionNarrative",
  "growthMapInsight",
] as const satisfies readonly (keyof NonNullable<
  PersonalProfileData["narrativeSnapshots"]
>)[];

export function hasCompleteNarratives(
  ns: PersonalProfileData["narrativeSnapshots"] | null | undefined,
): boolean {
  if (!ns) return false;
  return REQUIRED_NARRATIVE_KEYS.every((key) => Boolean(ns[key]?.trim()));
}

/** Backward-compatible name used by existing call sites. */
export const hasRenderableNarratives = hasCompleteNarratives;
