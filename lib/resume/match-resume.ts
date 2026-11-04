// ============================================================
// Resume ↔ Assessment Matching Pipeline
//
// Core design principle (from architecture doc):
//   - Aligned: resume confirms assessment → boost confidence
//   - Conflicting: resume diverges → surface as "tension insight",
//     NOT as a correction. The resume is a narrative anchor,
//     not a direction limiter.
// ============================================================

import type { AssessmentResult, RIASECDimension } from "@/lib/types";
import type {
  ResumeData,
  ResumeMatchResult,
  AlignedDimension,
  ConflictingDimension,
} from "./types";

// ========== RIASEC Signal Inference from Resume ==========

/**
 * Keywords/patterns that signal RIASEC dimensions based on
 * job titles, skills, and industry experience.
 */
const RIASEC_SIGNALS: Record<
  RIASECDimension,
  {
    titleKeywords: string[];
    skillKeywords: string[];
    industryKeywords: string[];
    label_zh: string;
    label_en: string;
  }
> = {
  R: {
    titleKeywords: [
      "engineer",
      "technician",
      "mechanic",
      "developer",
      "builder",
      "operator",
      "craftsman",
      "machinist",
      "electrician",
      "hardware",
    ],
    skillKeywords: [
      "manufacturing",
      "assembly",
      "repair",
      "construction",
      "cad",
      "welding",
      "carpentry",
      "machining",
      "plumbing",
      "electronics",
      "mechanical",
      "prototyping",
      "3d printing",
    ],
    industryKeywords: [
      "manufacturing",
      "construction",
      "engineering",
      "automotive",
      "aerospace",
      "agriculture",
      "mining",
    ],
    label_zh: "动手实践",
    label_en: "Hands-on / Realistic",
  },
  I: {
    titleKeywords: [
      "researcher",
      "scientist",
      "analyst",
      "data",
      "professor",
      "investigator",
      "laboratory",
      "physician",
      "biologist",
      "chemist",
      "physicist",
    ],
    skillKeywords: [
      "research",
      "analysis",
      "statistics",
      "data science",
      "machine learning",
      "python",
      "r programming",
      "laboratory",
      "experiment",
      "hypothesis",
      "quantitative",
      "modeling",
    ],
    industryKeywords: [
      "research",
      "academia",
      "pharmaceutical",
      "biotechnology",
      "laboratory",
      "science",
      "medical research",
    ],
    label_zh: "探索研究",
    label_en: "Investigative",
  },
  A: {
    titleKeywords: [
      "designer",
      "artist",
      "writer",
      "creative",
      "director",
      "photographer",
      "animator",
      "musician",
      "illustrator",
      "ux",
      "ui",
      "graphic",
      "content creator",
    ],
    skillKeywords: [
      "design",
      "illustration",
      "photography",
      "writing",
      "creative",
      "figma",
      "photoshop",
      "sketch",
      "animation",
      "video editing",
      "typography",
      "branding",
      "storytelling",
    ],
    industryKeywords: [
      "design",
      "media",
      "entertainment",
      "advertising",
      "fashion",
      "film",
      "music",
      "publishing",
      "art",
      "gaming",
    ],
    label_zh: "创意表达",
    label_en: "Artistic",
  },
  S: {
    titleKeywords: [
      "teacher",
      "counselor",
      "therapist",
      "social worker",
      "nurse",
      "coach",
      "trainer",
      "mentor",
      "hr",
      "human resources",
      "recruiter",
      "community",
      "care",
    ],
    skillKeywords: [
      "counseling",
      "teaching",
      "mentoring",
      "coaching",
      "communication",
      "empathy",
      "facilitation",
      "conflict resolution",
      "team building",
      "patient care",
      "social services",
    ],
    industryKeywords: [
      "education",
      "healthcare",
      "social services",
      "nonprofit",
      "community",
      "wellness",
      "mental health",
      "nursing",
      "counseling",
    ],
    label_zh: "关怀连接",
    label_en: "Social",
  },
  E: {
    titleKeywords: [
      "manager",
      "director",
      "ceo",
      "coo",
      "founder",
      "vp",
      "head of",
      "lead",
      "president",
      "entrepreneur",
      "sales",
      "business development",
      "executive",
    ],
    skillKeywords: [
      "leadership",
      "management",
      "strategy",
      "negotiation",
      "sales",
      "business development",
      "fundraising",
      "public speaking",
      "decision making",
      "p&l",
      "revenue",
    ],
    industryKeywords: [
      "management",
      "consulting",
      "sales",
      "real estate",
      "venture capital",
      "private equity",
      "startup",
      "investment banking",
    ],
    label_zh: "驱动领导",
    label_en: "Enterprising",
  },
  C: {
    titleKeywords: [
      "accountant",
      "auditor",
      "administrator",
      "clerk",
      "bookkeeper",
      "compliance",
      "operations",
      "coordinator",
      "logistics",
      "quality",
      "controller",
    ],
    skillKeywords: [
      "accounting",
      "bookkeeping",
      "excel",
      "erp",
      "compliance",
      "auditing",
      "quality assurance",
      "documentation",
      "scheduling",
      "inventory",
      "data entry",
      "regulatory",
    ],
    industryKeywords: [
      "finance",
      "accounting",
      "banking",
      "insurance",
      "government",
      "logistics",
      "supply chain",
      "compliance",
      "legal",
    ],
    label_zh: "结构秩序",
    label_en: "Conventional",
  },
};

