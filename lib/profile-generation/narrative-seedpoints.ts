// ============================================================
// Narrative Seedpoints Engine — Pure Algorithm (Zero LLM)
//
// Pre-computes the 5-8 most narratively powerful psychological
// patterns from assessment data. Each seedpoint is a precise
// insight + behavioral scene + tension/reframe that gives the
// LLM "ammunition" for writing penetrating narratives.
//
// Philosophy: The LLM doesn't discover insights — we do.
// The LLM weaves them into prose.
// ============================================================

import type { PersonalProfileData } from "../types";
import type { ProfileAlgorithmOutput } from "../types/report";
import type { BigFiveDimension } from "../types";
import {
  detectIntraDomainTensions,
  type IntraDomainTension,
} from "./detect-facet-tensions";

type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

// ── Types ────────────────────────────────────────────────────

export interface NarrativeSeedpoint {
  /** Which pattern category this seedpoint represents */
  category:
    | "cross-domain-amplification"
    | "cross-domain-tension"
    | "intra-domain-tension"
    | "value-personality-clash"
    | "archetype-shadow"
    | "sjt-gap";
  /** Narrative importance: higher = more story-worthy (0-100) */
  salience: number;
  /** Bilingual insight: what the data reveals */
  insight: { en: string; zh: string };
  /** Bilingual scene: a behavioral moment the user will recognize */
  scene: { en: string; zh: string };
  /** Bilingual tension/reframe: why this matters, the "aha" */
  tension: { en: string; zh: string };
}

export interface NarrativeSeedpointsResult {
  seedpoints: NarrativeSeedpoint[];
  /** Dominant narrative theme — the overarching story of this person */
  dominantTheme: { en: string; zh: string };
}

// ── Band helpers ─────────────────────────────────────────────

function isHigh(score: number): boolean {
  return score > 65;
}
function isLow(score: number): boolean {
  return score < 35;
}

// ── Cross-Domain Pattern Definitions ─────────────────────────
// Each pattern: condition on 2+ Big Five domains → narrative seedpoint.
// Patterns are based on established personality psychology research
// (Costa & McCrae, 1992; DeYoung, 2015; Roberts et al., 2005).

interface CrossDomainPattern {
  id: string;
  category: "cross-domain-amplification" | "cross-domain-tension";
  test: (d: Record<BigFiveDimension, number>) => boolean;
  salience: (d: Record<BigFiveDimension, number>) => number;
  insight: { en: string; zh: string };
  scene: { en: string; zh: string };
  tension: { en: string; zh: string };
}

