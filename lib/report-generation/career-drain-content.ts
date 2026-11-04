// ============================================================
// Career Drain Content Library — Pure Algorithmic Replacement
//
// Replaces the LLM call in career-drain.ts with deterministic
// content generation based on:
//   1. Big Five LOW facets (IPIP-NEO-120, bottom 5)
//   2. RIASEC LOWEST dimensions (bottom 2)
//   3. Schwartz BOTTOM values (PVQ-21, bottom 3)
//
// Design principle: each entry is written from the perspective of
// "why THIS specific trait pattern makes THIS environment draining"
// — not generic career advice.
// ============================================================

// ── Types ──

interface BilingualText {
  zh: string;
  en: string;
  nl?: string;
  de?: string;
  fr?: string;
  es?: string;
  pt?: string;
  it?: string;
  ru?: string;
  ja?: string;
  ko?: string;
}

interface DrainDirection {
  title_zh: string;
  title_en: string;
  title_nl?: string;
  title_de?: string;
  title_fr?: string;
  title_es?: string;
  title_pt?: string;
  title_it?: string;
  title_ru?: string;
  title_ja?: string;
  title_ko?: string;
  reason_zh: string;
  reason_en: string;
  reason_nl?: string;
  reason_de?: string;
  reason_fr?: string;
  reason_es?: string;
  reason_pt?: string;
  reason_it?: string;
  reason_ru?: string;
  reason_ja?: string;
  reason_ko?: string;
}

interface DrainIndustry {
  name_zh: string;
  name_en: string;
  name_nl?: string;
  name_de?: string;
  name_fr?: string;
  name_es?: string;
  name_pt?: string;
  name_it?: string;
  name_ru?: string;
  name_ja?: string;
  name_ko?: string;
  reason_zh: string;
  reason_en: string;
  reason_nl?: string;
  reason_de?: string;
  reason_fr?: string;
  reason_es?: string;
  reason_pt?: string;
  reason_it?: string;
  reason_ru?: string;
  reason_ja?: string;
  reason_ko?: string;
}

interface DrainManagementStyle {
  style_zh: string;
  style_en: string;
  style_nl?: string;
  style_de?: string;
  style_fr?: string;
  style_es?: string;
  style_pt?: string;
  style_it?: string;
  style_ru?: string;
  style_ja?: string;
  style_ko?: string;
  reason_zh: string;
  reason_en: string;
  reason_nl?: string;
  reason_de?: string;
  reason_fr?: string;
  reason_es?: string;
  reason_pt?: string;
  reason_it?: string;
  reason_ru?: string;
  reason_ja?: string;
  reason_ko?: string;
}

interface RedFlag {
  signal_zh: string;
  signal_en: string;
  signal_nl?: string;
  signal_de?: string;
  signal_fr?: string;
  signal_es?: string;
  signal_pt?: string;
  signal_it?: string;
  signal_ru?: string;
  signal_ja?: string;
  signal_ko?: string;
}

// ============================================================
// 1. BIG FIVE FACET → DRAIN MAPPINGS (when facet is LOW)
//
// Each facet maps to: draining directions, industries, management
// styles, and red flag environments that would exhaust someone
// scoring low on that specific facet.
// ============================================================