/**
 * Compute a RIASEC signal profile from resume data.
 * Returns a score 0-100 per dimension based on keyword matches.
 */
function inferRIASECFromResume(
  resume: ResumeData,
): Record<RIASECDimension, number> {
  const scores: Record<RIASECDimension, number> = {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  };

  const allTitles = resume.experience
    .map((e) => (e.title || "").toLowerCase())
    .join(" ");
  const allSkills = resume.skills.map((s) => (s || "").toLowerCase()).join(" ");
  const allIndustries = [
    ...resume.industries,
    ...resume.experience.map((e) => e.industry),
  ]
    .filter(Boolean)
    .map((i) => i.toLowerCase())
    .join(" ");

  for (const dim of Object.keys(scores) as RIASECDimension[]) {
    const signals = RIASEC_SIGNALS[dim];
    let matches = 0;

    for (const kw of signals.titleKeywords) {
      if (allTitles.includes(kw)) matches += 3; // Title matches weigh more
    }
    for (const kw of signals.skillKeywords) {
      if (allSkills.includes(kw)) matches += 2;
    }
    for (const kw of signals.industryKeywords) {
      if (allIndustries.includes(kw)) matches += 1;
    }

    // Normalize to 0-100 range (cap at 15 matches = 100)
    scores[dim] = Math.min(100, Math.round((matches / 15) * 100));
  }

  return scores;
}

// ========== Auto-fill Real Conditions ==========

/**
 * Extract auto-fillable real conditions from resume data.
 * Only populates fields that can be reliably extracted.
 * Does NOT guess at visa status or salary expectation.
 */
function buildAutoFillConditions(
  resume: ResumeData,
): ResumeMatchResult["autoFillRealConditions"] {
  const autoFill: ResumeMatchResult["autoFillRealConditions"] = {};

  // Languages
  if (resume.languages.length > 0) {
    autoFill.workLanguages = resume.languages.map((l) => ({
      language: l.language,
      proficiency: l.proficiency,
    }));
  }

  // Industries
  if (resume.industries.length > 0) {
    autoFill.pastIndustries = resume.industries;
  }

  // Years of experience
  if (resume.yearsOfExperience > 0) {
    autoFill.experienceYears = resume.yearsOfExperience;
  }

  // Education — use the canonical DEGREE_PATTERNS via mapDegreeToLevel
  // so both inference paths stay in sync. (Was a duplicate inline map
  // pre-2026-05-19; the duplicate carried the same substring bug.)
  if (resume.education.length > 0) {
    const latest = resume.education[0];
    autoFill.education = {
      level: mapDegreeToLevel(latest.degree || ""),
      field: latest.field || "",
    };
  }

  return autoFill;
}