const CROSS_DOMAIN_PATTERNS: CrossDomainPattern[] = [
  // ── Amplification patterns (two traits reinforce each other) ──
  {
    id: "high-O-low-C",
    category: "cross-domain-amplification",
    test: (d) => isHigh(d.openness) && isLow(d.conscientiousness),
    salience: (d) => (d.openness - d.conscientiousness) * 0.8,
    insight: {
      en: "You generate ideas faster than you can execute them — not from laziness, but because each new possibility genuinely feels more urgent than finishing the last one.",
      zh: "你产生想法的速度远超执行速度——不是因为懒惰，而是每个新的可能性都真实地比完成上一个更紧迫。",
    },
    scene: {
      en: "You probably have multiple browser tabs open right now, three half-started projects in various states, and a note-taking app full of ideas you'll 'get to later.'",
      zh: "你现在大概开着十几个浏览器标签页，有三个处于不同阶段的未完成项目，还有一个塞满'以后再看'想法的笔记应用。",
    },
    tension: {
      en: "This isn't a flaw to fix — it's a creative metabolism that needs a capture system, not more discipline. The cost: you sometimes abandon good ideas one iteration before they'd have become great.",
      zh: "这不是需要修复的缺陷——而是一种创造性的新陈代谢，需要的是捕捉系统而非更多自律。代价是：你有时在好想法变成伟大想法的前一步就放弃了。",
    },
  },
  {
    id: "high-C-low-O",
    category: "cross-domain-amplification",
    test: (d) => isHigh(d.conscientiousness) && isLow(d.openness),
    salience: (d) => (d.conscientiousness - d.openness) * 0.8,
    insight: {
      en: "You build deep expertise through systematic mastery rather than broad exploration — you'd rather know one domain completely than skim across five.",
      zh: "你通过系统性精通而非广泛探索来构建深度专业能力——比起浅尝五个领域，你宁愿彻底掌握一个。",
    },
    scene: {
      en: "When colleagues suggest 'pivoting' to a trendy new approach, your instinct is to ask 'what's wrong with what already works?' — not out of resistance, but genuine respect for proven methods.",
      zh: "当同事建议'转向'一种流行新方法时，你的本能反应是'现有方法有什么问题吗？'——不是出于抗拒，而是对经过验证的方法的真诚尊重。",
    },
    tension: {
      en: "Your depth is rare and valuable, but the cost is occasionally missing paradigm shifts until they're undeniable. The world rewards your execution excellence — but sometimes needs you to bet on the unproven.",
      zh: "你的深度是稀缺且珍贵的，但代价是偶尔会错过范式转变直到它们不可否认。世界奖励你的执行卓越——但有时需要你押注于尚未被证明的事物。",
    },
  },
  {
    id: "high-E-low-A",
    category: "cross-domain-tension",
    test: (d) => isHigh(d.extraversion) && isLow(d.agreeableness),
    salience: (d) => Math.abs(d.extraversion - d.agreeableness) * 0.7,
    insight: {
      en: "You're drawn to people and social energy, but on your own terms — you connect through challenge and debate rather than warmth and accommodation.",
      zh: "你被人群和社交能量吸引，但是按你自己的方式——你通过挑战和辩论而非温暖和迁就来建立连接。",
    },
    scene: {
      en: "In a meeting, you're the one who energizes the room by pushing back on the safe consensus — and then genuinely confused when someone takes it personally.",
      zh: "在会议中，你是那个通过挑战安全共识来激活整个房间的人——然后当有人觉得被冒犯时真心感到困惑。",
    },
    tension: {
      en: "You don't lack empathy — you express care through honesty. The challenge: others often need to feel heard before they can hear your truth.",
      zh: "你不是缺乏共情——你通过坦诚来表达关心。挑战在于：别人通常需要先感到被倾听，才能听进你的真话。",
    },
  },
  {
    id: "high-A-low-E",
    category: "cross-domain-tension",
    test: (d) => isHigh(d.agreeableness) && isLow(d.extraversion),
    salience: (d) => Math.abs(d.agreeableness - d.extraversion) * 0.7,
    insight: {
      en: "You care deeply about others but express it through quiet acts rather than visible leadership — your influence is felt, not announced.",
      zh: "你深切关心他人，但通过安静的行动而非显眼的领导来表达——你的影响力是被感受到的，而非被宣告的。",
    },
    scene: {
      en: "You're the one who notices when a colleague is struggling and sends a thoughtful message after the meeting — but would never call it out in front of the group.",
      zh: "你是那个注意到同事正在挣扎、然后在会后发一条贴心消息的人——但绝不会在众人面前指出来。",
    },
    tension: {
      en: "Your quiet care is your superpower, but it's invisible to systems that reward visibility. The risk: resentment when your contributions go unrecognized because you didn't perform them loudly enough.",
      zh: "你安静的关怀是你的超能力，但它在奖励可见性的系统中是隐形的。风险在于：当你的贡献因为不够高调而被忽视时，你会累积怨气。",
    },
  },
  {
    id: "high-N-high-C",
    category: "cross-domain-tension",
    test: (d) => isHigh(d.neuroticism) && isHigh(d.conscientiousness),
    salience: (d) => (d.neuroticism + d.conscientiousness - 100) * 0.6,
    insight: {
      en: "Your inner critic and your drive for excellence are the same engine — the anxiety that keeps you checking, rechecking, and perfecting is also what makes your output consistently reliable.",
      zh: "你的内在批评者和你对卓越的追求是同一个引擎——那个让你不断检查、复查、完善的焦虑，也正是让你的产出始终可靠的原因。",
    },
    scene: {
      en: "You've rewritten that email three times, not because it was wrong, but because 'good enough' physically bothers you. You arrive prepared when others wing it — but the preparation cost you sleep.",
      zh: "你已经重写那封邮件三遍了，不是因为它有错，而是因为'差不多就行'让你身体不适。当别人即兴发挥时，你做好了充分准备——但准备的代价是你的睡眠。",
    },
    tension: {
      en: "This pairing produces exceptional quality work, but at a personal cost that compounds silently. Your challenge isn't lowering standards — it's learning that 'done' is sometimes more valuable than 'perfect.'",
      zh: "这种组合产出了卓越的工作质量，但个人代价在无声地累积。你的挑战不是降低标准——而是学会有时候'完成'比'完美'更有价值。",
    },
  },
  {
    id: "high-O-high-N",
    category: "cross-domain-tension",
    test: (d) => isHigh(d.openness) && isHigh(d.neuroticism),
    salience: (d) => (d.openness + d.neuroticism - 100) * 0.6,
    insight: {
      en: "You feel everything with unusual depth — beauty, injustice, possibility, pain. Your rich inner world is both your creative wellspring and your greatest vulnerability.",
      zh: "你以不寻常的深度感受一切——美、不公、可能性、痛苦。你丰富的内心世界既是你的创造力源泉，也是你最大的脆弱处。",
    },
    scene: {
      en: "A single piece of music can shift your entire mood. A throwaway comment from someone can replay in your mind for days. You see layers in situations that others walk right past.",
      zh: "一段音乐就能改变你整个心情。别人的一句无心之言能在你脑中回放好几天。你在别人径直走过的情境中看到层层叠叠的含义。",
    },
    tension: {
      en: "This perceptual depth is genuine gift territory — artists, therapists, and visionaries share this pattern. The work is building the container that lets you use this sensitivity without being consumed by it.",
      zh: "这种感知深度是真正的天赋领地——艺术家、治疗师和远见者都共享这个模式。需要做的是建造一个容器，让你运用这份敏感而不被它吞噬。",
    },
  },
  {
    id: "low-E-low-A",
    category: "cross-domain-amplification",
    test: (d) => isLow(d.extraversion) && isLow(d.agreeableness),
    salience: (d) => (100 - d.extraversion - d.agreeableness) * 0.5,
    insight: {
      en: "You operate with an unusual degree of independence — neither seeking social energy nor social approval. This makes you remarkably self-directed but potentially isolated.",
      zh: "你以不寻常的独立程度运作——既不寻求社交能量，也不寻求社会认可。这让你高度自主，但也可能走向孤立。",
    },
    scene: {
      en: "You can work alone for days without feeling lonely. You're the one who actually prefers the individual assignment when the professor offers a group option.",
      zh: "你可以独自工作好几天而不感到孤独。当教授提供小组作业选项时，你是那个真心更想做个人作业的人。",
    },
    tension: {
      en: "Your independence is genuine strength in knowledge work and creative fields. The cost: you may systematically underestimate how much others' input could improve your work.",
      zh: "你的独立性在知识工作和创意领域是真正的优势。代价是：你可能系统性地低估了他人的意见能在多大程度上改善你的工作。",
    },
  },
  {
    id: "high-E-high-C",
    category: "cross-domain-amplification",
    test: (d) => isHigh(d.extraversion) && isHigh(d.conscientiousness),
    salience: (d) => (d.extraversion + d.conscientiousness - 100) * 0.5,
    insight: {
      en: "You combine social energy with systematic follow-through — you don't just inspire action, you deliver results. This is the classic high-performance leadership pattern.",
      zh: "你将社交能量与系统性的后续执行结合在一起——你不只是激发行动，你交付成果。这是经典的高绩效领导力模式。",
    },
    scene: {
      en: "You're the person who rallies the team around a vision AND then personally tracks every milestone to completion. Others dream or execute — you do both.",
      zh: "你是那个既能围绕愿景凝聚团队、又能亲自追踪每个里程碑直到完成的人。别人要么梦想、要么执行——你两者兼得。",
    },
    tension: {
      en: "The shadow: you may unconsciously expect others to match your pace, creating team friction when they can't. And you may fill silence with action when stillness is what's actually needed.",
      zh: "阴影面：你可能无意识地期待他人匹配你的节奏，当他们做不到时制造团队摩擦。而当真正需要的是静止时，你可能用行动填满沉默。",
    },
  },
  {
    id: "high-A-high-N",
    category: "cross-domain-tension",
    test: (d) => isHigh(d.agreeableness) && isHigh(d.neuroticism),
    salience: (d) => (d.agreeableness + d.neuroticism - 100) * 0.6,
    insight: {
      en: "You absorb others' emotions like a sponge — your care for people is genuine and deep, but you carry their weight alongside your own.",
      zh: "你像海绵一样吸收他人的情绪——你对人的关怀真诚而深沉，但你承载着他们的重量以及你自己的。",
    },
    scene: {
      en: "After a friend tells you about their bad day, you feel it in your body for hours. You say yes to help before checking whether you have the bandwidth — and then feel trapped.",
      zh: "朋友跟你说了他糟糕的一天后，你的身体会感受到那种情绪持续好几个小时。你在确认自己是否有余力之前就答应帮忙——然后感到被困住。",
    },
    tension: {
      en: "Your emotional permeability is what makes you an extraordinary friend, mentor, or healer. The non-negotiable skill: learning to distinguish between empathy (feeling WITH someone) and absorption (feeling AS someone).",
      zh: "你的情感渗透性正是让你成为非凡的朋友、导师或疗愈者的原因。不可妥协的技能：学会区分共情（和别人一起感受）与吸收（作为别人感受）。",
    },
  },
  {
    id: "high-O-low-A",
    category: "cross-domain-amplification",
    test: (d) => isHigh(d.openness) && isLow(d.agreeableness),
    salience: (d) => Math.abs(d.openness - d.agreeableness) * 0.65,
    insight: {
      en: "You think independently and don't soften your conclusions for social comfort. You see what others miss and say what others won't.",
      zh: "你独立思考，不会为了社交舒适而软化你的结论。你看到别人错过的，说出别人不愿说的。",
    },
    scene: {
      en: "In brainstorming sessions, you're the one who points out the elephant in the room while everyone else is politely working around it.",
      zh: "在头脑风暴中，你是那个指出房间里的大象的人，而其他人都在礼貌地绕道而行。",
    },
    tension: {
      en: "Organizations need this voice desperately — but often punish it. Your career challenge: finding environments that genuinely reward intellectual honesty, not just claim to.",
      zh: "组织迫切需要这种声音——但往往会惩罚它。你的职业挑战：找到真正奖励知识诚实的环境，而不是只声称如此。",
    },
  },
];

