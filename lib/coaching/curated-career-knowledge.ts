export const DEFAULT_COACHING_KNOWLEDGE_VERSION = "2026-06-10";

export function buildCuratedCareerKnowledgeContext(
  locale: string,
  versionDate = DEFAULT_COACHING_KNOWLEDGE_VERSION,
): string {
  if (locale === "zh") {
    return `## 精选职业决策知识（版本 ${versionDate}）
- 比较职业时优先比较重复性任务、决策权、协作方式、工作环境和进入门槛，不只比较职位名称。
- 证据强度依次为：用户真实经历与成果、JD 明确要求、可迁移技能、画像推断。不要把画像推断包装成事实。
- 不确定性高时，优先推荐可逆的小实验，例如信息访谈、作品样例或短期项目，而不是要求用户立即做高成本承诺。
- 薪资、签证、招聘趋势和岗位供需属于动态事实；没有带日期的可靠来源时必须明确说未知。`;
  }

  return `## Curated career decision knowledge (version ${versionDate})
- Compare recurring tasks, decision authority, collaboration, work environment, and entry requirements before comparing job titles.
- Evidence strength runs from lived achievements, to explicit JD requirements, to transferable skills, to profile inference. Never present profile inference as fact.
- When uncertainty is high, prefer reversible tests such as informational interviews, work samples, or short projects over high-cost commitments.
- Salary, visa, hiring trends, and labor demand are dynamic facts. Mark them unknown without a dated reliable source.`;
}
