// ============================================================
// Profile Fingerprint — input freshness + algorithm versioning
//
// Profile insights are only trustworthy when the stored algorithm snapshot
// was derived from the same effective assessment inputs the UI/report is
// about to use. This module is the single source of truth for that contract.
// ============================================================

import { createHash } from "crypto";
import type { AssessmentInput, PersonalProfileData } from "@/lib/types";

export const PROFILE_SCHEMA_VERSION = "3.1";
export const PROFILE_ALGORITHM_VERSION = "profile-algo-2026-05-10-v1";
export const PROFILE_NARRATIVE_VERSION = "profile-narrative-2026-05-10-v1";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function shortHash(payload: unknown): string {
  return createHash("sha256")
    .update(stableSerialize(payload))
    .digest("hex")
    .slice(0, 20);
}

function roundScore(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 1000) / 1000;
}

function canonicalRiasec(assessment: AssessmentInput): Record<string, number | null> {
  const scores = assessment.riasecNormalized;
  return {
    A: roundScore(scores?.A),
    C: roundScore(scores?.C),
    E: roundScore(scores?.E),
    I: roundScore(scores?.I),
    R: roundScore(scores?.R),
    S: roundScore(scores?.S),
  };
}

function canonicalValueScores(
  assessment: AssessmentInput,
): { enhancement: number | null; transcendence: number | null } | null {
  const scores = assessment.archetype?.valueScores;
  if (!scores) return null;
  return {
    enhancement: roundScore(scores.enhancement),
    transcendence: roundScore(scores.transcendence),
  };
}

export function computeProfileInputHash(
  assessment: AssessmentInput,
  algorithmVersion = PROFILE_ALGORITHM_VERSION,
): string {
  return shortHash({
    assessmentId: assessment.id,
    algorithmVersion,
    archetypeCode: assessment.archetype?.code ?? null,
    riasec: canonicalRiasec(assessment),
    valueScores: canonicalValueScores(assessment),
  });
}

export function computeNarrativeInputHash(
  profileInputHash: string | null | undefined,
  locale: string,
): string {
  return shortHash({
    profileInputHash: profileInputHash ?? null,
    locale,
    narrativeVersion: PROFILE_NARRATIVE_VERSION,
  });
}

export function isProfileCurrentForAssessment(
  profile: Pick<
    PersonalProfileData,
    "algorithmVersion" | "profileInputHash"
  > | null | undefined,
  assessment: AssessmentInput,
): boolean {
  if (!profile?.profileInputHash) return false;
  if (profile.algorithmVersion !== PROFILE_ALGORITHM_VERSION) return false;
  return profile.profileInputHash === computeProfileInputHash(assessment);
}

export function isNarrativeCurrentForProfile(
  profile: Pick<PersonalProfileData, "profileInputHash" | "narrativeSnapshots">,
): boolean {
  const locale = profile.narrativeSnapshots?.narrativeLocale;
  const storedHash = profile.narrativeSnapshots?.narrativeInputHash;
  if (!profile.profileInputHash || !locale || !storedHash) return false;
  return storedHash === computeNarrativeInputHash(profile.profileInputHash, locale);
}