// ── Value × Personality Clash Patterns ───────────────────────

interface ValuePersonalityPattern {
  id: string;
  test: (
    d: Record<BigFiveDimension, number>,
    top3: string[],
    ranking: string[],
  ) => boolean;
  salience: () => number;
  insight: { en: string; zh: string };
  scene: { en: string; zh: string };
  tension: { en: string; zh: string };
}

const VALUE_PERSONALITY_PATTERNS: ValuePersonalityPattern[] = [
  {
    id: "achievement-low-C",
    test: (d, top3) =>
      top3.includes("achievement") && isLow(d.conscientiousness),
    salience: () => 75,
    insight: {
      en: "You deeply value accomplishment, but your natural rhythm resists the systematic grind that conventional achievement requires. You don't lack ambition — you lack patience with the boring middle.",
      zh: "你深深重视成就，但你的自然节奏抵制传统成就所需的系统性磨练。你不缺野心——你缺的是对无聊中段的耐心。",
    },
    scene: {
      en: "You've started ambitious projects with genuine fire — and found your energy evaporating not at the hard parts, but at the repetitive parts. The hundredth iteration of a good idea feels like death.",
      zh: "你曾带着真正的热情开始雄心勃勃的项目——然后发现你的能量不是在困难的部分蒸发，而是在重复的部分。一个好主意的第一百次迭代感觉像死亡。",
    },
    tension: {
      en: "Your path to achievement isn't through more discipline — it's through finding work where the doing IS the reward. Roles where intensity matters more than consistency.",
      zh: "你通往成就的路径不是靠更多自律——而是找到做事本身就是奖励的工作。强度比一致性更重要的角色。",
    },
  },
  {
    id: "benevolence-low-A",
    test: (d, top3) => top3.includes("benevolence") && isLow(d.agreeableness),
    salience: () => 80,
    insight: {
      en: "You genuinely want to help people — but not by being nice. Your care shows up as uncomfortable truths, high standards, and refusing to let people settle for less than they're capable of.",
      zh: "你真心想帮助别人——但不是通过做老好人。你的关心表现为让人不舒服的真话、高标准、以及拒绝让人安于低于能力的现状。",
    },
    scene: {
      en: "When a friend asks for advice, you tell them what they need to hear, not what they want to hear. Some call this harsh. The people who grow from it call you the friend who changed their life.",
      zh: "当朋友向你寻求建议时，你告诉他们需要听到的，而非想要听到的。有人说这很尖锐。那些从中成长的人称你为改变了他们人生的朋友。",
    },
    tension: {
      en: "This is 'tough love' in its truest form — but it only works when the other person trusts your intention. Without that trust, it's just bluntness.",
      zh: "这是最真实意义上的'严厉的爱'——但只有当对方信任你的意图时才有效。没有那份信任，它只是生硬。",
    },
  },
  {
    id: "self-direction-high-C",
    test: (d, top3) =>
      top3.includes("self-direction") && isHigh(d.conscientiousness),
    salience: () => 70,
    insight: {
      en: "You want freedom but build structure — you're the rare person who creates their own rules and then actually follows them. Others rebel or comply. You architect.",
      zh: "你渴望自由但构建结构——你是那种罕见的人：创造自己的规则然后真正遵循它们。别人要么反叛要么服从。你在建构。",
    },
    scene: {
      en: "You've probably built personal systems — morning routines, note-taking workflows, project management methods — that you designed yourself and follow with near-religious consistency.",
      zh: "你大概已经建立了个人系统——早晨routine、笔记工作流、项目管理方法——全都是你自己设计的，并且以近乎虔诚的一致性遵循。",
    },
    tension: {
      en: "The risk: your self-built structure can become a gilded cage. You need environments that give you autonomy to design the 'how' — but occasionally disrupt your system to prevent calcification.",
      zh: "风险在于：你自建的结构可能变成镀金的笼子。你需要给予你自主设计'如何做'的环境——但偶尔也需要打破你的系统以防止僵化。",
    },
  },
  {
    id: "power-low-E",
    test: (d, top3) => top3.includes("power") && isLow(d.extraversion),
    salience: () => 75,
    insight: {
      en: "You want influence — but not the spotlight. You'd rather be the strategic mind behind the decision than the charismatic face presenting it.",
      zh: "你想要影响力——但不要聚光灯。你宁愿做决策背后的战略大脑，而非展示它的魅力面孔。",
    },
    scene: {
      en: "You influence through preparation, written arguments, and one-on-one conversations rather than speeches. Your power is earned through competence, not charm.",
      zh: "你通过准备、书面论证和一对一谈话来施加影响，而非演讲。你的权力是通过能力赢得的，而非魅力。",
    },
    tension: {
      en: "Many leadership paths assume extroverted power. Your challenge: finding the roles where quiet authority is recognized — technical leadership, advisory roles, editorial direction.",
      zh: "许多领导力路径假设的是外向型权力。你的挑战：找到安静权威被认可的角色——技术领导、顾问角色、编辑方向。",
    },
  },
  {
    id: "security-high-O",
    test: (d, top3) => top3.includes("security") && isHigh(d.openness),
    salience: () => 70,
    insight: {
      en: "Part of you craves stability while another part is pulled toward the novel and unknown. You're not confused — you're holding a real creative tension that most people resolve by choosing a side.",
      zh: "你的一部分渴望稳定，另一部分被新奇和未知吸引。你不是困惑——你持有一种真实的创造性张力，大多数人通过选择一方来解决它。",
    },
    scene: {
      en: "You dream about adventurous career changes — while simultaneously maintaining a meticulous savings plan. You read about radical lifestyles — from a very comfortable couch.",
      zh: "你梦想着冒险的职业转变——同时维持着一份细致的储蓄计划。你阅读关于激进生活方式的内容——在一张非常舒适的沙发上。",
    },
    tension: {
      en: "The synthesis: you thrive in roles that offer exploration within a stable container — research positions, innovation within established companies, creative work with reliable income.",
      zh: "综合之道：你在稳定容器中提供探索的角色中茁壮成长——研究职位、大公司中的创新、有稳定收入的创意工作。",
    },
  },
];

