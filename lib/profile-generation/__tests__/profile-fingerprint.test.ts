import { describe, expect, it } from "vitest";
import { buildBalancedAssessment } from "@/lib/report-generation/__tests__/fixtures/mock-assessment-balanced";
import {
  PROFILE_ALGORITHM_VERSION,
  computeNarrativeInputHash,
  computeProfileInputHash,
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "../profile-fingerprint";
import type { PersonalProfileData } from "@/lib/types";

describe("profile fingerprint freshness", () => {
  it("changes when RIASEC inputs change even if archetype code stays the same", () => {
    const assessment = buildBalancedAssessment();
    const changedAssessment = {
      ...assessment,
      riasecNormalized: {
        ...assessment.riasecNormalized,
        R: assessment.riasecNormalized.R + 1,
      },
      archetype: { ...assessment.archetype },
    };

    expect(computeProfileInputHash(changedAssessment)).not.toBe(
      computeProfileInputHash(assessment),
    );
  });

  it("marks a profile current only when hash and algorithm version match", () => {
    const assessment = buildBalancedAssessment();
    const profile = {
      algorithmVersion: PROFILE_ALGORITHM_VERSION,
      profileInputHash: computeProfileInputHash(assessment),
    };

    expect(isProfileCurrentForAssessment(profile, assessment)).toBe(true);
    expect(
      isProfileCurrentForAssessment(
        { ...profile, algorithmVersion: "old-version" },
        assessment,
      ),
    ).toBe(false);
  });

  it("tracks narrative freshness with profile input hash and locale", () => {
    const profileInputHash = "profile-hash";
    const profile = {
      profileInputHash,
      narrativeSnapshots: {
        narrativeLocale: "en",
        narrativeInputHash: computeNarrativeInputHash(profileInputHash, "en"),
      },
    } as Pick<PersonalProfileData, "profileInputHash" | "narrativeSnapshots">;

    expect(isNarrativeCurrentForProfile(profile)).toBe(true);
    expect(
      isNarrativeCurrentForProfile({
        ...profile,
        narrativeSnapshots: {
          ...profile.narrativeSnapshots,
          narrativeInputHash: computeNarrativeInputHash(profileInputHash, "zh"),
        },
      }),
    ).toBe(false);
  });
});