// ========== Target Tier Inference ==========

/** Title keyword → minimum tier override.
 *  Most-specific tier-5 markers checked first; floor-style overrides at end. */
const TIER_TITLE_OVERRIDES: ReadonlyArray<{
  regex: RegExp;
  tier: number;
  /** "min" = bump up to this tier; "cap" = cap at this tier */
  mode: "min" | "cap";
}> = [
  {
    regex:
      /\b(ceo|cto|cfo|coo|cio|cmo|chro|caio|chief\s+\w+\s+officer|managing\s+partner|general\s+counsel|professor|attending\s+physician|surgeon|partner)\b/i,
    tier: 5,
    mode: "min",
  },
  {
    regex:
      /\b(manager|director|head\s+of|principal|lead|architect|engineer|designer|analyst|consultant|scientist|developer|product\s+manager|attorney|lawyer|accountant|auditor|marketer|researcher|strategist)\b/i,
    tier: 4,
    mode: "min",
  },
  {
    regex:
      /\b(technician|paralegal|nurse|electrician|barber|stylist|chef|sous\s+chef|esthetician|skincare|tour\s+guide|medical\s+assistant)\b/i,
    tier: 3,
    mode: "min",
  },
  {
    regex:
      /\b(waiter|waitress|server|bartender|barista|cashier|cleaner|janitor|housekeeper|driver|delivery|busser|host|hostess|attendant|dishwasher|landscaper)\b/i,
    tier: 2,
    mode: "cap",
  },
];

function tierFromEducation(
  level: "high_school" | "bachelor" | "master" | "phd" | "other",
): number {
  switch (level) {
    case "phd":
      return 5;
    case "master":
      return 5;
    case "bachelor":
      return 4;
    case "high_school":
      return 2;
    default:
      return 3;
  }
}

function seniorityAdjustment(seniority: ResumeData["seniority"]): number {
  switch (seniority) {
    case "entry":
      return -1;
    case "executive":
      return +1;
    case "mid":
    case "senior":
    case "unknown":
    default:
      return 0;
  }
}

function applyTitleOverrides(baseTier: number, titles: string[]): number {
  let tier = baseTier;
  for (const title of titles) {
    for (const rule of TIER_TITLE_OVERRIDES) {
      if (!rule.regex.test(title)) continue;
      if (rule.mode === "min" && rule.tier > tier) tier = rule.tier;
      if (rule.mode === "cap" && rule.tier < tier) tier = rule.tier;
    }
  }
  return tier;
}

function tierConfidence(
  hasEducation: boolean,
  hasSeniority: boolean,
  hasTitleOverride: boolean,
): number {
  let conf = 0.4;
  if (hasEducation) conf += 0.25;
  if (hasSeniority) conf += 0.15;
  if (hasTitleOverride) conf += 0.2;
  return Math.min(1, conf);
}

type EduLevel = "high_school" | "bachelor" | "master" | "phd" | "other";