// ── Archetype × Shadow Patterns ──────────────────────────────

function computeArchetypeShadowSeed(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
): NarrativeSeedpoint | null {
  const primary = profile.archetype?.primary;
  const domains = algo.bigFiveDomains;
  if (!primary || !domains) return null;

  // Social archetype (S) + low Extraversion
  if (primary === "S" && isLow(domains.extraversion)) {
    return {
      category: "archetype-shadow",
      salience: 80,
      insight: {
        en: "Your career interests draw you toward people-centered work, but your energy system is wired for depth over breadth. You connect powerfully — but in small doses.",
        zh: "你的职业兴趣将你拉向以人为中心的工作，但你的能量系统是为深度而非广度设计的。你连接的力量很强——但是小剂量的。",
      },
      scene: {
        en: "After a day of intense one-on-one conversations, you feel fulfilled AND depleted simultaneously. You're drawn to helping professions but dread open-plan offices.",
        zh: "经历一天密集的一对一谈话后，你同时感到满足和耗竭。你被助人职业吸引，但害怕开放式办公室。",
      },
      tension: {
        en: "The resolution isn't choosing between people and solitude — it's designing a work rhythm that alternates. Therapy, coaching, writing-about-people: all honor both sides.",
        zh: "解决之道不是在人群和独处之间选择——而是设计一种交替的工作节奏。治疗、教练、关于人的写作：都尊重两面。",
      },
    };
  }

  // Enterprising archetype (E) + high Agreeableness
  if (primary === "E" && isHigh(domains.agreeableness)) {
    return {
      category: "archetype-shadow",
      salience: 75,
      insight: {
        en: "You're drawn to leadership and influence, but your natural instinct is to lead through consensus rather than command. You want to drive — without running anyone over.",
        zh: "你被领导力和影响力吸引，但你的自然本能是通过共识而非命令来领导。你想驱动——但不碾压任何人。",
      },
      scene: {
        en: "You delay tough decisions because you're still trying to find the solution where nobody loses. Sometimes this patience produces brilliant compromises. Sometimes it produces paralysis.",
        zh: "你推迟艰难决定，因为你还在尝试找到没有人输的解决方案。有时这种耐心产出出色的妥协。有时它产出瘫痪。",
      },
      tension: {
        en: "The leadership style that fits you isn't command-and-control OR pure democracy — it's 'listen deeply, then decide decisively.' The hard part: accepting that good decisions sometimes create losers.",
        zh: "适合你的领导风格既不是命令与控制也不是纯粹的民主——而是'深度倾听，然后果断决定。'困难的部分：接受好的决定有时会创造失败者。",
      },
    };
  }

  // Investigative archetype (I) + low Openness
  if (primary === "I" && isLow(domains.openness)) {
    return {
      category: "archetype-shadow",
      salience: 70,
      insight: {
        en: "You're intellectually curious about specific domains, but prefer depth in proven territory over speculative exploration. You investigate — within frameworks you trust.",
        zh: "你对特定领域有智识上的好奇心，但比起推测性探索，你更喜欢在已证明的领域中深耕。你探究——在你信任的框架内。",
      },
      scene: {
        en: "You'll spend weeks mastering a methodology's nuances, but feel skeptical when someone suggests 'trying a completely different approach.' Not closed-minded — methodical.",
        zh: "你会花几周精通一种方法论的细微之处，但当有人建议'试试完全不同的方法'时感到怀疑。不是封闭——是有方法的。",
      },
      tension: {
        en: "Your path: applied research, quality assurance, systematic optimization — domains where deep knowledge of established methods IS the innovation.",
        zh: "你的路径：应用研究、质量保证、系统优化——在这些领域，对已建立方法的深度知识本身就是创新。",
      },
    };
  }

  // Artistic archetype (A) + high Conscientiousness
  if (primary === "A" && isHigh(domains.conscientiousness)) {
    return {
      category: "archetype-shadow",
      salience: 75,
      insight: {
        en: "You bring unusual discipline to creative work — you don't wait for inspiration, you show up and build. This makes you productive where others stall, but sometimes your structure constrains your wildest ideas.",
        zh: "你为创意工作带来不寻常的纪律——你不等灵感，你出现并开始构建。这让你在别人停滞的地方保持高产，但有时你的结构会约束你最狂野的想法。",
      },
      scene: {
        en: "You have a creative routine — same time, same place, same warm-up. Your output is consistent. But you sometimes wonder if your best ideas live outside the routine.",
        zh: "你有创作routine——同样的时间、同样的地点、同样的热身。你的产出是稳定的。但你有时会想，你最好的想法是否住在routine之外。",
      },
      tension: {
        en: "You're the craftsperson archetype — not the tortured genius, but the reliable creator who ships. Protect this. But schedule chaos occasionally: random inputs, unfamiliar media, deliberate play.",
        zh: "你是工匠型——不是受折磨的天才，而是可靠的、持续交付的创造者。保护这一点。但偶尔安排混沌：随机输入、不熟悉的媒介、刻意的玩耍。",
      },
    };
  }

  return null;
}

