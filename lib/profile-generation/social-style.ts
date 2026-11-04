// ============================================================
// Social Style Algorithm — Kramlinger 2×2
//
// Maps Big Five Extraversion × Agreeableness to the Social
// Styles model (Kramlinger 2011):
//   Ask + Task = Analytical
//   Tell + Task = Driver
//   Ask + People = Amiable
//   Tell + People = Expressive
//
// Pure algorithm, no LLM.
// ============================================================

import type { SocialStyleResult } from "../types";
import { percentileFromNormalized } from "@/lib/psychometrics/big-five-norms";

const STYLE_COMM_TIPS: Record<
  SocialStyleResult["style"],
  { en: string; zh: string }
> = {
  analytical: {
    en: "Give details, evidence, and time to process. Avoid rushing decisions.",
    zh: "提供细节、证据和思考时间。避免催促决定。",
  },
  driver: {
    en: "Keep it to the point. Focus on results, not process. Be direct.",
    zh: "言简意赅。聚焦结果而非过程。直截了当。",
  },
  amiable: {
    en: "Take time to bond. Show genuine interest. Create a safe space for input.",
    zh: "花时间建立关系。展现真诚兴趣。创造安全的表达空间。",
  },
  expressive: {
    en: "Show appreciation and enthusiasm. Let them share ideas freely. Energize the conversation.",
    zh: "展现欣赏和热情。让他们自由分享想法。为对话注入能量。",
  },
};

/**
 * Compute Social Style from Big Five domain scores.
 *
 * NORM-REFERENCED (F15): the Tell/Ask × People/Task split is taken at the
 * population median, not the raw scale midpoint. Big Five self-reports are
 * positively elevated (Extraversion ~3.27, Agreeableness ~3.71 on 1–5), so a
 * fixed `>= 50` cut over-assigns Tell + People → almost everyone "expressive".
 * Scores are reported as percentiles (50 = median) so the displayed strength
 * and the quadrant label flip at the same point. See big-five-norms.ts.
 */
export function computeSocialStyle(
  bigFiveDomains: Record<string, number>,
): SocialStyleResult | undefined {
  const e = bigFiveDomains.extraversion;
  const a = bigFiveDomains.agreeableness;

  if (e == null || a == null) return undefined;

  const ePct = percentileFromNormalized("extraversion", e);
  const aPct = percentileFromNormalized("agreeableness", a);

  const isTell = ePct >= 50;
  const isPeople = aPct >= 50;

  const style: SocialStyleResult["style"] =
    !isTell && !isPeople
      ? "analytical"
      : isTell && !isPeople
        ? "driver"
        : !isTell && isPeople
          ? "amiable"
          : "expressive";

  return {
    style,
    extraversionScore: Math.round(ePct),
    agreeablenessScore: Math.round(aPct),
    commTip: STYLE_COMM_TIPS[style],
  };
}