export const FACET_DRAIN_MAP: Record<string, {
  directions: DrainDirection[];
  industries: DrainIndustry[];
  managementStyles: DrainManagementStyle[];
  redFlags: RedFlag[];
}> = {
  // ── Neuroticism facets (LOW = emotionally stable → drained by chaos) ──

  'N1_Anxiety': {
    // Low anxiety → drained by environments that manufacture urgency
    directions: [{
      title_zh: '危机公关与紧急响应',
      title_en: 'Crisis PR & Emergency Response',
      reason_zh: '你的低焦虑意味着人造紧迫感对你来说显得夸张而不是激励，持续的"救火"模式会让你觉得能量被无意义地消耗。',
      reason_en: 'Your low anxiety means manufactured urgency feels exaggerated rather than motivating — constant firefighting drains energy on what feels meaningless to you.',
    }],
    industries: [],
    managementStyles: [{
      style_zh: '恐吓驱动型管理',
      style_en: 'Fear-based management',
      reason_zh: '用焦虑和威胁来驱动执行的管理方式与你的情绪稳定性格格不入，你会觉得这种手段幼稚而消耗。',
      reason_en: 'Management that uses anxiety and threats to drive execution clashes with your emotional stability — you\'ll find these tactics juvenile and draining.',
    }],
    redFlags: [{
      signal_zh: '团队日常沟通中频繁使用"紧急""ASAP"等字眼',
      signal_en: 'Team communications constantly use "urgent", "ASAP", or "emergency"',
    }],
  },

  'N2_Anger': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '团队成员之间频繁发生情绪冲突但无人处理',
      signal_en: 'Frequent emotional conflicts between team members with no resolution',
    }],
  },

  'N3_Depression': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [],
  },

  'N4_Self-Consciousness': {
    // Low self-consciousness → drained by excessive social performance
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '工作中需要持续维护个人形象或进行社交表演',
      signal_en: 'Work requires constant image management or social performance',
    }],
  },

  'N5_Immoderation': {
    // Low immoderation = high self-control → drained by chaos
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '工作环境毫无规律，每天的任务都在变',
      signal_en: 'Completely unpredictable work environment where tasks change daily',
    }],
  },

  'N6_Vulnerability': {
    // Low vulnerability → resilient, but drained by environments that coddle
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [],
  },

  // ── Extraversion facets (LOW = introverted → drained by social overload) ──

  'E1_Friendliness': {
    // Low friendliness → drained by forced warmth
    directions: [{
      title_zh: '客户关系管理 / 大客户销售',
      title_en: 'Client Relationship Management / Enterprise Sales',
      reason_zh: '需要持续建立和维护大量人际关系会让你感到被掏空，你更擅长深度而非广度的连接。',
      reason_en: 'Continuously building and maintaining many relationships will hollow you out — you excel at depth over breadth in connections.',
    }],
    industries: [{
      name_zh: '酒店与服务行业',
      name_en: 'Hospitality & Service Industry',
      reason_zh: '需要全天候面带微笑、主动与陌生人建立融洽关系，这和你的内在节奏严重不匹配。',
      reason_en: 'All-day smiling and proactive rapport-building with strangers fundamentally mismatches your natural rhythm.',
    }],
    managementStyles: [],
    redFlags: [{
      signal_zh: '面试中强调"我们是一个大家庭"或强制社交活动',
      signal_en: 'Interviews emphasize "we\'re a family" or mandatory social events',
    }],
  },

  'E2_Gregariousness': {
    // Low gregariousness → drained by constant group interaction
    directions: [{
      title_zh: '活动策划 / 社群运营',
      title_en: 'Event Planning / Community Management',
      reason_zh: '你的能量来自独处而非群体，持续的社群互动和活动组织会让你在工作结束时完全耗尽。',
      reason_en: 'You recharge through solitude, not groups — continuous community interaction and event coordination will leave you depleted by end of day.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '开放式办公室且没有安静工作区或远程选项',
      signal_en: 'Open office plan with no quiet zones or remote work options',
    }],
  },

  'E3_Assertiveness': {
    // Low assertiveness → drained by environments requiring constant advocacy
    directions: [{
      title_zh: '商务谈判 / 投资者关系',
      title_en: 'Business Negotiation / Investor Relations',
      reason_zh: '持续需要强势表达立场、说服他人、推动决策的角色会消耗你大量心理资源。',
      reason_en: 'Roles requiring constant position advocacy, persuasion, and pushing decisions forward will consume immense psychological energy.',
    }],
    industries: [],
    managementStyles: [{
      style_zh: '强势竞争型文化',
      style_en: 'Aggressive competitive culture',
      reason_zh: '需要"抢地盘"和在会议中主动争夺话语权的环境，与你的自然沟通方式冲突。',
      reason_en: 'Environments requiring territory-grabbing and competing for airtime in meetings conflict with your natural communication style.',
    }],
    redFlags: [{
      signal_zh: '面试过程本身就像一场高压谈判或对抗测试',
      signal_en: 'The interview process itself feels like a high-pressure negotiation or adversarial test',
    }],
  },

  'E4_Activity_Level': {
    // Low activity level → drained by constant multitasking pace
    directions: [],
    industries: [{
      name_zh: '快消品 / 零售运营',
      name_en: 'FMCG / Retail Operations',
      reason_zh: '快节奏、多任务并行、不断切换注意力的工作模式与你偏好的深度专注风格冲突。',
      reason_en: 'Fast-paced, multitasking, constantly context-switching work modes clash with your preference for deep, focused engagement.',
    }],
    managementStyles: [],
    redFlags: [{
      signal_zh: '"在这里你要能同时处理十件事"是面试中的骄傲宣言',
      signal_en: '"You need to juggle ten things at once" is stated proudly in interviews',
    }],
  },

  'E5_Excitement-Seeking': {
    // Low excitement-seeking → drained by constant novelty pressure
    directions: [],
    industries: [{
      name_zh: '初创公司（早期阶段）',
      name_en: 'Early-stage startups',
      reason_zh: '每天面对不确定性和快速变化对你来说不是刺激而是消耗，你在可预测的环境中效率更高。',
      reason_en: 'Daily uncertainty and rapid change feels draining rather than exciting to you — you perform better in predictable environments.',
    }],
    managementStyles: [],
    redFlags: [{
      signal_zh: '"我们每周都在pivot"或频繁重组被视为正常',
      signal_en: '"We pivot every week" or frequent restructuring is considered normal',
    }],
  },

  'E6_Cheerfulness': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '要求员工持续表现出热情和积极情绪（强制乐观文化）',
      signal_en: 'Employees are expected to display constant enthusiasm and positivity (toxic positivity culture)',
    }],
  },

  // ── Openness facets (LOW = conventional → drained by ambiguity) ──

  'O1_Imagination': {
    // Low imagination → drained by pure brainstorming roles
    directions: [{
      title_zh: '概念设计 / 品牌创意总监',
      title_en: 'Concept Design / Brand Creative Director',
      reason_zh: '需要不断"从无到有"构想全新概念的角色会让你觉得空洞，你更擅长改进现有事物而非凭空创造。',
      reason_en: 'Roles requiring constant "something from nothing" ideation will feel hollow — you excel at improving existing things rather than creating from thin air.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '团队中"天马行空"的创意会议占据大量工作时间',
      signal_en: '"Blue sky thinking" brainstorm sessions take up significant work hours',
    }],
  },

  'O2_Artistic_Interests': {
    directions: [],
    industries: [{
      name_zh: '艺术与设计行业',
      name_en: 'Arts & Design Industry',
      reason_zh: '审美判断和艺术创作不是你的自然能量来源，长期在以审美为核心的环境中工作会感到格格不入。',
      reason_en: 'Aesthetic judgment and artistic creation aren\'t your natural energy source — working long-term in aesthetics-centered environments will feel like a poor fit.',
    }],
    managementStyles: [],
    redFlags: [],
  },

  'O3_Emotionality': {
    // Low emotionality → drained by emotionally intense environments
    directions: [{
      title_zh: '心理咨询 / 社会工作',
      title_en: 'Counseling / Social Work',
      reason_zh: '需要持续共情和处理他人强烈情绪的角色会让你感到不自然的消耗——不是因为你不关心，而是因为你处理情绪的方式偏理性。',
      reason_en: 'Roles requiring sustained empathy and processing others\' intense emotions will feel unnaturally draining — not because you don\'t care, but because you process emotions more rationally.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [],
  },

  'O4_Adventurousness': {
    // Low adventurousness → drained by constant change
    directions: [],
    industries: [],
    managementStyles: [{
      style_zh: '频繁轮岗制度',
      style_en: 'Frequent rotation programs',
      reason_zh: '你在深耕一个领域时效率最高，频繁更换岗位和职能会让你觉得无法积累有效经验。',
      reason_en: 'You\'re most effective when deepening expertise in one area — frequent role changes feel like they prevent meaningful skill accumulation.',
    }],
    redFlags: [{
      signal_zh: '公司文化强调"走出舒适区"并频繁调整团队和项目',
      signal_en: 'Company culture emphasizes "leaving your comfort zone" with frequent team and project shuffles',
    }],
  },

  'O5_Intellect': {
    // Low intellect → drained by abstract theoretical work
    directions: [{
      title_zh: '学术研究 / 理论咨询',
      title_en: 'Academic Research / Theoretical Consulting',
      reason_zh: '纯理论探讨和抽象概念分析不是你的能量来源，你更需要看到具体可见的成果来保持动力。',
      reason_en: 'Pure theoretical discussion and abstract concept analysis aren\'t your energy source — you need tangible, visible outcomes to stay motivated.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '工作成果主要以报告和理论框架衡量，而非实际执行',
      signal_en: 'Work output is measured primarily by reports and theoretical frameworks, not practical execution',
    }],
  },

  'O6_Liberalism': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '组织要求员工频繁挑战既有流程，"颠覆"是核心价值观',
      signal_en: 'Organization expects employees to constantly challenge existing processes — "disruption" is a core value',
    }],
  },

  // ── Agreeableness facets (LOW = independent → drained by excessive harmony) ──

  'A1_Trust': {
    // Low trust → drained by environments requiring blind faith
    directions: [],
    industries: [],
    managementStyles: [{
      style_zh: '高度依赖口头承诺的管理',
      style_en: 'Management based on verbal promises',
      reason_zh: '你需要书面的、明确的协议和规则，纯靠信任和"彼此理解"的管理方式会让你持续焦虑。',
      reason_en: 'You need written, explicit agreements and rules — management relying purely on trust and "mutual understanding" will keep you anxious.',
    }],
    redFlags: [{
      signal_zh: '合同条款含糊不清，被告知"我们到时候再说"',
      signal_en: 'Contract terms are vague, with reassurances of "we\'ll figure it out later"',
    }],
  },

  'A2_Morality': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '公司文化中"灵活变通"是对规则模糊的美化',
      signal_en: 'Company culture uses "flexibility" as a euphemism for unclear rules',
    }],
  },

  'A3_Altruism': {
    // Low altruism → drained by service-first roles
    directions: [{
      title_zh: '非营利组织管理 / 慈善基金运营',
      title_en: 'Nonprofit Management / Charity Operations',
      reason_zh: '以他人福祉为核心使命的角色会让你觉得自己的个人目标被边缘化，长期下来失去动力。',
      reason_en: 'Roles centered on others\' welfare as the core mission will make your personal goals feel marginalized, eroding motivation over time.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [],
  },

  'A4_Cooperation': {
    // Low cooperation → drained by consensus cultures
    directions: [],
    industries: [],
    managementStyles: [{
      style_zh: '过度共识型决策文化',
      style_en: 'Consensus-heavy decision culture',
      reason_zh: '每个决策都需要全员同意的环境会让你觉得效率极低，你更偏好"有人拍板"的决策模式。',
      reason_en: 'Environments where every decision requires universal agreement will feel painfully inefficient — you prefer clear decision ownership.',
    }],
    redFlags: [{
      signal_zh: '一个简单决策需要经过三轮以上的团队讨论才能推进',
      signal_en: 'Simple decisions require three or more rounds of team discussion before moving forward',
    }],
  },

  'A5_Modesty': {
    // Low modesty → drained by environments that suppress individual recognition
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '公司强调"团队功劳"但从不认可个人贡献',
      signal_en: 'Company emphasizes "team credit" but never acknowledges individual contributions',
    }],
  },

  'A6_Sympathy': {
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [],
  },

  // ── Conscientiousness facets (LOW = flexible → drained by rigidity) ──

  'C1_Self-Efficacy': {
    // Low self-efficacy → drained by high-autonomy roles without support
    directions: [{
      title_zh: '独立创业 / 自由顾问',
      title_en: 'Solo Entrepreneurship / Independent Consulting',
      reason_zh: '完全需要自我驱动、没有外部结构支撑的角色会放大你的自我怀疑，你在有导师或团队的环境中表现更好。',
      reason_en: 'Fully self-driven roles without external structure amplify self-doubt — you perform better in environments with mentors or team support.',
    }],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '"这里没人会手把手教你，你得自己figure out"',
      signal_en: '"Nobody will hold your hand here — you need to figure it out yourself"',
    }],
  },

  'C2_Orderliness': {
    // Low orderliness → drained by hyper-organized environments
    directions: [{
      title_zh: '合规管理 / 审计',
      title_en: 'Compliance Management / Auditing',
      reason_zh: '需要极度遵循标准流程、填写大量表格、维护精确文档的工作与你灵活自然的工作方式冲突。',
      reason_en: 'Work requiring strict process adherence, extensive form-filling, and precise documentation clashes with your naturally flexible working style.',
    }],
    industries: [{
      name_zh: '传统银行与金融合规',
      name_en: 'Traditional Banking & Financial Compliance',
      reason_zh: '高度流程化和文档要求的行业会让你的灵活性成为负担而非优势。',
      reason_en: 'Heavily process-driven and documentation-heavy industries turn your flexibility into a liability rather than an asset.',
    }],
    managementStyles: [{
      style_zh: '微观管理（Micro-management）',
      style_en: 'Micro-management',
      reason_zh: '每个步骤都被监控和规定的管理方式会让你感到窒息和失去创造力。',
      reason_en: 'Having every step monitored and prescribed will feel suffocating and kill your creativity.',
    }],
    redFlags: [{
      signal_zh: '入职第一天就收到一本厚厚的SOP手册，且被告知必须严格遵守',
      signal_en: 'Day one you receive a thick SOP manual and are told to follow it to the letter',
    }],
  },

  'C3_Dutifulness': {
    // Low dutifulness → drained by obligation-heavy environments
    directions: [],
    industries: [{
      name_zh: '政府机关 / 公共部门',
      name_en: 'Government / Public Sector',
      reason_zh: '以"义务"和"职责"为核心驱动力的环境会让你觉得被规则捆绑，而非被使命激发。',
      reason_en: 'Environments driven by "duty" and "obligation" will make you feel bound by rules rather than inspired by mission.',
    }],
    managementStyles: [],
    redFlags: [],
  },

  'C4_Achievement-Striving': {
    // Low achievement-striving → drained by constant performance pressure
    directions: [],
    industries: [{
      name_zh: '投资银行 / 顶级管理咨询',
      name_en: 'Investment Banking / Top-tier Management Consulting',
      reason_zh: '以"up-or-out"为核心的文化中，持续的绩效压力和排名比较会消耗你的心理资源。',
      reason_en: 'In "up-or-out" cultures, constant performance pressure and ranking comparisons will drain your psychological reserves.',
    }],
    managementStyles: [{
      style_zh: '强制排名与末位淘汰',
      style_en: 'Forced ranking & stack ranking',
      reason_zh: '把团队成员放在竞争跑道上互相比较的管理方式会让你感到焦虑而非动力。',
      reason_en: 'Management that puts team members on competitive tracks comparing against each other will make you anxious, not motivated.',
    }],
    redFlags: [{
      signal_zh: '面试中反复问你"如何在高压下表现""你的竞争优势是什么"',
      signal_en: 'Interviews repeatedly ask "how do you perform under pressure" and "what\'s your competitive edge"',
    }],
  },

  'C5_Self-Discipline': {
    // Low self-discipline → drained by unstructured environments (paradox!)
    directions: [],
    industries: [],
    managementStyles: [],
    redFlags: [{
      signal_zh: '工作完全自主但没有任何deadline或里程碑（你需要外部结构来辅助执行）',
      signal_en: 'Fully autonomous work with no deadlines or milestones (you need external structure to aid execution)',
    }],
  },

  'C6_Cautiousness': {
    // Low cautiousness → drained by slow, approval-heavy processes
    directions: [],
    industries: [],
    managementStyles: [{
      style_zh: '多层审批制度',
      style_en: 'Multi-layer approval processes',
      reason_zh: '每个行动都需要层层审批的环境会让你极度沮丧，你更偏好快速试错。',
      reason_en: 'Environments requiring multiple approval layers for every action will frustrate you intensely — you prefer rapid experimentation.',
    }],
    redFlags: [{
      signal_zh: '一个小改动需要三级以上审批才能执行',
      signal_en: 'Minor changes require three or more levels of approval before execution',
    }],
  },
};