// ── SJT Gap Seedpoint ────────────────────────────────────────

function computeSJTSeed(algo: AlgoSnapshot): NarrativeSeedpoint | null {
  const consistency = algo.sjtTensions?.overallConsistency ?? 0;
  const tensions = algo.sjtTensions?.notableTensions ?? [];
  const scenarios = algo.sjtTensions?.scenarios ?? [];

  // High consistency — this is also interesting
  if (consistency >= 0.8 && scenarios.length > 0) {
    return {
      category: "sjt-gap",
      salience: 55,
      insight: {
        en: "Your values and your instincts are unusually aligned — what you think you should do and what you actually do rarely diverge. This self-coherence is rare.",
        zh: "你的价值观和你的本能异常一致——你认为应该做的和你实际会做的很少分歧。这种自我一致性是罕见的。",
      },
      scene: {
        en: "When faced with ethical dilemmas at work, you don't agonize — your response feels natural because your conscious values match your gut reactions.",
        zh: "当面对工作中的道德两难时，你不会痛苦纠结——你的回应感觉自然，因为你的意识价值观和你的直觉反应一致。",
      },
      tension: {
        en: "The shadow of high consistency: you may have a blind spot for situations where the 'right' answer isn't the one that feels natural. Your comfort zone and your moral compass may be more overlapping than you realize.",
        zh: "高一致性的阴影面：你可能对'正确'答案不是那个感觉自然的答案的情况有盲区。你的舒适区和你的道德指南针可能比你意识到的更重叠。",
      },
    };
  }

  // Notable gaps — more interesting narratively
  if (tensions.length > 0 && consistency < 0.65) {
    const topGap = scenarios
      .filter((s) => Math.abs(s.gap) > 0.3)
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];

    return {
      category: "sjt-gap",
      salience: 70,
      insight: {
        en: "There's a gap between your ideals and your instincts — not because you're dishonest, but because your values have evolved faster than your behavioral habits. You know who you want to be; your autopilot hasn't caught up.",
        zh: "你的理想和你的本能之间存在差距——不是因为你不诚实，而是因为你的价值观进化速度快于你的行为习惯。你知道自己想成为谁；你的自动驾驶还没跟上。",
      },
      scene: {
        en: topGap
          ? `In situations involving ${topGap.domain.toLowerCase()}, you feel the pull most strongly — your principled self says one thing, but your instinctive response says another.`
          : "In certain high-stakes situations, you can feel the split in real-time: your mind reaching for the principled response while your body leans toward the comfortable one.",
        zh: topGap ? `在涉及${topGap.domain}的情境中，你最强烈地感到这种拉扯——你原则性的自我说一件事，但你的本能反应说另一件。` : "在某些高压情境中，你能实时感受到分裂：你的理性在伸向原则性的回应，而你的身体在倾向于舒适的那个。",
      },
      tension: {
        en: "This gap is actually a sign of growth — it means you're reaching beyond your current defaults. The work: not eliminating the gap, but noticing it in real-time and making conscious choices.",
        zh: "这个差距实际上是成长的标志——它意味着你在超越当前的默认设置。需要做的：不是消除差距，而是在实时中注意到它并做出有意识的选择。",
      },
    };
  }

  return null;
}

