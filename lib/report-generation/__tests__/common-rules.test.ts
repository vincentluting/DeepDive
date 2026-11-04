// ============================================================
// Tests: common-rules.ts + prompt-utils.ts
// ============================================================

import { describe, it, expect } from "vitest";
import {
  getCommonRules,
  getNarrativeRestraintRules,
  getExplorationFramingRules,
  getExplorationNoteTemplate,
  COMMON_RULES,
  NARRATIVE_RESTRAINT_RULES,
  EXPLORATION_FRAMING_RULES,
  EXPLORATION_NOTE_TEMPLATE,
} from "../common-rules";
import { buildUserProfileBlock, buildSystemMessage } from "../prompt-utils";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import {
  buildExtremeAssessment,
  buildMinimalAssessment,
} from "./fixtures/mock-assessment-extreme";

// ── common-rules.ts ────────────────────────────────────────

describe("getCommonRules", () => {
  it("returns Chinese rules for zh locale", () => {
    const rules = getCommonRules("zh");
    expect(rules).toContain("中文");
    expect(rules).toContain("第二人称");
    expect(rules).toContain("RIASEC");
    expect(rules).toContain("写作禁忌");
  });

  it("returns English rules for en locale", () => {
    const rules = getCommonRules("en");
    expect(rules).toContain("English");
    expect(rules).toContain("second person");
    expect(rules).toContain("Writing Prohibitions");
  });

  it("locks Dutch output for nl locale", () => {
    const rules = getCommonRules("nl");
    expect(rules).toContain("Write entirely in Dutch");
    expect(rules).toContain("Every JSON string field value MUST be written entirely in Dutch");
    expect(rules).toContain("Dutch-Specific Style");
    expect(rules).not.toContain("Every JSON string field value MUST be written entirely in English");
  });

  it("prohibits academic terminology in both locales", () => {
    expect(getCommonRules("zh")).toContain("RIASEC");
    expect(getCommonRules("zh")).toContain("Big Five");
    expect(getCommonRules("en")).toContain("RIASEC");
    expect(getCommonRules("en")).toContain("Big Five");
  });

  it("includes confidence phrasing rules", () => {
    const zhRules = getCommonRules("zh");
    expect(zhRules).toContain("70%");
    expect(zhRules).toContain("40-69%");
    expect(zhRules).toContain("40%");

    const enRules = getCommonRules("en");
    expect(enRules).toContain("70%");
    expect(enRules).toContain("40-69%");
  });

  it("prohibits specific marketing phrases", () => {
    const rules = getCommonRules("en");
    expect(rules).toContain("unlock your potential");
    expect(rules).toContain("empower you to");
    expect(rules).toContain("on a journey");
    expect(rules).toContain("take the first step");
  });
});

describe("getNarrativeRestraintRules", () => {
  it("returns Chinese restraint rules for zh", () => {
    const rules = getNarrativeRestraintRules("zh");
    expect(rules).toContain("叙事节制协议");
    expect(rules).toContain("Barnum");
  });

  it("returns English restraint rules for en", () => {
    const rules = getNarrativeRestraintRules("en");
    expect(rules).toContain("Narrative Restraint Protocol");
    expect(rules).toContain("Barnum");
  });

  it("includes adaptability phrasing guidance (Schwartz-based)", () => {
    expect(getNarrativeRestraintRules("zh")).toContain("Schwartz");
    expect(getNarrativeRestraintRules("en")).toContain("Adaptability");
  });
});

describe("getExplorationFramingRules", () => {
  it("returns Chinese exploration rules for zh", () => {
    const rules = getExplorationFramingRules("zh");
    expect(rules).toContain("值得探索");
    expect(rules).toContain("不用");
  });

  it("returns English exploration rules for en", () => {
    const rules = getExplorationFramingRules("en");
    expect(rules).toContain("worth exploring");
    expect(rules).toContain("not");
  });

  it("returns target-language exploration rules for nl", () => {
    const rules = getExplorationFramingRules("nl");
    expect(rules).toContain("Write all recommendation wording in Dutch");
    expect(rules).not.toContain("Use phrases like");
  });
});

