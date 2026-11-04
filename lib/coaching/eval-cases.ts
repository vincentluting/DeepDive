// ============================================================
// Coaching V2 Golden Cases — bilingual routing evaluation set
//
// One hundred realistic user turns covering the five adaptive modes in
// English and Chinese. Kept as product fixtures so routing regressions can
// be measured independently from LLM response variability.
// ============================================================

import type { CoachingMode, DesiredHelp } from "./conversation-router";

export interface CoachingGoldenCase {
  id: string;
  locale: "en" | "zh";
  input: string;
  expectedMode: CoachingMode;
  expectedHelp: DesiredHelp;
  coreIncludes: string;
}

interface CaseSeed {
  input: string;
  coreIncludes: string;
  expectedHelp?: DesiredHelp;
}

const EN_CASES: Record<CoachingMode, CaseSeed[]> = {
  explore: [
    { input: "I keep losing interest after six months in a role. Why does that happen?", coreIncludes: "Why does that happen" },
    { input: "My report says autonomy matters to me, but I also like structure. Help me understand that tension.", coreIncludes: "understand that tension" },
    { input: "I don't know what kind of work I actually enjoy anymore.", coreIncludes: "what kind of work" },
    { input: "Why do I feel energized by projects but drained by maintenance work?", coreIncludes: "Why do I feel energized" },
    { input: "I want to understand why promotions have never motivated me.", coreIncludes: "why promotions" },
    { input: "Something about the creative direction in my report feels right, but I can't explain why.", coreIncludes: "can't explain why" },
    { input: "I notice I always become the mediator on teams. What does that say about me?", coreIncludes: "What does that say" },
    { input: "Help me explore whether I dislike my company or the whole field.", coreIncludes: "dislike my company" },
    { input: "I have several interests and none feels like the obvious career identity.", coreIncludes: "obvious career identity" },
    { input: "Why do I ask for freedom and then feel anxious when no one gives direction?", coreIncludes: "Why do I ask" },
  ],
  decide: [
    { input: "Should I accept the startup offer or stay at my stable job?", coreIncludes: "Should I accept" },
    { input: "Which option would you recommend: product strategy or UX research?", coreIncludes: "Which option" },
    { input: "I have two offers. Help me decide between higher pay and better mentorship.", coreIncludes: "Help me decide" },
    { input: "Be direct: do you think I should leave consulting this year?", coreIncludes: "should leave consulting" },
    { input: "Would you choose the remote role or the leadership role for someone like me?", coreIncludes: "Would you choose" },
    { input: "Compare these two paths and tell me which one is the better bet.", coreIncludes: "which one" },
    { input: "Should I take a pay cut to enter climate tech?", coreIncludes: "Should I take" },
    { input: "I need a recommendation on whether to pursue management or remain an expert.", coreIncludes: "recommendation" },
    { input: "Do I accept the promotion if it means managing ten people?", coreIncludes: "accept the promotion" },
    { input: "Tell me honestly which career direction from my report is strongest.", coreIncludes: "which career direction" },
  ],
  act: [
    { input: "Help me build a seven-day action plan for testing UX research.", coreIncludes: "action plan" },
    { input: "What should I do next to move into product management?", coreIncludes: "What should I do next" },
    { input: "Give me a practical roadmap for changing careers without quitting.", coreIncludes: "practical roadmap" },
    { input: "How do I start validating whether data analysis fits me?", coreIncludes: "How do I start" },
    { input: "Turn this insight into three concrete actions for next week.", coreIncludes: "concrete actions" },
    { input: "I need a plan for talking to people in the industry.", coreIncludes: "plan for talking" },
    { input: "Create a next-step plan that fits around my full-time job.", coreIncludes: "next-step plan" },
    { input: "What is the smallest experiment I can run this week?", coreIncludes: "experiment" },
    { input: "Help me plan how to close my skill gap before applying.", coreIncludes: "plan how" },
    { input: "I want an execution plan, not more reflection.", coreIncludes: "execution plan" },
  ],
  support: [
    { input: "I'm burned out and honestly just need to vent for a minute.", coreIncludes: "need to vent", expectedHelp: "listen" },
    { input: "I feel overwhelmed by all these career choices.", coreIncludes: "overwhelmed" },
    { input: "I'm scared that changing careers will ruin my finances.", coreIncludes: "scared" },
    { input: "I feel hopeless after another rejection.", coreIncludes: "hopeless" },
    { input: "Please just listen. I am exhausted from pretending this job is fine.", coreIncludes: "just listen", expectedHelp: "listen" },
    { input: "The thought of going back to work on Monday makes me anxious.", coreIncludes: "anxious" },
    { input: "I feel stuck and ashamed that I still don't know what I want.", coreIncludes: "ashamed" },
    { input: "I'm under so much pressure from my family to choose a safe career.", coreIncludes: "pressure" },
    { input: "I can't handle another long analysis right now. I'm too tired.", coreIncludes: "too tired" },
    { input: "Everything about this decision feels heavy and frightening.", coreIncludes: "frightening" },
  ],
  job_analysis: [
    { input: "[JOB_DESCRIPTION] Senior Product Manager. Responsibilities include roadmap ownership and stakeholder management.", coreIncludes: "JOB_DESCRIPTION", expectedHelp: "information" },
    { input: "Can you analyze this job description for a policy analyst role?", coreIncludes: "job description" },
    { input: "Here is the JD for a UX researcher. Does the role fit my profile?", coreIncludes: "fit my profile" },
    { input: "I received an offer and these are the responsibilities: lead a team of six and own revenue targets.", coreIncludes: "responsibilities" },
    { input: "Analyze the qualifications for this sustainability consultant position.", coreIncludes: "qualifications" },
    { input: "This role requires frequent travel and client sales. What are the fit risks?", coreIncludes: "fit risks" },
    { input: "Please review this vacancy: remote data analyst, SQL required, little teamwork.", coreIncludes: "review this vacancy" },
    { input: "Does this job description conflict with my need for autonomy?", coreIncludes: "job description" },
    { input: "I pasted the hiring requirements below. Tell me where my evidence is weak.", coreIncludes: "requirements" },
    { input: "Compare my profile with this JD for a program director.", coreIncludes: "this JD" },
  ],
};