// ── Intra-Domain Tension Seedpoint ───────────────────────────

// Facet-specific scene library — keyed by "highFacet|lowFacet" pairs.
// Each entry produces a precise behavioral scene instead of a generic template.
type FacetTensionScene = {
  en: { insight: string; scene: string };
  zh: { insight: string; scene: string };
};

const FACET_TENSION_SCENES: Record<string, FacetTensionScene> = {
  "Assertiveness|Gregariousness": {
    en: {
      insight:
        "You take charge in conversations but avoid crowds — a quiet leader who commands a room of five but vanishes at a party of fifty.",
      scene:
        "In a small team meeting, you're the one driving the agenda. At the company all-hands? You're checking your phone by the exit.",
    },
    zh: {
      insight:
        "你在对话中主导但回避人群——一个能掌控五人房间但在五十人派对中消失的安静领导者。",
      scene:
        "在小团队会议中，你推动议程。在公司全体大会上？你在出口附近看手机。",
    },
  },
  "Excitement Seeking|Gregariousness": {
    en: {
      insight:
        "You crave intense experiences but not social ones — your thrill-seeking is a solo sport.",
      scene:
        "You'd go skydiving alone on a Tuesday but decline the team dinner on Friday. The adrenaline you chase doesn't come from people.",
    },
    zh: {
      insight: "你渴望强烈体验但不是社交体验——你的刺激追求是独自运动。",
      scene:
        "你会在周二独自去跳伞，但拒绝周五的团队聚餐。你追逐的肾上腺素不来自人群。",
    },
  },
  "Achievement Striving|Orderliness": {
    en: {
      insight:
        "You're ambitious but messy — you chase big goals through bursts of intensity rather than tidy systems. Your desk is chaos but your output is impressive.",
      scene:
        "Your to-do list is scattered across three apps, some sticky notes, and your memory. Yet somehow you deliver. People who value neat processes find you maddening.",
    },
    zh: {
      insight:
        "你有野心但不整洁——你通过爆发式的强度而非整齐的系统来追逐大目标。你的桌面是混乱的，但你的产出令人印象深刻。",
      scene:
        "你的待办事项分散在三个应用、几张便签和你的记忆里。但你总能交付。重视整洁流程的人觉得你让人抓狂。",
    },
  },
  "Achievement Striving|Cautiousness": {
    en: {
      insight:
        "You push hard toward goals but act fast rather than carefully — you'd rather course-correct at speed than plan perfectly at rest.",
      scene:
        "You submit the draft before it's polished, ship the feature before edge cases are covered, start the project before the plan is done. 'Good enough now' beats 'perfect later' in your operating system.",
    },
    zh: {
      insight:
        "你努力追求目标但行动快而非谨慎——你宁愿高速修正方向也不愿在原地完美规划。",
      scene:
        "你在草稿打磨前就提交，在边界情况覆盖前就发布，在计划完成前就开始项目。'现在足够好'在你的操作系统中击败'以后完美'。",
    },
  },
  "Emotionality|Liberalism": {
    en: {
      insight:
        "You feel deeply but think conventionally — your emotional life is rich and vivid while your worldview is grounded in tradition and proven frameworks.",
      scene:
        "You cry at movies but vote pragmatically. You're moved by art but skeptical of movements. Your heart is open; your mind wants evidence.",
    },
    zh: {
      insight:
        "你感受深刻但思维传统——你的情感生活丰富而生动，而你的世界观扎根于传统和经过验证的框架。",
      scene:
        "你看电影会哭但投票很务实。你被艺术打动但对运动持怀疑态度。你的心是开放的；你的脑要证据。",
    },
  },
  "Imagination|Liberalism": {
    en: {
      insight:
        "You have a wildly creative inner world but prefer established external structures — you innovate within boundaries rather than breaking them.",
      scene:
        "Your ideas are original but your methods are traditional. You imagine radical possibilities and then execute them through proven channels.",
    },
    zh: {
      insight:
        "你有狂野的创造性内心世界但偏好已建立的外部结构——你在边界内创新而非打破它们。",
      scene:
        "你的想法是原创的但方法是传统的。你想象激进的可能性，然后通过经过验证的渠道执行它们。",
    },
  },
  "Self Efficacy|Orderliness": {
    en: {
      insight:
        "You're confident in your abilities but chaotic in your systems — you trust yourself to figure it out even when your process is a mess.",
      scene:
        "You walk into a presentation with no slides and nail it. Your file naming convention is... creative. You deliver despite, not because of, your organization.",
    },
    zh: {
      insight:
        "你对自己的能力有信心但系统混乱——你相信即使流程一团糟你也能搞定。",
      scene:
        "你没有幻灯片走进演示然后搞定它。你的文件命名规范是...有创意的。你交付成果是尽管如此，而非因为你的组织能力。",
    },
  },
  "Trust|Cooperation": {
    en: {
      insight:
        "You believe in people's good intentions but resist going along just to keep peace — you trust others while holding your ground.",
      scene:
        "You'll give someone the benefit of the doubt, but if their proposal is wrong, you'll say so — warmly, firmly, without apology.",
    },
    zh: {
      insight:
        "你相信人们的善意但抵制为了维持和平而随大流——你信任他人同时坚守立场。",
      scene:
        "你会给某人怀疑的权利，但如果他们的提议是错的，你会说出来——温暖地、坚定地、不道歉。",
    },
  },
};

