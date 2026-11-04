// ============================================================
// normalize-profile.ts — Data boundary defense
//
// Old PersonalProfile records may lack fields added in later
// versions (archetype, etc.). This pure
// function fills in safe defaults so UI components can trust
// the data shape without scattered null-checks.
// ============================================================

import type { PersonalProfileData } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function migrateLegacyConfidenceMap(raw: unknown): Record<string, number> {
  const source = isRecord(raw) ? raw : {};
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(source)) {
    if (key === "disc" || key === "schwartz") continue;
    if (typeof value === "number") normalized[key] = value;
  }

  if (normalized.collab == null && typeof source.disc === "number") {
    normalized.collab = source.disc;
  }
  if (normalized.values == null && typeof source.schwartz === "number") {
    normalized.values = source.schwartz;
  }

  return normalized;
}

/**
 * Lazy migration for cognitiveStyleDimensions records written before the
 * 0-100 score normalization (landed 2026-05-10). Older rows stored the raw
 * 1-5 Big Five domain mean as `score`; newer rows use 0-100 with EI/JP
 * forward and SN/TF reverse normalization.
 *
 * Detection priority:
 *   1. `cognitiveStyleSchemaVersion >= 2` — explicit marker on records
 *      written by generate-profile.ts after the fix. Authoritative.
 *   2. Fallback heuristic: `every(score in [1, 5])`. Legacy raw means are
 *      bounded at the Likert scale, so any legacy record's score is ≥ 1.
 *      A new record that clamps to 0 (extreme raw=1 on EI/JP forward, or
 *      raw=5 on SN/TF reverse) escapes this band and is NOT mis-migrated.
 *
 * The fallback is needed for rows written between the bug landing date
 * and the schema-version field's introduction — they have no marker but
 * are still 0-100. In practice they sit at the 50 default for missing
 * data or 0/100 at extremes; the [1, 5] band only matches when raw means
 * sat in the 1-5 range, i.e. legacy data.
 */
function migrateLegacyCognitiveStyleDimensions(
  dims: PersonalProfileData["cognitiveStyleDimensions"] | undefined,
  schemaVersion: number | undefined,
): PersonalProfileData["cognitiveStyleDimensions"] | undefined {
  if (!dims) return undefined;
  // Authoritative marker: post-fix records carry version ≥ 2.
  if (typeof schemaVersion === "number" && schemaVersion >= 2) return dims;
  const axes = ["EI", "SN", "TF", "JP"] as const;
  const scores = axes.map((a) => dims[a]?.score ?? 0);
  const isLegacy = scores.every((s) => s >= 1 && s <= 5);
  if (!isLegacy) return dims;

  const forward = (raw: number) =>
    Math.round(Math.max(0, Math.min(100, ((raw - 1) / 4) * 100)) * 100) / 100;
  const reverse = (raw: number) =>
    Math.round(Math.max(0, Math.min(100, ((5 - raw) / 4) * 100)) * 100) / 100;

  return {
    EI: { ...dims.EI, score: forward(dims.EI.score) },
    SN: { ...dims.SN, score: reverse(dims.SN.score) },
    TF: { ...dims.TF, score: reverse(dims.TF.score) },
    JP: { ...dims.JP, score: forward(dims.JP.score) },
  };
}

/**
 * Normalize a raw profile JSON blob from the database into a
 * complete PersonalProfileData shape. Missing fields get safe
 * default values; existing fields pass through unchanged.
 */
