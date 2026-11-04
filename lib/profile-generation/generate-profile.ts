// ============================================================
// Profile Generation — Algorithmic Data Layer
//
// Transforms AssessmentResult → PersonalProfileData
// Pure algorithmic — no LLM calls.
// Profile modules from product spec chapter 11:
//   1. Identity card (12-type archetype + cognitive style + values)
//   2. Interest radar (6-dimension RIASEC)
//   3. Collaboration Style mode (proprietary dual-color — derived from Big Five)
//   4. Value anchor ranking (Schwartz Top-3)
//   5. Cross-cultural positioning (not measured)
//   6. Confidence panel
// ============================================================

import type {
  AssessmentInput,
  PersonalProfileData,
  ProfileAlgorithmOutput,
} from "../types";
import { mapBigFiveToCollabStyle } from "../scoring/layer3-derive";
import { computeShadowInsights } from "./shadow-algorithm";
import { computeProfileAlgorithm } from "./profile-algorithm";
import { detectSchwartzConflict } from "./detect-schwartz-conflict";
import { computeCoreQualities } from "./core-qualities";
import { computeSocialStyle } from "./social-style";
import { computeLeadershipStyle } from "./leadership-style";
import { computeInterpersonalEnergy } from "./interpersonal-energy";
import { computeConflictHandling } from "./conflict-handling-style";
import { computeMeaningCompass } from "./meaning-compass";
import {
  PROFILE_ALGORITHM_VERSION,
  PROFILE_SCHEMA_VERSION,
  computeProfileInputHash,
} from "./profile-fingerprint";

// ============================================================
// Profile Generation — IPIP-NEO-120 + PVQ-21 + SJT
// ============================================================

/**
 * Generate PersonalProfileData from AssessmentResult.
 * Optionally accepts pre-computed ProfileAlgorithmOutput to avoid duplicate computation
 * when the report pipeline also needs the same algo output.
 */
export function generateProfile(
  assessment: AssessmentInput,
  userId?: string,
  algoOutput?: ProfileAlgorithmOutput,
): PersonalProfileData {
  const now = new Date().toISOString();

  // Compute or reuse ProfileAlgorithmOutput
  const algo = algoOutput ?? computeProfileAlgorithm(assessment);

  // Use Collaboration Style mapping from assessment if already computed; otherwise derive now
  const collabStyleMapping =
    assessment.collabMapping ??
    mapBigFiveToCollabStyle(
      assessment.bigFive.domains,
      assessment.bigFive.facets,
    );

  const profile: PersonalProfileData = {
    id: crypto.randomUUID(),
    assessmentId: assessment.id,
    userId: userId ?? undefined,
    profileSchemaVersion: PROFILE_SCHEMA_VERSION,
    algorithmVersion: PROFILE_ALGORITHM_VERSION,
    profileInputHash: computeProfileInputHash(assessment),

    // Module 1: Identity card — 12-type archetype (RIASEC × enhancement/transcendence)
    archetype: algo.archetype,

    // Module 1: cognitive style code (from algo)
    cognitiveStyleCode: algo.cognitiveStyleCode,
    cognitiveStyleDisplayMode: algo.cognitiveStyleDisplayMode,

    // Module 3: Collaboration Style (derived from Big Five facets/domains — proprietary)
    collabMapping: collabStyleMapping,

    // Module 4: Schwartz value anchors (from algo)
    schwartzAnchors: {
      ranking: algo.schwartz.ranking,
      top3: algo.schwartz.top3,
      scores: algo.schwartz.raw,
      conflictPair: detectSchwartzConflict(algo.schwartz.centered),
      conflictStatus: null, // Future: Q42 user confirmation
      confidence: 0.85, // PVQ-21 is the official Schwartz instrument
    },

    // Module 6: Cross-cultural — not measured
    crossCultural: {
      type: null,
      label_zh: null,
    },

    // Module 2: Interest radar (from assessment, which has latest QD RIASEC via getEffectiveAssessment)
    riasecScores: assessment.riasecNormalized,

    // Module 8: Confidence panel
    // Big Five confidence reflects measurement instrument quality (IPIP-120 vs
    // IPIP-60 vs screening), NOT cognitive style derivation reliability —
    // those are independent axes and conflating them under-reports both.
    confidenceMap: {
      riasec: algo.archetype.confidence,
      bigFive:
        algo.bigFivePrecision === "full"
          ? 0.95 // IPIP-120 — full instrument
          : algo.bigFivePrecision === "standard"
            ? 0.9 // IPIP-60 — v3.0 default
            : 0.75, // screening
      collab: collabStyleMapping.confidence,
      values: 0.85,
      crossCultural: 0, // not measured
    },

    // Extended data: Big Five normalized scores (from algo)
    bigFiveScores: algo.bigFiveDomains,

    // Extended data: cognitive style dimensional breakdown (from algo)
    cognitiveStyleDimensions: algo.cognitiveStyleDimensions,
    cognitiveStyleSchemaVersion: 2, // 0-100 normalized, EI/JP forward + SN/TF reverse
    cognitiveStyleConfidence: algo.cognitiveStyleConfidence,

    // Extended data: Response quality metadata
    qualityMeta: {
      totalTimeMs: assessment.meta.totalTimeMs,
      rushCount: assessment.meta.rushCount,
      hesitationCount: 0,
      totalQuestions: assessment.meta.totalQuestions,
      answeredQuestions: assessment.meta.answeredQuestions,
    },

    // SJT behavioral consistency index (from algo)
    sjtBehavioralConsistency: {
      overallConsistency: algo.sjtTensions.overallConsistency,
      notableTensions: algo.sjtTensions.notableTensions,
      scenarioCount: 6,
    },

    // Algo snapshot — cached for report pipeline (excludes archetypeContent)
    algoSnapshot: (() => {
      const { archetypeContent: _, ...rest } = algo;
      return rest;
    })(),

    version: "2.0",
    createdAt: now,
    updatedAt: now,
  };

  // Compute shadow insights from the built profile (pure algorithm, no LLM)
  profile.shadowInsights = computeShadowInsights(profile);

  // Compute Ofman Core Qualities from Big Five facet deviations (pure algorithm)
  profile.coreQualities = computeCoreQualities(algo.bigFiveFacetPairs);

  // Compute Social Style from Big Five E × A (Kramlinger 2×2)
  profile.socialStyle = computeSocialStyle(algo.bigFiveDomains);

  // Compute Leadership Style from Big Five (Goleman 6 styles)
  profile.leadershipStyle = computeLeadershipStyle(algo.bigFiveDomains);

  // Compute Interpersonal Energy Spectrum from Big Five facets (IPC-inspired)
  profile.interpersonalEnergy = computeInterpersonalEnergy(
    algo.bigFiveFacetPairs,
  );

  // Compute Conflict Handling Style from Big Five facets (TKI 5 modes)
  profile.conflictHandling = computeConflictHandling(
    algo.bigFiveFacetPairs,
    algo.bigFiveDomains,
  );

  // Compute Meaning Compass — Schwartz E/T axis × top-3 keystones × Ikigai overlap
  // (pure algorithm; reuses already-computed schwartzAnchors + collabMapping)
  profile.meaningCompass = computeMeaningCompass(profile, algo);

  return profile;
}
