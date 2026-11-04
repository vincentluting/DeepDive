// ============================================================
// Meaning Compass — Algorithmic Synthesis
//
// Lifts the Schwartz E/T axis (once a one-line subtitle on the cover)
// into a full chapter, weaving:
//   - pole         (Self-Enhancement ↔ Self-Transcendence pole + spectrum)
//   - keystones    (top-3 Schwartz values + Big Five "coloring" hint)
//   - ikigai       (3 circles + cross-framework overlap detection)
//   - tension      (Schwartz value conflict, repackaged as meaning-framed)
//
// Path A (validated only): we do NOT algorithmize Frankl's three currents.
// They live solely as narrative scaffolding in the LLM layer.
//
// Pure algorithm, zero LLM, ~1ms. Called from generateProfile() after
// coreQualities/socialStyle/etc. The output also feeds the LLM data block
// (so the soul-call's meaningCompassNarrative can reference concrete data).
// ============================================================

import type {
  PersonalProfileData,
  MeaningCompass,
  IkigaiItem,
} from "../types/platform";
import type {
  RIASECDimension,
  BigFiveDimension,
  SchwartzConflictPair,
} from "../types/dimensions";
import type { ProfileAlgorithmOutput } from "../types/report";
import {
  RIASEC_APTITUDE,
  VALUE_TO_IKIGAI,
  COLLAB_STRENGTH,
  mergeIkigaiByTheme,
} from "../content/ikigai-mappings";

/** algoSnapshot excludes archetypeContent (static, looked up from content library) */
type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ── Pole ──────────────────────────────────────────────────────
// Reuses archetype.valueScores when present (already mean-of-pair from TwIVI).
// Falls back to centered Schwartz mean when archetype.valueScores is absent.

function computePole(algo: AlgoSnapshot): MeaningCompass["pole"] {
  const valueScores = algo.archetype?.valueScores;
  let enhancement: number;
  let transcendence: number;

  if (valueScores) {
    enhancement = valueScores.enhancement;
    transcendence = valueScores.transcendence;
  } else {
    const centered = algo.schwartz?.centered;
    if (!centered) {
      return { axis: "transcendence", strength: 0, spectrumPosition: 0 };
    }
    enhancement = ((centered.achievement ?? 0) + (centered.power ?? 0)) / 2;
    transcendence =
      ((centered.benevolence ?? 0) + (centered.universalism ?? 0)) / 2;
  }

  const gap = Math.abs(enhancement - transcendence);
  const axis: "enhancement" | "transcendence" =
    enhancement > transcendence ? "enhancement" : "transcendence";

  // strength: 0 = no clear pole, 1 = strongly polarized.
  // gap of 2 (raw 6-point Likert) → full confidence; matches deriveValueOrientation.
  const strength = clamp(gap / 2, 0, 1);

  // spectrumPosition: -1 (full enhancement) → +1 (full transcendence)
  // Used for the Compass SVG horizontal needle.
  const spectrumPosition = clamp((transcendence - enhancement) / 2, -1, 1);

  return { axis, strength, spectrumPosition };
}

// ── Big Five Coloring Hint ────────────────────────────────────
// Picks the dominant Big Five domain (with N inverted to "stability") as
// a one-token hint the LLM can use to color "how" this person enacts their
// values. NOT used for any visualization — only fed into narrative prompts.

function deriveBigFiveColoring(
  domains?: Record<BigFiveDimension, number>,
): string {
  if (!domains) return "balanced";

  const entries: Array<[BigFiveDimension, number]> = (
    Object.entries(domains) as Array<[BigFiveDimension, number]>
  ).map(([dim, score]) => [dim, dim === "neuroticism" ? 100 - score : score]);
  entries.sort((a, b) => b[1] - a[1]);
  const [topDim, topScore] = entries[0];

  // No dimension stands out → balanced
  if (topScore < 55) return "balanced";

  // Map neuroticism (inverted) → "stability" so the tag is positive-framed
  return topDim === "neuroticism" ? "high_stability" : `high_${topDim}`;
}

// ── Keystones ─────────────────────────────────────────────────

function computeKeystones(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
): MeaningCompass["keystones"] {
  const top3 = profile.schwartzAnchors?.top3 ?? [];
  const coloring = deriveBigFiveColoring(algo.bigFiveDomains);

  return top3.slice(0, 3).map((schwartzKey) => {
    const ikigai = VALUE_TO_IKIGAI[schwartzKey];
    return {
      schwartzKey,
      label_en: ikigai?.en ?? String(schwartzKey),
      label_zh: ikigai?.zh ?? String(schwartzKey),
      bigFiveColoring: coloring,
    };
  });
}

