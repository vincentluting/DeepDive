// ============================================================
// Shared Prompt Utilities for Report Generation
//
// Consolidates repeated prompt patterns across LLM calls:
// 1. buildUserProfileBlock() — user profile summary (version-aware)
// 2. buildSystemMessage() — shared rules as system message
// ============================================================

import type { AssessmentInput, ProfileAlgorithmOutput } from "../types";
import {
  getSystemPreamble,
  getCommonRules,
  getNarrativeRestraintRules,
} from "./common-rules";
import { SCHWARTZ_VALUE_LABELS } from "../scoring/constants";
import { ARCHETYPE_MAP } from "../scoring/constants";
import { getArchetypeRelations } from "../content/archetype-relations";
import { extractJSON as extractStructuredJSON } from "../ai/structured-output";

// ── Schwartz value polarity labels ──

function polarityLabel(
  polarity: "explore" | "anchor",
  strength: "strong" | "moderate" | "weak",
  locale: string,
): string {
  if (locale === "zh") {
    const p = polarity === "explore" ? "开放探索" : "稳定扎根";
    const s =
      strength === "strong"
        ? "显著"
        : strength === "moderate"
          ? "中等"
          : "轻微";
    return `${p}（${s}）`;
  }
  const p = polarity === "explore" ? "Open to Change" : "Conservation-oriented";
  const s =
    strength === "strong"
      ? "strong"
      : strength === "moderate"
        ? "moderate"
        : "slight";
  return `${p} (${s})`;
}

function centeredBand(score: number, locale: string): string {
  if (locale === "zh") {
    if (score > 0.5) return "显著偏高";
    if (score > 0.2) return "偏高";
    if (score >= -0.2) return "中等";
    if (score >= -0.5) return "偏低";
    return "显著偏低";
  }
  if (score > 0.5) return "notably high";
  if (score > 0.2) return "above average";
  if (score >= -0.2) return "average";
  if (score >= -0.5) return "below average";
  return "notably low";
}

// ── Score-to-band converters (no raw numbers in LLM prompts) ──

function domainToBand(score: number, locale: string): string {
  if (locale === "zh") {
    if (score > 75) return "偏高";
    if (score > 60) return "中偏高";
    if (score >= 40) return "中等";
    if (score >= 25) return "中偏低";
    return "偏低";
  }
  if (score > 75) return "high";
  if (score > 60) return "moderate-high";
  if (score >= 40) return "moderate";
  if (score >= 25) return "moderate-low";
  return "low";
}

function facetToBand(score: number, locale: string): string {
  if (locale === "zh") {
    if (score >= 4.0) return "很高";
    if (score >= 3.5) return "偏高";
    if (score >= 2.5) return "中等";
    if (score >= 2.0) return "偏低";
    return "很低";
  }
  if (score >= 4.0) return "very high";
  if (score >= 3.5) return "high";
  if (score >= 2.5) return "moderate";
  if (score >= 2.0) return "low";
  return "very low";
}

export function consistencyToBand(pct: number, locale: string): string {
  if (locale === "zh") {
    if (pct >= 80) return "高度一致";
    if (pct >= 60) return "较为一致";
    if (pct >= 40) return "有明显差距";
    return "差距显著";
  }
  if (pct >= 80) return "highly consistent";
  if (pct >= 60) return "moderately consistent";
  if (pct >= 40) return "notable gaps";
  return "significant gaps";
}

export function matchScoreToBand(score: number, locale: string): string {
  if (locale === "zh") {
    if (score >= 80) return "高度契合";
    if (score >= 65) return "较为契合";
    if (score >= 50) return "有一定契合";
    return "探索性";
  }
  if (score >= 80) return "strong match";
  if (score >= 65) return "good match";
  if (score >= 50) return "moderate match";
  return "exploratory";
}

export function fitScoreToBand(score: number, locale: string): string {
  if (locale === "zh") {
    if (score >= 80) return "高度契合";
    if (score >= 60) return "较为契合";
    if (score >= 40) return "适中";
    return "有成长空间";
  }
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "moderate";
  return "growth area";
}