// ============================================================
// 2. RIASEC LOWEST DIMENSION → DRAIN MAPPINGS
//
// When a RIASEC dimension is your LOWEST, careers heavily
// dependent on that dimension will drain you.
// ============================================================

export const RIASEC_DRAIN_MAP: Record<string, {
  directions: DrainDirection[];
  industries: DrainIndustry[];
}> = {
  R: {
    // Lowest Realistic → physical/hands-on work drains
    directions: [{
      title_zh: '现场工程 / 制造运维',
      title_en: 'Field Engineering / Manufacturing Operations',
      reason_zh: '你的兴趣图谱显示实际动手操作不是你的能量来源——需要长时间体力参与和具象操作的角色会让你失去兴趣。',
      reason_en: 'Your interest profile shows hands-on work isn\'t your energy source — roles requiring sustained physical engagement and concrete operations will lose your interest.',
    }],
    industries: [{
      name_zh: '制造业 / 建筑工程',
      name_en: 'Manufacturing / Construction Engineering',
      reason_zh: '以实体产品制造和现场操作为核心的行业与你的抽象思维偏好不匹配。',
      reason_en: 'Industries centered on physical product manufacturing and on-site operations mismatch your abstract thinking preference.',
    }],
  },
  I: {
    // Lowest Investigative → deep analysis drains
    directions: [{
      title_zh: '基础科学研究 / 数据科学',
      title_en: 'Basic Science Research / Data Science',
      reason_zh: '需要长时间独立钻研复杂理论或大量数据分析的角色不是你的兴趣所在，你更偏好行动导向的工作。',
      reason_en: 'Roles requiring prolonged independent study of complex theories or extensive data analysis don\'t align with your interests — you prefer action-oriented work.',
    }],
    industries: [{
      name_zh: '科研院所 / 智库',
      name_en: 'Research Institutes / Think Tanks',
      reason_zh: '以纯粹的知识生产和理论探索为目标的环境不太可能让你感到满足。',
      reason_en: 'Environments focused purely on knowledge production and theoretical exploration are unlikely to fulfill you.',
    }],
  },
  A: {
    // Lowest Artistic → creative/ambiguous work drains
    directions: [{
      title_zh: '创意总监 / 内容创作',
      title_en: 'Creative Direction / Content Creation',
      reason_zh: '需要持续产出原创创意、在审美层面做判断的角色会让你觉得模糊和无所适从。',
      reason_en: 'Roles requiring continuous original creative output and aesthetic judgment will feel ambiguous and disorienting.',
    }],
    industries: [{
      name_zh: '广告创意 / 影视制作',
      name_en: 'Advertising Creative / Film & TV Production',
      reason_zh: '以创意表达和艺术审美为核心竞争力的行业不是你自然发光的舞台。',
      reason_en: 'Industries where creative expression and artistic taste are core competitive advantages aren\'t your natural stage.',
    }],
  },
  S: {
    // Lowest Social → helping/teaching/counseling drains
    directions: [{
      title_zh: '教育培训 / 社区服务',
      title_en: 'Education & Training / Community Services',
      reason_zh: '以持续帮助、教育和关怀他人为核心的角色会让你觉得自己的能量在单向输出，缺少智识上的反馈。',
      reason_en: 'Roles centered on continuous helping, educating, and caring for others will feel like one-way energy output, lacking intellectual reciprocity.',
    }],
    industries: [{
      name_zh: '社会服务 / 护理',
      name_en: 'Social Services / Nursing & Care',
      reason_zh: '以人际关怀为主要价值交付的行业不是你的长期能量来源。',
      reason_en: 'Industries delivering value primarily through interpersonal care aren\'t your long-term energy source.',
    }],
  },
  E: {
    // Lowest Enterprising → leadership/selling drains
    directions: [{
      title_zh: '直销 / BD拓展',
      title_en: 'Direct Sales / Business Development',
      reason_zh: '需要主动说服、持续推销和竞争性目标的角色与你的自然工作方式不匹配。',
      reason_en: 'Roles requiring active persuasion, continuous selling, and competitive targets don\'t match your natural work style.',
    }],
    industries: [{
      name_zh: '房地产销售 / 保险经纪',
      name_en: 'Real Estate Sales / Insurance Brokerage',
      reason_zh: '以个人说服力和竞争性目标为驱动的行业会持续消耗你的能量。',
      reason_en: 'Industries driven by personal persuasion and competitive targets will continuously drain your energy.',
    }],
  },
  C: {
    // Lowest Conventional → structured/routine work drains
    directions: [{
      title_zh: '行政管理 / 数据录入',
      title_en: 'Administrative Management / Data Entry',
      reason_zh: '高度规范化、重复性的日常行政工作会让你觉得才能被浪费，缺乏挑战。',
      reason_en: 'Highly standardized, repetitive administrative work will make you feel underutilized and unchallenged.',
    }],
    industries: [{
      name_zh: '传统会计与簿记',
      name_en: 'Traditional Accounting & Bookkeeping',
      reason_zh: '以精确记录和重复性流程为核心的行业与你对新鲜感的需求冲突。',
      reason_en: 'Industries centered on precise record-keeping and repetitive processes conflict with your need for novelty.',
    }],
  },
};

