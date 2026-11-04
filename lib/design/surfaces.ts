/**
 * Surface System v2 — semantic domains of the product UI.
 *
 * Every page belongs to one Surface. The Surface determines color palette,
 * typography, material, and motion language.
 *
 * See `.claude/skills/deepdive-design/references/surfaces.md` for the
 * full specification.
 */

export type Surface = "dive" | "revelation" | "sanctuary" | "utility";

export const SURFACES = ["dive", "revelation", "sanctuary", "utility"] as const;

/**
 * Map a pathname to its Surface.
 *
 * Accepts either a locale-prefixed path (`/en/report/xyz`) or a plain path
 * (`/report/xyz`). Returns `"utility"` for unknown paths as a safe default
 * (neutral visual language suits utility pages and unclassified pages alike).
 *
 * Used by layout-level boundaries and for debugging / analytics.
 */
export function getSurfaceForPath(pathname: string): Surface {
  const normalized =
    pathname.replace(/^\/(en|zh|nl|de|fr|es|pt|it|ru|ja|ko)(?=\/|$)/, "") ||
    "/";

  // Dive — immersion & exploration
  if (
    normalized === "/" ||
    normalized.startsWith("/explore") ||
    normalized.startsWith("/quickdive") ||
    normalized.startsWith("/quick-dive") ||
    normalized.startsWith("/deepdive") ||
    normalized.startsWith("/deep-dive") ||
    normalized.startsWith("/immersive") ||
    normalized.startsWith("/immersive-dive")
  ) {
    return "dive";
  }

  // Revelation — editorial reading of self
  if (
    normalized.startsWith("/report") ||
    normalized.startsWith("/result") ||
    normalized.startsWith("/profile") ||
    normalized.startsWith("/profile-reveal") ||
    normalized.startsWith("/archetype") ||
    normalized.startsWith("/share") ||
    normalized.startsWith("/p/")
  ) {
    return "revelation";
  }

  // Sanctuary — warm conversation & reflection
  if (
    normalized.startsWith("/coach") ||
    normalized.startsWith("/coaching") ||
    normalized.startsWith("/chat") ||
    normalized.startsWith("/reflect") ||
    normalized.startsWith("/diary") ||
    normalized.startsWith("/action-hub")
  ) {
    return "sanctuary";
  }

  // Utility — dashboards, settings, auth, explore-hub
  return "utility";
}