// ── Ikigai 3 Circles + Overlap ────────────────────────────────

function computeIkigai(profile: PersonalProfileData): MeaningCompass["ikigai"] {
  const rawItems: IkigaiItem[] = [];

  // 1. Schwartz top-3 → love/need circles (passed first so Schwartz labels
  //    win the merge — they carry the meaning-loaded language)
  const top3Values = profile.schwartzAnchors?.top3 ?? [];
  for (const v of top3Values.slice(0, 3)) {
    const mapping = VALUE_TO_IKIGAI[v];
    if (!mapping) continue;
    rawItems.push({
      themeKey: mapping.themeKey,
      label_en: mapping.en,
      label_zh: mapping.zh,
      circles: [mapping.circle],
      sources: ["schwartz"],
    });
  }

  // 2. RIASEC top-2 → goodAt circle
  const riasecScores = profile.riasecScores;
  if (riasecScores) {
    // Canonical RIASEC order tiebreak — keeps Ikigai top-2 deterministic under
    // JSONB/object-key reordering, matching buildArchetype()'s RIASEC_TIEBREAK.
    const RIASEC_ORDER: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];
    const sortedRiasec = (
      Object.entries(riasecScores) as Array<[RIASECDimension, number]>
    ).sort(
      (a, b) =>
        b[1] - a[1] || RIASEC_ORDER.indexOf(a[0]) - RIASEC_ORDER.indexOf(b[0]),
    );
    for (const [dim] of sortedRiasec.slice(0, 2)) {
      const aptitude = RIASEC_APTITUDE[dim];
      if (!aptitude) continue;
      rawItems.push({
        themeKey: aptitude.themeKey,
        label_en: aptitude.en,
        label_zh: aptitude.zh,
        circles: ["goodAt"],
        sources: ["riasec"],
      });
    }
  }

  // 3. Collaboration Style primary → goodAt circle
  const collabPrimary = profile.collabMapping?.primary;
  if (collabPrimary) {
    const collab = COLLAB_STRENGTH[collabPrimary];
    if (collab) {
      rawItems.push({
        themeKey: collab.themeKey,
        label_en: collab.en,
        label_zh: collab.zh,
        circles: ["goodAt"],
        sources: ["collab"],
      });
    }
  }

  const merged = mergeIkigaiByTheme(rawItems);
  const overlap = merged.filter((i) => i.circles.length >= 2);

  return {
    love: merged.filter((i) => i.circles.includes("love")),
    goodAt: merged.filter((i) => i.circles.includes("goodAt")),
    need: merged.filter((i) => i.circles.includes("need")),
    overlap,
  };
}

// ── Meaning Tension (repackaged Schwartz conflict) ────────────

function surfaceConflict(
  pair: SchwartzConflictPair | null,
): MeaningCompass["meaningTension"]["surfacedAs"] {
  if (!pair) return null;
  switch (pair) {
    case "achievement_benevolence":
    case "power_universalism":
      // Self-Enhancement ↔ Self-Transcendence axis
      return "creative_vs_experiential";
    case "autonomy_conformity":
    case "stimulation_security":
      // Openness-to-Change ↔ Conservation axis
      return "agency_vs_acceptance";
    default:
      return null;
  }
}

// ── Main Entry ────────────────────────────────────────────────

/**
 * Compute the Meaning Compass — Schwartz E/T axis × top-3 keystones × Ikigai
 * overlap × value tension. Pure algorithm, zero LLM.
 *
 * Frankl's three currents (creative / experiential / attitudinal) are deliberately
 * NOT algorithmized in this output — they appear only as narrative scaffolding
 * in the LLM layer (to honor the construct-validity gap between Big Five
 * personality and Frankl's existential meaning categories).
 *
 * @param profile - Profile after coreQualities/socialStyle/leadership computed.
 *                  Reads schwartzAnchors, riasecScores, collabMapping.
 * @param algo - ProfileAlgorithmOutput snapshot (frozen output from lib/scoring/).
 *               Reads archetype.valueScores, schwartz.centered, bigFiveDomains.
 */
export function computeMeaningCompass(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
): MeaningCompass {
  const conflictPair = profile.schwartzAnchors?.conflictPair ?? null;
  return {
    pole: computePole(algo),
    keystones: computeKeystones(profile, algo),
    ikigai: computeIkigai(profile),
    meaningTension: {
      pair: conflictPair,
      surfacedAs: surfaceConflict(conflictPair),
    },
  };
}