describe("getExplorationNoteTemplate", () => {
  it("returns Chinese template for zh", () => {
    const tmpl = getExplorationNoteTemplate("zh");
    expect(tmpl).toContain("兴趣图谱");
    expect(tmpl).toContain("价值锚");
  });

  it("returns English template for en", () => {
    const tmpl = getExplorationNoteTemplate("en");
    expect(tmpl).toContain("Interest Map");
    expect(tmpl).toContain("Value Anchors");
  });

  it("returns Dutch template for nl", () => {
    const tmpl = getExplorationNoteTemplate("nl");
    expect(tmpl).toContain("interessekaart");
    expect(tmpl).toContain("waardenankers");
  });
});

describe("backward-compatible constants", () => {
  it("COMMON_RULES defaults to Chinese", () => {
    expect(COMMON_RULES).toBe(getCommonRules("zh"));
  });

  it("NARRATIVE_RESTRAINT_RULES defaults to Chinese", () => {
    expect(NARRATIVE_RESTRAINT_RULES).toBe(getNarrativeRestraintRules("zh"));
  });

  it("EXPLORATION_FRAMING_RULES defaults to Chinese", () => {
    expect(EXPLORATION_FRAMING_RULES).toBe(getExplorationFramingRules("zh"));
  });

  it("EXPLORATION_NOTE_TEMPLATE defaults to Chinese", () => {
    expect(EXPLORATION_NOTE_TEMPLATE).toBe(getExplorationNoteTemplate("zh"));
  });
});

// ── prompt-utils.ts ────────────────────────────────────────

describe("buildUserProfileBlock", () => {
  it("returns Chinese profile block for zh", () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "zh");

    expect(block).toContain("用户深度探索画像摘要");
    expect(block).toContain("战略家");
    expect(block).toContain("认知风格");
    // v2.0 fixture → PVQ-21 label (v3.0 would show TwIVI)
    expect(block).toContain("PVQ-21");
    expect(block).toContain("SJT");
  });

  it("returns English profile block for en", () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    expect(block).toContain("User Deep Dive Profile Summary");
    expect(block).toContain("Tactician");
    expect(block).toContain("Cognitive Style");
    // v2.0 fixture → PVQ-21 label
    expect(block).toContain("PVQ-21");
  });

  it("includes SJT consistency band (no raw percentage)", () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    // After input sanitization: consistency is a qualitative band, not a percentage
    expect(block).toMatch(
      /highly consistent|moderately consistent|notable gaps|significant gaps/,
    );
    expect(block).not.toMatch(/\d+%/);
  });

  it("includes notable tensions when present", () => {
    const assessment = buildExtremeAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    expect(block).toContain("tension");
    expect(block).toContain("extraversion");
  });

  it('shows "consistent" when no notable tensions', () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    expect(block).toContain("consistent");
  });

  it("handles missing cognitive style gracefully", () => {
    const assessment = buildMinimalAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    expect(block).toContain("Balanced");
  });

  it("includes top and low facets", () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const block = buildUserProfileBlock(assessment, algo, "en");

    expect(block).toContain("Highest personality facets");
    expect(block).toContain("Lowest personality facets");
  });

  it("includes Schwartz top3 labels", () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const blockZh = buildUserProfileBlock(assessment, algo, "zh");
    const blockEn = buildUserProfileBlock(assessment, algo, "en");

    // v2.0 fixture → PVQ-21 label (version-aware)
    expect(blockZh).toContain("PVQ-21");
    expect(blockEn).toContain("PVQ-21");
  });
});

describe("buildSystemMessage", () => {
  it("includes common rules by default", () => {
    const msg = buildSystemMessage("en");
    expect(msg).toContain("General Rules");
  });

  it("includes restraint rules by default", () => {
    const msg = buildSystemMessage("en");
    expect(msg).toContain("Narrative Restraint Protocol");
  });

  it("excludes restraint rules when option is false", () => {
    const msg = buildSystemMessage("en", { includeRestraintRules: false });
    expect(msg).toContain("General Rules");
    expect(msg).not.toContain("Narrative Restraint Protocol");
  });

  it("returns Chinese rules for zh", () => {
    const msg = buildSystemMessage("zh");
    expect(msg).toContain("通用规则");
    expect(msg).toContain("叙事节制协议");
  });

  it("combines rules with double newline", () => {
    const msg = buildSystemMessage("en");
    expect(msg).toContain("\n\n");
  });
});
