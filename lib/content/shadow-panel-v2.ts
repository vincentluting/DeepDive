// ============================================================
// Shadow Panel V2 — Reframed view-model for the 3-section panel
//
// Replaces the 5+ section "诗化诊断" of v1 with:
//   ① 这是什么 + 为什么是你 (whyYouUnderestimate + capabilityName)
//   ② 你怎么知道这是你 (observableSignals: template + fragments)
//   ③ 怎么用,怎么避坑 (takeAways)
//
// Design rules (from Codex cross-review 2026-05-09):
//   - All fields REQUIRED (compile-time error if missing).
//     Cannot fall back to "shadow content slop". Forces good content.
//   - Observable signals only — no "you intuitively know".
//   - en/zh primary; other 9 locales fall back to en via pickLocaleText.
//   - Reuses advantageousContexts keys from the frozen shadow-content.ts
//     (no copy of frozen content; just a contextKey reference).
// ============================================================

import type { BigFiveDimension } from "../types";

/**
 * Multilingual text. en is required (universal fallback target);
 * zh strongly recommended; other 9 locales optional (LLM-extended).
 */
export interface PanelLocaleText {
  en: string;
  zh?: string;
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

/**
 * One observable-signal scenario fragment.
 * Rendered through `template` with `{{trigger}}` / `{{noticed}}` / `{{hesitated}}`
 * placeholders, e.g. "{{trigger}}, you noticed {{noticed}}, but you {{hesitated}}".
 */
export interface SignalFragment {
  trigger: PanelLocaleText;
  noticed: PanelLocaleText;
  hesitated: PanelLocaleText;
}

/**
 * Section ③ — 4 concrete take-aways the user can apply tomorrow.
 */
export interface TakeAways {
  resumeFraming: PanelLocaleText;
  interviewStory: PanelLocaleText;
  seekRoles: PanelLocaleText;
  avoidRoles: PanelLocaleText;
  selfCheckQuestion: PanelLocaleText;
}

/**
 * Career-context explanation (folded disclosure).
 * `contextKey` references the `advantageousContexts` array in
 * `shadow-content.ts` (frozen) — keeps frozen module as source of truth
 * for the canonical list, while v2 adds the per-context human explanation.
 */
export interface CareerContextExplanation {
  contextKey: string;
  explanation: PanelLocaleText;
}

/**
 * Full panel content for one Big Five domain.
 * Every field is required by design. Missing content = compile error,
 * not silent fallback.
 */
export interface ShadowPanelV2Content {
  /** Section ① body — why the user underestimates this capability */
  whyYouUnderestimate: PanelLocaleText;

  /** Section ① closer — the poetic name we give this capability */
  capabilityName: PanelLocaleText;

  /** Section ② template + at least 3 fragments */
  observableSignals: {
    template: PanelLocaleText;
    fragments: [
      SignalFragment,
      SignalFragment,
      SignalFragment,
      ...SignalFragment[],
    ];
  };

  /** Section ② closer — "you notice this earlier than most" line */
  signalSummary: PanelLocaleText;

  /** Section ③ — 4 concrete take-aways */
  takeAways: TakeAways;