export function normalizeProfile(raw: unknown): PersonalProfileData {
  const data = (raw ?? {}) as Record<string, unknown>;

  return {
    // --- identity ---
    id: (data.id as string) ?? "",
    assessmentId: (data.assessmentId as string) ?? "",
    userId: data.userId as string | undefined,
    profileSchemaVersion: data.profileSchemaVersion as string | undefined,
    algorithmVersion: data.algorithmVersion as string | undefined,
    profileInputHash: data.profileInputHash as string | undefined,

    // --- archetype ---
    archetype: (data.archetype as PersonalProfileData["archetype"]) ?? {
      primary: "S",
      orientation: "enhancement",
      code: "S-enhancement",
      label_zh: "",
      label_en: "",
      tagline_zh: "",
      tagline_en: "",
      isBoundary: false,
      confidence: 0,
      confidenceLevel: "low",
      derivedFrom: {
        primary: { dimension: "S", score: 0 },
        secondary: { dimension: "A", score: 0 },
        tertiary: { dimension: "I", score: 0 },
        gap12: 0,
        gap23: 0,
        relation: "adjacent",
      },
    },

    // --- Cognitive Style ---
    cognitiveStyleCode: (data.cognitiveStyleCode as string | null) ?? null,
    cognitiveStyleDisplayMode:
      (data.cognitiveStyleDisplayMode as PersonalProfileData["cognitiveStyleDisplayMode"]) ??
      "normal",

    // --- Collaboration Style mapping (derived from Big Five) ---
    // Accept legacy 'discMapping' key from old DB records via fallback
    collabMapping: ((data.collabMapping ??
      data.discMapping) as PersonalProfileData["collabMapping"]) ?? {
      primary: "S" as const,
      secondary: null,
      scores: { D: 25, I: 25, S: 25, C: 25 },
      cssGradient: "",
      derivedFrom: "big_five_mapping" as const,
      approximationNote_zh: "",
      approximationNote_en: "",
      confidence: 0,
    },

    // --- Schwartz value anchors ---
    schwartzAnchors:
      (data.schwartzAnchors as PersonalProfileData["schwartzAnchors"]) ?? {
        ranking: [],
        top3: [],
        scores: {} as Record<string, number>,
        conflictPair: null,
        conflictStatus: null,
        confidence: 0,
      },

    // --- cross-cultural ---
    crossCultural:
      (data.crossCultural as PersonalProfileData["crossCultural"]) ?? {
        type: "bridge",
        label_zh: "",
      },

    // --- Big Five scores (0-100 normalized, powers Big Five charts) ---
    bigFiveScores:
      (data.bigFiveScores as PersonalProfileData["bigFiveScores"]) ?? undefined,

    // --- Cognitive Style dimensions & confidence ---
    cognitiveStyleDimensions: migrateLegacyCognitiveStyleDimensions(
      data.cognitiveStyleDimensions as
        | PersonalProfileData["cognitiveStyleDimensions"]
        | undefined,
      data.cognitiveStyleSchemaVersion as number | undefined,
    ),
    cognitiveStyleSchemaVersion:
      (data.cognitiveStyleSchemaVersion as number | undefined) ?? undefined,
    cognitiveStyleConfidence:
      (data.cognitiveStyleConfidence as number | undefined) ?? undefined,

    // --- RIASEC scores ---
    riasecScores:
      (data.riasecScores as PersonalProfileData["riasecScores"]) ?? undefined,

    // --- confidence ---
    confidenceMap: migrateLegacyConfidenceMap(data.confidenceMap),

    // --- SJT behavioral consistency ---
    sjtBehavioralConsistency:
      (data.sjtBehavioralConsistency as PersonalProfileData["sjtBehavioralConsistency"]) ??
      undefined,

    // --- shadow insights (computed during profile generation, optional on older records) ---
    shadowInsights:
      (data.shadowInsights as PersonalProfileData["shadowInsights"]) ??
      undefined,

    // --- core qualities (Ofman quadrants from Big Five facets) ---
    coreQualities:
      (data.coreQualities as PersonalProfileData["coreQualities"]) ?? undefined,

    // --- social style (Kramlinger 2×2 from Big Five E×A) ---
    socialStyle:
      (data.socialStyle as PersonalProfileData["socialStyle"]) ?? undefined,

    // --- leadership style (Goleman 6 styles from Big Five) ---
    leadershipStyle:
      (data.leadershipStyle as PersonalProfileData["leadershipStyle"]) ??
      undefined,

    // --- interpersonal energy (IPC-inspired from Big Five facets) ---
    interpersonalEnergy:
      (data.interpersonalEnergy as PersonalProfileData["interpersonalEnergy"]) ??
      undefined,

    // --- conflict handling style (TKI 5 modes from Big Five facets) ---
    conflictHandling:
      (data.conflictHandling as PersonalProfileData["conflictHandling"]) ??
      undefined,

    // --- meaning compass (Schwartz E/T axis × keystones × ikigai overlap) ---
    meaningCompass:
      (data.meaningCompass as PersonalProfileData["meaningCompass"]) ??
      undefined,

    // --- narrative snapshots (populated during profile generation) ---
    narrativeSnapshots:
      (data.narrativeSnapshots as PersonalProfileData["narrativeSnapshots"]) ??
      undefined,

    // --- quality metadata ---
    qualityMeta:
      (data.qualityMeta as PersonalProfileData["qualityMeta"]) ?? undefined,

    // --- algo snapshot (cached for report pipeline) ---
    algoSnapshot:
      (data.algoSnapshot as PersonalProfileData["algoSnapshot"]) ?? undefined,

    // --- meta ---
    version: (data.version as string) ?? "1.0",
    createdAt: (data.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
  };
}