// Word-boundary patterns so substrings inside other words don't trigger.
// Bug fix 2026-05-19 (Codex cross-review): the prior `lower.includes("ma")`
// matched `Diploma`, `Marketing Certificate`, `Mama`, etc.; `includes("ba")`
// matched `MBA`. Word boundaries (\b) prevent these false positives.
// Order matters within each level: longer or more-specific patterns first,
// so `MBA` lands in master before bachelor; `High School Diploma` lands in
// high_school via the explicit `high school` phrase before generic `diploma`.
const DEGREE_PATTERNS: ReadonlyArray<[RegExp, EduLevel]> = [
  // phd — English
  [/\bph\.?\s*d\b/i, "phd"],
  [/\bdoctorates?\b/i, "phd"],
  [/\bdoctoral\b/i, "phd"],
  [/\bdoctor of\b/i, "phd"],
  // phd — Chinese (博士 = doctorate, 博士研究生 = doctoral candidate;
  // parse-resume.ts asks for verbatim so a 中文 resume can carry these)
  [/博士/u, "phd"],
  // master (MBA first so it wins over the looser MA token).
  // Plural `masters` covered by \bmasters?\b.
  [/\bmba\b/i, "master"],
  [/\bm\.b\.a\b/i, "master"],
  [/\bmasters?\b/i, "master"],
  [/\bm\.?\s*sc\b/i, "master"],
  [/\bm\.?\s*eng\b/i, "master"],
  [/\bm\.?\s*s\b/i, "master"],
  [/\bm\.?\s*a\b/i, "master"],
  // master — Chinese (硕士 = master)
  [/硕士|碩士/u, "master"],
  // bachelor — English
  [/\bbachelors?\b/i, "bachelor"],
  [/\bb\.?\s*sc\b/i, "bachelor"],
  [/\bb\.?\s*eng\b/i, "bachelor"],
  [/\bb\.?\s*a\b/i, "bachelor"],
  [/\bb\.?\s*s\b/i, "bachelor"],
  [/\bundergrad(?:uate)?\b/i, "bachelor"],
  // bachelor — Chinese (学士 = bachelor; 本科 = undergrad program;
  // 大学本科 also common). Negative lookbehind excludes 副学士/副學士
  // (associate degree, mapped to high_school further down).
  [/(?<!副)(学士|學士)/u, "bachelor"],
  [/本科/u, "bachelor"],
  // high school (specific phrase first so `high school diploma` lands here
  // rather than going through generic `diploma`)
  [/\bhigh school\b/i, "high_school"],
  [/\bsecondary school\b/i, "high_school"],
  [/\bdiplomas?\b/i, "high_school"],
  // high school + vocational — Chinese
  //   高中 = senior high; 中专/中專 = secondary vocational
  //   大专/大專/专科/專科 = junior college (3yr post-HS vocational)
  //   副学士/副學士 = associate degree
  //   高职/高職/職高 = vocational high school
  //   技校 = technical school
  //   文凭/文憑 = diploma (matches plain "文凭" or "高级文凭")
  [
    /高中|中专|中專|大专|大專|专科|專科|副学士|副學士|高职|高職|職高|技校|文凭|文憑/u,
    "high_school",
  ],
];

function mapDegreeToLevel(degree: string): EduLevel {
  if (!degree) return "other";
  for (const [pattern, level] of DEGREE_PATTERNS) {
    if (pattern.test(degree)) return level;
  }
  return "other";
}

function buildTierReasoning(args: {
  eduLevel: "high_school" | "bachelor" | "master" | "phd" | "other";
  seniority: ResumeData["seniority"];
  currentTier: number;
  aspirationalTier: number;
  titleOverrideApplied: boolean;
}): string {
  const parts: string[] = [];
  if (args.eduLevel !== "other") parts.push(`education: ${args.eduLevel}`);
  if (args.seniority !== "unknown") parts.push(`seniority: ${args.seniority}`);
  if (args.titleOverrideApplied) parts.push("title-keyword override");
  parts.push(
    `current Job Zone ${args.currentTier}, aspirational ${args.aspirationalTier}`,
  );
  return parts.join("; ");
}

/**
 * Infer the user's O*NET Job Zone target band from their resume.
 *
 * Returns `null` when there's not enough signal (no education + no seniority
 * + no recognizable titles) — caller falls back to the white-collar default
 * `{min: 4, max: 5}`.
 */
