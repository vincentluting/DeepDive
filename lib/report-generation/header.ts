// ============================================================
// Report Header Builder — Pure Algorithm (Zero LLM)
// Report Header: Builds archetype + cognitive style + Collaboration Style display components
// Includes anti-fixation fluidity notes
// ============================================================

import type { AssessmentInput, ReportHeader } from "../types";
import { ARCHETYPE_MAP } from "../scoring/constants";
import { mapBigFiveToCollabStyle } from "../scoring/layer3-derive";

/**
 * Build the report header from AssessmentResult.
 * Pure algorithm — no LLM call.
 *
 * - collabMapping: Collaboration Style derived from facets (primary) or domains (fallback)
 * - crossCultural: always null (not measured)
 * - cognitiveStyleCode: optional (may be absent)
 */
export function buildReportHeader(assessment: AssessmentInput): ReportHeader {
  const arch = assessment.archetype;
  const { cognitiveStyleCode } = assessment;

  // Look up archetype map for label/tagline
  const archetypeKey = arch.code;
  const mapEntry = ARCHETYPE_MAP[archetypeKey];

  const label_zh = mapEntry?.label_zh ?? arch.label_zh;
  const label_en = mapEntry?.label_en ?? arch.label_en;
  const tagline_zh = mapEntry?.tagline_zh ?? arch.tagline_zh;
  const tagline_en = mapEntry?.tagline_en ?? arch.tagline_en;

  // v2.0: cross-cultural not measured — always null
  const ccLabel_zh = null;
  const ccLabel_en = null;

  const cognitiveStyleSegment = cognitiveStyleCode?.code ?? null;

  const displayString_zh = [label_zh, cognitiveStyleSegment]
    .filter(Boolean)
    .join(" · ");
  const displayString_en = [label_en, cognitiveStyleSegment]
    .filter(Boolean)
    .join(" · ");

  const fluidityNote_zh = arch.isBoundary
    ? "你的维度分差很小，这意味着你的类型有天然的流动性——这是此刻的你，不是永远的你。随着你的探索，画像会持续进化。"
    : "这是此刻的你，不是永远的你。随着你的探索，画像会持续进化。";
  const fluidityNote_en = arch.isBoundary
    ? "Your dimensions are close, which means your type is naturally fluid — this is a snapshot, not a sentence. Your profile evolves as you do."
    : "This is a snapshot, not a sentence. Your profile evolves as you do.";

  return {
    archetypeCode: archetypeKey,
    archetype: {
      code: arch.code,
      orientation: arch.orientation,
      label_zh,
      label_en,
      tagline_zh,
      tagline_en,
    },
    cognitiveStyleCode: cognitiveStyleCode?.code ?? null,
    cognitiveStyleDisplayMode: cognitiveStyleCode?.displayMode ?? "balanced",
    crossCulturalType_zh: ccLabel_zh,
    crossCulturalType_en: ccLabel_en,
    // Collaboration Style derived from facets (primary signal) or domains (fallback)
    collabMapping: (() => {
      const collab =
        assessment.collabMapping ??
        mapBigFiveToCollabStyle(
          assessment.bigFive.domains,
          assessment.bigFive.facets,
        );
      return {
        cssGradient: collab.cssGradient,
        primary: collab.primary,
        secondary: collab.secondary,
      };
    })(),
    displayString_zh,
    displayString_en,
    fluidityNote_zh,
    fluidityNote_en,
    isBoundary: arch.isBoundary,
  };
}
