// ============================================================
// Golden conversations — Chinese coaching quality fixtures
// ============================================================

export const GOLDEN_CONVERSATION_CATEGORIES = [
  "unclear_confusion",
  "report_pushback",
  "ai_anxiety",
  "reality_constraints",
  "jd_offer_analysis",
  "career_transition_hesitation",
  "coach_quality_complaint",
  "action_review_failed",
] as const;

export type GoldenConversationCategory =
  (typeof GOLDEN_CONVERSATION_CATEGORIES)[number];

export interface GoldenConversationScenario {
  id: string;
  category: GoldenConversationCategory;
  locale: "zh";
  userInput: string;
  mustAnswerActualQuestion: string;
  mustCiteEvidence: string[];
  forbiddenAbstractPhrases: string[];
  expectedRubric: {
    mustDo: string[];
    mustNotDo: string[];
    passCriteria: string[];
  };
}

export const goldenConversations: GoldenConversationScenario[] = [
  {
    id: "zh-unclear-confusion-001",
    category: "unclear_confusion",
    locale: "zh",
    userInput: "我现在就是很迷茫，不知道自己到底适合什么，也说不清哪里卡住。",
    mustAnswerActualQuestion: "先说明迷茫可能来自信息太多但判断标准不清，而不是用户没有方向。",
    mustCiteEvidence: ["很迷茫", "说不清哪里卡住"],
    forbiddenAbstractPhrases: ["探索内在方向", "找到真正的自己", "开启一段旅程"],
    expectedRubric: {
      mustDo: ["引用用户原话", "给出一个可验证假设", "最多问一个问题"],
      mustNotDo: ["直接推荐职业", "泛泛鼓励", "连续追问多个维度"],
      passCriteria: ["先回答迷茫的可能原因，再问一个用于定位卡点的具体问题"],
    },
  },
  {
    id: "zh-report-pushback-001",
    category: "report_pushback",
    locale: "zh",
    userInput: "报告说我适合产品策略，但我完全不认同，我觉得我并不擅长影响别人。",
    mustAnswerActualQuestion: "先承认报告和自我感受冲突，并解释可能是报告看到的是潜在适配而非当前熟练度。",
    mustCiteEvidence: ["产品策略", "不擅长影响别人"],
    forbiddenAbstractPhrases: ["报告只是一个镜子", "保持开放", "继续探索这个张力"],
    expectedRubric: {
      mustDo: ["区分适配度和熟练度", "引用报告对象", "邀请用户验证一个具体反例"],
      mustNotDo: ["替报告辩护", "要求用户接受结论", "只共情不解释"],
      passCriteria: ["解释冲突来源，并问用户影响别人最失败的一次具体场景"],
    },
  },
  {
    id: "zh-ai-anxiety-001",
    category: "ai_anxiety",
    locale: "zh",
    userInput: "我真的很怕 AI 以后把我的价值全部替代掉，我学什么都像是在倒计时。",
    mustAnswerActualQuestion: "先说明恐惧的核心是职业价值被压缩成可替代技能，而不是简单怕技术。",
    mustCiteEvidence: ["价值全部替代", "倒计时"],
    forbiddenAbstractPhrases: ["拥抱变化", "提升不可替代性", "AI 是工具"],
    expectedRubric: {
      mustDo: ["命名用户脑中的具体灾难画面", "避免轻率安慰", "只问一个关于倒计时画面的具体问题"],
      mustNotDo: ["预测哪些职业不会被替代", "建议马上学 AI 工具", "心理治疗化表达"],
      passCriteria: ["把 AI 焦虑拆成价值假设/时间假设/能力假设之一，并停在一个具体问题"],
    },
  },
  {
    id: "zh-reality-constraints-001",
    category: "reality_constraints",
    locale: "zh",
    userInput: "我不是不想转行，是我现在有房租压力，签证也只剩半年，家里还希望我稳定。",
    mustAnswerActualQuestion: "先说明这不是意愿问题，而是风险承受空间被房租、签证和家庭期待压缩。",
    mustCiteEvidence: ["房租压力", "签证只剩半年", "家里希望稳定"],
    forbiddenAbstractPhrases: ["追随热爱", "突破限制", "勇敢选择"],
    expectedRubric: {
      mustDo: ["把现实约束当作决策条件", "避免理想主义建议", "提出一个低风险验证方向"],
      mustNotDo: ["建议裸辞", "忽略签证", "把家庭期待说成借口"],
      passCriteria: ["回应现实约束如何改变决策，再问最硬的约束是哪一个"],
    },
  },
  {
    id: "zh-jd-offer-analysis-001",
    category: "jd_offer_analysis",
    locale: "zh",
    userInput: "这个 offer 是增长运营，薪资还行，但 JD 里全是拉新转化复盘，我怕进去以后很消耗。",
    mustAnswerActualQuestion: "先回答这个 offer 的风险点在于工作内容可能长期围绕指标压力和重复复盘。",
    mustCiteEvidence: ["增长运营", "拉新转化复盘", "很消耗"],
    forbiddenAbstractPhrases: ["看你内心真正想要什么", "机会都有两面", "探索职业方向"],
    expectedRubric: {
      mustDo: ["直接分析 JD 风险", "引用具体职责", "给出需要补充验证的一个信息"],
      mustNotDo: ["只问感觉", "直接说接或不接", "忽略薪资还行这个现实因素"],
      passCriteria: ["先判断风险类型，再问用户最怕消耗的是指标压力还是重复性"],
    },
  },
  {
    id: "zh-transition-hesitation-001",
    category: "career_transition_hesitation",
    locale: "zh",
    userInput: "我想从咨询转到用户研究，但又怕之前几年经验全浪费，重新开始太亏。",
    mustAnswerActualQuestion: "先说明犹豫来自沉没成本和可迁移能力尚未被看见。",
    mustCiteEvidence: ["咨询", "用户研究", "几年经验全浪费"],
    forbiddenAbstractPhrases: ["人生没有白走的路", "转型是一场探索", "相信你的积累"],
    expectedRubric: {
      mustDo: ["指出咨询到用户研究的可迁移能力假设", "承认亏损感", "问一个经验迁移的具体证据"],
      mustNotDo: ["空泛安慰", "直接鼓励转行", "忽略重新开始成本"],
      passCriteria: ["先解释为什么觉得亏，再提出一个待验证的迁移能力"],
    },
  },
  {
    id: "zh-coach-quality-complaint-001",
    category: "coach_quality_complaint",
    locale: "zh",
    userInput: "你刚才说得太抽象了，我问的是为什么我会这样，不是要你总结一堆模式。",
    mustAnswerActualQuestion: "先诊断失败原因：上一轮没有先回答为什么，而是用模式语言替代了具体解释。",
    mustCiteEvidence: ["太抽象", "为什么我会这样", "总结一堆模式"],
    forbiddenAbstractPhrases: ["我理解你的感受", "这是一个重要反馈", "我们可以更深入探索"],
    expectedRubric: {
      mustDo: ["承认具体失败点", "直接回答为什么", "说明下一句会如何变具体"],
      mustNotDo: ["继续共情但不诊断", "防御性解释", "再问用户想聊什么"],
      passCriteria: ["第一段必须是具体诊断，不超过一个问题"],
    },
  },
  {
    id: "zh-action-review-failed-001",
    category: "action_review_failed",
    locale: "zh",
    userInput: "上次说这周要约人聊聊，但我完全没做，一想到开口就拖延。",
    mustAnswerActualQuestion: "先说明没做的阻力可能不是懒，而是开口这一步暴露了被拒绝或打扰别人的担心。",
    mustCiteEvidence: ["约人聊聊", "完全没做", "一想到开口就拖延"],
    forbiddenAbstractPhrases: ["行动力不足", "建立习惯", "迈出第一步"],
    expectedRubric: {
      mustDo: ["复盘行动未完成的阻力", "提炼可验证模式", "调整成更小行动"],
      mustNotDo: ["责备拖延", "直接加油", "制定过大的新计划"],
      passCriteria: ["先解释阻力，再共创一个 7 天内更小的开口动作"],
    },
  },
];