  /** Folded disclosure — career contexts + per-context explanations */
  careerExplanations: CareerContextExplanation[];
}

// ────────────────────────────────────────────────────────────
// Content
// ────────────────────────────────────────────────────────────

export const SHADOW_PANEL_V2: Record<BigFiveDimension, ShadowPanelV2Content> = {
  // ═══════════════════════════════════════════════════════════
  // NEUROTICISM — 感知的深度 (Depth of Perception)
  // High score (>45) = the "shadow" gift: heightened perceptual sensitivity
  // ═══════════════════════════════════════════════════════════
  neuroticism: {
    whyYouUnderestimate: {
      en: "But you've probably never treated this as a capability — because it usually shows up in your self-talk as 'I'm too sensitive' or 'maybe I'm overthinking.' That's why you underestimate it: you have it, but you don't count it as an asset.",
      zh: "但你可能从来没把这当成能力——因为它常常以「我太敏感了」、「是不是我想多了」的形式,出现在你的自我怀疑里。这就是你低估它的原因:你拥有它,却不把它当资产。",
    },
    capabilityName: {
      en: "Depth of Perception",
      zh: "感知的深度",
    },
    observableSignals: {
      template: {
        en: "{{trigger}} — you noticed {{noticed}}, even though {{hesitated}}.",
        zh: "{{trigger}}——你注意到{{noticed}},虽然{{hesitated}}。",
      },
      fragments: [
        {
          trigger: {
            en: "Replies got noticeably shorter; scheduling became 'let me get back to you'",
            zh: "对方回复明显变短、约时间变成「再看看」",
          },
          noticed: {
            en: "the rhythm had shifted",
            zh: "节奏变了",
          },
          hesitated: {
            en: "no one said anything explicit",
            zh: "没人明说",
          },
        },
        {
          trigger: {
            en: "Someone in a team meeting suddenly stopped asking questions",
            zh: "团队会议上有人突然不再提问",
          },
          noticed: {
            en: "they had pulled back",
            zh: "他们撤了",
          },
          hesitated: {
            en: "you couldn't quite name why",
            zh: "你说不清为什么",
          },
        },
        {
          trigger: {
            en: "A client's wording shifted from 'looks great' to 'it's fine'",
            zh: "客户措辞从「挺好」变成「还行」",
          },
          noticed: {
            en: "the subtle drop in enthusiasm",
            zh: "热度的微妙下降",
          },
          hesitated: {
            en: "you had no hard evidence to bring it up",
            zh: "因为没硬证据,你犹豫要不要提",
          },
        },
      ],
    },
    signalSummary: {
      en: "These are observable signals — and you spot them 30 seconds to 3 days earlier than most people. Your 'intuition' is actually trained pattern recognition.",
      zh: "这些都是观察到的客观信号——你比一般人早 30 秒到 3 天注意到它们。你的「直觉」其实是被训练过的模式识别。",
    },
    takeAways: {
      resumeFraming: {
        en: "Don't write 'sensitive' or 'empathetic' (vague + sounds like a weakness). Write: 'Skilled at surfacing unvoiced needs in client/team contexts' + one concrete example: 'In project X I noticed signal Y, opened conversation Z, and the outcome was…'",
        zh: "不要写「敏感」或「善解人意」(模糊 + 像缺点)。写「擅长在客户/团队中察觉未表达的需求」+ 一个具体例子: 「在 X 项目里,我注意到 Y 信号,先发起 Z 对话,结果是 …」。",
      },
      interviewStory: {
        en: "When asked about your strengths, don't say 'I'm pretty sensitive.' Tell a story: 'I noticed signal X → I did Y → the result was Z.'",
        zh: "被问优势时,不要说「我比较敏感」。讲故事: 「我察觉到 X 信号 → 我做了 Y → 结果是 Z」。",
      },
      seekRoles: {
        en: "Prefer: 1-on-1 or small-group depth + long-cycle trust-building + roles where high EQ is core (counseling, mediation, UX research, account stewardship).",
        zh: "优先看: 1对1 或小组深度 + 长周期建立信任 + 高情商需求的角色 (心理咨询、调解、UX 研究、客户主理)。",
      },
      avoidRoles: {
        en: "Avoid: continuous shallow social load (frontline sales, high-frequency stranger contact, fast-cycle deal-closing roles) — these will burn your perceptive bandwidth.",
        zh: "避开: 持续短平快社交 (销售一线、高频陌生人接触、快速冲单类岗位)——它们会烧掉你的感知带宽。",
      },
      selfCheckQuestion: {
        en: "Look back over the past 3 months: how many times did you help a person or a team because you noticed an emotional signal they hadn't? Each one is this capability at work.",
        zh: "回想过去 3 个月: 有几次你因为察觉到了别人没察觉的信号,而帮助了一个人或一个团队? 每一次,都是这个能力在工作。",
      },
    },
    careerExplanations: [
      {
        contextKey: "Counseling & psychotherapy",
        explanation: {
          en: "You can hear the sentence the client didn't say.",
          zh: "你能听出来访者没说出的那句话。",
        },
      },
      {
        contextKey: "Conflict mediation",
        explanation: {
          en: "You see the escalation tipping point before the parties themselves do.",
          zh: "你比当事人更早看到事态升级的临界点。",
        },
      },
      {
        contextKey: "UX research & usability testing",
        explanation: {
          en: "You can hear the real feeling behind 'I like it.'",
          zh: "你能听出「我喜欢这个」背后的真实情绪。",
        },
      },
      {
        contextKey: "Social work & advocacy",
        explanation: {
          en: "You see the dignity of the people you serve, not just their problems.",
          zh: "你能看见受助者的尊严,而不只是他们的问题。",
        },
      },
      {
        contextKey: "Qualitative research",
        explanation: {
          en: "You catch the contradiction between what someone says and how they say it.",
          zh: "你能捕捉到「他怎么说」和「他说了什么」之间的矛盾。",
        },
      },
      {
        contextKey: "Customer experience design",
        explanation: {
          en: "You feel the friction in a journey before metrics surface it.",
          zh: "在数据显示之前,你已经感受到流程里的摩擦点。",
        },
      },
      {
        contextKey: "Team culture & organizational development",
        explanation: {
          en: "You sense a culture crack before it grows into a fault line.",
          zh: "你能在文化裂痕扩大成断层之前,先觉察。",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // EXTRAVERSION — 内敛的力量 (The Power of Reserve)
  // Low score (<50) = the "shadow" gift: depth and presence over performance
  // ═══════════════════════════════════════════════════════════
  extraversion: {
    whyYouUnderestimate: {
      en: "But you've probably never counted this as a strength — because in cultures that reward visible energy, you're trained to read your own reserve as 'I should be more outgoing' or 'I'm not networking enough.' That's why you underestimate it: you have depth, but you treat it like a deficit.",
      zh: "但你可能从来没把这当成优势——因为在奖励可见能量的文化里,你被训练成把自己的内敛读作「我应该更外向」、「我社交不够」。这就是你低估它的原因: 你拥有深度,却把它当作不足。",
    },
    capabilityName: {
      en: "The Power of Reserve",
      zh: "内敛的力量",
    },
    observableSignals: {
      template: {
        en: "{{trigger}} — and {{noticed}}, even though {{hesitated}}.",
        zh: "{{trigger}}——而且{{noticed}},虽然{{hesitated}}。",
      },
      fragments: [
        {
          trigger: {
            en: "After a noisy group meeting wrapped up, you stayed back to talk to one person",
            zh: "嘈杂的小组会散场后,你留下来和一个人单独说话",
          },
          noticed: {
            en: "that one conversation was where the actual decision got made",
            zh: "真正的决定是在那次对话里做出的",
          },
          hesitated: {
            en: "the meeting itself looked like the 'main event'",
            zh: "会议本身看起来才是「正场」",
          },
        },
        {
          trigger: {
            en: "You spent 90 minutes on a single email/document while colleagues fired off three meetings",
            zh: "同事们连开三个会的时间里,你花 90 分钟在一封邮件/一份文档上",
          },
          noticed: {
            en: "your output landed and held up to scrutiny",
            zh: "你的成品落地了、经得起推敲",
          },
          hesitated: {
            en: "the room rewarded the people who 'showed up' more often",
            zh: "房间奖励的是那些更频繁「露脸」的人",
          },
        },
        {
          trigger: {
            en: "In a meeting full of opinions, you stayed quiet and watched",
            zh: "在一片观点纷飞的会议里,你保持安静、在观察",
          },
          noticed: {
            en: "the cleanest summary at the end came from you",
            zh: "最后最干净的总结是你给的",
          },
          hesitated: {
            en: "you spoke last and didn't compete for airtime",
            zh: "你最后才发言、没去抢话",
          },
        },
      ],
    },
    signalSummary: {
      en: "These are observable patterns — your reserve isn't passivity, it's bandwidth conservation. You arrive to the moments that matter with full presence, while others arrive depleted from performing.",
      zh: "这些是可观察到的模式——你的内敛不是被动,是带宽的保留。在重要的时刻,你以全副临在出现,而别人是表演到耗尽才到。",
    },
    takeAways: {
      resumeFraming: {
        en: "Don't write 'introvert' or 'team player' (defensive). Write: 'Brings depth and clarity to roles requiring sustained focus and one-on-one trust' + one example: 'In role X, I drove outcome Y by building [deep relationship / thorough analysis / definitive document].'",
        zh: "不要写「内向」或「团队配合」(防御性)。写「在需要持续专注和一对一信任的角色中,带来深度和清晰度」+ 一个例子: 「在 X 角色,我通过建立 [深度关系 / 彻底分析 / 决定性的文档] 推进了 Y 结果」。",
      },
      interviewStory: {
        en: "When asked about strengths, don't say 'I prefer working alone.' Tell a story: 'In a noisy moment everyone wanted X — I went deeper, found Y, and that's what we ended up shipping.'",
        zh: "被问优势时,不要说「我更喜欢一个人工作」。讲故事: 「在所有人都想要 X 的吵闹时刻,我走得更深、发现了 Y,我们最后交付的就是 Y」。",
      },
      seekRoles: {
        en: "Prefer: deep individual contributor work, advisory/consulting, research, writing, technical expert tracks, 1-on-1 coaching — anywhere depth beats throughput.",
        zh: "优先看: 深度独立贡献者岗位、顾问/咨询、研究、写作、技术专家轨道、1对1 教练——一切深度优于吞吐量的领域。",
      },
      avoidRoles: {
        en: "Avoid: roles built around constant visible socializing (BD/sales lead, event host, high-frequency networking) — they will read your natural mode as 'low effort' even when your actual output is higher.",
        zh: "避开: 围绕持续可见社交的岗位 (BD / 销售牵头、活动主持、高频 networking)——它们会把你的自然状态读作「不够卖力」,哪怕你的实际产出更高。",
      },
      selfCheckQuestion: {
        en: "When was the last time you delivered a key insight or document because you protected your quiet time? That hour you didn't socialize was where the value came from.",
        zh: "你上次靠保护安静时间交付了关键洞察或文档,是什么时候? 你没去社交的那一小时,正是价值来源。",
      },
    },
    careerExplanations: [
      {
        contextKey: "Research & analysis",
        explanation: {
          en: "Your sustained focus is exactly what shallow attention can't manufacture.",
          zh: "你的持续专注,正是浅注意力无法伪造的东西。",
        },
      },
      {
        contextKey: "Writing & content strategy",
        explanation: {
          en: "Long-form clarity comes from someone willing to sit with the question.",
          zh: "长文的清晰度,来自愿意和问题久坐的人。",
        },
      },
      {
        contextKey: "UX research",
        explanation: {
          en: "You hear what users mean, not what they perform in front of researchers.",
          zh: "你听到用户真正想表达的,而不是他们在研究员面前表演的。",
        },
      },
      {
        contextKey: "Individual counseling & coaching",
        explanation: {
          en: "One person's full attention is a rare gift — you can give it.",
          zh: "一个人完全的注意力是稀缺的礼物——你能给出它。",
        },
      },
      {
        contextKey: "Technical depth roles",
        explanation: {
          en: "Real expertise rewards staying with the problem; you stay.",
          zh: "真正的专业奖励停留在问题里——你能停留。",
        },
      },
      {
        contextKey: "Deep consulting & advisory",
        explanation: {
          en: "Clients pay for your judgment, not your charisma.",
          zh: "客户买的是你的判断,不是你的表演力。",
        },
      },
      {
        contextKey: "Documentation & knowledge work",
        explanation: {
          en: "Things written by quiet people are the things teams actually use later.",
          zh: "被安静的人写下来的东西,是团队后来真正会用的东西。",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // AGREEABLENESS — 辨别力的锋芒 (The Edge of Discernment)
  // Low score (<50) = the "shadow" gift: willingness to push back
  // ═══════════════════════════════════════════════════════════
  agreeableness: {
    whyYouUnderestimate: {
      en: "But you've probably been told this is a problem more than once — that you're 'too direct,' 'not a team player,' or 'should soften it.' So you've trained yourself to count this trait as a flaw. That's why you underestimate it: it's a competency in disguise.",
      zh: "但你可能不止一次被人说这是个问题——「太直接」、「不够配合」、「该委婉一点」。所以你训练自己把这个特质当成缺点。这就是你低估它的原因: 它是被伪装成缺点的能力。",
    },
    capabilityName: {
      en: "The Edge of Discernment",
      zh: "辨别力的锋芒",
    },
    observableSignals: {
      template: {
        en: "{{trigger}} — you said {{noticed}}, even though {{hesitated}}.",
        zh: "{{trigger}}——你说了{{noticed}},虽然{{hesitated}}。",
      },
      fragments: [
        {
          trigger: {
            en: "In a meeting where everyone was nodding to a half-baked plan",
            zh: "在一个所有人都在点头同意半成品方案的会议上",
          },
          noticed: {
            en: "the question that exposed the gap",
            zh: "那个揭露漏洞的问题",
          },
          hesitated: {
            en: "you knew it would slow the room down",
            zh: "你知道这会让现场卡一下",
          },
        },
        {
          trigger: {
            en: "A peer asked for feedback on work that wasn't good enough",
            zh: "同事就一份还不够好的工作征求你的反馈",
          },
          noticed: {
            en: "the actual issue, not the polite version",
            zh: "真正的问题,而不是客气的版本",
          },
          hesitated: {
            en: "the easier path was to say 'looks great'",
            zh: "更容易的路是说「挺好」",
          },
        },
        {
          trigger: {
            en: "Negotiation room got quiet after the other side made a 'final' offer",
            zh: "对方给出「最终」报价后,谈判桌上安静下来",
          },
          noticed: {
            en: "the counter that didn't apologize for itself",
            zh: "那个不为自己道歉的反报价",
          },
          hesitated: {
            en: "everyone wanted to wrap up",
            zh: "所有人都想快点结束",
          },
        },
      ],
    },
    signalSummary: {
      en: "These are observable behaviors — you don't distort the truth to be liked. In rooms where consensus drifts away from reality, you're the friction that brings it back. That's not abrasion. That's stewardship.",
      zh: "这些是可观察到的行为——你不会为了被喜欢而扭曲真相。当共识开始偏离现实时,你是把它拉回来的那股摩擦力。这不是磨人,是守护。",
    },
    takeAways: {
      resumeFraming: {
        en: "Don't write 'direct' or 'no-nonsense' (sounds aggressive). Write: 'Brings honest assessment and constructive challenge to high-stakes decisions' + an example: 'In project X, my pushback on assumption Y prevented outcome Z.'",
        zh: "不要写「直接」或「不绕弯子」(听起来有攻击性)。写「在高 stakes 决策中,带来诚实评估和建设性挑战」+ 一个例子: 「在 X 项目,我对 Y 假设的反对,避免了 Z 后果」。",
      },
      interviewStory: {
        en: "When asked about strengths, don't say 'I'm direct.' Tell a story: 'I disagreed with the prevailing view on X — I made the case Y, and we ended up making decision Z, which was the right one.'",
        zh: "被问优势时,不要说「我很直接」。讲故事: 「在 X 上我不同意主流观点——我提出了 Y 的论据,我们最后做了 Z 决定,事后证明是对的」。",
      },
      seekRoles: {
        en: "Prefer: roles where honest assessment is paid for — investor / VC, legal, compliance, audit, M&A, security review, investigative work, product strategy, deal-making.",
        zh: "优先看: 诚实评估被买单的岗位——投资人/VC、法律、合规、审计、并购、安全审查、调查类工作、产品战略、谈判。",
      },
      avoidRoles: {
        en: "Avoid: roles where 'culture fit' is code for 'don't disagree' — flat-hierarchy companies whose culture penalizes pushback, pure relationship-account roles, harmony-first organizations.",
        zh: "避开: 把「文化契合」等同于「别反对」的岗位——惩罚 pushback 的扁平公司、纯关系型客户岗、把和谐当第一原则的组织。",
      },
      selfCheckQuestion: {
        en: "When was the last time your willingness to disagree saved a project, a budget, or a relationship from a worse outcome? That moment is the resume bullet you've been hiding.",
        zh: "你上次因为愿意反对而拯救了一个项目、一笔预算、或一段关系——是什么时候? 那一刻,就是你一直藏着的那条简历亮点。",
      },
    },
    careerExplanations: [
      {
        contextKey: "Negotiation & deal-making",
        explanation: {
          en: "Every dollar you don't apologize for is a dollar earned.",
          zh: "每一元你不为它道歉的钱,都是赚到的钱。",
        },
      },
      {
        contextKey: "Legal & compliance",
        explanation: {
          en: "The job is to say 'no' to the right things, calmly, with reasons.",
          zh: "这份工作的本质,就是冷静、有理有据地对该说不的事说不。",
        },
      },
      {
        contextKey: "Investigative journalism",
        explanation: {
          en: "Sources don't trust you because you're nice; they trust you because you're not lying to them.",
          zh: "线人信任你不是因为你客气,而是因为你没在骗他们。",
        },
      },
      {
        contextKey: "Product strategy & prioritization",
        explanation: {
          en: "Strategy is mostly the courage to cut, not the cleverness to add.",
          zh: "战略大多是砍东西的勇气,而不是加东西的聪明。",
        },
      },
      {
        contextKey: "Venture evaluation & due diligence",
        explanation: {
          en: "You see the cracks the founder is too in love to admit.",
          zh: "你看见的裂痕,是创始人太爱自己项目而不愿承认的。",
        },
      },
      {
        contextKey: "Competitive intelligence",
        explanation: {
          en: "You read what the press release isn't saying.",
          zh: "你读的是新闻稿没说出的那部分。",
        },
      },
      {
        contextKey: "Adversarial review (security, audit)",
        explanation: {
          en: "The system is safer because you assumed it could fail.",
          zh: "因为你假设它会出问题,系统才更安全。",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // CONSCIENTIOUSNESS — 适应性的流动 (Adaptive Fluency)
  // Low score (<50) = the "shadow" gift: comfort with ambiguity
  // ═══════════════════════════════════════════════════════════
  conscientiousness: {
    whyYouUnderestimate: {
      en: "But you've probably been told you're 'disorganized,' 'unstructured,' or 'need to manage your time better.' So you've started to believe your way of working is a flaw. That's why you underestimate it: in a stable world, structured beats fluid. In an unstable world, fluid wins.",
      zh: "但你可能被人说过「不够有序」、「没结构」、「该好好管理时间」。于是你开始相信自己的工作方式是个缺点。这就是你低估它的原因: 在稳定的世界里,结构胜过流动。在不稳定的世界里,流动赢。",
    },
    capabilityName: {
      en: "Adaptive Fluency",
      zh: "适应性的流动",
    },
    observableSignals: {
      template: {
        en: "{{trigger}} — and {{noticed}}, even though {{hesitated}}.",
        zh: "{{trigger}}——而且{{noticed}},虽然{{hesitated}}。",
      },
      fragments: [
        {
          trigger: {
            en: "The plan got blown up at 4pm and the client wanted a new direction by morning",
            zh: "下午 4 点计划被推翻、客户要求第二天早上拿出新方向",
          },
          noticed: {
            en: "you recalibrated and started moving while others were still in shock",
            zh: "在别人还在震惊时,你已经重新校准并开始行动",
          },
          hesitated: {
            en: "the 'plan' you'd just spent two days on was now wasted",
            zh: "你刚花两天做出的「计划」白做了",
          },
        },
        {
          trigger: {
            en: "A new tool / new framework / new constraint dropped on the team mid-project",
            zh: "项目进行中,新工具/新框架/新约束突然出现",
          },
          noticed: {
            en: "you were experimenting with it within hours, while others were still complaining",
            zh: "几个小时内你已经在尝试,别人还在抱怨",
          },
          hesitated: {
            en: "no one had told you to learn it yet",
            zh: "还没有人要求你去学",
          },
        },
        {
          trigger: {
            en: "The schedule had a gaping hole and three competing priorities",
            zh: "日程上有一个大洞,加三个互相竞争的优先级",
          },
          noticed: {
            en: "you found a path forward by combining two of them in a way no one had proposed",
            zh: "你用一种没人提过的方式,把其中两个组合在一起,找到了前进的路",
          },
          hesitated: {
            en: "the 'right' thing to do was probably to ask for clarification",
            zh: "「正确」的做法大概是先去问清楚",
          },
        },
      ],
    },
    signalSummary: {
      en: "These are observable behaviors — you don't freeze when the plan dissolves, you reroute. In environments where the only constant is change, this isn't a deficit of discipline. It's a different kind of operating system.",
      zh: "这些是可观察到的行为——计划崩盘时你不会僵住,你会改道。在「唯一不变的就是变化」的环境里,这不是自律不足,是一种不同的操作系统。",
    },
    takeAways: {
      resumeFraming: {
        en: "Don't write 'flexible' (vague) or 'creative problem solver' (overused). Write: 'Operates effectively under shifting constraints and ambiguous direction' + an example: 'When constraint X changed mid-project, I pivoted to Y and delivered Z.'",
        zh: "不要写「灵活」(模糊) 或「有创造力的问题解决者」(滥用)。写「能在不断变化的约束和模糊方向下高效工作」+ 一个例子: 「项目中 X 约束变化时,我转向 Y,交付了 Z」。",
      },
      interviewStory: {
        en: "When asked about strengths, don't say 'I'm adaptable.' Tell a story: 'In project X the plan changed three times — here's how I kept it moving and what we shipped.'",
        zh: "被问优势时,不要说「我适应能力强」。讲故事: 「X 项目的计划改了三次——我是怎么让它继续前进的,我们最后交付了什么」。",
      },
      seekRoles: {
        en: "Prefer: early-stage startups, crisis response, R&D, creative direction, growth/experimentation, freelance/portfolio work — environments where rigid procedures are a liability.",
        zh: "优先看: 早期创业、危机响应、研发、创意方向、增长/实验、自由职业/作品集型工作——僵化流程是负担的环境。",
      },
      avoidRoles: {
        en: "Avoid: heavy-process bureaucracies, audit/QA roles whose job is to enforce procedure, stable-volume operational roles where the win condition is repeatability — they will pathologize your natural mode.",
        zh: "避开: 重流程的官僚组织、本职就是执行流程的审计/QA 岗、稳定吞吐量的运营岗——它们会把你的自然状态病理化。",
      },
      selfCheckQuestion: {
        en: "When was the last time you kept a project moving because you let go of the original plan? That pivot — not the original plan — was the value you brought.",
        zh: "你上次靠放下原计划而让项目继续推进,是什么时候? 那个转向——不是原计划——才是你带来的价值。",
      },
    },
    careerExplanations: [
      {
        contextKey: "Entrepreneurship & startups",
        explanation: {
          en: "The plan changes weekly; people who can change with it ship.",
          zh: "计划每周都在变;能跟着变的人,才能交付。",
        },
      },
      {
        contextKey: "Creative direction",
        explanation: {
          en: "Constraints are the medium, not the cage.",
          zh: "约束是创作的材料,不是笼子。",
        },
      },
      {
        contextKey: "Crisis response & turnaround",
        explanation: {
          en: "The playbook ran out three hours ago; you're still going.",
          zh: "剧本三小时前就没了;你还在往前走。",
        },
      },
      {
        contextKey: "Rapid prototyping & iteration",
        explanation: {
          en: "Speed of learning beats perfection of plan.",
          zh: "学习的速度比计划的完美更重要。",
        },
      },
      {
        contextKey: "Freelance & portfolio work",
        explanation: {
          en: "Each project is a different shape; you carry the shape-shifting muscle.",
          zh: "每个项目都是不同的形状;你身上长着随形而变的肌肉。",
        },
      },
      {
        contextKey: "Innovation & R&D",
        explanation: {
          en: "Discovery requires walking off the map.",
          zh: "发现新东西,需要走出地图。",
        },
      },
      {
        contextKey: "Growth & experimentation roles",
        explanation: {
          en: "Half of what you try won't work — you're already comfortable with that.",
          zh: "你试的事情有一半不会成——你早就习惯这件事了。",
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // OPENNESS — 扎根的现实主义 (Grounded Realism)
  // Low score (<50) = the "shadow" gift: depth-of-focus over novelty
  // ═══════════════════════════════════════════════════════════
  openness: {
    whyYouUnderestimate: {
      en: "But you've probably been told you're 'not innovative enough' or 'should think outside the box more.' In cultures obsessed with novelty, your preference for the proven gets pathologized. That's why you underestimate it: depth and reliability are exactly what novelty-chasing teams burn out missing.",
      zh: "但你可能被人说过「不够创新」、「该跳出框框」。在迷恋新鲜的文化里,你对已验证方法的偏好被病理化。这就是你低估它的原因: 深度和可靠性,恰恰是追新团队烧坏自己时最缺的东西。",
    },
    capabilityName: {
      en: "Grounded Realism",
      zh: "扎根的现实主义",
    },
    observableSignals: {
      template: {
        en: "{{trigger}} — you {{noticed}}, even though {{hesitated}}.",
        zh: "{{trigger}}——你{{noticed}},虽然{{hesitated}}。",
      },
      fragments: [
        {
          trigger: {
            en: "The team got excited about a new framework / methodology / tool",
            zh: "团队对一个新框架/方法论/工具兴奋起来",
          },
          noticed: {
            en: "asked the boring question: does this actually solve our problem?",
            zh: "问了那个无聊的问题: 这真的能解决我们的问题吗?",
          },
          hesitated: {
            en: "everyone else was already in the honeymoon phase",
            zh: "其他人都还在蜜月期",
          },
        },
        {
          trigger: {
            en: "A 'transformation' initiative was being pushed top-down",
            zh: "一个「转型」计划正在自上而下推",
          },
          noticed: {
            en: "the parts that were already working and shouldn't be torn out",
            zh: "那些已经在工作、不该被拆掉的部分",
          },
          hesitated: {
            en: "saying so made you sound like a blocker",
            zh: "说出来会让你听起来像在拖后腿",
          },
        },
        {
          trigger: {
            en: "Three new initiatives launched at once",
            zh: "三个新项目同时启动",
          },
          noticed: {
            en: "stayed focused on shipping the one in front of you",
            zh: "你保持专注、把眼前的那一个交付掉",
          },
          hesitated: {
            en: "the rest of the room kept reshuffling priorities",
            zh: "其他人一直在重新洗牌优先级",
          },
        },
      ],
    },
    signalSummary: {
      en: "These are observable behaviors — you protect what works while others chase what's new. In a world drowning in novelty for novelty's sake, your depth of focus is the thing that actually finishes.",
      zh: "这些是可观察到的行为——当别人追逐新鲜时,你守护着已经在工作的东西。在为新而新的世界里,你的深度专注,才是真正能完工的那股力量。",
    },
    takeAways: {
      resumeFraming: {
        en: "Don't write 'detail-oriented' (cliché) or 'pragmatic' (sounds boring). Write: 'Brings depth of focus and discriminating judgment in environments under pressure to chase novelty' + example: 'In project X, my insistence on Y prevented over-engineering Z.'",
        zh: "不要写「注重细节」(套话) 或「务实」(听起来无聊)。写「在迫切追求新东西的环境里,带来深度专注和有辨别力的判断」+ 例子: 「X 项目里,我对 Y 的坚持,避免了 Z 的过度设计」。",
      },
      interviewStory: {
        en: "When asked about strengths, don't say 'I'm thorough.' Tell a story: 'Everyone wanted to throw out X — I argued for keeping Y, and that's the part of the system that still ships value today.'",
        zh: "被问优势时,不要说「我做事很彻底」。讲故事: 「所有人都想砍掉 X——我坚持保留 Y,那部分至今还在系统里产出价值」。",
      },
      seekRoles: {
        en: "Prefer: operations, quality assurance, implementation/delivery, audit, deep technical specialty, standards/compliance, domain expert tracks — places that pay for getting it right, not for getting it new.",
        zh: "优先看: 运营、质量保证、落地/交付、审计、深度技术专长、标准/合规、领域专家轨道——为「做对」买单的地方,而不是「做新」。",
      },
      avoidRoles: {
        en: "Avoid: pure 'innovation' / R&D-blue-sky / brand creative roles where the success metric is novelty itself — they'll mistake your discrimination for resistance to change.",
        zh: "避开: 纯「创新」/ R&D-蓝天 / 品牌创意类岗位,这些以新颖本身为成功指标——它们会把你的鉴别力误解为抵抗变革。",
      },
      selfCheckQuestion: {
        en: "When was the last time something kept working because you refused to change it for novelty's sake? That refusal is a strategic asset, not stubbornness.",
        zh: "你上次因为拒绝为了新而新地改一件事,而让它继续运转——是什么时候? 那次拒绝是战略资产,不是固执。",
      },
    },
    careerExplanations: [
      {
        contextKey: "Operations & process design",
        explanation: {
          en: "Things keep running because you didn't 'optimize' them into chaos.",
          zh: "事情还在运转,是因为你没有把它们「优化」成混乱。",
        },
      },
      {
        contextKey: "Quality assurance & testing",
        explanation: {
          en: "You catch what excitement misses.",
          zh: "你抓到的,正是兴奋错过的。",
        },
      },
      {
        contextKey: "Implementation & delivery",
        explanation: {
          en: "Plans become real things only when someone refuses to skip the boring steps.",
          zh: "计划变成真东西,只在有人拒绝跳过无聊步骤时。",
        },
      },
      {
        contextKey: "Standards & compliance",
        explanation: {
          en: "The trust the system runs on is built one rule at a time.",
          zh: "系统赖以运行的信任,是一条规则一条规则建立的。",
        },
      },
      {
        contextKey: "Audit & internal control",
        explanation: {
          en: "What gets checked gets respected.",
          zh: "被检查的东西,才会被尊重。",
        },
      },
      {
        contextKey: "Technical execution",
        explanation: {
          en: "The system ships because someone stopped re-architecting it.",
          zh: "系统能上线,是因为有人停下了重新架构。",
        },
      },
      {
        contextKey: "Domain expertise & deep specialization",
        explanation: {
          en: "Mastery requires staying with one thing long enough to see its bottom.",
          zh: "精通需要在一件事里停留得够久,才能看到它的底。",
        },
      },
    ],
  },
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Render observable signals: take fragments and the template,
 * substitute trigger/noticed/hesitated, return one rendered line per fragment.
 */
export function renderObservableSignals(
  content: ShadowPanelV2Content,
  pickText: (lt: PanelLocaleText) => string,
): string[] {
  const tmpl = pickText(content.observableSignals.template);
  return content.observableSignals.fragments.map((frag) => {
    const trigger = pickText(frag.trigger);
    const noticed = pickText(frag.noticed);
    const hesitated = pickText(frag.hesitated);
    return tmpl
      .replaceAll("{{trigger}}", trigger)
      .replaceAll("{{noticed}}", noticed)
      .replaceAll("{{hesitated}}", hesitated)
      .replaceAll("{trigger}", trigger)
      .replaceAll("{noticed}", noticed)
      .replaceAll("{hesitated}", hesitated);
  });
}

/** Get panel content for a domain (typed). */
export function getShadowPanelV2(
  domain: BigFiveDimension,
): ShadowPanelV2Content {
  return SHADOW_PANEL_V2[domain];
}
