// lib/content/archetype-growth.ts
// Deep Dive — 12-Type Archetype Growth Paths
//
// Each archetype has a natural maturation arc:
// Default Mode → Integration Challenge → Mature Expression
//
// Growth happens by integrating qualities from the "growth edge" types
// (see archetype-relations.ts) without losing core identity.

export interface GrowthPath {
  code: string;
  /** What this archetype looks like before growth */
  defaultMode: { zh: string; en: string };
  /** The key integration challenge */
  integrationChallenge: { zh: string; en: string };
  /** What a mature version of this archetype looks like */
  matureExpression: { zh: string; en: string };
  /** One sentence the coach might say to nudge growth */
  coachingNudge: { zh: string; en: string };
}

export const ARCHETYPE_GROWTH: Record<string, GrowthPath> = {
  "R-enhancement": {
    code: "R-enhancement",
    defaultMode: {
      zh: "你用极致工艺证明自己的价值，作品就是名片。你对平庸有生理性的排斥，对细节的把控近乎偏执。但这种偏执有时候让你忘了一个问题：你做到了 98%，但那最后 2% 是给谁看的？",
      en: "You prove your worth through flawless craft. Your work is your signature. You have a visceral rejection of mediocrity and near-obsessive control over details. But sometimes that obsession makes you forget to ask: you reached 98% — but who is that last 2% for?",
    },
    integrationChallenge: {
      zh: "学会区分「极致」和「足够好」。不是降低标准，而是理解：有时候一个 80% 但按时交付的作品，比一个 98% 但晚了三个月的作品更有价值——因为它真的帮到了人。",
      en: "Learning to distinguish 'excellent' from 'good enough.' Not lowering your standards, but understanding that an 80% product delivered on time can matter more than a 98% product three months late — because it actually helped someone.",
    },
    matureExpression: {
      zh: "成熟的工程专家依然追求极致，但他知道极致的定义不只是技术完美——还包括时机、影响和对使用者的尊重。他的作品不只是精确的，还是有温度的。",
      en: "A mature Architect still pursues excellence, but understands that excellence isn't just technical perfection — it includes timing, impact, and respect for the user. Their work isn't just precise; it's humane.",
    },
    coachingNudge: {
      zh: "如果你的作品永远不被使用，那份精确还有意义吗？",
      en: "If your work is never used, does that precision still matter?",
    },
  },

  "R-transcendence": {
    code: "R-transcendence",
    defaultMode: {
      zh: "你默默地把所有东西维护好，确保没有人因为系统故障而受苦。你不需要掌声，但你需要被信任。问题是：你的沉默有时候不是谦逊，是恐惧——害怕站出来说「这是我做的」。",
      en: "You quietly keep everything running, ensuring nobody suffers from system failure. You don't need applause, but you need trust. The problem: your silence sometimes isn't humility — it's fear of standing up to say 'I built this.'",
    },
    integrationChallenge: {
      zh: "学会让自己的贡献被看见——不是为了虚荣，而是因为如果没有人知道你做了什么，就没有人能在你需要帮助的时候知道该帮什么。可见性不是表演，是沟通。",
      en: "Learning to make your contributions visible — not for vanity, but because if nobody knows what you do, nobody knows how to help when you need it. Visibility isn't performance; it's communication.",
    },
    matureExpression: {
      zh: "成熟的主心骨依然是团队最可靠的人，但他不再把被忽视当作理所当然。他学会了在恰当的时刻说出自己的价值，不卑不亢，既守护系统，也守护自己。",
      en: "A mature Backbone is still the most reliable person on the team, but no longer treats being overlooked as inevitable. They've learned to articulate their value at the right moment — neither boastful nor invisible, protecting the system and themselves.",
    },
    coachingNudge: {
      zh: "你守护了所有人，谁来守护你？",
      en: "You've guarded everyone else. Who guards you?",
    },
  },

  "I-enhancement": {
    code: "I-enhancement",
    defaultMode: {
      zh: "你把知识当武器，信息差就是优势窗口。你在乎的是比别人快半步，比别人看得准。但有时候你赢了判断，却输了关系——因为没有人喜欢一个总是「我早就知道了」的人。",
      en: "You weaponize knowledge; information asymmetry is your edge. You care about being half a step ahead, seeing more clearly than others. But sometimes you win the judgment and lose the relationship — because nobody likes the person who always 'already knew.'",
    },
    integrationChallenge: {
      zh: "学会把洞察力用在人身上，而不只是用在问题上。你能一眼看透一个局，那你能不能一眼看到一个人的潜力？把战略家的眼睛借给伯乐的心。",
      en: "Learning to apply your insight to people, not just problems. You can see through a situation at a glance — can you also see a person's hidden potential? Lend the Tactician's eyes to the Mentor's heart.",
    },
    matureExpression: {
      zh: "成熟的战略家依然锐利，但他的锐利不再让人不安——因为他学会了把信息优势转化为集体优势。他不是赢了之后说「我早说了」的人，而是赢了之后让每个人都觉得「我们赢了」的人。",
      en: "A mature Tactician is still sharp, but their sharpness no longer unsettles people — because they've learned to convert information advantage into collective advantage. They're not the person who says 'I told you so' after winning, but the one who makes everyone feel 'we won.'",
    },
    coachingNudge: {
      zh: "如果你永远比别人快三步，你永远是一个人走。",
      en: "If you're always three moves ahead, you're always walking alone.",
    },
  },

  "I-transcendence": {
    code: "I-transcendence",
    defaultMode: {
      zh: "你追求真相的纯粹让人敬佩，但有时候也让人无法靠近。你可以在一个问题上坚持三个月，不是因为意志力，是因为好奇心不受控。但世界不会等你找到完美答案才向前走。",
      en: "Your pure pursuit of truth is admirable, but sometimes unapproachable. You can persist on a problem for three months — not from discipline, but because your curiosity won't turn off. But the world doesn't wait for your perfect answer before moving on.",
    },
    integrationChallenge: {
      zh: "学会在 80% 确定的时候行动，而不是等到 100%。不是背叛你对严谨的信仰，而是理解：一个不完美但被使用的真相，比一个完美但锁在论文里的真相更有力量。",
      en: "Learning to act at 80% certainty instead of waiting for 100%. Not betraying your belief in rigor, but understanding: an imperfect truth that gets used has more power than a perfect truth locked in a paper.",
    },
    matureExpression: {
      zh: "成熟的科学家依然严谨，但他学会了把真相翻译成别人能用的语言。他不再只是发现真相的人，还是让真相产生影响的人。",
      en: "A mature Researcher is still rigorous, but has learned to translate truth into language others can use. They're no longer just the person who discovers truth, but the person who makes truth matter.",
    },
    coachingNudge: {
      zh: "如果真相只存在于你的脑子里，它算不算真相？",
      en: "If truth only exists inside your head, is it really truth?",
    },
  },

  "A-enhancement": {
    code: "A-enhancement",
    defaultMode: {
      zh: "你天生就知道怎么吸引目光，舞台就是你的氧气。但当掌声停下来的时候，你是谁？你追求的是被看见——但你有没有想过，被看见之后你想让人记住什么？",
      en: "You instinctively know how to command attention; the stage is your oxygen. But when the applause stops, who are you? You pursue being seen — but have you considered what you want people to remember after they've seen you?",
    },
    integrationChallenge: {
      zh: "学会区分「被看见」和「被记住」。被看见靠的是表演力，被记住靠的是深度。当你的作品不只是夺目，还有重量的时候，你不再需要追着聚光灯跑——聚光灯会来找你。",
      en: "Learning to distinguish 'being seen' from 'being remembered.' Being seen takes performance. Being remembered takes depth. When your work has weight, not just dazzle, you stop chasing the spotlight — it comes to you.",
    },
    matureExpression: {
      zh: "成熟的C位依然闪耀，但他的光不再是聚光灯打上去的——是从作品内部发出来的。他不需要最大的舞台，因为他自己就是舞台。",
      en: "A mature Icon still shines, but the light no longer comes from an external spotlight — it radiates from within the work itself. They don't need the biggest stage, because they are the stage.",
    },
    coachingNudge: {
      zh: "如果没有人在看，你还会创作吗？那个答案里藏着你真正的力量。",
      en: "Would you still create if nobody were watching? Your real power lives in that answer.",
    },
  },

  "A-transcendence": {
    code: "A-transcendence",
    defaultMode: {
      zh: "你的内心世界丰富到有时候不知道该拿它怎么办。你创作是为了把说不出口的东西变成别人能触碰的形状。但你对自己的作品保护得太紧——任何批评都像是在批评你这个人。",
      en: "Your inner world is so rich you sometimes don't know what to do with it all. You create to turn the unsayable into something others can touch. But you guard your work too fiercely — any criticism feels like criticism of you as a person.",
    },
    integrationChallenge: {
      zh: "学会把作品交出去。你的创作在离开你手的那一刻，就不再只属于你了——它属于每一个被它触动的人。误读不是侮辱，是作品活过来的证据。",
      en: "Learning to let go of your work. The moment your creation leaves your hands, it no longer belongs only to you — it belongs to everyone it touches. Misinterpretation isn't an insult; it's proof your work is alive.",
    },
    matureExpression: {
      zh: "成熟的追梦人依然敏感，但他不再因为敏感而脆弱。他学会了把作品放出去、被误读、被重新解释——然后发现那些误读里有他自己都没意识到的层次。他的创作变成了对话，而不是独白。",
      en: "A mature Dreamweaver is still sensitive, but sensitivity no longer means fragility. They've learned to release work, let it be misread, reinterpreted — and discover layers in those misreadings they didn't know existed. Their creation becomes a dialogue, not a monologue.",
    },
    coachingNudge: {
      zh: "你最好的作品不是你觉得最完美的那件——是那件你差点没发出去的。",
      en: "Your best work isn't the one you think is perfect — it's the one you almost didn't share.",
    },
  },

  "S-enhancement": {
    code: "S-enhancement",
    defaultMode: {
      zh: "你一眼就能看到别人的潜力，然后忍不住推他一把。你最骄傲的时刻是你推出去的人站在了台上。但你有没有注意到：你在推别人的时候，自己一直站在原地？",
      en: "You spot potential in others at a glance and can't resist giving them a push. Your proudest moments are when someone you championed steps onto the stage. But have you noticed: while you're pushing everyone else forward, you're standing still?",
    },
    integrationChallenge: {
      zh: "学会把用在别人身上的那双眼睛转向自己。你能看到每个人的天赋——除了你自己的。你的成长不是停止帮人，而是在帮人的同时问一句：我自己的下一步是什么？",
      en: "Learning to turn those talent-spotting eyes on yourself. You can see everyone's gift — except your own. Growth isn't stopping to help others, but asking while you help: what's my own next step?",
    },
    matureExpression: {
      zh: "成熟的伯乐依然是最好的人才教练，但他不再把「别人的成功」当作唯一的成就感来源。他学会了自己也站到台上——不是为了取代他推出去的人，而是为了做一个更好的示范。",
      en: "A mature Mentor is still the best talent coach, but no longer treats others' success as their only source of fulfillment. They've learned to step onto the stage themselves — not to replace those they've championed, but to model what growth looks like.",
    },
    coachingNudge: {
      zh: "你总说看到别人的潜力——你有没有看过镜子？",
      en: "You always say you see others' potential — have you ever looked in the mirror?",
    },
  },

  "S-transcendence": {
    code: "S-transcendence",
    defaultMode: {
      zh: "你是所有人的安全港。别人在你身边肩膀会自己松下来。但你吸收了太多别人的痛苦，有时候分不清哪些情绪是你的，哪些是别人的。你给得出那个「被听见」的礼物，但谁在听你？",
      en: "You're everyone's safe harbor. People's shoulders drop just sitting next to you. But you absorb too much of others' pain, sometimes losing track of which emotions are yours. You give the gift of being heard — but who listens to you?",
    },
    integrationChallenge: {
      zh: "学会说「不」而不觉得自己在背叛使命。界限不是墙，是门——你选择什么时候打开。你不需要接住每一个人才能证明自己的价值。",
      en: "Learning to say 'no' without feeling like you're betraying your calling. A boundary isn't a wall — it's a door you choose when to open. You don't need to catch every falling person to prove your worth.",
    },
    matureExpression: {
      zh: "成熟的疗愈师依然深度共情，但他学会了一件关键的事：在帮助别人之前先给自己充电不是自私，是可持续性。他的温暖不再是燃烧自己的火焰，而是一盏不会熄灭的灯。",
      en: "A mature Healer still empathizes deeply, but has learned one crucial thing: recharging before helping others isn't selfish — it's sustainability. Their warmth is no longer a fire that burns itself out, but a lamp that never goes dark.",
    },
    coachingNudge: {
      zh: "你不需要溺水才能证明你懂游泳。",
      en: "You don't need to drown to prove you know how to swim.",
    },
  },

  "E-enhancement": {
    code: "E-enhancement",
    defaultMode: {
      zh: "你脑子里永远有一个倒计时在跑。在信息只有六成的时候就下注，对你来说不是鲁莽，是效率。但你有没有注意到：你赢了很多次从零到一，却很少守过从一到十？",
      en: "There's always a countdown running in your head. Betting with only 60% of the picture isn't reckless to you — it's efficiency. But have you noticed: you've won many zero-to-one races, but rarely stayed for the one-to-ten?",
    },
    integrationChallenge: {
      zh: "学会在赢了之后留下来。从零到一需要爆发力，从一到十需要耐心。你不需要变成一个运营型的人，但你需要学会在加速之间欣赏匀速的价值。",
      en: "Learning to stay after you've won. Zero-to-one takes explosive energy; one-to-ten takes patience. You don't need to become an operations person, but you need to appreciate the value of cruising between sprints.",
    },
    matureExpression: {
      zh: "成熟的王牌依然是最快的行动者，但他不再把每一个安静的阶段都当作无聊。他学会了在两次冲锋之间休息、反思、巩固——然后在对的时机再次爆发，更准、更猛。",
      en: "A mature Ace is still the fastest mover, but no longer treats every quiet phase as boredom. They've learned to rest, reflect, and consolidate between charges — then explode again at the right moment, more precise and more powerful.",
    },
    coachingNudge: {
      zh: "你开了十扇门，走进去过几扇？",
      en: "You've opened ten doors. How many have you walked through?",
    },
  },

  "E-transcendence": {
    code: "E-transcendence",
    defaultMode: {
      zh: "你想改变的不是排名，是规则本身。你的野心不是「我要赢」，而是「这个世界不对，我要修它」。但有时候你掀桌子的速度太快，桌子底下的人还没来得及站起来。",
      en: "You don't want to change the scoreboard — you want to change the rules. Your ambition isn't 'I want to win' but 'this is broken and I'm going to fix it.' But sometimes you flip the table so fast that the people underneath haven't stood up yet.",
    },
    integrationChallenge: {
      zh: "学会在变革和基建之间找到节奏。掀桌子需要勇气，建新桌子需要耐心。如果你只做前者不做后者，你就不是改革者——你只是破坏者。",
      en: "Learning to find rhythm between revolution and infrastructure. Flipping tables takes courage; building new ones takes patience. If you only do the first without the second, you're not a reformer — you're just a wrecker.",
    },
    matureExpression: {
      zh: "成熟的先驱依然激进，但他的激进是有根基的——他不只掀旧桌子，还带着蓝图来。他学会了让变革的速度匹配人们适应的速度，这样变革才能真正扎根，而不是被下一个浪潮冲走。",
      en: "A mature Pioneer is still radical, but their radicalism has roots — they don't just flip old tables, they arrive with blueprints. They've learned to match the pace of change to people's pace of adaptation, so change actually takes root instead of being swept away by the next wave.",
    },
    coachingNudge: {
      zh: "你掀了桌子之后，有没有帮人搬椅子？",
      en: "After you flipped the table, did you help anyone move the chairs?",
    },
  },

  "C-enhancement": {
    code: "C-enhancement",
    defaultMode: {
      zh: "你把混乱变成秩序，把流程变成护城河。在你手里，一套系统就是竞争壁垒。但你有时候太沉迷于流程的完美，忘了流程是为人服务的——当流程让人不舒服的时候，该改的可能不是人。",
      en: "You turn chaos into order, processes into moats. In your hands, a system becomes a competitive wall. But sometimes you're so absorbed in process perfection that you forget processes serve people — when the process makes people uncomfortable, maybe it's the process that needs changing.",
    },
    integrationChallenge: {
      zh: "学会在效率和人情之间留出空间。最好的系统不只是快和准——它还让人在里面感到被尊重。一个让人恨不得绕道走的高效流程，不是好流程。",
      en: "Learning to leave room between efficiency and humanity. The best systems aren't just fast and precise — they make people feel respected inside them. A hyper-efficient process that people dread using is not a good process.",
    },
    matureExpression: {
      zh: "成熟的总指挥依然掌控全局，但他的系统不再冷冰冰的——里面有弹性、有呼吸空间、有人情味。他设计的流程不只让团队赢，还让团队的人在赢的过程中觉得被看见。",
      en: "A mature Commander still controls the big picture, but their systems are no longer cold — they have flexibility, breathing room, and humanity. Their processes don't just help the team win; they make people feel seen while winning.",
    },
    coachingNudge: {
      zh: "如果你的团队赢了但所有人都精疲力竭，这算赢吗？",
      en: "If your team won but everyone is burned out, is that really winning?",
    },
  },

  "C-transcendence": {
    code: "C-transcendence",
    defaultMode: {
      zh: "你对不公平有生理性的反应。你建规则不是为了赢，是为了保护最弱势的人。但你的原则性有时候让你在需要妥协的场景里寸步难行——你会不会太执着于「对」，而忽略了「有用」？",
      en: "You have a visceral reaction to unfairness. You build rules not to win, but to protect the most vulnerable. But your principled stance sometimes makes you inflexible in situations requiring compromise — are you so attached to 'right' that you miss 'useful'?",
    },
    integrationChallenge: {
      zh: "学会区分「底线」和「偏好」。有些规则一寸都不能让——那是底线。但有些规则可以弯一弯而不折断——那是你以为是底线的偏好。分清这两者，你的公正才能被更多人接受。",
      en: "Learning to distinguish 'principles' from 'preferences.' Some rules can't bend an inch — those are principles. But some can flex without breaking — those are preferences you've mistaken for principles. Knowing the difference makes your fairness more widely accepted.",
    },
    matureExpression: {
      zh: "成熟的仲裁人依然守护公平，但他不再是铁面无私到让人害怕靠近。他学会了在坚守底线的同时展现温度——人们不只是因为他公正才信任他，还因为他理解「公正有时候需要温柔地执行」。",
      en: "A mature Arbiter still guards fairness, but is no longer so iron-faced that people are afraid to approach. They've learned to show warmth while holding the line — people trust them not just for being fair, but for understanding that fairness sometimes needs to be delivered gently.",
    },
    coachingNudge: {
      zh: "有没有一种公正，是带着微笑执行的？",
      en: "Is there a kind of justice that's delivered with a smile?",
    },
  },
};

/**
 * Look up archetype growth path by code.
 */
export function getArchetypeGrowth(code: string): GrowthPath | undefined {
  return ARCHETYPE_GROWTH[code];
}
