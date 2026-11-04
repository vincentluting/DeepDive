// ============================================================
// Companion Compatibility Scoring
//
// Pure functions, zero IO. Composes two factors:
//
//   1. RIASEC vector cosine similarity        ∈ [0, 1]
//      Captures how much two users SHARE the same career drivers.
//
//   2. Enhancement / Transcendence complementarity   ∈ {0.7, 1.0}
//      Schwartz's value-axis pair — same orientation gets a baseline
//      0.7 (still meaningful), opposite orientations get the full 1.0
//      because evidence suggests opposite-orientation pairs grow more
//      from each other (well-being literature on value diversity).
//
//   score = round(100 × (0.6 × cosine + 0.4 × complementarity))
//
// The split puts a soft majority on similarity (so two engineers score
// well even when both are enhancement-leaning) but rewards the user
// when fate hands them an opposite-orientation match.
// ============================================================

import type { RIASECDimension, ValueOrientation } from "@/lib/types/dimensions";
import type {
  CompanionProfile,
  CompanionRiasecScores,
} from "@/lib/types/companion";

const RIASEC_KEYS: ReadonlyArray<RIASECDimension> = [
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
];

const COSINE_WEIGHT = 0.6;
const COMPLEMENT_WEIGHT = 0.4;
const SAME_ORIENTATION_BASELINE = 0.7;
const OPPOSITE_ORIENTATION_BASELINE = 1.0;

// ── Archetype code parsing ──────────────────────────────────

/**
 * Parse "R-enhancement" / "I-transcendence" / etc. into typed pieces.
 * Returns null on any unexpected shape — callers must handle that
 * (a bad archetypeCode in the DB shouldn't crash discovery).
 */
export function parseArchetypeCode(
  code: string,
): { primary: RIASECDimension; orientation: ValueOrientation } | null {
  if (typeof code !== "string") return null;
  const [rawPrimary, rawOrientation] = code.split("-");
  if (!rawPrimary || !rawOrientation) return null;

  if (!(RIASEC_KEYS as readonly string[]).includes(rawPrimary)) return null;
  if (rawOrientation !== "enhancement" && rawOrientation !== "transcendence") {
    return null;
  }
  return {
    primary: rawPrimary as RIASECDimension,
    orientation: rawOrientation,
  };
}

// ── Vector helpers ──────────────────────────────────────────

/**
 * Cosine similarity for two RIASEC vectors. Returns a value in [0, 1].
 *
 * Notes:
 * - All RIASEC scores in this codebase are non-negative, so cosine here
 *   is bounded to [0, 1] (otherwise it would be [-1, 1]).
 * - Returns 0 when either vector has zero magnitude — defensive default
 *   so a user with all-zero scores doesn't yield NaN downstream.
 */
export function cosineSimilarity(
  a: CompanionRiasecScores,
  b: CompanionRiasecScores,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of RIASEC_KEYS) {
    const av = a[k];
    const bv = b[k];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // Numerical safety: cosine of non-negative vectors is in [0, 1] but
  // floating-point can nudge it slightly outside.
  if (sim < 0) return 0;
  if (sim > 1) return 1;
  return sim;
}

/**
 * Schwartz Self-Enhancement ↔ Self-Transcendence complementarity.
 * Opposite orientations → 1.0 (max growth potential)
 * Same orientation     → 0.7 (still meaningful overlap)
 */
export function complementarity(
  a: ValueOrientation,
  b: ValueOrientation,
): number {
  return a === b ? SAME_ORIENTATION_BASELINE : OPPOSITE_ORIENTATION_BASELINE;
}

// ── Composite score ─────────────────────────────────────────

export interface Compatibility {
  /** Integer 0-100 displayed in UI. */
  score: number;
  /** Raw cosine similarity ∈ [0, 1] (debug + Sentry breadcrumbs). */
  cosineSimilarity: number;
  /** Complementarity factor ∈ {0.7, 1.0}. */
  complementarity: number;
  /** Their primary RIASEC dimension (for archetype display). */
  primary: RIASECDimension;
  /** Their value orientation (enhancement | transcendence). */
  orientation: ValueOrientation;
}

/**
 * Compute compatibility between two companion profiles.
 * Returns null if either side has an unparseable archetypeCode — the
 * caller should drop that candidate from results rather than display
 * a misleading score.
 */
export function computeCompatibility(
  viewer: Pick<CompanionProfile, "scoresJson" | "archetypeCode">,
  candidate: Pick<CompanionProfile, "scoresJson" | "archetypeCode">,
): Compatibility | null {
  const viewerArch = parseArchetypeCode(viewer.archetypeCode);
  const candArch = parseArchetypeCode(candidate.archetypeCode);
  if (!viewerArch || !candArch) return null;

  const cosine = cosineSimilarity(viewer.scoresJson, candidate.scoresJson);
  const comp = complementarity(viewerArch.orientation, candArch.orientation);

  const composite = COSINE_WEIGHT * cosine + COMPLEMENT_WEIGHT * comp;
  // Clamp to [0, 100] then round; the floating-point math keeps this
  // tightly bounded but defence-in-depth is cheap.
  const score = Math.max(0, Math.min(100, Math.round(composite * 100)));

  return {
    score,
    cosineSimilarity: cosine,
    complementarity: comp,
    primary: candArch.primary,
    orientation: candArch.orientation,
  };
}
