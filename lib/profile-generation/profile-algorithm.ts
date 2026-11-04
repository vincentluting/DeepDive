// ============================================================
// Profile Algorithm Layer — Pure Algorithm (Zero LLM)
// Maps assessment data to visualization-ready profile structure.
// Converts AssessmentResult → ProfileAlgorithmOutput
//
// This is the canonical location. Previously in report-generation/.
// ============================================================

import type {
  AssessmentInput,
  ProfileAlgorithmOutput,
  BigFiveDimension,
} from "../types";
// SCHWARTZ_VALUE_LABELS available from '../scoring/constants' if needed
import { getArchetypeContent } from "../content";
import { deriveNormReferencedCognitiveStyle } from "@/lib/psychometrics/big-five-norms";

/**
 * Compute all profile algorithm outputs from AssessmentResult.
 * Uses Big Five facets (IPIP-NEO-120 or IPIP-30), Schwartz values (PVQ-21 or TwIVI),
 * and SJT Should-Would tensions. No collaboration style derivation, no cross-cultural.
 *
 * This is entirely algorithm-driven — no LLM calls.
 *
 * RIASEC & archetype: callers should pass an "effective assessment" (via
 * getEffectiveAssessment()) that already has the latest QD RIASEC merged in.
 * This function trusts whatever RIASEC the assessment contains.
 */
export function computeProfileAlgorithm(
  assessment: AssessmentInput,
): ProfileAlgorithmOutput {
  // Map RIASEC to brand-named radar dimensions
  const riasecRadar = {
    build: assessment.riasecNormalized.R,
    decode: assessment.riasecNormalized.I,
    create: assessment.riasecNormalized.A,
    connect: assessment.riasecNormalized.S,
    drive: assessment.riasecNormalized.E,
    structure: assessment.riasecNormalized.C,
  };

  // Look up hardcoded archetype content from content library
  const archetypeContent =
    getArchetypeContent(assessment.archetype.code) ?? null;

  // Big Five facets and normalized domains (v2.0: IPIP-120, v3.0: IPIP-60)
  const bigFiveDomains = assessment.bigFive.domainsNormalized;
  const bigFiveFacets = assessment.bigFive.facets;
  // Detect precision: v3.0 has explicit `precision` field; v2.0 doesn't (default 'full')
  const bigFivePrecision: "full" | "standard" | "screening" =
    "precision" in assessment.bigFive
      ? (assessment.bigFive as { precision: "full" | "standard" | "screening" })
          .precision
      : "full";

  // Cognitive style — NORM-REFERENCED (overrides the scale-midpoint version
  // computed in the frozen scoring pipeline). Big Five self-reports are
  // positively elevated, so cutting each MBTI-style axis at the raw scale
  // midpoint (3.0) over-assigns the high pole — empirically ~86% J, 92% F/N,
  // 81% E. Norm-referencing cuts at the population median (~50/50). The raw
  // measurement stays in the (frozen) scoring layer; norm-referenced
  // *interpretation* belongs here. See lib/psychometrics/big-five-norms.ts
  // and scripts/verification/FIX-PROPOSALS-2026-06-19.md (F15).
  //
  // Input on the 1–5 metric, reconstructed from domainsNormalized
  // (= ((raw-1)/4)*100, so raw = norm/25 + 1) which is present on every
  // assessment version.
  const dn = assessment.bigFive.domainsNormalized;
  const rawDomains: Record<BigFiveDimension, number> = {
    neuroticism: dn.neuroticism / 25 + 1,
    extraversion: dn.extraversion / 25 + 1,
    openness: dn.openness / 25 + 1,
    agreeableness: dn.agreeableness / 25 + 1,
    conscientiousness: dn.conscientiousness / 25 + 1,
  };
  const normedCognitive = deriveNormReferencedCognitiveStyle(rawDomains);
  const cognitiveStyleCode = normedCognitive.code;
  const cognitiveStyleDisplayMode = normedCognitive.displayMode;
  const cognitiveStyleDimensions = normedCognitive.dimensions;
  const cognitiveStyleConfidence = normedCognitive.confidence;

  // Build bigFiveFacetPairs: structured per-domain facets with deviation from domain mean
  const domainMap: Record<string, BigFiveDimension> = {
    n: "neuroticism",
    e: "extraversion",
    o: "openness",
    a: "agreeableness",
    c: "conscientiousness",
  };
  // Compute domain means from facets (1-5 scale)
  const domainFacetMeans: Record<string, number[]> = {};
  for (const [key, score] of Object.entries(bigFiveFacets)) {
    const d = domainMap[key[0].toLowerCase()];
    if (d) {
      if (!domainFacetMeans[d]) domainFacetMeans[d] = [];
      domainFacetMeans[d].push(score);
    }
  }
  const domainMeans: Record<string, number> = {};
  for (const [d, scores] of Object.entries(domainFacetMeans)) {
    domainMeans[d] = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  const bigFiveFacetPairs = Object.entries(bigFiveFacets).map(
    ([key, score]) => {
      const domain =
        domainMap[key[0].toLowerCase()] ?? ("neuroticism" as BigFiveDimension);
      const mean = domainMeans[domain] ?? 3;
      return {
        domain,
        facet: key,
        score,
        deviationFromMean: score - mean,
      };
    },
  );

  // Build polarityContext from Schwartz higher-order scores (when available)
  const higherOrder =
    "higherOrder" in assessment.schwartz
      ? (assessment.schwartz as { higherOrder: Record<string, number> })
          .higherOrder
      : null;
  const otcScore = higherOrder?.["openness-to-change"] ?? 0;
  const conScore = higherOrder?.["conservation"] ?? 0;
  const diff = Math.abs(otcScore - conScore);
  const polarityContext = {
    otcScore,
    conScore,
    polarity: (otcScore > conScore ? "explore" : "anchor") as
      | "explore"
      | "anchor",
    polarityStrength: (diff > 0.6
      ? "strong"
      : diff > 0.3
        ? "moderate"
        : "weak") as "strong" | "moderate" | "weak",
  };

  return {
    archetype: assessment.archetype,
    archetypeContent,
    riasecRadar,
    cognitiveStyleCode,
    cognitiveStyleDisplayMode,
    cognitiveStyleDimensions,
    cognitiveStyleConfidence,
    bigFiveDomains,
    bigFiveFacets,
    bigFivePrecision,
    bigFiveFacetPairs,
    polarityContext,
    schwartz: {
      raw: assessment.schwartz.raw,
      centered: assessment.schwartz.centered,
      ranking: assessment.schwartz.ranking,
      top3: assessment.schwartz.top3,
    },
    sjtTensions: {
      scenarios: assessment.tensions.scenarios,
      overallConsistency: assessment.tensions.overallConsistency,
      notableTensions: assessment.tensions.notableTensions,
    },
  };
}
