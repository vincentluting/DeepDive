// ============================================================
// Factor: Industry Preference Fit
//
// Scores how well a career direction's industries match the
// user's interested industries. This turns industry from a
// binary filter into a continuous scoring dimension.
//
// Score range: 0-100
// Available: When user has filled interestedIndustries[]
//
// Logic:
//   - Direct match (career in user's target list): 100
//   - Same sector match (career in same broad sector): 70
//   - No overlap: 30
//   - No preference ("recommend_for_me" / empty): neutral 50
// ============================================================

import type { FactorScore, IndustryInput } from "../types";
import { INDUSTRY_MAP, type IndustrySector } from "@/lib/constants/industries";

export type { IndustryInput };

/**
 * Calculate industry preference fit for a career direction.
 *
 * @param input - User's industry preferences
 * @param careerIndustries - The career direction's industry tags
 */
export function scoreIndustry(
  input: IndustryInput | undefined,
  careerIndustries: string[],
): FactorScore {
  // No industry preference → neutral (don't penalize or boost)
  if (
    !input ||
    input.interestedIndustries.length === 0 ||
    input.interestedIndustries.includes("recommend_for_me")
  ) {
    return { score: 50, available: false };
  }

  if (careerIndustries.length === 0) {
    return { score: 50, available: true };
  }

  // Check for direct industry match
  const hasDirectMatch = careerIndustries.some((ci) =>
    input.interestedIndustries.includes(ci),
  );

  if (hasDirectMatch) {
    return { score: 100, available: true };
  }

  // Check for same-sector match (broader category)
  const userSectors = new Set<IndustrySector>();
  for (const id of input.interestedIndustries) {
    const industry = INDUSTRY_MAP.get(id);
    if (industry) userSectors.add(industry.sector);
  }

  const hasSectorMatch = careerIndustries.some((ci) => {
    const industry = INDUSTRY_MAP.get(ci);
    return industry && userSectors.has(industry.sector);
  });

  if (hasSectorMatch) {
    return { score: 70, available: true };
  }

  // No overlap at all
  return { score: 30, available: true };
}
