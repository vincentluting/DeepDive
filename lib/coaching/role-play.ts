// ============================================================
// Coaching role-play scenarios — short career conversation simulations
// ============================================================

import { z } from "zod/v4";

export const ROLE_PLAY_SCENARIO_IDS = [
  "explain_career_to_parents",
  "manager_career_growth",
  "offer_negotiation",
  "interview_intro",
  "decline_bad_fit",
  "explain_transition",
  "ai_anxiety_reframe",
] as const;

export type RolePlayScenarioId = (typeof ROLE_PLAY_SCENARIO_IDS)[number];

interface LocalizedText {
  zh: string;
  en: string;
}

export interface RolePlayScenario {
  id: RolePlayScenarioId;
  title: LocalizedText;
  setting: string;
  userGoal: string;
  aiRole: string;
  rounds: { min: 2; max: 4 };
}

export const RolePlayFeedbackSchema = z.object({
  expressionClarity: z.number().int().min(1).max(5),
  valuesAlignment: z.number().int().min(1).max(5),
  avoidancePoints: z.array(z.string()),
  nextPracticeSuggestion: z.string(),
});

export type RolePlayFeedback = z.infer<typeof RolePlayFeedbackSchema>;

export const rolePlayScenarios: RolePlayScenario[] = [
  {
    id: "explain_career_to_parents",
    title: { zh: "和父母解释职业选择", en: "Explain a career choice to parents" },
    setting: "用户需要向父母解释一个不完全传统、但对自己更合适的职业选择。",
    userGoal: "表达选择背后的现实判断和长期价值，不陷入防御。",
    aiRole: "扮演关心稳定、会追问风险的父母。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "manager_career_growth",
    title: { zh: "和 manager 谈职业发展", en: "Discuss career growth with a manager" },
    setting: "用户准备和直属 manager 谈下一阶段成长、职责和支持。",
    userGoal: "清楚表达想发展什么能力，以及需要什么机会。",
    aiRole: "扮演时间有限、关心业务结果的 manager。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "offer_negotiation",
    title: { zh: "offer 谈判", en: "Offer negotiation" },
    setting: "用户已经拿到 offer，但希望就薪资、职责或入职条件做一次谈判。",
    userGoal: "表达诉求和理由，同时保持合作姿态。",
    aiRole: "扮演谨慎但愿意沟通的招聘方或 hiring manager。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "interview_intro",
    title: { zh: "面试自我介绍", en: "Interview self-introduction" },
    setting: "用户需要在面试开场 60-90 秒内介绍自己。",
    userGoal: "把经历、优势和目标岗位连接成清晰叙事。",
    aiRole: "扮演面试官，追问介绍里最模糊的一点。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "decline_bad_fit",
    title: { zh: "拒绝不合适机会", en: "Decline a poor-fit opportunity" },
    setting: "用户需要拒绝一个不适合但关系上不想伤害对方的机会。",
    userGoal: "礼貌、清晰地拒绝，并保留关系。",
    aiRole: "扮演希望说服用户接受机会的对方。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "explain_transition",
    title: { zh: "解释转行原因", en: "Explain a career transition" },
    setting: "用户需要解释为什么从旧领域转向新方向。",
    userGoal: "把转行动机说成连续成长，而不是逃离或否定过去。",
    aiRole: "扮演怀疑转行动机是否稳定的面试官。",
    rounds: { min: 2, max: 4 },
  },
  {
    id: "ai_anxiety_reframe",
    title: { zh: "AI 时代职业焦虑重构", en: "Reframe AI-era career anxiety" },
    setting: "用户需要练习把“会被 AI 替代”的焦虑说成可讨论的职业策略问题。",
    userGoal: "表达担忧，同时说出自己仍有价值的工作部分。",
    aiRole: "扮演追问具体风险和人类价值的职业对话伙伴。",
    rounds: { min: 2, max: 4 },
  },
];

function scenarioById(id: RolePlayScenarioId): RolePlayScenario {
  const scenario = rolePlayScenarios.find((item) => item.id === id);
  if (!scenario) {
    throw new Error(`Unknown role-play scenario: ${id}`);
  }
  return scenario;
}

export function buildRolePlaySystemPrompt(params: {
  scenarioId: RolePlayScenarioId;
  locale: string;
}): string {
  const scenario = scenarioById(params.scenarioId);
  const title = params.locale === "zh" ? scenario.title.zh : scenario.title.en;
  const languageRule =
    params.locale === "zh"
      ? "全程使用中文。"
      : "Use English throughout the simulation.";

  return `## Role-play Scenario: ${title}
${languageRule}

场景设定：${scenario.setting}
用户目标：${scenario.userGoal}
AI 扮演角色：${scenario.aiRole}

模拟规则：
- 进行 2-4 轮短模拟；每一轮只扮演场景中的对方，不要跳出角色讲课。
- 每轮只提出一个自然追问或回应。
- 当完成 2-4 轮后，停止模拟并输出反馈报告。

反馈报告必须包含：
- 表达清晰度：1-5 分，并指出一句最清楚或最模糊的表达。
- 价值观一致性：1-5 分，说明用户表达是否和他们的职业价值一致。
- 回避点：指出用户绕开的一个具体点。
- 下一次练习建议：给一个可重复练习的小任务。`;
}
