// lib/content/north-star.ts
// Career North Star — 12 Archetype × 3 Dimension Aspirational Direction Map
// Based on Possible Selves Theory (Markus & Nurius, 1986)
// These are directional aspirations, NOT predictions.

export interface NorthStarEntry {
  role_en: string;
  role_zh: string;
  /** One sentence: why this direction resonates with this archetype's core drive */
  why_en: string;
  why_zh: string;
}

export interface NorthStarConfig {
  leadership: NorthStarEntry;
  expertise: NorthStarEntry;
  impact: NorthStarEntry;
}

/**
 * 12 archetypes × 3 aspirational dimensions:
 * - leadership: organizational/institutional leadership peak
 * - expertise: deepest individual mastery peak
 * - impact: societal/humanitarian influence peak
 */
export const NORTH_STAR_MAP: Record<string, NorthStarConfig> = {
  // ═══════════════════════════════════════════════
  // R (Realistic) — 造物
  // ═══════════════════════════════════════════════

  "R-enhancement": {
    leadership: {
      role_en: "CTO / Technical Co-founder",
      role_zh: "首席技术官 / 技术合伙人",
      why_en:
        "Your obsession with craft becomes the technical vision of an entire organization.",
      why_zh: "你对工艺的极致追求，将成为整个组织的技术方向。",
    },
    expertise: {
      role_en: "Distinguished Engineer / Technical Fellow",
      role_zh: "杰出工程师 / 技术院士",
      why_en:
        "The highest individual recognition for engineering mastery — no management required.",
      why_zh: "工程领域最高的个人荣誉——不需要管理，纯粹靠手艺说话。",
    },
    impact: {
      role_en: "Critical Infrastructure Architect",
      role_zh: "关键基础设施总建筑师",
      why_en: "Your precision builds what millions rely on silently every day.",
      why_zh: "你的精确，构建了千万人每天默默依赖的基石。",
    },
  },

  "R-transcendence": {
    leadership: {
      role_en: "VP of Engineering",
      role_zh: "工程副总裁",
      why_en: "Ensuring the foundation never cracks — at organizational scale.",
      why_zh: "确保地基永不开裂——只是规模变成了整个组织。",
    },
    expertise: {
      role_en: "Master Systems Reliability Engineer",
      role_zh: "系统可靠性大师",
      why_en: "The person called when failure is not an option.",
      why_zh: "当「不能出错」的时候，被呼叫的那个人。",
    },
    impact: {
      role_en: "Humanitarian Infrastructure Director",
      role_zh: "人道主义基础设施总监",
      why_en:
        "Building what vulnerable communities need most — clean water, safe shelter, lasting roads.",
      why_zh: "为最脆弱的社区建造最需要的东西——净水、安全住所、持久的道路。",
    },
  },

  // ═══════════════════════════════════════════════
  // I (Investigative) — 探知
  // ═══════════════════════════════════════════════

  "I-enhancement": {
    leadership: {
      role_en: "Chief Strategy Officer / Managing Partner",
      role_zh: "首席战略官 / 管理合伙人",
      why_en:
        "Turning data into organizational direction, intelligence into competitive advantage.",
      why_zh: "把数据变成组织方向，把情报变成竞争优势。",
    },
    expertise: {
      role_en: "Principal Analyst / Senior Fellow",
      role_zh: "首席分析师 / 资深研究员",
      why_en:
        "The definitive authority whose analysis shapes entire industries.",
      why_zh: "一句分析就能改变行业走向的权威。",
    },
    impact: {
      role_en: "Think Tank Director",
      role_zh: "顶级智库总监",
      why_en:
        "Shaping policy through rigorous analysis — your knowledge becomes a force multiplier.",
      why_zh: "通过严谨的分析塑造政策——你的知识成为杠杆。",
    },
  },

  "I-transcendence": {
    leadership: {
      role_en: "Chief Scientist / Research Director",
      role_zh: "首席科学家 / 研究院院长",
      why_en: "Leading the pursuit of truth at institutional scale.",
      why_zh: "在机构层面领导对真相的追寻。",
    },
    expertise: {
      role_en: "Endowed Professor / Principal Investigator",
      role_zh: "讲席教授 / 首席研究员",
      why_en: "Pushing the boundary of human knowledge in your field.",
      why_zh: "在你的领域推动人类知识的边界。",
    },
    impact: {
      role_en: "Global Health / Climate Chief Scientist",
      role_zh: "全球健康 / 气候首席科学家",
      why_en: "Relentless truth-seeking applied to humanity's biggest puzzles.",
      why_zh: "把对真相的执着，投入人类最大的谜题。",
    },
  },

  // ═══════════════════════════════════════════════
  // A (Artistic) — 创意
  // ═══════════════════════════════════════════════

  "A-enhancement": {
    leadership: {
      role_en: "Chief Creative Officer",
      role_zh: "首席创意官",
      why_en: "Your creative vision defines an entire brand's identity.",
      why_zh: "你的创意直觉，定义一个品牌的灵魂。",
    },
    expertise: {
      role_en: "Internationally Acclaimed Director / Artist",
      role_zh: "国际级导演 / 艺术家",
      why_en:
        "Recognition at the highest level — your name becomes synonymous with the craft.",
      why_zh: "最高级别的认可——你的名字成为那个领域的代名词。",
    },
    impact: {
      role_en: "Cultural Visionary",
      role_zh: "文化塑造者",
      why_en: "Your work shapes how an entire generation sees the world.",
      why_zh: "你的作品，塑造一整代人看世界的方式。",
    },
  },

  "A-transcendence": {
    leadership: {
      role_en: "Artistic Director / Creative Studio Founder",
      role_zh: "艺术总监 / 创意工作室创始人",
      why_en:
        "Building a world where others can also create their most authentic work.",
      why_zh: "建造一个让其他人也能创作出最真实作品的世界。",
    },
    expertise: {
      role_en: "Literary Master / Auteur",
      role_zh: "文学大师 / 殿堂级创作者",
      why_en: "Creating works that transcend time, genre, and language.",
      why_zh: "创造超越时间、流派和语言的作品。",
    },
    impact: {
      role_en: "Cultural Heritage Guardian / Master Curator",
      role_zh: "文化遗产守护者 / 策展大师",
      why_en: "Protecting and enriching the creative legacy of humanity.",
      why_zh: "守护和丰富人类的创作遗产。",
    },
  },

  // ═══════════════════════════════════════════════
  // S (Social) — 联结
  // ═══════════════════════════════════════════════

  "S-enhancement": {
    leadership: {
      role_en: "Chief People Officer / Dean",
      role_zh: "首席人才官 / 商学院院长",
      why_en: "Talent development at organizational or institutional scale.",
      why_zh: "在组织或机构层面发掘和培养人才。",
    },
    expertise: {
      role_en: "Master Executive Coach",
      role_zh: "顶级高管教练",
      why_en:
        "The person the C-suite turns to when they need transformation, not just advice.",
      why_zh: "高管们需要真正蜕变而非建议时，找到的那个人。",
    },
    impact: {
      role_en: "Education Innovator / Talent Democratizer",
      role_zh: "教育创新者 / 人才民主化先驱",
      why_en:
        "Democratizing access to mentorship — making your gift of seeing potential scalable.",
      why_zh: "让每个人都有机会被伯乐发现——把你识人的天赋规模化。",
    },
  },

  "S-transcendence": {
    leadership: {
      role_en: "Chief Wellness Officer / Healing Center Founder",
      role_zh: "首席健康官 / 疗愈中心创始人",
      why_en:
        "Creating environments where healing happens — by design, not by accident.",
      why_zh: "创造一个让疗愈自然发生的环境——不靠偶然，靠设计。",
    },
    expertise: {
      role_en: "Master Therapist / Clinical Supervisor",
      role_zh: "心理治疗大师 / 临床督导",
      why_en:
        "The deepest level of therapeutic mastery — training the next generation of healers.",
      why_zh: "治疗领域的最深造诣——培养下一代疗愈者。",
    },
    impact: {
      role_en: "Humanitarian Crisis Counselor",
      role_zh: "人道主义危机心理顾问",
      why_en:
        "Bringing healing to where it's needed most — conflict zones, disaster areas, displaced communities.",
      why_zh: "把疗愈带到最需要的地方——冲突地带、灾区、流离失所的社区。",
    },
  },

  // ═══════════════════════════════════════════════
  // E (Enterprising) — 驱动
  // ═══════════════════════════════════════════════

  "E-enhancement": {
    leadership: {
      role_en: "CEO / Serial Founder",
      role_zh: "CEO / 连续创业者",
      why_en:
        "Building from zero to one, again and again — each venture bigger than the last.",
      why_zh: "从零到一，一次又一次——每一次都比上一次更大。",
    },
    expertise: {
      role_en: "Venture Capital Partner",
      role_zh: "风险投资合伙人",
      why_en:
        "Pattern-matching opportunity at the highest level — betting on the future you can see.",
      why_zh: "在最高层面识别机会——押注你能看到的未来。",
    },
    impact: {
      role_en: "Impact Investor / Social Enterprise Founder",
      role_zh: "影响力投资人 / 社会企业创始人",
      why_en:
        "Entrepreneurial energy directed at the world's hardest problems.",
      why_zh: "用创业的能量，瞄准世界上最难的问题。",
    },
  },

  "E-transcendence": {
    leadership: {
      role_en: "Movement Leader / Industry Disruptor",
      role_zh: "运动领袖 / 行业颠覆者",
      why_en: "Rewriting the rules everyone else plays by.",
      why_zh: "改写所有人都在遵守的游戏规则。",
    },
    expertise: {
      role_en: "Futurist / Innovation Strategist",
      role_zh: "未来学家 / 创新战略家",
      why_en:
        "Seeing what comes next before anyone else — and building the bridge to get there.",
      why_zh: "比所有人都先看到未来——并且搭建通往那里的桥。",
    },
    impact: {
      role_en: "Policy Reformer / Systemic Change Agent",
      role_zh: "政策改革者 / 系统变革推动者",
      why_en: "Changing the game for everyone, not just yourself.",
      why_zh: "改变的不只是自己的命运，而是所有人的游戏规则。",
    },
  },

  // ═══════════════════════════════════════════════
  // C (Conventional) — 秩序
  // ═══════════════════════════════════════════════

  "C-enhancement": {
    leadership: {
      role_en: "COO / Chief Operating Officer",
      role_zh: "首席运营官",
      why_en:
        "Operational precision at organizational scale — chaos becomes order in your hands.",
      why_zh: "组织级别的运营精准——混乱到你手里就变秩序。",
    },
    expertise: {
      role_en: "Master Black Belt / Operations Authority",
      role_zh: "六西格玛大师 / 运营权威",
      why_en:
        "The gold standard of operational excellence — the person who defines how 'best practice' is done.",
      why_zh: "运营卓越的黄金标准——定义「最佳实践」本身的人。",
    },
    impact: {
      role_en: "Standards Architect / Regulatory Designer",
      role_zh: "标准制定者 / 监管架构师",
      why_en: "Building systems that protect and organize at societal scale.",
      why_zh: "构建在社会层面保护和组织所有人的系统。",
    },
  },

  "C-transcendence": {
    leadership: {
      role_en: "Chief Compliance Officer / Ombudsman",
      role_zh: "首席合规官 / 监察长",
      why_en:
        "Ensuring fairness at the institutional level — rules serve people, not the other way around.",
      why_zh: "在机构层面确保公平——规则服务于人，而不是相反。",
    },
    expertise: {
      role_en: "Senior Judge / Constitutional Scholar",
      role_zh: "资深法官 / 宪法学者",
      why_en:
        "The ultimate arbiter — your judgment sets the precedent others follow.",
      why_zh: "终极仲裁者——你的判断成为他人遵循的先例。",
    },
    impact: {
      role_en: "International Law Expert / Human Rights Advocate",
      role_zh: "国际法专家 / 人权倡导者",
      why_en:
        "Ensuring justice across borders — fairness shouldn't depend on where you were born.",
      why_zh: "跨越国境确保正义——公平不应取决于你生在哪里。",
    },
  },
};

/** Dimension metadata for rendering */
export const NORTH_STAR_DIMENSIONS = {
  leadership: { icon: "crown", order: 0 },
  expertise: { icon: "gem", order: 1 },
  impact: { icon: "globe", order: 2 },
} as const;

export type NorthStarDimension = keyof typeof NORTH_STAR_DIMENSIONS;
