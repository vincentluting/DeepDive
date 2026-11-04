import type { NarrativeEvalInput } from "./narrative-eval";

export const NARRATIVE_EVAL_BASELINE_VERSION = "2026-04-03";

export const NARRATIVE_EVAL_BASELINE_CASES: NarrativeEvalInput[] = [
  {
    id: "profile-zh-bridge-builder",
    kind: "profile",
    locale: "zh",
    title: "Profile baseline — 场景化、自洽、带张力的身份叙事",
    source: "golden-case",
    segments: [
      {
        label: "identitySummary",
        text: "在需要同时看见人和逻辑的场合，你很少急着表态。你会先把别人没说清的部分拆开，再把散掉的信息重新编成一条能被执行的线。所以别人以为你冷静，其实你是在替一件事找最诚实的说法。",
      },
      {
        label: "valueNarrative",
        text: "真正让你投入的，不是“做完一件事”，而是做法能不能对得起自己的标准。只要空间足够自主，你愿意花时间把粗糙的判断磨到清楚；可一旦外部节奏只追求快，你就会明显收紧，因为你在意的不只是结果，还有过程是否站得住。",
      },
      {
        label: "sjtTensionNarrative",
        text: "当团队气氛紧张时，你表面上会先保持克制，心里却并不真的想回避冲突。你更像是在等一个更准确的切口：不是为了和人对着干，而是为了把真正的问题翻出来。这种拉扯让你看起来慢半拍，但也让你很少在情绪最高的时候说出之后要收回的话。",
      },
      {
        label: "crossDimensionNarrative",
        text: "把这些线索放在一起，你最突出的不是“理性”或“敏感”本身，而是你会替复杂局面建立次序。你既想保留人的感受，也不愿牺牲判断的锋利，所以你常常承担那个把模糊说清、把分散收束的人。问题是：当环境长期奖励速度而不是深度时，你愿意为自己的标准坚持到什么程度？",
      },
      {
        label: "growthMapInsight",
        text: "你身上最明显的两个张力，是“快推进”与“慢判断”，以及“照顾关系”与“说出真话”。前者让你在关键节点会反复校准，后者让你不会轻易给出讨喜但空心的回应。它们的代价是犹豫感，优势却是你做出的决定更经得起回看。要注意的是，别把谨慎误用成拖延。",
      },
    ],
    expectations: {
      signalGroups: [
        { label: "scene", terms: ["当团队", "场合", "关键节点", "环境"] },
        { label: "values", terms: ["标准", "自主", "过程", "诚实"] },
        { label: "tension", terms: ["拉扯", "张力", "快推进", "慢判断"] },
        { label: "integration", terms: ["建立次序", "收束", "判断", "问题"] },
      ],
      minOverallScore: 78,
      minMetricScores: {
        specificity: 70,
        integration: 75,
        antiBarnum: 82,
        repetition: 80,
      },
    },
  },
  {
    id: "report-en-pattern-translator",
    kind: "report",
    locale: "en",
    title: "Report baseline — fit reasoning + reality + actionability",
    source: "golden-case",
    segments: [
      {
        label: "careerMatch.summary",
        text: "When a problem is still messy, you are strongest in roles that let you investigate first and translate later. You do not just collect information; you turn scattered signals into a point of view another person can actually use.",
      },
      {
        label: "careerMatch.directions[0].whySuitable",
        text: "In product research or strategy work, you would be the person who notices that a team is arguing about solutions before it has agreed on the real problem. That fits you because your curiosity is disciplined: you like going deeper, but only if the insight can change what happens next.",
      },
      {
        label: "careerMatch.directions[0].challenges",
        text: "The risk is not lack of ability but impatience with shallow environments. If a role rewards fast slides, weak evidence, and constant cheerleading, your standards will turn into friction quickly.",
      },
      {
        label: "careerPathway.jobSearchStrategy.positioning",
        text: "Position yourself as someone who can move between analysis and explanation. On a resume, do not list 'research' in the abstract; show moments where your synthesis changed a decision, clarified a market, or sharpened a product bet.",
      },
      {
        label: "integration.coreInsight",
        text: "Your edge is not pure creativity or pure analysis. It is the ability to stay with ambiguity long enough to find the underlying pattern, then express it in language that helps other people act.",
      },
      {
        label: "integration.letterToUser",
        text: "If your current constraints mean you cannot make a dramatic leap yet, that does not invalidate the direction. It simply changes the order of operations: first build visible proof of your thinking, then widen your network in the cities or teams where this kind of synthesis is rewarded. The path forward is less about a perfect title and more about repeatedly putting your pattern-finding judgment in rooms where decisions are being made.",
      },
    ],
    expectations: {
      signalGroups: [
        { label: "fit", terms: ["problem", "fit", "role", "team"] },
        {
          label: "decision",
          terms: ["decision", "pattern", "insight", "translate", "synthesis"],
        },
        {
          label: "constraints",
          terms: ["constraints", "order of operations", "cities", "network"],
        },
        { label: "action", terms: ["resume", "build", "widen", "path forward"] },
      ],
      minOverallScore: 78,
      minMetricScores: {
        specificity: 66,
        integration: 78,
        antiBarnum: 82,
        repetition: 80,
      },
    },
  },
  {
    id: "coaching-en-open-question",
    kind: "coaching",
    locale: "en",
    title: "Coaching baseline — reflective, non-prescriptive, dialogic",
    source: "golden-case",
    segments: [
      {
        label: "assistant[0]",
        text: "When you say the offer looks good on paper but feels heavy in your chest, I do not hear simple indecision. I hear a conflict between security and the part of you that wants work to feel intellectually alive. Where in the role description do you feel that heaviness most clearly?",
      },
      {
        label: "assistant[1]",
        text: "That detail matters. In your examples, the energy drops whenever your job becomes maintenance instead of interpretation. Before we decide yes or no, what would you need to see in the first 90 days of this role to believe you could still think, shape, and influence rather than just keep the machine running?",
      },
    ],
    expectations: {
      signalGroups: [
        { label: "user-context", terms: ["you say", "your examples", "role description"] },
        { label: "tension", terms: ["conflict", "security", "maintenance", "interpretation"] },
        { label: "question", terms: ["where", "what would you need", "before we decide"] },
      ],
      requireQuestion: true,
      minOverallScore: 78,
      minMetricScores: {
        specificity: 65,
        integration: 68,
        antiBarnum: 82,
        repetition: 80,
        dialogic: 82,
      },
    },
  },
];
