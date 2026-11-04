import type { PersonalProfileData } from "@/lib/types";

export interface EnvDimension {
  key: string;
  /** 0 = full left pole, 100 = full right pole, 50 = balanced */
  position: number;
  strength: "strong" | "moderate" | "slight";
}

// ── Configuration types ─────────────────────────────────────────

interface FacetTerm {
  /** facet key as produced by `scoreIPIP60()` (matches IPIP_60_FACET_ITEM_MAP exactly) */
  key: string;
  /** if true, this facet's contribution is `100 - norm(value)` instead of `norm(value)` */
  reverse?: boolean;
}

interface SchwartzPole {
  /** primary Schwartz value name (1-6 scale) */
  primary: string;
  /** optional secondary; averaged with primary */
  secondary?: string;
}

interface SchwartzBlend {
  /** Schwartz value(s) where higher score pulls position toward LEFT pole */
  left: SchwartzPole;
  /** Schwartz value(s) where higher score pulls position toward RIGHT pole */
  right: SchwartzPole;
  /** 0..1 — fraction of final position contributed by Schwartz vs facets */
  weight: number;
}

interface DimensionConfig {
  key: "social" | "structure" | "pace" | "autonomy" | "motivation";
  /** averaged facet contributions form the primary signal */
  facets: readonly FacetTerm[];
  /**
   * If true: high primary signal → 0 (left pole)
   * If false: high primary signal → 100 (right pole)
   */
  invertForLeftPole: boolean;
  /** optional Schwartz blend */
  schwartz?: SchwartzBlend;
}

// ── Dimension definitions (single source of truth) ──────────────
//
// Each row maps a work-environment dimension (left ↔ right slider)
// to its IPIP-60 facet inputs and optional Schwartz blend.
//
// EDITING an existing dimension's formula → change ONE row here;
// REQUIRED_WENV_FACETS + the input guard + the e2e fixture test
// pick it up automatically.
//
// ADDING a brand-new dimension also requires:
//   - extending the `key` union below
//   - adding labels to LABELS in work-environment-card.tsx
//   - new i18n keys in profile.json (en/zh + 9 other locales)
//   - matching test cases in __tests__/work-environment-card.test.ts

const WORK_ENV_DIMENSIONS: readonly DimensionConfig[] = [
  // 1. Solo Focus ↔ Social Energy (独立专注 ↔ 社交充能)
  //    E1 + E2 measure preference for being with others.
  //    N4 reversed: high social anxiety pulls toward solo (left).
  //    Caveat: N4 measures social *resistance* (anxiety/intimidation),
  //    not social preference. UI copy must not equate high N4 with
  //    "doesn't want to socialize" — interpret as friction, not desire.
  {
    key: "social",
    facets: [
      { key: "E1_Friendliness" },
      { key: "E2_Gregariousness" },
      { key: "N4_Self-Consciousness", reverse: true },
    ],
    invertForLeftPole: false,
  },
  // 2. Clear Structure ↔ Flexible Flow (清晰架构 ↔ 弹性自由)
  //    High C2 + C3 = wants order + duty → structure (left)
  {
    key: "structure",
    facets: [{ key: "C2_Orderliness" }, { key: "C3_Dutifulness" }],
    invertForLeftPole: true,
  },
  // 3. Dynamic Change ↔ Steady Rhythm (动态变化 ↔ 稳定节奏)
  //    High O4 + E5 = wants novelty/excitement → dynamic (left)
  //    Schwartz: stimulation pulls left, security pulls right.
  {
    key: "pace",
    facets: [{ key: "O4_Adventurousness" }, { key: "E5_Excitement-Seeking" }],
    invertForLeftPole: true,
    schwartz: {
      left: { primary: "stimulation" },
      right: { primary: "security" },
      weight: 0.2,
    },
  },
  // 4. Self-Directed ↔ Team-Guided (自主决策 ↔ 团队协同)
  //    E3 (assertiveness/take-charge) + C5 (self-discipline, doesn't
  //    need external push) → autonomy (left).
  //    Schwartz: self-direction pulls left, conformity pulls right.
  //    Caveat: C5 captures "self-managed execution," not strictly
  //    "self-directed decision-making." If the dimension reads more
  //    as "Self-Managed ↔ Team-Guided" in user testing, consider
  //    relabeling rather than changing the formula.
  {
    key: "autonomy",
    facets: [{ key: "E3_Assertiveness" }, { key: "C5_Self-Discipline" }],
    invertForLeftPole: true,
    schwartz: {
      left: { primary: "self-direction" },
      right: { primary: "conformity" },
      weight: 0.25,
    },
  },
  // 5. Purpose-Driven ↔ Achievement-Driven (使命驱动 ↔ 成就驱动)
  //    A3 (Altruism) as facet anchor; Schwartz contributes 50%
  //    (equal weight with the facet — not "dominant," just co-equal).
  //    Schwartz: universalism + benevolence (self-transcendence) → purpose (left)
  //              achievement + power (self-enhancement) → achievement (right)
  {
    key: "motivation",
    facets: [{ key: "A3_Altruism" }],
    invertForLeftPole: true,
    schwartz: {
      left: { primary: "universalism", secondary: "benevolence" },
      right: { primary: "achievement", secondary: "power" },
      weight: 0.5,
    },
  },
];