export function inferTargetTier(
  resume: ResumeData,
): import("./types").UserTargetTier | null {
  const eduLatest = resume.education[0];
  const hasEducation = !!eduLatest;
  const eduLevel = mapDegreeToLevel(eduLatest?.degree ?? "");

  const titles = resume.experience.map((e) => e.title || "");
  const hasTitle = titles.some((t) => t.length > 0);

  if (!hasEducation && !hasTitle && resume.seniority === "unknown") {
    return null;
  }

  let currentTier = tierFromEducation(eduLevel);
  currentTier += seniorityAdjustment(resume.seniority);

  const beforeOverride = currentTier;
  currentTier = applyTitleOverrides(currentTier, titles);
  const titleOverrideApplied = currentTier !== beforeOverride;

  currentTier = Math.max(2, Math.min(5, currentTier));

  const aspirationalTier = Math.min(5, currentTier + 1);
  const min = Math.max(2, currentTier - 1);
  const max = aspirationalTier;

  const confidence = tierConfidence(
    hasEducation,
    resume.seniority !== "unknown",
    titleOverrideApplied,
  );

  const reasoning = buildTierReasoning({
    eduLevel,
    seniority: resume.seniority,
    currentTier,
    aspirationalTier,
    titleOverrideApplied,
  });

  return {
    currentTier,
    aspirationalTier,
    min,
    max,
    confidence,
    reasoning,
  };
}

// ========== Main Matching Function ==========

const ALIGNMENT_THRESHOLD = 20; // Both resume and assessment score > 20 in same dimension
const CONFLICT_THRESHOLD = 30; // Resume signal > 30 but assessment < 30, or vice versa

/**
 * Match resume data against assessment results.
 *
 * Produces:
 *   - alignedDimensions: where resume evidence supports assessment scores
 *   - conflictingDimensions: where resume diverges from assessment (surfaced as insight, not correction)
 *   - autoFillRealConditions: fields that can be auto-populated from resume
 */