/**
 * Build a shared user profile summary block for LLM prompts.
 *
 * Version-aware: adapts labels for v2.0 (IPIP-120/PVQ-21) vs v3.0 (IPIP-60/TwIVI).
 * For screening-level (IPIP-30), omits facet-level details.
 */
export function buildUserProfileBlock(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  locale: string,
): string {
  const arch = algo.archetype;
  const schwartz = algo.schwartz;
  const isV3 =
    algo.bigFivePrecision === "screening" ||
    algo.bigFivePrecision === "standard";

  // Format Big Five domains (qualitative bands, no raw scores)
  const domainEntries = Object.entries(algo.bigFiveDomains)
    .map(([k, v]) => `${k}: ${domainToBand(v as number, locale)}`)
    .join(", ");

  // Schwartz top3 labels
  const top3Labels = schwartz.top3.map((k) =>
    locale === "zh"
      ? (SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]?.zh ??
        k)
      : (SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]?.en ??
        k),
  );

  // Full 10-value ranking with qualitative bands (no raw numbers)
  const fullValueRanking = schwartz.ranking
    .map((k) => {
      const label =
        locale === "zh"
          ? (SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]
              ?.zh ?? k)
          : (SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]
              ?.en ?? k);
      const band = centeredBand(
        schwartz.centered[k as keyof typeof schwartz.centered] ?? 0,
        locale,
      );
      return `${label} (${band})`;
    })
    .join(locale === "zh" ? "、" : ", ");

  // Openness↔Conservation polarity
  const polarity = algo.polarityContext;
  const polarityStr = polarityLabel(
    polarity.polarity,
    polarity.polarityStrength,
    locale,
  );

  // Value orientation confidence
  const voConfidence = arch.valueScores
    ? Math.abs(
        (arch.valueScores.enhancement ?? 0) -
          (arch.valueScores.transcendence ?? 0),
      )
    : 0;
  const voStrength =
    locale === "zh"
      ? voConfidence > 1
        ? "明确"
        : voConfidence > 0.4
          ? "中等"
          : "偏弱"
      : voConfidence > 1
        ? "clear"
        : voConfidence > 0.4
          ? "moderate"
          : "weak";

  // SJT tension summary (qualitative band, no raw percentage)
  const notableTensions = algo.sjtTensions.notableTensions;
  const consistencyBand = consistencyToBand(
    Math.round(algo.sjtTensions.overallConsistency * 100),
    locale,
  );

  // Version-aware facet lines: include for standard and full precision
  let facetLines = "";
  if (!isV3 || algo.bigFivePrecision === "standard") {
    const facetEntries = Object.entries(algo.bigFiveFacets).sort(
      (a, b) => b[1] - a[1],
    );
    const topFacets = facetEntries
      .slice(0, 3)
      .map(([k, v]) => `${k.replace("_", " ")}: ${facetToBand(v, locale)}`);
    const lowFacets = facetEntries
      .slice(-3)
      .map(([k, v]) => `${k.replace("_", " ")}: ${facetToBand(v, locale)}`);
    if (locale === "zh") {
      facetLines = `\n- 最高人格面 (Facets): ${topFacets.join("；")}\n- 最低人格面 (Facets): ${lowFacets.join("；")}`;
    } else {
      facetLines = `\n- Highest personality facets: ${topFacets.join("; ")}\n- Lowest personality facets: ${lowFacets.join("; ")}`;
    }
  }

  // Version-aware labels
  const bigFiveTag = isV3
    ? algo.bigFivePrecision === "standard"
      ? "IPIP-60"
      : "IPIP-30"
    : "IPIP-NEO-120";
  const valuesTag = isV3 ? "TwIVI (Sandy et al., 2017)" : "PVQ-21";

  // Archetype relationships
  const relations = getArchetypeRelations(arch.code);
  let relationsBlock = "";
  if (relations) {
    const mirrorLabel =
      ARCHETYPE_MAP[relations.mirror.code as keyof typeof ARCHETYPE_MAP];
    const alliesStr = relations.allies
      .map((a) => {
        const label = ARCHETYPE_MAP[a.code as keyof typeof ARCHETYPE_MAP];
        return locale === "zh"
          ? `${label?.label_zh ?? a.code}: ${a.why_zh}`
          : `${label?.label_en ?? a.code}: ${a.why_en}`;
      })
      .join(locale === "zh" ? "；" : "; ");
    const growthStr = relations.growthEdge
      .map((g) => {
        const label = ARCHETYPE_MAP[g.code as keyof typeof ARCHETYPE_MAP];
        return locale === "zh"
          ? `${label?.label_zh ?? g.code}: ${g.why_zh}`
          : `${label?.label_en ?? g.code}: ${g.why_en}`;
      })
      .join(locale === "zh" ? "；" : "; ");

    if (locale === "zh") {
      relationsBlock = `
- 镜像原型: ${mirrorLabel?.label_zh ?? relations.mirror.code} — ${relations.mirror.description_zh}
- 天然盟友: ${alliesStr}
- 成长搭档: ${growthStr}`;
    } else {
      relationsBlock = `
- Mirror type: ${mirrorLabel?.label_en ?? relations.mirror.code} — ${relations.mirror.description_en}
- Natural allies: ${alliesStr}
- Growth edge: ${growthStr}`;
    }
  }

  if (locale === "zh") {
    return `## 用户深度探索画像摘要
- 深度探索12型: ${arch.label_zh}（${arch.code}），价值取向区分度: ${voStrength}
- 一句话: "${arch.tagline_zh}"
- 认知风格: ${assessment.cognitiveStyleCode?.code ?? "平衡型"}
- 价值锚 Top3 (${valuesTag}): ${top3Labels.join("、")}
- 价值全景 (10维排名): ${fullValueRanking}
- 价值极性 (开放↔保守轴): ${polarityStr}
- 人格五维 (${bigFiveTag}): ${domainEntries}${facetLines}
- SJT行为一致性: ${consistencyBand}${notableTensions.length > 0 ? `，张力维度: ${notableTensions.join("、")}` : ""}${relationsBlock}

注意: 同一原型的用户价值观画像可能截然不同。请根据此用户的具体价值排名和开放↔保守极性来个性化叙事，不要仅依赖原型标签。`;
  }

  return `## User Deep Dive Profile Summary
- Deep Dive 12 Type: ${arch.label_en} (${arch.code}), value orientation distinction: ${voStrength}
- Tagline: "${arch.tagline_en}"
- Cognitive Style: ${assessment.cognitiveStyleCode?.code ?? "Balanced"}
- Value Anchors Top 3 (${valuesTag}): ${top3Labels.join(", ")}
- Full Value Profile (10 values ranked): ${fullValueRanking}
- Value Polarity (Openness↔Conservation axis): ${polarityStr}
- Big Five Domains (${bigFiveTag}): ${domainEntries}${facetLines}
- SJT behavioral consistency: ${consistencyBand}${notableTensions.length > 0 ? `, tension domains: ${notableTensions.join(", ")}` : ""}${relationsBlock}

Note: Users sharing the same archetype may have vastly different value profiles. Personalize the narrative based on this user's specific value ranking and Openness↔Conservation polarity — do not rely solely on the archetype label.`;
}

/**
 * Build a system message containing shared rules for all LLM calls.
 *
 * By placing common rules and restraint rules in the system message
 * (rather than the user message), we:
 * 1. Reduce per-prompt token count by ~200-300 tokens
 * 2. Enable OpenAI's system message caching optimization
 * 3. Clearly separate "who you are" (system) from "what to do" (user)
 */
export function buildSystemMessage(
  locale: string,
  options?: { includeRestraintRules?: boolean },
): string {
  // System preamble pushes the cacheable prefix above Anthropic's 1024-token
  // minimum, enabling prompt caching across sequential/concurrent calls.
  const parts = [getSystemPreamble(locale), getCommonRules(locale)];
  if (options?.includeRestraintRules !== false) {
    parts.push(getNarrativeRestraintRules(locale));
  }
  return parts.join("\n\n");
}

/**
 * Extract JSON from an LLM response via the shared structured-output parser.
 * This keeps report-generation recovery behavior aligned with other LLM JSON
 * paths: markdown fences, prose wrappers, balanced scanning, and conservative
 * truncation repair all live in one place.
 */
export function extractJSON(raw: string): unknown {
  return extractStructuredJSON(raw);
}