// ── Required facets (auto-derived from table) ───────────────────

export const REQUIRED_WENV_FACETS: readonly string[] = Array.from(
  new Set(WORK_ENV_DIMENSIONS.flatMap((d) => d.facets.map((f) => f.key))),
);

export function hasRequiredWorkEnvFacets(
  facets: Record<string, number> | undefined,
): boolean {
  if (!facets) return false;
  return REQUIRED_WENV_FACETS.every((k) => typeof facets[k] === "number");
}

/**
 * Compute the Spotlight signal (0-100) for the work-environment card.
 * Reflects the strongest dimension's polarization — strongly polarized
 * users see this card promoted to the spotlight carousel.
 *
 * Returns 25 (default) for null input or fully neutral profiles, so
 * the card stays present but ranked low. Max possible signal is 90
 * (because position is clamped to [5, 95], so max |pos-50| is 45).
 */
export function computeWorkEnvSignal(
  dims: readonly EnvDimension[] | null,
): number {
  if (!dims || dims.length === 0) return 25;
  const maxAbs = Math.max(...dims.map((d) => Math.abs(d.position - 50)));
  return Math.min(95, Math.max(25, Math.round(maxAbs * 2)));
}

// ── Pure compute ────────────────────────────────────────────────

/**
 * Derive work environment preferences from Big Five facets + Schwartz values.
 * Pure computation — no LLM, no DB, no side effects.
 */
export function deriveEnvironmentPreferences(
  profile: PersonalProfileData,
): EnvDimension[] | null {
  const facets = profile.algoSnapshot?.bigFiveFacets as
    | Record<string, number>
    | undefined;
  if (!hasRequiredWorkEnvFacets(facets)) return null;

  const schwartz = profile.schwartzAnchors?.scores as
    | Record<string, number>
    | undefined;

  return WORK_ENV_DIMENSIONS.map((config) => {
    const primary = computePrimary(facets!, config.facets);
    let position = config.invertForLeftPole ? 100 - primary : primary;
    if (config.schwartz) {
      position = applySchwartzBlend(position, config.schwartz, schwartz);
    }
    position = clamp(position);
    return {
      key: config.key,
      position,
      strength: strengthOf(position),
    };
  });
}

// ── Helpers ─────────────────────────────────────────────────────

/** Normalize a 1-5 facet score to 0-100. Missing → 50 (neutral). */
function norm(facets: Record<string, number>, key: string): number {
  const v = facets[key];
  if (v == null) return 50;
  return Math.round(((v - 1) / 4) * 100);
}

function computePrimary(
  facets: Record<string, number>,
  terms: readonly FacetTerm[],
): number {
  if (terms.length === 0) return 50;
  const contribs = terms.map((t) => {
    const v = norm(facets, t.key);
    return t.reverse ? 100 - v : v;
  });
  return Math.round(contribs.reduce((a, b) => a + b, 0) / contribs.length);
}

function applySchwartzBlend(
  facetPos: number,
  blend: SchwartzBlend,
  schwartz: Record<string, number> | undefined,
): number {
  if (!schwartz) return facetPos;
  const leftScore = poleScore(schwartz, blend.left);
  const rightScore = poleScore(schwartz, blend.right);
  // Schwartz is 1-6 → diff ∈ [-5, +5] → sNorm ∈ [0, 100]
  // High right − low left → sNorm ↑ → pulls toward right pole
  const sNorm = Math.round(((rightScore - leftScore + 5) / 10) * 100);
  return Math.round(facetPos * (1 - blend.weight) + sNorm * blend.weight);
}

function poleScore(
  schwartz: Record<string, number>,
  pole: SchwartzPole,
): number {
  const primary = schwartz[pole.primary] ?? 3;
  if (!pole.secondary) return primary;
  const secondary = schwartz[pole.secondary] ?? 3;
  return (primary + secondary) / 2;
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, v));
}

function strengthOf(pos: number): "strong" | "moderate" | "slight" {
  const dist = Math.abs(pos - 50);
  if (dist > 25) return "strong";
  if (dist > 12) return "moderate";
  return "slight";
}