function intraDomainToSeedpoint(t: IntraDomainTension): NarrativeSeedpoint {
  const highFacet = t.high.facet.replace(/^[A-Z]\d_/, "").replace(/_/g, " ");
  const lowFacet = t.low.facet.replace(/^[A-Z]\d_/, "").replace(/_/g, " ");

  // Look up specific scene; fall back to generated pattern
  const key = `${highFacet}|${lowFacet}`;
  const reverseKey = `${lowFacet}|${highFacet}`;
  const specific =
    FACET_TENSION_SCENES[key] ?? FACET_TENSION_SCENES[reverseKey];

  if (specific) {
    return {
      category: "intra-domain-tension",
      salience: Math.min(90, t.tensionStrength * 30),
      insight: { en: specific.en.insight, zh: specific.zh.insight },
      scene: { en: specific.en.scene, zh: specific.zh.scene },
      tension: {
        en: `This within-${t.domain} split is invisible to anyone looking at your overall score. It's where your most distinctive behavioral patterns live.`,
        zh: `这个${t.domain}内部的分裂对只看你总分的人是隐形的。它正是你最独特的行为模式所在。`,
      },
    };
  }

  // Fallback: still specific about WHICH facets, with a concrete behavioral frame
  return {
    category: "intra-domain-tension",
    salience: Math.min(90, t.tensionStrength * 30),
    insight: {
      en: `Within ${t.domain}, your ${highFacet.toLowerCase()} and ${lowFacet.toLowerCase()} pull in opposite directions — creating a nuanced behavioral signature that simple ${t.domain} scores completely miss.`,
      zh: `在${t.domain}内部，你的${highFacet}和${lowFacet}向相反方向拉扯——创造出一个精细的行为签名，简单的${t.domain}分数完全错过。`,
    },
    scene: {
      en: `People who know you in ${highFacet.toLowerCase()} contexts see one person; people who know you in ${lowFacet.toLowerCase()} contexts see another. Both are real. Neither is the whole picture.`,
      zh: `在${highFacet}情境中认识你的人看到一个人；在${lowFacet}情境中认识你的人看到另一个。两者都是真实的。但都不是全貌。`,
    },
    tension: {
      en: `This within-${t.domain} contradiction is where your most interesting qualities emerge — the interplay creates something neither facet alone would predict.`,
      zh: `这个${t.domain}内部的矛盾正是你最有趣的品质涌现之处——两者的交互作用创造了单独任何一个都无法预测的东西。`,
    },
  };
}