// ============================================================
// 3. SCHWARTZ BOTTOM VALUES → DRAIN MAPPINGS
//
// When a value ranks at the BOTTOM of your Schwartz profile,
// environments that REQUIRE that value as core motivation
// will drain you.
// ============================================================

export const SCHWARTZ_DRAIN_MAP: Record<string, {
  managementStyles: DrainManagementStyle[];
  redFlags: RedFlag[];
}> = {
  achievement: {
    // Low achievement value → drained by performance-obsessed cultures
    managementStyles: [{
      style_zh: 'KPI 至上型管理',
      style_en: 'KPI-obsessed management',
      reason_zh: '一切用数字衡量、排名决定一切的管理方式与你的内在驱动力不匹配。',
      reason_en: 'Management where everything is measured by numbers and rankings determine everything mismatches your intrinsic motivation.',
    }],
    redFlags: [{
      signal_zh: '团队每周公布个人业绩排名',
      signal_en: 'Team publishes individual performance rankings weekly',
    }],
  },
  power: {
    managementStyles: [],
    redFlags: [{
      signal_zh: '晋升路径主要基于"管多少人"而非"做多好的事"',
      signal_en: 'Promotion path is based on "how many people you manage" rather than "how good your work is"',
    }],
  },
  stimulation: {
    managementStyles: [],
    redFlags: [{
      signal_zh: '公司以"稳定""传承"为核心价值观，变化被视为威胁',
      signal_en: 'Company values "stability" and "tradition" above all — change is seen as a threat',
    }],
  },
  'self-direction': {
    // Low self-direction value → actually fine with structure, but drained by chaos
    managementStyles: [],
    redFlags: [{
      signal_zh: '没有明确的流程和标准，所有人都在"摸着石头过河"',
      signal_en: 'No clear processes or standards — everyone is "figuring it out as they go"',
    }],
  },
  hedonism: {
    managementStyles: [{
      style_zh: '"苦行文化"管理',
      style_en: '"Grind culture" management',
      reason_zh: '以加班和自我牺牲为荣的工作文化与你对工作体验的重视严重冲突。',
      reason_en: 'Work culture that glorifies overtime and self-sacrifice fundamentally clashes with your value of work experience quality.',
    }],
    redFlags: [{
      signal_zh: '加班被视为"敬业"而非"效率问题"',
      signal_en: 'Overtime is seen as "dedication" rather than an "efficiency problem"',
    }],
  },
  benevolence: {
    managementStyles: [],
    redFlags: [{
      signal_zh: '绩效考核中"帮助同事"占了很大比重',
      signal_en: '"Helping colleagues" is heavily weighted in performance reviews',
    }],
  },
  universalism: {
    managementStyles: [],
    redFlags: [{
      signal_zh: '公司强调"改变世界"但你觉得这更像口号而非真正驱动力',
      signal_en: 'Company emphasizes "changing the world" but it feels like a slogan rather than a genuine driver to you',
    }],
  },
  conformity: {
    // Low conformity → drained by rule-following
    managementStyles: [{
      style_zh: '官僚层级制度',
      style_en: 'Bureaucratic hierarchy',
      reason_zh: '严格的上下级关系和不可质疑的权威链条会让你感到窒息。',
      reason_en: 'Strict hierarchical relationships and unquestionable authority chains will feel suffocating.',
    }],
    redFlags: [{
      signal_zh: '任何质疑上级决策的行为都被视为"不尊重"',
      signal_en: 'Questioning leadership decisions is viewed as "disrespectful"',
    }],
  },
  tradition: {
    managementStyles: [],
    redFlags: [{
      signal_zh: '"我们一直是这么做的"是拒绝改变的终极理由',
      signal_en: '"This is how we\'ve always done it" is the ultimate reason for rejecting change',
    }],
  },
  security: {
    // Low security value → drained by risk-averse environments
    managementStyles: [],
    redFlags: [{
      signal_zh: '所有决策都以"降低风险"为第一优先级，创新被视为威胁',
      signal_en: 'All decisions prioritize "risk reduction" first — innovation is seen as a threat',
    }],
  },
};

