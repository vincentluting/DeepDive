import type { ResumeMatchRow } from "@/lib/db/resume-match";

function compact(values: string[], limit: number): string {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join("; ");
}

export function buildResumeEvidenceContext(
  resumeMatch: ResumeMatchRow | null,
  locale: string,
): string {
  if (!resumeMatch) return "";

  const isZh = locale === "zh";
  const resume = resumeMatch.resumeData;
  const match = resumeMatch.matchResult;
  const aligned = compact(
    match.alignedDimensions.map(
      (item) => `${item.dimension}: ${item.resumeEvidence}`,
    ),
    4,
  );
  const conflicts = compact(
    match.conflictingDimensions.map((item) =>
      isZh ? item.tensionInsight_zh : item.tensionInsight_en,
    ),
    3,
  );
  const skills = compact(resume.skills, 12);
  const industries = compact(resume.industries, 6);
  const summary = isZh ? match.summary_zh : match.summary_en;

  return isZh
    ? `## 用户提供的职业证据（简历匹配）
摘要：${summary}
资历：${resume.yearsOfExperience} 年经验，当前层级 ${resume.seniority}
技能：${skills || "未提取"}
行业：${industries || "未提取"}
有证据支持的匹配：${aligned || "暂无明确证据"}
需要核实的张力或差距：${conflicts || "暂无明确冲突"}
使用规则：把这些内容当作用户提供的现实证据，不要把简历空白解释为能力缺失；若与用户当前陈述冲突，以用户当前陈述为准。`
    : `## User-provided career evidence (resume match)
Summary: ${summary}
Experience: ${resume.yearsOfExperience} years, current seniority ${resume.seniority}
Skills: ${skills || "not extracted"}
Industries: ${industries || "not extracted"}
Evidence-backed alignment: ${aligned || "no strong evidence yet"}
Tensions or gaps to verify: ${conflicts || "no explicit conflict"}
Usage rule: Treat this as user-provided real-world evidence. Do not interpret a resume omission as lack of ability; if it conflicts with the user's current statement, the current statement wins.`;
}
