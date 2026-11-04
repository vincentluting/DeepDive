// ============================================================
// Quick Dive Explore Mode helpers
//
// Historical immersive sessions may be stored as "narrative".
// These helpers centralize compatibility logic so read paths do not
// drift across pages, exports, and progress calculations.
// ============================================================

export type QuickDiveExploreMode = "classic" | "immersive" | "narrative";
export type QuickDiveExploreModeFilter =
  | QuickDiveExploreMode
  | "all";

export function isImmersiveExploreMode(
  mode: string | null | undefined,
): boolean {
  return mode === "immersive" || mode === "narrative";
}

export function normalizeQuickDiveExploreMode(
  mode: string | null | undefined,
): "classic" | "immersive" {
  return isImmersiveExploreMode(mode) ? "immersive" : "classic";
}

export function getQuickDiveModeAliases(
  mode: QuickDiveExploreModeFilter,
): QuickDiveExploreMode[] {
  switch (mode) {
    case "immersive":
      return ["immersive", "narrative"];
    case "narrative":
      return ["narrative"];
    case "classic":
      return ["classic"];
    case "all":
    default:
      return ["classic", "immersive", "narrative"];
  }
}