export function matchResumeToAssessment(
  resume: ResumeData,
  assessment: AssessmentResult,
): ResumeMatchResult {
  const resumeRIASEC = inferRIASECFromResume(resume);
  const assessmentRIASEC = assessment.riasecNormalized;

  const aligned: AlignedDimension[] = [];
  const conflicting: ConflictingDimension[] = [];

  for (const dim of Object.keys(resumeRIASEC) as RIASECDimension[]) {
    const resumeScore = resumeRIASEC[dim];
    const assessmentScore = assessmentRIASEC[dim];
    const signals = RIASEC_SIGNALS[dim];

    // Skip dimensions with no meaningful resume signal
    if (resumeScore < 10) continue;

    // Both scores are meaningful → alignment
    if (
      resumeScore >= ALIGNMENT_THRESHOLD &&
      assessmentScore >= ALIGNMENT_THRESHOLD
    ) {
      aligned.push({
        dimension: `${signals.label_en} (${dim})`,
        assessmentSignal: `Assessment score: ${assessmentScore}`,
        resumeEvidence: buildResumeEvidenceString(resume, dim),
        confidenceBoost: Math.min(0.1, resumeScore / 1000), // Max +10% boost
      });
    }
    // Resume strong, assessment weak → tension insight
    else if (
      resumeScore >= CONFLICT_THRESHOLD &&
      assessmentScore < CONFLICT_THRESHOLD
    ) {
      conflicting.push({
        dimension: `${signals.label_en} (${dim})`,
        assessmentSignal: `Assessment score: ${assessmentScore} (low)`,
        resumeEvidence: buildResumeEvidenceString(resume, dim),
        tensionInsight_zh: `你的经历显示你在"${signals.label_zh}"方面有丰富经验，但你的内在倾向并没有强烈指向这个方向——这种张力本身值得探索。也许你已经在这个领域积累了能力，但内心正在寻找新的可能性。`,
        tensionInsight_en: `Your experience shows significant background in "${signals.label_en}", but your inner inclinations don't strongly point this way — this tension itself is worth exploring. Perhaps you've built capability here, but your heart is searching for new possibilities.`,
      });
    }
    // Assessment strong, resume weak → also a tension (chose a different career path than assessment suggests)
    else if (
      assessmentScore >= CONFLICT_THRESHOLD &&
      resumeScore < CONFLICT_THRESHOLD &&
      assessmentScore >= 50
    ) {
      conflicting.push({
        dimension: `${signals.label_en} (${dim})`,
        assessmentSignal: `Assessment score: ${assessmentScore} (high)`,
        resumeEvidence: `Little resume evidence in this area`,
        tensionInsight_zh: `你的内在评估显示你在"${signals.label_zh}"方面有强烈倾向，但你过往的职业经历尚未充分体现这个方向——这可能意味着一个值得探索的新领域。`,
        tensionInsight_en: `Your assessment shows a strong inclination toward "${signals.label_en}", but your career history hasn't fully reflected this direction — this could point to a new area worth exploring.`,
      });
    }
  }

  const autoFill = buildAutoFillConditions(resume);

  // Build summaries
  const alignedCount = aligned.length;
  const conflictCount = conflicting.length;

  const summary_zh =
    alignedCount > 0 && conflictCount === 0
      ? `你的简历与评估结果高度一致，涉及${alignedCount}个维度的匹配。`
      : conflictCount > 0 && alignedCount === 0
        ? `发现${conflictCount}个有趣的张力点——你的经历和内在倾向之间的差异值得深入探索。`
        : alignedCount > 0 && conflictCount > 0
          ? `你的简历与评估在${alignedCount}个维度上一致，同时发现${conflictCount}个值得探索的张力点。`
          : "简历解析完成。";

  const summary_en =
    alignedCount > 0 && conflictCount === 0
      ? `Your resume aligns well with your assessment across ${alignedCount} dimension${alignedCount > 1 ? "s" : ""}.`
      : conflictCount > 0 && alignedCount === 0
        ? `Found ${conflictCount} interesting tension point${conflictCount > 1 ? "s" : ""} — the gap between your experience and inner inclinations is worth exploring.`
        : alignedCount > 0 && conflictCount > 0
          ? `Your resume aligns with your assessment in ${alignedCount} dimension${alignedCount > 1 ? "s" : ""}, with ${conflictCount} tension point${conflictCount > 1 ? "s" : ""} worth exploring.`
          : "Resume analysis complete.";

  const userTargetTier = inferTargetTier(resume);

  return {
    alignedDimensions: aligned,
    conflictingDimensions: conflicting,
    autoFillRealConditions: autoFill,
    summary_zh,
    summary_en,
    ...(userTargetTier ? { userTargetTier } : {}),
  };
}

// ========== Helpers ==========

/**
 * Build a human-readable evidence string from resume data for a given RIASEC dimension.
 */
function buildResumeEvidenceString(
  resume: ResumeData,
  dim: RIASECDimension,
): string {
  const signals = RIASEC_SIGNALS[dim];
  const evidence: string[] = [];

  // Matching job titles
  for (const exp of resume.experience) {
    const titleLower = (exp.title || "").toLowerCase();
    for (const kw of signals.titleKeywords) {
      if (titleLower.includes(kw)) {
        evidence.push(`${exp.title} at ${exp.company || "Unknown"}`);
        break;
      }
    }
  }

  // Matching skills
  const matchedSkills = resume.skills.filter((s) =>
    signals.skillKeywords.some((kw) => s.toLowerCase().includes(kw)),
  );
  if (matchedSkills.length > 0) {
    evidence.push(`Skills: ${matchedSkills.slice(0, 3).join(", ")}`);
  }

  // Matching industries
  const matchedIndustries = resume.industries.filter((i) =>
    signals.industryKeywords.some((kw) => i.toLowerCase().includes(kw)),
  );
  if (matchedIndustries.length > 0) {
    evidence.push(`Industry: ${matchedIndustries.join(", ")}`);
  }

  return evidence.length > 0 ? evidence.join("; ") : "General resume signals";
}