const ZH_CASES: Record<CoachingMode, CaseSeed[]> = {
  explore: [
    { input: "我每份工作做半年就失去兴趣，这到底是为什么？", coreIncludes: "为什么" },
    { input: "报告说我重视自主，但我又很依赖明确结构，帮我理解这个矛盾。", coreIncludes: "理解这个矛盾" },
    { input: "我已经不知道自己真正喜欢什么工作了。", coreIncludes: "喜欢什么工作" },
    { input: "为什么做新项目让我兴奋，维护工作却让我很累？", coreIncludes: "为什么" },
    { input: "我想理解为什么升职从来不能激励我。", coreIncludes: "为什么升职" },
    { input: "报告里的创意方向让我有共鸣，但我说不清原因。", coreIncludes: "说不清原因" },
    { input: "我在团队里总会变成调解人，这说明了什么？", coreIncludes: "说明了什么" },
    { input: "帮我探索一下，我讨厌的是公司还是整个行业。", coreIncludes: "公司还是整个行业" },
    { input: "我的兴趣很多，但没有一个像明确的职业身份。", coreIncludes: "职业身份" },
    { input: "为什么我想要自由，没人给方向时又会焦虑？", coreIncludes: "为什么" },
  ],
  decide: [
    { input: "我该不该接受创业公司的 offer，还是留在稳定的大公司？", coreIncludes: "该不该" },
    { input: "产品策略和用户研究，你推荐我选哪个？", coreIncludes: "选哪个" },
    { input: "两个 offer，一个工资高一个导师好，帮我决定。", coreIncludes: "帮我决定" },
    { input: "直接一点，你觉得我今年应该离开咨询行业吗？", coreIncludes: "应该离开" },
    { input: "远程岗位和管理岗位，如果是我你会选哪个？", coreIncludes: "选哪个" },
    { input: "比较这两条路，告诉我哪一个更值得押注。", coreIncludes: "哪一个" },
    { input: "我该不该降薪进入气候科技行业？", coreIncludes: "该不该" },
    { input: "我需要一个建议：走管理还是继续做专家？", coreIncludes: "建议" },
    { input: "如果升职意味着管理十个人，我要不要接受？", coreIncludes: "要不要" },
    { input: "坦白告诉我，报告里的哪个职业方向最值得优先考虑？", coreIncludes: "哪个职业方向" },
  ],
  act: [
    { input: "帮我制定一个七天行动计划，验证用户研究是否适合我。", coreIncludes: "行动计划" },
    { input: "想转产品经理，我下一步应该做什么？", coreIncludes: "下一步" },
    { input: "给我一份不辞职也能转行的现实路线图。", coreIncludes: "路线图" },
    { input: "我该怎么开始验证数据分析是否适合我？", coreIncludes: "怎么开始" },
    { input: "把这个洞察变成下周能做的三个具体行动。", coreIncludes: "具体行动" },
    { input: "我需要一个联系行业从业者的计划。", coreIncludes: "计划" },
    { input: "帮我做一个能兼顾全职工作的下一步方案。", coreIncludes: "下一步方案" },
    { input: "这周我可以执行的最小实验是什么？", coreIncludes: "实验" },
    { input: "帮我规划申请前怎么补上技能差距。", coreIncludes: "规划" },
    { input: "我需要执行计划，不想继续反思了。", coreIncludes: "执行计划" },
  ],
  support: [
    { input: "我真的倦怠了，现在只想倾诉一下。", coreIncludes: "倾诉", expectedHelp: "listen" },
    { input: "这么多职业选择让我压力很大。", coreIncludes: "压力" },
    { input: "我很害怕转行会毁掉我的经济状况。", coreIncludes: "害怕" },
    { input: "又一次被拒绝以后，我觉得很无助。", coreIncludes: "无助" },
    { input: "先听我说，不要分析。我已经装作喜欢这份工作很久了。", coreIncludes: "先听我说", expectedHelp: "listen" },
    { input: "想到周一又要上班，我就很焦虑。", coreIncludes: "焦虑" },
    { input: "我很迷茫，也很羞愧自己还不知道想要什么。", coreIncludes: "迷茫" },
    { input: "家里逼我选稳定职业，我现在压力特别大。", coreIncludes: "压力" },
    { input: "我现在太累了，承受不了又一轮长篇分析。", coreIncludes: "太累" },
    { input: "这个决定的每一部分都让我害怕。", coreIncludes: "害怕" },
  ],
  job_analysis: [
    { input: "[JOB_DESCRIPTION] 高级产品经理，负责路线图和跨部门协作。", coreIncludes: "JOB_DESCRIPTION", expectedHelp: "information" },
    { input: "能帮我分析一下政策分析师的职位描述吗？", coreIncludes: "职位描述" },
    { input: "这是用户研究员的 JD，这个岗位适合我的画像吗？", coreIncludes: "适合我的画像" },
    { input: "我收到一个 offer，岗位职责是带六个人并承担营收目标。", coreIncludes: "岗位职责" },
    { input: "分析一下这个可持续发展顾问岗位的招聘要求。", coreIncludes: "招聘要求" },
    { input: "这个职位经常出差并需要客户销售，匹配风险是什么？", coreIncludes: "匹配风险" },
    { input: "看看这个岗位：远程数据分析师，要求 SQL，团队合作很少。", coreIncludes: "看看这个岗位" },
    { input: "这个职位描述会不会和我对自主性的需要冲突？", coreIncludes: "职位描述" },
    { input: "我把招聘要求贴在下面，告诉我哪些证据不足。", coreIncludes: "招聘要求" },
    { input: "把我的画像和这个项目总监 JD 比较一下。", coreIncludes: "JD" },
  ],
};

function flattenCases(
  locale: "en" | "zh",
  groups: Record<CoachingMode, CaseSeed[]>,
): CoachingGoldenCase[] {
  return (Object.entries(groups) as Array<[CoachingMode, CaseSeed[]]>).flatMap(
    ([mode, cases]) =>
      cases.map((item, index) => ({
        id: `${locale}-${mode}-${String(index + 1).padStart(2, "0")}`,
        locale,
        input: item.input,
        expectedMode: mode,
        expectedHelp:
          item.expectedHelp ??
          (mode === "decide"
            ? "recommend"
            : mode === "act"
              ? "plan"
              : "analyze"),
        coreIncludes: item.coreIncludes,
      })),
  );
}

export const COACHING_GOLDEN_CASES: CoachingGoldenCase[] = [
  ...flattenCases("en", EN_CASES),
  ...flattenCases("zh", ZH_CASES),
];