// ── Dominant Theme Detection ─────────────────────────────────

function detectDominantTheme(
  seedpoints: NarrativeSeedpoint[],
  domains: Record<BigFiveDimension, number>,
): { en: string; zh: string } {
  const categories = seedpoints.map((s) => s.category);
  const hasValueClash = categories.includes("value-personality-clash");
  const hasCrossTension = categories.includes("cross-domain-tension");
  const hasIntraTension = categories.includes("intra-domain-tension");

  // If dominant pattern is internal contradictions
  if (hasCrossTension && hasIntraTension) {
    return {
      en: "Your dominant story is one of creative complexity — you hold genuine contradictions that most people resolve by choosing a side, but you live in the tension. This makes you harder to label and more interesting to know.",
      zh: "你的主导故事是创造性的复杂——你持有大多数人通过选边来解决的真实矛盾，但你活在张力中。这让你更难被标签化，也更有趣。",
    };
  }

  // If dominant pattern is value-personality divergence
  if (hasValueClash) {
    return {
      en: "Your dominant story is the gap between who you want to be and how you're wired — not a flaw, but a growth edge that makes your development path uniquely yours.",
      zh: "你的主导故事是你想成为的人和你天生倾向之间的差距——不是缺陷，而是一个让你的成长路径独一无二的发展边缘。",
    };
  }

  // Default: personality as integrated strengths
  const highDomains = Object.entries(domains)
    .filter(([, v]) => v > 65)
    .map(([k]) => k);

  if (highDomains.length >= 3) {
    return {
      en: "Your dominant story is one of breadth — multiple strong dimensions working together create a versatile profile that adapts across contexts. The challenge: choosing where to focus this adaptability.",
      zh: "你的主导故事是广度——多个强维度协同工作创造了一个在不同情境中都能适应的多面手画像。挑战在于：选择在哪里聚焦这种适应性。",
    };
  }

  return {
    en: "Your dominant story is one of focused depth — clear preferences and a distinctive pattern that makes your contribution specific and hard to replicate.",
    zh: "你的主导故事是聚焦的深度——清晰的偏好和独特的模式让你的贡献具体且难以复制。",
  };
}

// ── Main Entry Point ─────────────────────────────────────────

/**
 * Compute 5-8 narrative seedpoints from assessment data.
 * Pure algorithm — no LLM calls. < 5ms execution time.
 *
 * Each seedpoint is a precise psychological insight + behavioral scene +
 * tension/reframe that gives the LLM "ammunition" for writing narratives.
 */
export function computeNarrativeSeedpoints(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
): NarrativeSeedpointsResult {
  const domains = algo.bigFiveDomains;
  if (!domains) {
    return {
      seedpoints: [],
      dominantTheme: {
        en: "Insufficient data for narrative seedpoints.",
        zh: "数据不足，无法生成叙事种子。",
      },
    };
  }

  const seedpoints: NarrativeSeedpoint[] = [];

  // 1. Cross-domain patterns (amplification + tension)
  for (const pattern of CROSS_DOMAIN_PATTERNS) {
    if (pattern.test(domains)) {
      seedpoints.push({
        category: pattern.category,
        salience: pattern.salience(domains),
        insight: pattern.insight,
        scene: pattern.scene,
        tension: pattern.tension,
      });
    }
  }

  // 2. Value × Personality clashes
  const top3 = profile.schwartzAnchors?.top3 ?? [];
  const ranking = profile.schwartzAnchors?.ranking
    ? [...(profile.schwartzAnchors.ranking as string[])]
    : [];
  for (const pattern of VALUE_PERSONALITY_PATTERNS) {
    if (pattern.test(domains, top3, ranking)) {
      seedpoints.push({
        category: "value-personality-clash",
        salience: pattern.salience(),
        insight: pattern.insight,
        scene: pattern.scene,
        tension: pattern.tension,
      });
    }
  }

  // 3. Archetype × Shadow
  const archetypeShadow = computeArchetypeShadowSeed(profile, algo);
  if (archetypeShadow) seedpoints.push(archetypeShadow);

  // 4. SJT should-would gaps
  const sjtSeed = computeSJTSeed(algo);
  if (sjtSeed) seedpoints.push(sjtSeed);

  // 5. Intra-domain facet tensions
  const intraTensions = detectIntraDomainTensions(
    algo.bigFiveFacetPairs ?? [],
    2,
  );
  for (const t of intraTensions) {
    seedpoints.push(intraDomainToSeedpoint(t));
  }

  // Sort by salience, take top 8
  seedpoints.sort((a, b) => b.salience - a.salience);
  const topSeedpoints = seedpoints.slice(0, 8);

  // Detect dominant narrative theme
  const dominantTheme = detectDominantTheme(topSeedpoints, domains);

  return { seedpoints: topSeedpoints, dominantTheme };
}
