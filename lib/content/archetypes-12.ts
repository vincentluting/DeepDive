// lib/content/archetypes-12.ts
// Deep Dive — 12-Type Archetype Content Library
// RIASEC Top-1 × ValueOrientation (enhancement / transcendence)
// 核心知识产权 · 禁止 LLM 批量替换
// 每型叙事必须经过人工审阅才能修改

import type { ArchetypeContent } from "./types";

export const ARCHETYPES: Record<string, ArchetypeContent> = {
  // ═══════════════════════════════════════════════
  // R (Realistic) — 造物
  // ═══════════════════════════════════════════════

  "R-enhancement": {
    code: "R-enhancement",
    primary: "R",
    orientation: "enhancement",
    label_zh: "工程专家",
    label_en: "Architect",
    tagline_zh: "用极致工艺赢得竞争优势",
    tagline_en: "Winning through engineering excellence",
    colorHex: "#E74C3C",
    narrative_zh: `你对自己造的东西有一种近乎偏执的骄傲。别人觉得"能用就行"，你觉得那是侮辱。你打磨细节不是因为有人要求，而是因为你自己过不了那一关——那种"还可以更好"的念头会在凌晨三点把你从床上拽起来。你和另一类同样擅长动手的人不同：他们造东西是为了让别人安心，你造东西是为了证明这件事能做到什么程度。你的作品就是你的名片，你的手艺就是你的武器。当有人把一件本该精致的东西做得粗糙，你会生理性不适。这不是完美主义，这是你理解世界的方式：如果一件事值得做，它就值得做到极致。你最怕的不是失败，是平庸。`,
    narrative_en: `You take a fierce, almost stubborn pride in what you build. Where others see "good enough," you see an insult. You refine details not because someone asked, but because you physically cannot leave something at 90% when you know 98% is possible. That restless voice — "it could be better" — has woken you up at 3am more times than you'd admit.\n\nYou share a love of making things with another hands-on type, but the resemblance stops there. They build so others can depend on something solid. You build to find out how far craft can go — and to make sure everyone knows it was YOUR craft that got there. Your work is your signature, your skill is your edge.\n\nWhen someone ships sloppy work on something that deserves precision, it bothers you in a way that feels almost physical. This isn't perfectionism as a personality quirk. It's how you make sense of the world: if something is worth doing, it's worth doing at the highest level you can reach. Your deepest fear isn't failure — plenty of excellent things fail. Your deepest fear is being ordinary.`,
    coreStrengths: [
      {
        zh: "从想法到可用原型的速度极快",
        en: "Exceptional speed from idea to working prototype",
      },
      {
        zh: "在动手过程中发现理论无法预见的问题",
        en: "Discovering problems through hands-on work that theory cannot predict",
      },
      {
        zh: "对材料、工具和工艺有本能级的理解",
        en: "Instinct-level understanding of materials, tools, and craft",
      },
    ],
    growthEdges: [
      {
        zh: "可能过于追求技术完美而忽略用户真正需要什么",
        en: "May over-optimize for technical perfection at the expense of user needs",
      },
      {
        zh: "竞争心态可能让你难以与同行分享经验",
        en: "Competitive drive may make it hard to share expertise with peers",
      },
    ],
    collaborationStyle_zh:
      "最佳状态是在一个重视技术卓越的团队里做技术核心。你需要被挑战，也需要你的标准被尊重。",
    collaborationStyle_en:
      "At your best as the technical core in a team that values engineering excellence. You need to be challenged, and your standards need to be respected.",
  },

  "R-transcendence": {
    code: "R-transcendence",
    primary: "R",
    orientation: "transcendence",
    label_zh: "主心骨",
    label_en: "Backbone",
    tagline_zh: "离了我就塌的那个人",
    tagline_en: "The one everything stands on",
    colorHex: "#E74C3C",
    narrative_zh: `你造的东西从来不是为了让别人说"哇"，而是为了让别人在上面安心站着。有一类同样擅长动手的人，他们追求的是把手艺做到极致，你追求的是把依靠你的人都稳稳接住。你的骄傲不挂在嘴上——它藏在那些从不出故障的系统里，藏在那些别人永远不会注意到的加固和冗余里。你是那种在暴风雨来临之前就已经把窗户钉好的人，而当风平浪静时，没有人记得你做过什么。说实话，你对此的感受很复杂：你不需要掌声，但你需要被信任。你最受不了的不是辛苦，是有人把你的沉默当成理所当然。那些在你离开之后才发现一切开始松动的人，才真正明白你的分量。`,
    narrative_en: `You never built anything to make people say "wow." You build so that people can stand on what you made without ever thinking about whether it will hold. It holds. It always holds, because you made sure of that before anyone even showed up.\n\nThere's another hands-on type who builds to push craft to its absolute limit — to be the best. You're different. You build to make sure nothing collapses on the people counting on you. Your pride doesn't live in applause. It lives in the backup system nobody notices, the reinforced joint nobody sees, the contingency plan that never needs to activate because everything just... works.\n\nYou're the person who boards up the windows before the storm, and when the sun comes out, nobody remembers. Your feelings about that are complicated. You genuinely don't need a spotlight. But you do need to be trusted, and you do need people to understand that your silence is not the same as not caring. What stings isn't the hard work — it's when someone treats your reliability like furniture: always there, never thanked. The people who truly understand your weight are usually the ones who only discovered it after you left.`,
    coreStrengths: [
      {
        zh: "在压力下保持稳定输出，是团队的定心丸",
        en: "Maintains steady output under pressure — the team's stabilizer",
      },
      {
        zh: "对系统可靠性和安全性有近乎执念的关注",
        en: "Near-obsessive focus on system reliability and safety",
      },
      {
        zh: "默默补位，确保没有短板",
        en: "Quietly fills gaps to ensure no weak links",
      },
    ],
    growthEdges: [
      {
        zh: "可能因为太专注于「稳」而错过创新机会",
        en: "May miss innovation opportunities due to focus on stability",
      },
      {
        zh: "默默付出容易被忽视，需要学会让贡献被看见",
        en: "Silent contributions risk being overlooked — learn to make your impact visible",
      },
    ],
    collaborationStyle_zh:
      "你是团队里最可靠的那个人。不需要聚光灯，但需要被信任和被感谢。与需要稳定技术底座的领导者搭配最好。",
    collaborationStyle_en:
      "You're the most reliable person on the team. You don't need the spotlight, but you need to be trusted and appreciated. Best paired with leaders who need a solid technical foundation.",
  },

  // ═══════════════════════════════════════════════
  // I (Investigative) — 探知
  // ═══════════════════════════════════════════════

  "I-enhancement": {
    code: "I-enhancement",
    primary: "I",
    orientation: "enhancement",
    label_zh: "战略家",
    label_en: "Tactician",
    tagline_zh: "信息就是弹药，知识就是权力",
    tagline_en: "Turning information into strategic advantage",
    colorHex: "#3498DB",
    narrative_zh: `你读书不是为了读书，你读书是为了赢。每一个知识点在你手里都会变成可以部署的资源——你不囤积信息，你武装信息。别人还在理解问题的时候，你已经在计算哪个变量可以被撬动。有一类同样痴迷于知识的人，他们为了搞清楚一件事可以查到天荒地老、不在乎有没有用。你不一样，你每一次深入研究都有一个清晰的目标：它能帮我做出更好的判断吗？能帮我在关键时刻比对手快半步吗？你最享受的时刻不是发现真相，而是发现真相的同时意识到别人还没发现——那个信息差就是你的优势窗口。你可能偶尔会被人说"太功利"，但你知道自己不是不尊重知识，只是知识对你来说从来不是终点，它是工具，是杠杆，是你掌控局面的方式。`,
    narrative_en: `You don't read to understand the world. You read to outmaneuver it. Every piece of knowledge in your hands becomes a deployable asset — you don't hoard information, you weaponize it. While others are still framing the problem, you're already calculating which variable can be leveraged.\n\nThere's another knowledge-obsessed type who will chase a question to the ends of the earth just to know the answer, regardless of whether it's useful. You're wired differently. Every deep dive you take has a clear destination: does this help me make a sharper call? Does it give me a half-step advantage when it matters? Your favorite moment isn't finding the truth — it's finding the truth and realizing nobody else has found it yet. That information gap is your window.\n\nPeople sometimes call you calculating, and they don't always mean it as a compliment. But you know the difference between disrespecting knowledge and respecting it enough to actually use it. For you, understanding was never the finish line. It's the launchpad. Knowledge is your lever, your telescope, your way of staying three moves ahead while everyone else is still looking at the board.`,
    coreStrengths: [
      {
        zh: "能从海量信息中提炼出关键洞察",
        en: "Extracts critical insights from massive information",
      },
      {
        zh: "善于构建心智模型预测未来走向",
        en: "Builds mental models to predict future outcomes",
      },
      {
        zh: "在不确定性中比别人更快做出正确判断",
        en: "Makes correct judgments faster than others amid uncertainty",
      },
    ],
    growthEdges: [
      {
        zh: "可能过于重视「赢」而忽略探索过程本身的价值",
        en: "May overvalue winning at the expense of the inquiry process itself",
      },
      {
        zh: "信息优势可能让你看不起不够「聪明」的人",
        en: "Information advantage may breed intellectual arrogance",
      },
    ],
    collaborationStyle_zh:
      "最佳状态是做决策者背后的大脑。你不需要站在台前，但你需要你的分析被认真对待。",
    collaborationStyle_en:
      "At your best as the brain behind decision-makers. You don't need the stage, but you need your analysis to be taken seriously.",
  },

  "I-transcendence": {
    code: "I-transcendence",
    primary: "I",
    orientation: "transcendence",
    label_zh: "科学家",
    label_en: "Researcher",
    tagline_zh: "不到真相不罢休",
    tagline_en: "Relentless in the pursuit of truth",
    colorHex: "#3498DB",
    narrative_zh: `你追的不是答案能带来什么好处，你追的是答案本身。"不知道"对你来说不是一种缺憾，是一种折磨——一个没解开的谜题会在你脑子里不停转，在地铁上转，在洗澡时转，在你本该睡觉的时候还在转。有一类同样热爱知识的人，他们钻研是为了赢得优势，信息在他们手里是弹药。你不是这样的。你钻研是因为不钻研你会难受。你能在别人早就放弃的地方再多坚持三个月，不是因为你意志力强，是因为你的好奇心根本不受你控制。你对方法的严谨近乎苛刻——不是为了显得专业，而是因为你真的相信，如果过程不诚实，结论就没有意义。你偶尔会被人说"太较真"，但你知道你只是对这个世界有一种很简单的要求：它应该被准确地理解。`,
    narrative_en: `You're not chasing what an answer can do for you. You're chasing the answer itself. "Not knowing" isn't a gap in your knowledge — it's a splinter in your mind. An unsolved question loops in your head on the subway, in the shower, at 2am when you should absolutely be sleeping.\n\nThere's another knowledge-driven type who researches to gain an edge, who treats information like ammunition. That's not you. You dig because not digging makes you physically uncomfortable. You can outlast everyone else on a problem by months — not because you're more disciplined, but because your curiosity genuinely doesn't have an off switch.\n\nYour standards for how things should be investigated border on severe. You're not trying to look rigorous. You actually believe that if the process isn't honest, the conclusion is meaningless. Cutting corners to get to an answer faster feels to you like cheating at solitaire — who are you even fooling?\n\nPeople sometimes tell you you're too intense about things that "don't matter." But you know they do matter. You have a very simple demand of the world: it should be understood accurately. And you'll keep going until it is, whether or not anyone is watching, whether or not anyone cares.`,
    coreStrengths: [
      {
        zh: "能在别人放弃的地方坚持到答案浮现",
        en: "Persists where others give up until the answer emerges",
      },
      {
        zh: "对方法论的严谨程度超越常人",
        en: "Methodological rigor far exceeding the norm",
      },
      {
        zh: "天生的好奇心让你看到别人看不到的角度",
        en: "Natural curiosity reveals angles invisible to others",
      },
    ],
    growthEdges: [
      {
        zh: "可能因为追求完美答案而迟迟不行动",
        en: "May delay action in pursuit of the perfect answer",
      },
      {
        zh: "对「不够严谨」的人缺乏耐心",
        en: "Impatient with those perceived as lacking rigor",
      },
    ],
    collaborationStyle_zh:
      "你需要思考的空间和时间。最好的搭档是尊重你节奏、能把你的研究转化为行动的人。",
    collaborationStyle_en:
      "You need space and time to think. Your best partners respect your pace and translate your research into action.",
  },

  // ═══════════════════════════════════════════════
  // A (Artistic) — 创意
  // ═══════════════════════════════════════════════

  "A-enhancement": {
    code: "A-enhancement",
    primary: "A",
    orientation: "enhancement",
    label_zh: "C位",
    label_en: "Icon",
    tagline_zh: "我的作品就是要被看见",
    tagline_en: "Creating to be seen and remembered",
    colorHex: "#9B59B6",
    narrative_zh: `你天生就知道怎么吸引目光，而且你也从不假装自己不需要目光。有些人觉得渴望被看见是一种软弱，你觉得那是一种诚实。你的创造力自带表演属性——你不是先做好东西再想怎么展示，你在创作的时候就已经在想象观众的反应了。舞台对你来说不是锦上添花，是氧气。有一类同样富有创造力的人，他们创作是为了触动某一个人的内心深处，观众多不多他们不在乎。你不一样。你在乎影响力的半径，你在乎你的作品能走多远、声量有多大。这不是虚荣——你是真的相信，好的东西就应该被最多的人看见。你在竞争中会变得更好，在聚光灯下会更自如。你最害怕的不是被批评，是被忽略。`,
    narrative_en: `You've always known how to draw a room's attention, and you've never pretended you don't need it. Some people think wanting to be seen is a weakness. You think it's honesty.\n\nYour creativity has a built-in performance instinct. You don't make something and then figure out how to present it — you're imagining the audience's reaction while you're still creating. The stage isn't a nice-to-have for you. It's oxygen.\n\nThere's another creative type who makes things to reach deep inside one specific person's heart. They don't care about the size of the crowd. You're different. You care about how far your work travels, how loud the signal gets. Not because you're shallow — because you genuinely believe that if something is good, it deserves the biggest possible audience.\n\nYou get sharper under competition. You get looser and more confident under a spotlight. A packed room doesn't drain you; it charges you. Where quieter creators might wilt under public scrutiny, you find your stride. You can take harsh criticism — what you cannot take is indifference. Being torn apart is survivable. Being ignored is not. That's the deal you made with yourself a long time ago, and you've never regretted it.`,
    coreStrengths: [
      {
        zh: "天生的表现力和舞台感",
        en: "Natural expressiveness and stage presence",
      },
      {
        zh: "能把个人风格转化为有影响力的品牌",
        en: "Transforms personal style into an influential brand",
      },
      { zh: "在竞争环境中越战越勇", en: "Thrives under competitive pressure" },
    ],
    growthEdges: [
      {
        zh: "对关注度的需求可能让你忽略作品本身的深度",
        en: "Need for attention may come at the expense of depth",
      },
      {
        zh: "当没有观众时可能失去创作动力",
        en: "May lose motivation without an audience",
      },
    ],
    collaborationStyle_zh:
      "你需要舞台和聚光灯。最好的团队给你展示空间，同时有人帮你打磨作品的深度。",
    collaborationStyle_en:
      "You need a stage and spotlight. The best teams give you room to shine while someone else helps deepen your work.",
  },

  "A-transcendence": {
    code: "A-transcendence",
    primary: "A",
    orientation: "transcendence",
    label_zh: "追梦人",
    label_en: "Dreamweaver",
    tagline_zh: "我的作品要让你不想醒来",
    tagline_en: "Creating dreams that touch the soul",
    colorHex: "#9B59B6",
    narrative_zh: `你创作不是为了站在台上，是为了你的作品能钻进一个人的心里，让他在某个深夜突然觉得被理解了。你在乎的不是有多少人鼓掌，是有没有那么一个人因为你的东西红了眼眶。有一类同样有创造力的人，他们创作时脑子里装着观众和舞台，你创作时脑子里装着一种你自己都不一定说得清楚的情绪。你的内心世界极其丰富，丰富到有时候你不确定该拿它怎么办——所以你画、你写、你弹、你做，把那些说不出口的东西变成别人可以触碰的形状。你对自己的作品有一种近乎保护性的温柔，当有人误读它的时候你会受伤，但你又明白误读也是一种连接。你最幸福的时刻不是作品大卖，是某个陌生人告诉你"你写的那个东西，好像就是在说我。"`,
    narrative_en: `You don't create to stand on a stage. You create so that something you made can find its way into a single person's chest and make them feel, for one quiet moment, that somebody out there understands.\n\nYou don't care how many people clap. You care whether someone's eyes sting.\n\nThere's another creative type who thinks about the audience and the spotlight while they're still creating. Your mind works differently. When you're making something, you're chasing a feeling you can't quite name — some knot of emotion that won't leave you alone until you've turned it into something others can touch. A song. A paragraph. A sketch on a napkin at 4am.\n\nYour inner world is almost unreasonably rich. Sometimes you don't know what to do with everything that lives in there, so you build doors into it — your work — and hope the right people walk through. You feel a fierce tenderness toward the things you make. When someone misreads your work, it hurts, though you also know that even a misreading is a form of contact.\n\nYour happiest moment is never a sales number or a crowd size. It's when a stranger says, quietly, "That thing you made — it felt like it was about me."`,
    coreStrengths: [
      {
        zh: "能把抽象的情感转化为可触摸的作品",
        en: "Translates abstract emotions into tangible creations",
      },
      {
        zh: "用创作与他人建立深层情感连接",
        en: "Builds deep emotional connections through creative work",
      },
      {
        zh: "在内心世界极其丰富，灵感取之不尽",
        en: "An extraordinarily rich inner world provides endless inspiration",
      },
    ],
    growthEdges: [
      {
        zh: "过于理想主义可能让你与商业现实脱节",
        en: "Idealism may disconnect you from commercial reality",
      },
      {
        zh: "内心太敏感，可能在批评面前过于脆弱",
        en: "Heightened sensitivity may make you fragile in the face of criticism",
      },
    ],
    collaborationStyle_zh:
      "你需要安全的创作空间和被理解的感觉。与尊重艺术价值、能处理商业事务的搭档最互补。",
    collaborationStyle_en:
      "You need a safe creative space and to feel understood. Most complementary with partners who respect artistic value and handle business matters.",
  },

  // ═══════════════════════════════════════════════
  // S (Social) — 联结
  // ═══════════════════════════════════════════════

  "S-enhancement": {
    code: "S-enhancement",
    primary: "S",
    orientation: "enhancement",
    label_zh: "伯乐",
    label_en: "Mentor",
    tagline_zh: "我一眼看出你是千里马",
    tagline_en: "Spotting hidden potential in everyone",
    colorHex: "#F39C12",
    narrative_zh: `你看人有一种别人没有的眼光。在别人只看到一个笨拙的新手的时候，你已经看到了他三年后的样子。你最骄傲的时刻不是自己拿了什么奖，是你推出去的那个人站在了台上——而你在台下比他还激动。你帮人不是出于善良，至少不只是善良。你是真的享受那种"我看对了"的快感，享受看着一个人因为你的推力而加速成长。有一类同样热爱帮助他人的人，他们帮人靠的是陪伴和倾听，让人在他们身边感到安全。你帮人靠的是发现和推动——你看到他们自己没看到的才华，然后把他们推到他们害怕但应该站的位置上。你的影响力不是直接的，它通过你培养的每一个人扩散出去。你偶尔会受伤，当你倾注心血的人头也不回地走了，但即使如此，你下次还是会忍不住伸手。`,
    narrative_en: `You see people in a way others don't. Where everyone else sees a clumsy beginner, you already see what they'll look like in three years. Your proudest moments aren't your own wins — they're when someone you believed in steps onto a stage, and you're in the back row more excited than they are.\n\nYou don't help people purely out of kindness, though kindness is part of it. You genuinely enjoy the rush of "I called it" — watching someone accelerate because you gave them the right push at the right time.\n\nThere's another people-oriented type who helps through presence and listening, creating safety just by being in the room. Your gift is different. You help by seeing and pushing — spotting talent people don't yet see in themselves, then nudging them toward the position they're afraid of but belong in. Sometimes that push is gentle. Sometimes it isn't. But you've learned that the people who grow the most are usually the ones you were hardest on.\n\nYour influence is never direct. It radiates outward through every person you've developed. That also means you sometimes get hurt — when someone you invested everything in walks away without looking back. But even then, the next time you spot that spark in someone new, you won't be able to stop yourself from reaching out.`,
    coreStrengths: [
      {
        zh: "一眼识别他人的天赋和潜力",
        en: "Identifies talent and potential at a glance",
      },
      {
        zh: "善于用恰到好处的推力帮人突破瓶颈",
        en: "Applies just the right push to help others break through",
      },
      {
        zh: "通过培养他人建立广泛的人脉网络",
        en: "Builds extensive networks by developing others",
      },
    ],
    growthEdges: [
      {
        zh: "可能过度投资于他人而忽略自己的成长",
        en: "May over-invest in others while neglecting own growth",
      },
      {
        zh: "当你推出去的人不感恩时可能感到受伤",
        en: "May feel hurt when those you championed show no gratitude",
      },
    ],
    collaborationStyle_zh:
      "你是天生的人才教练。最好的角色是带团队、做导师、或者任何需要「发现和培养人」的位置。",
    collaborationStyle_en:
      "You're a natural talent coach. Best in roles that involve leading teams, mentoring, or anything requiring talent discovery and development.",
  },

  "S-transcendence": {
    code: "S-transcendence",
    primary: "S",
    orientation: "transcendence",
    label_zh: "疗愈师",
    label_en: "Healer",
    tagline_zh: "靠近我就会好起来",
    tagline_en: "Healing through deep empathy and presence",
    colorHex: "#F39C12",
    narrative_zh: `你身上有一种很难形容的东西——人们坐在你旁边，肩膀会自己松下来。你不需要说什么高明的话，甚至不需要给建议，只是你在那里，对方就觉得可以把藏了很久的东西说出来。你听人说话的方式是真的在听，不是在等着插嘴，不是在脑子里组织回应，就是在听。这件事听起来简单，但很少有人做到。有一类同样热爱帮助他人的人，他们帮人靠的是发现别人的潜力然后推他们一把。你不推。你接住。你是那个在别人崩溃的时候不会慌的人，你不试图修复什么，你只是让对方知道，在这一刻，他不需要假装没事。你有时候会吸收太多别人的痛苦，然后发现自己变得很疲惫，但即使这样你也很难拒绝。因为你知道那种被真正听见的感觉有多珍贵——你给得出这个礼物，你就没办法不给。`,
    narrative_en: `There's something about you that's hard to put into words. People sit down next to you, and their shoulders drop. You don't need to say anything clever. You don't even need to give advice. You just... be there, and somehow the person across from you starts saying things they haven't said to anyone.\n\nThe way you listen is different. You're not waiting for your turn to talk. You're not assembling a response in your head. You're just listening. That sounds simple. Almost nobody actually does it.\n\nThere's another people-loving type who helps by spotting hidden talent and pushing others toward their potential. You don't push. You catch. You're the person who doesn't panic when someone falls apart in front of you. You don't try to fix anything. You just let them know that right now, in this moment, they don't have to pretend they're fine.\n\nThis gift has a cost. You absorb other people's pain like a sponge, and sometimes you realize you're exhausted in a way that sleep doesn't fix. You find it nearly impossible to say no when someone needs you. Because you know exactly how rare it is to be truly heard — and since you can give that gift, it feels wrong not to. The world is louder than you are. But the people who've sat across from you in their worst moments know something the world doesn't: quiet is not the same as small.`,
    coreStrengths: [
      {
        zh: "深度共情能力，能感受到别人未说出口的情绪",
        en: "Deep empathy — sensing emotions others haven't expressed",
      },
      {
        zh: "让人感到安全和被理解的天赋",
        en: "A gift for making others feel safe and understood",
      },
      {
        zh: "在危机时刻成为团队的情绪稳定器",
        en: "Becomes the emotional stabilizer during crises",
      },
    ],
    growthEdges: [
      {
        zh: "可能因为过度共情而情绪耗竭",
        en: "May experience emotional exhaustion from over-empathizing",
      },
      {
        zh: "需要学会在帮助他人和保护自己之间设界限",
        en: "Needs to learn boundaries between helping others and protecting self",
      },
    ],
    collaborationStyle_zh:
      "你是团队的情绪安全网。在需要高度信任和心理安全感的环境中发挥最大价值。",
    collaborationStyle_en:
      "You're the team's emotional safety net. You deliver maximum value in environments requiring high trust and psychological safety.",
  },

  // ═══════════════════════════════════════════════
  // E (Enterprising) — 驱动
  // ═══════════════════════════════════════════════

  "E-enhancement": {
    code: "E-enhancement",
    primary: "E",
    orientation: "enhancement",
    label_zh: "王牌",
    label_en: "Ace",
    tagline_zh: "看到机会就下注，从零到一",
    tagline_en: "Seizing opportunity, building from zero to one",
    colorHex: "#E67E22",
    narrative_zh: `你脑子里永远有一个倒计时在跑。别人还在开会讨论要不要做，你已经做了第一版出来了。你看到机会的速度跟别人不是一个量级的——不是因为你比别人聪明，而是因为你愿意在信息只有六成的时候就下注。这对你来说不是鲁莽，是效率。等到信息齐全了，窗口早就关了。有一类同样有野心的人，他们看到的不是一个可以赢的机会，而是一个需要被重新设计的系统。你不改系统，你利用系统。你在现有规则里找到别人没发现的缝隙，然后第一个冲进去。你的能量是爆发性的：在从零到一的阶段，你就是那张王牌。但你也知道自己的短板——一旦事情进入重复运营阶段，你会开始烦躁，开始四处张望下一个机会。你活在加速度里，而不是匀速里。`,
    narrative_en: `There's a countdown running in your head at all times. While other people are still scheduling meetings to discuss whether something should be done, you've already shipped a first version. You spot openings at a speed that's almost unfair — not because you're smarter, but because you're willing to bet when you've only got 60% of the picture. To you, that's not reckless. That's efficiency. By the time everyone has full information, the window has closed.\n\nThere's another ambitious type who looks at an opportunity and sees a system that needs to be redesigned from scratch. You don't redesign systems. You exploit them. You find the gap in existing rules that nobody else noticed, and you're the first one through the door.\n\nYour energy is explosive. In the zero-to-one phase — the messy, uncertain, nothing-exists-yet phase — you are the most valuable person in the room. You thrive on the chaos of building something from nothing, on the adrenaline of a bet that could go either way.\n\nBut you know your own pattern: once something enters the steady, operational phase, you start getting restless. Your eyes wander toward the next opportunity. Repetition doesn't just bore you — it drains you. You live in acceleration, not cruise control. The trick isn't learning to slow down. It's finding a life where you rarely have to.`,
    coreStrengths: [
      {
        zh: "在混乱和不确定中看到别人看不到的机会",
        en: "Spots opportunities invisible to others amid chaos and uncertainty",
      },
      {
        zh: "行动力极强，想到就做，做了就推",
        en: "Extreme bias for action — think, do, push",
      },
      {
        zh: "天生的说服力，能让人相信你的愿景",
        en: "Natural persuasion — makes others believe in your vision",
      },
    ],
    growthEdges: [
      {
        zh: "可能因为追求速度而忽略风险管理",
        en: "May neglect risk management in pursuit of speed",
      },
      {
        zh: "赢的欲望可能让你在人际关系上走捷径",
        en: "Desire to win may lead to shortcuts in relationships",
      },
    ],
    collaborationStyle_zh:
      "你是开路先锋，不是守城将军。最好的搭配是一个能帮你把「从零到一」变成「从一到十」的运营型搭档。",
    collaborationStyle_en:
      "You're a trailblazer, not a garrison commander. Best paired with an operations-minded partner who scales your zero-to-one into one-to-ten.",
  },

  "E-transcendence": {
    code: "E-transcendence",
    primary: "E",
    orientation: "transcendence",
    label_zh: "先驱",
    label_en: "Pioneer",
    tagline_zh: "不只赢，要改游戏规则",
    tagline_en: "Not just winning — rewriting the rules",
    colorHex: "#E67E22",
    narrative_zh: `赢对你来说不够。如果赢只是在一套你认为有问题的规则里拿了高分，那这个"赢"本身就没什么意思。你想改的不是排名，是规则本身。当别人在棋盘上计算下一步的时候，你在想这个棋盘为什么长这样，谁设计的，凭什么。有一类同样充满冲劲的人，他们擅长在现有规则中找到缝隙然后第一个冲进去。你不钻缝隙，你掀桌子——或者更准确地说，你建一张新桌子，然后邀请所有人过来。你用商业、组织或者任何你手边的工具去推动你认为应该发生的改变。你的野心不是"我要赢"，而是"这个世界的运作方式不对，我要修它。"你有时候会显得激进，会让守成的人不舒服。但你已经接受了这一点：如果所有人都觉得你的想法合理，那你大概还不够大胆。`,
    narrative_en: `Winning isn't enough for you. If winning just means scoring high inside a system you think is broken, then the win itself is hollow. You don't want to change the scoreboard. You want to change the rules.\n\nWhile others are calculating their next move on the board, you're asking why the board looks like this in the first place. Who designed it. On whose authority.\n\nThere's another driven type who's brilliant at finding gaps in existing rules and being the first one through. You don't look for gaps. You flip the table — or more precisely, you build a new table and invite everyone to sit down. You use business, organizations, or whatever tool is within reach to push the change you believe should exist. Your ambition isn't "I want to win." It's "the way this works is wrong, and I'm going to fix it."\n\nThis makes you uncomfortable to be around for people who benefit from the status quo. You've accepted that. You've also accepted that your ideas will be called impractical, idealistic, or premature — usually by people who said the same thing about every change that eventually happened.\n\nYour litmus test is simple: if everyone already agrees with your vision, you're probably not thinking big enough. The friction isn't a bug. It's confirmation that you're pushing in the right direction.`,
    coreStrengths: [
      {
        zh: "能看到现有系统的结构性缺陷并设计替代方案",
        en: "Sees structural flaws in existing systems and designs alternatives",
      },
      {
        zh: "把「不可能」当作起点而不是终点",
        en: 'Treats "impossible" as a starting point, not an endpoint',
      },
      {
        zh: "能动员资源和人心朝一个更大的目标前进",
        en: "Mobilizes resources and hearts toward a bigger goal",
      },
    ],
    growthEdges: [
      {
        zh: "宏大愿景可能让你忽略执行层面的细节",
        en: "Grand vision may cause you to overlook execution details",
      },
      {
        zh: "对现有体制的不耐烦可能让你显得激进",
        en: "Impatience with existing institutions may come across as radical",
      },
    ],
    collaborationStyle_zh:
      "你需要一个同样相信「改变是可能的」的团队。最好的搭档是能把你的愿景落地的执行者。",
    collaborationStyle_en:
      "You need a team that also believes change is possible. Best paired with executors who can ground your vision in reality.",
  },

  // ═══════════════════════════════════════════════
  // C (Conventional) — 秩序
  // ═══════════════════════════════════════════════

  "C-enhancement": {
    code: "C-enhancement",
    primary: "C",
    orientation: "enhancement",
    label_zh: "总指挥",
    label_en: "Commander",
    tagline_zh: "混乱到我手里就变秩序",
    tagline_en: "Turning chaos into precision",
    colorHex: "#1ABC9C",
    narrative_zh: `你走进一团乱麻的时候，别人看到的是灾难，你看到的是原材料。你天生就知道怎么把混乱变成秩序，而且你从中获得的不只是满足感——是掌控感。你不是那种享受整理桌面的人，你是那种通过设计流程来掌握主动权的人。在你手里，一套运作良好的系统就是竞争壁垒，别人想复制都复制不了。有一类同样重视秩序的人，他们建立规则是为了让每个人都被公平对待。你建立规则是为了赢——为了让你的团队跑得更快、犯更少的错、在对手反应过来之前就已经到位。你对细节的把控有时候会让人觉得你控制欲强，但你知道那些细节就是护城河里的每一滴水。你最享受的时刻是：一个看起来不可能按时完成的项目，在你的调度下丝毫不差地落地了。那种精密，就是你的艺术。`,
    narrative_en: `When you walk into a mess, other people see a disaster. You see raw material. You instinctively know how to turn disorder into structure, and what you get from that isn't just satisfaction — it's leverage. You're not the type who enjoys tidying a desk. You're the type who designs processes that give your team an unfair advantage.\n\nIn your hands, a well-run system becomes a competitive wall that others can't replicate no matter how hard they try.\n\nThere's another order-loving type who builds rules to make sure everyone is treated fairly. Your rules serve a different purpose. You build them to win — to make your team faster, less error-prone, and already in position before competitors have finished their morning meeting. Fairness is fine, but efficiency is the point.\n\nYour grip on details sometimes makes people think you're a control freak. You've heard it before. What they don't understand is that every detail you manage is another inch of moat. Drop enough details, and the moat drains. You've seen it happen to other people's operations. It won't happen to yours.\n\nYour favorite moment: a project that looked impossible to deliver on time, landing perfectly on schedule because your orchestration held every piece in place. That precision — that interlocking, humming machine — is your art form. Others paint on canvas. You paint on spreadsheets, timelines, and org charts, and the result is just as beautiful to you.`,
    coreStrengths: [
      {
        zh: "能在混乱中快速建立结构和流程",
        en: "Rapidly establishes structure and process amid chaos",
      },
      {
        zh: "对细节的把控力让所有人都能信任你的交付",
        en: "Detail mastery inspires trust in your delivery",
      },
      {
        zh: "善于用系统化的方式放大团队效率",
        en: "Systematically amplifies team efficiency",
      },
    ],
    growthEdges: [
      {
        zh: "对秩序的执念可能让你不适应快速变化的环境",
        en: "Obsession with order may make you uncomfortable in fast-changing environments",
      },
      {
        zh: "可能因为太注重流程而忽略人的感受",
        en: "May prioritize process over people's feelings",
      },
    ],
    collaborationStyle_zh:
      "你是让组织高效运转的发动机。最好的搭配是有远见但缺乏执行力的领导者。",
    collaborationStyle_en:
      "You're the engine that makes organizations run. Best paired with visionary leaders who lack execution capability.",
  },

  "C-transcendence": {
    code: "C-transcendence",
    primary: "C",
    orientation: "transcendence",
    label_zh: "仲裁人",
    label_en: "Arbiter",
    tagline_zh: "规则面前，所有人一样",
    tagline_en: "Ensuring fairness for everyone",
    colorHex: "#1ABC9C",
    narrative_zh: `你对"不公平"三个字有一种几乎是生理性的反应。当你看到有人因为规则被选择性执行而吃了亏，你会比当事人还生气。你建立秩序不是为了掌控局面——那是另一类同样热爱系统的人干的事，他们把流程当武器，用效率碾压对手。你把规则当盾牌，用来保护那些没有话语权的人。你设计制度的时候，脑子里想的不是"怎么赢"，而是"如果我是最弱势的那个人，这套制度还能保护我吗？"你是团队里那个当所有人都在讨论怎么走捷径的时候，会安静地说"但这样对吗"的人。你有时候会被人说死板，但你知道在需要灵活的地方，你可以灵活；在涉及底线的地方，你一寸都不让。因为你见过太多次了：当规则被踩过一次而没有后果，它就会被踩第二次、第三次，直到它不再是规则。你守的不是条文，是条文背后那个"人人平等"的承诺。`,
    narrative_en: `You have an almost physical reaction to the word "unfair." When you see someone get hurt because rules were applied selectively — one standard for some, another for others — you feel a surge of anger that surprises even you. Sometimes you're more upset than the person it happened to.\n\nYou don't build systems for control. There's another order-minded type who does that — they treat processes as weapons and use efficiency to crush the competition. You treat rules as shields. When you're designing a system, the question in your head isn't "how do we win?" It's "if I were the most vulnerable person in this room, would this system still protect me?"\n\nYou're the person who, when everyone is discussing a clever shortcut, quietly says, "But is it right?" People have called you rigid. You've heard it enough times that it doesn't sting anymore. Because you know the difference: where the situation calls for flexibility, you can flex. Where it touches a principle, you don't give an inch. You've seen what happens when you do. A rule gets bent once without consequence, and then it gets bent again, and again, until it isn't a rule anymore — it's a suggestion that only applies to people without power.\n\nWhat you guard isn't the letter of the policy. It's the promise behind it: that everyone gets the same deal. That's not rigidity. That's the thing that holds everything else together.`,
    coreStrengths: [
      {
        zh: "天生的公平感，能发现系统中的不公正",
        en: "Innate sense of fairness — spots injustice in systems",
      },
      {
        zh: "设计的制度既严密又人性化",
        en: "Designs systems that are both rigorous and humane",
      },
      {
        zh: "在利益冲突中保持客观和中立",
        en: "Maintains objectivity and neutrality amid conflicting interests",
      },
    ],
    growthEdges: [
      {
        zh: "对公平的执念可能让你在需要灵活时显得僵化",
        en: "Obsession with fairness may come across as rigid when flexibility is needed",
      },
      {
        zh: "当看到不公正时可能过度反应",
        en: "May overreact when witnessing injustice",
      },
    ],
    collaborationStyle_zh:
      "你是团队的良心和底线。在需要透明治理和制度建设的组织中价值最大。",
    collaborationStyle_en:
      "You're the team's conscience and bottom line. Most valuable in organizations needing transparent governance and institutional design.",
  },
};

/**
 * Look up archetype content by code.
 * @param code  e.g. "R-enhancement", "I-transcendence"
 */
export function getArchetypeContent(
  code: string,
): ArchetypeContent | undefined {
  return ARCHETYPES[code];
}