// ============================================================
// 4. FRAMING SUMMARIES — Bilingual templates
// ============================================================

export const FRAMING_SUMMARIES: BilingualText[] = [
  {
    zh: '以下是基于你的人格画像和价值观排序的"能量预警"——这些不是禁区，而是需要你在选择时额外留意的方向。如果你的现实条件需要进入这些领域，了解它们的消耗点可以帮你提前准备应对策略。',
    en: 'Below is an "energy warning" based on your personality profile and value priorities — these aren\'t forbidden zones, but directions that deserve extra attention when you\'re choosing. If circumstances require you to enter these areas, understanding the drain points helps you prepare coping strategies in advance.',
    nl: 'Hieronder staat een "energiewaarschuwing" op basis van je persoonlijkheidsprofiel en waardeprioriiten — dit zijn geen verboden zones, maar richtingen die extra aandacht verdienen bij het kiezen. Als omstandigheden vereisen dat je deze gebieden betreedt, helpt het begrijpen van de uitputtingspunten je om van tevoren copingstrategieën voor te bereiden.',
    de: 'Nachfolgend eine „Energiewarnung" basierend auf deinem Persönlichkeitsprofil und deinen Werteprioritäten — dies sind keine verbotenen Zonen, sondern Richtungen, die bei der Wahl besondere Aufmerksamkeit verdienen. Wenn Umstände erfordern, dass du diese Bereiche betrittst, hilft das Verständnis der Erschöpfungspunkte dir, Bewältigungsstrategien im Voraus vorzubereiten.',
    fr: "Voici un « avertissement énergétique » basé sur votre profil de personnalité et vos priorités de valeurs — ce ne sont pas des zones interdites, mais des directions qui méritent une attention particulière lors de vos choix. Si les circonstances vous obligent à entrer dans ces domaines, comprendre les points d'épuisement vous aide à préparer des stratégies d'adaptation à l'avance.",
    es: 'A continuación hay una "advertencia energética" basada en tu perfil de personalidad y prioridades de valores — no son zonas prohibidas, sino direcciones que merecen atención extra al elegir. Si las circunstancias requieren que entres en estas áreas, comprender los puntos de desgaste te ayuda a preparar estrategias de afrontamiento por adelantado.',
    pt: 'Abaixo está um "aviso energético" baseado no teu perfil de personalidade e prioridades de valores — não são zonas proibidas, mas direções que merecem atenção extra ao escolher. Se as circunstâncias exigirem que entres nestas áreas, compreender os pontos de desgaste ajuda-te a preparar estratégias de coping antecipadamente.',
    it: 'Di seguito un "avviso energetico" basato sul tuo profilo di personalità e le tue priorità di valori — non sono zone proibite, ma direzioni che meritano attenzione extra quando scegli. Se le circostanze richiedono di entrare in queste aree, comprendere i punti di esaurimento ti aiuta a preparare strategie di coping in anticipo.',
    ru: 'Ниже — «энергетическое предупреждение» на основе вашего профиля личности и ценностных приоритетов. Это не запретные зоны, а направления, заслуживающие особого внимания при выборе. Если обстоятельства потребуют войти в эти области, понимание точек истощения поможет заранее подготовить стратегии адаптации.',
    ja: '以下は、あなたの性格プロフィールと価値観の優先順位に基づく「エネルギー警告」です。これらは禁止区域ではなく、選択する際に特に注意すべき方向です。状況がこれらの領域に入ることを求める場合、消耗ポイントを理解することで、事前に対処戦略を準備できます。',
    ko: '아래는 당신의 성격 프로필과 가치 우선순위에 기반한 "에너지 경고"입니다. 이것은 금지 구역이 아니라 선택할 때 추가 주의가 필요한 방향입니다. 상황이 이 영역에 들어가도록 요구한다면, 소진 포인트를 이해하면 사전에 대처 전략을 준비하는 데 도움이 됩니다.',
  },
  {
    zh: '这份内耗预警不是告诉你"不要做什么"，而是帮你看清"什么会比别人更消耗你"。每个人都有自己的能量黑洞——提前知道它们在哪里，是职业选择中最被低估的智慧。',
    en: 'This drain warning isn\'t telling you "what not to do" — it helps you see "what will drain you more than it drains others." Everyone has their own energy black holes — knowing where they are is the most underrated wisdom in career decisions.',
    nl: 'Deze uitputtingswaarschuwing vertelt je niet "wat je niet moet doen" — het helpt je zien "wat jou meer zal uitputten dan anderen." Iedereen heeft eigen energetische zwarte gaten — weten waar ze zijn is de meest onderschatte wijsheid bij carrièrebeslissingen.',
    de: 'Diese Erschöpfungswarnung sagt dir nicht „was du nicht tun sollst" — sie hilft dir zu sehen, „was dich mehr erschöpfen wird als andere." Jeder hat seine eigenen Energie-Schwarzen-Löcher — zu wissen, wo sie sind, ist die am meisten unterschätzte Weisheit bei Karriereentscheidungen.',
    fr: "Cet avertissement d'épuisement ne vous dit pas « ce qu'il ne faut pas faire » — il vous aide à voir « ce qui vous épuisera plus que les autres ». Chacun a ses propres trous noirs d'énergie — savoir où ils se trouvent est la sagesse la plus sous-estimée dans les décisions de carrière.",
    es: 'Esta advertencia de desgaste no te dice "qué no hacer" — te ayuda a ver "qué te desgastará más que a otros." Todos tienen sus propios agujeros negros de energía — saber dónde están es la sabiduría más subestimada en las decisiones de carrera.',
    pt: 'Este aviso de desgaste não te diz "o que não fazer" — ajuda-te a ver "o que te desgastará mais do que aos outros." Todos têm os seus próprios buracos negros de energia — saber onde estão é a sabedoria mais subestimada nas decisões de carreira.',
    it: 'Questo avviso di esaurimento non ti dice "cosa non fare" — ti aiuta a vedere "cosa ti esaurirà più degli altri." Ognuno ha i propri buchi neri energetici — sapere dove sono è la saggezza più sottovalutata nelle decisioni di carriera.',
    ru: 'Это предупреждение об истощении не говорит вам «чего не делать» — оно помогает увидеть, «что будет истощать вас больше, чем других». У каждого свои энергетические чёрные дыры — знать, где они находятся, — самая недооценённая мудрость в карьерных решениях.',
    ja: 'この消耗警告は「何をすべきでないか」を教えるものではなく、「何が他の人よりもあなたをより消耗させるか」を見せてくれます。誰もが自分だけのエネルギーブラックホールを持っています。それがどこにあるかを知ることは、キャリア決定における最も過小評価された知恵です。',
    ko: '이 소진 경고는 "하지 말아야 할 것"을 알려주는 것이 아닙니다. "무엇이 다른 사람보다 당신을 더 소진시킬 것인지"를 보여줍니다. 모든 사람에게는 자신만의 에너지 블랙홀이 있습니다. 그것이 어디에 있는지 아는 것은 커리어 결정에서 가장 과소평가된 지혜입니다.',
  },
  {
    zh: '每个人都有自己的职业"暗礁"——那些表面看起来没问题，但长期会让你感到疲惫的方向。以下预警来自你独特的人格特质和核心价值观组合，帮你在做选择时多一份清醒。',
    en: 'Everyone has career "hidden reefs" — directions that look fine on the surface but drain you over time. These warnings come from your unique combination of personality traits and core values, helping you make clearer choices.',
    nl: 'Iedereen heeft carrière-"verborgen riffen" — richtingen die er aan de oppervlakte prima uitzien maar je na verloop van tijd uitputten. Deze waarschuwingen komen voort uit jouw unieke combinatie van persoonlijkheidskenmerken en kernwaarden, en helpen je helderere keuzes te maken.',
    de: 'Jeder hat Karriere-„versteckte Riffe" — Richtungen, die an der Oberfläche in Ordnung aussehen, dich aber über die Zeit erschöpfen. Diese Warnungen stammen aus deiner einzigartigen Kombination von Persönlichkeitsmerkmalen und Kernwerten und helfen dir, klarere Entscheidungen zu treffen.',
    fr: "Chacun a des « récifs cachés » de carrière — des directions qui semblent bien en surface mais qui vous épuisent avec le temps. Ces avertissements proviennent de votre combinaison unique de traits de personnalité et de valeurs fondamentales, vous aidant à faire des choix plus clairs.",
    es: 'Todos tienen "arrecifes ocultos" profesionales — direcciones que parecen bien en la superficie pero te desgastan con el tiempo. Estas advertencias provienen de tu combinación única de rasgos de personalidad y valores fundamentales, ayudándote a tomar decisiones más claras.',
    pt: 'Todos têm "recifes ocultos" de carreira — direções que parecem bem à superfície mas te desgastam com o tempo. Estes avisos vêm da tua combinação única de traços de personalidade e valores centrais, ajudando-te a fazer escolhas mais claras.',
    it: 'Ognuno ha "scogli nascosti" nella carriera — direzioni che sembrano a posto in superficie ma ti esauriscono nel tempo. Questi avvisi provengono dalla tua combinazione unica di tratti di personalità e valori fondamentali, aiutandoti a fare scelte più chiare.',
    ru: 'У каждого есть карьерные «подводные рифы» — направления, которые выглядят нормально на поверхности, но со временем истощают. Эти предупреждения основаны на вашей уникальной комбинации черт личности и ключевых ценностей, помогая делать более осознанный выбор.',
    ja: '誰にでもキャリアの「隠れた暗礁」があります——表面上は問題なさそうに見えるが、時間とともに消耗する方向性です。これらの警告は、あなた独自の性格特性とコアバリューの組み合わせから来ており、より明確な選択をする助けとなります。',
    ko: '모든 사람에게는 커리어의 "숨겨진 암초"가 있습니다 — 표면적으로는 괜찮아 보이지만 시간이 지나면서 소진시키는 방향입니다. 이 경고는 당신의 고유한 성격 특성과 핵심 가치의 조합에서 나오며, 더 명확한 선택을 하는 데 도움을 줍니다.',
  },
];
