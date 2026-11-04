// lib/content/archetype-relations.ts
// Deep Dive — 12-Type Archetype Relationship Map
//
// Based on Holland's hexagonal model (adjacency/opposition)
// and Enhancement↔Transcendence polarity.
//
// Holland hexagon adjacency: R-I-A-S-E-C (circular)
// Opposite pairs: R↔S, I↔E, A↔C

export interface ArchetypeRelation {
  /** The archetype code this relation is FROM */
  code: string;

  /** Same RIASEC, opposite orientation — "you do the same thing, but for different reasons" */
  mirror: {
    code: string;
    description_zh: string;
    description_en: string;
  };

  /** 2–3 types that naturally collaborate well */
  allies: Array<{
    code: string;
    why_zh: string;
    why_en: string;
  }>;

  /** 1–2 types that challenge you to grow (opposite RIASEC or contrasting style) */
  growthEdge: Array<{
    code: string;
    why_zh: string;
    why_en: string;
  }>;
}

/**
 * Holland hexagon:
 *
 *        R
 *      /   \
 *    C       I
 *    |       |
 *    E       A
 *      \   /
 *        S
 *
 * Adjacent = similar, Opposite = complementary
 * R↔S, I↔E, A↔C are opposite pairs
 */

export const ARCHETYPE_RELATIONS: Record<string, ArchetypeRelation> = {
  // ═══════════════════════════════════════════════
  // R (Realistic) — 造物
  // ═══════════════════════════════════════════════

  "R-enhancement": {
    code: "R-enhancement",
    mirror: {
      code: "R-transcendence",
      description_zh:
        "你们都是造物的人，但你造东西是为了证明极限，主心骨造东西是为了让别人安心站着。你追求巅峰，他追求可靠。你们一起能造出既极致又稳固的东西。",
      description_en:
        "You both build things, but you build to prove what's possible while Backbone builds so others can stand safely. Together you create work that is both exceptional and reliable.",
    },
    allies: [
      {
        code: "I-enhancement",
        why_zh: "战略家给你方向，你给他原型。他想到的，你做出来。",
        why_en:
          "Tactician gives you direction, you give them a prototype. They think it, you build it.",
      },
      {
        code: "C-enhancement",
        why_zh:
          "总指挥帮你把一件精品变成可复制的体系。你打磨手艺，他放大效率。",
        why_en:
          "Commander helps you turn one masterpiece into a scalable system. You refine the craft, they amplify the output.",
      },
    ],
    growthEdge: [
      {
        code: "S-transcendence",
        why_zh:
          "疗愈师会提醒你：不是所有东西都需要做到极致，有时候「够好」才是对人的尊重。",
        why_en:
          "Healer reminds you that not everything needs to be pushed to the limit — sometimes 'good enough' is the real form of respect.",
      },
      {
        code: "A-transcendence",
        why_zh: "追梦人会让你看到技术之外的东西——作品除了精确，还可以有灵魂。",
        why_en:
          "Dreamweaver shows you what lies beyond technical perfection — that craft can carry soul, not just precision.",
      },
    ],
  },

  "R-transcendence": {
    code: "R-transcendence",
    mirror: {
      code: "R-enhancement",
      description_zh:
        "你们都是造物的人，但工程专家追求极致是为了赢，你追求可靠是为了守护。他是矛，你是盾。",
      description_en:
        "You both build, but Architect pursues excellence to win while you pursue reliability to protect. They are the spear, you are the shield.",
    },
    allies: [
      {
        code: "S-enhancement",
        why_zh: "伯乐看到你的价值并帮你被看见——你最需要的就是这个。",
        why_en:
          "Mentor sees your value and helps make it visible — exactly what you need most.",
      },
      {
        code: "C-transcendence",
        why_zh: "仲裁人和你一样在乎底线。你守系统的稳定，他守规则的公平。",
        why_en:
          "Arbiter shares your dedication to fundamentals. You guard system stability, they guard fairness.",
      },
    ],
    growthEdge: [
      {
        code: "E-enhancement",
        why_zh:
          "王牌会推你走出舒适区：不是所有冒险都会让系统崩溃，有些冒险能让系统进化。",
        why_en:
          "Ace pushes you out of your comfort zone: not every risk breaks the system — some risks help it evolve.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // I (Investigative) — 探知
  // ═══════════════════════════════════════════════

  "I-enhancement": {
    code: "I-enhancement",
    mirror: {
      code: "I-transcendence",
      description_zh:
        "你们都痴迷于知识，但你把知识当武器，科学家把知识当信仰。你在乎信息差，他在乎真相。你们互相需要：你给方向，他给深度。",
      description_en:
        "You're both obsessed with knowledge, but you weaponize it while Researcher worships it. You care about information advantage, they care about truth. You give direction, they give depth.",
    },
    allies: [
      {
        code: "R-enhancement",
        why_zh:
          "工程专家把你的分析变成实物。你的洞察加他的手艺，是最强的从零到一。",
        why_en:
          "Architect turns your analysis into reality. Your insight plus their craft is the strongest zero-to-one combination.",
      },
      {
        code: "E-enhancement",
        why_zh: "王牌有你缺少的行动力——你想清楚了，他立刻去做。",
        why_en:
          "Ace has the bias for action you sometimes lack — you think it through, they ship it immediately.",
      },
    ],
    growthEdge: [
      {
        code: "S-enhancement",
        why_zh:
          "伯乐会提醒你：赢不只靠信息优势，有时候培养一个对的人比做对一个判断更有杠杆。",
        why_en:
          "Mentor reminds you that winning isn't just about information — sometimes developing the right person has more leverage than making the right call.",
      },
    ],
  },

  "I-transcendence": {
    code: "I-transcendence",
    mirror: {
      code: "I-enhancement",
      description_zh:
        "你们都深入钻研，但战略家钻研是为了赢得优势，你钻研是因为不知道会让你难受。他是功利的深度，你是纯粹的深度。",
      description_en:
        "You both dive deep, but Tactician dives to gain an edge while you dive because not knowing is unbearable. Their depth is strategic, yours is pure.",
    },
    allies: [
      {
        code: "A-transcendence",
        why_zh: "追梦人把你发现的真相变成别人能感受到的作品。你挖掘，他翻译。",
        why_en:
          "Dreamweaver turns the truths you discover into work others can feel. You excavate, they translate.",
      },
      {
        code: "C-transcendence",
        why_zh:
          "仲裁人和你一样在乎严谨——你追求方法论的诚实，他追求制度的公正。",
        why_en:
          "Arbiter shares your rigor — you pursue methodological honesty, they pursue institutional fairness.",
      },
    ],
    growthEdge: [
      {
        code: "E-transcendence",
        why_zh:
          "先驱会挑战你：真相固然重要，但如果不转化为行动去改变世界，它就只是存在于论文里的符号。",
        why_en:
          "Pioneer challenges you: truth matters, but if it doesn't become action that changes the world, it's just symbols in a paper.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // A (Artistic) — 创意
  // ═══════════════════════════════════════════════

  "A-enhancement": {
    code: "A-enhancement",
    mirror: {
      code: "A-transcendence",
      description_zh:
        "你们都是创造者，但你创作时想着观众会不会鼓掌，追梦人创作时想着某个人会不会流泪。你要声量，他要深度。",
      description_en:
        "You're both creators, but you create wondering if the crowd will cheer while Dreamweaver creates wondering if one person will cry. You want volume, they want depth.",
    },
    allies: [
      {
        code: "E-enhancement",
        why_zh: "王牌帮你把影响力变现——你制造内容，他制造机会。",
        why_en:
          "Ace helps you monetize influence — you create the content, they create the opportunity.",
      },
      {
        code: "S-enhancement",
        why_zh:
          "伯乐看到你身上连你自己都没意识到的潜力，并把你推到更大的舞台。",
        why_en:
          "Mentor spots potential in you that even you haven't noticed, and pushes you toward a bigger stage.",
      },
    ],
    growthEdge: [
      {
        code: "C-transcendence",
        why_zh:
          "仲裁人会问你一个不舒服的问题：你追求的是被最多人看见，还是被对的人看见？",
        why_en:
          "Arbiter asks an uncomfortable question: do you want to be seen by the most people, or by the right people?",
      },
    ],
  },

  "A-transcendence": {
    code: "A-transcendence",
    mirror: {
      code: "A-enhancement",
      description_zh:
        "你们都有丰富的内在世界，但C位把它变成舞台表演，你把它变成秘密通道。他要让全世界看见，你要让一个人感受到。",
      description_en:
        "You both have rich inner worlds, but Icon turns theirs into a stage performance while you turn yours into a secret passage. They want the world to see, you want one person to feel.",
    },
    allies: [
      {
        code: "I-transcendence",
        why_zh:
          "科学家理解你对深度的执着——他用逻辑探索深层结构，你用直觉。你们从不同入口到达同一个地方。",
        why_en:
          "Researcher understands your devotion to depth — they explore deep structure through logic, you through intuition. Different entrances, same destination.",
      },
      {
        code: "S-transcendence",
        why_zh:
          "疗愈师给你安全的创作空间。在他身边你不需要解释自己，只需要创作。",
        why_en:
          "Healer gives you a safe space to create. Around them you don't need to explain yourself — just create.",
      },
    ],
    growthEdge: [
      {
        code: "C-enhancement",
        why_zh:
          "总指挥会教你一件你最不想学但最需要的事：把你的作品交付出去，按时、按规格，哪怕不完美。",
        why_en:
          "Commander teaches you the thing you least want to learn but most need: shipping your work on time, to spec, even when it's not perfect.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // S (Social) — 联结
  // ═══════════════════════════════════════════════

  "S-enhancement": {
    code: "S-enhancement",
    mirror: {
      code: "S-transcendence",
      description_zh:
        "你们都爱帮人，但你帮人靠的是推一把，疗愈师帮人靠的是接住。你说「你可以更好」，他说「你现在就很好」。最好的成长环境两样都需要。",
      description_en:
        "You both love helping people, but you help by pushing and Healer helps by catching. You say 'you can be better,' they say 'you're okay right now.' The best growth environment needs both.",
    },
    allies: [
      {
        code: "E-transcendence",
        why_zh:
          "先驱有你认同的使命感——你培养人才，他改变系统，人才在新系统里发光。",
        why_en:
          "Pioneer shares your sense of mission — you develop talent, they change systems, and talent shines in the new system.",
      },
      {
        code: "A-enhancement",
        why_zh: "C位需要你这样的伯乐。你看到他的潜力，他用表现来证明你的眼光。",
        why_en:
          "Icon needs a Mentor like you. You see their potential, they prove your judgment through performance.",
      },
    ],
    growthEdge: [
      {
        code: "R-enhancement",
        why_zh:
          "工程专家会提醒你：有些时候最好的帮助不是推人，是把工具做好让人自己用。",
        why_en:
          "Architect reminds you that sometimes the best help isn't pushing people — it's building great tools and letting them use it themselves.",
      },
    ],
  },

  "S-transcendence": {
    code: "S-transcendence",
    mirror: {
      code: "S-enhancement",
      description_zh:
        "你们都以人为中心，但伯乐看到潜力然后推，你看到痛苦然后接住。他像教练，你像港湾。",
      description_en:
        "You're both people-centered, but Mentor sees potential and pushes while you see pain and catch. They're the coach, you're the harbor.",
    },
    allies: [
      {
        code: "A-transcendence",
        why_zh:
          "追梦人和你一样用情感连接世界。你用临在疗愈人，他用作品疗愈人。",
        why_en:
          "Dreamweaver connects with the world through emotion, just like you. You heal through presence, they heal through art.",
      },
      {
        code: "R-transcendence",
        why_zh:
          "主心骨和你一样默默付出。你守护人的心理安全，他守护系统的运行安全。",
        why_en:
          "Backbone gives quietly, just like you. You guard psychological safety, they guard operational safety.",
      },
    ],
    growthEdge: [
      {
        code: "I-enhancement",
        why_zh:
          "战略家会教你设界限：你不必接住每一个人的痛苦——那不是自私，是策略性的自我保护。",
        why_en:
          "Tactician teaches you to set boundaries: you don't have to absorb everyone's pain — that's not selfish, it's strategic self-preservation.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // E (Enterprising) — 驱动
  // ═══════════════════════════════════════════════

  "E-enhancement": {
    code: "E-enhancement",
    mirror: {
      code: "E-transcendence",
      description_zh:
        "你们都充满冲劲，但你在现有规则里找缝隙冲进去，先驱直接掀桌子建新规则。你是短跑冠军，他是马拉松选手。",
      description_en:
        "You're both driven, but you find gaps in existing rules and sprint through while Pioneer flips the table and builds new ones. You're the sprinter, they're the marathon runner.",
    },
    allies: [
      {
        code: "I-enhancement",
        why_zh: "战略家帮你把直觉变成可辩护的判断——你冲得快，他帮你瞄得准。",
        why_en:
          "Tactician turns your gut instinct into defensible judgment — you move fast, they help you aim true.",
      },
      {
        code: "C-enhancement",
        why_zh: "总指挥把你从零到一的成果变成从一到十的体系。你开疆，他守城。",
        why_en:
          "Commander turns your zero-to-one into a one-to-ten system. You conquer, they consolidate.",
      },
    ],
    growthEdge: [
      {
        code: "I-transcendence",
        why_zh:
          "科学家会让你慢下来想一想：你冲进去的那个窗口，真的是你以为的那个窗口吗？",
        why_en:
          "Researcher slows you down to ask: is the window you're charging through really the one you think it is?",
      },
    ],
  },

  "E-transcendence": {
    code: "E-transcendence",
    mirror: {
      code: "E-enhancement",
      description_zh:
        "你们都有野心，但王牌的野心是「我要赢」，你的野心是「这个世界不对，我要修它」。他利用系统，你重建系统。",
      description_en:
        "You're both ambitious, but Ace's ambition is 'I want to win' while yours is 'this is broken and I'm going to fix it.' They exploit the system, you rebuild it.",
    },
    allies: [
      {
        code: "S-enhancement",
        why_zh:
          "伯乐帮你找到并培养能一起改变世界的人。你有愿景，他有识人的眼睛。",
        why_en:
          "Mentor finds and develops the people who can change the world with you. You have the vision, they have the eye for talent.",
      },
      {
        code: "I-transcendence",
        why_zh: "科学家给你的愿景提供证据基础——没有数据支撑的变革只是空想。",
        why_en:
          "Researcher gives your vision an evidence base — change without data is just a dream.",
      },
    ],
    growthEdge: [
      {
        code: "R-transcendence",
        why_zh:
          "主心骨会提醒你：掀桌子之前，确保桌子底下的人不会被砸到。变革需要基础设施。",
        why_en:
          "Backbone reminds you: before flipping the table, make sure nobody underneath gets crushed. Revolution needs infrastructure.",
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // C (Conventional) — 秩序
  // ═══════════════════════════════════════════════

  "C-enhancement": {
    code: "C-enhancement",
    mirror: {
      code: "C-transcendence",
      description_zh:
        "你们都热爱秩序，但你建流程是为了赢——效率就是护城河。仲裁人建流程是为了公平——每个人都应该被同等对待。",
      description_en:
        "You both love order, but you build processes to win — efficiency is the moat. Arbiter builds processes for fairness — everyone deserves equal treatment.",
    },
    allies: [
      {
        code: "E-enhancement",
        why_zh: "王牌从零到一，你从一到十。他开疆拓土，你让帝国运转。",
        why_en:
          "Ace goes zero-to-one, you go one-to-ten. They conquer new territory, you make the empire run.",
      },
      {
        code: "R-enhancement",
        why_zh: "工程专家和你一样在乎精密。你管流程的精密，他管产品的精密。",
        why_en:
          "Architect shares your obsession with precision. You manage process precision, they manage product precision.",
      },
    ],
    growthEdge: [
      {
        code: "A-transcendence",
        why_zh:
          "追梦人会让你看到流程之外的东西——有些最重要的价值无法被量化、无法被管理，只能被感受。",
        why_en:
          "Dreamweaver shows you what lies beyond process — some of the most important things can't be measured or managed, only felt.",
      },
    ],
  },

  "C-transcendence": {
    code: "C-transcendence",
    mirror: {
      code: "C-enhancement",
      description_zh:
        "你们都重视规则，但总指挥用规则赢比赛，你用规则保护最弱势的人。他是将军，你是法官。",
      description_en:
        "You both value rules, but Commander uses them to win the game while you use them to protect the most vulnerable. They're the general, you're the judge.",
    },
    allies: [
      {
        code: "I-transcendence",
        why_zh: "科学家和你一样追求过程的诚实。你守制度诚实，他守方法诚实。",
        why_en:
          "Researcher shares your commitment to process integrity. You guard institutional honesty, they guard methodological honesty.",
      },
      {
        code: "R-transcendence",
        why_zh:
          "主心骨和你一样在守护。你守护公平，他守护稳定。沉默的守护者联盟。",
        why_en:
          "Backbone guards alongside you. You guard fairness, they guard stability. A quiet alliance of guardians.",
      },
    ],
    growthEdge: [
      {
        code: "E-enhancement",
        why_zh:
          "王牌会告诉你：有时候打破一条旧规则比维护它更公平——因为那条规则本身就是不公平的产物。",
        why_en:
          "Ace tells you: sometimes breaking an old rule is fairer than enforcing it — because the rule itself was born from injustice.",
      },
    ],
  },
};

/**
 * Look up archetype relations by code.
 */
export function getArchetypeRelations(
  code: string,
): ArchetypeRelation | undefined {
  return ARCHETYPE_RELATIONS[code];
}
